/** Church-friendly status labels aligned with workspace pipeline stages */
export const EVENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  REVIEW: 'Draft',
  APPROVED: 'Published',
  REGISTRATION_OPEN: 'Published',
  REGISTRATION_CLOSED: 'Published',
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
  CANCELLED: 'Cancelled',
};

export const WORKFLOW_PIPELINE_STAGES: { label: string; statuses: string[] }[] = [
  { label: 'Draft', statuses: ['DRAFT', 'REVIEW'] },
  { label: 'Published', statuses: ['APPROVED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED'] },
  { label: 'Active', statuses: ['ACTIVE'] },
  { label: 'Completed', statuses: ['COMPLETED'] },
  { label: 'Archived', statuses: ['ARCHIVED', 'CANCELLED'] },
];

const WORKFLOW_TRANSITION_LABELS: Record<string, string> = {
  APPROVED: 'Move to Published',
  ACTIVE: 'Move to Active',
  COMPLETED: 'Move to Completed',
  ARCHIVED: 'Move to Archived',
  DRAFT: 'Return to Draft',
  CANCELLED: 'Cancel event',
};

export function workflowStageIndex(status: string): number {
  const idx = WORKFLOW_PIPELINE_STAGES.findIndex((s) => s.statuses.includes(status));
  return idx >= 0 ? idx : 0;
}

export function workflowTransitionButtonLabel(targetStatus: string): string {
  return WORKFLOW_TRANSITION_LABELS[targetStatus] ?? `Move to ${EVENT_STATUS_LABELS[targetStatus] ?? targetStatus}`;
}

/** Church pipeline actions — never expose backend status names in buttons */
export function workflowActionsForStatus(status: string): Array<{ target: string; label: string }> {
  const stage = workflowStageIndex(status);
  const actions: Array<{ target: string; label: string }> = [];

  if (stage === 0) {
    if (status === 'REVIEW') {
      actions.push({ target: 'APPROVED', label: 'Move to Published' });
      actions.push({ target: 'DRAFT', label: 'Return to Draft' });
    } else {
      actions.push({ target: 'APPROVED', label: 'Move to Published' });
    }
  } else if (stage === 1) {
    actions.push({ target: 'ACTIVE', label: 'Move to Active' });
    actions.push({ target: 'DRAFT', label: 'Return to Draft' });
  } else if (stage === 2) {
    actions.push({ target: 'COMPLETED', label: 'Move to Completed' });
    actions.push({ target: 'APPROVED', label: 'Return to Published' });
  } else if (stage === 3) {
    actions.push({ target: 'ARCHIVED', label: 'Move to Archived' });
  }

  return actions;
}

export const ATTENDANCE_SESSION_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  CLOSED: 'Closed',
  DRAFT: 'Draft',
};

export function attendanceSessionStatusLabel(status: string): string {
  return ATTENDANCE_SESSION_STATUS_LABELS[status] ?? status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

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
