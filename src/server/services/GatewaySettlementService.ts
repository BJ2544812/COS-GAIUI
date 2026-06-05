import { Prisma } from '@prisma/client';
import { GatewayRepository } from '../repositories/GatewayRepository.js';
import { AccountingService } from './AccountingService.js';
import { AccountingRepository } from '../repositories/AccountingRepository.js';
import { getMergedFinancialSettings } from '../utils/mergeTenantSettings.js';
import { prisma } from '../utils/prisma.js';
import { toDecimal2 } from '../utils/money.js';
import { CodedError } from '../utils/apiErrors.js';

export type SettlementImportLine = {
  externalPaymentId: string;
  amount: number;
  feeAmount?: number;
};

export type SettlementImportInput = {
  gateway: string;
  externalSettlementId: string;
  settlementDate: string;
  grossAmount: number;
  feeAmount: number;
  netAmount: number;
  bankReference?: string;
  lines: SettlementImportLine[];
  notes?: string;
};

export class GatewaySettlementService {
  static async getDashboard(tenantId: string) {
    return GatewayRepository.getReconciliationDashboard(tenantId);
  }

  static async importSettlement(tenantId: string, input: SettlementImportInput, actorUserId?: string | null) {
    const existing = await GatewayRepository.findSettlementByExternalId(
      tenantId,
      input.gateway,
      input.externalSettlementId
    );
    if (existing) {
      throw new CodedError('SETTLEMENT_EXISTS', 'This settlement batch was already imported.');
    }

    const settlement = await GatewayRepository.createSettlement(tenantId, {
      gateway: input.gateway,
      externalSettlementId: input.externalSettlementId,
      settlementDate: new Date(input.settlementDate),
      grossAmount: toDecimal2(input.grossAmount),
      feeAmount: toDecimal2(input.feeAmount),
      netAmount: toDecimal2(input.netAmount),
      bankReference: input.bankReference ?? null,
      notes: input.notes ?? null,
    });

    const matchResults: Array<{ lineId: string; donationId: string | null; matchStatus: string }> = [];

    for (const line of input.lines) {
      const donation = await prisma.donation.findFirst({
        where: {
          tenantId,
          gatewayPaymentId: line.externalPaymentId,
        },
      });
      const matchStatus =
        !donation
          ? 'unmatched'
          : Math.abs(Number(donation.grossAmount ?? donation.amount) - line.amount) > 0.02
            ? 'mismatch'
            : 'matched';

      const row = await prisma.gatewaySettlementLine.create({
        data: {
          tenantId,
          settlementId: settlement.id,
          donationId: donation?.id ?? null,
          externalPaymentId: line.externalPaymentId,
          amount: toDecimal2(line.amount),
          feeAmount: toDecimal2(line.feeAmount ?? 0),
          matchStatus,
        },
      });

      if (donation && matchStatus === 'matched') {
        await prisma.donation.update({
          where: { id: donation.id },
          data: {
            gatewaySettlementId: settlement.id,
            reconciliationState: 'settlement_matched',
            netSettlementAmount: toDecimal2(line.amount - (line.feeAmount ?? 0)),
          },
        });
      }
      matchResults.push({ lineId: row.id, donationId: donation?.id ?? null, matchStatus });
    }

    await AccountingRepository.createFinancialAuditLog(tenantId, {
      action: 'gateway_settlement.imported',
      entityType: 'GatewaySettlement',
      entityId: settlement.id,
      actorUserId: actorUserId ?? null,
      afterJson: { lineCount: input.lines.length, externalSettlementId: input.externalSettlementId },
    });

    return { settlement, matchResults };
  }

