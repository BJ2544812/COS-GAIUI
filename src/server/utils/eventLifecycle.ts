/** Event lifecycle — transitions enforced in EventService only. */

export const EVENT_STATUSES = [
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'REGISTRATION_OPEN',
  'REGISTRATION_CLOSED',
  'ACTIVE',
  'COMPLETED',
  'ARCHIVED',
  'CANCELLED',
] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

const TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  DRAFT: ['REVIEW', 'CANCELLED'],
  REVIEW: ['DRAFT', 'APPROVED', 'CANCELLED'],
  APPROVED: ['REGISTRATION_OPEN', 'ACTIVE', 'CANCELLED'],
  REGISTRATION_OPEN: ['REGISTRATION_CLOSED', 'ACTIVE', 'CANCELLED'],
  REGISTRATION_CLOSED: ['REGISTRATION_OPEN', 'ACTIVE', 'CANCELLED'],
  ACTIVE: ['COMPLETED', 'CANCELLED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: [],
  CANCELLED: ['DRAFT'],
};

export function canTransitionEvent(from: string, to: string): boolean {
  const f = from as EventStatus;
  const t = to as EventStatus;
  if (!EVENT_STATUSES.includes(f) || !EVENT_STATUSES.includes(t)) return false;
  return TRANSITIONS[f].includes(t);
}

/** Domain event name emitted on transition (when applicable). */
export function domainEventForTransition(to: EventStatus): string | null {
  switch (to) {
    case 'REGISTRATION_OPEN':
      return 'RegistrationOpened';
    case 'REGISTRATION_CLOSED':
      return 'RegistrationClosed';
    case 'ACTIVE':
      return 'EventActivated';
    case 'COMPLETED':
      return 'EventCompleted';
    case 'ARCHIVED':
      return 'EventArchived';
    case 'CANCELLED':
      return 'EventCancelled';
    case 'APPROVED':
      return 'EventApproved';
    default:
      return 'EventUpdated';
  }
}
