import React from 'react';
import { CalendarClock, CircleDollarSign, CreditCard, Heart, PieChart, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModuleHeader, ActionButton, FeedbackBanner, PageLayout, SectionCard, StatCard } from '@/components/modules/ModuleHeader';
import { ModuleTabs } from '@/components/modules/ModuleTabs';
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

export function BudgetsModule({
  onModuleChange,
  initialTab,
  embedded = false,
  hideEventFinance = false,
  lockedTab,
}: {
  onModuleChange?: (m: ERPModule) => void;
  initialTab?: 'funds' | 'budgets' | 'event-finance';
  embedded?: boolean;
  hideEventFinance?: boolean;
  /** When embedded in Finance workspace, parent owns tab — render one section only. */
  lockedTab?: 'funds' | 'budgets' | 'event-finance';
}) {
  const { settings } = useSettings();
  const [tab, setTab] = React.useState<'funds' | 'budgets' | 'event-finance'>(lockedTab ?? initialTab ?? 'funds');
  React.useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fundRows, setFundRows] = React.useState<Array<{ fund: any; statement: any }>>([]);
  const [budgetReport, setBudgetReport] = React.useState<any | null>(null);
  const [events, setEvents] = React.useState<any[]>([]);
  const [eventStatements, setEventStatements] = React.useState<any[]>([]);

  const fmt = React.useCallback(
    (value: number) => formatCurrencyAmount(value, settings.financial.currency, { maximumFractionDigits: 0 }),
    [settings.financial.currency],
  );

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [fundsJson, budgetJson, eventsJson] = await Promise.all([
        apiRequest<unknown>('finance/funds'),
        apiRequest<unknown>('finance/budgets/vs-actual'),
        apiRequest<unknown>('events'),
      ]);
      const funds = parseApiResponse<any[]>(fundsJson) || [];
      const statements = await Promise.all(
        funds.map(async (f) => {
          try {
            const st = await apiRequest<unknown>(`finance/funds/${f.id}/statement`);
            return { fund: f, statement: parseApiResponse<any>(st) };
          } catch {
            return { fund: f, statement: null };
          }
        }),
      );
      const ev = (parseApiResponse<any[]>(eventsJson) || []).slice(0, 12);
      const evStatements = await Promise.all(
        ev.map(async (e) => {
          try {
            const st = await apiRequest<unknown>(`finance/events/${e.id}/accounting-statement`);
            return { event: e, statement: parseApiResponse<any>(st) };
          } catch {
            return { event: e, statement: null };
          }
        }),
      );
      setFundRows(statements);
      setBudgetReport(parseApiResponse<any>(budgetJson));
      setEvents(ev);
      setEventStatements(evStatements);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const totals = React.useMemo(() => {
    const restricted = fundRows
      .filter((r) => String(r.fund?.type || '').toLowerCase() === 'restricted')
      .reduce((s, r) => s + n(r.statement?.closingBalance), 0);
    const designated = fundRows
      .filter((r) => String(r.fund?.type || '').toLowerCase() === 'boarddesignated')
      .reduce((s, r) => s + n(r.statement?.closingBalance), 0);
    const unrestricted = fundRows
      .filter((r) => String(r.fund?.type || '').toLowerCase() === 'unrestricted')
      .reduce((s, r) => s + n(r.statement?.closingBalance), 0);
    const budget = n(budgetReport?.totals?.budget);
    const actual = n(budgetReport?.totals?.actual);
    const utilization = budget > 0 ? (actual / budget) * 100 : 0;
    return { restricted, designated, unrestricted, budget, actual, utilization };
  }, [fundRows, budgetReport]);

  React.useEffect(() => {
    if (lockedTab) setTab(lockedTab);
    else if (initialTab) setTab(initialTab);
  }, [initialTab, lockedTab]);

  const activeTab = lockedTab ?? tab;
  const budgetTabs = [
    { id: 'funds', label: 'Fund dashboard' },
    { id: 'budgets', label: 'Budget workspace' },
    ...(hideEventFinance ? [] : [{ id: 'event-finance', label: 'Event finance' }]),
  ] as const;

  const inner = (
    <>
      {error && <FeedbackBanner tone="error">{error}</FeedbackBanner>}
      {!lockedTab && !embedded && (
        <ModuleTabs
          tabs={[...budgetTabs]}
          activeId={activeTab}
          onChange={(id) => setTab(id as typeof tab)}
          aria-label="Budget sections"
        />
      )}

      {!embedded && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard label="Restricted Funds" value={fmt(totals.restricted)} icon={Target} />
          <StatCard label="Designated Funds" value={fmt(totals.designated)} icon={CircleDollarSign} />
          <StatCard label="Unrestricted Funds" value={fmt(totals.unrestricted)} icon={CircleDollarSign} />
          <StatCard label="Budget Utilization" value={`${totals.utilization.toFixed(1)}%`} icon={CalendarClock} />
        </div>
      )}

      {loading ? (
        <SectionCard title="Loading">
          <p className="text-sm text-slate-500">Fetching fund, budget, and event accounting data...</p>
        </SectionCard>
      ) : null}

      {!loading && activeTab === 'funds' && (
        <SectionCard title="Fund Accounting Dashboard" subtitle="Opening, receipts, spending, transfers, and closing balances">
          <div className="space-y-2">
            {fundRows.length === 0 ? (
              <p className="text-sm text-slate-500">No funds configured.</p>
            ) : (
              fundRows.map(({ fund, statement }) => {
                const closing = n(statement?.closingBalance);
                const receipts = n(statement?.receipts);
                const outflow = n(statement?.expensesAndTransfersOut);
                const utilization = receipts > 0 ? (outflow / receipts) * 100 : 0;
                return (
                  <div key={fund.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">{fund.name}</p>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400">{fund.type}</p>
                      </div>
                      <p className="text-lg font-black text-slate-900">{fmt(closing)}</p>
                    </div>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <p>Opening: <span className="font-bold">{fmt(n(statement?.openingBalance))}</span></p>
                      <p>Receipts: <span className="font-bold">{fmt(receipts)}</span></p>
                      <p>Outflow: <span className="font-bold">{fmt(outflow)}</span></p>
                      <p>Utilization: <span className="font-bold">{utilization.toFixed(1)}%</span></p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
      )}

      {!loading && activeTab === 'budgets' && (
        <SectionCard title="Budget Workspace" subtitle="Budget vs actual by dimensions with strict/soft tracking visibility">
          {budgetReport?.rows?.length ? (
            <div className="space-y-3">
              {budgetReport.rows.map((row: any) => (
                <div key={row.budgetId} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900">
                      {row.trackingMode} budget {row.fundId ? `· fund ${row.fundId.slice(0, 8)}` : ''}
                    </p>
                    <p className="text-sm font-black text-slate-700">{row.utilizationPercent.toFixed(1)}%</p>
                  </div>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <p>Budget: <span className="font-bold">{fmt(n(row.budgetAmount))}</span></p>
                    <p>Actual: <span className="font-bold">{fmt(n(row.actualAmount))}</span></p>
                    <p>Variance: <span className={`font-bold ${n(row.variance) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt(n(row.variance))}</span></p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No budget rows found for current financial year.</p>
          )}
        </SectionCard>
      )}

      {!loading && activeTab === 'event-finance' && !hideEventFinance && (
        <SectionCard title="Event Finance Workspace" subtitle="Per-event accounting statement and P&L visibility">
          <div className="space-y-3">
            {eventStatements.length === 0 ? (
              <p className="text-sm text-slate-500">No events found.</p>
            ) : (
              eventStatements.map((row) => {
                const t = row.statement?.totals;
                return (
                  <div key={row.event.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">{row.event.name}</p>
                      <Button size="sm" variant="outline" onClick={() => onModuleChange?.('events')}>Open Event</Button>
                    </div>
                    {t ? (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                        <p>Income: <span className="font-bold">{fmt(n(t.income))}</span></p>
                        <p>Expense: <span className="font-bold">{fmt(n(t.expenses))}</span></p>
                        <p>Net: <span className={`font-bold ${n(t.net) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt(n(t.net))}</span></p>
                        <p>Status: <span className="font-bold">{n(t.net) < 0 ? 'Overspend risk' : 'Healthy'}</span></p>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">No accounting statement linked yet.</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </SectionCard>
      )}
    </>
  );

  if (embedded || lockedTab) {
    return <div className="space-y-6">{inner}</div>;
  }

  return (
    <PageLayout>
      <ModuleHeader
        title="Funds, Budgets & Event Finance"
        subtitle="Fund transparency, budget limits, and how events affect your finances."
        status="live"
        icon={PieChart}
        actions={
          <>
            <ActionButton label="Accounting" icon={CreditCard} variant="secondary" onClick={() => onModuleChange?.('finance')} />
            <ActionButton label="Giving" icon={Heart} variant="secondary" onClick={() => onModuleChange?.('giving')} />
            <ActionButton label="Refresh" icon={CalendarClock} variant="primary" onClick={() => void load()} />
          </>
        }
      />
      {inner}
    </PageLayout>
  );
}
