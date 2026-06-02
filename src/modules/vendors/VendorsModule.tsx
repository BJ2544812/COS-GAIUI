import React from 'react';
import { CreditCard, DollarSign, Plus, ReceiptText, Store, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModuleHeader, ActionButton, FeedbackBanner, SectionCard, StatCard } from '@/components/modules/ModuleHeader';
import { ERPModule } from '@/types';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { formatCurrencyAmount } from '@/lib/formatCurrency';
import { useSettings } from '@/context/SettingsContext';

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

export function VendorsModule({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  const { settings } = useSettings();
  const [tab, setTab] = React.useState<'vendors' | 'payables' | 'payroll'>('vendors');
  const [vendors, setVendors] = React.useState<any[]>([]);
  const [payables, setPayables] = React.useState<any[]>([]);
  const [payrollRuns, setPayrollRuns] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fmt = React.useCallback(
    (value: number) => formatCurrencyAmount(value, settings.financial.currency, { maximumFractionDigits: 0 }),
    [settings.financial.currency],
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

  const stats = React.useMemo(() => {
    const outstanding = payables.reduce((s, b) => s + n(b.outstanding), 0);
    const overdue = payables.filter((b) => String(b.status || '').toLowerCase() === 'overdue').length;
    const pendingPayroll = payrollRuns.filter((r) => String(r.status || '').toLowerCase() !== 'closed');
    const payrollDue = pendingPayroll.reduce((s, r) => s + n(r.totalNet), 0);
    return { outstanding, overdue, payrollDue, pendingPayrollCount: pendingPayroll.length };
  }, [payables, payrollRuns]);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <ModuleHeader
        title="Vendors, Payables & Payroll"
        subtitle="Vendors, bills, and payroll — linked to vouchers in Finance."
        status="live"
        icon={Store}
        actions={
          <>
            <ActionButton label="Accounting" icon={CreditCard} variant="secondary" onClick={() => onModuleChange?.('finance')} />
            <ActionButton label="Refresh" icon={Users} variant="secondary" onClick={() => void load()} />
            <ActionButton label="Add Vendor" icon={Plus} variant="primary" onClick={() => onModuleChange?.('finance')} />
          </>
        }
      />
      {error && <FeedbackBanner tone="error">{error}</FeedbackBanner>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Vendors" value={vendors.length} icon={Store} />
        <StatCard label="Outstanding Payables" value={fmt(stats.outstanding)} icon={ReceiptText} />
        <StatCard label="Overdue Bills" value={stats.overdue} icon={DollarSign} />
        <StatCard label="Payroll Due" value={fmt(stats.payrollDue)} icon={Users} />
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1 w-fit">
        {[
          ['vendors', 'Vendor Workspace'],
          ['payables', 'Payables Center'],
          ['payroll', 'Payroll Workspace'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest ${tab === id ? 'bg-white text-indigo-600' : 'text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <SectionCard title="Loading vendor operations">
          <p className="text-sm text-slate-500">Fetching vendors, bills, and payroll runs...</p>
        </SectionCard>
      ) : null}

      {!loading && tab === 'vendors' && (
        <SectionCard title="Vendor Dashboard" subtitle="Vendor master records and payable linkage">
          <div className="space-y-2">
            {vendors.length === 0 ? (
              <p className="text-sm text-slate-500">No vendors created yet.</p>
            ) : (
              vendors.map((v) => {
                const linked = payables.filter((b) => b.vendorId === v.id);
                const out = linked.reduce((s, b) => s + n(b.outstanding), 0);
                return (
                  <div key={v.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">{v.name}</p>
                      <p className="text-sm font-black text-slate-900">{fmt(out)}</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Bills: {linked.length} · Category: {v.category || 'General'} · Contact: {v.contactName || '—'}</p>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
      )}

      {!loading && tab === 'payables' && (
        <SectionCard title="Payables Center" subtitle="Pending, partially paid, paid, and overdue bills">
          <div className="space-y-2">
            {payables.length === 0 ? (
              <p className="text-sm text-slate-500">No payable bills on record.</p>
            ) : (
              payables.map((b) => (
                <div key={b.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900">{b.billNo || b.id.slice(0, 8)}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">{b.status}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                    <p>Total: <span className="font-bold">{fmt(n(b.amount))}</span></p>
                    <p>Outstanding: <span className="font-bold">{fmt(n(b.outstanding))}</span></p>
                    <p>Paid: <span className="font-bold">{fmt(n(b.amount) - n(b.outstanding))}</span></p>
                    <p>Date: <span className="font-bold">{b.billDate ? new Date(b.billDate).toLocaleDateString() : '—'}</span></p>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      )}

      {!loading && tab === 'payroll' && (
        <SectionCard title="Payroll Workspace" subtitle="Runs, liabilities, payout status and payslip readiness">
          <div className="space-y-2">
            {payrollRuns.length === 0 ? (
              <p className="text-sm text-slate-500">No payroll runs available.</p>
            ) : (
              payrollRuns.map((run) => (
                <div key={run.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900">Run {run.periodYear}-{String(run.periodMonth).padStart(2, '0')}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">{run.status}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
                    <p>Gross: <span className="font-bold">{fmt(n(run.totalGross))}</span></p>
                    <p>Deductions: <span className="font-bold">{fmt(n(run.totalDeductions))}</span></p>
                    <p>Net: <span className="font-bold">{fmt(n(run.totalNet))}</span></p>
                    <p>Lines: <span className="font-bold">{(run.lines || []).length}</span></p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-4">
            <Button variant="outline" onClick={() => onModuleChange?.('finance')}>Open Finance Payroll Actions</Button>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
