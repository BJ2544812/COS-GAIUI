import React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Star,
  Calendar,
  Plus,
  ArrowLeft,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { useSettings } from '@/context/SettingsContext';
import { EventWorkspace } from '@/components/events/EventWorkspace';
import {
  UCOS_OPEN_EVENT_ID,
  UCOS_OPEN_SERVICE_EVENT_ID,
} from '@/lib/sundayServicesNavigation';
import {
  UCOS_EVENT_WORKSPACE_TAB,
  UCOS_OPEN_NEXT_SERVICE,
  UCOS_EVENTS_ACTIVE_EVENT_ID,
  type EventWorkspaceTab,
} from '@/lib/eventWorkspaceNavigation';
import { openAttendanceForEvent } from '@/lib/attendanceNavigation';
import { EVENT_STATUS_LABELS, EVENT_STATUS_COLORS } from '@/lib/eventLifecycle';
import { ModuleHeader, ActionButton, PageLayout, FeedbackBanner } from '@/components/modules/ModuleHeader';
import type { ERPModule } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import {
  EventPublicPublishingFields,
  emptyPublicForm,
  publicFormFromProfile,
  publicFormToProfile,
  type EventPublicFormState,
} from '@/components/events/EventPublicPublishingFields';
import { getEventPublicProfile, publicRegistrationCount, isPublishedToWebsite } from '@/lib/eventPublicProfile';
import {
  EVENT_CREATE_TYPE_OPTIONS,
  defaultCreateTypeOptionId,
  defaultEventDateIso,
  defaultWorshipServiceDateYmd,
  labelForEventType,
  readEventCategory,
  resolveEventCreateOption,
} from '@/lib/eventTypeCatalog';


