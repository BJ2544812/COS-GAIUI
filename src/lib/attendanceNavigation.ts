import type { ERPModule } from '@/types';

export const UCOS_ATTENDANCE_EVENT_ID = 'ucos_attendance_event_id';
export const UCOS_OPEN_ATTENDANCE_SESSION_ID = 'ucos_open_attendance_session_id';

/** Open Attendance with event context so new sessions inherit eventId. */
export function openAttendanceForEvent(
  onModuleChange: ((m: ERPModule, tab?: string) => void) | undefined,
  eventId: string,
  sessionId?: string,
) {
  sessionStorage.setItem(UCOS_ATTENDANCE_EVENT_ID, eventId);
  if (sessionId) {
    sessionStorage.setItem(UCOS_OPEN_ATTENDANCE_SESSION_ID, sessionId);
  }
  onModuleChange?.('attendance');
}

export function readAttendanceEventContext(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(UCOS_ATTENDANCE_EVENT_ID);
}

export function clearAttendanceEventContext() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(UCOS_ATTENDANCE_EVENT_ID);
}
