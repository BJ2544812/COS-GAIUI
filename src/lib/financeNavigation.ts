import type { ERPModule } from '@/types';

export type FinanceWorkspaceTab =
  | 'dashboard'
  | 'vouchers'
  | 'receipts'
  | 'settlements'
  | 'reconciliation'
  | 'reports'
  | 'approvals'
  | 'documents'
  | 'years'
  | 'accounts';

const STORAGE_KEY = 'church_erp_finance_tab';

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
      return t as FinanceWorkspaceTab;
    }
  } catch {
    /* ignore */
  }
  return null;
}
