import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';

export class GatewayRepository {
  static async upsertPaymentOrder(
    tenantId: string,
    data: {
      gateway: string;
      externalOrderId: string;
      donationAmount: Prisma.Decimal;
      grossAmount: Prisma.Decimal;
      gatewayFeeAmount: Prisma.Decimal;
      donorCoveredFee: boolean;
      currency?: string;
      donorName?: string | null;
      donorPhone?: string | null;
      donorEmail?: string | null;
      donorId?: string | null;
      donationCategory?: string | null;
      fundId?: string | null;
      campaignId?: string | null;
      eventId?: string | null;
      serviceCollectionSessionId?: string | null;
      isAnonymous?: boolean;
      metadataJson?: string | null;
    }
  ) {
    return prisma.gatewayPaymentOrder.upsert({
      where: {
        tenantId_gateway_externalOrderId: {
          tenantId,
          gateway: data.gateway,
          externalOrderId: data.externalOrderId,
        },
      },
      create: { tenantId, status: 'created', ...data },
      update: {
        donationAmount: data.donationAmount,
        grossAmount: data.grossAmount,
        gatewayFeeAmount: data.gatewayFeeAmount,
        donorCoveredFee: data.donorCoveredFee,
        donorName: data.donorName,
        donorPhone: data.donorPhone,
        donorEmail: data.donorEmail,
        donorId: data.donorId,
        donationCategory: data.donationCategory,
        fundId: data.fundId,
        campaignId: data.campaignId,
        eventId: data.eventId,
        serviceCollectionSessionId: data.serviceCollectionSessionId,
        isAnonymous: data.isAnonymous,
        metadataJson: data.metadataJson,
      },
    });
  }

  static async getPaymentOrderByExternalId(tenantId: string, gateway: string, externalOrderId: string) {
    return prisma.gatewayPaymentOrder.findFirst({
      where: { tenantId, gateway, externalOrderId },
    });
  }

  static async markOrderPaid(tenantId: string, orderId: string) {
    return prisma.gatewayPaymentOrder.update({
      where: { id: orderId, tenantId },
      data: { status: 'paid' },
    });
  }

  static async createSettlement(
    tenantId: string,
    data: {
      gateway: string;
      externalSettlementId: string;
      settlementDate: Date;
      grossAmount: Prisma.Decimal;
      feeAmount: Prisma.Decimal;
      netAmount: Prisma.Decimal;
      bankReference?: string | null;
      notes?: string | null;
    }
  ) {
    return prisma.gatewaySettlement.create({
      data: { tenantId, status: 'imported', ...data },
    });
  }

  static async findSettlementByExternalId(tenantId: string, gateway: string, externalSettlementId: string) {
    return prisma.gatewaySettlement.findFirst({
      where: { tenantId, gateway, externalSettlementId },
      include: { lines: true, donations: true },
    });
  }

  static async getReconciliationDashboard(tenantId: string) {
    const [pendingSettlement, unmatchedDonations, recentSettlements, mismatches] = await Promise.all([
      prisma.donation.count({
        where: { tenantId, settlementStatus: 'pending_settlement', gateway: { not: null } },
      }),
      prisma.donation.count({
        where: { tenantId, reconciliationState: 'unmatched', gateway: { not: null } },
      }),
      prisma.gatewaySettlement.findMany({
        where: { tenantId },
        orderBy: { settlementDate: 'desc' },
        take: 10,
      }),
      prisma.gatewaySettlementLine.count({
        where: { tenantId, matchStatus: 'mismatch' },
      }),
    ]);
    return { pendingSettlement, unmatchedDonations, recentSettlements, mismatchLines: mismatches };
  }

  static async listServiceSessions(tenantId: string, limit = 20) {
    return prisma.serviceCollectionSession.findMany({
      where: { tenantId },
      orderBy: { serviceDate: 'desc' },
      take: limit,
      include: {
        donations: {
          select: {
            id: true,
            amount: true,
            grossAmount: true,
            donorId: true,
            isAnonymous: true,
            settlementStatus: true,
            gatewayPaymentId: true,
          },
        },
      },
    });
  }

  static async createServiceSession(tenantId: string, data: { name: string; serviceDate: Date; notes?: string }) {
    return prisma.serviceCollectionSession.create({
      data: { tenantId, name: data.name, serviceDate: data.serviceDate, notes: data.notes },
    });
  }
}
