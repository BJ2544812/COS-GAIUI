import React from 'react';
import {
  CreditCard,
  DollarSign,
  FileText,
  History,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Store,
  Users,
  Wallet,
} from 'lucide-react';
import {
  ModuleHeader,
  ActionButton,
  EmptyState,
  FeedbackBanner,
  PageLayout,
  SectionCard,
  StatCard,
} from '@/components/modules/ModuleHeader';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ERPModule, ModuleNavigate } from '@/types';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { formatCurrencyAmount } from '@/lib/formatCurrency';
import { useSettings } from '@/context/SettingsContext';
import { cn } from '@/lib/utils';
import { ds } from '@/lib/designSystem';

function n(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string' && v.trim()) {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }
  if (v && typeof v === 'object' && 'toString' in v) {
    const x = Number((v as { toString: () => string }).toString());
    return Number.isFinite(x) ? x : 0;
  }
  return 0;
}

const EMPTY_VENDOR_FORM = {
  name: '',
  category: '',
  contactName: '',
  email: '',
  phone: '',
};

type BillFilter = 'all' | 'open' | 'paid' | 'overdue';

function pickAccount(accounts: any[], type: string, namePattern?: RegExp) {
  const list = accounts.filter((a) => a.type === type);
  if (namePattern) return list.find((a) => namePattern.test(String(a.name || ''))) ?? list[0];
  return list[0];
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function nextBillNo() {
  return `BILL-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
}

export function VendorsModule({
  onModuleChange,
  embedded = false,
  lockedTab,
  accounts = [],
  funds = [],
  onRefresh,
}: {
  onModuleChange?: ModuleNavigate;
  embedded?: boolean;
  lockedTab?: 'vendors' | 'payables';
  accounts?: any[];
  funds?: any[];
  onRefresh?: () => void;
}) {
  const { settings } = useSettings();
  const [tab, setTab] = React.useState<'vendors' | 'payables'>(lockedTab ?? 'vendors');
  const [vendors, setVendors] = React.useState<any[]>([]);
  const [payables, setPayables] = React.useState<any[]>([]);
  const [payrollRuns, setPayrollRuns] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [payablesSearch, setPayablesSearch] = React.useState('');
  const [billFilter, setBillFilter] = React.useState<BillFilter>('all');
  const [selectedVendorId, setSelectedVendorId] = React.useState<string | null>(null);
  const [vendorHistory, setVendorHistory] = React.useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [showAddVendor, setShowAddVendor] = React.useState(false);
  const [showBill, setShowBill] = React.useState(false);
  const [showPayment, setShowPayment] = React.useState(false);
  const [showProfile, setShowProfile] = React.useState(false);
  const [profileVendor, setProfileVendor] = React.useState<any | null>(null);
  const [vendorForm, setVendorForm] = React.useState(EMPTY_VENDOR_FORM);
  const [billForm, setBillForm] = React.useState({
    vendorId: '',
    billNo: nextBillNo(),
    billDate: todayIsoDate(),
    dueDate: '',
    amount: '',
    description: '',
    expenseAccountId: '',
    payableAccountId: '',
    fundId: '',
  });
  const [paymentForm, setPaymentForm] = React.useState({
    billId: '',
    paymentDate: todayIsoDate(),
    amount: '',
    paymentAccountId: '',
    notes: '',
  });
  const [saving, setSaving] = React.useState(false);

  const fmt = React.useCallback(
    (value: number) => formatCurrencyAmount(value, settings.financial.currency, { maximumFractionDigits: 0 }),
    [settings.financial.currency],
  );

  const expenseAccounts = React.useMemo(() => accounts.filter((a) => a.type === 'Expense'), [accounts]);
  const payableAccounts = React.useMemo(() => accounts.filter((a) => a.type === 'Liability'), [accounts]);
  const paymentAccounts = React.useMemo(
    () => accounts.filter((a) => a.type === 'Asset' && /bank|cash|current|hdfc/i.test(String(a.name || ''))),
    [accounts],
  );

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [vendorsJson, billsJson, payrollJson] = await Promise.all([
        apiRequest<unknown>('finance/vendors'),
        apiRequest<unknown>('finance/payables/bills'),
        apiRequest<unknown>('finance/payroll/runs'),
      ]);
      setVendors(parseApiResponse<any[]>(vendorsJson) || []);
      setPayables(parseApiResponse<any[]>(billsJson) || []);
      setPayrollRuns(parseApiResponse<any[]>(payrollJson) || []);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 5000);
    return () => window.clearTimeout(t);
  }, [success]);

  const stats = React.useMemo(() => {
    const outstanding = payables.reduce((s, b) => s + n(b.outstanding), 0);
    const overdue = payables.filter((b) => String(b.status || '').toLowerCase() === 'overdue').length;
    const open = payables.filter((b) => n(b.outstanding) > 0).length;
    const pendingPayroll = payrollRuns.filter((r) => String(r.status || '').toLowerCase() !== 'closed');
    const payrollDue = pendingPayroll.reduce((s, r) => s + n(r.totalNet), 0);
    return { outstanding, overdue, open, payrollDue, pendingPayrollCount: pendingPayroll.length };
  }, [payables, payrollRuns]);

  const activeTab = lockedTab ?? tab;

  const filteredVendors = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) =>
      [v.name, v.category, v.contactName, v.email, v.phone]
        .map((x) => String(x || '').toLowerCase())
        .some((x) => x.includes(q)),
    );
  }, [vendors, search]);

  const filteredPayables = React.useMemo(() => {
    let rows = payables;
    if (billFilter === 'open') rows = rows.filter((b) => n(b.outstanding) > 0);
    else if (billFilter === 'paid') rows = rows.filter((b) => n(b.outstanding) <= 0);
    else if (billFilter === 'overdue') rows = rows.filter((b) => String(b.status || '').toLowerCase() === 'overdue');

    const q = payablesSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((b) => {
      const vendor = vendors.find((v) => v.id === b.vendorId);
      const hay = [b.billNo, b.status, b.description, vendor?.name]
        .map((x) => String(x || '').toLowerCase())
        .join(' ');
      return hay.includes(q);
    });
  }, [payables, payablesSearch, vendors, billFilter]);

  const openBillDialog = (vendorId?: string) => {
    const expense = pickAccount(accounts, 'Expense', /utilities|supplies|admin|general/i) ?? expenseAccounts[0];
    const payable = pickAccount(accounts, 'Liability', /payable/i) ?? payableAccounts[0];
    setBillForm({
      vendorId: vendorId || vendors[0]?.id || '',
      billNo: nextBillNo(),
      billDate: todayIsoDate(),
      dueDate: '',
      amount: '',
      description: '',
      expenseAccountId: expense?.id || '',
      payableAccountId: payable?.id || '',
      fundId: funds[0]?.id || '',
    });
    setShowBill(true);
  };

  const openPaymentDialog = (bill: any) => {
    const bank = pickAccount(accounts, 'Asset', /bank|hdfc|current/i) ?? paymentAccounts[0];
    setPaymentForm({
      billId: bill.id,
      paymentDate: todayIsoDate(),
      amount: String(n(bill.outstanding)),
      paymentAccountId: bank?.id || '',
      notes: `Payment for ${bill.billNo || 'bill'}`,
    });
    setShowPayment(true);
  };

  const loadVendorHistory = async (vendorId: string) => {
    try {
      setHistoryLoading(true);
      const res = await apiRequest<unknown>(
        `finance/audit/logs?entityType=Vendor&entityId=${encodeURIComponent(vendorId)}&limit=20`,
      );
      setVendorHistory(parseApiResponse<any[]>(res) || []);
    } catch {
      setVendorHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const toggleVendor = (vendorId: string) => {
    const next = selectedVendorId === vendorId ? null : vendorId;
    setSelectedVendorId(next);
    if (next) void loadVendorHistory(next);
  };

  const refreshAll = async () => {
    await load();
    onRefresh?.();
  };

  const createVendor = async () => {
    const name = vendorForm.name.trim();
    if (!name) {
      setError('Vendor name is required.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await apiRequest('finance/vendors', {
        method: 'POST',
        body: JSON.stringify({
          name,
          category: vendorForm.category.trim() || null,
          contactName: vendorForm.contactName.trim() || null,
          email: vendorForm.email.trim() || null,
          phone: vendorForm.phone.trim() || null,
        }),
      });
      setShowAddVendor(false);
      setVendorForm(EMPTY_VENDOR_FORM);
      setSuccess(`Vendor "${name}" added. You can record a bill next.`);
      await refreshAll();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const createBill = async () => {
    const amount = n(billForm.amount);
    if (!billForm.vendorId || !billForm.billNo.trim() || amount <= 0) {
      setError('Vendor, bill number, and amount are required.');
      return;
    }
    if (!billForm.expenseAccountId || !billForm.payableAccountId) {
      setError('Select expense and payable accounts.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await apiRequest('finance/payables/bills', {
        method: 'POST',
        body: JSON.stringify({
          vendorId: billForm.vendorId,
          billNo: billForm.billNo.trim(),
          billDate: billForm.billDate,
          dueDate: billForm.dueDate || null,
          amount,
          expenseAccountId: billForm.expenseAccountId,
          payableAccountId: billForm.payableAccountId,
          fundId: billForm.fundId || null,
          description: billForm.description.trim() || null,
        }),
      });
      setShowBill(false);
      setSuccess(`Bill ${billForm.billNo} recorded — a voucher was posted automatically.`);
      await refreshAll();
      setTab('payables');
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const recordPayment = async () => {
    const amount = n(paymentForm.amount);
    if (!paymentForm.billId || amount <= 0 || !paymentForm.paymentAccountId) {
      setError('Bill, amount, and payment account are required.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await apiRequest('finance/payables/payments', {
        method: 'POST',
        body: JSON.stringify({
          billId: paymentForm.billId,
          paymentDate: paymentForm.paymentDate,
          amount,
          paymentAccountId: paymentForm.paymentAccountId,
          notes: paymentForm.notes.trim() || null,
        }),
      });
      setShowPayment(false);
      setSuccess('Payment recorded — voucher posted and bill balance updated.');
      await refreshAll();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const toolbar = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={activeTab === 'payables' ? payablesSearch : search}
          onChange={(e) => (activeTab === 'payables' ? setPayablesSearch(e.target.value) : setSearch(e.target.value))}
          placeholder={activeTab === 'payables' ? 'Search bills…' : 'Search vendors…'}
          className={cn(ds.formInput, 'pl-10')}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ActionButton label="Refresh" icon={RefreshCw} variant="secondary" onClick={() => void refreshAll()} />
        {activeTab === 'vendors' ? (
          <>
            <ActionButton label="Add vendor" icon={Plus} variant="secondary" onClick={() => setShowAddVendor(true)} />
            <ActionButton
              label="Record bill"
              icon={FileText}
              variant="primary"
              onClick={() => openBillDialog(selectedVendorId || undefined)}
              disabled={vendors.length === 0}
            />
          </>
        ) : (
          <ActionButton
            label="Record bill"
            icon={FileText}
            variant="primary"
            onClick={() => openBillDialog()}
            disabled={vendors.length === 0}
          />
        )}
      </div>
    </div>
  );

  const body = (
    <>
      {error && <FeedbackBanner tone="error">{error}</FeedbackBanner>}
      {success && <FeedbackBanner tone="success">{success}</FeedbackBanner>}

      {embedded && (
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Vendor workspace</p>
              <p className="mt-1 text-xs font-medium text-slate-600 leading-relaxed">
                Add vendors, record bills, pay them down — each step creates vouchers in the registry automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {!embedded && !lockedTab && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Vendors" value={vendors.length} icon={Store} />
          <StatCard label="Outstanding" value={fmt(stats.outstanding)} icon={ReceiptText} />
          <StatCard label="Open bills" value={stats.open} icon={DollarSign} />
          <StatCard label="Payroll due" value={fmt(stats.payrollDue)} icon={Users} />
        </div>
      )}

      {toolbar}

      {!lockedTab && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1 w-fit">
            {[
              ['vendors', 'Vendors'],
              ['payables', 'Bills & payments'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id as 'vendors' | 'payables')}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap',
                  activeTab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {activeTab === 'payables' && (
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ['all', 'All'],
                  ['open', 'Open'],
                  ['paid', 'Paid'],
                  ['overdue', 'Overdue'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBillFilter(id)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider',
                    billFilter === id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-50 text-slate-500',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <SectionCard title="Loading vendors">
          <p className="text-sm text-slate-500">Fetching vendors and bills…</p>
        </SectionCard>
      ) : null}

      {!loading && activeTab === 'vendors' && (
        <SectionCard title="Vendor directory" subtitle="Tap a vendor for profile, bills, and audit history">
          <div className="mt-4 space-y-3">
            {filteredVendors.length === 0 ? (
              <EmptyState
                icon={Store}
                title={vendors.length === 0 ? 'No vendors yet' : 'No matching vendors'}
                description="Start with one vendor — then record your first bill."
                action={
                  vendors.length === 0 ? (
                    <ActionButton label="Add vendor" icon={Plus} variant="primary" onClick={() => setShowAddVendor(true)} />
                  ) : undefined
                }
              />
            ) : (
              filteredVendors.map((v) => {
                const linked = payables.filter((b) => b.vendorId === v.id);
                const out = linked.reduce((s, b) => s + n(b.outstanding), 0);
                const open = selectedVendorId === v.id;
                return (
                  <div key={v.id} className="rounded-xl border border-slate-200 overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 p-4">
                      <button type="button" onClick={() => toggleVendor(v.id)} className="min-w-0 flex-1 text-left">
                        <p className="font-bold text-slate-900 truncate">{v.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {v.category || 'General'} · {linked.length} bill{linked.length === 1 ? '' : 's'}
                        </p>
                      </button>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right mr-2">
                          <p className="text-sm font-black text-slate-900">{fmt(out)}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outstanding</p>
                        </div>
                        <Button type="button" size="sm" variant="outline" className="text-xs" onClick={() => { setProfileVendor(v); setShowProfile(true); }}>
                          Profile
                        </Button>
                        <Button type="button" size="sm" className="text-xs" onClick={() => openBillDialog(v.id)}>
                          Bill
                        </Button>
                      </div>
                    </div>
                    {open && (
                      <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-4 space-y-3 text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-600">
                          <p><span className="font-bold text-slate-800">Contact:</span> {v.contactName || '—'}</p>
                          <p><span className="font-bold text-slate-800">Email:</span> {v.email || '—'}</p>
                          <p><span className="font-bold text-slate-800">Phone:</span> {v.phone || '—'}</p>
                        </div>
                        {linked.length > 0 && (
                          <div>
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Bills</p>
                            <div className="space-y-1">
                              {linked.slice(0, 6).map((b) => (
                                <div key={b.id} className="flex justify-between text-xs py-1">
                                  <span>{b.billNo} · {String(b.status || '').toUpperCase()}</span>
                                  <span className="font-bold">{fmt(n(b.outstanding))}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                            <History className="h-3.5 w-3.5" /> History
                          </p>
                          {historyLoading ? (
                            <p className="text-xs text-slate-400">Loading…</p>
                          ) : vendorHistory.length === 0 ? (
                            <p className="text-xs text-slate-400">No audit entries yet for this vendor.</p>
                          ) : (
                            vendorHistory.slice(0, 5).map((h) => (
                              <p key={h.id} className="text-xs text-slate-600 py-0.5">
                                {h.action} · {h.createdAt ? new Date(h.createdAt).toLocaleString() : '—'}
                              </p>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
      )}

      {!loading && activeTab === 'payables' && (
        <SectionCard title="Bills & payments" subtitle="Pay open bills — each payment posts a voucher">
          <div className="mt-4 space-y-3">
            {filteredPayables.length === 0 ? (
              <EmptyState
                icon={ReceiptText}
                title={payables.length === 0 ? 'No bills yet' : 'No bills match filters'}
                description="Record a bill from the Vendors tab — it will appear here with a linked voucher."
                action={
                  payables.length === 0 && vendors.length > 0 ? (
                    <ActionButton label="Record bill" icon={FileText} variant="primary" onClick={() => openBillDialog()} />
                  ) : undefined
                }
              />
            ) : (
              filteredPayables.map((b) => {
                const vendor = vendors.find((v) => v.id === b.vendorId);
                const outstanding = n(b.outstanding);
                return (
                  <div key={b.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900">{b.billNo || b.id.slice(0, 8)}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{vendor?.name || 'Unknown vendor'}</p>
                      </div>
                      <span className={cn(
                        'rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider',
                        outstanding > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
                      )}>
                        {b.status}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600">
                      <p>Total: <span className="font-bold text-slate-900">{fmt(n(b.amount))}</span></p>
                      <p>Outstanding: <span className="font-bold text-slate-900">{fmt(outstanding)}</span></p>
                      <p>Paid: <span className="font-bold text-slate-900">{fmt(n(b.amount) - outstanding)}</span></p>
                      <p>Date: <span className="font-bold text-slate-900">{b.billDate ? new Date(b.billDate).toLocaleDateString() : '—'}</span></p>
                    </div>
                    {outstanding > 0 && (
                      <div className="mt-3 flex justify-end">
                        <Button type="button" size="sm" className="gap-1.5" onClick={() => openPaymentDialog(b)}>
                          <Wallet className="h-3.5 w-3.5" /> Record payment
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
      )}

      {/* Add vendor */}
      <Dialog open={showAddVendor} onOpenChange={setShowAddVendor}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add vendor</DialogTitle>
            <DialogDescription>Who did you buy from? You can record bills right after.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="block space-y-1">
              <span className={ds.formLabel}>Vendor name *</span>
              <input className={ds.formInput} value={vendorForm.name} onChange={(e) => setVendorForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Chennai Electric Co." />
            </label>
            <label className="block space-y-1">
              <span className={ds.formLabel}>Category</span>
              <input className={ds.formInput} value={vendorForm.category} onChange={(e) => setVendorForm((f) => ({ ...f, category: e.target.value }))} placeholder="Utilities, Supplies…" />
            </label>
            <label className="block space-y-1">
              <span className={ds.formLabel}>Contact name</span>
              <input className={ds.formInput} value={vendorForm.contactName} onChange={(e) => setVendorForm((f) => ({ ...f, contactName: e.target.value }))} />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className={ds.formLabel}>Email</span>
                <input type="email" className={ds.formInput} value={vendorForm.email} onChange={(e) => setVendorForm((f) => ({ ...f, email: e.target.value }))} />
              </label>
              <label className="block space-y-1">
                <span className={ds.formLabel}>Phone</span>
                <input className={ds.formInput} value={vendorForm.phone} onChange={(e) => setVendorForm((f) => ({ ...f, phone: e.target.value }))} />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowAddVendor(false)}>Cancel</Button>
            <Button type="button" disabled={saving} onClick={() => void createVendor()}>{saving ? 'Saving…' : 'Save vendor'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record bill */}
      <Dialog open={showBill} onOpenChange={setShowBill}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record bill</DialogTitle>
            <DialogDescription>Creates the payable and posts a journal voucher automatically.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="block space-y-1">
              <span className={ds.formLabel}>Vendor *</span>
              <select className={ds.formInput} value={billForm.vendorId} onChange={(e) => setBillForm((f) => ({ ...f, vendorId: e.target.value }))}>
                <option value="">Select vendor</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className={ds.formLabel}>Bill number *</span>
                <input className={ds.formInput} value={billForm.billNo} onChange={(e) => setBillForm((f) => ({ ...f, billNo: e.target.value }))} />
              </label>
              <label className="block space-y-1">
                <span className={ds.formLabel}>Amount *</span>
                <input type="number" min="0" className={ds.formInput} value={billForm.amount} onChange={(e) => setBillForm((f) => ({ ...f, amount: e.target.value }))} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className={ds.formLabel}>Bill date</span>
                <input type="date" className={ds.formInput} value={billForm.billDate} onChange={(e) => setBillForm((f) => ({ ...f, billDate: e.target.value }))} />
              </label>
              <label className="block space-y-1">
                <span className={ds.formLabel}>Due date</span>
                <input type="date" className={ds.formInput} value={billForm.dueDate} onChange={(e) => setBillForm((f) => ({ ...f, dueDate: e.target.value }))} />
              </label>
            </div>
            <label className="block space-y-1">
              <span className={ds.formLabel}>Expense account</span>
              <select className={ds.formInput} value={billForm.expenseAccountId} onChange={(e) => setBillForm((f) => ({ ...f, expenseAccountId: e.target.value }))}>
                {expenseAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
              </select>
            </label>
            <label className="block space-y-1">
              <span className={ds.formLabel}>Payable account</span>
              <select className={ds.formInput} value={billForm.payableAccountId} onChange={(e) => setBillForm((f) => ({ ...f, payableAccountId: e.target.value }))}>
                {payableAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
              </select>
            </label>
            {funds.length > 0 && (
              <label className="block space-y-1">
                <span className={ds.formLabel}>Fund (optional)</span>
                <select className={ds.formInput} value={billForm.fundId} onChange={(e) => setBillForm((f) => ({ ...f, fundId: e.target.value }))}>
                  <option value="">None</option>
                  {funds.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </label>
            )}
            <label className="block space-y-1">
              <span className={ds.formLabel}>Description</span>
              <input className={ds.formInput} value={billForm.description} onChange={(e) => setBillForm((f) => ({ ...f, description: e.target.value }))} placeholder="What was purchased?" />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowBill(false)}>Cancel</Button>
            <Button type="button" disabled={saving} onClick={() => void createBill()}>{saving ? 'Posting…' : 'Record bill'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record payment */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>Pays down the bill and posts a payment voucher.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="block space-y-1">
              <span className={ds.formLabel}>Amount *</span>
              <input type="number" min="0" className={ds.formInput} value={paymentForm.amount} onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))} />
            </label>
            <label className="block space-y-1">
              <span className={ds.formLabel}>Payment date</span>
              <input type="date" className={ds.formInput} value={paymentForm.paymentDate} onChange={(e) => setPaymentForm((f) => ({ ...f, paymentDate: e.target.value }))} />
            </label>
            <label className="block space-y-1">
              <span className={ds.formLabel}>Pay from account</span>
              <select className={ds.formInput} value={paymentForm.paymentAccountId} onChange={(e) => setPaymentForm((f) => ({ ...f, paymentAccountId: e.target.value }))}>
                {paymentAccounts.map((a) => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
              </select>
            </label>
            <label className="block space-y-1">
              <span className={ds.formLabel}>Notes</span>
              <input className={ds.formInput} value={paymentForm.notes} onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))} />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowPayment(false)}>Cancel</Button>
            <Button type="button" disabled={saving} onClick={() => void recordPayment()}>{saving ? 'Posting…' : 'Record payment'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Vendor profile (view) */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{profileVendor?.name || 'Vendor profile'}</DialogTitle>
            <DialogDescription>Contact details and category. To rename, add a new vendor and use this for reference.</DialogDescription>
          </DialogHeader>
          {profileVendor && (
            <div className="space-y-2 text-sm text-slate-600 py-2">
              <p><span className="font-bold text-slate-800">Category:</span> {profileVendor.category || 'General'}</p>
              <p><span className="font-bold text-slate-800">Contact:</span> {profileVendor.contactName || '—'}</p>
              <p><span className="font-bold text-slate-800">Email:</span> {profileVendor.email || '—'}</p>
              <p><span className="font-bold text-slate-800">Phone:</span> {profileVendor.phone || '—'}</p>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowProfile(false)}>Close</Button>
            {profileVendor && (
              <Button type="button" onClick={() => { setShowProfile(false); openBillDialog(profileVendor.id); }}>Record bill</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  if (embedded || lockedTab) {
    return <div className="space-y-6">{body}</div>;
  }

  return (
    <PageLayout>
      <ModuleHeader
        title="Vendors"
        subtitle="Bills, payments, and vendor history — linked to vouchers."
        status="live"
        icon={Store}
        actions={
          <>
            <ActionButton label="Finance" icon={CreditCard} variant="secondary" onClick={() => onModuleChange?.('finance', 'vendors')} />
            <ActionButton label="Refresh" icon={RefreshCw} variant="secondary" onClick={() => void refreshAll()} />
            <ActionButton label="Add vendor" icon={Plus} variant="primary" onClick={() => setShowAddVendor(true)} />
          </>
        }
      />
      {body}
    </PageLayout>
  );
}
