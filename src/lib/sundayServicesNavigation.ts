import type { ERPModule } from '@/types';

export type SundayServicesTab = 'this-sunday' | 'schedule' | 'plan';

export const UCOS_SUNDAY_SERVICES_TAB = 'ucos_sunday_services_tab';
export const UCOS_OPEN_SERVICE_EVENT_ID = 'ucos_open_service_event_id';
export const UCOS_LIVE_SERVICE_ID = 'ucos_live_service_id';
export const UCOS_OPEN_EVENT_ID = 'ucos_open_event_id';
/** @deprecated Events services tab — redirects to Sunday & Services */
export const UCOS_EVENTS_ACTIVE_TAB = 'ucos_events_active_tab';

export function openSundayServices(
  onModuleChange: ((m: ERPModule, tab?: string) => void) | undefined,
  tab: SundayServicesTab = 'this-sunday',
  eventId?: string,
) {
  if (eventId) sessionStorage.setItem(UCOS_OPEN_SERVICE_EVENT_ID, eventId);
  sessionStorage.setItem(UCOS_SUNDAY_SERVICES_TAB, tab);
  onModuleChange?.('sunday-services', tab);
}

export function openSundayLive(
  onModuleChange: ((m: ERPModule, tab?: string) => void) | undefined,
  eventId: string,
) {
  sessionStorage.setItem(UCOS_LIVE_SERVICE_ID, eventId);
  onModuleChange?.('sunday-mode');
}

export function readSundayServicesTab(): SundayServicesTab {
  if (typeof window === 'undefined') return 'this-sunday';
  const t = sessionStorage.getItem(UCOS_SUNDAY_SERVICES_TAB);
  sessionStorage.removeItem(UCOS_SUNDAY_SERVICES_TAB);
  if (t === 'schedule' || t === 'plan' || t === 'this-sunday') return t;
  return 'this-sunday';
}
