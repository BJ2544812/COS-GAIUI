import * as React from 'react';
import {
  Calendar,
  Users,
  DollarSign,
  ClipboardList,
  ListOrdered,
  Shield,
  Bell,
  FileText,
  ChevronRight,
  Loader2,
  Radio,
} from 'lucide-react';
import { LiveEventOpsPanel } from '@/components/events/LiveEventOpsPanel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { formatCurrencyAmount } from '@/lib/formatCurrency';
import { EVENT_STATUS_COLORS, EVENT_STATUS_LABELS, type RunSheetSegment } from '@/lib/eventLifecycle';
import type { ERPModule } from '@/types';

type WorkspaceTab =
  | 'overview'
  | 'live'
  | 'sessions'
  | 'registrations'
  | 'attendance'
  | 'volunteers'
  | 'budget'
  | 'runsheet'
  | 'communication'
  | 'reports'
  | 'workflow';

const TABS: { id: WorkspaceTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Calendar },
  { id: 'live', label: 'Live ops', icon: Radio },
  { id: 'sessions', label: 'Sessions', icon: ClipboardList },
  { id: 'registrations', label: 'Registrations', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: Users },
  { id: 'volunteers', label: 'Volunteers', icon: Shield },
  { id: 'budget', label: 'Budget', icon: DollarSign },
  { id: 'runsheet', label: 'Run sheet', icon: ListOrdered },
  { id: 'communication', label: 'Communication', icon: Bell },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'workflow', label: 'Workflow', icon: ChevronRight },
];

