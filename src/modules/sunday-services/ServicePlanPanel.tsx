import * as React from 'react';
import {
  ArrowLeft,
  Radio,
  Users,
  ListOrdered,
  Mic2,
  Save,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SortableRunSheet } from '@/components/operations/SortableRunSheet';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { EVENT_STATUS_LABELS, type RunSheetSegment } from '@/lib/eventLifecycle';
import { openSundayLive, openWorshipServices } from '@/lib/sundayServicesNavigation';
import { openAttendanceForEvent } from '@/lib/attendanceNavigation';
import type { ERPModule } from '@/types';

type EventDetail = {
  id: string;
  name: string;
  type: string;
  date: string;
  status: string;
  location?: string | null;
  internalNotes?: string | null;
  runSheet?: RunSheetSegment[] | null;
  campus?: { id: string; name: string } | null;
  attendanceSessions?: Array<{ id: string; name: string; date: string; status: string }>;
};

type Responsibility = {
  id: string;
  role: string;
  status: string;
  member?: { id: string; name: string };
};

type SermonRow = { id: string; title: string; speaker?: string | null };

function pickRoleName(rows: Responsibility[], patterns: RegExp[]): string | null {
  for (const p of patterns) {
    const hit = rows.find((r) => p.test(r.role) && r.member?.name);
    if (hit?.member?.name) return hit.member.name;
  }
  return null;
}

