import type { DefaultSettings } from '../../lib/settingsDefaults.js';
import { CodedError } from './apiErrors.js';

type Financial = DefaultSettings['financial'];

/** Compare by calendar date (UTC Y-M-D) for consistency. */
function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * If `lockedUntilDate` is set (ISO YYYY-MM-DD), the period through that day is locked
 * (inclusive). Posting is only allowed for voucher dates **after** that day.
 * Applies to all voucher types (including Reversal) on post.
 */
export function assertPostingNotLocked(
  financial: Financial,
  voucherDate: Date
): void {
  const raw = financial.lockedUntilDate;
  if (!raw || !String(raw).trim()) return;
  const lockStr = String(raw).trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lockStr)) {
    return;
  }
  const v = toYmd(voucherDate);
  if (v <= lockStr) {
    throw new CodedError(
      'PERIOD_LOCKED',
      `This period is locked through ${lockStr}. You cannot post a voucher with date ${v}.`
    );
  }
}
