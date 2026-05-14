import { getFinancialYearRange } from './financialYearRange.js';

/**
 * For ledger: use strict inclusive FY [start, end] when `fy=current` is selected.
 * When from/to are provided, use their intersection with the FY that contains `from` (inclusive).
 */
export function strictLedgerRange(
  financialYearStartMonth: string,
  from?: string,
  to?: string,
  useCurrentFy?: boolean
): { gte: Date; lte: Date } | undefined {
  if (useCurrentFy) {
    const { start, end } = getFinancialYearRange(financialYearStartMonth, new Date());
    return { gte: start, lte: end };
  }
  if (from && to) {
    const f = new Date(from);
    const t = new Date(to);
    if (Number.isNaN(f.getTime()) || Number.isNaN(t.getTime())) return undefined;
    const { start, end } = getFinancialYearRange(financialYearStartMonth, f);
    const gte = f < start ? start : f;
    const lte = t > end ? end : t;
    if (gte > lte) {
      return { gte, lte: new Date(gte.getTime() - 1) };
    }
    return { gte, lte };
  }
  return undefined;
}
