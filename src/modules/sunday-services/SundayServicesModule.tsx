import * as React from 'react';
import {
  CalendarCheck,
  Plus,
  ChevronRight,
  Radio,
  Users,
  ListOrdered,
  FileText,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { EVENT_STATUS_LABELS, type RunSheetSegment } from '@/lib/eventLifecycle';
import { ModuleHeader, ActionButton, PageLayout } from '@/components/modules/ModuleHeader';
import { ModuleTabs } from '@/components/modules/ModuleTabs';
import { ServicePlanPanel } from './ServicePlanPanel';
import {
  openSundayLive,
  openSundayServices,
  openWorshipServices,
  readSundayServicesTab,
  UCOS_OPEN_SERVICE_EVENT_ID,
  type SundayServicesTab,
} from '@/lib/sundayServicesNavigation';
import { UCOS_OPEN_NEXT_SERVICE } from '@/lib/eventWorkspaceNavigation';
import type { ERPModule } from '@/types';

type ServiceRow = {
  id: string;
  name: string;
  type: string;
  date: string;
  status: string;
  location?: string | null;
  runSheet?: RunSheetSegment[] | null;
  campus?: { id: string; name: string } | null;
  attendanceSessions?: Array<{ id: string; status: string }>;
  memberResponsibilities?: Array<{ id: string }>;
};

function runSheetSegmentCount(runSheet: unknown): number {
  return Array.isArray(runSheet) ? runSheet.length : 0;
}

function pickNextService(rows: ServiceRow[]): ServiceRow | null {
  const services = rows.filter((e) => e.type === 'Service').sort((a, b) => +new Date(a.date) - +new Date(b.date));
  if (services.length === 0) return null;
  const now = Date.now();
  const upcoming = services.find((s) => +new Date(s.date) >= now - 12 * 60 * 60 * 1000);
  return upcoming ?? services[services.length - 1];
}

export function SundayServicesModule({
  onModuleChange,
  initialTab,
  embedded = false,
}: {
  onModuleChange?: (m: ERPModule, tab?: string) => void;
  initialTab?: string;
  embedded?: boolean;
}) {
  const [tab, setTab] = React.useState<SundayServicesTab>(() => {
    if (initialTab === 'schedule' || initialTab === 'plan' || initialTab === 'this-sunday') return initialTab;
    return readSundayServicesTab();
  });
  const [rows, setRows] = React.useState<ServiceRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [planEventId, setPlanEventId] = React.useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const focus = sessionStorage.getItem(UCOS_OPEN_SERVICE_EVENT_ID);
    if (focus) {
      sessionStorage.removeItem(UCOS_OPEN_SERVICE_EVENT_ID);
      return focus;
    }
    return null;
  });
  const [planOpen, setPlanOpen] = React.useState(false);
  const [planName, setPlanName] = React.useState('');
  const [planDate, setPlanDate] = React.useState(() => new Date().toISOString().split('T')[0]);
  const [planSaving, setPlanSaving] = React.useState(false);

  React.useEffect(() => {
    if (initialTab === 'schedule' || initialTab === 'plan' || initialTab === 'this-sunday') {
      setTab(initialTab);
    }
  }, [initialTab]);

  React.useEffect(() => {
    if (tab === 'plan' && planEventId) return;
    const focus = sessionStorage.getItem(UCOS_OPEN_SERVICE_EVENT_ID);
    if (focus) {
      sessionStorage.removeItem(UCOS_OPEN_SERVICE_EVENT_ID);
      setPlanEventId(focus);
      setTab('plan');
    }
  }, [tab, planEventId]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const json = await apiRequest<unknown>('events', { method: 'GET' });
      const all = parseApiResponse<ServiceRow[]>(json);
      setRows(all.filter((e) => e.type === 'Service').sort((a, b) => +new Date(b.date) - +new Date(a.date)));
    } catch (e) {
      setError(formatApiError(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const nextService = React.useMemo(() => pickNextService(rows), [rows]);
  const now = Date.now();
  const upcoming = rows.filter((r) => +new Date(r.date) >= now - 12 * 60 * 60 * 1000);
  const past = rows.filter((r) => +new Date(r.date) < now - 12 * 60 * 60 * 1000);
  const withRunSheet = rows.filter((r) => runSheetSegmentCount(r.runSheet) >= 3).length;

  const submitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;
    setPlanSaving(true);
    setError(null);
    try {
      const j = await apiRequest<unknown>('events', {
        method: 'POST',
        body: { name: planName.trim(), type: 'Service', date: planDate },
      });
      const created = parseApiResponse<{ id: string }>(j);
      setPlanName('');
      setPlanOpen(false);
      await load();
      setPlanEventId(created.id);
      setTab('plan');
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setPlanSaving(false);
    }
  };

  const openPlan = (id: string) => {
    setPlanEventId(id);
    setTab('plan');
  };

  if (tab === 'plan' && planEventId) {
    return (
      <PageLayout className={embedded ? 'pt-0' : undefined}>
        <ServicePlanPanel
          eventId={planEventId}
          onModuleChange={onModuleChange}
          onBack={() => {
            setPlanEventId(null);
            setTab('this-sunday');
          }}
        />
      </PageLayout>
    );
  }

  const content = (
    <>
      {!embedded && (
        <ModuleHeader
          title="Worship Services"
          subtitle="Plan worship services, assign teams, and open the live Sunday cockpit from one place."
          status="live"
          icon={CalendarCheck}
          actions={
            <ActionButton
              label="Plan service"
              icon={Plus}
              variant="primary"
              onClick={() => {
                setPlanOpen(true);
                setTab('schedule');
              }}
            />
          }
        />
      )}

      {embedded && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-sm text-slate-500 font-medium">
            Canonical planning surface for Service-type events — run sheets, teams, and Sunday live links.
          </p>
          <ActionButton
            label="Plan service"
            icon={Plus}
            variant="primary"
            onClick={() => {
              setPlanOpen(true);
              setTab('schedule');
            }}
          />
        </div>
      )}

      {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

      <ModuleTabs
        tabs={[
          { id: 'this-sunday', label: 'This Sunday' },
          { id: 'schedule', label: 'Schedule' },
          { id: 'plan', label: 'Service plan' },
        ]}
        activeId={tab}
        onChange={(id) => {
          const next = id as SundayServicesTab;
          setTab(next);
          if (next === 'plan' && nextService && !planEventId) setPlanEventId(nextService.id);
        }}
        aria-label="Sunday and services"
      />

      {tab === 'this-sunday' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center gap-3 text-slate-500 py-12">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading…
            </div>
          ) : !nextService ? (
            <Card className="rounded-2xl border-slate-100">
              <CardContent className="py-12 text-center space-y-4">
                <p className="text-slate-600 font-medium">No upcoming worship service on the calendar.</p>
                <Button type="button" className="bg-indigo-600" onClick={() => setPlanOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Plan a service
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ThisSundayDashboard
              service={nextService}
              onOpenPlan={() => openPlan(nextService.id)}
              onModuleChange={onModuleChange}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Upcoming services', value: upcoming.length },
              { label: 'Past services', value: past.length },
              { label: 'Plans with run sheet (3+ segments)', value: withRunSheet },
            ].map((stat) => (
              <Card key={stat.label} className="rounded-xl border-slate-100">
                <CardContent className="p-4 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
                  <span className="text-2xl font-black text-slate-900">{stat.value}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'schedule' && (
        <div className="space-y-6">
          {planOpen && (
            <Card className="rounded-2xl border-slate-100 shadow-sm max-w-lg">
              <CardHeader>
                <CardTitle className="text-lg">New service</CardTitle>
                <CardDescription>Creates a Service event for planning and Sunday live mode.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={submitPlan}>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Title</label>
                    <Input value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="Sunday morning worship" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date</label>
                    <Input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={planSaving} className="bg-indigo-600">
                      {planSaving ? 'Creating…' : 'Create'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setPlanOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <ScheduleList
            title="Upcoming"
            rows={upcoming}
            loading={loading}
            emptyMessage="No upcoming services."
            onSelect={openPlan}
            onModuleChange={onModuleChange}
          />
          <ScheduleList
            title="Past"
            rows={past.slice(0, 20)}
            loading={loading}
            emptyMessage="No past services yet."
            onSelect={openPlan}
            onModuleChange={onModuleChange}
          />
        </div>
      )}

      {tab === 'plan' && !planEventId && nextService && (
        <div className="py-8 text-center">
          <Button type="button" className="bg-indigo-600" onClick={() => openPlan(nextService.id)}>
            Open plan for {nextService.name}
          </Button>
        </div>
      )}
    </>
  );

  if (embedded) return content;

  return <PageLayout>{content}</PageLayout>;
}

function ThisSundayDashboard({
  service,
  onOpenPlan,
  onModuleChange,
}: {
  service: ServiceRow;
  onOpenPlan: () => void;
  onModuleChange?: (m: ERPModule, tab?: string) => void;
}) {
  const [volunteerCount, setVolunteerCount] = React.useState(service.memberResponsibilities?.length ?? 0);
  const [sessions, setSessions] = React.useState(service.attendanceSessions ?? []);
  const [segmentCount, setSegmentCount] = React.useState(runSheetSegmentCount(service.runSheet));
  const [preacher, setPreacher] = React.useState<string | null>(null);
  const [leader, setLeader] = React.useState<string | null>(null);

  React.useEffect(() => {
    const run = async () => {
      try {
        const j = await apiRequest<unknown>(`events/${service.id}/workspace`, { method: 'GET' });
        const ws = parseApiResponse<{
          event: ServiceRow;
          responsibilities: Array<{ role: string; member?: { name: string } }>;
          metrics: { volunteerCount: number };
        }>(j);
        setSessions(ws.event.attendanceSessions ?? []);
        setVolunteerCount(ws.metrics?.volunteerCount ?? ws.responsibilities?.length ?? 0);
        setSegmentCount(runSheetSegmentCount(ws.event.runSheet));
        const roles = ws.responsibilities ?? [];
        const p = roles.find((r) => /speaker|pastor|preach/i.test(r.role))?.member?.name;
        const l = roles.find((r) => /worship lead|service lead|host|coordinator/i.test(r.role))?.member?.name;
        setPreacher(p ?? null);
        setLeader(l ?? null);
      } catch {
        /* keep list defaults */
      }
    };
    void run();
  }, [service.id]);

  const when = new Date(service.date);
  const segments = segmentCount;
  const sessionStatus =
    sessions.length === 0
      ? 'No session'
      : sessions.some((s) => s.status === 'OPEN')
        ? 'Open'
        : sessions[0]?.status ?? 'Scheduled';

  return (
    <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-900 text-white p-8 border-none">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="space-y-2">
            <Badge className="bg-indigo-500 text-white border-none">{when.toLocaleDateString()}</Badge>
            <CardTitle className="text-3xl font-black">{service.name}</CardTitle>
            <p className="text-slate-400 text-sm">
              {when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              {service.campus?.name ? ` · ${service.campus.name}` : ''}
              {service.location ? ` · ${service.location}` : ''}
            </p>
            <Badge variant="outline" className="text-indigo-200 border-indigo-400/40">
              {EVENT_STATUS_LABELS[service.status] ?? service.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Preacher', value: preacher ?? '—' },
            { label: 'Service leader', value: leader ?? '—' },
            { label: 'Run sheet segments', value: String(segments) },
            { label: 'Team assigned', value: String(volunteerCount) },
            { label: 'Check-in', value: sessionStatus },
            { label: 'Campus', value: service.campus?.name ?? '—' },
          ].map((m) => (
            <div key={m.label} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</p>
              <p className="text-lg font-black text-slate-900 mt-1">{m.value}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" className="bg-indigo-600" onClick={onOpenPlan}>
            <FileText className="w-4 h-4 mr-2" /> Open plan
          </Button>
          <Button type="button" variant="outline" onClick={() => onModuleChange?.('volunteers')}>
            <Users className="w-4 h-4 mr-2" /> Team
          </Button>
          <Button type="button" variant="outline" onClick={() => onModuleChange?.('attendance')}>
            <ListOrdered className="w-4 h-4 mr-2" /> Attendance
          </Button>
          <Button type="button" className="bg-violet-600" onClick={() => openSundayLive(onModuleChange, service.id)}>
            <Radio className="w-4 h-4 mr-2" /> Go live
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ScheduleList({
  title,
  rows,
  loading,
  emptyMessage,
  onSelect,
  onModuleChange,
}: {
  title: string;
  rows: ServiceRow[];
  loading: boolean;
  emptyMessage: string;
  onSelect: (id: string) => void;
  onModuleChange?: (m: ERPModule, tab?: string) => void;
}) {
  return (
    <Card className="border-none shadow-sm overflow-hidden rounded-2xl">
      <CardHeader className="py-4 border-b border-slate-50 bg-slate-50/30">
        <CardTitle className="text-lg font-bold text-slate-800">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">{emptyMessage}</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {rows.map((srv) => {
              const d = new Date(srv.date);
              return (
                <div
                  key={srv.id}
                  className="p-5 hover:bg-slate-50/50 flex flex-wrap justify-between items-center gap-3 cursor-pointer"
                  onClick={() => onSelect(srv.id)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault();
                      onSelect(srv.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{srv.name}</p>
                    <p className="text-xs text-slate-500">
                      {d.toLocaleString()} · {srv.campus?.name ?? srv.location ?? 'Campus TBA'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[9px] font-black uppercase">
                      {EVENT_STATUS_LABELS[srv.status] ?? srv.status}
                    </Badge>
                    <Badge className={cn('text-[9px]', runSheetSegmentCount(srv.runSheet) >= 3 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800')}>
                      {runSheetSegmentCount(srv.runSheet)} segments
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSundayLive(onModuleChange, srv.id);
                      }}
                    >
                      <Radio className="w-4 h-4" />
                    </Button>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Legacy worship / sunday-services URLs — redirect to Events → Worship Services. */
export function WorshipPlanningRedirect({ onModuleChange }: { onModuleChange?: (m: ERPModule, tab?: string) => void }) {
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(UCOS_OPEN_NEXT_SERVICE, '1');
    }
    onModuleChange?.('events');
  }, [onModuleChange]);
  return (
    <div className="flex items-center gap-3 text-slate-500 py-12">
      <Loader2 className="w-5 h-5 animate-spin" /> Opening Worship Services…
    </div>
  );
}

/** Legacy structure module URL — redirect to Settings → Church Structure. */
export function StructureSettingsRedirect({ onModuleChange }: { onModuleChange?: (m: ERPModule, tab?: string) => void }) {
  React.useEffect(() => {
    onModuleChange?.('settings', 'structure');
  }, [onModuleChange]);
  return (
    <div className="flex items-center gap-3 text-slate-500 py-12">
      <Loader2 className="w-5 h-5 animate-spin" /> Opening Church Structure…
    </div>
  );
}