type WorkspaceData = {
  event: {
    id: string;
    name: string;
    type: string;
    date: string;
    status: string;
    location?: string | null;
    internalNotes?: string | null;
    runSheet?: RunSheetSegment[] | null;
    registrationOpen?: boolean;
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

const NEXT_STATUS: Record<string, string[]> = {
  DRAFT: ['REVIEW'],
  REVIEW: ['APPROVED', 'DRAFT'],
  APPROVED: ['REGISTRATION_OPEN', 'ACTIVE'],
  REGISTRATION_OPEN: ['REGISTRATION_CLOSED', 'ACTIVE'],
  REGISTRATION_CLOSED: ['ACTIVE'],
  ACTIVE: ['COMPLETED'],
  COMPLETED: ['ARCHIVED'],
};

export function EventWorkspace({
  eventId,
  onModuleChange,
  currency,
}: {
  eventId: string;
  onModuleChange?: (m: ERPModule) => void;
  currency: string;
}) {
  const [tab, setTab] = React.useState<WorkspaceTab>('overview');
  const [data, setData] = React.useState<WorkspaceData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [transitioning, setTransitioning] = React.useState(false);
  const [runSheet, setRunSheet] = React.useState<RunSheetSegment[]>([]);
  const [savingSheet, setSavingSheet] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const j = await apiRequest<unknown>(`events/${eventId}/workspace`, { method: 'GET' });
      const ws = parseApiResponse<WorkspaceData>(j);
      setData(ws);
      setRunSheet(Array.isArray(ws.event.runSheet) ? ws.event.runSheet! : []);
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

  const saveRunSheet = async () => {
    setSavingSheet(true);
    try {
      await apiRequest(`events/${eventId}/run-sheet`, { method: 'PUT', body: { runSheet } });
      await load();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSavingSheet(false);
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
          type: 'EVENT',
          eventId: data.event.id,
          status: 'OPEN',
        },
      });
      const session = parseApiResponse<{ id: string }>(j);
      sessionStorage.setItem('ucos_open_attendance_session_id', session.id);
      onModuleChange?.('attendance');
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-500 py-12">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading event workspace…
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-rose-600">{error ?? 'Event not found'}</p>;
  }

  const ev = data.event;
  const statusKey = ev.status || 'DRAFT';
  const next = NEXT_STATUS[statusKey] ?? [];

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Badge className={cn('font-bold uppercase tracking-widest text-[10px]', EVENT_STATUS_COLORS[statusKey] ?? 'bg-slate-100')}>
          {EVENT_STATUS_LABELS[statusKey] ?? statusKey}
        </Badge>
        {next.map((s) => (
          <Button key={s} size="sm" variant="outline" disabled={transitioning} onClick={() => void transition(s)}>
            → {EVENT_STATUS_LABELS[s] ?? s}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors',
              tab === t.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50',
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'live' && (
        <LiveEventOpsPanel eventId={eventId} onModuleChange={onModuleChange} />
      )}

      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Checked in', value: data.metrics.attendeeCount },
            { label: 'Sessions', value: data.metrics.sessionCount },
            { label: 'Volunteers', value: data.metrics.volunteerCount },
          ].map((m) => (
            <Card key={m.label} className="rounded-2xl border-slate-100">
              <CardContent className="p-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{m.value}</p>
              </CardContent>
            </Card>
          ))}
          <Card className="md:col-span-3 rounded-2xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-lg">Team notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{ev.internalNotes || 'No staff notes yet.'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'sessions' && (
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Attendance sessions</CardTitle>
              <CardDescription>Link check-in sessions to this event</CardDescription>
            </div>
            <Button size="sm" onClick={() => void createCheckIn()}>New check-in session</Button>
          </CardHeader>
          <CardContent className="divide-y">
            {(ev.attendanceSessions ?? []).length === 0 ? (
              <p className="text-sm text-slate-500 py-6">No sessions yet.</p>
            ) : (
              ev.attendanceSessions!.map((s) => (
                <div key={s.id} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">{new Date(s.date).toLocaleString()} · {s.status}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      sessionStorage.setItem('ucos_open_attendance_session_id', s.id);
                      onModuleChange?.('attendance');
                    }}
                  >
                    Open check-in
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'volunteers' && (
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Event team</CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                sessionStorage.setItem('ucos_assign_event_id', eventId);
                onModuleChange?.('volunteers');
              }}
            >
              Assign in Volunteers
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.responsibilities.length === 0 ? (
              <p className="text-sm text-slate-500">No volunteers assigned to this event yet.</p>
            ) : (
              data.responsibilities.map((r) => (
                <div key={r.id} className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="font-medium text-slate-800">{r.member?.name ?? '—'}</span>
                  <Badge variant="outline">{r.role}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'budget' && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Event finances</CardTitle>
            <CardDescription>Posted vouchers linked to this event</CardDescription>
          </CardHeader>
          <CardContent>
            {data.finance?.totals ? (
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Income</p>
                  <p className="text-xl font-black">{formatCurrencyAmount(data.finance.totals.income, currency)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Expenses</p>
                  <p className="text-xl font-black">{formatCurrencyAmount(data.finance.totals.expenses, currency)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Net</p>
                  <p className="text-xl font-black">{formatCurrencyAmount(data.finance.totals.net, currency)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 mb-4">No posted event accounting yet.</p>
            )}
            <Button variant="outline" size="sm" onClick={() => onModuleChange?.('finance')}>
              Open Finance desk
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === 'runsheet' && (
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row justify-between">
            <div>
              <CardTitle>Service run sheet</CardTitle>
              <CardDescription>Saved on this event</CardDescription>
            </div>
            <Button size="sm" disabled={savingSheet} onClick={() => void saveRunSheet()}>
              {savingSheet ? 'Saving…' : 'Save run sheet'}
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] uppercase text-slate-400">
                <tr>
                  <th className="py-2">Time</th>
                  <th>Dur</th>
                  <th>Segment</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {runSheet.map((row, i) => (
                  <tr key={row.id ?? i} className="border-t border-slate-50">
                    <td className="py-2">
                      <input
                        className="w-20 border rounded px-2 py-1"
                        value={row.time}
                        onChange={(e) => {
                          const next = [...runSheet];
                          next[i] = { ...row, time: e.target.value };
                          setRunSheet(next);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className="w-16 border rounded px-2 py-1"
                        value={row.duration}
                        onChange={(e) => {
                          const next = [...runSheet];
                          next[i] = { ...row, duration: e.target.value };
                          setRunSheet(next);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={row.item}
                        onChange={(e) => {
                          const next = [...runSheet];
                          next[i] = { ...row, item: e.target.value };
                          setRunSheet(next);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        className="w-full border rounded px-2 py-1"
                        value={row.owner ?? ''}
                        onChange={(e) => {
                          const next = [...runSheet];
                          next[i] = { ...row, owner: e.target.value };
                          setRunSheet(next);
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button
              type="button"
              variant="ghost"
              className="mt-4"
              onClick={() =>
                setRunSheet((s) => [
                  ...s,
                  { id: String(Date.now()), time: '10:00', duration: '05:00', item: 'New segment', owner: '' },
                ])
              }
            >
              Add segment
            </Button>
          </CardContent>
        </Card>
      )}

      {(tab === 'registrations' || tab === 'attendance' || tab === 'communication' || tab === 'reports' || tab === 'workflow') && (
        <Card className="rounded-2xl p-8">
          <CardTitle className="text-lg mb-2">
            {tab === 'registrations' && 'Registrations'}
            {tab === 'attendance' && 'Attendance'}
            {tab === 'communication' && 'Communication'}
            {tab === 'reports' && 'Reports'}
            {tab === 'workflow' && 'Approvals & history'}
          </CardTitle>
          <p className="text-sm text-slate-600 max-w-xl">
            {tab === 'registrations' &&
              (ev.registrationOpen
                ? 'Registration is open. Advance lifecycle from Overview when ready to close.'
                : 'Approve the event, then use “→ Registration open”.')}
            {tab === 'attendance' && 'Use Sessions for check-in. Records are append-only.'}
            {tab === 'communication' && 'Notifications send when you approve, open registration, or complete the event.'}
            {tab === 'reports' && 'Use Finance for event P&L; export attendance from event detail CSV.'}
            {tab === 'workflow' && 'Approvals create tasks you can track in Activity log.'}
          </p>
          {tab === 'workflow' && (
            <Button className="mt-4" variant="outline" size="sm" onClick={() => onModuleChange?.('event-admin')}>
              Open activity log
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