  /**
   * Post settlement accounting:
   * 1) Fee: Dr Gateway Charges, Cr Clearing (batch fee)
   * 2) Settlement: Dr Bank, Cr Clearing (net to bank)
   */
  static async postSettlementVouchers(tenantId: string, settlementId: string, actorUserId?: string | null) {
    const settlement = await prisma.gatewaySettlement.findFirst({
      where: { id: settlementId, tenantId },
      include: { donations: true, lines: true },
    });
    if (!settlement) throw new CodedError('SETTLEMENT_NOT_FOUND', 'Settlement not found.');
    if (settlement.settlementVoucherId) {
      throw new CodedError('SETTLEMENT_ALREADY_POSTED', 'Settlement vouchers already posted.');
    }

    const fin = await getMergedFinancialSettings(tenantId);
    const clearing = (fin.defaultAccounts.gatewayClearing || '').trim();
    const bank = (fin.defaultAccounts.bank || '').trim();
    const feeExpense = (fin.defaultAccounts.gatewayChargesExpense || '').trim();
    if (!clearing) {
      throw new CodedError('GATEWAY_CLEARING_REQUIRED', 'Configure Gateway Clearing account in Settings → Financial.');
    }
    if (!bank) {
      throw new CodedError('BANK_ACCOUNT_REQUIRED', 'Configure default Bank account for settlement posting.');
    }

    const feeNum = Number(settlement.feeAmount.toString());
    const netNum = Number(settlement.netAmount.toString());

    return prisma.$transaction(async (tx) => {
      let feeVoucherId: string | null = null;
      if (feeNum > 0.009 && feeExpense) {
        const feeV = await AccountingService.createApproveAndPostVoucher(
          tenantId,
          {
            type: 'Journal',
            date: settlement.settlementDate,
            amount: feeNum,
            description: `Gateway fee — settlement ${settlement.externalSettlementId}`,
            source: 'gateway_settlement',
            sourceType: 'gateway_settlement_fee',
            sourceRefId: settlement.id,
            entries: [
              { accountId: feeExpense, debit: feeNum, credit: 0, narration: 'Gateway charges' },
              { accountId: clearing, debit: 0, credit: feeNum, narration: 'Clearing — fee deduction' },
            ],
          },
          { approvedByUserId: actorUserId ?? null, postedByUserId: actorUserId ?? null },
          tx
        );
        feeVoucherId = feeV.id;
      }

      const settleV = await AccountingService.createApproveAndPostVoucher(
        tenantId,
        {
          type: 'Receipt',
          date: settlement.settlementDate,
          amount: netNum,
          description: `Cashfree settlement ${settlement.externalSettlementId} → bank`,
          source: 'gateway_settlement',
          sourceType: 'gateway_settlement',
          sourceRefId: settlement.id,
          entries: [
            { accountId: bank, debit: netNum, credit: 0, narration: 'Bank — gateway settlement' },
            { accountId: clearing, debit: 0, credit: netNum, narration: 'Clearing — settlement payout' },
          ],
        },
        { approvedByUserId: actorUserId ?? null, postedByUserId: actorUserId ?? null },
        tx
      );

      await tx.gatewaySettlement.update({
        where: { id: settlement.id },
        data: {
          settlementVoucherId: settleV.id,
          feeVoucherId,
          status: 'posted',
          reconciledAt: new Date(),
        },
      });

      await tx.donation.updateMany({
        where: { tenantId, gatewaySettlementId: settlement.id },
        data: { settlementStatus: 'settled', settlementVoucherId: settleV.id },
      });

      await AccountingRepository.createFinancialAuditLog(
        tenantId,
        {
          action: 'gateway_settlement.posted',
          entityType: 'GatewaySettlement',
          entityId: settlement.id,
          actorUserId: actorUserId ?? null,
          afterJson: { settlementVoucherId: settleV.id, feeVoucherId, netAmount: netNum },
        },
        tx
      );

      return { settlementVoucherId: settleV.id, feeVoucherId };
    });
  }

  static async listPendingDonations(tenantId: string, limit = 50, offset = 0) {
    const [rows, total] = await Promise.all([
      prisma.donation.findMany({
        where: { tenantId, settlementStatus: 'pending_settlement' },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
        include: { donor: { select: { name: true } }, fund: { select: { name: true } } },
      }),
      prisma.donation.count({ where: { tenantId, settlementStatus: 'pending_settlement' } }),
    ]);
    return { rows, total, limit, offset };
  }
}
