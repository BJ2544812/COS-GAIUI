/** Standardized Socket.IO event names for operational realtime. */

export const RT = {
  NOTIFICATION_NEW: 'notification:new',
  EVENT_STATUS: 'event:status',
  SERVICE_UPDATE: 'service:update',
  WORKFLOW_UPDATE: 'workflow:update',
  VOLUNTEER_UPDATE: 'volunteer:update',
  ATTENDANCE_UPDATE: 'attendance:update',
  OPS_REFRESH: 'ops:refresh',
  PRESENCE_UPDATE: 'presence:update',
  OPS_LOCK: 'ops:lock',
} as const;

export type RealtimeScope = {
  tenantId: string;
  eventId?: string;
  serviceId?: string;
  role?: string;
};
