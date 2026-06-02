/** Global operational status language — use with OpsStatusBadge. */

export type OpsStatusKind =
  | 'READY'
  | 'WARNING'
  | 'BLOCKED'
  | 'ACTIVE'
  | 'PENDING'
  | 'OVERDUE'
  | 'OFFLINE'
  | 'LIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'IN_PROGRESS';

/** Church-facing badge text (internal keys unchanged for API/types). */
export const OPS_STATUS_LABELS: Record<OpsStatusKind, string> = {
  READY: 'Ready',
  WARNING: 'Needs attention',
  BLOCKED: 'Not ready',
  ACTIVE: 'Active',
  PENDING: 'Pending',
  OVERDUE: 'Overdue',
  OFFLINE: 'Offline',
  LIVE: 'Live now',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
  IN_PROGRESS: 'In progress',
};

export const OPS_STATUS_STYLES: Record<OpsStatusKind, string> = {
  READY: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  WARNING: 'bg-amber-100 text-amber-900 border-amber-200',
  BLOCKED: 'bg-rose-100 text-rose-800 border-rose-200',
  ACTIVE: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
  OVERDUE: 'bg-rose-100 text-rose-900 border-rose-300',
  OFFLINE: 'bg-slate-200 text-slate-600 border-slate-300',
  LIVE: 'bg-violet-100 text-violet-800 border-violet-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200',
  FAILED: 'bg-rose-100 text-rose-800 border-rose-200',
  IN_PROGRESS: 'bg-sky-100 text-sky-800 border-sky-200',
};

export function normalizeOpsStatus(raw: string | undefined | null): OpsStatusKind {
  const u = (raw ?? '').toUpperCase().replace(/\s+/g, '_');
  if (u in OPS_STATUS_STYLES) return u as OpsStatusKind;
  if (u === 'OPEN' || u === 'APPROVED' || u === 'REGISTRATION_OPEN') return 'ACTIVE';
  if (u === 'DRAFT' || u === 'REVIEW') return 'PENDING';
  if (u === 'PROCESSED') return 'COMPLETED';
  return 'PENDING';
}

/** Shared layout tokens for operational surfaces */
export const OPS_CARD = 'border-none shadow-sm rounded-3xl';
export const OPS_CARD_HEADER = 'border-b border-slate-50';
export const OPS_PANEL_TITLE = 'text-lg font-black text-slate-900';
export const OPS_STAT_LABEL = 'text-[9px] font-black uppercase tracking-widest text-slate-400';
export const OPS_TOUCH_BUTTON = 'min-h-[44px] min-w-[44px] touch-manipulation';