export function ServicePlanPanel({
  eventId,
  onModuleChange,
  onBack,
  embedded = false,
}: {
  eventId: string;
  onModuleChange?: (m: ERPModule, tab?: string) => void;
  onBack?: () => void;
  /** When true, render inside Event workspace Schedule tab (no page chrome). */
  embedded?: boolean;
}) {
  const [event, setEvent] = React.useState<EventDetail | null>(null);
  const [responsibilities, setResponsibilities] = React.useState<Responsibility[]>([]);
  const [runSheet, setRunSheet] = React.useState<RunSheetSegment[]>([]);
  const [notes, setNotes] = React.useState('');
  const [sermons, setSermons] = React.useState<SermonRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingSheet, setSavingSheet] = React.useState(false);
  const [savingNotes, setSavingNotes] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [evJ, wsJ, sermonsJ] = await Promise.all([
        apiRequest<unknown>(`events/${eventId}`, { method: 'GET' }),
        apiRequest<unknown>(`events/${eventId}/workspace`, { method: 'GET' }),
        apiRequest<unknown>('website/sermons', { method: 'GET' }).catch(() => null),
      ]);
      const ev = parseApiResponse<EventDetail>(evJ);
      const ws = parseApiResponse<{ event: EventDetail; responsibilities: Responsibility[] }>(wsJ);
      setEvent({ ...ev, attendanceSessions: ws.event.attendanceSessions ?? ev.attendanceSessions });
      setResponsibilities(ws.responsibilities ?? []);
      setNotes(ev.internalNotes ?? '');
      setRunSheet(Array.isArray(ev.runSheet) && ev.runSheet.length > 0 ? ev.runSheet : []);
      if (sermonsJ) {
        const list = parseApiResponse<SermonRow[]>(sermonsJ);
        setSermons(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      setError(formatApiError(e));
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const saveRunSheet = async () => {
    setSavingSheet(true);
    setError(null);
    try {
      await apiRequest(`events/${eventId}/run-sheet`, { method: 'PUT', body: { runSheet } });
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSavingSheet(false);
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    setError(null);
    try {
      await apiRequest(`events/${eventId}`, { method: 'PUT', body: { internalNotes: notes } });
      await load();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSavingNotes(false);
    }
  };

  const savePlan = async () => {
    setSavingSheet(true);
    setSavingNotes(true);
    setError(null);
    try {
      await apiRequest(`events/${eventId}/run-sheet`, { method: 'PUT', body: { runSheet } });
      await apiRequest(`events/${eventId}`, { method: 'PUT', body: { internalNotes: notes } });
      await load();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSavingSheet(false);
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-500 py-12">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading service plan…
      </div>
    );
  }

  if (!event) {
    return <p className="text-sm text-rose-600">{error ?? 'Service not found'}</p>;
  }

  const when = new Date(event.date);
  const preacher = pickRoleName(responsibilities, [/speaker/i, /pastor/i, /preach/i]);
  const serviceLeader = pickRoleName(responsibilities, [/worship lead/i, /service lead/i, /host/i, /coordinator/i]);
  const mediaSegments = runSheet.filter((s) => s.media || s.segmentType === 'media');

  if (embedded) {
    return (
      <div className="space-y-6 text-left">
        {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => onModuleChange?.('sermons')}>
              <Mic2 className="w-4 h-4 mr-2" /> Song & sermon library
            </Button>
            <Button type="button" className="bg-violet-600" size="sm" onClick={() => openSundayLive(onModuleChange, eventId)}>
              <Radio className="w-4 h-4 mr-2" /> Sunday Service (live)
            </Button>
          </div>
          <Button
            type="button"
            size="sm"
            className="bg-indigo-600"
            disabled={savingSheet || savingNotes}
            onClick={() => void savePlan()}
          >
            {savingSheet || savingNotes ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save plan
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Speaker', value: preacher ?? '—' },
            { label: 'Worship lead', value: serviceLeader ?? '—' },
            { label: 'Team', value: String(responsibilities.length) },
            { label: 'Segments', value: String(runSheet.length) },
          ].map((m) => (
            <Card key={m.label} className="rounded-2xl border-slate-100">
              <CardContent className="p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</p>
                <p className="text-lg font-bold text-slate-900 mt-1 truncate">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-2xl border-slate-100">
          <CardHeader>
            <div>
              <CardTitle className="text-lg">Run sheet</CardTitle>
              <CardDescription>Order of service — drag to reorder, link sermons on Message segments.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-2">
            <SortableRunSheet rows={runSheet} onChange={setRunSheet} sermons={sermons} />
          </CardContent>
        </Card>

        {mediaSegments.length > 0 && (
          <Card className="rounded-2xl border-slate-100">
            <CardHeader>
              <CardTitle className="text-lg">Media cues</CardTitle>
              <CardDescription>Production notes from the run sheet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {mediaSegments.map((s) => (
                <div key={s.id} className="flex justify-between py-2 border-b border-slate-50 text-sm">
                  <span className="font-medium text-slate-800">{s.item}</span>
                  <span className="text-slate-500">{s.media ?? s.owner ?? '—'}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl border-slate-100">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle className="text-lg">Teams</CardTitle>
              <CardDescription>Serving roles for this worship gathering</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                sessionStorage.setItem('ucos_assign_event_id', eventId);
                onModuleChange?.('volunteers');
              }}
            >
              Manage in Volunteers
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {responsibilities.length === 0 ? (
              <p className="text-sm text-slate-500">No team assigned yet.</p>
            ) : (
              responsibilities.map((r) => (
                <div key={r.id} className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="font-medium text-slate-800">{r.member?.name ?? '—'}</span>
                  <Badge variant="outline">{r.role}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100">
          <CardHeader>
            <div>
              <CardTitle className="text-lg">Planning notes</CardTitle>
              <CardDescription>For hosts, worship, and production — saved with the run sheet above.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="resize-y"
              placeholder="Theme, announcements, production cues…"
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const sessions = event.attendanceSessions ?? [];
  const openSession = sessions.find((s) => s.status === 'OPEN') ?? sessions[0];

  return (
    <div className="space-y-6 text-left">
      {onBack && (
        <Button type="button" variant="ghost" className="gap-2" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
      )}
      {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-indigo-100 text-indigo-800">{when.toLocaleDateString()}</Badge>
            <Badge variant="outline">{EVENT_STATUS_LABELS[event.status] ?? event.status}</Badge>
          </div>
          <h2 className="text-2xl font-black text-slate-900">{event.name}</h2>
          <p className="text-sm text-slate-500">
            {when.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            {event.campus?.name ? ` · ${event.campus.name}` : ''}
            {event.location ? ` · ${event.location}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onModuleChange?.('volunteers')}>
            <Users className="w-4 h-4 mr-2" /> Team
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onModuleChange?.('attendance')}>
            <ListOrdered className="w-4 h-4 mr-2" /> Attendance
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onModuleChange?.('sermons')}>
            <Mic2 className="w-4 h-4 mr-2" /> Sermons
          </Button>
          <Button
            type="button"
            className="bg-violet-600"
            size="sm"
            onClick={() => openSundayLive(onModuleChange, eventId)}
          >
            <Radio className="w-4 h-4 mr-2" /> Go live
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Preacher', value: preacher ?? '—' },
          { label: 'Service leader', value: serviceLeader ?? '—' },
          { label: 'Team assigned', value: String(responsibilities.length) },
          { label: 'Run sheet segments', value: String(runSheet.length) },
        ].map((m) => (
          <Card key={m.label} className="rounded-2xl border-slate-100">
            <CardContent className="p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</p>
              <p className="text-lg font-bold text-slate-900 mt-1 truncate">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border-slate-100">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Service flow</CardTitle>
            <CardDescription>Drag to reorder. Link a sermon on the Message segment.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" disabled={savingSheet} onClick={() => void load()}>
              Reload
            </Button>
            <Button type="button" size="sm" className="bg-indigo-600" disabled={savingSheet} onClick={() => void saveRunSheet()}>
              {savingSheet ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save plan
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-2">
          <SortableRunSheet rows={runSheet} onChange={setRunSheet} sermons={sermons} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-slate-100">
          <CardHeader>
            <CardTitle className="text-lg">Team assignments</CardTitle>
            <CardDescription>From volunteer responsibilities on this service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {responsibilities.length === 0 ? (
              <p className="text-sm text-slate-500">No team assigned yet.</p>
            ) : (
              responsibilities.map((r) => (
                <div key={r.id} className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="font-medium text-slate-800">{r.member?.name ?? '—'}</span>
                  <Badge variant="outline">{r.role}</Badge>
                </div>
              ))
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                sessionStorage.setItem('ucos_assign_event_id', eventId);
                onModuleChange?.('volunteers');
              }}
            >
              <Users className="w-4 h-4 mr-2" /> Assign in Volunteers
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-100">
          <CardHeader>
            <CardTitle className="text-lg">Attendance session</CardTitle>
            <CardDescription>Check-in linked to this service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-slate-500">No check-in session yet.</p>
            ) : (
              sessions.map((s) => (
                <div key={s.id} className="flex justify-between items-center py-2 border-b border-slate-50">
                  <div>
                    <p className="font-medium text-slate-800">{s.name}</p>
                    <p className="text-xs text-slate-500">{new Date(s.date).toLocaleString()} · {s.status}</p>
                  </div>
                </div>
              ))
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                if (openSession) openAttendanceForEvent(onModuleChange, eventId, openSession.id);
                else openAttendanceForEvent(onModuleChange, eventId);
              }}
            >
              <ExternalLink className="w-4 h-4 mr-2" /> Open Attendance
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-100">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-lg">Planning notes</CardTitle>
            <CardDescription>Internal notes for worship, hosts, and coordinators</CardDescription>
          </div>
          <Button type="button" size="sm" disabled={savingNotes} onClick={() => void saveNotes()}>
            {savingNotes ? 'Saving…' : 'Save notes'}
          </Button>
        </CardHeader>
        <CardContent>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} className="resize-y" placeholder="Theme, announcements, production cues…" />
        </CardContent>
      </Card>
    </div>
  );
}
