import * as React from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Banknote,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  Eye,
  FileClock,
  Download,
  FileSearch,
  Filter,
  Printer,
  HandCoins,
  Landmark,
  Loader2,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ApiError, apiDownloadBlob, apiRequest, formatApiError, openBlobInNewTab, parseApiResponse, triggerBrowserDownload } from '@/lib/apiClient';
import { formatCurrencyAmount } from '@/lib/formatCurrency';
import { useSettings } from '@/context/SettingsContext';
import { ERPModule } from '@/types';
import { ActionButton, EmptyState, FeedbackBanner, ModuleHeader, ResponsiveTableWrap, SectionCard, StatCard } from '@/components/modules/ModuleHeader';
import { GatewaySettlementPanel } from '@/components/finance/GatewaySettlementPanel';
import { BankReconciliationPanel } from '@/components/finance/BankReconciliationPanel';
import { consumeFinanceTabIntent, type FinanceWorkspaceTab } from '@/lib/financeNavigation';
import { VoucherCreateDialog } from '@/components/finance/VoucherCreateDialog';

type StatusTab = 'all' | 'draft' | 'approved' | 'posted' | 'reversed' | 'failed';
type FinanceTab = FinanceWorkspaceTab;

interface FinanceModuleProps {
  onModuleChange?: (module: ERPModule) => void;
  user?: any;
  /** Deep-link tab from `/admin?module=finance&tab=…` */
  initialTab?: FinanceTab;
}

function n(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }
  if (typeof v === 'object' && v !== null && 'toString' in v) {
    const x = Number((v as { toString: () => string }).toString());
    return Number.isFinite(x) ? x : 0;
  }
  return 0;
}

function d(v: unknown): Date | null {
  if (!v) return null;
  const out = new Date(String(v));
  return Number.isNaN(out.getTime()) ? null : out;
}

