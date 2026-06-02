import React from 'react';
import { Music4, Calendar, MapPin, ArrowRight, Users, Mic2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { ModuleHeader, ActionButton } from '@/components/modules/ModuleHeader';
import type { ERPModule } from '@/types';

const UCOS_OPEN_EVENT_ID = 'ucos_open_event_id';
const UCOS_EVENTS_ACTIVE_TAB = 'ucos_events_active_tab';

type Ev = { id: string; name: string; type: string; date: string; location?: string | null };

export function WorshipPlanningModule({ onModuleChange }: { onModuleChange?: import('@/types').ModuleNavigate }) {
  const [events, setEvents] = React.useState<Ev[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const run = async () => {
      try {
        setError(null);
        const j = await apiRequest<unknown>('events', { method: 'GET' });
        const rows = parseApiResponse<Ev[]>(j);
        setEvents(rows.sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 40));
      } catch (e) {
        setError(formatApiError(e));
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const openEvent = (id: string) => {
    sessionStorage.setItem(UCOS_OPEN_EVENT_ID, id);
    onModuleChange?.('events');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      <ModuleHeader
        title="Worship planning"
        subtitle="Setlists, rehearsal blocks, and production cues stay aligned with the same events used for services and attendance."
        status="partial"
        icon={Music4}
        actions={
          <div className="flex flex-wrap gap-2">
            <ActionButton label="Worship services" icon={Calendar} variant="secondary" onClick={() => onModuleChange?.('events', 'services')} />
            <ActionButton label="Events" icon={ArrowRight} variant="primary" onClick={() => onModuleChange?.('events')} />
          </div>
        }
      />

      {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-[2rem] border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-black tracking-tight">Upcoming ministry dates</CardTitle>
            <CardDescription>Pulls live events so planning stays tied to check-in and sermon workflows.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-medium">Loading calendar…</div>
            ) : events.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm font-medium">No events yet. Create one in Events or Worship services.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {events.map((ev) => (
                  <div key={ev.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 hover:bg-slate-50/80">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest">
                          {ev.type}
                        </Badge>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {new Date(ev.date).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-bold text-slate-900 truncate">{ev.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {ev.location || 'Location TBA'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button type="button" size="sm" variant="secondary" className="text-[10px] font-black uppercase" onClick={() => openEvent(ev.id)}>
                        Details
                      </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="text-[10px] font-black uppercase bg-indigo-600"
                      onClick={() => {
                        sessionStorage.setItem('ucos_open_service_event_id', ev.id);
                        sessionStorage.setItem(UCOS_EVENTS_ACTIVE_TAB, 'services');
                        onModuleChange?.('events');
                      }}
                    >
                      Run sheet
                    </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border-slate-100 shadow-sm space-y-4">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Quick links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Button type="button" variant="outline" className="w-full justify-start font-bold" onClick={() => onModuleChange?.('attendance')}>
              <Users className="w-4 h-4 mr-2" /> Attendance check-in
            </Button>
            <Button type="button" variant="outline" className="w-full justify-start font-bold" onClick={() => onModuleChange?.('sermons')}>
              <Mic2 className="w-4 h-4 mr-2" /> Sermons
            </Button>
            <Button type="button" variant="outline" className="w-full justify-start font-bold" onClick={() => onModuleChange?.('media-library')}>
              Media attachments
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2rem] bg-slate-950 text-white border-none overflow-hidden">
        <CardContent className="p-8 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Setlist and cues</p>
          <p className="text-sm text-slate-300 leading-relaxed font-medium">
            Use Worship services for per-service run sheet templates. Song lists and production cues can be mirrored in Event setup staff notes until a
            dedicated plan entity ships.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
