import { prisma } from '../utils/prisma.js';

export class DataQualityService {
  static async getOperationalReport(tenantId: string) {
    const [
      duplicateMemberPhones,
      duplicateMemberEmails,
      pendingSettlements,
      unmatchedGatewayDonations,
      donationsWithoutDonor,
      orphanGatewayOrders,
    ] = await Promise.all([
      DataQualityService.findDuplicateMemberPhones(tenantId),
      DataQualityService.findDuplicateMemberEmails(tenantId),
      prisma.donation.count({ where: { tenantId, settlementStatus: 'pending_settlement' } }),
      prisma.donation.count({
        where: { tenantId, gateway: { not: null }, reconciliationState: 'unmatched' },
      }),
      prisma.donation.count({
        where: { tenantId, donorId: null, isAnonymous: false, gateway: { not: null } },
      }),
      prisma.gatewayPaymentOrder.count({
        where: { tenantId, status: 'created', createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      duplicateMemberPhones,
      duplicateMemberEmails,
      pendingSettlements,
      unmatchedGatewayDonations,
      donationsWithoutDonor,
      staleUnpaidOrders: orphanGatewayOrders,
      warnings: [
        ...(pendingSettlements > 0
          ? [{ level: 'info' as const, code: 'PENDING_SETTLEMENT', message: `${pendingSettlements} online gift(s) await Cashfree settlement posting.` }]
          : []),
        ...(unmatchedGatewayDonations > 0
          ? [{ level: 'warn' as const, code: 'UNMATCHED_GATEWAY', message: `${unmatchedGatewayDonations} gateway donation(s) not matched to a settlement batch.` }]
          : []),
        ...(donationsWithoutDonor > 0
          ? [{ level: 'info' as const, code: 'MISSING_DONOR', message: `${donationsWithoutDonor} non-anonymous gift(s) without a linked member — review donor matching.` }]
          : []),
        ...(orphanGatewayOrders > 0
          ? [{ level: 'warn' as const, code: 'STALE_ORDERS', message: `${orphanGatewayOrders} checkout session(s) older than 24h without completion.` }]
          : []),
        ...(duplicateMemberPhones.length > 0
          ? [{ level: 'warn' as const, code: 'DUP_PHONE', message: `${duplicateMemberPhones.length} phone number(s) shared by multiple members.` }]
          : []),
        ...(duplicateMemberEmails.length > 0
          ? [{ level: 'warn' as const, code: 'DUP_EMAIL', message: `${duplicateMemberEmails.length} email(s) shared by multiple members.` }]
          : []),
      ],
    };
  }

  private static async findDuplicateMemberPhones(tenantId: string) {
    const members = await prisma.member.findMany({
      where: { tenantId, phone: { not: null } },
      select: { id: true, name: true, phone: true },
    });
    const buckets = new Map<string, typeof members>();
    for (const m of members) {
      const key = String(m.phone || '').replace(/\D/g, '').slice(-10);
      if (key.length < 10) continue;
      const list = buckets.get(key) || [];
      list.push(m);
      buckets.set(key, list);
    }
    return [...buckets.entries()]
      .filter(([, list]) => list.length > 1)
      .map(([phone, list]) => ({ phone, members: list }));
  }

  private static async findDuplicateMemberEmails(tenantId: string) {
    const members = await prisma.member.findMany({
      where: { tenantId, email: { not: null } },
      select: { id: true, name: true, email: true },
    });
    const buckets = new Map<string, typeof members>();
    for (const m of members) {
      const key = String(m.email || '').trim().toLowerCase();
      if (!key) continue;
      const list = buckets.get(key) || [];
      list.push(m);
      buckets.set(key, list);
    }
    return [...buckets.entries()]
      .filter(([, list]) => list.length > 1)
      .map(([email, list]) => ({ email, members: list }));
  }
}