export function FinanceModule({ onModuleChange, user, initialTab }: FinanceModuleProps) {
  const { settings } = useSettings();
  const currency = settings.financial.currency;
  const permissions = (user?.permissions as string[] | undefined) ?? [];
  const canManageFinance = permissions.includes('manage_finance');

  const [tab, setTab] = React.useState<FinanceTab>(() => initialTab ?? 'dashboard');
  const [showCreateVoucher, setShowCreateVoucher] = React.useState(false);

  React.useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  React.useEffect(() => {
    const intent = consumeFinanceTabIntent();
    if (intent) setTab(intent);
  }, []);
  const [statusFilter, setStatusFilter] = React.useState<StatusTab>('all');
  const [search, setSearch] = React.useState('');
  const [sourceFilter, setSourceFilter] = React.useState('all');
  const [accountFilter, setAccountFilter] = React.useState('all');
  const [fundFilter, setFundFilter] = React.useState('all');

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [banner, setBanner] = React.useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [vouchers, setVouchers] = React.useState<any[]>([]);
  const [funds, setFunds] = React.useState<any[]>([]);
  const [fundStatementRows, setFundStatementRows] = React.useState<any[]>([]);
  const [budgetVsActual, setBudgetVsActual] = React.useState<any | null>(null);
  const [approvalQueue, setApprovalQueue] = React.useState<any[]>([]);
  const [payables, setPayables] = React.useState<any[]>([]);
  const [payrollRuns, setPayrollRuns] = React.useState<any[]>([]);
  const [trialBalance, setTrialBalance] = React.useState<any | null>(null);
  const [auditWorkpapers, setAuditWorkpapers] = React.useState<any | null>(null);
  const [donationReconciliation, setDonationReconciliation] = React.useState<any | null>(null);

  const [selectedVoucher, setSelectedVoucher] = React.useState<any | null>(null);
  const [selectedVoucherLogs, setSelectedVoucherLogs] = React.useState<any[]>([]);
  const [selectedVoucherChecks, setSelectedVoucherChecks] = React.useState<any | null>(null);
  const [voucherBusy, setVoucherBusy] = React.useState<string | null>(null);

  const fmt = React.useCallback(
    (value: number) => formatCurrencyAmount(value, currency, { maximumFractionDigits: 0 }),
    [currency],
  );

  React.useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => setBanner(null), 4000);
    return () => window.clearTimeout(t);
  }, [banner]);

  const fetchEverything = React.useCallback(async () => {
    if (!canManageFinance) return;
    try {
      setLoading(true);
      setError(null);

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date();
      monthEnd.setMonth(monthEnd.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const [
        accountsJson,
        vouchersJson,
        trialBalanceJson,
        fundsJson,
        budgetJson,
        approvalJson,
        payablesJson,
        payrollJson,
        workpapersJson,
        donationReconJson,
      ] = await Promise.all([
        apiRequest<unknown>('finance/accounts'),
        apiRequest<unknown>('finance/vouchers?all=1'),
        apiRequest<unknown>('finance/trial-balance'),
        apiRequest<unknown>('finance/funds'),
        apiRequest<unknown>('finance/budgets/vs-actual'),
        apiRequest<unknown>('finance/approvals/queue'),
        apiRequest<unknown>('finance/payables/bills'),
        apiRequest<unknown>('finance/payroll/runs'),
        apiRequest<unknown>('finance/audit/workpapers?fy=current'),
        apiRequest<unknown>(
          `giving/donations/reconciliation?from=${encodeURIComponent(monthStart.toISOString())}&to=${encodeURIComponent(monthEnd.toISOString())}`,
        ),
      ]);

      const loadedAccounts = parseApiResponse<any[]>(accountsJson) || [];
      const loadedVouchers = parseApiResponse<any[]>(vouchersJson) || [];
      const loadedFunds = parseApiResponse<any[]>(fundsJson) || [];
      const loadedApprovals = parseApiResponse<any[]>(approvalJson) || [];
      const loadedPayables = parseApiResponse<any[]>(payablesJson) || [];
      const loadedPayrollRuns = parseApiResponse<any[]>(payrollJson) || [];

      setAccounts(loadedAccounts);
      setVouchers(loadedVouchers);
      setFunds(loadedFunds);
      setBudgetVsActual(parseApiResponse<any>(budgetJson));
      setApprovalQueue(loadedApprovals);
      setPayables(loadedPayables);
      setPayrollRuns(loadedPayrollRuns);
      setTrialBalance(parseApiResponse<any>(trialBalanceJson));
      setAuditWorkpapers(parseApiResponse<any>(workpapersJson));
      setDonationReconciliation(parseApiResponse<any>(donationReconJson));

      const statements = await Promise.all(
        loadedFunds.map(async (f) => {
          try {
            const out = await apiRequest<unknown>(`finance/funds/${f.id}/statement`);
            return { fund: f, statement: parseApiResponse<any>(out) };
          } catch {
            return { fund: f, statement: null };
          }
        }),
      );
      setFundStatementRows(statements);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  }, [canManageFinance]);

  React.useEffect(() => {
    void fetchEverything();
  }, [fetchEverything]);

  const refreshVoucherDetails = React.useCallback(async (voucherId: string) => {
    const [voucherJson, logsJson, checksJson] = await Promise.all([
      apiRequest<unknown>(`finance/vouchers/${voucherId}`),
      apiRequest<unknown>(`finance/audit/logs?entityType=Voucher&entityId=${encodeURIComponent(voucherId)}&limit=100`),
      apiRequest<unknown>(`finance/vouchers/${voucherId}/attachment-checksums`).catch(() => null),
    ]);
    setSelectedVoucher(parseApiResponse<any>(voucherJson));
    setSelectedVoucherLogs(parseApiResponse<any[]>(logsJson) || []);
    setSelectedVoucherChecks(checksJson ? parseApiResponse<any>(checksJson) : null);
  }, []);

  const performVoucherAction = React.useCallback(
    async (voucher: any, action: 'approve' | 'post' | 'reverse') => {
      try {
        setVoucherBusy(voucher.id);
        if (action === 'approve') {
          await apiRequest(`finance/vouchers/${voucher.id}/approve`, { method: 'POST' });
          setBanner({ tone: 'success', message: `Voucher ${voucher.voucherNo || voucher.id} approved.` });
        } else if (action === 'post') {
          if (!window.confirm(`Post voucher ${voucher.voucherNo || voucher.id}? Posted vouchers are immutable and must be reversed for corrections.`)) {
            return;
          }
          await apiRequest(`finance/vouchers/${voucher.id}/post`, { method: 'POST' });
          setBanner({ tone: 'success', message: `Voucher ${voucher.voucherNo || voucher.id} posted.` });
        } else {
          if (!window.confirm(`Create reversal for voucher ${voucher.voucherNo || voucher.id}? This creates a new correcting voucher and keeps the full change history.`)) {
            return;
          }
          await apiRequest(`finance/vouchers/${voucher.id}/reversal`, {
            method: 'POST',
            body: JSON.stringify({ reason: 'UI reversal action' }),
          });
          setBanner({ tone: 'success', message: `Reversal draft created for voucher ${voucher.voucherNo || voucher.id}.` });
        }
        await fetchEverything();
        await refreshVoucherDetails(voucher.id);
      } catch (err) {
        setBanner({ tone: 'error', message: formatApiError(err) });
      } finally {
        setVoucherBusy(null);
      }
    },
    [fetchEverything, refreshVoucherDetails],
  );

  const accountsByType = React.useMemo(() => {
    const out: Record<string, any[]> = { Asset: [], Liability: [], Revenue: [], Expense: [], Equity: [] };
    for (const acc of accounts) {
      const t = String(acc.type || 'Other');
      if (!out[t]) out[t] = [];
      out[t].push(acc);
    }
    return out;
  }, [accounts]);

  const totals = React.useMemo(() => {
    const sumType = (type: string) => accounts.filter((a) => a.type === type).reduce((s, a) => s + n(a.balance), 0);
    const assets = sumType('Asset');
    const liabilities = sumType('Liability');
    const revenue = sumType('Revenue');
    const expense = sumType('Expense');

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    let monthlyIncome = 0;
    let monthlyExpense = 0;
    for (const v of vouchers) {
      if (String(v.status || '').toLowerCase() !== 'posted') continue;
      const vd = d(v.date);
      if (!vd || vd < monthStart || vd > monthEnd) continue;
      for (const j of v.journalEntries || []) {
        if (j.account?.type === 'Revenue') monthlyIncome += n(j.credit) - n(j.debit);
        if (j.account?.type === 'Expense') monthlyExpense += n(j.debit) - n(j.credit);
      }
    }

    const bankBalance = accounts
      .filter((a) => a.type === 'Asset' && /(bank|current account|savings)/i.test(String(a.name || '')))
      .reduce((s, a) => s + n(a.balance), 0);
    const cashOnHand = accounts
      .filter((a) => a.type === 'Asset' && /(cash|petty)/i.test(String(a.name || '')))
      .reduce((s, a) => s + n(a.balance), 0);
    const restrictedFundBalance = fundStatementRows
      .filter((row) => String(row.fund?.type || '').toLowerCase() === 'restricted')
      .reduce((s, row) => s + n(row.statement?.closingBalance), 0);
    const outstandingPayables = payables.reduce((s, b) => s + n(b.outstanding), 0);
    const payrollDue = payrollRuns
      .filter((r) => String(r.status || '').toLowerCase() !== 'closed')
      .reduce((s, r) => s + n(r.totalNet), 0);
    const budgetUtilization = n(budgetVsActual?.totals?.budget) > 0
      ? (n(budgetVsActual?.totals?.actual) / n(budgetVsActual?.totals?.budget)) * 100
      : 0;

    return {
      assets,
      liabilities,
      revenue,
      expense,
      monthlyIncome,
      monthlyExpense,
      bankBalance,
      cashOnHand,
      restrictedFundBalance,
      outstandingPayables,
      payrollDue,
      budgetUtilization,
      trialDiff: n(trialBalance?.totals?.difference),
    };
  }, [accounts, vouchers, fundStatementRows, payables, payrollRuns, budgetVsActual, trialBalance]);

  const voucherBuckets = React.useMemo(() => {
    const bucket = { draft: 0, approved: 0, posted: 0, reversed: 0, failed: 0 };
    for (const v of vouchers) {
      const s = String(v.status || '').toLowerCase();
      if (s === 'draft') bucket.draft += 1;
      else if (s === 'approved') bucket.approved += 1;
      else if (s === 'posted') bucket.posted += 1;
      else if (s === 'reversed') bucket.reversed += 1;
      else bucket.failed += 1;
    }
    return bucket;
  }, [vouchers]);

  const filteredVouchers = React.useMemo(() => {
    return vouchers.filter((v) => {
      const status = String(v.status || '').toLowerCase();
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (sourceFilter !== 'all' && String(v.sourceType || '').toLowerCase() !== sourceFilter.toLowerCase()) return false;
      if (fundFilter !== 'all') {
        const hasFund = (v.journalEntries || []).some((j: any) => j.fundId === fundFilter);
        if (!hasFund) return false;
      }
      if (accountFilter !== 'all') {
        const hasAccount = (v.journalEntries || []).some((j: any) => j.accountId === accountFilter);
        if (!hasAccount) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = [
          v.voucherNo,
          v.description,
          v.type,
          v.status,
          v.sourceType,
          v.sourceId,
        ]
          .map((x) => String(x || '').toLowerCase())
          .join(' ');
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [vouchers, statusFilter, sourceFilter, fundFilter, accountFilter, search]);

  const topExpenseAccounts = React.useMemo(() => {
    const map = new Map<string, { name: string; value: number }>();
    for (const v of vouchers) {
      if (String(v.status || '').toLowerCase() !== 'posted') continue;
      for (const j of v.journalEntries || []) {
        if (j.account?.type !== 'Expense') continue;
        const key = String(j.account?.id || j.accountId);
        const prev = map.get(key) || { name: j.account?.name || 'Expense', value: 0 };
        prev.value += n(j.debit) - n(j.credit);
        map.set(key, prev);
      }
    }
    return [...map.values()].sort((a, b) => b.value - a.value).slice(0, 5);
  }, [vouchers]);

  if (!canManageFinance) {
    return (
      <div className="space-y-6">
        <ModuleHeader
          title="Finance"
          subtitle="You do not currently have permission to access accounting operations."
          icon={ShieldCheck}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {banner && (
        <FeedbackBanner tone={banner.tone}>{banner.message}</FeedbackBanner>
      )}
      {error && (
        <FeedbackBanner tone="error">{error}</FeedbackBanner>
      )}

      <ModuleHeader
        title="Finance"
        subtitle="Church books — vouchers, receipts, settlements, reports, and approvals."
        icon={BookOpen}
        actions={
          <>
            <ActionButton label="Refresh" icon={RefreshCw} variant="secondary" onClick={() => void fetchEverything()} />
            <ActionButton label="New voucher" icon={Receipt} variant="primary" onClick={() => setShowCreateVoucher(true)} />
            <ActionButton label="Open vouchers" icon={Receipt} variant="secondary" onClick={() => setTab('vouchers')} />
          </>
        }
      />

      <VoucherCreateDialog
        open={showCreateVoucher}
        onOpenChange={setShowCreateVoucher}
        accounts={accounts}
        currency={currency}
        onCreated={(id) => {
          setBanner({ tone: 'success', message: 'Draft voucher saved. Review in the registry.' });
          setTab('vouchers');
          void fetchEverything().then(() => refreshVoucherDetails(id));
        }}
      />

      <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1 w-full max-w-full overflow-x-auto">
        {[
          ['dashboard', 'Dashboard'],
          ['vouchers', 'Vouchers'],
          ['receipts', 'Receipts'],
          ['settlements', 'Settlements'],
          ['reconciliation', 'Reconciliation'],
          ['reports', 'Reports'],
          ['approvals', 'Approvals'],
          ['documents', 'Document Registry'],
          ['years', 'Financial Years'],
          ['accounts', 'Accounts'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as FinanceTab)}
            className={cn(
              'rounded-lg px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors',
              tab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-28 rounded-2xl bg-slate-100" />)}
          </div>
          <div className="h-64 rounded-2xl bg-slate-100" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-48 rounded-2xl bg-slate-100" />
            <div className="h-48 rounded-2xl bg-slate-100" />
          </div>
        </div>
      ) : null}

      {!loading && tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Current Bank Balance" value={fmt(totals.bankBalance)} icon={Landmark} />
            <StatCard label="Cash On Hand" value={fmt(totals.cashOnHand)} icon={Wallet} />
            <StatCard label="Restricted Fund Balance" value={fmt(totals.restrictedFundBalance)} icon={HandCoins} />
            <StatCard label="Monthly Income" value={fmt(totals.monthlyIncome)} icon={CircleDollarSign} />
            <StatCard label="Monthly Expenses" value={fmt(totals.monthlyExpense)} icon={Banknote} />
            <StatCard label="Pending Approvals" value={approvalQueue.length} icon={ClipboardList} />
            <StatCard label="Outstanding Payables" value={fmt(totals.outstandingPayables)} icon={BriefcaseBusiness} />
            <StatCard label="Payroll Due" value={fmt(totals.payrollDue)} icon={CalendarClock} />
            <StatCard label="Budget Utilization" value={`${totals.budgetUtilization.toFixed(1)}%`} icon={ArrowRightLeft} />
            <StatCard label="Trial Balance Delta" value={fmt(totals.trialDiff)} icon={ShieldCheck} />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <SectionCard
              title="Financial Health"
              subtitle="Income/expense, budget pressure, account mix"
              className="xl:col-span-2"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Income vs Expense (month)</p>
                  <p className="mt-2 text-sm font-bold text-emerald-700">Income: {fmt(totals.monthlyIncome)}</p>
                  <p className="text-sm font-bold text-rose-700">Expense: {fmt(totals.monthlyExpense)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Budget vs Actual</p>
                  <p className="mt-2 text-sm font-bold text-slate-800">Budget: {fmt(n(budgetVsActual?.totals?.budget))}</p>
                  <p className="text-sm font-bold text-slate-800">Actual: {fmt(n(budgetVsActual?.totals?.actual))}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Top Expense Heads</p>
                  {topExpenseAccounts.length === 0 ? (
                    <p className="text-sm text-slate-500">No expense activity yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {topExpenseAccounts.map((r) => (
                        <div key={r.name} className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">{r.name}</span>
                          <span className="font-bold text-slate-900">{fmt(r.value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Finance reminders" subtitle="Items that may need your attention this week">
              <div className="space-y-2">
                {[
                  {
                    label: 'Trial balance mismatch',
                    active: Math.abs(totals.trialDiff) > 0.01,
                    detail: `Current delta ${fmt(totals.trialDiff)}`,
                  },
                  {
                    label: 'Pending approvals',
                    active: approvalQueue.length > 0,
                    detail: `${approvalQueue.length} items waiting`,
                  },
                  {
                    label: 'Outstanding vendor payments',
                    active: totals.outstandingPayables > 0,
                    detail: `${fmt(totals.outstandingPayables)} outstanding`,
                  },
                  {
                    label: 'Payroll pending closure',
                    active: payrollRuns.some((r) => String(r.status || '').toLowerCase() !== 'closed'),
                    detail: `${payrollRuns.filter((r) => String(r.status || '').toLowerCase() !== 'closed').length} runs open`,
                  },
                  {
                    label: 'Voucher exceptions',
                    active: (auditWorkpapers?.exceptions || []).length > 0,
                    detail: `${(auditWorkpapers?.exceptions || []).length} items to review`,
                  },
                  {
                    label: 'Gifts missing a voucher',
                    active: (donationReconciliation?.summary?.withoutVoucher || 0) > 0,
                    detail: `${donationReconciliation?.summary?.withoutVoucher || 0} to review`,
                  },
                ].map((a) => (
                  <div
                    key={a.label}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm',
                      a.active ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-800',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-bold">{a.label}</span>
                    </div>
                    <p className="mt-1 text-xs">{a.detail}</p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SectionCard title="Fund Allocation" subtitle="Restricted / unrestricted / designated balances">
              <div className="space-y-2">
                {fundStatementRows.length === 0 ? (
                  <p className="text-sm text-slate-500">No funds found.</p>
                ) : (
                  fundStatementRows.slice(0, 8).map((row) => (
                    <div key={row.fund.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-800">{row.fund.name}</p>
                        <p className="text-[11px] uppercase tracking-widest text-slate-400">{row.fund.type}</p>
                      </div>
                      <span className="font-black text-slate-900">{fmt(n(row.statement?.closingBalance))}</span>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
            <SectionCard title="Recent Financial Activity" subtitle="Latest vouchers across all statuses">
              <div className="space-y-2">
                {vouchers.slice(0, 8).map((v) => (
                  <button
                    key={v.id}
                    onClick={() => {
                      setTab('vouchers');
                      void refreshVoucherDetails(v.id);
                    }}
                    className="w-full rounded-lg bg-slate-50 px-3 py-2 text-left hover:bg-slate-100"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-bold text-slate-800">{v.description || v.voucherNo || v.type}</p>
                      <span className="text-sm font-black text-slate-900">{fmt(n(v.amount))}</span>
                    </div>
                    <p className="mt-1 text-[11px] uppercase tracking-widest text-slate-400">
                      {String(v.status || '').toUpperCase()} · {d(v.date)?.toLocaleDateString() || '—'}
                    </p>
                  </button>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {!loading && tab === 'vouchers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              ['all', vouchers.length],
              ['draft', voucherBuckets.draft],
              ['approved', voucherBuckets.approved],
              ['posted', voucherBuckets.posted],
              ['reversed', voucherBuckets.reversed],
            ].map(([key, value]) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key as StatusTab)}
                className={cn(
                  'rounded-xl border px-4 py-3 text-left',
                  statusFilter === key ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-white',
                )}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{key}</p>
                <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
              </button>
            ))}
          </div>

          <SectionCard title="Voucher Registry" subtitle="All church vouchers — search, print, approve, and post" noPadding>
            <div className="border-b border-slate-100 p-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm"
                    placeholder="Search voucher no/description/source"
                  />
                </div>
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="all">All sources</option>
                  {Array.from(new Set(vouchers.map((v) => String(v.sourceType || '').toLowerCase()).filter(Boolean))).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="all">All accounts</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.code} · {a.name}</option>
                  ))}
                </select>
                <select
                  value={fundFilter}
                  onChange={(e) => setFundFilter(e.target.value)}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                >
                  <option value="all">All funds</option>
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <div className="flex items-center justify-end">
                  <ActionButton label="Reset Filters" icon={Filter} variant="ghost" onClick={() => {
                    setSearch('');
                    setSourceFilter('all');
                    setAccountFilter('all');
                    setFundFilter('all');
                    setStatusFilter('all');
                  }} />
                </div>
              </div>
            </div>

            <div className="max-h-[520px] overflow-auto min-w-0">
              {filteredVouchers.length === 0 ? (
                <EmptyState
                  icon={Receipt}
                  title="No vouchers match these filters"
                  description="Adjust status or source filters to locate vouchers."
                />
              ) : (
                <ResponsiveTableWrap className="border-0">
                <table className="w-full min-w-[960px] text-left">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-4 py-3">Voucher</th>
                      <th className="px-4 py-3">Source</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVouchers.map((v) => (
                      <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-slate-800">{v.voucherNo || v.id.slice(0, 8)}</p>
                          <p className="max-w-[280px] truncate text-xs text-slate-500">{v.description || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">{v.sourceType || v.source || 'manual'}</td>
                        <td className="px-4 py-3 text-sm font-black text-slate-900">{fmt(n(v.amount))}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{d(v.date)?.toLocaleDateString() || '—'}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
                            {String(v.status || 'unknown')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void refreshVoucherDetails(v.id)}
                              className="h-8 text-xs"
                            >
                              <Eye className="mr-1 h-3.5 w-3.5" />
                              View
                            </Button>
                            {String(v.status || '').toLowerCase() === 'draft' && (
                              <Button
                                size="sm"
                                className="h-8 text-xs"
                                disabled={voucherBusy === v.id}
                                onClick={() => void performVoucherAction(v, 'approve')}
                              >
                                {voucherBusy === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Approve'}
                              </Button>
                            )}
                            {String(v.status || '').toLowerCase() === 'approved' && (
                              <Button
                                size="sm"
                                className="h-8 text-xs"
                                disabled={voucherBusy === v.id}
                                onClick={() => void performVoucherAction(v, 'post')}
                              >
                                {voucherBusy === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Post'}
                              </Button>
                            )}
                            {String(v.status || '').toLowerCase() === 'posted' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs"
                                disabled={voucherBusy === v.id}
                                onClick={() => void performVoucherAction(v, 'reverse')}
                              >
                                {voucherBusy === v.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Reverse'}
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </ResponsiveTableWrap>
              )}
            </div>
          </SectionCard>

          {selectedVoucher && (
            <SectionCard title="Voucher Detail" subtitle="Source, line items, attachments, and approval history">
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="space-y-3 xl:col-span-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Core Info</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <p><span className="font-semibold text-slate-500">Voucher:</span> {selectedVoucher.voucherNo || selectedVoucher.id}</p>
                      <p><span className="font-semibold text-slate-500">Type:</span> {selectedVoucher.type}</p>
                      <p><span className="font-semibold text-slate-500">Status:</span> {selectedVoucher.status}</p>
                      <p><span className="font-semibold text-slate-500">Date:</span> {d(selectedVoucher.date)?.toLocaleDateString() || '—'}</p>
                      <p><span className="font-semibold text-slate-500">Source:</span> {selectedVoucher.sourceType || selectedVoucher.source || 'manual'}</p>
                      <p><span className="font-semibold text-slate-500">Source ID:</span> {selectedVoucher.sourceId || '—'}</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100">
                    <div className="border-b border-slate-100 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">Debit / Credit Preview</div>
                    <div className="divide-y divide-slate-50">
                      {(selectedVoucher.journalEntries || []).map((j: any) => (
                        <div key={j.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm">
                          <div className="col-span-5 font-medium text-slate-700">{j.account?.code} · {j.account?.name}</div>
                          <div className="col-span-2 text-right font-bold text-emerald-700">{fmt(n(j.debit))}</div>
                          <div className="col-span-2 text-right font-bold text-rose-700">{fmt(n(j.credit))}</div>
                          <div className="col-span-3 text-xs text-slate-500">{j.narration || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Attachments</p>
                    <p className="mt-2 text-sm text-slate-700">{(selectedVoucher.attachments || []).length} attachment(s)</p>
                    {selectedVoucherChecks && (
                      <p className="mt-1 text-xs text-slate-500">
                        Checksums verified: {selectedVoucherChecks.verified}/{selectedVoucherChecks.total}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Approvals & change history</p>
                    <div className="mt-2 max-h-56 space-y-2 overflow-auto">
                      {selectedVoucherLogs.length === 0 ? (
                        <p className="text-sm text-slate-500">No history entries yet.</p>
                      ) : (
                        selectedVoucherLogs.map((log) => (
                          <div key={log.id} className="rounded-lg border border-slate-200 bg-white p-2">
                            <p className="text-xs font-bold text-slate-700">{log.action}</p>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400">
                              {d(log.createdAt)?.toLocaleString() || '—'}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Reversal Linkage</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {selectedVoucher.reversalVoucher?.voucherNo || selectedVoucher.reversalVoucher?.id || 'No reversal linked'}
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {!loading && tab === 'receipts' && (
        <DocumentCenterPanel currency={currency} fmt={fmt} defaultKind="receipt" title="Donation receipts" />
      )}

      {!loading && tab === 'settlements' && (
        <GatewaySettlementPanel />
      )}

      {!loading && tab === 'reconciliation' && (
        <BankReconciliationPanel
          accounts={accounts}
          fmt={fmt}
          donationReconciliation={donationReconciliation}
          onOpenSettlements={() => setTab('settlements')}
          onOpenVouchers={() => setTab('vouchers')}
        />
      )}

      {!loading && tab === 'reports' && (
        <div className="space-y-6">
          <SectionCard title="Trial balance" subtitle="Current period">
            {trialBalance ? (
              <div className="text-sm space-y-2">
                <p>Total debits: <strong>{fmt(n(trialBalance.totals?.debit))}</strong></p>
                <p>Total credits: <strong>{fmt(n(trialBalance.totals?.credit))}</strong></p>
                <p className={Math.abs(n(trialBalance.totals?.difference)) > 0.01 ? 'text-rose-700 font-semibold' : 'text-emerald-700'}>
                  Difference: {fmt(n(trialBalance.totals?.difference))}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No trial balance data.</p>
            )}
          </SectionCard>
          <SectionCard title="Accountant exports" subtitle="Books and registers for your CA or treasurer">
            <Button variant="outline" onClick={() => onModuleChange?.('audit-logs')}>
              <FileSearch className="mr-2 h-4 w-4" /> Open change history & reports
            </Button>
          </SectionCard>
          <FinanceRecordsHealthPanel />
        </div>
      )}

      {!loading && tab === 'approvals' && (
        <SectionCard title="Pending approvals" subtitle="Items waiting for your decision">
          {(approvalQueue || []).length === 0 ? (
            <p className="text-sm text-slate-500">Nothing waiting for approval.</p>
          ) : (
            <div className="space-y-2">
              {approvalQueue.map((a) => (
                <div key={a.id} className="rounded-lg border border-slate-100 bg-slate-50 p-4 flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{a.entityType}</p>
                    <p className="text-xs text-slate-500">{a.moduleKey || 'finance'} · Level {a.currentLevel}/{a.minRequiredLevel}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setTab('vouchers')}>Review vouchers</Button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {!loading && tab === 'documents' && (
        <DocumentCenterPanel currency={currency} fmt={fmt} />
      )}

      {!loading && tab === 'years' && (
        <div className="space-y-6">
          <SectionCard title="Financial year" subtitle="How your church calendar is set up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">Year starts</p>
                <p className="text-lg font-bold text-slate-900">{settings.financial.financialYearStart}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">Currency</p>
                <p className="text-lg font-bold text-slate-900">{settings.financial.currency}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 md:col-span-2">
                <p className="text-xs font-semibold text-slate-500">Period lock (no posting before)</p>
                <p className="text-lg font-bold text-slate-900">{settings.financial.lockedUntilDate || 'Not locked'}</p>
              </div>
            </div>
          </SectionCard>
          <Button variant="outline" onClick={() => onModuleChange?.('settings')}>Open system settings</Button>
        </div>
      )}

      {!loading && tab === 'accounts' && (
        <div className="space-y-6">
          <SectionCard title="Chart of Accounts" subtitle="Hierarchical by account type with live balances">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {Object.entries(accountsByType).map(([type, rows]) => (
                <div key={type} className="rounded-xl border border-slate-200 bg-slate-50">
                  <div className="border-b border-slate-200 px-4 py-3">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">{type}</p>
                  </div>
                  <div className="max-h-72 overflow-auto divide-y divide-slate-100">
                    {(rows as any[]).length === 0 ? (
                      <p className="px-4 py-6 text-sm text-slate-500">No accounts</p>
                    ) : (
                      (rows as any[]).map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => setAccountFilter(acc.id)}
                          className="w-full px-4 py-3 text-left hover:bg-white"
                        >
                          <p className="text-sm font-bold text-slate-800">{acc.code} · {acc.name}</p>
                          <p className="text-xs text-slate-500">Balance {fmt(n(acc.balance))}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
          <p className="text-sm text-slate-600">
            Select an account to filter the voucher registry. Year start and period lock are under{' '}
            <button type="button" className="font-semibold text-indigo-600 underline" onClick={() => setTab('years')}>Financial Years</button>.
          </p>
        </div>
      )}

    </div>
  );
}

type RegistryDoc = {
  id: string;
  kind: 'voucher' | 'receipt';
  number: string;
  type: string;
  date: string;
  amount: number;
  status: string;
  narration?: string | null;
  donorName?: string | null;
  fundName?: string | null;
  pdfAvailable: boolean;
};

function FinanceRecordsHealthPanel() {
  const [report, setReport] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await apiRequest('giving/data-quality');
        setReport(parseApiResponse(res));
      } catch {
        setReport(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return null;
  if (!report?.warnings?.length) {
    return (
      <SectionCard title="Records check" subtitle="Data quality">
        <p className="text-sm text-emerald-700">No issues flagged right now.</p>
      </SectionCard>
    );
  }
  return (
    <SectionCard title="Records needing attention" subtitle="Duplicates and unmatched gifts">
      <ul className="space-y-2 text-sm text-slate-700">
        {report.warnings.map((w: { code: string; message: string }) => (
          <li key={w.code} className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">{w.message}</li>
        ))}
      </ul>
    </SectionCard>
  );
}

function DocumentCenterPanel({
  currency,
  fmt,
  defaultKind = 'all',
  title = 'Document registry',
}: {
  currency: string;
  fmt: (v: number) => string;
  defaultKind?: 'all' | 'voucher' | 'receipt';
  title?: string;
}) {
  const [docSearch, setDocSearch] = React.useState('');
  const [docKind, setDocKind] = React.useState<'all' | 'voucher' | 'receipt'>(defaultKind);
  const [voucherType, setVoucherType] = React.useState('');
  const [docStatus, setDocStatus] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [docPage, setDocPage] = React.useState(0);
  const [items, setItems] = React.useState<RegistryDoc[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [docError, setDocError] = React.useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const DOC_PAGE_SIZE = 30;

  const loadRegistry = React.useCallback(async () => {
    try {
      setLoading(true);
      setDocError(null);
      const qs = new URLSearchParams({
        limit: String(DOC_PAGE_SIZE),
        offset: String(docPage * DOC_PAGE_SIZE),
      });
      if (docSearch.trim()) qs.set('search', docSearch.trim());
      if (dateFrom) qs.set('from', dateFrom);
      if (dateTo) qs.set('to', dateTo);

      if (docKind === 'receipt') {
        const res = await apiRequest(`finance/receipts?${qs}`);
        const rows = parseApiResponse<any[]>(res);
        setItems(
          (rows || []).map((r) => ({
            id: r.id,
            kind: 'receipt' as const,
            number: r.receiptNo || r.id?.slice(0, 8) || '—',
            type: 'Donation Receipt',
            date: r.issueDate ? String(r.issueDate) : '',
            amount: Number(r.amount?.toString?.() ?? r.amount ?? 0),
            status: 'issued',
            narration: r.donation?.reference ?? null,
            donorName: r.donorName ?? null,
            fundName: r.fund?.name ?? null,
            pdfAvailable: true,
          })),
        );
        return;
      }

      qs.set('docType', docKind);
      if (voucherType) qs.set('voucherType', voucherType);
      if (docStatus) qs.set('status', docStatus);
      try {
        const res = await apiRequest(`finance/documents/registry?${qs}`);
        const data = parseApiResponse<{ items: RegistryDoc[] }>(res);
        setItems(data.items || []);
      } catch (registryErr) {
        if (
          docKind === 'all' &&
          registryErr instanceof ApiError &&
          registryErr.status === 404 &&
          /route not found/i.test(registryErr.message)
        ) {
          const receiptRes = await apiRequest(`finance/receipts?${qs}`);
          const rows = parseApiResponse<any[]>(receiptRes);
          setItems(
            (rows || []).map((r) => ({
              id: r.id,
              kind: 'receipt' as const,
              number: r.receiptNo || '—',
              type: 'Donation Receipt',
              date: r.issueDate ? String(r.issueDate) : '',
              amount: Number(r.amount?.toString?.() ?? r.amount ?? 0),
              status: 'issued',
              narration: r.donation?.reference ?? null,
              donorName: r.donorName ?? null,
              fundName: r.fund?.name ?? null,
              pdfAvailable: true,
            })),
          );
          return;
        }
        throw registryErr;
      }
    } catch (e) {
      setDocError(formatApiError(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [docPage, docKind, docSearch, voucherType, docStatus, dateFrom, dateTo]);

  React.useEffect(() => { void loadRegistry(); }, [loadRegistry]);
  React.useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const pdfPath = (row: RegistryDoc) =>
    row.kind === 'voucher' ? `finance/vouchers/${row.id}/pdf` : `finance/receipts/${row.id}/pdf`;

  const handlePreview = async (row: RegistryDoc) => {
    try {
      setBusyId(row.id);
      const blob = await apiDownloadBlob(pdfPath(row));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) { setDocError(formatApiError(e)); } finally { setBusyId(null); }
  };
  const handleDownload = async (row: RegistryDoc) => {
    try {
      setBusyId(row.id);
      triggerBrowserDownload(await apiDownloadBlob(pdfPath(row)), `${row.number.replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`);
    } catch (e) { setDocError(formatApiError(e)); } finally { setBusyId(null); }
  };
  const handlePrint = async (row: RegistryDoc) => {
    try {
      setBusyId(row.id);
      openBlobInNewTab(await apiDownloadBlob(pdfPath(row)));
    } catch (e) { setDocError(formatApiError(e)); } finally { setBusyId(null); }
  };
  const handleBatchDownload = async () => {
    for (const row of items.slice(0, 15)) {
      try {
        triggerBrowserDownload(await apiDownloadBlob(pdfPath(row)), `${row.number.replace(/[^A-Za-z0-9_-]/g, '_')}.pdf`);
        await new Promise((r) => setTimeout(r, 400));
      } catch { /* continue */ }
    }
  };

  return (
    <div className="space-y-6">
      {docError && <FeedbackBanner tone="error">{docError}</FeedbackBanner>}
      <SectionCard title={title} subtitle="Search, preview, print, and download official PDFs">
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={docSearch}
              onChange={(e) => setDocSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setDocPage(0); void loadRegistry(); } }}
              placeholder="Search number, narration, donor..."
              className="w-full pl-9 pr-3 h-9 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <select value={docKind} onChange={(e) => { setDocKind(e.target.value as typeof docKind); setDocPage(0); }} className="h-9 px-3 text-xs font-bold rounded-lg border border-slate-200 bg-white">
            <option value="all">All Documents</option>
            <option value="voucher">Vouchers</option>
            <option value="receipt">Receipts</option>
          </select>
          <select value={voucherType} onChange={(e) => { setVoucherType(e.target.value); setDocPage(0); }} className="h-9 px-3 text-xs font-bold rounded-lg border border-slate-200 bg-white">
            <option value="">All Voucher Types</option>
            <option value="receipt">Receipt</option>
            <option value="payment">Payment</option>
            <option value="journal">Journal</option>
            <option value="contra">Contra</option>
          </select>
          <select value={docStatus} onChange={(e) => { setDocStatus(e.target.value); setDocPage(0); }} className="h-9 px-3 text-xs font-bold rounded-lg border border-slate-200 bg-white">
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="posted">Posted</option>
            <option value="issued">Issued</option>
          </select>
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setDocPage(0); }} className="h-9 px-3 text-xs rounded-lg border border-slate-200" />
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setDocPage(0); }} className="h-9 px-3 text-xs rounded-lg border border-slate-200" />
          <Button variant="outline" size="sm" onClick={() => { setDocPage(0); void loadRegistry(); }}>Apply</Button>
          <Button variant="outline" size="sm" onClick={() => { setDocSearch(''); setDocKind('all'); setVoucherType(''); setDocStatus(''); setDateFrom(''); setDateTo(''); setDocPage(0); }}>Reset</Button>
          <Button variant="secondary" size="sm" onClick={() => void handleBatchDownload()} disabled={!items.length}><Download className="w-3.5 h-3.5 mr-1" /> Batch PDF</Button>
        </div>
        {previewUrl && (
          <div className="mb-4 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">PDF Preview</span>
              <Button variant="ghost" size="sm" onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}>Close</Button>
            </div>
            <iframe title="Document preview" src={previewUrl} className="w-full h-[480px] bg-white" />
          </div>
        )}
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400 animate-pulse">Loading document registry…</div>
        ) : items.length === 0 ? (
          <EmptyState title="No documents found" description="Adjust filters or post vouchers to populate the registry." icon={FileSearch} />
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Number</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Kind</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Type</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Party</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</th>
                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                    <th className="px-4 py-2.5 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {items.map((row) => {
                    const dt = d(row.date);
                    return (
                      <tr key={`${row.kind}-${row.id}`} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-mono text-xs font-bold text-indigo-700">{row.number}</td>
                        <td className="px-4 py-2.5 text-xs capitalize">{row.kind}</td>
                        <td className="px-4 py-2.5 text-xs">{row.type}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500">{dt ? dt.toLocaleDateString('en-IN') : '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-700 max-w-[180px] truncate">{row.donorName || row.narration || row.fundName || '—'}</td>
                        <td className="px-4 py-2.5 text-xs font-bold text-right">{fmt(row.amount)}</td>
                        <td className="px-4 py-2.5"><span className={cn('inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold uppercase', row.status === 'posted' && 'bg-emerald-100 text-emerald-700', row.status === 'issued' && 'bg-emerald-100 text-emerald-700', row.status === 'draft' && 'bg-amber-100 text-amber-700')}>{row.status}</span></td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" disabled={busyId === row.id} onClick={() => void handlePreview(row)}><Eye className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" disabled={busyId === row.id} onClick={() => void handleDownload(row)}><Download className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" disabled={busyId === row.id} onClick={() => void handlePrint(row)}><Printer className="w-4 h-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between pt-3">
              <p className="text-xs text-slate-500">{items.length} on this page</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={docPage === 0} onClick={() => setDocPage(docPage - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={items.length < DOC_PAGE_SIZE} onClick={() => setDocPage(docPage + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );

}


