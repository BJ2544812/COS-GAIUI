import React from 'react';
import { 
  Star, 
  Search, 
  Filter, 
  MapPin, 
  Users, 
  Calendar, 
  Plus, 
  ChevronRight, 
  ArrowRight,
  ArrowLeft,
  Settings,
  Share2,
  Ticket,
  DollarSign,
  Download,
  Mic2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { useSettings } from '@/context/SettingsContext';
import { EventWorkspace } from '@/components/events/EventWorkspace';
import { openSundayServices, UCOS_OPEN_EVENT_ID } from '@/lib/sundayServicesNavigation';
import { formatCurrencyAmount } from '@/lib/formatCurrency';
import { EVENT_STATUS_LABELS } from '@/lib/eventLifecycle';
import { ModuleHeader, ActionButton, PageLayout, FeedbackBanner } from '@/components/modules/ModuleHeader';
import type { ERPModule } from '@/types';
import { Textarea } from '@/components/ui/textarea';


type EventDetailDto = {
  id: string;
  name: string;
  type: string;
  date: string;
  location?: string | null;
  internalNotes?: string | null;
  recurringRule?: string | null;
  campus?: { id: string; name: string } | null;
  attendanceSessions?: Array<{
    id: string;
    name: string;
    date: string;
    status: string;
    type: string;
    _count?: { attendances: number };
  }>;
};

type EventAttendanceRow = {
  id: string;
  checkInTime: string;
  status: string;
  member?: { id: string; name: string } | null;
  visitorName?: string | null;
  notes?: string | null;
  session?: { id: string; name: string };
};

type EventCard = {
  id: string;
  title: string;
  date: string;
  status: string;
  attendees: number;
  budget: string;
  type: string;
};

export function EventsModule({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  const { settings } = useSettings();
  const [view, setView] = React.useState<'list' | 'details' | 'create' | 'setup'>('list');
  const [selectedEvent, setSelectedEvent] = React.useState<EventCard | null>(null);
  const [eventDetail, setEventDetail] = React.useState<EventDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [eventAttendees, setEventAttendees] = React.useState<EventAttendanceRow[]>([]);
  const [listEvents, setListEvents] = React.useState<EventCard[]>([]);
  const [eventsError, setEventsError] = React.useState<string | null>(null);
  const [listLoading, setListLoading] = React.useState(true);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [createName, setCreateName] = React.useState('');
  const [createType, setCreateType] = React.useState('Special');
  const [createDate, setCreateDate] = React.useState(() => new Date().toISOString().split('T')[0]);

  const [setupLocation, setSetupLocation] = React.useState('');
  const [setupInternalNotes, setSetupInternalNotes] = React.useState('');
  const [setupRecurring, setSetupRecurring] = React.useState('');
  const [setupName, setSetupName] = React.useState('');
  const [setupDate, setSetupDate] = React.useState('');
  const [setupType, setSetupType] = React.useState('Service');
  const [setupSaving, setSetupSaving] = React.useState(false);

  const mapRowsToCards = React.useCallback(
    (rows: { id: string; name: string; type: string; date: string }[]) =>
      rows.map((e) => ({
        id: e.id,
        title: e.name,
        date: new Date(e.date).toLocaleDateString(),
        status: 'Planned',
        attendees: 0,
        budget: '—',
        type: e.type,
      })),
    [],
  );

  const fetchEvents = React.useCallback(async () => {
    try {
      setEventsError(null);
      setListLoading(true);
      const json = await apiRequest<unknown>('events', { method: 'GET' });
      const rows = parseApiResponse<{ id: string; name: string; type: string; date: string }[]>(json);
      setListEvents(mapRowsToCards(rows.filter((e) => e.type !== 'Service')));
    } catch (e) {
      setEventsError(formatApiError(e));
      setListEvents([]);
    } finally {
      setListLoading(false);
    }
  }, [mapRowsToCards]);

  React.useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  React.useEffect(() => {
    if (!successMessage) return;
    const t = window.setTimeout(() => setSuccessMessage(null), 4500);
    return () => window.clearTimeout(t);
  }, [successMessage]);

  const loadEventOperational = React.useCallback(async (id: string, listCard?: EventCard | null) => {
    setDetailError(null);
    setDetailLoading(true);
    setEventDetail(null);
    setEventAttendees([]);
    if (listCard) setSelectedEvent(listCard);
    try {
      const j = await apiRequest<unknown>(`events/${id}`, { method: 'GET' });
      const row = parseApiResponse<EventDetailDto>(j);
      setEventDetail(row);
      const count = (row.attendanceSessions ?? []).reduce((s, sess) => s + (sess._count?.attendances ?? 0), 0);
      setSelectedEvent({
        id: row.id,
        title: row.name,
        date: new Date(row.date).toLocaleDateString(),
        status: 'Planned',
        attendees: count,
        budget: '—',
        type: row.type,
      });
      const aj = await apiRequest<unknown>(`attendance/event/${id}`, { method: 'GET' });
      setEventAttendees(parseApiResponse<EventAttendanceRow[]>(aj) ?? []);
    } catch (e) {
      setDetailError(formatApiError(e));
      if (listCard) setSelectedEvent(listCard);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const id = sessionStorage.getItem(UCOS_OPEN_EVENT_ID);
    if (!id) return;
    sessionStorage.removeItem(UCOS_OPEN_EVENT_ID);
    void (async () => {
      try {
        const j = await apiRequest<unknown>(`events/${id}`, { method: 'GET' });
        const row = parseApiResponse<{ type: string }>(j);
        if (row.type === 'Service') {
          openSundayServices(onModuleChange, 'plan', id);
          return;
        }
      } catch {
        /* fall through to workspace */
      }
      setView('details');
      void loadEventOperational(id);
    })();
  }, [loadEventOperational, onModuleChange]);

  const handleEventClick = (event: EventCard) => {
    if (event.type === 'Service') {
      openSundayServices(onModuleChange, 'plan', event.id);
      return;
    }
    setView('details');
    void loadEventOperational(event.id, event);
  };

  const openSetup = () => {
    if (!eventDetail) return;
    setSetupName(eventDetail.name);
    setSetupDate(eventDetail.date.slice(0, 10));
    setSetupType(eventDetail.type);
    setSetupLocation(eventDetail.location ?? '');
    setSetupInternalNotes(eventDetail.internalNotes ?? '');
    setSetupRecurring(eventDetail.recurringRule ?? '');
    setView('setup');
  };

  const saveSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDetail) return;
    setSetupSaving(true);
    setEventsError(null);
    try {
      const j = await apiRequest<unknown>(`events/${eventDetail.id}`, {
        method: 'PUT',
        body: {
          name: setupName.trim() || eventDetail.name,
          type: setupType,
          date: setupDate,
          location: setupLocation.trim() || null,
          internalNotes: setupInternalNotes.trim() || null,
          recurringRule: setupRecurring.trim() || null,
        },
      });
      const updated = parseApiResponse<EventDetailDto>(j);
      setEventDetail(updated);
      setSelectedEvent((prev) =>
        prev && prev.id === updated.id
          ? {
              ...prev,
              title: updated.name,
              type: updated.type,
              date: new Date(updated.date).toLocaleDateString(),
            }
          : prev,
      );
      setView('details');
      setSuccessMessage('Event setup saved.');
      void fetchEvents();
    } catch (err) {
      setEventsError(formatApiError(err));
    } finally {
      setSetupSaving(false);
    }
  };

  const createCheckInSession = async () => {
    if (!eventDetail) return;
    setEventsError(null);
    try {
      const j = await apiRequest<unknown>('attendance/sessions', {
        method: 'POST',
        body: {
          name: `Check-in: ${eventDetail.name}`,
          date: eventDetail.date,
          type: 'EVENT',
          eventId: eventDetail.id,
          status: 'OPEN',
        },
      });
      const session = parseApiResponse<{ id: string }>(j);
      sessionStorage.setItem('ucos_open_attendance_session_id', session.id);
      onModuleChange?.('attendance');
      setSuccessMessage('Opened the Attendance module with this check-in session.');
    } catch (e) {
      setEventsError(formatApiError(e));
    }
  };

  const openAttendanceSession = (sessionId: string) => {
    sessionStorage.setItem('ucos_open_attendance_session_id', sessionId);
    onModuleChange?.('attendance');
  };

  const downloadAttendanceReport = () => {
    const lines = [
      ['session', 'name', 'status', 'checkInTime', 'notes'].join(','),
      ...eventAttendees.map((r) =>
        [
          r.session?.name ?? '',
          (r.member?.name ?? r.visitorName ?? '').replace(/,/g, ' '),
          r.status,
          r.checkInTime,
          (r.notes ?? '').replace(/,/g, ' '),
        ].join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `event-attendance-${selectedEvent?.id ?? 'export'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const submitNewEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreating(true);
    setEventsError(null);
    try {
      const j = await apiRequest<unknown>('events', {
        method: 'POST',
        body: { name: createName.trim(), type: createType, date: createDate },
      });
      const created = parseApiResponse<{ id: string; name: string; type: string; date: string }>(j);
      await fetchEvents();
      setSuccessMessage(`Event “${created.name}” was created.`);
      setView('list');
      setCreateName('');
    } catch (err) {
      setEventsError(formatApiError(err));
    } finally {
      setCreating(false);
    }
  };

  if (view === 'setup' && eventDetail) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 text-left">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView('details')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Event setup</h1>
            <p className="text-sm text-slate-500 font-medium">Location, recurrence, and staff-only notes are saved to this event.</p>
          </div>
        </div>
        {eventsError && <p className="text-sm text-rose-600 font-medium">{eventsError}</p>}
        <Card className="rounded-[2.5rem] border-none shadow-xl p-8">
          <form className="space-y-6" onSubmit={saveSetup}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Title</label>
              <input
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Type</label>
                <select
                  value={setupType}
                  onChange={(e) => setSetupType(e.target.value)}
                  className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900"
                >
                  <option value="Service">Service</option>
                  <option value="Special">Special</option>
                  <option value="SmallGroup">SmallGroup</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date</label>
                <input
                  type="date"
                  value={setupDate}
                  onChange={(e) => setSetupDate(e.target.value)}
                  className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Location</label>
              <input
                value={setupLocation}
                onChange={(e) => setSetupLocation(e.target.value)}
                placeholder="Main sanctuary, hall, campus…"
                className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Recurrence (optional)</label>
              <input
                value={setupRecurring}
                onChange={(e) => setSetupRecurring(e.target.value)}
                placeholder="e.g. WEEKLY:SUNDAY or RRULE string"
                className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Staff notes and follow-up</label>
              <Textarea
                value={setupInternalNotes}
                onChange={(e) => setSetupInternalNotes(e.target.value)}
                rows={5}
                className="rounded-2xl bg-slate-50 border-none font-medium text-slate-800"
                placeholder="Volunteer briefing, pastoral follow-up, production cues…"
              />
            </div>
            <div className="flex gap-4 pt-2">
              <Button
                type="submit"
                disabled={setupSaving}
                className="flex-1 h-14 rounded-2xl bg-[var(--brand-primary)] text-white font-black uppercase text-[11px] tracking-widest"
              >
                {setupSaving ? 'Saving…' : 'Save setup'}
              </Button>
              <Button type="button" variant="outline" className="h-14 px-8 rounded-2xl font-black uppercase text-[11px]" onClick={() => setView('details')}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView('list')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create New Event</h1>
            <p className="text-sm text-slate-500 font-medium">Define schedules, logistics, and financial allocations.</p>
          </div>
        </div>

        {eventsError && <p className="text-sm text-rose-600 font-medium">{eventsError}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-2xl p-8 space-y-8 text-left">
              <form className="space-y-6" onSubmit={submitNewEvent}>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Event Title</label>
                    <input
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      type="text"
                      className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-[color:var(--brand-primary)] transition-all"
                      placeholder="e.g. Annual Youth Conclave"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Event type</label>
                       <select
                         value={createType}
                         onChange={(e) => setCreateType(e.target.value)}
                         className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-[color:var(--brand-primary)] appearance-none transition-all cursor-pointer"
                       >
                          <option value="Service">Service</option>
                          <option value="Special">Special</option>
                          <option value="SmallGroup">SmallGroup</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date</label>
                       <input
                         type="date"
                         value={createDate}
                         onChange={(e) => setCreateDate(e.target.value)}
                         className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-[color:var(--brand-primary)] transition-all"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Logistics & Accounting Type</label>
                    <div className="grid grid-cols-3 gap-3">
                       {['Ticketed', 'Free/Open', 'Invite Only'].map(t => (
                         <button key={t} className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 font-bold text-[10px] uppercase tracking-widest text-slate-600 border border-slate-100 transition-all active:scale-95">{t}</button>
                       ))}
                    </div>
                 </div>

                  <div className="grid grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Budget ({settings.financial.currency})</label>
                       <div className="relative">
                          <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input type="number" className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-12 pr-6 font-bold text-slate-900 focus:ring-2 focus:ring-[color:var(--brand-primary)] transition-all" placeholder="0.00" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Expense Allocation</label>
                       <select className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-[color:var(--brand-primary)] appearance-none transition-all cursor-pointer">
                          <option>Ministry Fund</option>
                          <option>Designated Offering</option>
                          <option>General Operations</option>
                          <option>Grant / Sponsorship</option>
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Financial Lead</label>
                       <input type="text" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-[color:var(--brand-primary)] transition-all" placeholder="Admin / Treasurer Name" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">External Partner %</label>
                       <input type="number" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-[color:var(--brand-primary)] transition-all" placeholder="Payout / Share" />
                    </div>
                 </div>

              <div className="pt-4 flex gap-4">
                 <Button type="submit" disabled={creating} className="flex-1 h-16 rounded-[2rem] bg-[var(--brand-primary)] hover:opacity-90 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200">
                   {creating ? 'Saving…' : 'Publish Event'}
                 </Button>
                 <Button type="button" variant="ghost" className="px-8 h-16 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em]" onClick={() => setView('list')}>Save Draft</Button>
              </div>
              </form>
           </Card>

           <div className="space-y-6">
              <Card className="rounded-[2.5rem] bg-slate-950 text-white p-8 space-y-6 overflow-hidden relative">
                 <div className="absolute inset-0 bg-gradient-to-br from-[color-mix(in_oklab,var(--brand-primary)12%,transparent)] to-transparent"></div>
                 <div className="relative z-10 space-y-4">
                    <h3 className="font-black text-lg tracking-tight">Public website</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Event visibility on the public site is managed from the Website builder when pages are wired to this calendar. This toggle is not connected yet.
                    </p>
                    <div className="flex items-center gap-3 py-3 border-y border-white/5 opacity-50 pointer-events-none">
                       <div className="w-10 h-5 bg-slate-600 rounded-full relative p-1 transition-all shadow-inner">
                          <div className="w-3 h-3 bg-white rounded-full ml-auto"></div>
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Not connected</span>
                    </div>
                 </div>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-sm p-8 text-left space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Approvals</h4>
                 <p className="text-xs text-slate-600 font-medium leading-relaxed">
                   Multi-step approval routing is not connected in this build. Use your church&apos;s usual approval process until workflows are wired.
                 </p>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'details' && selectedEvent) {
    return (
      <div className="space-y-6 min-w-0 animate-in fade-in slide-in-from-right-8 duration-500 text-left">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" onClick={() => { setView('list'); setEventDetail(null); }} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={openSetup} disabled={!eventDetail}>
              <Settings className="w-4 h-4 mr-2" /> Setup
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={downloadAttendanceReport} disabled={!eventAttendees.length}>
              <Download className="w-4 h-4 mr-2" /> Attendance CSV
            </Button>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900">{selectedEvent.title}</h2>
          <p className="text-sm text-slate-500 font-medium">
            {selectedEvent.date} · {selectedEvent.type} · {selectedEvent.status}
          </p>
        </div>
        {detailError && <p className="text-sm text-rose-600 font-medium">{detailError}</p>}
        {detailLoading && <p className="text-sm text-slate-500 font-medium">Loading event workspace…</p>}
        {!detailLoading && eventDetail && (
          <EventWorkspace
            eventId={eventDetail.id}
            onModuleChange={onModuleChange}
            currency={settings.financial.currency}
          />
        )}
      </div>
    );
  }

  return (
    <PageLayout>
       {successMessage && <FeedbackBanner tone="success">{successMessage}</FeedbackBanner>}

       <ModuleHeader
         title="Events"
         subtitle="Conferences, outreach gatherings, and special meetings — worship services live in Sunday & Services."
         status="live"
         icon={Star}
         actions={
           <div className="flex flex-wrap gap-2">
             <ActionButton
               label="Sunday & Services"
               icon={Calendar}
               variant="secondary"
               onClick={() => openSundayServices(onModuleChange, 'this-sunday')}
             />
             <ActionButton label="Create Event" icon={Plus} variant="primary" onClick={() => setView('create')} />
           </div>
         }
       />
       {eventsError && <p className="text-sm text-rose-600 font-medium mt-1 mb-4">{eventsError}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {listLoading ? (
           <div className="col-span-full py-20 text-center text-slate-400 font-medium">Loading events…</div>
         ) : listEvents.length === 0 ? (
           <Card className="col-span-full border-none shadow-sm rounded-[2rem] bg-white">
             <CardContent className="py-20 px-10 text-center space-y-6">
               <div className="w-16 h-16 rounded-[2rem] bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                 <Calendar className="w-8 h-8" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-xl font-black text-slate-900 tracking-tight">No events yet</h3>
                 <p className="text-sm text-slate-500 font-medium max-w-md mx-auto">
                   Create a service, special gathering, or small group so your calendar and website stay in sync.
                 </p>
               </div>
               <Button
                 type="button"
                 onClick={() => setView('create')}
                 className="h-12 px-8 rounded-2xl bg-[var(--brand-primary)] text-white font-black uppercase text-[10px] tracking-widest"
               >
                 <Plus className="w-4 h-4 mr-2 inline" /> Create Event
               </Button>
             </CardContent>
           </Card>
         ) : (
           listEvents.map((event) => (
           <Card 
            key={event.id} 
            onClick={() => handleEventClick(event)}
            className="border-none shadow-sm group hover:shadow-2xl cursor-pointer transition-all overflow-hidden bg-white active:scale-95 rounded-[2rem]"
          >
              <CardContent className="p-0">
                 <div className="h-2 bg-[var(--chart-primary)] w-full group-hover:bg-[var(--brand-primary)] transition-colors"></div>
                 <div className="p-8 space-y-6">
                    <div className="space-y-2">
                       <div className="flex justify-between items-start">
                          <Badge variant="outline" className="text-[9px] uppercase tracking-[0.2em] font-black rounded-lg text-[color:var(--brand-primary)] border-[color:var(--brand-primary)]/20 bg-[color-mix(in_oklab,var(--brand-primary)12%,white)]/30 px-3 py-1.5">{event.type}</Badge>
                          <span className="text-[10px] font-black text-slate-300 group-hover:text-[var(--brand-secondary)] transition-colors uppercase tracking-widest">{event.date}</span>
                       </div>
                       <h3 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-[color:var(--brand-primary)] transition-colors pt-1 leading-tight">{event.title}</h3>
                    </div>
                    
                    <div className="flex justify-between items-center border-t border-slate-50 pt-5 mt-2">
                       <span className="flex items-center gap-2 group-hover:text-slate-600 transition-colors text-[11px] font-bold text-slate-400"><Users size={16} className="text-slate-200 group-hover:text-[var(--brand-secondary)] transition-colors" /> {event.attendees} INTAKE</span>
                       <Badge className={cn("text-[9px] px-3 py-1.5 rounded-full font-black border-none uppercase tracking-widest",
                         event.status === 'Registration Open' ? "bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100" : "bg-slate-50 text-slate-500"
                       )}>{event.status}</Badge>
                    </div>
                 </div>
              </CardContent>
           </Card>
         ))
         )}
      </div>

      <div className="rounded-[2.5rem] border border-slate-200 bg-slate-50/80 p-8 text-left">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Event operations</p>
        <p className="mt-3 text-sm text-slate-600 font-medium leading-relaxed max-w-3xl">
          Logistics matrices, funnel dashboards, and milestone timelines shown here previously were illustrative only.
          Use the event cards above for details, setup, attendance sessions, and exports.
        </p>
      </div>
    </PageLayout>
  );
}
