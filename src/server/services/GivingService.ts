import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { GivingRepository } from '../repositories/GivingRepository.js';
import { AccountingService } from './AccountingService.js';
import { AccountingRepository } from '../repositories/AccountingRepository.js';
import { getMergedDocumentSettings, getMergedFinancialSettings, getMergedOrganizationSettings, getMergedPaymentGatewaySettings } from '../utils/mergeTenantSettings.js';
import { generatePdfFromHtml, resolvePdfAssetSrc } from '../utils/pdfGenerator.js';
import { assertRazorpayKeyMatchesMode } from '../utils/razorpayMode.js';
import { IdempotencyRepository, OP_GATEWAY_PAYMENT } from '../repositories/IdempotencyRepository.js';
import { ProcessedRazorpayEventRepository } from '../repositories/ProcessedRazorpayEventRepository.js';
import { prisma } from '../utils/prisma.js';
import { toDecimal2 } from '../utils/money.js';
import { CodedError } from '../utils/apiErrors.js';
import { verifyRazorpayPayment, createRazorpayOrder } from '../utils/razorpayApi.js';
import { createCashfreeOrder, verifyCashfreePayment, verifyCashfreeWebhookSignature } from '../utils/cashfreeApi.js';
import { computeCheckoutAmounts } from '../utils/gatewayFee.js';
import { GatewayRepository } from '../repositories/GatewayRepository.js';
import { ProcessedCashfreeEventRepository } from '../repositories/ProcessedCashfreeEventRepository.js';
import { accountingLog } from '../utils/accountingLog.js';
import { EventBus } from '../events/eventBus.js';
import { buildFinancialReceiptHtml } from '../utils/financialReceiptTemplate.js';
import { getFyStartYearForDate } from '../utils/financialYearRange.js';

export type RecordDonationResult = {
  idempotent: boolean;
  donation: { id: string; [k: string]: unknown } | null;
  voucherId?: string;
  duplicate?: boolean;
  ignored?: boolean;
  event?: string;
};

export class GivingService {
  static async createCampaign(tenantId: string, data: Omit<Prisma.CampaignCreateInput, 'tenant'>) {
    return GivingRepository.createCampaign(tenantId, data as any);
  }

  static async getCampaigns(tenantId: string) {
    return GivingRepository.getCampaigns(tenantId);
  }

  /**
   * Debit must be Asset (cash/bank); credit must be Revenue (offerings) for standard donations.
   */
  static async validateDonationGlAccounts(
    tenantId: string,
    debitAccountId: string,
    creditAccountId: string
  ) {
    const accs = await AccountingRepository.getAccountsByIds(tenantId, [debitAccountId, creditAccountId]);
    if (accs.length !== 2) {
      throw new CodedError('ACCOUNTS_INVALID', 'One or more GL accounts are invalid for this organization.');
    }
    const debit = accs.find((a) => a.id === debitAccountId)!;
    const credit = accs.find((a) => a.id === creditAccountId)!;
    if (debit.type !== 'Asset') {
      throw new CodedError(
        'DONATION_DEBIT_TYPE',
        'Debit account for receipts must be an Asset (e.g. cash or bank).'
      );
    }
    if (credit.type !== 'Revenue') {
      throw new CodedError(
        'DONATION_CREDIT_TYPE',
        'Credit account for gifts must be Revenue (e.g. tithes or offerings).'
      );
    }
  }

  static async recordDonation(
    tenantId: string,
    data: Omit<Prisma.DonationCreateInput, 'tenant'>,
    accountingOptions: { debitAccountId?: string; creditAccountId?: string; fundId?: string },
    audit?: { userId?: string | null },
    idempotency?: { gatewayPaymentId?: string },
    trace?: { donationSource?: string; donationSourceRefId?: string }
  ) {
    let { debitAccountId, creditAccountId } = accountingOptions;
    
    // Auto-resolve accounts if missing
    if (!debitAccountId || !creditAccountId) {
      const fin = await getMergedFinancialSettings(tenantId);
      if (!debitAccountId) debitAccountId = fin.defaultAccounts.bank || fin.defaultAccounts.cash;
      if (!creditAccountId) creditAccountId = fin.defaultAccounts.tithes || fin.defaultAccounts.offerings;
    }

    const idemKey = (idempotency?.gatewayPaymentId || '').trim();
    if (debitAccountId && creditAccountId) {
      await GivingService.validateDonationGlAccounts(
        tenantId,
        debitAccountId,
        creditAccountId
      );
    }

    const finalAccounting = {
      debitAccountId: debitAccountId || '', 
      creditAccountId: creditAccountId || '',
      fundId: (accountingOptions.fundId || '').trim() || undefined,
    };

    if (idemKey && finalAccounting.debitAccountId && finalAccounting.creditAccountId) {
      return GivingService._recordDonationIdempotent(
        tenantId,
        data,
        finalAccounting as { debitAccountId: string; creditAccountId: string; fundId?: string },
        audit,
        idemKey,
        trace
      );
    }
    if (data.reference && typeof data.reference === 'string' && data.reference.trim()) {
      const existing = await GivingRepository.findByReference(tenantId, data.reference.trim());
      if (existing) {
        return {
          idempotent: true,
          duplicate: true,
          donation: existing as any,
          voucherId: undefined,
        };
      }
    }

    return GivingService._recordDonationCore(
      tenantId, 
      data, 
      finalAccounting as { debitAccountId: string; creditAccountId: string; fundId?: string },
      audit, 
      trace
    );
  }

