import * as React from 'react';
import {
  Clock,
  Music,
  Video,
  Users,
  Calendar,
  ChevronRight,
  Plus,
  ListOrdered,
  Mic2,
  Settings,
  ArrowLeft,
  Play,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import type { ERPModule } from '@/types';

const UCOS_OPEN_EVENT_ID = 'ucos_open_event_id';
const UCOS_OPEN_SERVICE_EVENT_ID = 'ucos_open_service_event_id';

type ServiceEventRow = {
  id: string;
  name: string;
  type: string;
  date: string;
  location?: string | null;
};

const RUN_SHEET_TEMPLATE = [
  { time: '09:00', dur: '05:00', item: 'Pre-service loop', media: 'Bumper / hold slide', owner: 'Media' },
  { time: '09:05', dur: '10:00', item: 'Praise and worship', media: 'Chord charts / tracks', owner: 'Worship lead' },
  { time: '09:15', dur: '03:00', item: 'Welcome and announcements', media: 'Slide deck', owner: 'Host' },
  { time: '09:18', dur: '12:00', item: 'Message', media: 'Notes / props', owner: 'Speaker' },
  { time: '09:30', dur: '05:00', item: 'Closing prayer / song', media: 'Soft loop', owner: 'Worship' },
];

export function ServicesModule({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  const [rows, setRows] = React.useState<ServiceEventRow[]>([]);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedService, setSelectedService] = React.useState<ServiceEventRow | null>(null);
  const [planOpen, setPlanOpen] = React.useState(false);
  const [planName, setPlanName] = React.useState('');
  const [planDate, setPlanDate] = React.useState(() => new Date().toISOString().split('T')[0]);
  const [planSaving, setPlanSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setLoadError(null);
      setLoading(true);
      const json = await apiRequest<unknown>('events', { method: 'GET' });
      const all = parseApiResponse<ServiceEventRow[]>(json);
      const serviceRows = all.filter((e) => e.type === 'Service').sort((a, b) => +new Date(b.date) - +new Date(a.date));
      setRows(serviceRows);
      const focus = sessionStorage.getItem(UCOS_OPEN_SERVICE_EVENT_ID);
      if (focus) {
        sessionStorage.removeItem(UCOS_OPEN_SERVICE_EVENT_ID);
        const svc = serviceRows.find((e) => e.id === focus);
        if (svc) setSelectedService(svc);
      }
    } catch (e) {
      setLoadError(formatApiError(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const submitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;
    setPlanSaving(true);
    setLoadError(null);
    try {
      await apiRequest('events', {
        method: 'POST',
        body: { name: planName.trim(), type: 'Service', date: planDate },
      });
      setPlanName('');
      setPlanOpen(false);
      await load();
    } catch (err) {
      setLoadError(formatApiError(err));
    } finally {
      setPlanSaving(false);
    }
  };

  const openInEvents = (id: string) => {
    sessionStorage.setItem(UCOS_OPEN_EVENT_ID, id);
    onModuleChange?.('events');
  };

  if (selectedService) {
    const when = new Date(selectedService.date);
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 text-left">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => setSelectedService(null)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to schedule
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => openInEvents(selectedService.id)}>
              <Calendar className="w-4 h-4 mr-2" /> Event operations
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => onModuleChange?.('worship')}>
              <Music className="w-4 h-4 mr-2" /> Worship planning
            </Button>
            <Button type="button" className="bg-indigo-600" size="sm" onClick={() => onModuleChange?.('attendance')}>
              <Users className="w-4 h-4 mr-2" /> Attendance
            </Button>
          </div>
        </div>

        <p className="text-sm text-slate-500 font-medium max-w-3xl">
          Run sheet below is an operational template. Persisted logistics, attendance, and media use the linked event and other modules.
          {selectedService.location ? ` Venue: ${selectedService.location}.` : ''}
        </p>

        <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-8 border-none">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge className="bg-indigo-500 text-white border-none">{when.toLocaleDateString()}</Badge>
                  <Badge variant="outline" className="text-indigo-200 border-indigo-400/40 font-bold uppercase tracking-widest text-[9px]">
                    Service
                  </Badge>
                </div>
                <CardTitle className="text-3xl font-black">{selectedService.name}</CardTitle>
                <p className="text-slate-400 text-sm font-medium">Use Event operations for setup, check-in sessions, and staff notes.</p>
              </div>
              <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10" onClick={() => openInEvents(selectedService.id)}>
                <Settings className="w-4 h-4 mr-2" /> Service settings
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="px-8 py-4">Time</th>
                    <th className="px-8 py-4">Dur</th>
                    <th className="px-8 py-4">Item / segment</th>
                    <th className="px-8 py-4">Media / cues</th>
                    <th className="px-8 py-4 text-right">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {RUN_SHEET_TEMPLATE.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5 font-mono font-bold text-indigo-600">{item.time}</td>
                      <td className="px-8 py-5 font-mono text-slate-400 font-bold">{item.dur}</td>
                      <td className="px-8 py-5">
                        <p className="font-bold text-slate-800">{item.item}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="ghost" className="p-0 text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Play size={10} /> Segment
                          </Badge>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          {item.media}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right font-bold text-slate-400 group-hover:text-indigo-600 transition-colors uppercase tracking-widest text-[10px]">
                        {item.owner}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const drafting = rows.length;
  const inPlanning = 0;
  const ready = 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Worship services</h1>
          <p className="text-slate-500 text-sm sm:text-base">
            Service-typed events from your calendar — linked to attendance, sermons, and media workflows.
          </p>
        </div>
        <Button
          type="button"
          className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          onClick={() => setPlanOpen((v) => !v)}
        >
          <Plus className="w-4 h-4" />
          Plan service
        </Button>
      </div>

      {loadError && <p className="text-sm text-rose-600 font-medium">{loadError}</p>}

      {planOpen && (
        <Card className="rounded-2xl border-slate-100 shadow-sm max-w-lg">
          <CardHeader>
            <CardTitle className="text-lg">New service event</CardTitle>
            <CardDescription>Creates a Service-type event you can open in Event operations for setup and check-in.</CardDescription>
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
                  {planSaving ? 'Saving…' : 'Create'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setPlanOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'On calendar', count: drafting, color: 'bg-slate-100 text-slate-700' },
              { title: 'In planning', count: inPlanning, color: 'bg-indigo-100 text-indigo-700' },
              { title: 'Ready', count: ready, color: 'bg-emerald-100 text-emerald-700' },
            ].map((cat, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-100 bg-white flex justify-between items-center shadow-sm">
                <span className="text-sm font-bold text-slate-600 uppercase tracking-widest leading-none text-[10px]">{cat.title}</span>
                <Badge className={cn('rounded-full border-none px-3 font-black', cat.color)}>{cat.count}</Badge>
              </div>
            ))}
          </div>

          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="py-5 border-b border-slate-50 flex flex-row items-center justify-between px-6 bg-slate-50/20">
              <CardTitle className="text-lg font-bold text-slate-800">Master schedule</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-12 text-center text-slate-400 font-medium">Loading services…</div>
              ) : rows.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <p className="text-slate-500 font-medium">No service events yet. Plan a service or create one from the Events tab.</p>
                  <Button type="button" variant="outline" onClick={() => onModuleChange?.('events')}>
                    Open events
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {rows.map((srv) => {
                    const d = new Date(srv.date);
                    const dayStr = d.toLocaleDateString(undefined, { weekday: 'short' });
                    const dayNum = d.getDate().toString();
                    return (
                      <div
                        key={srv.id}
                        className="p-6 hover:bg-slate-50/50 transition-all group flex flex-col md:flex-row justify-between md:items-center gap-4 cursor-pointer active:bg-slate-100"
                        onClick={() => setSelectedService(srv)}
                        onKeyDown={(ev) => {
                          if (ev.key === 'Enter' || ev.key === ' ') {
                            ev.preventDefault();
                            setSelectedService(srv);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex items-center gap-5 min-w-0">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-slate-400 group-hover:bg-white group-hover:border-indigo-200 transition-all shadow-sm shrink-0">
                            <span className="text-[10px] font-bold uppercase leading-none mb-1">{dayStr}</span>
                            <span className="text-xl font-black text-slate-700 leading-none group-hover:text-indigo-600 transition-colors">{dayNum}</span>
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tight text-lg leading-tight truncate">
                              {srv.name}
                            </h3>
                            <p className="text-xs text-slate-400 font-medium truncate">
                              {srv.location || 'Venue TBA'} · Service event
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="text-[10px] font-black uppercase"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              openInEvents(srv.id);
                            }}
                          >
                            Ops
                          </Button>
                          <Badge className="rounded-full px-4 py-1.5 font-black border-none text-[9px] uppercase tracking-widest leading-none shadow-sm bg-indigo-50 text-indigo-700">
                            Planned
                          </Badge>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm h-fit rounded-3xl overflow-hidden">
            <CardHeader className="py-5 border-b border-slate-50 bg-slate-50/30">
              <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-widest">Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50/50 text-slate-600 text-xs font-black uppercase tracking-widest border border-transparent hover:border-indigo-100 transition-all active:scale-95 text-left"
                onClick={() => onModuleChange?.('worship')}
              >
                <Music className="w-4 h-4 text-indigo-500" />
                Worship planning
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-50/50 text-slate-600 text-xs font-black uppercase tracking-widest border border-transparent hover:border-emerald-100 transition-all active:scale-95 text-left"
                onClick={() => onModuleChange?.('attendance')}
              >
                <ListOrdered className="w-4 h-4 text-emerald-500" />
                Attendance
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-amber-50/50 text-slate-600 text-xs font-black uppercase tracking-widest border border-transparent hover:border-amber-100 transition-all active:scale-95 text-left"
                onClick={() => onModuleChange?.('volunteers')}
              >
                <Mic2 className="w-4 h-4 text-amber-500" />
                Volunteers
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100/50 text-slate-600 text-xs font-black uppercase tracking-widest border border-transparent hover:border-slate-200 transition-all active:scale-95 text-left"
                onClick={() => onModuleChange?.('website')}
              >
                <Video className="w-4 h-4 text-slate-400" />
                Website & media
              </button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden rounded-3xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Rehearsal block
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-xs text-slate-300 font-medium leading-relaxed">
              <p>Schedule rehearsals as Special events, then open them in Event operations for notes and attendance.</p>
              <Button type="button" className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={() => onModuleChange?.('events')}>
                Go to events
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
