import { prisma } from '../utils/prisma.js';
import { Prisma } from '@prisma/client';

export class GivingRepository {
  static async createCampaign(tenantId: string, data: Prisma.CampaignCreateInput) {
    return prisma.campaign.create({
      data: {
        ...data,
        tenant: { connect: { id: tenantId } },
      },
    });
  }

  static async getCampaigns(tenantId: string) {
    return prisma.campaign.findMany({ where: { tenantId } });
  }

  static async createDonation(tenantId: string, data: any) {
    const { donorId, campaignId, memberId, allocation, ...rest } = data;
    
    const cleanData: any = {
      amount: rest.amount,
      method: rest.method,
      date: rest.date,
      reference: rest.reference,
      source: rest.source,
      sourceRefId: rest.sourceRefId,
      gatewayPaymentId: rest.gatewayPaymentId,
      status: rest.status ?? 'Recorded',
      notes: rest.notes,
      metadata: rest.metadata,
      tenant: { connect: { id: tenantId } },
    };

    const finalDonorId = (donorId === 'anonymous' || memberId === 'anonymous') ? null : (donorId || memberId);
    const finalCampaignId = (campaignId === 'general' || allocation === 'general') ? null : (campaignId || allocation);

    if (finalDonorId && finalDonorId !== 'null') cleanData.donor = { connect: { id: finalDonorId } };
    if (finalCampaignId && finalCampaignId !== 'null') cleanData.campaign = { connect: { id: finalCampaignId } };
    if (rest.fundId) cleanData.fund = { connect: { id: rest.fundId } };
    if (rest.voucherId) cleanData.voucher = { connect: { id: rest.voucherId } };
    if (rest.reversalVoucherId) cleanData.reversalVoucher = { connect: { id: rest.reversalVoucherId } };

    return prisma.donation.create({
      data: cleanData,
    });
  }

  static async createDonationTx(
    tx: Prisma.TransactionClient,
    tenantId: string,
    data: any
  ) {
    const { donorId, campaignId, memberId, allocation, ...rest } = data;
    
    const cleanData: any = {
      amount: rest.amount,
      grossAmount: rest.grossAmount,
      netSettlementAmount: rest.netSettlementAmount,
      gatewayFeeAmount: rest.gatewayFeeAmount,
      donorCoveredFee: rest.donorCoveredFee,
      method: rest.method,
      date: rest.date,
      reference: rest.reference,
      source: rest.source,
      sourceRefId: rest.sourceRefId,
      gateway: rest.gateway,
      gatewayOrderId: rest.gatewayOrderId,
      gatewayPaymentId: rest.gatewayPaymentId,
      donationCategory: rest.donationCategory,
      isAnonymous: rest.isAnonymous,
      settlementStatus: rest.settlementStatus,
      reconciliationState: rest.reconciliationState,
      status: rest.status ?? 'Recorded',
      notes: rest.notes,
      tenant: { connect: { id: tenantId } },
    };

    const finalDonorId = (donorId === 'anonymous' || memberId === 'anonymous') ? null : (donorId || memberId);
    const finalCampaignId = (campaignId === 'general' || allocation === 'general') ? null : (campaignId || allocation);

    if (finalDonorId && finalDonorId !== 'null') cleanData.donor = { connect: { id: finalDonorId } };
    if (finalCampaignId && finalCampaignId !== 'null') cleanData.campaign = { connect: { id: finalCampaignId } };
    if (rest.fundId) cleanData.fund = { connect: { id: rest.fundId } };
    if (rest.eventId) cleanData.event = { connect: { id: rest.eventId } };
    if (rest.gatewayPaymentOrderId) cleanData.gatewayPaymentOrder = { connect: { id: rest.gatewayPaymentOrderId } };
    if (rest.serviceCollectionSessionId) cleanData.serviceCollectionSession = { connect: { id: rest.serviceCollectionSessionId } };
    if (rest.voucherId) cleanData.voucher = { connect: { id: rest.voucherId } };
    if (rest.reversalVoucherId) cleanData.reversalVoucher = { connect: { id: rest.reversalVoucherId } };

    return tx.donation.create({
      data: cleanData,
    });
  }

