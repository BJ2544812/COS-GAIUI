import * as React from 'react';
import {
  Loader2,
  Radio,
  ImageIcon,
  Eye,
  Pencil,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ds } from '@/lib/designSystem';
import { ModuleTabs } from '@/components/modules/ModuleTabs';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { formatCurrencyAmount } from '@/lib/formatCurrency';
import {
  EVENT_STATUS_COLORS,
  EVENT_STATUS_LABELS,
  WORKFLOW_PIPELINE_STAGES,
  attendanceSessionStatusLabel,
  workflowActionsForStatus,
  workflowStageIndex,
} from '@/lib/eventLifecycle';
import {
  publicRegistrationCount,
  isPublishedToWebsite,
  getEventPublicProfile,
  type EventPublicRegistration,
} from '@/lib/eventPublicProfile';
import { openSundayLive } from '@/lib/sundayServicesNavigation';
import { openAttendanceForEvent } from '@/lib/attendanceNavigation';
import { ServicePlanPanel } from '@/modules/sunday-services/ServicePlanPanel';
import type { EventWorkspaceTab } from '@/lib/eventWorkspaceNavigation';
import { UCOS_EVENT_WORKSPACE_TAB } from '@/lib/eventWorkspaceNavigation';
import type { ERPModule } from '@/types';

type WorkspaceData = {
  event: {
    id: string;
    name: string;
    type: string;
    date: string;
    status: string;
    location?: string | null;
    internalNotes?: string | null;
    registrationOpen?: boolean;
    opsConfig?: unknown;
    runSheet?: unknown;
    campus?: { id: string; name: string } | null;
    attendanceSessions?: Array<{
      id: string;
      name: string;
      date: string;
      status: string;
      _count?: { attendances: number };
    }>;
  };
  metrics: { attendeeCount: number; sessionCount: number; volunteerCount: number };
  responsibilities: Array<{
    id: string;
    role: string;
    status: string;
    member?: { id: string; name: string };
  }>;
  finance: {
    totals?: { income: number; expenses: number; net: number };
  } | null;
};

const WORKFLOW_STAGES = WORKFLOW_PIPELINE_STAGES;

function isServiceEvent(type: string): boolean {
  return type === 'Service';
}

function OverviewField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <p className={ds.kpiLabel}>{label}</p>
      <div className="text-sm font-semibold text-slate-800">{value}</div>
    </div>
  );
}

