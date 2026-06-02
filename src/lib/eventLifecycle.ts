export const EVENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  REVIEW: 'In review',
  APPROVED: 'Approved',
  REGISTRATION_OPEN: 'Registration open',
  REGISTRATION_CLOSED: 'Registration closed',
  ACTIVE: 'Live',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
  CANCELLED: 'Cancelled',
};

export const EVENT_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  REVIEW: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  REGISTRATION_OPEN: 'bg-emerald-100 text-emerald-800',
  REGISTRATION_CLOSED: 'bg-slate-100 text-slate-600',
  ACTIVE: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-violet-100 text-violet-800',
  ARCHIVED: 'bg-slate-50 text-slate-500',
  CANCELLED: 'bg-rose-100 text-rose-800',
};

export type RunSheetSegment = {
  id: string;
  time: string;
  duration: string;
  item: string;
  segmentType?: string;
  media?: string;
  owner?: string;
  notes?: string;
};

export function defaultRunSheet(): RunSheetSegment[] {
  return [
    { id: '1', time: '09:00', duration: '05:00', item: 'Pre-service', segmentType: 'media', media: 'Hold slide', owner: 'Media' },
    { id: '2', time: '09:05', duration: '10:00', item: 'Worship', segmentType: 'worship', media: 'Charts', owner: 'Worship lead' },
    { id: '3', time: '09:15', duration: '03:00', item: 'Announcements', segmentType: 'announcements', owner: 'Host' },
    { id: '4', time: '09:18', duration: '12:00', item: 'Message', segmentType: 'sermon', owner: 'Speaker' },
    { id: '5', time: '09:30', duration: '05:00', item: 'Closing', segmentType: 'prayer', owner: 'Worship' },
  ];
}