type EventDetailDto = {
  id: string;
  name: string;
  type: string;
  date: string;
  status?: string;
  location?: string | null;
  internalNotes?: string | null;
  recurringRule?: string | null;
  opsConfig?: unknown;
  registrationOpen?: boolean;
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

type EventCard = {
  id: string;
  title: string;
  date: string;
  status: string;
  statusKey: string;
  attendees: number;
  regCount: number;
  published: boolean;
  type: string;
  typeLabel?: string;
};

function readWorkspaceTab(): EventWorkspaceTab {
  if (typeof window === 'undefined') return 'overview';
  const t = sessionStorage.getItem(UCOS_EVENT_WORKSPACE_TAB);
  sessionStorage.removeItem(UCOS_EVENT_WORKSPACE_TAB);
  const allowed: EventWorkspaceTab[] = ['overview', 'people', 'schedule', 'finance', 'reports', 'workflow'];
  if (t && allowed.includes(t as EventWorkspaceTab)) return t as EventWorkspaceTab;
  return 'overview';
}

function pickNextServiceId(rows: { id: string; type: string; date: string }[]): string | null {
  const services = rows.filter((e) => e.type === 'Service').sort((a, b) => +new Date(a.date) - +new Date(b.date));
  if (services.length === 0) return null;
  const now = Date.now();
  const upcoming = services.find((s) => +new Date(s.date) >= now - 12 * 60 * 60 * 1000);
  return (upcoming ?? services[services.length - 1]).id;
}

export function EventsModule({
  onModuleChange,
}: {
  onModuleChange?: (m: ERPModule, tab?: string) => void;
  initialTab?: string;
}) {
  const { settings } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = React.useState<'list' | 'details' | 'create' | 'setup'>('list');
  const [workspaceTab, setWorkspaceTab] = React.useState<EventWorkspaceTab>('overview');
  const [selectedEvent, setSelectedEvent] = React.useState<EventCard | null>(null);
  const [eventDetail, setEventDetail] = React.useState<EventDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [listEvents, setListEvents] = React.useState<EventCard[]>([]);
  const [eventsError, setEventsError] = React.useState<string | null>(null);
  const [listLoading, setListLoading] = React.useState(true);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [createName, setCreateName] = React.useState('');
  const [createTypeOptionId, setCreateTypeOptionId] = React.useState(defaultCreateTypeOptionId);
  const [createDate, setCreateDate] = React.useState(() => defaultWorshipServiceDateYmd());
  const [createLocation, setCreateLocation] = React.useState('');
  const [createPublic, setCreatePublic] = React.useState<EventPublicFormState>(emptyPublicForm);

  const [setupLocation, setSetupLocation] = React.useState('');
  const [setupPublic, setSetupPublic] = React.useState<EventPublicFormState>(emptyPublicForm);
  const [setupInternalNotes, setSetupInternalNotes] = React.useState('');
  const [setupRecurring, setSetupRecurring] = React.useState('');
  const [setupName, setSetupName] = React.useState('');
  const [setupDate, setSetupDate] = React.useState('');
  const [setupType, setSetupType] = React.useState('Service');
  const [setupSaving, setSetupSaving] = React.useState(false);

  const mapRowsToCards = React.useCallback(
    (rows: {
      id: string;
      name: string;
      type: string;
      date: string;
      status?: string;
      opsConfig?: unknown;
      attendanceSessions?: Array<{ _count?: { attendances: number } }>;
    }[]) =>
      rows.map((e) => {
        const attendees = (e.attendanceSessions ?? []).reduce((s, sess) => s + (sess._count?.attendances ?? 0), 0);
        const regCount = publicRegistrationCount(e.opsConfig);
        const statusKey = e.status ?? 'DRAFT';
        return {
          id: e.id,
          title: e.name,
          date: new Date(e.date).toLocaleDateString(),
          status: EVENT_STATUS_LABELS[statusKey] ?? statusKey,
          statusKey,
          attendees,
          regCount,
          published: isPublishedToWebsite(e.opsConfig),
          type: e.type,
          typeLabel: labelForEventType(e.type, readEventCategory(e.opsConfig)),
        };
      }),
    [],
  );

  const fetchEvents = React.useCallback(async () => {
    try {
      setEventsError(null);
      setListLoading(true);
      const json = await apiRequest<unknown>('events', { method: 'GET' });
      const rows = parseApiResponse<{ id: string; name: string; type: string; date: string; status?: string; opsConfig?: unknown; attendanceSessions?: Array<{ _count?: { attendances: number } }> }[]>(json);
      setListEvents(mapRowsToCards(rows));
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

  const loadEventOperational = React.useCallback(async (id: string, listCard?: EventCard | null) => {
    setDetailError(null);
    setDetailLoading(true);
    setEventDetail(null);
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
        status: EVENT_STATUS_LABELS[row.status ?? 'DRAFT'] ?? row.status ?? 'Draft',
        statusKey: row.status ?? 'DRAFT',
        attendees: count,
        regCount: publicRegistrationCount(row.opsConfig),
        published: isPublishedToWebsite(row.opsConfig),
        type: row.type,
      });
      setSetupPublic(publicFormFromProfile(getEventPublicProfile(row.opsConfig)));
    } catch (e) {
      setDetailError(formatApiError(e));
      if (listCard) setSelectedEvent(listCard);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const syncEventUrl = React.useCallback(
    (eventId: string | null, tab?: EventWorkspaceTab) => {
      const next = new URLSearchParams(searchParams);
      if (eventId) {
        next.set('event', eventId);
        if (tab) next.set('tab', tab);
      } else {
        next.delete('event');
        next.delete('tab');
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const openEventDetails = React.useCallback(
    (id: string, listCard?: EventCard | null, tab: EventWorkspaceTab = 'overview') => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(UCOS_EVENTS_ACTIVE_EVENT_ID, id);
        sessionStorage.setItem(UCOS_EVENT_WORKSPACE_TAB, tab);
      }
      setWorkspaceTab(tab);
      setView('details');
      syncEventUrl(id, tab);
      void loadEventOperational(id, listCard);
    },
    [loadEventOperational, syncEventUrl],
  );

  React.useEffect(() => {
    const urlEventId = searchParams.get('event');
    if (urlEventId && view === 'list') {
      const tabParam = searchParams.get('tab');
      const allowed: EventWorkspaceTab[] = ['overview', 'people', 'schedule', 'finance', 'reports', 'workflow'];
      const tab = tabParam && allowed.includes(tabParam as EventWorkspaceTab) ? (tabParam as EventWorkspaceTab) : readWorkspaceTab();
      openEventDetails(urlEventId, null, tab);
      return;
    }

    const persistedId = sessionStorage.getItem(UCOS_EVENTS_ACTIVE_EVENT_ID);
    if (persistedId && view === 'list') {
      openEventDetails(persistedId, null, readWorkspaceTab());
      return;
    }

    const openNext = sessionStorage.getItem(UCOS_OPEN_NEXT_SERVICE);
    if (openNext) {
      sessionStorage.removeItem(UCOS_OPEN_NEXT_SERVICE);
      void (async () => {
        try {
          const json = await apiRequest<unknown>('events', { method: 'GET' });
          const rows = parseApiResponse<{ id: string; type: string; date: string }[]>(json);
          const id = pickNextServiceId(rows);
          if (id) openEventDetails(id, null, readWorkspaceTab());
        } catch {
          /* list stays */
        }
      })();
      return;
    }

    const serviceId = sessionStorage.getItem(UCOS_OPEN_SERVICE_EVENT_ID);
    if (serviceId) {
      sessionStorage.removeItem(UCOS_OPEN_SERVICE_EVENT_ID);
      openEventDetails(serviceId, null, readWorkspaceTab());
      return;
    }

    const id = sessionStorage.getItem(UCOS_OPEN_EVENT_ID);
    if (!id) return;
    sessionStorage.removeItem(UCOS_OPEN_EVENT_ID);
    openEventDetails(id, null, readWorkspaceTab());
  }, [openEventDetails]);

  React.useEffect(() => {
    if (!successMessage) return;
    const t = window.setTimeout(() => setSuccessMessage(null), 4500);
    return () => window.clearTimeout(t);
  }, [successMessage]);

  const handleEventClick = (event: EventCard) => {
    openEventDetails(event.id, event);
  };

  const openSetup = () => {
    if (!eventDetail) return;
    setSetupName(eventDetail.name);
    setSetupDate(eventDetail.date.slice(0, 10));
    setSetupType(eventDetail.type);
    setSetupLocation(eventDetail.location ?? '');
    setSetupInternalNotes(eventDetail.internalNotes ?? '');
    setSetupRecurring(eventDetail.recurringRule ?? '');
    setSetupPublic(publicFormFromProfile(getEventPublicProfile(eventDetail.opsConfig)));
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
          publicProfile: publicFormToProfile(setupPublic),
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

  const submitNewEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    const typeOption = resolveEventCreateOption(createTypeOptionId);
    setCreating(true);
    setEventsError(null);
    try {
      const j = await apiRequest<unknown>('events', {
        method: 'POST',
        body: {
          name: createName.trim(),
          type: typeOption.canonicalType,
          date: defaultEventDateIso(typeOption.canonicalType, createDate),
          location: createLocation.trim() || null,
          publicProfile: publicFormToProfile(createPublic),
          ...(typeOption.category ? { eventCategory: typeOption.category } : {}),
        },
      });
      const created = parseApiResponse<{ id: string; name: string; type: string; date: string }>(j);
      await fetchEvents();
      setSuccessMessage(`Event “${created.name}” was created.`);
      setCreateName('');
      openEventDetails(created.id, null, 'overview');
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
                  <option value="Service">Worship service</option>
                  <option value="Special">Special event</option>
                  <option value="SmallGroup">Small group gathering</option>
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
            <Card className="rounded-2xl border-indigo-100 bg-indigo-50/30 p-6">
              <h3 className="text-sm font-black text-slate-900 mb-4">Website &amp; registration</h3>
              <EventPublicPublishingFields
                form={setupPublic}
                onChange={(p) => setSetupPublic((f) => ({ ...f, ...p }))}
                eventId={eventDetail.id}
              />
              {setupPublic.publishedToWebsite && (
                <p className="text-xs text-indigo-700 mt-4 font-medium">
                  Public page:{' '}
                  <a className="underline" href={`/events/${eventDetail.id}`} target="_blank" rel="noreferrer">
                    /events/{eventDetail.id}
                  </a>
                  {publicRegistrationCount(eventDetail.opsConfig) > 0 &&
                    ` · ${publicRegistrationCount(eventDetail.opsConfig)} online registration(s)`}
                </p>
              )}
            </Card>
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
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create event</h1>
            <p className="text-sm text-slate-500 font-medium">
              Conferences, outreach, worship services, and small groups — each opens in one workspace.
            </p>
          </div>
        </div>

        {eventsError && <p className="text-sm text-rose-600 font-medium">{eventsError}</p>}

        <Card className="rounded-[2.5rem] border-none shadow-2xl p-8 space-y-8 text-left">
          <form className="space-y-8" onSubmit={submitNewEvent}>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Event title</label>
              <input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                type="text"
                required
                className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-[color:var(--brand-primary)] transition-all"
                placeholder="e.g. Youth Conclave"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Event type</label>
                <select
                  value={createTypeOptionId}
                  onChange={(e) => {
                    const optionId = e.target.value;
                    setCreateTypeOptionId(optionId);
                    const option = resolveEventCreateOption(optionId);
                    if (option.canonicalType === 'Service') {
                      setCreateDate(defaultWorshipServiceDateYmd());
                    }
                  }}
                  className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-[color:var(--brand-primary)] appearance-none cursor-pointer"
                >
                  {EVENT_CREATE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Date</label>
                <input
                  type="date"
                  value={createDate}
                  onChange={(e) => setCreateDate(e.target.value)}
                  required
                  className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-[color:var(--brand-primary)]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Location</label>
              <input
                value={createLocation}
                onChange={(e) => setCreateLocation(e.target.value)}
                className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900"
                placeholder="Venue or campus room"
              />
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="text-sm font-black text-slate-900 mb-4">Website &amp; registration</h3>
              <EventPublicPublishingFields
                form={createPublic}
                onChange={(p) => setCreatePublic((f) => ({ ...f, ...p }))}
              />
            </div>

            <div className="pt-2 flex gap-4">
              <Button
                type="submit"
                disabled={creating}
                className="flex-1 h-14 rounded-2xl bg-[var(--brand-primary)] text-[11px] font-black uppercase tracking-[0.2em]"
              >
                {creating ? 'Saving…' : 'Create event'}
              </Button>
              <Button type="button" variant="ghost" className="px-8 h-14 rounded-2xl text-[11px] font-black uppercase" onClick={() => setView('list')}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  if (view === 'details' && selectedEvent) {
    return (
      <div className="space-y-6 min-w-0 animate-in fade-in duration-500 text-left max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem(UCOS_EVENTS_ACTIVE_EVENT_ID);
            sessionStorage.removeItem(UCOS_EVENT_WORKSPACE_TAB);
          }
          syncEventUrl(null);
          setView('list');
          setEventDetail(null);
        }} className="gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" /> All events
        </Button>
        {detailError && <p className="text-sm text-rose-600 font-medium">{detailError}</p>}
        {detailLoading && (
          <p className="text-sm text-slate-500 font-medium py-8 text-center">Opening event…</p>
        )}
        {!detailLoading && eventDetail && (
          <EventWorkspace
            eventId={eventDetail.id}
            initialTab={workspaceTab}
            onTabChange={(tab) => {
              setWorkspaceTab(tab);
              syncEventUrl(eventDetail.id, tab);
            }}
            onOpenSetup={openSetup}
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
         subtitle="One place for worship services, conferences, outreach, and gatherings."
         status="live"
         icon={Star}
         actions={
           <ActionButton label="Create Event" icon={Plus} variant="primary" onClick={() => setView('create')} />
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
                          <Badge variant="outline" className="text-[9px] uppercase tracking-[0.2em] font-black rounded-lg text-[color:var(--brand-primary)] border-[color:var(--brand-primary)]/20 bg-[color-mix(in_oklab,var(--brand-primary)12%,white)]/30 px-3 py-1.5">{event.typeLabel ?? event.type}</Badge>
                          <span className="text-[10px] font-black text-slate-300 group-hover:text-[var(--brand-secondary)] transition-colors uppercase tracking-widest">{event.date}</span>
                       </div>
                       <h3 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-[color:var(--brand-primary)] transition-colors pt-1 leading-tight">{event.title}</h3>
                    </div>
                    
                    <div className="flex flex-wrap justify-between items-center gap-2 border-t border-slate-50 pt-5 mt-2">
                       <span className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                         <Users size={16} className="text-slate-300" />
                         {event.attendees} checked in
                         {event.regCount > 0 ? ` · ${event.regCount} registered` : ''}
                       </span>
                       <div className="flex flex-wrap gap-1.5">
                         {event.published && (
                           <Badge className="text-[9px] px-2 py-1 rounded-full font-black uppercase bg-indigo-50 text-indigo-700 border-none">
                             Website
                           </Badge>
                         )}
                         <Badge className={cn('text-[9px] px-3 py-1.5 rounded-full font-black border-none uppercase tracking-widest', EVENT_STATUS_COLORS[event.statusKey] ?? 'bg-slate-50 text-slate-500')}>
                           {event.status}
                         </Badge>
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>
         ))
         )}
      </div>

    </PageLayout>
  );
}
