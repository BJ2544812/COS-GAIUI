import { Prisma } from '@prisma/client';
import { GivingRepository } from '../repositories/GivingRepository.js';
import { AccountingService } from './AccountingService.js';
import { AccountingRepository } from '../repositories/AccountingRepository.js';
import { getMergedFinancialSettings, getMergedPaymentGatewaySettings } from '../utils/mergeTenantSettings.js';
import { assertRazorpayKeyMatchesMode } from '../utils/razorpayMode.js';
import { IdempotencyRepository, OP_GATEWAY_PAYMENT } from '../repositories/IdempotencyRepository.js';
import { ProcessedRazorpayEventRepository } from '../repositories/ProcessedRazorpayEventRepository.js';
import { prisma } from '../utils/prisma.js';
import { toDecimal2 } from '../utils/money.js';
import { CodedError } from '../utils/apiErrors.js';
import { verifyRazorpayPayment } from '../utils/razorpayApi.js';
import { accountingLog } from '../utils/accountingLog.js';
import { EventBus } from '../events/eventBus.js';

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
    accountingOptions: { debitAccountId?: string; creditAccountId?: string },
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
      creditAccountId: creditAccountId || '' 
    };

    if (idemKey && finalAccounting.debitAccountId && finalAccounting.creditAccountId) {
      return GivingService._recordDonationIdempotent(
        tenantId,
        data,
        finalAccounting as { debitAccountId: string; creditAccountId: string },
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
      finalAccounting as { debitAccountId: string; creditAccountId: string }, 
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
    accountingOptions: { debitAccountId: string; creditAccountId: string },
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
      const donation = await GivingRepository.createDonationTx(tx, tenantId, {
        ...data,
        date: GivingService._parseDate(data.date),
        amount: toDecimal2(amountNum),
        source: trace?.donationSource ?? 'gateway',
        sourceRefId: trace?.donationSourceRefId ?? gatewayPaymentId,
      } as any);
      const uid = audit?.userId ?? null;
      
      // Emit Domain Event instead of direct service call
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
          debitAccountId: accountingOptions.debitAccountId,
          creditAccountId: accountingOptions.creditAccountId,
          auditUserId: uid
        }
      });

      const ref = JSON.stringify({ voucherId: 'pending_async', donationId: donation.id });
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
      return { idempotent: false as const, donation, voucherId: undefined };
    });
    return result;
  }

  private static async _recordDonationCore(
    tenantId: string,
    data: Omit<Prisma.DonationCreateInput, 'tenant'>,
    accountingOptions: { debitAccountId: string; creditAccountId: string },
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
      const rest = {
        ...data,
        date: GivingService._parseDate(data.date),
        amount: toDecimal2(amountNum),
        source: trace?.donationSource ?? (data as { source?: string }).source ?? 'user',
        sourceRefId: trace?.donationSourceRefId ?? (data as { sourceRefId?: string }).sourceRefId ?? null,
      } as Omit<Prisma.DonationCreateInput, 'tenant'>;

      const donation = await GivingRepository.createDonationTx(tx, tenantId, rest as any);
      
      if (accountingOptions && accountingOptions.debitAccountId && accountingOptions.creditAccountId) {
        const uid = audit?.userId ?? null;
        
        // Emit Domain Event (Transactional)
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
            debitAccountId: accountingOptions.debitAccountId,
            creditAccountId: accountingOptions.creditAccountId,
            auditUserId: uid
          }
        });
      }
      
      return { idempotent: false as const, donation, voucherId: undefined };
    });
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
    const debit = (noteObj.debitAccountId || fin.defaultAccounts.bank || fin.defaultAccounts.cash || '').trim();
    const credit = (noteObj.creditAccountId || fin.defaultAccounts.tithes || fin.defaultAccounts.offerings || '').trim();
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
      } as any,
      { debitAccountId: debit, creditAccountId: credit },
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

  static async getDonations(tenantId: string) {
    return GivingRepository.getDonations(tenantId);
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
}
