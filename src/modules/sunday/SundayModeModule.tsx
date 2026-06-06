import * as React from 'react';
import {
  Radio,
  Play,
  SkipForward,
  CheckCircle2,
  Users,
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import type { LiveOpsConfig, LiveOpsPayload } from '@/lib/liveOps';
import { segmentCountdownSeconds } from '@/lib/liveOps';
import type { RunSheetSegment } from '@/lib/eventLifecycle';
import { EVENT_STATUS_COLORS } from '@/lib/eventLifecycle';
import type { ERPModule } from '@/types';
import { openAttendanceForEvent } from '@/lib/attendanceNavigation';
import { openWorshipServices } from '@/lib/sundayServicesNavigation';
import { UCOS_EVENT_WORKSPACE_TAB } from '@/lib/eventWorkspaceNavigation';
import { useRealtimeOps } from '@/hooks/useRealtimeOps';
import { RealtimeStatusBar } from '@/components/operations/RealtimeStatusBar';
import { InlineTextCapture } from '@/components/operations/InlineTextCapture';
import type { PresenceOperator } from '@/hooks/useRealtimeOps';
import {
  SUNDAY_COCKPIT_INTRO,
  buildAttentionRows,
  formatServiceDate,
  formatServiceTime,
  friendlyEventStatus,
  suggestedNextStep,
  teamBucketStatuses,
  volunteerReadinessLabel,
  type TeamStatus,
} from '@/lib/sundayServiceCockpit';

const UCOS_LIVE_SERVICE_ID = 'ucos_live_service_id';
const UCOS_OPEN_EVENT_ID = 'ucos_open_event_id';

type ServiceRow = { id: string; name: string; type: string; date: string };

const TEAM_STATUS_STYLES: Record<TeamStatus, { dot: string; label: string; card: string }> = {
  ready: { dot: 'bg-emerald-500', label: 'Ready', card: 'border-emerald-200 bg-emerald-50/80' },
  attention: { dot: 'bg-amber-500', label: 'Needs attention', card: 'border-amber-200 bg-amber-50/80' },
  short: { dot: 'bg-rose-500', label: 'Short staffed', card: 'border-rose-200 bg-rose-50/80' },
  empty: { dot: 'bg-slate-300', label: 'Not assigned', card: 'border-slate-200 bg-slate-50' },
};

function CockpitSection({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden', className)}>
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/80">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-600 font-medium mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function SundayModeModule({ onModuleChange }: { onModuleChange?: import('@/types').ModuleNavigate }) {
  const [services, setServices] = React.useState<ServiceRow[]>([]);
  const [servicesLoaded, setServicesLoaded] = React.useState(false);
  const [eventId, setEventId] = React.useState<string | null>(null);
  const [live, setLive] = React.useState<LiveOpsPayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [fullscreen, setFullscreen] = React.useState(false);
  const [tick, setTick] = React.useState(0);
  const [operators, setOperators] = React.useState<PresenceOperator[]>([]);
  const [showEmergency, setShowEmergency] = React.useState(false);

  const loadServices = React.useCallback(async () => {
    try {
      const j = await apiRequest<unknown>('events', { method: 'GET' });
      const all = parseApiResponse<ServiceRow[]>(j) || [];
      const svc = all.filter((e) => e.type === 'Service').sort((a, b) => +new Date(a.date) - +new Date(b.date));
      setServices(svc);
      const focus = sessionStorage.getItem(UCOS_LIVE_SERVICE_ID);
      if (focus && svc.some((s) => s.id === focus)) {
        sessionStorage.removeItem(UCOS_LIVE_SERVICE_ID);
        setEventId(focus);
      } else if (svc.length > 0) {
        setEventId((prev) => {
          if (prev && svc.some((s) => s.id === prev)) return prev;
          const today = svc.find((s) => {
            const d = new Date(s.date);
            return d.toDateString() === new Date().toDateString();
          });
          return today?.id ?? svc[0].id;
        });
      } else {
        setEventId(null);
      }
    } finally {
      setServicesLoaded(true);
    }
  }, []);

  const loadLive = React.useCallback(async () => {
    if (!eventId) {
      setLoading(false);
      setLive(null);
      return;
    }
    try {
      setError(null);
      const j = await apiRequest<unknown>(`events/${eventId}/live-ops`, { method: 'GET' });
      setLive(parseApiResponse<LiveOpsPayload>(j));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  React.useEffect(() => {
    void loadServices();
  }, [loadServices]);

  React.useEffect(() => {
    if (eventId) {
      setLoading(true);
      void loadLive();
    } else {
      setLoading(false);
      setLive(null);
    }
  }, [eventId, loadLive]);

  const { connectionState } = useRealtimeOps(
    (event) => {
      if (['service:update', 'ops:refresh', 'volunteer:update', 'attendance:update', 'event:status'].includes(event)) {
        void loadLive();
      }
    },
    { eventId: eventId ?? undefined, serviceId: eventId ?? undefined },
    {
      presenceContext: eventId ?? 'sunday-mode',
      onPresenceChange: setOperators,
    },
  );

  React.useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const runSheet = live?.runSheet ?? [];
  const ops = live?.opsConfig ?? {};
  const idx = ops.currentSegmentIndex ?? 0;
  const current: RunSheetSegment | undefined = runSheet[idx];
  const next: RunSheetSegment | undefined = runSheet[idx + 1];
  const countdown =
    current && ops.segmentStartedAt
      ? segmentCountdownSeconds(ops.segmentStartedAt, current.duration)
      : null;

  void tick;

  const patchOps = async (patch: Partial<LiveOpsConfig>) => {
    if (!eventId) return;
    try {
      const j = await apiRequest<unknown>(`events/${eventId}/live-ops`, {
        method: 'PUT',
        body: patch,
      });
      setLive(parseApiResponse<LiveOpsPayload>(j));
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  const advance = async (action: 'complete' | 'skip') => {
    if (!eventId) return;
    try {
      const j = await apiRequest<unknown>(`events/${eventId}/live-ops/advance`, {
        method: 'POST',
        body: { action },
      });
      setLive(parseApiResponse<LiveOpsPayload>(j));
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  const sendEmergency = async (msg: string) => {
    if (!eventId) return;
    await apiRequest(`events/${eventId}/live-ops/emergency`, {
      method: 'POST',
      body: { message: msg },
    });
    setShowEmergency(false);
  };

  const openEventWorkspace = (tab: 'overview' | 'people' = 'overview') => {
    if (!eventId) return;
    sessionStorage.setItem(UCOS_OPEN_EVENT_ID, eventId);
    sessionStorage.setItem(UCOS_EVENT_WORKSPACE_TAB, tab);
    onModuleChange?.('events');
  };

  const activeService =
    services.find((s) => s.id === eventId) ??
    (live
      ? { id: live.event.id, name: live.event.name, date: live.event.date, type: live.event.type }
      : null);

  const attentionRows = live ? buildAttentionRows(live) : [];
  const teams = live ? teamBucketStatuses(live) : [];
  const readiness = live
    ? volunteerReadinessLabel(live.metrics.presentCount, live.metrics.volunteerCount)
    : null;
  const hasTimer = Boolean(ops.segmentStartedAt || ops.liveActive);
  const nextStep = live ? suggestedNextStep(live, current?.item, hasTimer) : '';

  if (servicesLoaded && services.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-10 px-6 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto">
            <Radio className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sunday Service</h1>
          <p className="text-sm text-slate-600 font-medium leading-relaxed">{SUNDAY_COCKPIT_INTRO}</p>
        </div>
        <Card className="rounded-2xl border-indigo-100 bg-indigo-50/50">
          <CardContent className="p-6 space-y-4 text-left">
            <p className="font-semibold text-slate-900">No Sunday service is active.</p>
            <p className="text-sm text-slate-600 font-medium">To begin:</p>
            <ol className="text-sm text-slate-700 space-y-2 list-decimal list-inside font-medium">
              <li>Plan a worship service in Sunday &amp; Services.</li>
              <li>Publish the service plan.</li>
              <li>Open Sunday Service on the service day.</li>
            </ol>
            <Button
              type="button"
              className="w-full min-h-[48px] font-bold bg-indigo-600"
              onClick={() => openWorshipServices(onModuleChange, 'schedule')}
            >
              Plan a service
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shellClass = cn(
    'min-h-[calc(100vh-6rem)]',
    fullscreen && 'fixed inset-0 z-50 min-h-screen overflow-y-auto bg-slate-50 p-4 md:p-6',
    !fullscreen && 'space-y-5 pb-8',
  );

  return (
    <div className={shellClass}>
      {/* —— Top: What / Active / Attention / Next —— */}
      <header className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg overflow-hidden">
        <div className="p-5 md:p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 shrink-0 opacity-90" />
                <span className="text-xs font-semibold uppercase tracking-wide text-indigo-200">Live service cockpit</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sunday Service</h1>
              <p className="text-sm text-indigo-100 font-medium max-w-2xl leading-relaxed">{SUNDAY_COCKPIT_INTRO}</p>
            </div>
            <div className="flex flex-wrap items-end gap-2 shrink-0">
              <RealtimeStatusBar
                state={connectionState}
                operatorCount={operators.length}
                className="bg-white/15 text-white border border-white/20"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[40px] bg-white/10 border-white/30 text-white hover:bg-white/20"
                onClick={() => setFullscreen((f) => !f)}
              >
                {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/10 border border-white/15 p-4 space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-200">Which service is active?</p>
              <label className="sr-only" htmlFor="sunday-service-picker">
                Select worship service
              </label>
              <select
                id="sunday-service-picker"
                value={eventId ?? ''}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full h-11 px-3 rounded-lg font-semibold text-slate-900 text-sm bg-white border-0"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {formatServiceDate(s.date)} {formatServiceTime(s.date)}
                  </option>
                ))}
              </select>
              {activeService && (
                <p className="text-sm font-medium text-white/90 pt-1 truncate">{activeService.name}</p>
              )}
            </div>
            <div className="rounded-xl bg-white/15 border border-white/20 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-200 mb-1">What should I do next?</p>
              <p className="text-sm font-semibold leading-snug">
                {loading || !live ? 'Loading today’s service details…' : nextStep}
              </p>
            </div>
          </div>

          {live && !loading && attentionRows.some((r) => r.tone !== 'ok') && (
            <div className="rounded-xl bg-amber-500/20 border border-amber-300/40 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-100 mb-1">What needs attention</p>
              <ul className="text-sm font-medium space-y-1">
                {attentionRows
                  .filter((r) => r.tone !== 'ok')
                  .slice(0, 3)
                  .map((r) => (
                    <li key={r.id} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        {r.label}
                        {r.detail ? ` — ${r.detail}` : ''}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </header>

      {error && (
        <p className="text-sm text-rose-700 font-medium px-1 bg-rose-50 border border-rose-200 rounded-lg p-3">{error}</p>
      )}

      {loading || !live ? (
        <div className="text-center py-16 space-y-3 rounded-2xl border border-slate-200 bg-white">
          <p className="text-slate-600 font-medium animate-pulse">Loading today’s service…</p>
          <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => void loadLive()}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          {/* Section 1 — Today's Service */}
          <CockpitSection title="Today's service" subtitle="Overview for the worship gathering you are running now.">
            <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Service name</dt>
                <dd className="text-base font-bold text-slate-900 mt-1 leading-snug">{live.event.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</dt>
                <dd className="text-base font-bold text-slate-900 mt-1">{formatServiceDate(live.event.date)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</dt>
                <dd className="text-base font-bold text-slate-900 mt-1">{formatServiceTime(live.event.date)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</dt>
                <dd className="mt-1">
                  <Badge className={cn('font-semibold', EVENT_STATUS_COLORS[live.event.status] ?? 'bg-slate-100')}>
                    {friendlyEventStatus(live.event.status)}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Attendance</dt>
                <dd className="text-base font-bold text-slate-900 mt-1">{live.metrics.attendeeCount} checked in</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Volunteer readiness</dt>
                <dd className="mt-1">
                  {readiness && (
                    <span
                      className={cn(
                        'text-sm font-bold',
                        readiness.tone === 'ok' && 'text-emerald-700',
                        readiness.tone === 'warn' && 'text-amber-700',
                        readiness.tone === 'alert' && 'text-rose-700',
                      )}
                    >
                      {readiness.label}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
            {live.event.location && (
              <p className="text-sm text-slate-600 font-medium mt-4 pt-4 border-t border-slate-100">
                Location: {live.event.location}
              </p>
            )}
          </CockpitSection>

          {/* Section 2 — What Needs Attention */}
          <CockpitSection title="What needs attention" subtitle="Items to resolve before or during the service.">
            <ul className="space-y-3">
              {attentionRows.map((row) => (
                <li
                  key={row.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-xl border text-sm',
                    row.tone === 'ok' && 'border-emerald-200 bg-emerald-50/60',
                    row.tone === 'warn' && 'border-amber-200 bg-amber-50/60',
                    row.tone === 'alert' && 'border-rose-200 bg-rose-50/60',
                  )}
                >
                  {row.tone === 'ok' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle
                      className={cn('w-5 h-5 shrink-0', row.tone === 'alert' ? 'text-rose-600' : 'text-amber-600')}
                    />
                  )}
                  <div>
                    <p className="font-bold text-slate-900">{row.label}</p>
                    {row.detail && <p className="text-slate-600 font-medium mt-0.5">{row.detail}</p>}
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                variant={ops.mediaReady ? 'default' : 'outline'}
                className="min-h-[40px] font-semibold"
                onClick={() => void patchOps({ mediaReady: !ops.mediaReady })}
              >
                Media {ops.mediaReady ? 'ready' : 'not ready'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={ops.livestreamReady ? 'default' : 'outline'}
                className="min-h-[40px] font-semibold"
                onClick={() => void patchOps({ livestreamReady: !ops.livestreamReady })}
              >
                Livestream {ops.livestreamReady ? 'ready' : 'not ready'}
              </Button>
            </div>
            <div className="mt-4">
              <InlineTextCapture
                label="Log an issue"
                placeholder="Describe what needs attention on the floor…"
                submitLabel="Add to attention list"
                onSubmit={(text) =>
                  patchOps({
                    issues: [
                      ...(ops.issues ?? []),
                      { id: crypto.randomUUID(), text, at: new Date().toISOString(), severity: 'medium' },
                    ],
                  })
                }
              />
            </div>
          </CockpitSection>

          {/* Section 3 — Service Flow */}
          <CockpitSection title="Service flow" subtitle="Current part of worship and timing.">
            {runSheet.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 font-medium">No run sheet has been created.</p>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px] font-semibold"
                  onClick={() => openWorshipServices(onModuleChange, 'plan', eventId)}
                >
                  Open Worship Planning
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 p-5 rounded-xl bg-indigo-50 border border-indigo-100">
                    <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Current segment</p>
                    <p className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">{current?.item ?? '—'}</p>
                    <p className="text-sm text-slate-600 font-medium mt-1">
                      {current?.owner ? `Led by ${current.owner}` : ''}
                      {current?.time ? ` · ${current.time}` : ''}
                    </p>
                  </div>
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-center items-center text-center">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Remaining time</p>
                    {countdown !== null ? (
                      <p className="text-4xl font-mono font-bold text-indigo-600 tabular-nums mt-2">
                        {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-500 font-medium mt-2">Start the timer when this segment begins</p>
                    )}
                  </div>
                </div>

                {next && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Next segment</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">{next.item}</p>
                    <p className="text-sm text-slate-600 font-medium">
                      {next.owner ? `${next.owner} · ` : ''}
                      {next.duration} planned
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    size="lg"
                    className="min-h-[52px] px-6 bg-emerald-600 hover:bg-emerald-500 font-bold"
                    onClick={() => void advance('complete')}
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Advance segment
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="min-h-[52px] font-semibold"
                    onClick={() => void patchOps({ liveActive: true, segmentStartedAt: new Date().toISOString() })}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start timer
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="ghost"
                    className="min-h-[52px] font-semibold text-slate-600"
                    onClick={() => void advance('skip')}
                  >
                    <SkipForward className="w-5 h-5 mr-2" />
                    Skip segment
                  </Button>
                </div>
              </div>
            )}
          </CockpitSection>

          {/* Section 4 — Teams */}
          <CockpitSection title="Teams" subtitle="Serving areas at a glance — assign team in Events → People.">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {teams.map((team) => {
                const style = TEAM_STATUS_STYLES[team.status];
                return (
                  <div
                    key={team.id}
                    className={cn('rounded-xl border p-4 text-center', style.card)}
                  >
                    <div className={cn('w-3 h-3 rounded-full mx-auto mb-2', style.dot)} />
                    <p className="font-bold text-slate-900 text-sm">{team.label}</p>
                    <p className="text-xs font-semibold text-slate-600 mt-1">{style.label}</p>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">{team.summary}</p>
                  </div>
                );
              })}
            </div>
          </CockpitSection>

          {/* Section 5 — Quick Actions */}
          <CockpitSection title="Quick actions" subtitle="Live service tasks — planning stays in the event workspace.">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-[56px] py-3 justify-start font-semibold text-left"
                onClick={() => eventId && openAttendanceForEvent(onModuleChange, eventId)}
              >
                <CheckCircle2 className="w-5 h-5 mr-3 shrink-0 text-emerald-600" />
                Record attendance
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-[56px] py-3 justify-start font-semibold text-left"
                onClick={() => openEventWorkspace('people')}
              >
                <Users className="w-5 h-5 mr-3 shrink-0 text-sky-600" />
                View team roster
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-[56px] py-3 justify-start font-semibold text-left"
                onClick={() => openEventWorkspace('overview')}
              >
                <ClipboardList className="w-5 h-5 mr-3 shrink-0 text-violet-600" />
                Open event workspace
              </Button>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              {!showEmergency ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-rose-700 font-semibold"
                  onClick={() => setShowEmergency(true)}
                >
                  Send urgent message to ops team
                </Button>
              ) : (
                <InlineTextCapture
                  label="Urgent message"
                  placeholder="Message for staff on duty…"
                  submitLabel="Send now"
                  variant="destructive"
                  onSubmit={sendEmergency}
                />
              )}
            </div>
          </CockpitSection>
        </>
      )}

      {!fullscreen && (
        <Button type="button" variant="ghost" className="text-slate-600 font-semibold" onClick={() => onModuleChange?.('dashboard')}>
          <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
          Back to home
        </Button>
      )}
    </div>
  );
}