  static async getDonations(tenantId: string, opts?: { limit?: number; offset?: number; search?: string; fundId?: string; campaignId?: string; method?: string }) {
    const where: any = { tenantId };
    if (opts?.fundId) where.fundId = opts.fundId;
    if (opts?.campaignId) where.campaignId = opts.campaignId;
    if (opts?.method) where.method = { equals: opts.method, mode: 'insensitive' };
    if (opts?.search) {
      where.OR = [
        { donor: { name: { contains: opts.search, mode: 'insensitive' } } },
        { reference: { contains: opts.search, mode: 'insensitive' } },
      ];
    }
    const limit = Math.min(opts?.limit ?? 100, 500);
    const offset = opts?.offset ?? 0;
    const [rows, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        include: { donor: true, campaign: true, fund: true, voucher: true, reversalVoucher: true },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.donation.count({ where }),
    ]);
    return { rows, total, limit, offset };
  }

  static async findByReference(tenantId: string, reference: string) {
    return prisma.donation.findFirst({
      where: { tenantId, reference: { equals: reference, mode: 'insensitive' } },
      include: { donor: true, campaign: true, fund: true, voucher: true, reversalVoucher: true },
    });
  }

  static async findById(tenantId: string, donationId: string) {
    return prisma.donation.findFirst({
      where: { tenantId, id: donationId },
      include: { donor: true, campaign: true, fund: true, voucher: true, reversalVoucher: true },
    });
  }

  static async createFinancialReceipt(
    tx: Prisma.TransactionClient,
    tenantId: string,
    data: {
      receiptNo: string;
      donationId: string;
      voucherId?: string | null;
      amount: Prisma.Decimal;
      donorName: string;
      donorEmail?: string | null;
      donorPhone?: string | null;
      fundId?: string | null;
      campaignId?: string | null;
      eightyGEligible?: boolean;
      pdfUrl?: string | null;
      pdfChecksumSha256?: string | null;
    }
  ) {
    return tx.financialReceipt.create({
      data: {
        tenantId,
        receiptNo: data.receiptNo,
        donationId: data.donationId,
        voucherId: data.voucherId ?? null,
        amount: data.amount,
        donorName: data.donorName,
        donorEmail: data.donorEmail ?? null,
        donorPhone: data.donorPhone ?? null,
        fundId: data.fundId ?? null,
        campaignId: data.campaignId ?? null,
        eightyGEligible: data.eightyGEligible ?? false,
        pdfUrl: data.pdfUrl ?? null,
        pdfChecksumSha256: data.pdfChecksumSha256 ?? null,
      },
    });
  }

  static async getFinancialReceiptByDonation(tenantId: string, donationId: string) {
    return prisma.financialReceipt.findFirst({
      where: { tenantId, donationId },
    });
  }

  static async getFinancialReceiptById(tenantId: string, id: string) {
    return prisma.financialReceipt.findFirst({
      where: { tenantId, id },
      include: { donation: true, voucher: true, fund: true, campaign: true },
    });
  }

  static async listFinancialReceipts(
    tenantId: string,
    opts?: {
      limit?: number;
      offset?: number;
      search?: string;
      fundId?: string;
      campaignId?: string;
      from?: Date;
      to?: Date;
    }
  ) {
    const where: Prisma.FinancialReceiptWhereInput = { tenantId };
    if (opts?.fundId) where.fundId = opts.fundId;
    if (opts?.campaignId) where.campaignId = opts.campaignId;
    if (opts?.from || opts?.to) {
      where.issueDate = {
        ...(opts.from ? { gte: opts.from } : {}),
        ...(opts.to ? { lte: opts.to } : {}),
      };
    }
    if (opts?.search?.trim()) {
      const q = opts.search.trim();
      where.OR = [
        { receiptNo: { contains: q, mode: 'insensitive' } },
        { donorName: { contains: q, mode: 'insensitive' } },
        { donorEmail: { contains: q, mode: 'insensitive' } },
      ];
    }
    const limit = Math.min(opts?.limit ?? 50, 200);
    const offset = opts?.offset ?? 0;
    const [rows, total] = await Promise.all([
      prisma.financialReceipt.findMany({
        where,
        include: { donation: true, voucher: { select: { voucherNo: true, status: true } }, fund: true, campaign: true },
        orderBy: { issueDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.financialReceipt.count({ where }),
    ]);
    return { rows, total, limit, offset };
  }

  static async reserveNextReceiptSequence(tx: Prisma.TransactionClient, tenantId: string, fyStartYear: number): Promise<number> {
    const rows = await tx.$queryRaw<{ lastSeq: number }[]>`
      INSERT INTO "ReceiptFySequence" ("id", "tenantId", "fyStartYear", "lastSeq", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${tenantId}, ${fyStartYear}, 1, NOW(), NOW())
      ON CONFLICT ("tenantId", "fyStartYear")
      DO UPDATE SET
        "lastSeq" = "ReceiptFySequence"."lastSeq" + 1,
        "updatedAt" = NOW()
      RETURNING "lastSeq"
    `;
    const n = rows[0]?.lastSeq;
    if (n === undefined || n === null) throw new Error('Receipt sequence reservation failed');
    return Number(n);
  }
}
