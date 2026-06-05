/**
 * Calendar-date helpers — always store DOB/membership dates at noon UTC to avoid timezone day shifts.
 */

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Convert YYYY-MM-DD (or ISO string) to ISO timestamp at 12:00 UTC. */
export function parseDateOnlyToISO(input: string | null | undefined): string | null {
  if (input == null || input === '') return null;
  const raw = String(input).trim();
  const datePart = raw.length >= 10 ? raw.slice(0, 10) : raw;
  if (DATE_ONLY_RE.test(datePart)) {
    return new Date(`${datePart}T12:00:00.000Z`).toISOString();
  }
  try {
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

/** Value for `<input type="date">` from stored ISO. */
export function dateOnlyInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Human-readable calendar date without timezone drift. */
export function formatDateOnlyDisplay(iso: string | null | undefined, locale: 'en-IN' | 'en-US' = 'en-IN'): string {
  if (!iso) return '—';
  const datePart = iso.slice(0, 10);
  if (!DATE_ONLY_RE.test(datePart)) {
    try {
      return new Date(iso).toLocaleDateString(locale === 'en-IN' ? 'en-IN' : 'en-US', {
        timeZone: 'UTC',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  }
  const [y, m, d] = datePart.split('-').map(Number);
  if (!y || !m || !d) return '—';
  if (locale === 'en-IN') {
    return `${d} ${MONTHS[m - 1]} ${y}`;
  }
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}
