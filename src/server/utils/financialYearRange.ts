import { DEFAULT_SETTINGS } from '../../lib/settingsDefaults.js';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

/**
 * Inclusive [start, end] UTC-friendly local dates for the financial year containing `reference`.
 * Uses the month name from settings (e.g. April → Apr–Mar Indian FY).
 */
export function getFinancialYearRange(
  financialYearStartMonth: string,
  reference: Date = new Date()
): { start: Date; end: Date; label: string } {
  const startIdx = MONTHS.indexOf(financialYearStartMonth as (typeof MONTHS)[number]);
  const safeIdx = startIdx >= 0 ? startIdx : MONTHS.indexOf(DEFAULT_SETTINGS.financial.financialYearStart as (typeof MONTHS)[number]);
  const idx = safeIdx >= 0 ? safeIdx : 3; // April

  const m = reference.getMonth();
  const y = reference.getFullYear();
  const fyStartYear = m >= idx ? y : y - 1;
  const start = new Date(fyStartYear, idx, 1, 0, 0, 0, 0);
  const nextFyStart = new Date(fyStartYear + 1, idx, 1, 0, 0, 0, 0);
  const end = new Date(nextFyStart.getTime() - 1);
  const endY = end.getFullYear() % 100;
  const startY = fyStartYear % 100;
  return { start, end, label: `FY ${startY}-${String(endY).padStart(2, '0')}` };
}

/** Calendar year of the FY `start` date (used in voucher numbers PREFIX-YYYY-#####). */
export function getFyStartYearForDate(
  financialYearStartMonth: string,
  date: Date
): { fyStartYear: number; start: Date; end: Date } {
  const { start, end } = getFinancialYearRange(financialYearStartMonth, date);
  return { fyStartYear: start.getFullYear(), start, end };
}
