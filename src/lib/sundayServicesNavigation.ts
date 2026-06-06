import type { ERPModule } from '@/types';
import type { EventWorkspaceTab } from '@/lib/eventWorkspaceNavigation';
import { openEventWorkspace, UCOS_OPEN_NEXT_SERVICE } from '@/lib/eventWorkspaceNavigation';

export type SundayServicesTab = 'this-sunday' | 'schedule' | 'plan';

export const UCOS_SUNDAY_SERVICES_TAB = 'ucos_sunday_services_tab';
export const UCOS_OPEN_SERVICE_EVENT_ID = 'ucos_open_service_event_id';
export const UCOS_LIVE_SERVICE_ID = 'ucos_live_service_id';
export const UCOS_OPEN_EVENT_ID = 'ucos_open_event_id';

const TAB_TO_WORKSPACE: Record<SundayServicesTab, EventWorkspaceTab> = {
  plan: 'schedule',
  schedule: 'schedule',
  'this-sunday': 'schedule',
};

/** Open event workspace — worship planning lives on the Schedule tab. */
export function openWorshipServices(
  onModuleChange: ((m: ERPModule, tab?: string) => void) | undefined,
  tab: SundayServicesTab = 'this-sunday',
  eventId?: string,
) {
  if (eventId) {
    openEventWorkspace(onModuleChange, eventId, TAB_TO_WORKSPACE[tab]);
    return;
  }
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(UCOS_OPEN_NEXT_SERVICE, '1');
    sessionStorage.setItem(UCOS_SUNDAY_SERVICES_TAB, tab);
  }
  onModuleChange?.('events');
}

/** @deprecated Use openWorshipServices — kept for existing call sites. */
export const openSundayServices = openWorshipServices;

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
