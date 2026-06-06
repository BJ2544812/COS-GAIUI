import type { ERPModule } from '@/types';
import { navLabel } from '@/lib/churchProductCopy';
import { normalizeFinanceTab, type FinanceWorkspaceTab } from '@/lib/financeNavigation';
import { UCOS_OPEN_NEXT_SERVICE } from '@/lib/eventWorkspaceNavigation';
import { UCOS_SUNDAY_SERVICES_TAB, type SundayServicesTab } from '@/lib/sundayServicesNavigation';

/** Canonical modules shown in sidebar and route manifest. */
export const CANONICAL_ADMIN_MODULES: readonly ERPModule[] = [
  'dashboard',
  'profile',
  'members',
  'families',
  'volunteers',
  'hr',
  'small-groups',
  'pathways',
  'discipleship',
  'outreach',
  'events',
  'sunday-mode',
  'attendance',
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

const WORSHIP_SERVICE_MODULE_ALIASES = new Set(['sunday-services', 'worship', 'services']);
const WORSHIP_SERVICE_SUB_TABS = new Set<SundayServicesTab>(['this-sunday', 'schedule', 'plan']);

/** Legacy module ids → canonical target (+ optional tab). */
const UCOS_HR_ACTIVE_TAB = 'ucos_hr_active_tab';

export const MODULE_ALIASES: Record<string, { module: ERPModule; tab?: string }> = {
  workforce: { module: 'hr', tab: 'directory' },
  missions: { module: 'outreach' },
  funds: { module: 'finance', tab: 'funds' },
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

export type AdminRouteState = {
  module: ERPModule;
  tab?: string;
};

export function isCanonicalAdminModule(id: string): id is ERPModule {
  return (CANONICAL_ADMIN_MODULES as readonly string[]).includes(id);
}

function storeWorshipServicesSubTab(tab: SundayServicesTab) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(UCOS_SUNDAY_SERVICES_TAB, tab);
}

function defaultWorshipSubTab(moduleId: string): SundayServicesTab | undefined {
  if (moduleId === 'worship') return 'this-sunday';
  if (moduleId === 'services') return 'schedule';
  return undefined;
}

/** Map legacy Sunday planning URLs to Events workspace (Schedule tab). */
function resolveWorshipServicesRoute(moduleId: string, tab?: string): AdminRouteState | null {
  const subTab =
    tab && WORSHIP_SERVICE_SUB_TABS.has(tab as SundayServicesTab)
      ? (tab as SundayServicesTab)
      : defaultWorshipSubTab(moduleId);

  if (WORSHIP_SERVICE_MODULE_ALIASES.has(moduleId) || subTab) {
    if (subTab) storeWorshipServicesSubTab(subTab);
    if (typeof window !== 'undefined' && WORSHIP_SERVICE_MODULE_ALIASES.has(moduleId)) {
      sessionStorage.setItem(UCOS_OPEN_NEXT_SERVICE, '1');
    }
    return { module: 'events' };
  }

  if (moduleId === 'events' && (tab === 'services' || tab === 'worship-services' || tab === 'planning')) {
    if (tab === 'services') storeWorshipServicesSubTab('schedule');
    return { module: 'events' };
  }

  if (moduleId === 'events' && tab && WORSHIP_SERVICE_SUB_TABS.has(tab as SundayServicesTab)) {
    storeWorshipServicesSubTab(tab as SundayServicesTab);
    return { module: 'events' };
  }

  return null;
}

function applyModuleTabSideEffects(module: ERPModule, tab?: string) {
  if (typeof window === 'undefined' || !tab) return;
  if (module === 'finance' && tab) {
    sessionStorage.setItem('church_erp_finance_tab', normalizeFinanceTab(tab));
  }
  if (module === 'hr' && tab) {
    sessionStorage.setItem(UCOS_HR_ACTIVE_TAB, tab);
  }
  if (module === 'settings' && tab === 'structure') {
    sessionStorage.setItem('ucos_settings_section', 'structure');
  }
}

/** Resolve module + tab to canonical admin route (sidebar destinations + legacy aliases). */
export function resolveAdminNavigation(rawModule: string | null | undefined, rawTab?: string): AdminRouteState {
  const moduleId = (rawModule || 'dashboard').trim().toLowerCase();
  const tab = rawTab?.trim() || undefined;

  const worshipRoute = resolveWorshipServicesRoute(moduleId, tab);
  if (worshipRoute) return worshipRoute;

  if (moduleId === 'structure') {
    applyModuleTabSideEffects('settings', 'structure');
    return { module: 'settings', tab: 'structure' };
  }

  if (moduleId === 'budgets') {
    const financeTab =
      tab === 'funds' ? 'funds' : tab === 'event-finance' ? 'budgets' : 'budgets';
    applyModuleTabSideEffects('finance', financeTab);
    return { module: 'finance', tab: financeTab };
  }
  if (moduleId === 'vendors') {
    const financeTab = tab === 'payroll' ? 'payroll' : 'vendors';
    applyModuleTabSideEffects('finance', financeTab);
    return { module: 'finance', tab: financeTab };
  }
  if (moduleId === 'assets') {
    applyModuleTabSideEffects('finance', 'assets');
    return { module: 'finance', tab: 'assets' };
  }

  const alias = MODULE_ALIASES[moduleId];
  if (alias) {
    applyModuleTabSideEffects(alias.module, tab ?? alias.tab);
    return { module: alias.module, tab: tab ?? alias.tab };
  }

  if (isCanonicalAdminModule(moduleId)) {
    if (tab) applyModuleTabSideEffects(moduleId, tab);
    return { module: moduleId, tab };
  }

  return { module: 'dashboard' };
}

export function normalizeAdminModule(raw: string | null | undefined): AdminRouteState {
  return resolveAdminNavigation(raw);
}

export function parseAdminSearchParams(search: string): AdminRouteState {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const moduleParam = params.get('module') || params.get('m');
  const tab = params.get('tab') || params.get('t') || undefined;
  return resolveAdminNavigation(moduleParam, tab);
}

export function buildAdminPath(state: AdminRouteState): string {
  const params = new URLSearchParams();
  params.set('module', state.module);
  if (state.tab) params.set('tab', state.tab);
  const q = params.toString();
  return `/admin${q ? `?${q}` : ''}`;
}

/** Canonical member profile — Members module reads memberId + view=profile from URL. */
export function buildMemberProfilePath(memberId: string): string {
  const params = new URLSearchParams();
  params.set('module', 'members');
  params.set('memberId', memberId);
  params.set('view', 'profile');
  return `/admin?${params.toString()}`;
}

/** Families household detail — Families module reads familyId from URL. */
export function buildFamilyDetailPath(familyId: string): string {
  const params = new URLSearchParams();
  params.set('module', 'families');
  params.set('familyId', familyId);
  return `/admin?${params.toString()}`;
}

export function adminModuleLabel(module: ERPModule): string {
  return navLabel(module);
}
