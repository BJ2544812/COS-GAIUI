import React from 'react';
import { Activity, Users, Heart, CalendarCheck, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ModuleHeader, StatCard } from '@/components/modules/ModuleHeader';
import { ERPModule } from '@/types';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

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

function aggregateGrowthStage(rows: { growthStage?: string | null }[]): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = (r.growthStage || 'Unknown').trim() || 'Unknown';
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export function EngagementModule({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  const [loading, setLoading] = React.useState(true);
  const [memberAnalytics, setMemberAnalytics] = React.useState<any>(null);
  const [financial, setFinancial] = React.useState<any>(null);
  const [attendance, setAttendance] = React.useState<any>(null);
  const [risk, setRisk] = React.useState<any>(null);
  const [growthBreakdown, setGrowthBreakdown] = React.useState<{ label: string; count: number }[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        apiRequest('analytics/members'),
        apiRequest('analytics/financial'),
        apiRequest('analytics/attendance'),
        apiRequest('analytics/risk'),
        apiRequest('members?limit=500'),
      ]);
      if (cancelled) return;
      const pick = (i: number) => {
        if (results[i].status !== 'fulfilled') return null;
        try {
          return parseApiResponse(results[i].value);
        } catch {
          return null;
        }
      };
      setMemberAnalytics(pick(0));
      setFinancial(pick(1));
      setAttendance(pick(2));
      setRisk(pick(3));
      const memberRows = (pick(4) as any[]) || [];
      setGrowthBreakdown(aggregateGrowthStage(Array.isArray(memberRows) ? memberRows : []));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const periodGiving = financial?.totalGiving?.period;
  const avgHeadcount = attendance?.periodStats?.average;
  const maxGrowth = Math.max(1, ...growthBreakdown.map((g) => g.count));

  return (
    <div className="space-y-10 animate-in fade-in duration-700 text-left pb-20">
      <ModuleHeader
        title="Engagement overview"
        subtitle="Same analytics sources as Dashboard and Analytics — no synthetic scores or predictive metrics."
        status="partial"
        icon={Activity}
      />

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 font-medium" role="status">
        <span className="font-black">Operational honesty:</span> Numbers below are only what the API returns for your tenant.
        Member journey bars use live <code className="text-xs bg-white px-1 rounded">growthStage</code> from the Members directory (up to 500 rows loaded).
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Total members"
          value={fmtNum(memberAnalytics?.total, loading)}
          icon={Users}
          iconColor="text-indigo-600"
          iconBg="bg-indigo-50"
          loading={loading}
        />
        <StatCard
          label="Active (status)"
          value={fmtNum(memberAnalytics?.active, loading)}
          icon={Users}
          iconColor="text-teal-600"
          iconBg="bg-teal-50"
          loading={loading}
        />
        <StatCard
          label="Giving (period)"
          value={fmtMoney(periodGiving, loading)}
          icon={Heart}
          iconColor="text-rose-600"
          iconBg="bg-rose-50"
          loading={loading}
        />
        <StatCard
          label="Avg headcount / event"
          value={fmtNum(
            avgHeadcount != null ? Math.round(avgHeadcount * 10) / 10 : null,
            loading,
          )}
          icon={CalendarCheck}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border border-slate-100 shadow-sm rounded-[2rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50">
            <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              Members by growth stage
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 font-medium">
              Aggregated client-side from the members list — not a separate intelligence service.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-5">
            {growthBreakdown.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium">No members loaded for this tenant.</p>
            ) : (
              growthBreakdown.map((g) => (
                <div key={g.label} className="space-y-2">
                  <div className="flex justify-between text-sm font-bold text-slate-800">
                    <span>{g.label}</span>
                    <span className="text-slate-500">{g.count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full bg-indigo-500')}
                      style={{ width: `${(g.count / maxGrowth) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm rounded-[2rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50">
            <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">Risk snapshot</CardTitle>
            <CardDescription className="text-xs text-slate-500 font-medium">
              From <code className="text-xs bg-slate-100 px-1 rounded">/analytics/risk</code> — simple period comparisons.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-4 text-sm text-slate-600 font-medium">
            {!risk && !loading ? (
              <p className="text-slate-400">No risk data returned.</p>
            ) : (
              <>
                <p>
                  Giving (30d vs prior):{' '}
                  <span className="font-black text-slate-900">
                    {risk?.giving?.isDropSignal ? 'Soft dip signal' : 'Stable / up'}
                  </span>
                </p>
                <p>
                  Attendance (30d vs prior):{' '}
                  <span className="font-black text-slate-900">
                    {risk?.attendance?.isDropSignal ? 'Soft dip signal' : 'Stable / up'}
                  </span>
                </p>
              </>
            )}
            <div className="flex flex-wrap gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl text-[10px] font-black uppercase tracking-widest"
                onClick={() => onModuleChange?.('analytics')}
              >
                Open analytics
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl text-[10px] font-black uppercase tracking-widest"
                onClick={() => onModuleChange?.('members')}
              >
                Open members
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
