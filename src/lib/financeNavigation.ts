import type { ERPModule } from '@/types';

/** Finance workspace tabs — single Financial Hub surface. */
export type FinanceWorkspaceTab =
  | 'overview'
  | 'vouchers'
  | 'accounts'
  | 'ledgers'
  | 'funds'
  | 'budgets'
  | 'vendors'
  | 'payroll'
  | 'assets'
  | 'reconciliation'
  | 'reports'
  | 'ca-audit'
  | 'document-center';

const STORAGE_KEY = 'church_erp_finance_tab';

const LEGACY_TAB_MAP: Record<string, FinanceWorkspaceTab> = {
  dashboard: 'overview',
  documents: 'document-center',
  approvals: 'vouchers',
  years: 'ca-audit',
  receipts: 'document-center',
  settlements: 'reconciliation',
};

export function normalizeFinanceTab(raw?: string | null): FinanceWorkspaceTab {
  const t = (raw || '').trim();
  if (!t) return 'vouchers';
  if (LEGACY_TAB_MAP[t]) return LEGACY_TAB_MAP[t];
  const allowed: FinanceWorkspaceTab[] = [
    'overview',
    'vouchers',
    'accounts',
    'ledgers',
    'funds',
    'budgets',
    'vendors',
    'payroll',
    'assets',
    'reconciliation',
    'reports',
    'ca-audit',
    'document-center',
  ];
  return allowed.includes(t as FinanceWorkspaceTab) ? (t as FinanceWorkspaceTab) : 'overview';
}

export function navigateToFinanceTab(moduleChange: ((m: ERPModule, tab?: string) => void) | undefined, tab: FinanceWorkspaceTab) {
  try {
    sessionStorage.setItem(STORAGE_KEY, tab);
  } catch {
    /* ignore */
  }
  moduleChange?.('finance', tab);
}

export function consumeFinanceTabIntent(): FinanceWorkspaceTab | null {
  try {
    const t = sessionStorage.getItem(STORAGE_KEY);
    if (t) {
      sessionStorage.removeItem(STORAGE_KEY);
      return normalizeFinanceTab(t);
    }
  } catch {
    /* ignore */
  }
  return null;
}
