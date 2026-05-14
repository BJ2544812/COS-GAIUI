import React from 'react';
import {
  BarChart3,
  Users,
  Heart,
  CalendarCheck,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { ERPModule } from '@/types';
import { ModuleHeader, StatCard } from '@/components/modules/ModuleHeader';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'members' | 'giving';

function fmtNum(v: unknown, loading: boolean): string {
  if (loading) return '…';
  if (v == null || Number.isNaN(Number(v))) return '—';
  return Number(v).toLocaleString('en-IN');
}

function fmtMoney(v: unknown, loading: boolean): string {
  if (loading) return '…';
  if (v == null || Number.isNaN(Number(v))) return '—';
  return `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function AnalyticsModule({ onModuleChange }: { onModuleChange?: (module: ERPModule) => void }) {
  const [tab, setTab] = React.useState<Tab>('overview');
  const [memberData, setMemberData] = React.useState<any>(null);
  const [financialData, setFinancialData] = React.useState<any>(null);
  const [attendanceData, setAttendanceData] = React.useState<any>(null);
  const [riskData, setRiskData] = React.useState<any>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      setLoadError(null);
      setLoading(true);
      const results = await Promise.allSettled([
        apiRequest('analytics/members'),
        apiRequest('analytics/financial'),
        apiRequest('analytics/attendance'),
        apiRequest('analytics/risk'),
      ]);
      const pick = (i: number) =>
        results[i].status === 'fulfilled' ? parseApiResponse(results[i].value) : null;
      if (results[0].status === 'rejected' && results[1].status === 'rejected') {
        setLoadError('Could not load analytics. Check permissions and API availability.');
      }
      setMemberData(pick(0));
      setFinancialData(pick(1));
      setAttendanceData(pick(2));
      setRiskData(pick(3));
      setLoading(false);
    };
    void load();
  }, []);

  const totalMembers = memberData?.total;
  const activeMembers = memberData?.active;
  const newMembersPeriod = memberData?.newMembers?.period;
  const periodGiving = financialData?.totalGiving?.period;
  const avgHeadcount = attendanceData?.periodStats?.average;
  const givingChange = financialData?.totalGiving?.changePercent;
  const attendanceDrop = attendanceData?.dropDetection;

  const kpis = [
    {
      label: 'Total members',
      value: fmtNum(totalMembers, loading),
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Active members',
      value: fmtNum(activeMembers, loading),
      icon: Users,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      label: 'Giving (period)',
      value: fmtMoney(periodGiving, loading),
      icon: Heart,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      trend:
        givingChange != null && !loading
          ? { value: `${Math.abs(Math.round(givingChange * 10) / 10)}% vs prior`, positive: givingChange >= 0 }
          : undefined,
    },
    {
      label: 'Avg headcount / event',
      value: fmtNum(
        avgHeadcount != null ? Math.round(avgHeadcount * 10) / 10 : null,
        loading,
      ),
      icon: CalendarCheck,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      trend:
        attendanceDrop?.isSignal && !loading
          ? { value: 'Attendance dip vs prior period', positive: false }
          : undefined,
    },
  ];

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'members', label: 'Members' },
    { id: 'giving', label: 'Giving' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 text-left pb-16">
      <ModuleHeader
        title="Analytics"
        subtitle="Summaries from members, giving, attendance, and simple risk signals — no decorative intelligence."
        status="partial"
        icon={BarChart3}
      />

      {loadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 font-medium" role="status">
          {loadError}
        </div>
      )}

      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 rounded-[1.5rem] w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all',
              tab === t.id
                ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50'
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/60',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {kpis.map((k) => (
              <StatCard
                key={k.label}
                label={k.label}
                value={k.value}
                icon={k.icon}
                iconColor={k.color}
                iconBg={k.bg}
                loading={loading}
                trend={k.trend}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-slate-100 shadow-sm rounded-[2rem] overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-50">
                <CardTitle className="text-base font-black text-slate-900">Operational signals</CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">
                  Derived from donations, attendance totals, and member status — not predictive AI.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-sm">
                {!riskData && !loading ? (
                  <p className="text-slate-400 font-medium">No risk snapshot loaded.</p>
                ) : (
                  <>
                    <div className="flex justify-between gap-4 py-2 border-b border-slate-50">
                      <span className="text-slate-600 font-medium">Giving (30d vs prior 30d)</span>
                      <span className="font-bold text-slate-900">
                        {riskData?.giving?.isDropSignal ? (
                          <span className="text-rose-600 inline-flex items-center gap-1">
                            <TrendingDown className="w-4 h-4" /> Soft dip
                          </span>
                        ) : (
                          <span className="text-emerald-600 inline-flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" /> Stable / up
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 py-2 border-b border-slate-50">
                      <span className="text-slate-600 font-medium">Attendance (30d vs prior 30d)</span>
                      <span className="font-bold text-slate-900">
                        {riskData?.attendance?.isDropSignal ? (
                          <span className="text-rose-600 inline-flex items-center gap-1">
                            <TrendingDown className="w-4 h-4" /> Soft dip
                          </span>
                        ) : (
                          <span className="text-emerald-600 inline-flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" /> Stable / up
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 py-2">
                      <span className="text-slate-600 font-medium">Non-active members (share)</span>
                      <span className="font-bold text-slate-900">
                        {riskData?.members?.churnRate != null
                          ? `${Math.round(riskData.members.churnRate * 10) / 10}%`
                          : '—'}
                      </span>
                    </div>
                    {Array.isArray(riskData?.largeTransactions) && riskData.largeTransactions.length > 0 && (
                      <div className="pt-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                          Large gifts (recent)
                        </p>
                        <ul className="space-y-2">
                          {riskData.largeTransactions.map((t: { id: string; amount: number; date: string }) => (
                            <li key={t.id} className="flex justify-between text-xs font-medium text-slate-700">
                              <span>{fmtMoney(t.amount, false)}</span>
                              <span className="text-slate-400">{new Date(t.date).toLocaleDateString()}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border border-slate-100 shadow-sm rounded-[2rem] overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-black text-slate-900">Next steps</CardTitle>
                  <CardDescription className="text-xs text-slate-500 font-medium">
                    Jump to modules that feed these numbers.
                  </CardDescription>
                </div>
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              </CardHeader>
              <CardContent className="p-6 flex flex-wrap gap-2">
                {(
                  [
                    ['members', 'Members'],
                    ['attendance', 'Attendance'],
                    ['giving', 'Giving'],
                    ['events', 'Events'],
                  ] as [ERPModule, string][]
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onModuleChange?.(id)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-slate-100 shadow-sm rounded-[2rem]">
              <CardHeader className="p-6 border-b border-slate-50">
                <CardTitle className="text-sm font-black text-slate-900">Giving — last 6 months</CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">From recorded donations.</CardDescription>
              </CardHeader>
              <CardContent className="p-0 max-h-64 overflow-y-auto">
                {loading ? (
                  <p className="p-6 text-sm text-slate-400">Loading…</p>
                ) : !financialData?.trendLast6Months?.length ? (
                  <p className="p-6 text-sm text-slate-400">No trend rows yet.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="px-6 py-3">Month</th>
                        <th className="px-6 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {financialData.trendLast6Months.map((row: { month: string; total: number }) => (
                        <tr key={row.month}>
                          <td className="px-6 py-3 font-medium text-slate-700">{row.month}</td>
                          <td className="px-6 py-3 text-right font-bold text-slate-900">
                            {fmtMoney(row.total, false)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>

            <Card className="border border-slate-100 shadow-sm rounded-[2rem]">
              <CardHeader className="p-6 border-b border-slate-50">
                <CardTitle className="text-sm font-black text-slate-900">Attendance — last 6 months</CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">
                  From attendance records in the selected window.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 max-h-64 overflow-y-auto">
                {loading ? (
                  <p className="p-6 text-sm text-slate-400">Loading…</p>
                ) : !attendanceData?.trendLast6Months?.length ? (
                  <p className="p-6 text-sm text-slate-400">No attendance trend rows yet.</p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="px-6 py-3">Month</th>
                        <th className="px-6 py-3 text-right">Headcount</th>
                        <th className="px-6 py-3 text-right">Events</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {attendanceData.trendLast6Months.map(
                        (row: { month: string; totalCount: number; distinctEvents: number }) => (
                          <tr key={row.month}>
                            <td className="px-6 py-3 font-medium text-slate-700">{row.month}</td>
                            <td className="px-6 py-3 text-right font-bold text-slate-900">
                              {fmtNum(row.totalCount, false)}
                            </td>
                            <td className="px-6 py-3 text-right text-slate-600">{fmtNum(row.distinctEvents, false)}</td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === 'members' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            label="Total on file"
            value={fmtNum(totalMembers, loading)}
            icon={Users}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
            loading={loading}
          />
          <StatCard
            label="Active (status)"
            value={fmtNum(activeMembers, loading)}
            icon={Users}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            loading={loading}
          />
          <StatCard
            label="New members (period)"
            value={fmtNum(newMembersPeriod, loading)}
            icon={Users}
            iconColor="text-sky-600"
            iconBg="bg-sky-50"
            loading={loading}
          />
          <StatCard
            label="Inactive (non-active statuses)"
            value={fmtNum(memberData?.inactive, loading)}
            icon={Users}
            iconColor="text-slate-600"
            iconBg="bg-slate-100"
            loading={loading}
          />
          <Card className="md:col-span-2 border border-slate-100 shadow-sm rounded-[2rem] p-6 text-sm text-slate-600 font-medium">
            Member growth rate compares this period to the previous period of equal length (see API / analytics/members).
          </Card>
        </div>
      )}

      {tab === 'giving' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard
              label="Period giving"
              value={fmtMoney(periodGiving, loading)}
              icon={Heart}
              iconColor="text-rose-600"
              iconBg="bg-rose-50"
              loading={loading}
            />
            <StatCard
              label="Fiscal YTD"
              value={fmtMoney(financialData?.totalGiving?.fyToDate, loading)}
              icon={Heart}
              iconColor="text-indigo-600"
              iconBg="bg-indigo-50"
              loading={loading}
            />
            <StatCard
              label="Vs prior period"
              value={
                loading
                  ? '…'
                  : financialData?.totalGiving?.changePercent != null
                    ? `${Math.round(financialData.totalGiving.changePercent * 10) / 10}%`
                    : '—'
              }
              icon={Heart}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
              loading={loading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-slate-100 shadow-sm rounded-[2rem]">
              <CardHeader className="p-6 border-b border-slate-50">
                <CardTitle className="text-sm font-black">By fund / campaign</CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">Current analytics period.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {!financialData?.fundDistribution?.length ? (
                  <p className="text-sm text-slate-400">No allocation rows.</p>
                ) : (
                  financialData.fundDistribution.map(
                    (f: { label: string; amount: number; percent: number }, i: number) => (
                      <div key={i} className="flex justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-800 truncate">{f.label}</span>
                        <span className="text-slate-600 shrink-0">
                          {fmtMoney(f.amount, false)}{' '}
                          <Badge variant="outline" className="ml-2 text-[9px] font-black">
                            {Math.round(f.percent)}%
                          </Badge>
                        </span>
                      </div>
                    ),
                  )
                )}
              </CardContent>
            </Card>

            <Card className="border border-slate-100 shadow-sm rounded-[2rem]">
              <CardHeader className="p-6 border-b border-slate-50">
                <CardTitle className="text-sm font-black">Top donors (period)</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-3">
                {!financialData?.topDonors?.length ? (
                  <p className="text-sm text-slate-400">No donor breakdown.</p>
                ) : (
                  financialData.topDonors.map((d: { name: string; amount: number }) => (
                    <div key={d.name} className="flex justify-between text-sm">
                      <span className="font-medium text-slate-800 truncate">{d.name}</span>
                      <span className="font-bold text-slate-900 shrink-0">{fmtMoney(d.amount, false)}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
