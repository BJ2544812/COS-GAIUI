import * as React from 'react';
import { ArrowRight, BriefcaseBusiness, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackBanner, SectionCard } from '@/components/modules/ModuleHeader';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { formatCurrencyAmount } from '@/lib/formatCurrency';
import type { ERPModule } from '@/types';

function n(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string' && v.trim()) {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }
  return 0;
}

export function FinancePayrollPanel({
  currency,
  onModuleChange,
  onRefresh,
}: {
  currency: string;
  onModuleChange?: (m: ERPModule, tab?: string) => void;
  onRefresh?: () => void;
}) {
  const [runs, setRuns] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [banner, setBanner] = React.useState<string | null>(null);

  const fmt = React.useCallback(
    (value: number) => formatCurrencyAmount(value, currency, { maximumFractionDigits: 0 }),
    [currency],
  );

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest('finance/payroll/runs');
      setRuns(parseApiResponse<any[]>(res) || []);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const payRun = async (runId: string) => {
    if (!window.confirm('Post payroll payment voucher for this run?')) return;
    try {
      setBusyId(runId);
      setBanner(null);
      await apiRequest(`finance/payroll/runs/${runId}/pay`, { method: 'POST', body: {} });
      setBanner('Payroll payment posted — review vouchers in the registry.');
      await load();
      onRefresh?.();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusyId(null);
    }
  };

  const openRuns = runs.filter((r) => String(r.status || '').toLowerCase() !== 'closed');

  return (
    <div className="space-y-6">
      {error && <FeedbackBanner tone="error">{error}</FeedbackBanner>}
      {banner && <FeedbackBanner tone="success">{banner}</FeedbackBanner>}

      <SectionCard
        title="HR → Finance handoff"
        subtitle="Payroll is created in HR & Staff. Finance posts payment vouchers here."
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
          <div className="flex items-start gap-3">
            <BriefcaseBusiness className="h-8 w-8 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-900">Step 1 — HR generates the run</p>
              <p className="text-xs text-slate-600 mt-1">HR & Staff → Payroll → Generate run (creates accrual voucher).</p>
              <p className="text-sm font-bold text-slate-900 mt-3">Step 2 — Finance pays staff</p>
              <p className="text-xs text-slate-600 mt-1">Post payment voucher below when ready to disburse.</p>
            </div>
          </div>
          <Button variant="outline" className="shrink-0" onClick={() => onModuleChange?.('hr', 'payroll')}>
            Open HR Payroll <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Payroll runs" subtitle={`${openRuns.length} open · ${runs.length} total`}>
        {loading ? (
          <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
        ) : runs.length === 0 ? (
          <p className="text-sm text-slate-500">No payroll runs yet. Generate one from HR & Staff.</p>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => {
              const status = String(run.status || '').toLowerCase();
              const isClosed = status === 'closed';
              return (
                <div key={run.id} className="rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900">
                      {run.periodYear}-{String(run.periodMonth).padStart(2, '0')}
                    </p>
                    <div className="mt-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-600">
                      <span>Gross: <strong>{fmt(n(run.totalGross))}</strong></span>
                      <span>Deductions: <strong>{fmt(n(run.totalDeductions))}</strong></span>
                      <span>Net: <strong>{fmt(n(run.totalNet))}</strong></span>
                      <span>Lines: <strong>{(run.lines || []).length}</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">
                      {run.status || 'draft'}
                    </span>
                    {!isClosed && (
                      <Button size="sm" disabled={busyId === run.id} onClick={() => void payRun(run.id)}>
                        {busyId === run.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post payment'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