export function EventWorkspace({
  eventId,
  initialTab = 'overview',
  onTabChange,
  onModuleChange,
  onOpenSetup,
  currency,
}: {
  eventId: string;
  initialTab?: EventWorkspaceTab;
  onTabChange?: (tab: EventWorkspaceTab) => void;
  onModuleChange?: (m: ERPModule, tab?: string) => void;
  onOpenSetup?: () => void;
  currency: string;
}) {
  const [tab, setTab] = React.useState<EventWorkspaceTab>(initialTab);
  const [data, setData] = React.useState<WorkspaceData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [transitioning, setTransitioning] = React.useState(false);
  const [eventAttendees, setEventAttendees] = React.useState<
    Array<{
      member?: { name: string } | null;
      visitorName?: string | null;
      checkInTime?: string;
      status?: string;
      session?: { name: string };
    }>
  >([]);
  const [peopleLoading, setPeopleLoading] = React.useState(false);

  React.useEffect(() => {
    setTab(initialTab);
  }, [initialTab, eventId]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(UCOS_EVENT_WORKSPACE_TAB, tab);
    }
  }, [tab]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const j = await apiRequest<unknown>(`events/${eventId}/workspace`, { method: 'GET' });
      setData(parseApiResponse<WorkspaceData>(j));
    } catch (e) {
      setError(formatApiError(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    if (tab !== 'people' && tab !== 'reports') return;
    let cancelled = false;
    void (async () => {
      setPeopleLoading(true);
      try {
        const j = await apiRequest<unknown>(`attendance/event/${eventId}`, { method: 'GET' });
        if (!cancelled) setEventAttendees(parseApiResponse(j) ?? []);
      } catch {
        if (!cancelled) setEventAttendees([]);
      } finally {
        if (!cancelled) setPeopleLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab, eventId]);

  const transition = async (status: string) => {
    setTransitioning(true);
    setError(null);
    try {
      await apiRequest(`events/${eventId}/transition`, { method: 'POST', body: { status } });
      await load();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setTransitioning(false);
    }
  };

  const createCheckIn = async () => {
    if (!data?.event) return;
    try {
      const j = await apiRequest<unknown>('attendance/sessions', {
        method: 'POST',
        body: {
          name: `Check-in: ${data.event.name}`,
          date: data.event.date,
          type: data.event.type === 'Service' ? 'SERVICE' : 'EVENT',
          eventId: data.event.id,
          status: 'OPEN',
        },
      });
      const session = parseApiResponse<{ id: string }>(j);
      await load();
      openAttendanceForEvent(onModuleChange, data.event.id, session.id);
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  const downloadAttendanceCsv = () => {
    const lines = [
      ['session', 'name', 'status', 'checkInTime'].join(','),
      ...eventAttendees.map((r) =>
        [
          (r.session?.name ?? '').replace(/,/g, ' '),
          (r.member?.name ?? r.visitorName ?? '').replace(/,/g, ' '),
          r.status ?? '',
          r.checkInTime ?? '',
        ].join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-attendance-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadRegistrationsCsv = () => {
    if (!data) return;
    const regs = getEventPublicProfile(data.event.opsConfig).registrations ?? [];
    const lines = [
      ['name', 'email', 'phone', 'registered'].join(','),
      ...regs.map((r: EventPublicRegistration) =>
        [r.name, r.email ?? '', r.phone ?? '', r.createdAt ?? ''].join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-registrations-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-500 py-16 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-rose-600">{error ?? 'Event not found'}</p>;
  }

  const ev = data.event;
  const serviceMode = isServiceEvent(ev.type);
  const statusKey = ev.status || 'DRAFT';
  const workflowActions = workflowActionsForStatus(statusKey);
  const pub = getEventPublicProfile(ev.opsConfig);
  const stageIdx = workflowStageIndex(statusKey);

  const workspaceTabs: { id: EventWorkspaceTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'people', label: 'People' },
    { id: 'schedule', label: serviceMode ? 'Worship Planning' : 'Schedule' },
    { id: 'finance', label: 'Finance' },
    { id: 'reports', label: 'Reports' },
    { id: 'workflow', label: 'Workflow' },
  ];

  const when = new Date(ev.date);
  const regs = pub.registrations ?? [];
  const participationRate =
    regs.length > 0 ? Math.round((data.metrics.attendeeCount / regs.length) * 100) : null;

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-rose-600 font-medium rounded-xl bg-rose-50 px-4 py-3">{error}</p>
      )}

      <ModuleTabs tabs={workspaceTabs} activeId={tab} onChange={(id) => {
        const next = id as EventWorkspaceTab;
        setTab(next);
        onTabChange?.(next);
      }} aria-label="Event workspace" />

      {tab === 'overview' && (
        <div className="space-y-6">
          {pub.bannerImageUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-100 aspect-[21/9] max-h-56 bg-slate-100">
              <img src={pub.bannerImageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <Card className={cn(ds.card, 'border-none shadow-sm')}>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-2">
              <div className="space-y-2">
                <Badge className={cn('font-bold uppercase tracking-widest text-[10px]', EVENT_STATUS_COLORS[statusKey])}>
                  {EVENT_STATUS_LABELS[statusKey] ?? statusKey}
                </Badge>
                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">{ev.name}</CardTitle>
                <CardDescription className="text-base">
                  {when.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  {' · '}
                  {when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </CardDescription>
              </div>
              {onOpenSetup && (
                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onOpenSetup}>
                  <Pencil className="w-4 h-4" /> Edit details
                </Button>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              <OverviewField label="Venue" value={ev.location || ev.campus?.name || '—'} />
              <OverviewField
                label="Visibility"
                value={
                  isPublishedToWebsite(ev.opsConfig) ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700">
                      <Eye className="w-4 h-4" /> Public on website
                    </span>
                  ) : (
                    'Staff only'
                  )
                }
              />
              <OverviewField
                label="Capacity"
                value={pub.capacity ? `${pub.capacity} guests` : pub.acceptsRegistration ? 'Open registration' : '—'}
              />
              <OverviewField
                label="Description"
                value={
                  <span className="font-normal text-slate-600 line-clamp-4">
                    {pub.publicDescription || ev.internalNotes || 'No description yet.'}
                  </span>
                }
                className="sm:col-span-2 lg:col-span-3"
              />
              {!pub.bannerImageUrl && (
                <OverviewField
                  label="Image"
                  value={
                    <span className="inline-flex items-center gap-1.5 text-slate-400 font-normal">
                      <ImageIcon className="w-4 h-4" /> Add in Edit details
                    </span>
                  }
                />
              )}
              {pub.speaker && <OverviewField label="Speaker" value={pub.speaker} />}
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Checked in', value: data.metrics.attendeeCount },
              { label: 'Registered', value: publicRegistrationCount(ev.opsConfig) },
              { label: 'Serving', value: data.metrics.volunteerCount },
            ].map((m) => (
              <Card key={m.label} className={cn(ds.card, 'border-none')}>
                <CardContent className="p-5 text-center">
                  <p className={ds.kpiLabel}>{m.label}</p>
                  <p className={ds.kpiValue + ' mt-2'}>{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {serviceMode && (
            <Card className="rounded-2xl border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50/50">
              <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-violet-900">Live worship happens in Sunday Service</p>
                  <p className="text-sm text-violet-700/80 mt-0.5">Plan the flow here; run segments and timing when doors open.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setTab('schedule')}>
                    Worship Planning
                  </Button>
                  <Button type="button" size="sm" className="bg-violet-600" onClick={() => openSundayLive(onModuleChange, eventId)}>
                    <Radio className="w-4 h-4 mr-2" /> Sunday Service
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isPublishedToWebsite(ev.opsConfig) && !serviceMode && (
            <a
              href={`/events/${eventId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <ExternalLink className="w-4 h-4" /> View public page
            </a>
          )}
        </div>
      )}

      {tab === 'people' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Registrations', value: regs.length },
              { label: 'Checked in', value: data.metrics.attendeeCount },
              { label: 'Team assigned', value: data.responsibilities.length },
            ].map((m) => (
              <Card key={m.label} className={cn(ds.card, 'border-none')}>
                <CardContent className="p-5">
                  <p className={ds.kpiLabel}>{m.label}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className={cn(ds.card, 'border-none')}>
            <CardHeader>
              <CardTitle className="text-lg">Registrations</CardTitle>
              <CardDescription>
                {ev.registrationOpen || pub.acceptsRegistration
                  ? 'Guests who signed up online.'
                  : 'Enable registration in Edit details to collect RSVPs.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {regs.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">No registrations yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className={ds.tableHead + ' border-b text-left'}>
                        <th className="py-2 pr-4">Name</th>
                        <th className="py-2 pr-4">Email</th>
                        <th className="py-2 pr-4">Phone</th>
                        <th className="py-2">Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {regs.map((r) => (
                        <tr key={r.id} className="border-b border-slate-50">
                          <td className="py-3 font-medium">{r.name}</td>
                          <td className="py-3 text-slate-600">{r.email ?? '—'}</td>
                          <td className="py-3 text-slate-600">{r.phone ?? '—'}</td>
                          <td className="py-3 text-slate-500">
                            {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={cn(ds.card, 'border-none')}>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg">Team & assignments</CardTitle>
                <CardDescription>Volunteers serving at this gathering</CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  sessionStorage.setItem('ucos_assign_event_id', eventId);
                  onModuleChange?.('volunteers');
                }}
              >
                Manage in Volunteers
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.responsibilities.length === 0 ? (
                <p className="text-sm text-slate-500">No one assigned yet.</p>
              ) : (
                data.responsibilities.map((r) => (
                  <div key={r.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                    <span className="font-medium text-slate-800">{r.member?.name ?? '—'}</span>
                    <Badge variant="outline">{r.role}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className={cn(ds.card, 'border-none')}>
            <CardHeader className="flex flex-row justify-between items-center flex-wrap gap-3">
              <div>
                <CardTitle className="text-lg">Attendance</CardTitle>
                <CardDescription>Check-in lives in Attendance — sessions linked here</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => void createCheckIn()}>
                  New session
                </Button>
                <Button size="sm" onClick={() => onModuleChange?.('attendance')}>
                  Open Attendance
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {peopleLoading ? (
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </p>
              ) : (ev.attendanceSessions ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">No check-in sessions linked yet.</p>
              ) : (
                <div className="space-y-3">
                  {ev.attendanceSessions!.map((s) => (
                    <div key={s.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                      <div>
                        <p className="font-medium text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-500">
                          {s._count?.attendances ?? 0} checked in · {attendanceSessionStatusLabel(s.status)}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openAttendanceForEvent(onModuleChange, eventId, s.id)}>
                        Check in
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'schedule' && serviceMode && (
        <ServicePlanPanel eventId={eventId} onModuleChange={onModuleChange} embedded />
      )}

      {tab === 'schedule' && !serviceMode && (
        <div className="space-y-6">
          <Card className={cn(ds.card, 'border-none')}>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg">Sessions</CardTitle>
                <CardDescription>When people gather — each session links to Attendance</CardDescription>
              </div>
              <Button size="sm" onClick={() => void createCheckIn()}>Add session</Button>
            </CardHeader>
            <CardContent className="divide-y">
              {(ev.attendanceSessions ?? []).length === 0 ? (
                <p className="text-sm text-slate-500 py-4">No sessions scheduled yet.</p>
              ) : (
                ev.attendanceSessions!.map((s) => (
                  <div key={s.id} className="py-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-800">{s.name}</p>
                      <p className="text-xs text-slate-500">{new Date(s.date).toLocaleString()} · {attendanceSessionStatusLabel(s.status)}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => openAttendanceForEvent(onModuleChange, eventId, s.id)}>
                      Open check-in
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className={cn(ds.card, 'border-none')}>
            <CardHeader>
              <CardTitle className="text-lg">Program</CardTitle>
              <CardDescription>What guests can expect</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">
                {pub.publicDescription || ev.internalNotes || 'Add a description in Edit details.'}
              </p>
            </CardContent>
          </Card>

          {ev.internalNotes && pub.publicDescription && (
            <Card className={cn(ds.card, 'border-none')}>
              <CardHeader>
                <CardTitle className="text-lg">Staff notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{ev.internalNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === 'finance' && (
        <Card className={cn(ds.card, 'border-none')}>
          <CardHeader>
            <CardTitle className="text-lg">Event finances</CardTitle>
            <CardDescription>Read-only summary from posted vouchers in Finance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              {[
                { label: 'Income', value: data.finance?.totals?.income ?? 0 },
                { label: 'Expenses', value: data.finance?.totals?.expenses ?? 0 },
                { label: 'Net', value: data.finance?.totals?.net ?? 0 },
              ].map((row) => (
                <div key={row.label} className="rounded-xl bg-slate-50 p-5 text-center">
                  <p className={ds.kpiLabel}>{row.label}</p>
                  <p className="text-2xl font-black text-slate-900 mt-2">{formatCurrencyAmount(row.value, currency)}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Budgets and vouchers are managed in Finance. This view never duplicates accounting entries.
            </p>
            <Button variant="outline" size="sm" onClick={() => onModuleChange?.('finance')}>
              Open Finance
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === 'reports' && (
        <div className="space-y-6">
          <Card className={cn(ds.card, 'border-none')}>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg">Attendance</CardTitle>
              <Button size="sm" variant="outline" disabled={!eventAttendees.length} onClick={downloadAttendanceCsv}>
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {peopleLoading ? (
                <p className="text-sm text-slate-500">Loading…</p>
              ) : (
                <p className="text-sm text-slate-700">
                  <strong>{eventAttendees.length}</strong> check-in record(s) across linked sessions.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className={cn(ds.card, 'border-none')}>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="text-lg">Registrations</CardTitle>
              <Button size="sm" variant="outline" disabled={regs.length === 0} onClick={downloadRegistrationsCsv}>
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">
                <strong>{regs.length}</strong> online registration(s).
              </p>
            </CardContent>
          </Card>

          <Card className={cn(ds.card, 'border-none')}>
            <CardHeader>
              <CardTitle className="text-lg">Participation</CardTitle>
              <CardDescription>How registration translated to presence</CardDescription>
            </CardHeader>
            <CardContent>
              {participationRate !== null ? (
                <p className="text-sm text-slate-700">
                  <strong>{participationRate}%</strong> of registered guests checked in ({data.metrics.attendeeCount} of{' '}
                  {regs.length}).
                </p>
              ) : (
                <p className="text-sm text-slate-500">
                  {data.metrics.attendeeCount} total check-ins
                  {regs.length === 0 ? ' — enable registrations to compare RSVP to attendance.' : '.'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'workflow' && (
        <div className="space-y-6">
          <Card className={cn(ds.card, 'border-none')}>
            <CardHeader>
              <CardTitle className="text-lg">Event lifecycle</CardTitle>
              <CardDescription>
                Current: <strong>{EVENT_STATUS_LABELS[statusKey] ?? statusKey}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {WORKFLOW_STAGES.map((stage, i) => (
                  <div
                    key={stage.label}
                    className={cn(
                      'flex-1 min-w-[4.5rem] rounded-xl px-3 py-3 text-center text-xs font-bold transition-colors',
                      i <= stageIdx ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400',
                      i === stageIdx && 'ring-2 ring-indigo-300 ring-offset-2',
                    )}
                  >
                    {stage.label}
                  </div>
                ))}
              </div>

              {workflowActions.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {workflowActions.map((action) => (
                    <Button key={action.target} size="sm" variant="outline" disabled={transitioning} onClick={() => void transition(action.target)}>
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}

              <p className="text-sm text-slate-500">
                Status changes notify your team and may open registration or pastoral follow-ups automatically.
              </p>
              <Button variant="outline" size="sm" onClick={() => onModuleChange?.('workflow-monitor')}>
                View activity log
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