  private static _parseDate(d: any): Date {
    if (d instanceof Date) return d;
    if (typeof d === 'string' && d.trim()) {
      const parsed = new Date(d);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  }

  private static async _recordDonationIdempotent(
    tenantId: string,
    data: Omit<Prisma.DonationCreateInput, 'tenant'>,
    accountingOptions: {
      debitAccountId: string;
      creditAccountId: string;
      fundId?: string;
      gatewayMode?: boolean;
      donationAmount?: number;
      grossAmount?: number;
      donorCoveredFee?: number;
      recoveryIncomeAccountId?: string;
    },
    audit: { userId?: string | null } | undefined,
    gatewayPaymentId: string,
    trace?: { donationSource?: string; donationSourceRefId?: string }
  ) {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await IdempotencyRepository.findValidByKey(
        tx,
        tenantId,
        gatewayPaymentId,
        OP_GATEWAY_PAYMENT
      );
      if (existing) {
        let parsed: { voucherId: string; donationId: string };
        try {
          parsed = JSON.parse(existing.resultRefId) as { voucherId: string; donationId: string };
        } catch {
          throw new CodedError('IDEMPOTENCY_CORRUPT', 'Stored idempotency result is invalid.');
        }
        const donation = await tx.donation.findFirst({
          where: { id: parsed.donationId, tenantId },
        });
        accountingLog('giving', 'idempotency_hit', {
          tenantId,
          key: 'gatewayPaymentId',
          operation: OP_GATEWAY_PAYMENT,
        });
        return { idempotent: true as const, donation, voucherId: parsed.voucherId };
      }
      const amountNum =
        data.amount === undefined || data.amount === null
          ? 0
          : typeof data.amount === 'object' && 'toString' in data.amount
            ? Number((data.amount as { toString: () => string }).toString())
            : Number(data.amount);
      const resolvedFundId = await GivingService.resolveDonationFundId(
        tenantId,
        data,
        accountingOptions.fundId
      );
      const donation = await GivingRepository.createDonationTx(tx, tenantId, {
        ...data,
        date: GivingService._parseDate(data.date),
        amount: toDecimal2(amountNum),
        source: trace?.donationSource ?? 'gateway',
        sourceRefId: trace?.donationSourceRefId ?? gatewayPaymentId,
        gatewayPaymentId,
        fundId: resolvedFundId ?? null,
      } as any);
      const uid = audit?.userId ?? null;
      const donorProfile = await GivingService.resolveDonorProfile(tenantId, data);
      const posted = accountingOptions.gatewayMode
        ? await GivingService.postGatewayDonationVoucher(
            tenantId,
            donation.id,
            data,
            {
              clearingAccountId: accountingOptions.debitAccountId,
              creditAccountId: accountingOptions.creditAccountId,
              recoveryIncomeAccountId: accountingOptions.recoveryIncomeAccountId,
              fundId: resolvedFundId,
              donationAmount: accountingOptions.donationAmount ?? amountNum,
              grossAmount: accountingOptions.grossAmount ?? amountNum,
              donorCoveredFee: accountingOptions.donorCoveredFee ?? 0,
            },
            uid,
            tx
          )
        : await GivingService.postDonationVoucher(
            tenantId,
            donation.id,
            amountNum,
            data,
            {
              debitAccountId: accountingOptions.debitAccountId,
              creditAccountId: accountingOptions.creditAccountId,
              fundId: resolvedFundId,
            },
            uid,
            tx
          );
      const donationWithVoucher = await tx.donation.update({
        where: { id: donation.id },
        data: { voucher: { connect: { id: posted.id } } },
      });
      await AccountingRepository.createFinancialAuditLog(
        tenantId,
        {
          action: accountingOptions.gatewayMode ? 'donation.gateway_recorded' : 'donation.recorded',
          entityType: 'Donation',
          entityId: donation.id,
          actorUserId: uid,
          afterJson: {
            amount: amountNum,
            grossAmount: accountingOptions.grossAmount ?? amountNum,
            method: data.method,
            voucherId: posted.id,
            fundId: resolvedFundId ?? null,
            settlementStatus: 'pending_settlement',
          },
        },
        tx
      );
      await GivingService.createOrUpdateDonationReceipt(
        tx,
        tenantId,
        {
          donationId: donation.id,
          voucherId: posted.id,
          amount: toDecimal2(accountingOptions.donationAmount ?? amountNum),
          donorName: donorProfile.name,
          donorEmail: donorProfile.email,
          donorPhone: donorProfile.phone,
          fundId: resolvedFundId ?? null,
          campaignId: (data as { campaignId?: string | null }).campaignId ?? null,
          reference: (data as { reference?: string | null }).reference ?? null,
        }
      );

      const ref = JSON.stringify({ voucherId: posted.id, donationId: donation.id });
      try {
        await IdempotencyRepository.create(tx, tenantId, gatewayPaymentId, OP_GATEWAY_PAYMENT, ref);
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          const again = await IdempotencyRepository.findValidByKey(
            tx,
            tenantId,
            gatewayPaymentId,
            OP_GATEWAY_PAYMENT
          );
          if (again) {
            const parsed = JSON.parse(again.resultRefId) as { voucherId: string; donationId: string };
            const d2 = await tx.donation.findFirst({ where: { id: parsed.donationId, tenantId } });
            accountingLog('giving', 'idempotency_hit', { tenantId, key: 'gatewayPaymentId' });
            return { idempotent: true as const, donation: d2, voucherId: parsed.voucherId };
          }
        }
        throw e;
      }
      await EventBus.publish({
        eventName: 'DonationReceived',
        tenantId,
        entityId: donation.id,
        entityType: 'Donation',
        payload: {
          amount: amountNum,
          method: data.method,
          reference: data.reference,
          date: data.date,
        },
      });
      return { idempotent: false as const, donation: donationWithVoucher as any, voucherId: posted.id };
    });
    return result;
  }

  private static async _recordDonationCore(
    tenantId: string,
    data: Omit<Prisma.DonationCreateInput, 'tenant'>,
    accountingOptions: { debitAccountId: string; creditAccountId: string; fundId?: string },
    audit?: { userId?: string | null },
    trace?: { donationSource?: string; donationSourceRefId?: string }
  ) {
    const amountNum =
      data.amount === undefined || data.amount === null
        ? 0
        : typeof data.amount === 'object' && 'toString' in data.amount
          ? Number((data.amount as { toString: () => string }).toString())
          : Number(data.amount);

    return prisma.$transaction(async (tx) => {
      const resolvedFundId = await GivingService.resolveDonationFundId(
        tenantId,
        data,
        accountingOptions.fundId
      );
      const rest = {
        ...data,
        date: GivingService._parseDate(data.date),
        amount: toDecimal2(amountNum),
        source: trace?.donationSource ?? (data as { source?: string }).source ?? 'user',
        sourceRefId: trace?.donationSourceRefId ?? (data as { sourceRefId?: string }).sourceRefId ?? null,
        fundId: resolvedFundId ?? null,
      } as Omit<Prisma.DonationCreateInput, 'tenant'>;

      const donation = await GivingRepository.createDonationTx(tx, tenantId, rest as any);
      const donorProfile = await GivingService.resolveDonorProfile(tenantId, data);
      
      if (accountingOptions && accountingOptions.debitAccountId && accountingOptions.creditAccountId) {
        const uid = audit?.userId ?? null;
        const posted = await GivingService.postDonationVoucher(
          tenantId,
          donation.id,
          amountNum,
          data,
          {
            debitAccountId: accountingOptions.debitAccountId,
            creditAccountId: accountingOptions.creditAccountId,
            fundId: resolvedFundId,
          },
          uid,
          tx
        );
        const donationWithVoucher = await tx.donation.update({
          where: { id: donation.id },
          data: { voucher: { connect: { id: posted.id } } },
        });
        await AccountingRepository.createFinancialAuditLog(
          tenantId,
          {
            action: 'donation.recorded',
            entityType: 'Donation',
            entityId: donation.id,
            actorUserId: uid,
            afterJson: {
              amount: amountNum,
              method: data.method,
              voucherId: posted.id,
              fundId: resolvedFundId ?? null,
            },
          },
          tx
        );
        await GivingService.createOrUpdateDonationReceipt(
          tx,
          tenantId,
          {
            donationId: donation.id,
            voucherId: posted.id,
            amount: toDecimal2(amountNum),
            donorName: donorProfile.name,
            donorEmail: donorProfile.email,
            donorPhone: donorProfile.phone,
            fundId: resolvedFundId ?? null,
            campaignId: (data as { campaignId?: string | null }).campaignId ?? null,
            reference: (data as { reference?: string | null }).reference ?? null,
          }
        );
        await EventBus.publish({
          eventName: 'DonationReceived',
          tenantId,
          entityId: donation.id,
          entityType: 'Donation',
          payload: {
            amount: amountNum,
            method: data.method,
            reference: data.reference,
            date: data.date,
          },
        });
        return { idempotent: false as const, donation: donationWithVoucher as any, voucherId: posted.id };
      }
      
      return { idempotent: false as const, donation, voucherId: undefined };
    });
  }

  private static async resolveDonationFundId(
    tenantId: string,
    data: Omit<Prisma.DonationCreateInput, 'tenant'>,
    fundIdOverride?: string
  ): Promise<string | null> {
    const fromOverride = (fundIdOverride || '').trim();
    if (fromOverride) {
      const fund = await prisma.fund.findFirst({ where: { id: fromOverride, tenantId, isActive: true } });
      if (!fund) throw new CodedError('FUND_NOT_FOUND', 'Selected fund is invalid or inactive.');
      return fund.id;
    }
    const campaignId =
      (data as { campaignId?: string | null }).campaignId &&
      String((data as { campaignId?: string | null }).campaignId).trim();
    if (!campaignId) return null;
    const campaign = await prisma.campaign.findFirst({
      where: { id: String(campaignId), tenantId },
      select: { defaultFundId: true },
    });
    return campaign?.defaultFundId ?? null;
  }

  private static async resolveDonorProfile(
    tenantId: string,
    data: Omit<Prisma.DonationCreateInput, 'tenant'>
  ) {
    const donorId = String(
      (data as { donorId?: string | null }).donorId ||
      (data as { memberId?: string | null }).memberId ||
      ''
    ).trim();
    if (!donorId || donorId === 'anonymous') {
      return { name: 'Anonymous Donor', email: null as string | null, phone: null as string | null };
    }
    const member = await prisma.member.findFirst({
      where: { id: donorId, tenantId },
      select: { name: true, email: true, phone: true },
    });
    if (!member) return { name: 'Anonymous Donor', email: null as string | null, phone: null as string | null };
    return {
      name: member.name || 'Anonymous Donor',
      email: member.email ?? null,
      phone: member.phone ?? null,
    };
  }

  static requireGatewayClearingAccount(fin: Awaited<ReturnType<typeof getMergedFinancialSettings>>) {
    const clearing = (fin.defaultAccounts.gatewayClearing || '').trim();
    if (!clearing) {
      throw new CodedError(
        'GATEWAY_CLEARING_REQUIRED',
        'Gateway Clearing account must be configured before accepting online payments. Never post donations directly to Bank.'
      );
    }
    return clearing;
  }

  static async matchDonorByPhone(tenantId: string, phone: string, name?: string) {
    const digits = String(phone || '').replace(/\D/g, '');
    const tail = digits.slice(-10);
    if (tail.length < 10) return null;
    const members = await prisma.member.findMany({
      where: { tenantId, phone: { contains: tail } },
      take: 8,
    });
    if (members.length === 0) return null;
    if (members.length === 1) return members[0];
    if (name) {
      const q = name.toLowerCase();
      const hit = members.find((m) => m.name.toLowerCase().includes(q));
      if (hit) return hit;
    }
    return members[0];
  }

  private static async postGatewayDonationVoucher(
    tenantId: string,
    donationId: string,
    data: Omit<Prisma.DonationCreateInput, 'tenant'>,
    accounting: {
      clearingAccountId: string;
      creditAccountId: string;
      recoveryIncomeAccountId?: string;
      fundId?: string | null;
      donationAmount: number;
      grossAmount: number;
      donorCoveredFee: number;
    },
    userId: string | null,
    tx?: Prisma.TransactionClient
  ) {
    const entries: Array<{
      accountId: string;
      debit: number;
      credit: number;
      narration: string;
      fundId?: string;
    }> = [
      {
        accountId: accounting.clearingAccountId,
        debit: accounting.grossAmount,
        credit: 0,
        narration: 'Cashfree clearing — gross collection',
      },
      {
        accountId: accounting.creditAccountId,
        debit: 0,
        credit: accounting.donationAmount,
        narration: 'Donation income',
        fundId: accounting.fundId || undefined,
      },
    ];
    if (accounting.donorCoveredFee > 0.009) {
      const recovery = (accounting.recoveryIncomeAccountId || '').trim();
      if (!recovery) {
        throw new CodedError(
          'GATEWAY_RECOVERY_ACCOUNT_REQUIRED',
          'Configure Gateway Recovery Income account when donors cover processing charges.'
        );
      }
      entries.push({
        accountId: recovery,
        debit: 0,
        credit: accounting.donorCoveredFee,
        narration: 'Gateway fee recovery (donor-covered)',
      });
    }
    const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.02) {
      throw new CodedError('VOUCHER_IMBALANCE', 'Gateway donation voucher does not balance.');
    }
    return AccountingService.createApproveAndPostVoucher(
      tenantId,
      {
        type: 'Receipt',
        date: GivingService._parseDate(data.date),
        amount: accounting.grossAmount,
        description: `Online donation — ${String(data.method || 'Gateway')} — ${String(data.reference || '')}`,
        source: 'donation',
        sourceType: 'gateway_donation',
        sourceRefId: donationId,
        sourceId: donationId,
        sourceMetadata: {
          donationId,
          grossAmount: accounting.grossAmount,
          donationAmount: accounting.donationAmount,
          donorCoveredFee: accounting.donorCoveredFee,
        },
        entries,
      },
      { approvedByUserId: userId, postedByUserId: userId },
      tx
    );
  }

  private static async postDonationVoucher(
    tenantId: string,
    donationId: string,
    amountNum: number,
    data: Omit<Prisma.DonationCreateInput, 'tenant'>,
    accounting: { debitAccountId: string; creditAccountId: string; fundId?: string | null },
    userId: string | null,
    tx?: Prisma.TransactionClient
  ) {
    return AccountingService.createApproveAndPostVoucher(tenantId, {
      type: 'Receipt',
      date: GivingService._parseDate(data.date),
      amount: amountNum,
      description: `Donation via ${String(data.method || 'Unknown')} - Ref: ${String(data.reference || 'N/A')}`,
      source: 'donation',
      sourceType: 'donation',
      sourceRefId: donationId,
      sourceId: donationId,
      sourceMetadata: {
        donationId,
        campaignId: (data as any).campaignId || null,
        donorId: (data as any).donorId || (data as any).memberId || null,
      },
      entries: [
        {
          accountId: accounting.debitAccountId,
          debit: amountNum,
          credit: 0,
          narration: 'Donation receipt',
        },
        {
          accountId: accounting.creditAccountId,
          debit: 0,
          credit: amountNum,
          narration: 'Donation income',
          fundId: accounting.fundId || undefined,
        },
      ],
    }, { approvedByUserId: userId, postedByUserId: userId }, tx);
  }

  /** Gateway payment with mandatory clearing-account multi-line voucher. */
  static async recordGatewayDonation(
    tenantId: string,
    input: {
      gateway: string;
      gatewayPaymentId: string;
      gatewayOrderId: string;
      gatewayPaymentOrderId?: string;
      donationAmount: number;
      grossAmount: number;
      gatewayFeeAmount: number;
      donorCoveredFee: boolean;
      method: string;
      donorId?: string | null;
      campaignId?: string | null;
      fundId?: string | null;
      eventId?: string | null;
      donationCategory?: string | null;
      serviceCollectionSessionId?: string | null;
      isAnonymous?: boolean;
      creditAccountId?: string;
      reference?: string;
    },
    audit?: { userId?: string | null },
    trace?: { donationSource?: string; donationSourceRefId?: string }
  ): Promise<RecordDonationResult> {
    const fin = await getMergedFinancialSettings(tenantId);
    const clearing = GivingService.requireGatewayClearingAccount(fin);
    const creditAccountId =
      (input.creditAccountId || '').trim() ||
      fin.defaultAccounts.tithes ||
      fin.defaultAccounts.offerings ||
      '';
    if (!creditAccountId) {
      throw new CodedError('DONATION_GL_ACCOUNTS', 'Configure tithes or offerings revenue account.');
    }
    await GivingService.validateDonationGlAccounts(tenantId, clearing, creditAccountId);

    const donorCoveredFeeAmt = input.donorCoveredFee ? input.gatewayFeeAmount : 0;
    const data = {
      amount: toDecimal2(input.donationAmount),
      grossAmount: toDecimal2(input.grossAmount),
      gatewayFeeAmount: toDecimal2(input.gatewayFeeAmount),
      donorCoveredFee: toDecimal2(donorCoveredFeeAmt),
      method: input.method,
      date: new Date(),
      reference: input.reference || `${input.gateway}:${input.gatewayPaymentId}`,
      gateway: input.gateway,
      gatewayOrderId: input.gatewayOrderId,
      gatewayPaymentId: input.gatewayPaymentId,
      gatewayPaymentOrderId: input.gatewayPaymentOrderId,
      donationCategory: input.donationCategory,
      isAnonymous: input.isAnonymous ?? false,
      donorId: input.isAnonymous ? null : input.donorId,
      campaignId: input.campaignId,
      fundId: input.fundId,
      eventId: input.eventId,
      serviceCollectionSessionId: input.serviceCollectionSessionId,
      settlementStatus: 'pending_settlement',
      reconciliationState: 'payment_recorded',
    } as Omit<Prisma.DonationCreateInput, 'tenant'>;

    return GivingService._recordDonationIdempotent(
      tenantId,
      data,
      {
        debitAccountId: clearing,
        creditAccountId,
        fundId: input.fundId,
        gatewayMode: true,
        donationAmount: input.donationAmount,
        grossAmount: input.grossAmount,
        donorCoveredFee: donorCoveredFeeAmt,
        recoveryIncomeAccountId: fin.defaultAccounts.gatewayRecoveryIncome || '',
      } as any,
      audit,
      input.gatewayPaymentId,
      trace
    );
  }

  private static formatReceiptNo(fyStartYear: number, seq: number) {
    return `RCP-${fyStartYear}-${String(seq).padStart(5, '0')}`;
  }

  private static async writeReceiptPdf(
    tenantId: string,
    receiptNo: string,
    details: {
      issueDate: Date;
      donorName: string;
      donorEmail?: string | null;
      donorPhone?: string | null;
      amount: Prisma.Decimal;
      fundName?: string | null;
      campaignName?: string | null;
      reference?: string | null;
    }
  ) {
    const [org, financial, docs] = await Promise.all([
      getMergedOrganizationSettings(tenantId),
      getMergedFinancialSettings(tenantId),
      getMergedDocumentSettings(tenantId),
    ]);
    const amountNumber = Number(details.amount.toString());
    const issueDate = details.issueDate.toLocaleDateString('en-IN');
    const html = buildFinancialReceiptHtml({
      organizationName: org.name || 'Organization',
      organizationAddress: org.address || '',
      organizationEmail: org.email || '',
      organizationPhone: org.phone || '',
      registrationNumber: org.registrationNumber || '',
      taxId: org.taxId || '',
      logoPath: resolvePdfAssetSrc(org.logo),
      receiptNo,
      issueDate,
      donorName: details.donorName,
      donorEmail: details.donorEmail || null,
      donorPhone: details.donorPhone || null,
      amountDisplay: `${financial.currency} ${amountNumber.toFixed(2)}`,
      fundName: details.fundName || null,
      campaignName: details.campaignName || null,
      transactionRef: details.reference || null,
      signatoryName: docs.authorizedSignatoryName || null,
      pastorSignatureSrc: resolvePdfAssetSrc(docs.pastorSignature),
      accountantSignatureSrc: resolvePdfAssetSrc(docs.accountantSignature),
      sealSrc: resolvePdfAssetSrc(docs.sealStamp),
      generatedAt: new Date().toLocaleString('en-IN'),
    });
    const pdf = await generatePdfFromHtml(html);
    const checksum = crypto.createHash('sha256').update(pdf).digest('hex');
    const safeNo = receiptNo.replace(/[^A-Za-z0-9_-]/g, '_');
    const base = path.join(process.cwd(), 'uploads');
    const rel = `receipts/${tenantId}/${safeNo}.pdf`;
    const full = path.join(base, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, pdf);
    return { pdfUrl: `/uploads/${rel}`, checksum };
  }

  private static async createOrUpdateDonationReceipt(
    tx: Prisma.TransactionClient,
    tenantId: string,
    data: {
      donationId: string;
      voucherId: string;
      amount: Prisma.Decimal;
      donorName: string;
      donorEmail?: string | null;
      donorPhone?: string | null;
      fundId?: string | null;
      campaignId?: string | null;
      reference?: string | null;
    }
  ) {
    const existing = await tx.financialReceipt.findFirst({ where: { tenantId, donationId: data.donationId } });
    const issueDate = new Date();
    const fin = await getMergedFinancialSettings(tenantId);
    const { fyStartYear } = getFyStartYearForDate(fin.financialYearStart, issueDate);
    const seq = existing ? null : await GivingRepository.reserveNextReceiptSequence(tx, tenantId, fyStartYear);
    const receiptNo = existing?.receiptNo ?? GivingService.formatReceiptNo(fyStartYear, seq!);
    const fund = data.fundId ? await tx.fund.findFirst({ where: { id: data.fundId, tenantId } }) : null;
    const campaign = data.campaignId ? await tx.campaign.findFirst({ where: { id: data.campaignId, tenantId } }) : null;
    const pdf = await GivingService.writeReceiptPdf(tenantId, receiptNo, {
      issueDate,
      donorName: data.donorName || 'Anonymous Donor',
      donorEmail: data.donorEmail,
      donorPhone: data.donorPhone,
      amount: data.amount,
      fundName: fund?.name ?? null,
      campaignName: campaign?.name ?? null,
      reference: data.reference ?? null,
    });

    if (existing) {
      const updated = await tx.financialReceipt.update({
        where: { id: existing.id },
        data: {
          voucherId: data.voucherId,
          amount: data.amount,
          donorName: data.donorName || existing.donorName,
          donorEmail: data.donorEmail ?? existing.donorEmail,
          donorPhone: data.donorPhone ?? existing.donorPhone,
          fundId: data.fundId ?? existing.fundId,
          campaignId: data.campaignId ?? existing.campaignId,
          pdfUrl: pdf.pdfUrl,
          pdfChecksumSha256: pdf.checksum,
          regeneratedCount: { increment: 1 },
        },
      });
      return updated;
    }

    const created = await GivingRepository.createFinancialReceipt(tx, tenantId, {
      receiptNo,
      donationId: data.donationId,
      voucherId: data.voucherId,
      amount: data.amount,
      donorName: data.donorName || 'Anonymous Donor',
      donorEmail: data.donorEmail ?? null,
      donorPhone: data.donorPhone ?? null,
      fundId: data.fundId ?? null,
      campaignId: data.campaignId ?? null,
      eightyGEligible: false,
      pdfUrl: pdf.pdfUrl,
      pdfChecksumSha256: pdf.checksum,
    });
    return created;
  }

  /**
   * Full webhook pipeline: event replay protection → API verify → account validation → donation + idempotency + audit log.
   */
  static async handleRazorpayWebhook(
    tenantId: string,
    body: Record<string, unknown>,
    audit: { signatureHash: string; rawSize: number }
  ): Promise<RecordDonationResult> {
    const eventId = typeof body.id === 'string' ? body.id : '';
    if (!eventId) {
      throw new CodedError('WEBHOOK_PAYLOAD', 'Missing Razorpay event id (body.id).');
    }
    const processed = await ProcessedRazorpayEventRepository.findByEventId(tenantId, eventId);
    if (processed) {
      accountingLog('giving:webhook', 'replay_rejected', {
        tenantId,
        eventId,
        signatureHash: audit.signatureHash,
        donationId: processed.donationId,
      });
      const donation = processed.donationId
        ? await prisma.donation.findFirst({ where: { id: processed.donationId, tenantId } })
        : null;
      return {
        duplicate: true,
        idempotent: true,
        donation,
        voucherId: processed.voucherId ?? undefined,
      };
    }
    if (body.event !== 'payment.captured') {
      return { idempotent: false, donation: null, ignored: true, event: String(body.event) };
    }
    const payload = body.payload as
      | { payment?: { entity?: { id?: string; amount?: number; notes?: Record<string, string> } } }
      | undefined;
    const ent = payload?.payment?.entity;
    if (!ent?.id) {
      throw new CodedError('WEBHOOK_PAYLOAD', 'Missing payment id in webhook payload');
    }
    const paymentId = ent.id;
    const amountPaise = ent.amount;
    if (amountPaise === undefined || amountPaise === null) {
      throw new CodedError('WEBHOOK_PAYLOAD', 'Missing payment amount');
    }
    const keyCfg = await GivingService.getRazorpayConfig(tenantId);
    accountingLog('giving:webhook', 'processing', {
      tenantId,
      eventId,
      paymentId,
      rawSize: audit.rawSize,
    });
    await verifyRazorpayPayment(paymentId, keyCfg.keyId, keyCfg.keySecret, {
      expectedAmountPaise: amountPaise,
    });
    const amount = amountPaise / 100;
    const fin = await getMergedFinancialSettings(tenantId);
    const noteObj =
      ent.notes && typeof ent.notes === 'object' && !Array.isArray(ent.notes)
        ? (ent.notes as Record<string, string>)
        : {};
    const debit = (
      noteObj.debitAccountId ||
      fin.defaultAccounts.gatewayClearing ||
      fin.defaultAccounts.bank ||
      fin.defaultAccounts.cash ||
      ''
    ).trim();
    const credit = (noteObj.creditAccountId || fin.defaultAccounts.tithes || fin.defaultAccounts.offerings || '').trim();
    const fundId = (noteObj.fundId || '').trim() || undefined;
    if (!debit || !credit) {
      throw new CodedError('GIVING_DEFAULT_ACCOUNTS', 'Set debit/credit account ids in order notes or financial default accounts.');
    }
    const out = await GivingService.recordDonation(
      tenantId,
      {
        amount: toDecimal2(amount),
        method: 'Card',
        date: new Date(),
        reference: `razorpay:${paymentId}`,
        gatewayPaymentId: paymentId,
      } as any,
      { debitAccountId: debit, creditAccountId: credit, fundId },
      undefined,
      { gatewayPaymentId: paymentId },
      { donationSource: 'razorpay_webhook', donationSourceRefId: paymentId }
    );
    try {
      await ProcessedRazorpayEventRepository.create({
        tenantId,
        eventId,
        paymentId,
        signatureHash: audit.signatureHash,
        donationId: out.donation?.id ?? null,
        voucherId: out.voucherId ?? null,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        accountingLog('giving:webhook', 'processed_event_race', { tenantId, eventId });
        return { ...out, duplicate: true, idempotent: out.idempotent };
      }
      throw e;
    }
    accountingLog('giving:webhook', 'completed', {
      tenantId,
      eventId,
      paymentId,
      donationId: out.donation?.id,
      voucherId: out.voucherId,
    });
    return { ...out, idempotent: out.idempotent };
  }

  static async getDonations(tenantId: string, opts?: { limit?: number; offset?: number; search?: string; fundId?: string; campaignId?: string; method?: string }) {
    return GivingRepository.getDonations(tenantId, opts);
  }

  static async getDonationReceipt(tenantId: string, donationId: string) {
    const receipt = await GivingRepository.getFinancialReceiptByDonation(tenantId, donationId);
    if (!receipt) throw new CodedError('RECEIPT_NOT_FOUND', 'Financial receipt not found for this donation.');
    return receipt;
  }

  static async listFinancialReceipts(
    tenantId: string,
    opts?: { limit?: number; offset?: number; search?: string; fundId?: string; campaignId?: string; from?: string; to?: string }
  ) {
    return GivingRepository.listFinancialReceipts(tenantId, {
      limit: opts?.limit,
      offset: opts?.offset,
      search: opts?.search,
      fundId: opts?.fundId,
      campaignId: opts?.campaignId,
      from: opts?.from ? new Date(opts.from) : undefined,
      to: opts?.to ? new Date(opts.to) : undefined,
    });
  }

  static async getReceiptPdfBuffer(tenantId: string, receiptId: string) {
    const receipt = await GivingRepository.getFinancialReceiptById(tenantId, receiptId);
    if (!receipt) throw new CodedError('RECEIPT_NOT_FOUND', 'Receipt not found.');
    if (receipt.pdfUrl) {
      const rel = receipt.pdfUrl.replace(/^\/?uploads\//, '');
      const full = path.join(process.cwd(), 'uploads', rel);
      if (fs.existsSync(full)) {
        const buffer = fs.readFileSync(full);
        return { buffer, filename: `${receipt.receiptNo.replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`, receiptNo: receipt.receiptNo };
      }
    }
    if (receipt.donationId) {
      const regenerated = await GivingService.regenerateDonationReceipt(tenantId, receipt.donationId, null);
      if (regenerated.pdfUrl) {
        const rel = regenerated.pdfUrl.replace(/^\/?uploads\//, '');
        const full = path.join(process.cwd(), 'uploads', rel);
        if (fs.existsSync(full)) {
          const buffer = fs.readFileSync(full);
          return { buffer, filename: `${regenerated.receiptNo.replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`, receiptNo: regenerated.receiptNo };
        }
      }
    }
    throw new CodedError('RECEIPT_PDF_MISSING', 'Receipt PDF file is not available. Try regenerating the receipt.');
  }

  static async getDonationReceiptPdfBuffer(tenantId: string, donationId: string) {
    const receipt = await GivingRepository.getFinancialReceiptByDonation(tenantId, donationId);
    if (!receipt) throw new CodedError('RECEIPT_NOT_FOUND', 'Financial receipt not found for this donation.');
    return GivingService.getReceiptPdfBuffer(tenantId, receipt.id);
  }

  static async regenerateDonationReceipt(tenantId: string, donationId: string, actorUserId?: string | null) {
    const donation = await GivingRepository.findById(tenantId, donationId);
    if (!donation) throw new CodedError('DONATION_NOT_FOUND', 'Donation not found');
    if (!donation.voucherId) throw new CodedError('DONATION_NO_VOUCHER', 'Donation has no posted voucher.');
    const receipt = await prisma.$transaction(async (tx) => {
      return GivingService.createOrUpdateDonationReceipt(tx, tenantId, {
        donationId: donation.id,
        voucherId: donation.voucherId!,
        amount: donation.amount,
        donorName: donation.donor?.name || 'Anonymous Donor',
        donorEmail: donation.donor?.email ?? null,
        donorPhone: donation.donor?.phone ?? null,
        fundId: donation.fundId ?? null,
        campaignId: donation.campaignId ?? null,
        reference: donation.reference ?? null,
      });
    });
    await AccountingRepository.createFinancialAuditLog(tenantId, {
      action: 'receipt.regenerated',
      entityType: 'FinancialReceipt',
      entityId: receipt.id,
      actorUserId: actorUserId ?? null,
      afterJson: { receiptNo: receipt.receiptNo, regeneratedCount: receipt.regeneratedCount },
    });
    return receipt;
  }

  static async reverseDonation(tenantId: string, donationId: string, actorUserId?: string | null) {
    const donation = await GivingRepository.findById(tenantId, donationId);
    if (!donation) throw new CodedError('DONATION_NOT_FOUND', 'Donation not found');
    if (!donation.voucherId) throw new CodedError('DONATION_NO_VOUCHER', 'Donation has no linked voucher to reverse.');
    if (donation.status === 'Reversed' || donation.reversalVoucherId) {
      throw new CodedError('DONATION_ALREADY_REVERSED', 'Donation already reversed.');
    }
    const reversalDraft = await AccountingService.createReversalDraft(tenantId, donation.voucherId);
    await AccountingService.approveVoucher(tenantId, reversalDraft.id, actorUserId ?? null);
    const postedReversal = await AccountingService.postVoucherToLedger(tenantId, reversalDraft.id, actorUserId ?? null);
    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        status: 'Reversed',
        reversalVoucher: { connect: { id: postedReversal.id } },
      },
    });
    await AccountingRepository.createFinancialAuditLog(tenantId, {
      action: 'donation.reversed',
      entityType: 'Donation',
      entityId: donation.id,
      actorUserId: actorUserId ?? null,
      beforeJson: { status: donation.status, voucherId: donation.voucherId },
      afterJson: { status: 'Reversed', reversalVoucherId: postedReversal.id },
    });
    return { donationId: donation.id, reversalVoucherId: postedReversal.id };
  }

  static async getDonationReconciliation(tenantId: string, options?: { from?: string; to?: string }) {
    const from = options?.from ? new Date(options.from) : undefined;
    const to = options?.to ? new Date(options.to) : undefined;
    const donations = await prisma.donation.findMany({
      where: {
        tenantId,
        ...(from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      },
      include: { voucher: true },
      orderBy: { date: 'desc' },
    });
    const rows = donations.map((d) => {
      const amount = Number(d.amount);
      const voucherAmount = d.voucher ? Number(d.voucher.amount) : null;
      const matched = d.status !== 'Reversed' && !!d.voucher && voucherAmount === amount;
      return {
        donationId: d.id,
        date: d.date,
        amount,
        voucherId: d.voucherId,
        voucherNo: d.voucher?.voucherNo ?? null,
        voucherAmount,
        status: d.status,
        matched,
      };
    });
    const mismatches = rows.filter((r) => !r.matched);
    return {
      range: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null },
      totals: {
        donations: rows.length,
        matched: rows.length - mismatches.length,
        mismatched: mismatches.length,
      },
      rows,
    };
  }

  static async getRazorpayConfig(tenantId: string) {
    const config = await getMergedPaymentGatewaySettings(tenantId);
    if (config.razorpayKeyId) {
      assertRazorpayKeyMatchesMode(config.razorpayKeyId);
    }
    return {
      keyId: config.razorpayKeyId,
      keySecret: config.razorpayKeySecret,
      webhookSecret: config.razorpayWebhookSecret,
      isConfigured: !!(config.razorpayKeyId && config.razorpayKeySecret),
    };
  }

  static async getCashfreeConfig(tenantId: string) {
    const config = await getMergedPaymentGatewaySettings(tenantId);
    return {
      appId: config.cashfreeAppId,
      secretKey: config.cashfreeSecretKey,
      webhookSecret: config.cashfreeWebhookSecret,
      environment: config.cashfreeEnvironment || 'sandbox',
      isConfigured: !!(config.cashfreeAppId && config.cashfreeSecretKey),
    };
  }

  static async getPaymentGatewayConfig(tenantId: string) {
    const config = await getMergedPaymentGatewaySettings(tenantId);
    const razorpay = await this.getRazorpayConfig(tenantId);
    const cashfree = await this.getCashfreeConfig(tenantId);
    const primaryGateway =
      (config.primaryGateway === 'razorpay' || config.primaryGateway === 'cashfree'
        ? config.primaryGateway
        : null) || (cashfree.isConfigured ? 'cashfree' : 'razorpay');
    return {
      primaryGateway,
      razorpay: { isConfigured: razorpay.isConfigured, keyId: razorpay.keyId || '' },
      cashfree: { isConfigured: cashfree.isConfigured, appId: cashfree.appId || '', environment: cashfree.environment },
    };
  }

  static async createRazorpayOrder(
    tenantId: string,
    data: { amount: number; campaignId?: string; donorId?: string; donorEmail?: string; donorPhone?: string }
  ) {
    const cfg = await GivingService.getRazorpayConfig(tenantId);
    const fin = await getMergedFinancialSettings(tenantId);
    
    // Auto-resolve accounts
    const debit = fin.defaultAccounts.gatewayClearing || fin.defaultAccounts.bank || fin.defaultAccounts.cash || '';
    const credit = fin.defaultAccounts.tithes || fin.defaultAccounts.offerings || '';

    const order = await createRazorpayOrder(cfg.keyId, cfg.keySecret, {
      amountPaise: Math.round(data.amount * 100),
      currency: fin.currency || 'INR',
      notes: {
        tenantId,
        debitAccountId: debit,
        creditAccountId: credit,
        gatewayClearingAccountId: fin.defaultAccounts.gatewayClearing || '',
        campaignId: data.campaignId || '',
        donorId: data.donorId || '',
        donorEmail: data.donorEmail || '',
        donorPhone: data.donorPhone || '',
      },
    });

    return {
      gateway: 'razorpay' as const,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      razorpayKeyId: cfg.keyId,
    };
  }

  static async createCashfreeOrder(
    tenantId: string,
    data: {
      amount: number;
      donorCoveredFee?: boolean;
      campaignId?: string;
      fundId?: string;
      eventId?: string;
      donationCategory?: string;
      serviceCollectionSessionId?: string;
      donorId?: string;
      donorEmail?: string;
      donorPhone?: string;
      donorName?: string;
      isAnonymous?: boolean;
      creditAccountId?: string;
    }
  ) {
    const pgSettings = await getMergedPaymentGatewaySettings(tenantId);
    if (pgSettings.onlineGivingEnabled === false) {
      throw new CodedError('ONLINE_GIVING_DISABLED', 'Online giving is turned off in Settings → Online Giving.');
    }
    const cfg = await GivingService.getCashfreeConfig(tenantId);
    if (!cfg.isConfigured) {
      throw new CodedError('CASHFREE_NOT_CONFIGURED', 'Cashfree is not configured for this tenant.');
    }
    const fin = await getMergedFinancialSettings(tenantId);
    GivingService.requireGatewayClearingAccount(fin);
    const credit = data.creditAccountId || fin.defaultAccounts.tithes || fin.defaultAccounts.offerings || '';

    let donorId = data.donorId;
    if (!donorId && data.donorPhone && !data.isAnonymous) {
      const matched = await GivingService.matchDonorByPhone(tenantId, data.donorPhone, data.donorName);
      if (matched) donorId = matched.id;
    }

    const amounts = computeCheckoutAmounts(Number(data.amount), Boolean(data.donorCoveredFee), {
      feePercent: fin.gatewayFeePercent,
      gstPercent: fin.gatewayFeeGstPercent,
    });

    const orderId = `cf_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const notifyUrl =
      process.env.CASHFREE_WEBHOOK_URL ||
      `${process.env.PUBLIC_API_URL || `http://127.0.0.1:${process.env.PORT || 4002}`}/api/v1/giving/webhooks/cashfree`;

    const order = await createCashfreeOrder(
      { appId: cfg.appId, secretKey: cfg.secretKey, environment: cfg.environment as 'sandbox' | 'production' },
      {
        orderId,
        amount: amounts.grossAmount,
        currency: fin.currency || 'INR',
        customerId: donorId || `guest_${Date.now()}`,
        customerEmail: data.donorEmail || 'donor@example.com',
        customerPhone: data.donorPhone || '9999999999',
        customerName: data.isAnonymous ? 'Anonymous Donor' : data.donorName || 'Donor',
        notifyUrl,
        orderNote: JSON.stringify({
          tenantId,
          creditAccountId: credit,
          campaignId: data.campaignId || '',
          fundId: data.fundId || '',
          donorId: donorId || '',
          donationCategory: data.donationCategory || '',
        }),
      }
    );

    await GatewayRepository.upsertPaymentOrder(tenantId, {
      gateway: 'cashfree',
      externalOrderId: order.order_id,
      donationAmount: toDecimal2(amounts.donationAmount),
      grossAmount: toDecimal2(amounts.grossAmount),
      gatewayFeeAmount: toDecimal2(amounts.gatewayFee),
      donorCoveredFee: amounts.donorCoveredFee,
      currency: fin.currency || 'INR',
      donorName: data.isAnonymous ? null : data.donorName,
      donorPhone: data.donorPhone,
      donorEmail: data.donorEmail,
      donorId: donorId ?? null,
      donationCategory: data.donationCategory ?? null,
      fundId: data.fundId ?? null,
      campaignId: data.campaignId ?? null,
      eventId: data.eventId ?? null,
      serviceCollectionSessionId: data.serviceCollectionSessionId ?? null,
      isAnonymous: data.isAnonymous ?? false,
      metadataJson: JSON.stringify({ creditAccountId: credit }),
    });

    return {
      gateway: 'cashfree' as const,
      orderId: order.order_id,
      paymentSessionId: order.payment_session_id,
      donationAmount: amounts.donationAmount,
      gatewayFee: amounts.gatewayFee,
      grossAmount: amounts.grossAmount,
      donorCoveredFee: amounts.donorCoveredFee,
      currency: order.order_currency,
      cashfreeAppId: cfg.appId,
      environment: cfg.environment,
    };
  }

  static async createPublicGatewayOrder(
    tenantId: string,
    data: { gateway?: string; amount: number; campaignId?: string; donorId?: string; donorEmail?: string; donorPhone?: string; donorName?: string }
  ) {
    const pg = await GivingService.getPaymentGatewayConfig(tenantId);
    const requested = String(data.gateway || '').trim().toLowerCase();
    const preferred = requested === 'razorpay' || requested === 'cashfree' ? requested : pg.primaryGateway;
    if (preferred === 'cashfree' && pg.cashfree.isConfigured) {
      return GivingService.createCashfreeOrder(tenantId, data);
    }
    if (preferred === 'razorpay' && pg.razorpay.isConfigured) {
      return GivingService.createRazorpayOrder(tenantId, data);
    }
    if (pg.cashfree.isConfigured) return GivingService.createCashfreeOrder(tenantId, data);
    if (pg.razorpay.isConfigured) return GivingService.createRazorpayOrder(tenantId, data);
    throw new CodedError('PAYMENT_GATEWAY_NOT_CONFIGURED', 'No payment gateway is configured for this tenant.');
  }

  /**
   * Verifies Razorpay callback signature + captured payment and records a donation exactly once.
   * Used by public website flow so UI only shows success after backend persistence succeeds.
   */
  static async verifyAndRecordPublicRazorpayPayment(
    tenantId: string,
    input: {
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
      donorEmail?: string;
      donorPhone?: string;
      donorName?: string;
    }
  ) {
    const orderId = String(input.razorpayOrderId || '').trim();
    const paymentId = String(input.razorpayPaymentId || '').trim();
    const signature = String(input.razorpaySignature || '').trim();
    if (!orderId || !paymentId || !signature) {
      throw new CodedError('BAD_INPUT', 'razorpayOrderId, razorpayPaymentId and razorpaySignature are required.');
    }

    const cfg = await GivingService.getRazorpayConfig(tenantId);
    if (!cfg.keySecret) {
      throw new CodedError('RAZORPAY_NOT_CONFIGURED', 'Razorpay is not configured for this tenant.');
    }
    const expectedSignature = crypto.createHmac('sha256', cfg.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    if (expectedSignature.length !== signature.length) {
      throw new CodedError('PAYMENT_SIGNATURE', 'Invalid Razorpay payment signature.');
    }
    if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
      throw new CodedError('PAYMENT_SIGNATURE', 'Invalid Razorpay payment signature.');
    }

    const payment = await verifyRazorpayPayment(paymentId, cfg.keyId, cfg.keySecret);
    if (payment.order_id !== orderId) {
      throw new CodedError('PAYMENT_ORDER_MISMATCH', 'Payment does not belong to the requested order.');
    }
    const amount = toDecimal2(payment.amount / 100);
    const notes =
      payment.notes && typeof payment.notes === 'object' && !Array.isArray(payment.notes)
        ? payment.notes
        : {};
    const campaignId = typeof notes.campaignId === 'string' && notes.campaignId.trim() ? notes.campaignId.trim() : undefined;
    const fundId = typeof notes.fundId === 'string' && notes.fundId.trim() ? notes.fundId.trim() : undefined;
    const debitAccountId = typeof notes.debitAccountId === 'string' ? notes.debitAccountId.trim() : '';
    const creditAccountId = typeof notes.creditAccountId === 'string' ? notes.creditAccountId.trim() : '';

    const out = await GivingService.recordDonation(
      tenantId,
      {
        amount,
        method: 'Card',
        date: new Date(),
        reference: `razorpay:${paymentId}`,
        campaignId,
        gatewayPaymentId: paymentId,
      } as any,
      { debitAccountId, creditAccountId, fundId },
      undefined,
      { gatewayPaymentId: paymentId },
      { donationSource: 'razorpay_public_verify', donationSourceRefId: paymentId }
    );

    return {
      donation: out.donation,
      voucherId: out.voucherId,
      idempotent: out.idempotent,
      duplicate: Boolean((out as { duplicate?: boolean }).duplicate),
    };
  }

  static async verifyAndRecordPublicCashfreePayment(
    tenantId: string,
    input: {
      cashfreeOrderId: string;
      cashfreePaymentId: string;
      donorEmail?: string;
      donorPhone?: string;
      donorName?: string;
      campaignId?: string;
    }
  ) {
    return GivingService.finalizeCashfreePayment(tenantId, {
      orderId: String(input.cashfreeOrderId || '').trim(),
      paymentId: String(input.cashfreePaymentId || '').trim(),
      source: 'cashfree_public_verify',
    });
  }

  static async finalizeCashfreePayment(
    tenantId: string,
    input: { orderId: string; paymentId: string; source: string }
  ) {
    const orderId = input.orderId.trim();
    const paymentId = input.paymentId.trim();
    if (!orderId || !paymentId) {
      throw new CodedError('BAD_INPUT', 'orderId and paymentId are required.');
    }
    const cfg = await GivingService.getCashfreeConfig(tenantId);
    if (!cfg.isConfigured) {
      throw new CodedError('CASHFREE_NOT_CONFIGURED', 'Cashfree is not configured for this tenant.');
    }
    await verifyCashfreePayment(
      { appId: cfg.appId, secretKey: cfg.secretKey, environment: cfg.environment as 'sandbox' | 'production' },
      orderId,
      paymentId
    );

    const orderRow = await GatewayRepository.getPaymentOrderByExternalId(tenantId, 'cashfree', orderId);
    if (!orderRow) {
      throw new CodedError('ORDER_NOT_FOUND', 'Gateway order not found. Create order before payment.');
    }
    if (orderRow.status === 'paid') {
      const existing = await prisma.donation.findFirst({ where: { tenantId, gatewayPaymentId: paymentId } });
      return {
        donation: existing,
        voucherId: existing?.voucherId,
        idempotent: true,
        duplicate: true,
      };
    }

    const fin = await getMergedFinancialSettings(tenantId);
    let creditAccountId = fin.defaultAccounts.tithes || fin.defaultAccounts.offerings || '';
    try {
      const meta = orderRow.metadataJson ? JSON.parse(orderRow.metadataJson) : {};
      if (meta.creditAccountId) creditAccountId = meta.creditAccountId;
    } catch {
      /* ignore */
    }

    const out = await GivingService.recordGatewayDonation(
      tenantId,
      {
        gateway: 'cashfree',
        gatewayPaymentId: paymentId,
        gatewayOrderId: orderId,
        gatewayPaymentOrderId: orderRow.id,
        donationAmount: Number(orderRow.donationAmount.toString()),
        grossAmount: Number(orderRow.grossAmount.toString()),
        gatewayFeeAmount: Number(orderRow.gatewayFeeAmount.toString()),
        donorCoveredFee: orderRow.donorCoveredFee,
        method: 'ONLINE',
        donorId: orderRow.donorId,
        campaignId: orderRow.campaignId,
        fundId: orderRow.fundId,
        eventId: orderRow.eventId,
        donationCategory: orderRow.donationCategory,
        serviceCollectionSessionId: orderRow.serviceCollectionSessionId,
        isAnonymous: orderRow.isAnonymous,
        creditAccountId,
        reference: `cashfree:${paymentId}`,
      },
      undefined,
      { donationSource: input.source, donationSourceRefId: paymentId }
    );

    await GatewayRepository.markOrderPaid(tenantId, orderRow.id);
    return {
      donation: out.donation,
      voucherId: out.voucherId,
      idempotent: out.idempotent,
      duplicate: Boolean((out as { duplicate?: boolean }).duplicate),
    };
  }

  static async handleCashfreeWebhook(tenantId: string, rawBody: Buffer, signature: string) {
    const cfg = await GivingService.getCashfreeConfig(tenantId);
    if (!cfg.webhookSecret) {
      throw new CodedError('WEBHOOK_NOT_CONFIGURED', 'Cashfree webhook secret is not configured.');
    }
    if (!verifyCashfreeWebhookSignature(cfg.webhookSecret, rawBody, signature)) {
      throw new CodedError('WEBHOOK_SIGNATURE', 'Invalid Cashfree webhook signature.');
    }
    const body = JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>;
    const eventId = String(body.event_id || body.eventId || `${Date.now()}`);
    const eventType = String(body.type || body.event || '');
    const data = (body.data as Record<string, unknown>) || body;
    const order = (data.order as Record<string, unknown>) || data;
    const payment = (data.payment as Record<string, unknown>) || data;
    const orderId = String(order.order_id || order.orderId || '');
    const paymentId = String(payment.cf_payment_id || payment.payment_id || '');

    const signatureHash = crypto.createHash('sha256').update(rawBody).digest('hex');

    const seen = await prisma.processedCashfreeEvent.findFirst({ where: { tenantId, eventId } });
    if (seen) {
      return { ignored: true, reason: 'duplicate_event' };
    }
    if (!orderId || !paymentId) {
      await prisma.processedCashfreeEvent.create({
        data: { tenantId, eventId, eventType, signatureHash },
      });
      return { ignored: true, reason: 'missing_ids' };
    }
    const result = await GivingService.finalizeCashfreePayment(tenantId, {
      orderId,
      paymentId,
      source: 'cashfree_webhook',
    });
    await prisma.processedCashfreeEvent.create({
      data: {
        tenantId,
        eventId,
        eventType,
        orderId,
        paymentId,
        signatureHash,
        donationId: (result.donation as { id?: string } | null)?.id ?? null,
        voucherId: result.voucherId ?? null,
      },
    });
    return { processed: true, ...result };
  }

  static async verifyAndRecordPublicGatewayPayment(
    tenantId: string,
    input: Record<string, unknown>
  ) {
    const gateway = String(input.gateway || '').trim().toLowerCase();
    if (gateway === 'cashfree') {
      return this.verifyAndRecordPublicCashfreePayment(tenantId, {
        cashfreeOrderId: String(input.cashfreeOrderId || ''),
        cashfreePaymentId: String(input.cashfreePaymentId || ''),
        donorEmail: typeof input.donorEmail === 'string' ? input.donorEmail : undefined,
        donorPhone: typeof input.donorPhone === 'string' ? input.donorPhone : undefined,
        donorName: typeof input.donorName === 'string' ? input.donorName : undefined,
        campaignId: typeof input.campaignId === 'string' ? input.campaignId : undefined,
      });
    }
    return this.verifyAndRecordPublicRazorpayPayment(tenantId, {
      razorpayOrderId: String(input.razorpayOrderId || ''),
      razorpayPaymentId: String(input.razorpayPaymentId || ''),
      razorpaySignature: String(input.razorpaySignature || ''),
      donorEmail: typeof input.donorEmail === 'string' ? input.donorEmail : undefined,
      donorPhone: typeof input.donorPhone === 'string' ? input.donorPhone : undefined,
      donorName: typeof input.donorName === 'string' ? input.donorName : undefined,
    });
  }
}
