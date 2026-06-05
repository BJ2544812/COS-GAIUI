import { prisma } from '../utils/prisma.js';

type Metric = { name: string; ms: number; extra?: Record<string, unknown> };

async function timed<T>(name: string, fn: () => Promise<T>, metrics: Metric[], extra?: Record<string, unknown>) {
  const t0 = Date.now();
  const out = await fn();
  metrics.push({ name, ms: Date.now() - t0, extra });
  return out;
}

async function main() {
  const tenantId = process.env.TENANT_ID || 'default-tenant-id';
  const targetDonations = Number(process.env.PERF_TARGET_DONATIONS || 100000);
  const chunkSize = Number(process.env.PERF_CHUNK_SIZE || 5000);
  const shouldSeed = String(process.env.PERF_SEED_DONATIONS || 'true').toLowerCase() !== 'false';
  const metrics: Metric[] = [];

  const accounts = await prisma.account.findMany({
    where: { tenantId, isActive: true },
    select: { id: true, type: true },
    take: 50,
  });
  const asset = accounts.find((a) => a.type === 'Asset');
  const revenue = accounts.find((a) => a.type === 'Revenue');
  if (!asset || !revenue) {
    throw new Error('Cannot run performance audit: missing active Asset/Revenue accounts.');
  }

  const before = await prisma.donation.count({ where: { tenantId } });
  let inserted = 0;

  if (shouldSeed && before < targetDonations) {
    const needed = targetDonations - before;
    for (let i = 0; i < needed; i += chunkSize) {
      const count = Math.min(chunkSize, needed - i);
      const now = Date.now();
      const rows = Array.from({ length: count }, (_, idx) => ({
        tenantId,
        amount: 100 + ((i + idx) % 900),
        method: 'Bank Transfer',
        date: new Date(now - (i + idx) * 60000),
        reference: `PERF-${now}-${i + idx}-${Math.random().toString(36).slice(2, 8)}`,
        voucherId: null as string | null,
        fundId: null as string | null,
        donorId: null as string | null,
        campaignId: null as string | null,
        source: 'performance_audit',
        sourceRefId: null as string | null,
        gatewayPaymentId: null as string | null,
        status: 'Recorded',
      }));
      await timed(
        `seed.createMany.${i / chunkSize + 1}`,
        async () =>
          prisma.donation.createMany({
            data: rows,
          }),
        metrics,
        { count },
      );
      inserted += count;
    }
  }

  const after = await prisma.donation.count({ where: { tenantId } });

  const voucherCount = await timed('count.vouchers', () => prisma.voucher.count({ where: { tenantId } }), metrics);
  const donationCount = await timed('count.donations', () => prisma.donation.count({ where: { tenantId } }), metrics);

  await timed(
    'query.trial-balance-shape',
    async () =>
      prisma.$queryRawUnsafe(
        `
        SELECT a.id, a.code, a.name, a.type,
               COALESCE(SUM(je.debit), 0) AS debit,
               COALESCE(SUM(je.credit), 0) AS credit
        FROM "Account" a
        LEFT JOIN "JournalEntry" je ON je."accountId" = a.id
        LEFT JOIN "Voucher" v ON v.id = je."voucherId" AND v.status = 'posted'
        WHERE a."tenantId" = $1
        GROUP BY a.id, a.code, a.name, a.type
        ORDER BY a.code
        `,
        tenantId,
      ),
    metrics,
  );

  await timed(
    'query.large-ledger-window',
    async () =>
      prisma.journalEntry.findMany({
        where: { tenantId, accountId: asset.id, voucher: { status: 'posted' } },
        include: { voucher: true },
        orderBy: [{ voucher: { date: 'desc' } }],
        take: 5000,
      }),
    metrics,
  );

  await timed(
    'query.donation-export-window',
    async () =>
      prisma.donation.findMany({
        where: { tenantId },
        orderBy: { date: 'desc' },
        take: 50000,
        select: {
          id: true,
          amount: true,
          date: true,
          reference: true,
          method: true,
          status: true,
        },
      }),
    metrics,
  );

  await timed(
    'query.reconciliation-candidates',
    async () =>
      prisma.journalEntry.findMany({
        where: {
          tenantId,
          accountId: asset.id,
          voucher: { status: 'posted' },
        },
        orderBy: [{ voucher: { date: 'desc' } }],
        take: 15000,
        select: { id: true, debit: true, credit: true, voucherId: true, voucher: { select: { date: true } } },
      }),
    metrics,
  );

  console.log(
    JSON.stringify(
      {
        tenantId,
        dataset: {
          donationsBefore: before,
          donationsAfter: after,
          inserted,
          targetDonations,
          vouchers: voucherCount,
          donations: donationCount,
        },
        metrics,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

