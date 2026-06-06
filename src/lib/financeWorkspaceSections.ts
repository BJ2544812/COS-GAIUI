import type { LucideIcon } from 'lucide-react';
import {
  ArrowRightLeft,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  FileStack,
  FolderOpen,
  Landmark,
  LayoutGrid,
  PieChart,
  Receipt,
  ShieldCheck,
  Store,
  Users,
  Wallet,
} from 'lucide-react';
import type { FinanceWorkspaceTab } from '@/lib/financeNavigation';

export type FinanceSectionId = 'daily' | 'setup' | 'operations' | 'reporting';

export type FinanceSectionTab = {
  id: FinanceWorkspaceTab;
  label: string;
  description: string;
  icon: LucideIcon;
};

export type FinanceSection = {
  id: FinanceSectionId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tabs: FinanceSectionTab[];
};

export const FINANCE_SECTIONS: FinanceSection[] = [
  {
    id: 'daily',
    title: 'Daily work',
    subtitle: 'Record transactions, match the bank, close the day',
    icon: Receipt,
    tabs: [
      { id: 'overview', label: 'Overview', description: 'Balances and what needs attention today', icon: LayoutGrid },
      { id: 'vouchers', label: 'Vouchers', description: 'The heart of church accounting', icon: Receipt },
      { id: 'reconciliation', label: 'Reconciliation', description: 'Bank and giving settlement matching', icon: ArrowRightLeft },
    ],
  },
  {
    id: 'setup',
    title: 'Accounting setup',
    subtitle: 'Chart, ledgers, funds, and budgets',
    icon: BookOpen,
    tabs: [
      { id: 'accounts', label: 'Chart of accounts', description: 'Account codes your books run on', icon: Landmark },
      { id: 'ledgers', label: 'Ledgers', description: 'Running balances by account', icon: BookOpen },
      { id: 'funds', label: 'Funds', description: 'Restricted and designated balances', icon: Wallet },
      { id: 'budgets', label: 'Budgets', description: 'Plan vs actual from posted vouchers', icon: PieChart },
    ],
  },
  {
    id: 'operations',
    title: 'Operations',
    subtitle: 'Vendors, payroll, and fixed assets',
    icon: BriefcaseBusiness,
    tabs: [
      { id: 'vendors', label: 'Vendors', description: 'Bills, payments, and vendor history', icon: Store },
      { id: 'payroll', label: 'Payroll', description: 'HR handoff and payment posting', icon: Users },
      { id: 'assets', label: 'Assets', description: 'Register, depreciate, and dispose', icon: Building2 },
    ],
  },
  {
    id: 'reporting',
    title: 'Reporting',
    subtitle: 'Exports for leadership and your CA',
    icon: BarChart3,
    tabs: [
      { id: 'reports', label: 'Reports', description: 'Trial balance and health checks', icon: BarChart3 },
      { id: 'ca-audit', label: 'CA & Audit', description: 'Trial balance, day book, fund reports', icon: ShieldCheck },
      { id: 'document-center', label: 'Document center', description: 'Voucher PDFs, receipts, attachments', icon: FolderOpen },
    ],
  },
];

const TAB_TO_SECTION = new Map<FinanceWorkspaceTab, FinanceSectionId>(
  FINANCE_SECTIONS.flatMap((s) => s.tabs.map((t) => [t.id, s.id] as const)),
);

export function sectionForFinanceTab(tab: FinanceWorkspaceTab): FinanceSectionId {
  return TAB_TO_SECTION.get(tab) ?? 'daily';
}

export function financeTabMeta(tab: FinanceWorkspaceTab): FinanceSectionTab | undefined {
  for (const section of FINANCE_SECTIONS) {
    const found = section.tabs.find((t) => t.id === tab);
    if (found) return found;
  }
  return undefined;
}

export function allFinanceTabs(): FinanceSectionTab[] {
  return FINANCE_SECTIONS.flatMap((s) => s.tabs);
}
