import * as React from 'react';
import {
  Calendar,
  Users,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  RefreshCw,
  ListTodo,
  Radio,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { EVENT_STATUS_LABELS } from '@/lib/eventLifecycle';
import { labelForEventType } from '@/lib/eventTypeCatalog';
import type { ERPModule } from '@/types';
import { ReadinessBadge } from './ReadinessBadge';
import { WorkflowCommandPanel } from './WorkflowCommandPanel';
import { useRealtimeOps } from '@/hooks/useRealtimeOps';
import { CampusFilterSelect } from '@/components/intelligence/CampusFilterSelect';
import { MinistryIntelligenceStrip } from '@/components/intelligence/MinistryIntelligenceStrip';
import { VolunteerHealthPanel } from '@/components/intelligence/VolunteerHealthPanel';
import { RealtimeStatusBar } from '@/components/operations/RealtimeStatusBar';
import { OperationalGuidanceBanner } from '@/components/operations/OperationalGuidanceBanner';
import type { CommandCenterPayload } from '@/lib/operationsTypes';
import {
  filterOperationalTestArtifacts,
  filterOperationalTestTaskTitles,
} from '@/lib/operationalEventFilter';

function sanitizeCommandCenter(payload: CommandCenterPayload): CommandCenterPayload {
  const todayServices = filterOperationalTestArtifacts(payload.todayServices);
  const upcomingEvents = filterOperationalTestArtifacts(payload.upcomingEvents);
  const volunteerGaps = filterOperationalTestArtifacts(payload.volunteerGaps);
  const pendingApprovals = filterOperationalTestArtifacts(payload.pendingApprovals);
  const myTasks = filterOperationalTestTaskTitles(payload.myTasks);
  const teamTasks = filterOperationalTestTaskTitles(payload.teamTasks);
  const overdueTasks = filterOperationalTestTaskTitles(payload.overdueTasks);
  return {
    ...payload,
    todayServices,
    upcomingEvents,
    volunteerGaps,
    pendingApprovals,
    myTasks,
    teamTasks,
    overdueTasks,
    summary: {
      ...payload.summary,
      todayServiceCount: todayServices.length,
      upcomingEventCount: upcomingEvents.length,
      volunteerGapCount: volunteerGaps.length,
      pendingApprovalCount: pendingApprovals.length,
      overdueTaskCount: overdueTasks.length,
    },
  };
}

const LENS_LABELS: Record<string, string> = {
  super_admin: 'All campuses',
  operations: 'Church operations',
  pastoral: 'Pastoral care',
  finance: 'Finance desk',
  volunteer_coordinator: 'Volunteers',
  general: 'My week',
};

const UCOS_OPEN_EVENT_ID = 'ucos_open_event_id';
const UCOS_LIVE_SERVICE_ID = 'ucos_live_service_id';

type OperationalInsights = {
  predictive: {
    volunteerShortageRisk: boolean;
    burnoutRisk: boolean;
    serviceRisk: boolean;
    operationalDelayRisk: boolean;
  };
  readinessTrend: { averageScore: number; blockedCount: number; warningCount: number };
  volunteer: { overloadedMembers: Array<{ memberId: string; activeAssignments: number }>; shortageRoles: string[] };
};

export function OperationsCommandCenter({
  onModuleChange,
  compact = false,
}: {
  onModuleChange?: import('@/types').ModuleNavigate;
  /** Calmer Home layout — fewer stats, no duplicate intelligence panels */
  compact?: boolean;
}) {
  const [data, setData] = React.useState<CommandCenterPayload | null>(null);
  const [insights, setInsights] = React.useState<OperationalInsights | null>(null);
  const [campusId, setCampusId] = React.useState('');
  const [operatorCount, setOperatorCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      const q = campusId ? `?campusId=${encodeURIComponent(campusId)}` : '';
      const [cc, ins] = await Promise.all([
        apiRequest<unknown>(`operations/command-center${q}`, { method: 'GET' }),
        apiRequest<unknown>(`operations/operational-insights${q}`, { method: 'GET' }).catch(() => null),
      ]);
      setData(sanitizeCommandCenter(parseApiResponse<CommandCenterPayload>(cc)));
      if (ins) setInsights(parseApiResponse<OperationalInsights>(ins));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load your church week overview');
    } finally {
      setLoading(false);
    }
  }, [campusId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const { connectionState } = useRealtimeOps(
    () => {
      void load();
    },
    undefined,
    {
      presenceContext: 'command-center',
      onPresenceChange: (ops) => setOperatorCount(ops.length),
    },
  );

  const openEvent = (id: string) => {
    sessionStorage.setItem(UCOS_OPEN_EVENT_ID, id);
    onModuleChange?.('events');
  };

  const openSundayMode = (serviceId: string) => {
    sessionStorage.setItem(UCOS_LIVE_SERVICE_ID, serviceId);
    onModuleChange?.('sunday-mode');
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading your week…</p>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-rose-600 font-medium">{error ?? 'Week overview is unavailable right now'}</p>;
  }

  const s = data.summary;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-5 h-5 text-indigo-600" />
            <Badge className="bg-indigo-100 text-indigo-800 border-none text-[9px] font-black uppercase tracking-widest">
              {LENS_LABELS[data.lens] ?? data.lens}
            </Badge>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
            {compact ? 'What needs attention' : 'This week at church'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {compact
              ? 'Services, volunteers, and tasks that need a decision today.'
              : 'Services, events, volunteers, tasks, and attendance for the week ahead.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CampusFilterSelect value={campusId} onChange={setCampusId} />
          <RealtimeStatusBar state={connectionState} operatorCount={operatorCount} />
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} className="gap-2 min-h-[44px]">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-2 min-h-[44px] bg-violet-600"
            onClick={() => {
              const first = data?.todayServices[0];
              if (first) openSundayMode(first.id);
              else onModuleChange?.('sunday-mode');
            }}
          >
            <Radio className="w-4 h-4" /> Sunday Service
          </Button>
        </div>
      </div>

      {!compact && <MinistryIntelligenceStrip campusId={campusId || undefined} />}

      <OperationalGuidanceBanner
        hintId={s.volunteerGapCount > 0 ? 'volunteer-gap' : 'sunday-prep'}
        onModuleChange={onModuleChange}
      />

      {error && <p className="text-sm text-amber-700 font-medium">{error}</p>}

      <div className={cn('grid gap-3', compact ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6')}>
        {[
          { label: "Today's services", value: s.todayServiceCount, icon: Calendar, tone: 'text-indigo-600', show: true },
          { label: 'Volunteer gaps', value: s.volunteerGapCount, icon: Users, tone: s.volunteerGapCount ? 'text-rose-600' : 'text-emerald-600', show: !compact || s.volunteerGapCount > 0 },
          { label: 'Pending approvals', value: s.pendingApprovalCount, icon: Clock, tone: 'text-amber-600', show: !compact || s.pendingApprovalCount > 0 },
          { label: 'Overdue tasks', value: s.overdueTaskCount, icon: ListTodo, tone: s.overdueTaskCount ? 'text-rose-600' : 'text-slate-500', show: !compact || s.overdueTaskCount > 0 },
          { label: 'Upcoming events', value: s.upcomingEventCount, icon: Calendar, tone: 'text-slate-600', show: !compact },
          { label: 'Unread alerts', value: s.unreadNotificationCount, icon: Bell, tone: 'text-indigo-600', show: !compact || s.unreadNotificationCount > 0 },
        ]
          .filter((stat) => stat.show)
          .map((stat) => (
          <Card key={stat.label} className="border-slate-100 shadow-sm rounded-2xl">
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={cn('w-5 h-5 shrink-0', stat.tone)} />
              <div>
                <p className="text-xs text-slate-400">{stat.label}</p>
                <p className="text-xl font-semibold text-slate-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(s.blockedOperations > 0 || s.warningOperations > 0) && (
        <Card className="border-amber-200 bg-amber-50/80 rounded-2xl">
          <CardContent className="p-4 flex flex-wrap items-center gap-3 text-sm font-medium text-amber-900">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {s.blockedOperations > 0 && <span>{s.blockedOperations} operation(s) blocked</span>}
            {s.warningOperations > 0 && <span>{s.warningOperations} need attention</span>}
          </CardContent>
        </Card>
      )}

      {!compact && insights && (
        <Card className="border-indigo-100 bg-indigo-50/40 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-black">This week&apos;s watchlist</CardTitle>
            <CardDescription>
              Overall preparation {insights.readinessTrend.averageScore}% · items to keep an eye on
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[
              { on: insights.predictive.volunteerShortageRisk, label: 'Volunteer gaps' },
              { on: insights.predictive.burnoutRisk, label: 'Team fatigue' },
              { on: insights.predictive.serviceRisk, label: 'Sunday prep' },
              { on: insights.predictive.operationalDelayRisk, label: 'Behind schedule' },
            ].map((sig) => (
              <Badge
                key={sig.label}
                className={cn(
                  'text-[9px] font-black uppercase',
                  sig.on ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800',
                )}
              >
                {sig.label}: {sig.on ? 'Needs attention' : 'Looks good'}
              </Badge>
            ))}
            {insights.volunteer.shortageRoles.slice(0, 3).map((role) => (
              <Badge key={role} variant="outline" className="text-[9px] font-bold">
                Low coverage: {role}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border-none shadow-sm rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg font-black">Today&apos;s services</CardTitle>
            <CardDescription>How prepared each service is and who is serving</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.todayServices.length === 0 ? (
              <p className="text-sm text-slate-500 font-medium py-6 text-center">No services scheduled today.</p>
            ) : (
              data.todayServices.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  onClick={() => openEvent(svc.id)}
                  className="w-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 text-left transition-all"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{svc.name}</p>
                    <p className="text-xs text-slate-500 font-medium">
                      {new Date(svc.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      · {svc.volunteerCount} volunteers
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ReadinessBadge level={svc.readiness.level} score={svc.readiness.score} />
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </button>
              ))
            )}
            {data.todayServices.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {data.todayServices.map((svc) => (
                  <Button key={`live-${svc.id}`} type="button" size="sm" variant="outline" className="min-h-[44px]" onClick={() => openSundayMode(svc.id)}>
                    <Radio className="w-4 h-4 mr-1" /> Sunday Service: {svc.name}
                  </Button>
                ))}
              </div>
            )}
            <Button type="button" variant="ghost" className="w-full text-indigo-600 font-bold" onClick={() => onModuleChange?.('events')}>
              All events
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg font-black">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: 'Live check-in', mod: 'attendance' as ERPModule, icon: CheckCircle2 },
              { label: 'Assign volunteers', mod: 'volunteers' as ERPModule, icon: Users },
              { label: 'Notifications', mod: 'notifications' as ERPModule, icon: Bell },
              { label: 'Pending tasks', mod: 'workflow-monitor' as ERPModule, icon: ListTodo },
            ].map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => onModuleChange?.(a.mod)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 hover:bg-slate-50 text-sm font-bold text-slate-700"
              >
                <a.icon className="w-4 h-4 text-indigo-500" />
                {a.label}
                <ChevronRight className="w-4 h-4 ml-auto text-slate-300" />
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black">Upcoming events</CardTitle>
            <CardDescription>What&apos;s on the calendar and how prepared each gathering is</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => onModuleChange?.('events')}>
            All events
          </Button>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-50">
            {data.upcomingEvents.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center font-medium">
                No upcoming events on this campus. Create one from Events or Worship Services.
              </p>
            ) : (
              data.upcomingEvents.slice(0, compact ? 4 : 8).map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => openEvent(ev.id)}
                  className="w-full flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-slate-50/80 px-2 rounded-xl text-left"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900">{ev.name}</p>
                    <p className="text-xs text-slate-500 font-medium">
                      {labelForEventType(ev.type)} · {new Date(ev.date).toLocaleDateString()} · {EVENT_STATUS_LABELS[ev.status] ?? ev.status}
                    </p>
                  </div>
                  <ReadinessBadge level={ev.readiness.level} score={ev.readiness.score} />
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {data.volunteerGaps.length > 0 && (
        <Card className="border-rose-100 bg-rose-50/30 rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg font-black text-rose-900">Volunteer shortages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.volunteerGaps.map((g) => (
              <button
                key={g.eventId}
                type="button"
                onClick={() => {
                  sessionStorage.setItem('ucos_assign_event_id', g.eventId);
                  onModuleChange?.('volunteers');
                }}
                className="w-full flex justify-between items-center p-3 rounded-xl bg-white border border-rose-100 text-left"
              >
                <span className="font-bold text-slate-800">{g.name}</span>
                <Badge className="bg-rose-100 text-rose-800 border-none">{g.count} assigned</Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {!compact && (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <VolunteerHealthPanel compact />
      </div>
      )}

      <WorkflowCommandPanel
        myTasks={data.myTasks}
        teamTasks={data.teamTasks}
        overdueTasks={data.overdueTasks}
        recentActivity={data.recentActivity}
        pendingApprovals={data.pendingApprovals}
        onModuleChange={onModuleChange}
        onRefresh={load}
      />
    </div>
  );
}
