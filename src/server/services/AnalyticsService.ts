import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';

const DROP_THRESHOLD_PCT = 10;

function dec(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'object' && v !== null && 'toNumber' in (v as object)) {
    return (v as Prisma.Decimal).toNumber();
  }
  return Number(v);
}

function utcNow(): Date {
  return new Date();
}

/** Inclusive start of calendar month (UTC), n=0 current, n=1 previous, ... */
function utcMonthStart(offsetFromCurrent: number): Date {
  const n = utcNow();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth() - offsetFromCurrent, 1, 0, 0, 0, 0));
}

/** First instant of next month after the given month start. */
function utcNextMonthStart(monthStart: Date): Date {
  return new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

function ytdStartUtc(now: Date): Date {
  // Financial Year in India: April 1st
  let year = now.getUTCFullYear();
  if (now.getUTCMonth() < 3) year--; // If Jan-Mar, FY started last year
  return new Date(Date.UTC(year, 3, 1, 0, 0, 0, 0));
}

function formatMonthKey(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function monthStartsForLast6(): Date[] {
  const out: Date[] = [];
  for (let i = 5; i >= 0; i--) {
    out.push(utcMonthStart(i));
  }
  return out;
}

export type AnalyticsPeriod = 'this_month' | 'last_month' | 'last_3_months' | 'this_fy';

function getPeriodDates(period: AnalyticsPeriod): { start: Date; end: Date } {
  const now = utcNow();
  switch (period) {
    case 'last_month': {
      const start = utcMonthStart(1);
      const end = utcMonthStart(0);
      return { start, end };
    }
    case 'last_3_months': {
      const start = utcMonthStart(3);
      const end = utcNextMonthStart(utcMonthStart(0));
      return { start, end };
    }
    case 'this_fy': {
      const start = ytdStartUtc(now);
      const end = new Date(start.getTime());
      end.setUTCFullYear(start.getUTCFullYear() + 1);
      return { start, end };
    }
    case 'this_month':
    default: {
      const start = utcMonthStart(0);
      const end = utcNextMonthStart(start);
      return { start, end };
    }
  }
}

export class AnalyticsService {
  /** Giving + fund mix from `Donation` (real rows only). */
  static async getFinancial(tenantId: string, periodKey: AnalyticsPeriod = 'this_month') {
    const { start, end } = getPeriodDates(periodKey);
    const duration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - duration);
    const prevEnd = start;

    const now = utcNow();
    const fyStart = ytdStartUtc(now);
    const fyEnd = new Date(fyStart.getTime());
    fyEnd.setUTCFullYear(fyStart.getUTCFullYear() + 1);

    const sixMonthStart = utcMonthStart(5);
    const afterLast6 = utcNextMonthStart(utcMonthStart(0));

    const [
      periodAgg,
      prevPeriodAgg,
      fyAgg,
      monthlyRows,
      fundGroups,
      prevFundGroups,
      topDonors,
    ] = await Promise.all([
      prisma.donation.aggregate({
        where: { tenantId, date: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
      prisma.donation.aggregate({
        where: { tenantId, date: { gte: prevStart, lt: prevEnd } },
        _sum: { amount: true },
      }),
      prisma.donation.aggregate({
        where: { tenantId, date: { gte: fyStart, lt: fyEnd } },
        _sum: { amount: true },
      }),
      prisma.$queryRaw<{ month_bucket: Date; total: Prisma.Decimal }[]>`
        SELECT
          date_trunc('month', d.date)::date AS month_bucket,
          COALESCE(SUM(d.amount), 0) AS total
        FROM "Donation" d
        WHERE d."tenantId" = ${tenantId}
          AND d.date >= ${sixMonthStart}
          AND d.date < ${afterLast6}
        GROUP BY date_trunc('month', d.date)
        ORDER BY month_bucket ASC
      `,
      prisma.donation.groupBy({
        by: ['campaignId'],
        where: { tenantId, date: { gte: start, lt: end } },
        _sum: { amount: true },
      }),
      prisma.donation.groupBy({
        by: ['campaignId'],
        where: { tenantId, date: { gte: prevStart, lt: prevEnd } },
        _sum: { amount: true },
      }),
      prisma.donation.groupBy({
        by: ['donorId'],
        where: {
          tenantId,
          date: { gte: start, lt: end },
          donorId: { not: null }
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5
      }),
    ]);

    const totalPeriod = dec(periodAgg._sum.amount);
    const totalPreviousPeriod = dec(prevPeriodAgg._sum.amount);
    const totalFy = dec(fyAgg._sum.amount);
    const givingChangePercent =
      totalPreviousPeriod > 0
        ? ((totalPeriod - totalPreviousPeriod) / totalPreviousPeriod) * 100
        : totalPeriod > 0
          ? 100
          : 0;
    
    const byMonth = new Map<string, number>();
    for (const r of monthlyRows) {
      const key = formatMonthKey(new Date(r.month_bucket));
      byMonth.set(key, dec(r.total));
    }

    const trend = monthStartsForLast6().map((ms) => {
      const key = formatMonthKey(ms);
      return { month: key, monthStart: ms.toISOString(), total: byMonth.get(key) ?? 0 };
    });

    // Resolve campaign names
    const campaignIds = fundGroups.map((g) => g.campaignId).filter((id): id is string => id != null);
    const campaigns = campaignIds.length > 0
        ? await prisma.campaign.findMany({
            where: { tenantId, id: { in: campaignIds } },
            select: { id: true, name: true },
          })
        : [];
    const campaignNameById = new Map(campaigns.map((c) => [c.id, c.name]));

    const prevFundMap = new Map<string | null, number>();
    prevFundGroups.forEach(g => prevFundMap.set(g.campaignId, dec(g._sum.amount)));

    const fundDistribution = fundGroups.map((g) => {
      const amt = dec(g._sum.amount);
      const prevAmt = prevFundMap.get(g.campaignId) ?? 0;
      return {
        campaignId: g.campaignId,
        label: g.campaignId ? (campaignNameById.get(g.campaignId) ?? 'Fund') : 'Tithes & General',
        amount: amt,
        percent: totalPeriod > 0 ? (amt / totalPeriod) * 100 : 0,
        changePercent: prevAmt > 0 ? ((amt - prevAmt) / prevAmt) * 100 : amt > 0 ? 100 : 0
      };
    });

    // Resolve donor names
    const donorIds = topDonors.map((g) => g.donorId).filter((id): id is string => id != null);
    const donors = donorIds.length > 0
        ? await prisma.member.findMany({
            where: { tenantId, id: { in: donorIds } },
            select: { id: true, name: true },
          })
        : [];
    const donorNameById = new Map(donors.map((d) => [d.id, d.name]));

    const donorList = topDonors.map((g) => {
       const amt = dec(g._sum.amount);
       return {
          id: g.donorId,
          name: donorNameById.get(g.donorId!) ?? 'Anonymous Donor',
          amount: amt,
          percent: totalPeriod > 0 ? (amt / totalPeriod) * 100 : 0
       };
    });

    return {
      period: { start: start.toISOString(), end: end.toISOString(), key: periodKey },
      totalGiving: {
        period: totalPeriod,
        previousPeriod: totalPreviousPeriod,
        changePercent: Math.round(givingChangePercent * 10) / 10,
        fyToDate: totalFy,
      },
      trendLast6Months: trend,
      fundDistribution,
      topDonors: donorList
    };
  }

  static async getMembers(tenantId: string, periodKey: AnalyticsPeriod = 'this_month') {
    const { start, end } = getPeriodDates(periodKey);
    const [statusGroups, newCount, total] = await Promise.all([
      prisma.member.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true },
      }),
      prisma.member.count({
        where: { tenantId, createdAt: { gte: start, lt: end } },
      }),
      prisma.member.count({ where: { tenantId } }),
    ]);

    let active = 0;
    let inactive = 0;
    for (const row of statusGroups) {
      if (row.status === 'Active') active = row._count._all;
      else inactive += row._count._all;
    }

    const duration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - duration);
    const prevCount = await prisma.member.count({
       where: { tenantId, createdAt: { gte: prevStart, lt: start } }
    });

    const growthRatePercent = prevCount === 0 ? (newCount > 0 ? 100 : 0) : ((newCount - prevCount) / prevCount) * 100;

    return {
      period: { start: start.toISOString(), end: end.toISOString(), key: periodKey },
      total,
      active,
      inactive,
      newMembers: {
        period: newCount,
        previousPeriod: prevCount,
        growthRatePercent,
      },
    };
  }

  static async getAttendance(tenantId: string, periodKey: AnalyticsPeriod = 'this_month') {
    const { start, end } = getPeriodDates(periodKey);
    const sixMonthStart = utcMonthStart(5);
    const afterLast6 = utcNextMonthStart(utcMonthStart(0));

    const [monthlyRows, periodAgg] = await Promise.all([
      prisma.$queryRaw<{ month_bucket: Date; total_count: bigint; distinct_events: bigint }[]>`
        SELECT
          date_trunc('month', a."checkInTime")::date AS month_bucket,
          COUNT(*)::bigint AS total_count,
          COUNT(DISTINCT COALESCE(s."eventId", s.id))::bigint AS distinct_events
        FROM "Attendance" a
        INNER JOIN "AttendanceSession" s ON s.id = a."sessionId"
        WHERE a."tenantId" = ${tenantId}
          AND a."checkInTime" >= ${sixMonthStart}
          AND a."checkInTime" < ${afterLast6}
        GROUP BY date_trunc('month', a."checkInTime")
        ORDER BY month_bucket ASC
      `,
      prisma.$queryRaw<{ total: bigint; events: bigint }[]>`
        SELECT
          COALESCE(COUNT(*), 0)::bigint AS total,
          COUNT(DISTINCT COALESCE(s."eventId", s.id))::bigint AS events
        FROM "Attendance" a
        INNER JOIN "AttendanceSession" s ON s.id = a."sessionId"
        WHERE a."tenantId" = ${tenantId}
          AND a."checkInTime" >= ${start}
          AND a."checkInTime" < ${end}
      `,
    ]);

    const byMonth = new Map<string, { totalCount: number; distinctEvents: number; avgPerEvent: number }>();
    for (const r of monthlyRows) {
      const key = formatMonthKey(new Date(r.month_bucket));
      const te = Number(r.total_count);
      const de = Number(r.distinct_events);
      byMonth.set(key, {
        totalCount: te,
        distinctEvents: de,
        avgPerEvent: de > 0 ? te / de : 0,
      });
    }

    const trend = monthStartsForLast6().map((ms) => {
      const key = formatMonthKey(ms);
      const v = byMonth.get(key) ?? { totalCount: 0, distinctEvents: 0, avgPerEvent: 0 };
      return { month: key, monthStart: ms.toISOString(), ...v };
    });

    const p = periodAgg[0];
    const total = p ? Number(p.total) : 0;
    const events = p ? Number(p.events) : 0;
    const avg = events > 0 ? total / events : 0;

    const duration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - duration);
    const priorAgg = await prisma.$queryRaw<{ total: bigint; events: bigint }[]>`
        SELECT
          COALESCE(COUNT(*), 0)::bigint AS total,
          COUNT(DISTINCT COALESCE(s."eventId", s.id))::bigint AS events
        FROM "Attendance" a
        INNER JOIN "AttendanceSession" s ON s.id = a."sessionId"
        WHERE a."tenantId" = ${tenantId}
          AND a."checkInTime" >= ${prevStart}
          AND a."checkInTime" < ${start}
    `;
    const pa = priorAgg[0];
    const priorTotal = pa ? Number(pa.total) : 0;
    const priorEv = pa ? Number(pa.events) : 0;
    const priorAvg = priorEv > 0 ? priorTotal / priorEv : 0;

    const dropPercent = priorAvg > 0 ? ((priorAvg - avg) / priorAvg) * 100 : 0;

    return {
      period: { start: start.toISOString(), end: end.toISOString(), key: periodKey },
      periodStats: { totalCount: total, events, average: avg },
      priorStats: { totalCount: priorTotal, events: priorEv, average: priorAvg },
      trendLast6Months: trend,
      dropDetection: {
        dropPercent,
        isSignal: priorAvg > 0 && dropPercent >= DROP_THRESHOLD_PCT && events >= 1,
        thresholdPercent: DROP_THRESHOLD_PCT,
      },
    };
  }

  static async getRiskSignals(tenantId: string) {
    const now = utcNow();
    const t30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const t60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    const [givingRows, attendanceRows, memberByStatus, largeTransactions] = await Promise.all([
      prisma.$queryRaw<{ recent: Prisma.Decimal; prior: Prisma.Decimal }[]>`
        SELECT
          COALESCE(SUM(d.amount) FILTER (WHERE d.date >= ${t30}), 0) AS recent,
          COALESCE(SUM(d.amount) FILTER (WHERE d.date >= ${t60} AND d.date < ${t30}), 0) AS prior
        FROM "Donation" d
        WHERE d."tenantId" = ${tenantId} AND d.date >= ${t60}
      `,
      prisma.$queryRaw<{ recent: bigint; prior: bigint }[]>`
        SELECT
          COALESCE(COUNT(*) FILTER (WHERE a."checkInTime" >= ${t30}), 0)::bigint AS recent,
          COALESCE(COUNT(*) FILTER (WHERE a."checkInTime" >= ${t60} AND a."checkInTime" < ${t30}), 0)::bigint AS prior
        FROM "Attendance" a
        WHERE a."tenantId" = ${tenantId} AND a."checkInTime" >= ${t60}
      `,
      prisma.member.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true },
      }),
      prisma.donation.findMany({
         where: { tenantId, amount: { gte: 50000 }, date: { gte: t30 } },
         orderBy: { date: 'desc' },
         take: 3
      })
    ]);

    const g0 = givingRows[0];
    const a0 = attendanceRows[0];
    const recentG = g0 ? dec(g0.recent) : 0;
    const priorG = g0 ? dec(g0.prior) : 0;
    const recentA = a0 ? Number(a0.recent) : 0;
    const priorA = a0 ? Number(a0.prior) : 0;

    const givingChangePct = priorG > 0 ? ((recentG - priorG) / priorG) * 100 : 0;
    const attendanceChangePct = priorA > 0 ? ((recentA - priorA) / priorA) * 100 : 0;

    let activeCount = 0;
    let inactiveCount = 0;
    for (const r of memberByStatus) {
      if (r.status === 'Active') activeCount = r._count._all;
      else inactiveCount += r._count._all;
    }

    return {
      period: { windowDays: 30, comparedAt: now.toISOString() },
      giving: { changePercent: givingChangePct, isDropSignal: priorG > 0 && recentG < priorG * 0.9 },
      attendance: { changePercent: attendanceChangePct, isDropSignal: priorA > 0 && recentA < priorA * 0.9 },
      members: {
        inactiveCount,
        activeCount,
        churnRate: (activeCount + inactiveCount) > 0 ? (inactiveCount / (activeCount + inactiveCount)) * 100 : 0
      },
      largeTransactions: largeTransactions.map(t => ({
         id: t.id,
         amount: dec(t.amount),
         date: t.date.toISOString(),
         method: t.method
      }))
    };
  }
}
