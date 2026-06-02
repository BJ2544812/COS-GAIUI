import type { ERPModule } from '@/types';
import { navLabel } from '@/lib/churchProductCopy';
import type { FinanceWorkspaceTab } from '@/lib/financeNavigation';

/** Canonical modules shown in sidebar and route manifest. */
export const CANONICAL_ADMIN_MODULES: readonly ERPModule[] = [
  'dashboard',
  'profile',
  'members',
  'families',
  'volunteers',
  'workforce',
  'hr',
  'small-groups',
  'pathways',
  'discipleship',
  'events',
  'sunday-mode',
  'attendance',
  'worship',
  'outreach',
  'structure',
  'giving',
  'finance',
  'budgets',
  'vendors',
  'assets',
  'documents',
  'sermons',
  'communication',
  'notifications',
  'website',
  'analytics',
  'academy',
  'audit-logs',
  'workflow-monitor',
  'settings',
  'admin-center',
  'permissions',
] as const;

/** Legacy module ids → canonical target (+ optional tab). */
export const MODULE_ALIASES: Record<string, { module: ERPModule; tab?: string }> = {
  services: { module: 'events', tab: 'services' },
  missions: { module: 'outreach' },
  funds: { module: 'budgets', tab: 'funds' },
  content: { module: 'sermons' },
  pages: { module: 'website', tab: 'pages' },
  forms: { module: 'website', tab: 'forms' },
  'media-library': { module: 'website', tab: 'media' },
  'landing-pages': { module: 'website', tab: 'landing_pages' },
  seo: { module: 'website', tab: 'seo' },
  engagement: { module: 'analytics' },
  'event-admin': { module: 'workflow-monitor' },
  'feature-flags': { module: 'admin-center', tab: 'flags' },
  'tenant-settings': { module: 'settings' },
  integrations: { module: 'admin-center', tab: 'governance' },
  mobile: { module: 'website', tab: 'dashboard' },
};

const UCOS_EVENTS_ACTIVE_TAB = 'ucos_events_active_tab';

export type AdminRouteState = {
  module: ERPModule;
  tab?: string;
};

export function isCanonicalAdminModule(id: string): id is ERPModule {
  return (CANONICAL_ADMIN_MODULES as readonly string[]).includes(id);
}

export function normalizeAdminModule(raw: string | null | undefined): AdminRouteState {
  const id = (raw || 'dashboard').trim().toLowerCase();
  const alias = MODULE_ALIASES[id];
  if (alias) {
    applyModuleTabSideEffects(alias.module, alias.tab);
    return { module: alias.module, tab: alias.tab };
  }
  if (isCanonicalAdminModule(id)) {
    return { module: id };
  }
  return { module: 'dashboard' };
}

function applyModuleTabSideEffects(module: ERPModule, tab?: string) {
  if (typeof window === 'undefined' || !tab) return;
  if (module === 'events' && tab === 'services') {
    sessionStorage.setItem(UCOS_EVENTS_ACTIVE_TAB, 'services');
  }
  if (module === 'finance' && tab) {
    sessionStorage.setItem('church_erp_finance_tab', tab as FinanceWorkspaceTab);
  }
}

export function parseAdminSearchParams(search: string): AdminRouteState {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const moduleParam = params.get('module') || params.get('m');
  const tab = params.get('tab') || params.get('t') || undefined;
  const base = normalizeAdminModule(moduleParam);
  if (tab) {
    applyModuleTabSideEffects(base.module, tab);
    return { module: base.module, tab };
  }
  return base;
}

export function buildAdminPath(state: AdminRouteState): string {
  const params = new URLSearchParams();
  params.set('module', state.module);
  if (state.tab) params.set('tab', state.tab);
  const q = params.toString();
  return `/admin${q ? `?${q}` : ''}`;
}

export function adminModuleLabel(module: ERPModule): string {
  return navLabel(module);
}
