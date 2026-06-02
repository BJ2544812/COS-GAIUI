import * as React from 'react';
import { BarChart3, Heart, Users, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import type { ExecutiveDashboard } from '@/lib/ministryIntelligenceTypes';
import { CampusFilterSelect } from './CampusFilterSelect';

export function ExecutiveInsightPanel() {
  const [campusId, setCampusId] = React.useState('');
  const [data, setData] = React.useState<ExecutiveDashboard | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const q = campusId ? `?campusId=${encodeURIComponent(campusId)}` : '';
    setLoading(true);
    void (async () => {
      try {
        const j = await apiRequest<unknown>(`operations/ministry-intelligence/executive${q}`, { method: 'GET' });
        setData(parseApiResponse<ExecutiveDashboard>(j));
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [campusId]);

  if (loading) {
    return <p className="text-sm text-slate-500 py-12 text-center">Loading church overview…</p>;
  }

  if (!data) {
    return <p className="text-sm text-rose-600 py-8 text-center">Church overview is unavailable right now.</p>;
  }

  const stats = [
    { label: 'People connected', value: data.ministryHealth.engagementScore, icon: Heart, tone: 'text-rose-500' },
    { label: 'Sunday prepared', value: `${data.operationalHealth.serviceReadiness}%`, icon: Calendar, tone: 'text-indigo-500' },
    { label: 'Active volunteers', value: data.volunteerEngagement.trackedVolunteers, icon: Users, tone: 'text-sky-500' },
    { label: 'Event attendance', value: data.attendanceTrend.eventAttendanceTotal, icon: TrendingUp, tone: 'text-emerald-500' },
    { label: 'Needs follow-up', value: data.ministryHealth.atRiskMembers, icon: AlertTriangle, tone: 'text-amber-600' },
    { label: 'Open reminders', value: data.operationalHealth.operationalAlerts, icon: BarChart3, tone: 'text-violet-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-slate-900">Church overview</h3>
          <p className="text-sm text-slate-500 font-medium">A snapshot of people, Sunday, volunteers, and attendance</p>
        </div>
        <CampusFilterSelect value={campusId} onChange={setCampusId} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-2xl border-slate-100 shadow-sm">
            <CardContent className="p-4">
              <s.icon className={`w-5 h-5 mb-2 ${s.tone}`} />
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{s.label}</p>
              <p className="text-xl font-black text-slate-900">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl border-slate-100">
        <CardHeader>
          <CardTitle className="text-lg font-black">Items to watch</CardTitle>
          <CardDescription>Based on volunteers, attendance, Sunday prep, and pending tasks</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-medium">
          {[
            ['Volunteer gaps', data.predictive.staffingShortage],
            ['Team fatigue', data.predictive.burnout],
            ['Sunday prep', data.predictive.serviceRisk],
            ['Tasks backing up', data.predictive.workflowBottleneck],
            ['Attendance dip', data.predictive.attendanceDrop],
          ].map(([label, sig]) => (
            <div
              key={label as string}
              className={`p-4 rounded-xl border ${(sig as { risk: boolean }).risk ? 'border-amber-200 bg-amber-50' : 'border-emerald-100 bg-emerald-50/50'}`}
            >
              <p className="font-bold text-slate-900">{label as string}</p>
              <p className="text-xs text-slate-600 mt-1">{(sig as { risk: boolean }).risk ? 'Attention recommended' : 'Within normal range'}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
