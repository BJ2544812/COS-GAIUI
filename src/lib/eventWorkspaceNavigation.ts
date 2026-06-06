import type { ERPModule } from '@/types';
import { UCOS_OPEN_EVENT_ID } from '@/lib/sundayServicesNavigation';

export type EventWorkspaceTab = 'overview' | 'people' | 'schedule' | 'finance' | 'reports' | 'workflow';

export const UCOS_EVENT_WORKSPACE_TAB = 'ucos_event_workspace_tab';
export const UCOS_OPEN_NEXT_SERVICE = 'ucos_open_next_service';
/** Survives page reload while pastor is inside an event workspace. */
export const UCOS_EVENTS_ACTIVE_EVENT_ID = 'ucos_events_active_event_id';

/** Open an event in the unified workspace (optionally on a specific tab). */
export function openEventWorkspace(
  onModuleChange: ((m: ERPModule, tab?: string) => void) | undefined,
  eventId: string,
  tab: EventWorkspaceTab = 'overview',
) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(UCOS_OPEN_EVENT_ID, eventId);
    sessionStorage.setItem(UCOS_EVENT_WORKSPACE_TAB, tab);
  }
  onModuleChange?.('events');
}
