import * as React from 'react';
import { 
  CalendarCheck, 
  Users, 
  MapPin, 
  Search, 
  Filter, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Download,
  ArrowLeft,
  CheckCircle2,
  Clock,
  MoreVertical,
  Mail,
  Phone,
  QrCode,
  Smartphone,
  ChevronRight,
  ArrowUpRight,
  Monitor,
  Layout,
  PlusCircle,
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { useSettings } from '@/context/SettingsContext';
import {
  ModuleHeader,
  ActionButton,
  PageLayout,
  StatCard,
  FeedbackBanner,
} from '@/components/modules/ModuleHeader';
import { ChurchAreaChart, ChartSection } from '@/components/modules/ChurchChart';
import { SubpageHeader } from '@/components/modules/SubpageHeader';
import { ds } from '@/lib/designSystem';
import {
  enqueueOfflineCheckIn,
  getOfflineQueue,
  removeOfflineIds,
} from '@/lib/offlineAttendanceQueue';
import { ApiError } from '@/lib/apiClient';
import { registerVisitorForFollowUp } from '@/lib/visitorWorkflow';
import { VisitorWorkflowBanner } from '@/components/operations/VisitorWorkflowBanner';
import {
  readAttendanceEventContext,
  UCOS_OPEN_ATTENDANCE_SESSION_ID,
} from '@/lib/attendanceNavigation';
import { isOperationalTestArtifact } from '@/lib/operationalEventFilter';
import { QRCodeSVG } from 'qrcode.react';
import type { ERPModule } from '@/types';

export function AttendanceModule({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  const { settings } = useSettings();
  const [selectedSession, setSelectedSession] = React.useState<any | null>(null);
  const [isLiveCheckin, setIsLiveCheckin] = React.useState(false);
  const [showQR, setShowQR] = React.useState<string | null>(null);
  const [checkinMode, setCheckinMode] = React.useState<'default' | 'staff' | 'visitor'>('default');
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [sessionRecords, setSessionRecords] = React.useState<any[]>([]);
  const [members, setMembers] = React.useState<any[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [attendanceError, setAttendanceError] = React.useState<string | null>(null);
  const [offlinePending, setOfflinePending] = React.useState(0);
  const [metrics, setMetrics] = React.useState<any>({
    totalAttendances: 0,
    memberParticipation: 0,
    visitorConversion: 0,
    activeMembers30d: 0,
    recentVelocity: []
  });

  const [linkedEventId, setLinkedEventId] = React.useState<string | null>(() => readAttendanceEventContext());

  const [showNewSessionModal, setShowNewSessionModal] = React.useState(false);
  const [newSessionName, setNewSessionName] = React.useState('');
  const [newSessionStandalone, setNewSessionStandalone] = React.useState(false);
  const [creatingSession, setCreatingSession] = React.useState(false);

  const loadSessions = React.useCallback(async () => {
    try {
      setAttendanceError(null);
      const res = await apiRequest<any>('attendance/sessions');
      const rows = parseApiResponse(res) || [];
      setSessions(
        rows.filter(
          (s: { name?: string; event?: { name?: string } }) =>
            !isOperationalTestArtifact(s.name) && !isOperationalTestArtifact(s.event?.name),
        ),
      );
    } catch (err) {
      setAttendanceError(formatApiError(err));
    }
  }, []);

  const loadRecords = React.useCallback(async (sessionId: string) => {
    try {
      const res = await apiRequest<any>(`attendance/sessions/${sessionId}/records`);
      setSessionRecords(parseApiResponse(res) || []);
    } catch (err) {
      console.error("Failed to load records", err);
    }
  }, []);

  const loadMetrics = React.useCallback(async () => {
    try {
      const res = await apiRequest<any>('attendance/metrics');
      setMetrics(parseApiResponse(res));
    } catch (err) {
      console.error("Failed to load metrics", err);
    }
  }, []);

  const loadMembers = React.useCallback(async () => {
    try {
      const res = await apiRequest<any>('members');
      setMembers(parseApiResponse(res) || []);
    } catch (err) {
      console.error("Failed to load members", err);
    }
  }, []);

  React.useEffect(() => {
    loadSessions();
    loadMembers();
    loadMetrics();
    setOfflinePending(getOfflineQueue().length);
  }, [loadSessions, loadMembers, loadMetrics]);

  const flushOfflineQueue = React.useCallback(async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;
    const synced = new Set<string>();
    for (const item of queue) {
      try {
        await apiRequest(`attendance/sessions/${item.sessionId}/records`, {
          method: 'POST',
          body: {
            memberId: item.memberId,
            ...item.visitor,
            method: item.method,
          },
        });
        synced.add(item.id);
      } catch {
        break;
      }
    }
    if (synced.size > 0) {
      removeOfflineIds(synced);
      setOfflinePending(getOfflineQueue().length);
      void loadSessions();
      if (selectedSession) void loadRecords(selectedSession.id);
    }
  }, [loadSessions, loadRecords, selectedSession]);

  React.useEffect(() => {
    if (offlinePending > 0) void flushOfflineQueue();
  }, [offlinePending, flushOfflineQueue]);

  React.useEffect(() => {
    setLinkedEventId(readAttendanceEventContext());
  }, [isLiveCheckin]);

  const openNewSessionModal = React.useCallback(() => {
    const eventId = readAttendanceEventContext();
    const defaultName = eventId
      ? `Check-in session — ${new Date().toLocaleDateString()}`
      : `Service — ${new Date().toLocaleDateString()}`;
    setNewSessionName(defaultName);
    setNewSessionStandalone(false);
    setShowNewSessionModal(true);
  }, []);

  const createSession = React.useCallback(async () => {
    const name = newSessionName.trim();
    if (!name) return;
    const eventId = readAttendanceEventContext();
    if (!eventId && !newSessionStandalone) return;
    setCreatingSession(true);
    try {
      const body: Record<string, unknown> = eventId
        ? { name, type: 'EVENT', eventId, status: 'OPEN' }
        : { name, type: 'SERVICE', status: 'OPEN' };
      const res = await apiRequest<any>('attendance/sessions', {
        method: 'POST',
        body,
      });
      const session = parseApiResponse(res);
      setShowNewSessionModal(false);
      setSelectedSession(session);
      setIsLiveCheckin(true);
      loadSessions();
    } catch (e) {
      setAttendanceError(formatApiError(e));
    } finally {
      setCreatingSession(false);
    }
  }, [loadSessions, newSessionName, newSessionStandalone]);

  const openSessionCheckIn = React.useCallback((session: { id: string }) => {
    setSelectedSession(session);
    setIsLiveCheckin(true);
  }, []);

  /** Deep link from Events / Sunday Service: open a specific session in the live portal */
  React.useEffect(() => {
    if (sessions.length === 0) return;
    const sid = sessionStorage.getItem(UCOS_OPEN_ATTENDANCE_SESSION_ID);
    if (!sid) return;
    sessionStorage.removeItem(UCOS_OPEN_ATTENDANCE_SESSION_ID);
    const s = sessions.find((x: { id: string }) => x.id === sid);
    if (s) {
      setSelectedSession(s);
      setIsLiveCheckin(true);
    }
  }, [sessions]);

  React.useEffect(() => {
    if (selectedSession) {
      loadRecords(selectedSession.id);
      const interval = setInterval(() => loadRecords(selectedSession.id), 10000); // Auto-refresh live portal
      return () => clearInterval(interval);
    }
  }, [selectedSession, loadRecords]);

  const handleCheckIn = async (memberId: string | null, visitorData?: { visitorName?: string; visitorPhone?: string }) => {
    if (!selectedSession || submitting) return;
    try {
      setSubmitting(true);
      await apiRequest(`attendance/sessions/${selectedSession.id}/records`, {
        method: 'POST',
        body: {
          memberId,
          ...visitorData,
          method: 'MANUAL'
        }
      });
      if (!memberId && visitorData?.visitorName?.trim()) {
        try {
          await registerVisitorForFollowUp({
            name: visitorData.visitorName.trim(),
            phone: visitorData.visitorPhone?.trim(),
            source: 'Attendance',
          });
        } catch (outreachErr) {
          setAttendanceError(
            `Checked in, but follow-up queue sync failed: ${formatApiError(outreachErr)}`,
          );
        }
      }
      loadRecords(selectedSession.id);
      loadSessions();
    } catch (err) {
      const offline =
        err instanceof ApiError && (err.status === 0 || err.status >= 500) ||
        (err instanceof TypeError && err.message.includes('fetch'));
      if (offline) {
        enqueueOfflineCheckIn({
          sessionId: selectedSession.id,
          memberId,
          visitor: visitorData,
          method: 'MANUAL',
        });
        setOfflinePending(getOfflineQueue().length);
        setAttendanceError('Saved offline — will sync when connection returns.');
      } else {
        setAttendanceError(formatApiError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const exportSessionsCsv = () => {
    const lines = [
      ['sessionId', 'name', 'date', 'status', 'checkInCount'].join(','),
      ...sessions.map((s) =>
        [
          s.id,
          String(s.name ?? '').replace(/,/g, ' '),
          s.date ?? '',
          s.status ?? '',
          s._count?.attendances ?? 0,
        ].join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSessionRecordsCsv = () => {
    const lines = [
      ['name', 'type', 'checkInTime', 'method'].join(','),
      ...sessionRecords.map((r) =>
        [
          (r.member?.name ?? r.visitorName ?? '').replace(/,/g, ' '),
          r.memberId ? 'Member' : 'Visitor',
          r.checkInTime ?? '',
          r.method ?? '',
        ].join(','),
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${selectedSession?.id ?? 'export'}-checkins.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLiveCheckin && selectedSession) {
    const currentSession = selectedSession;
    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
        {offlinePending > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium flex justify-between items-center gap-3">
            <span>{offlinePending} check-in(s) queued offline</span>
            <Button type="button" size="sm" variant="outline" onClick={() => void flushOfflineQueue()}>
              Sync now
            </Button>
          </div>
        )}
        <VisitorWorkflowBanner variant="attendance" onModuleChange={onModuleChange} />
        <SubpageHeader
          title="Live attendance"
          subtitle={`Accepting check-ins for ${currentSession.name}`}
          onBack={() => setIsLiveCheckin(false)}
           actions={
             <>
              {currentSession.status === 'OPEN' && (
                <Button 
                  onClick={async () => {
                    if (!confirm('Close this attendance session?')) return;
                    try {
                      await apiRequest(`attendance/sessions/${currentSession.id}`, {
                        method: 'PATCH',
                        body: { status: 'CLOSED' }
                      });
                      loadSessions();
                      setIsLiveCheckin(false);
                    } catch (err) {
                      setAttendanceError(formatApiError(err));
                    }
                  }}
                  variant="outline"
                >
                  <Clock className="w-4 h-4 mr-2" /> Close session
                </Button>
              )}
              <ActionButton
                label="Export session"
                icon={Download}
                variant="secondary"
                onClick={exportSessionRecordsCsv}
              />
              <ActionButton
                label={showQR ? 'Hide kiosk info' : 'Self check-in kiosk'}
                icon={QrCode}
                variant="primary"
                onClick={() => setShowQR(showQR ? null : currentSession.id)}
              />
             </>
           }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-8 space-y-10">
              {showQR && currentSession && (
                <Card className="border-none shadow-2xl rounded-[4rem] bg-slate-950 text-white p-16 text-center space-y-8 animate-in zoom-in-95 duration-500 overflow-hidden relative">
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent"></div>
                   <div className="relative z-10 space-y-6 max-w-lg mx-auto">
                      <div className="w-20 h-20 rounded-[2rem] bg-white/10 flex items-center justify-center mx-auto">
                        <QrCode className="w-10 h-10 text-indigo-300" />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Self check-in kiosk</h2>
                        <p className="text-slate-400 font-medium text-sm leading-relaxed">
                          Members scan to open My Church. Welcome team completes check-in for{' '}
                          <span className="text-white font-semibold">{currentSession.name}</span> using search below.
                        </p>
                      </div>
                      <div className="bg-white rounded-3xl p-6 inline-block">
                        <QRCodeSVG
                          value={`${window.location.origin}/member-login`}
                          size={200}
                          level="M"
                          includeMargin
                        />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Session · {currentSession.name}
                      </p>
                   </div>
                </Card>
              )}

              <Card className="border-none shadow-2xl rounded-[4rem] bg-white overflow-hidden">
                 <CardHeader className="p-12 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/20">
                    <div className="space-y-2">
                       <CardTitle className="text-2xl font-black uppercase tracking-tight">Recent Check-ins</CardTitle>
                       <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Live participant stream</CardDescription>
                    </div>
                     <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                           <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                           <Input 
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                             className="h-14 pl-14 pr-6 rounded-2xl bg-white border-slate-100 shadow-sm font-black uppercase text-[10px] tracking-widest" 
                             placeholder="Search member or visitor..." 
                           />
                        </div>
                        <Button 
                          onClick={() => setCheckinMode(checkinMode === 'visitor' ? 'default' : 'visitor')}
                          variant="ghost" 
                          className="h-14 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100"
                        >
                          {checkinMode === 'visitor' ? 'Switch to Member' : 'Add Visitor'}
                        </Button>
                     </div>

                     {/* Quick Check-in Results / Form */}
                     <div className="mt-6">
                        {searchTerm.length > 2 && checkinMode !== 'visitor' && (
                          <div className="bg-slate-50 rounded-[2rem] p-4 max-h-60 overflow-y-auto space-y-2 border border-slate-100">
                            {members.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
                              <div 
                                key={m.id} 
                                onClick={() => {
                                  handleCheckIn(m.id);
                                  setSearchTerm('');
                                }}
                                className="p-4 min-h-[56px] touch-manipulation bg-white rounded-xl flex items-center justify-between hover:border-indigo-600 border border-transparent cursor-pointer transition-all active:bg-indigo-50"
                              >
                                <span className="font-bold text-slate-900">{m.name}</span>
                                <Plus size={16} className="text-slate-300" />
                              </div>
                            ))}
                          </div>
                        )}

                        {checkinMode === 'visitor' && (
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              const name = String(formData.get('name') ?? '').trim();
                              const phone = String(formData.get('phone') ?? '').trim();
                              handleCheckIn(null, {
                                visitorName: name,
                                visitorPhone: phone || undefined,
                              });
                              setCheckinMode('default');
                            }}
                            className="bg-indigo-50 rounded-[2rem] p-8 space-y-4 animate-in slide-in-from-top-4"
                          >
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">
                              Visitor quick-entry — also queues pastoral follow-up
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                              <Input name="name" placeholder="Visitor Full Name" required className="h-14 bg-white border-none rounded-2xl px-6 font-bold" />
                              <Input name="phone" placeholder="Phone Number" className="h-14 bg-white border-none rounded-2xl px-6 font-bold" />
                            </div>
                            <Button type="submit" disabled={submitting} className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">
                              {submitting ? 'Checking in...' : 'Check-in Visitor'}
                            </Button>
                          </form>
                        )}
                     </div>
                  </CardHeader>
                  <CardContent className="p-0">
                     <div className="divide-y divide-slate-50">
                        {sessionRecords.filter(r => !searchTerm || (r.member?.name || r.visitorName || '').toLowerCase().includes(searchTerm.toLowerCase())).map((record, i) => (
                         <div key={i} className="px-12 py-8 flex items-center justify-between hover:bg-slate-50/50 transition-all group cursor-pointer">
                            <div className="flex items-center gap-6">
                               <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all text-xl shadow-inner border border-slate-50 leading-none">
                                  {(record.member?.name || record.visitorName || '?')[0]}
                               </div>
                               <div>
                                  <p className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight leading-none mb-2">
                                    {record.member?.name || record.visitorName}
                                  </p>
                                  <div className="flex items-center gap-3">
                                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IN AT {new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                     <Badge className="bg-slate-100 text-slate-400 border-none px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">{record.memberId ? 'Member' : 'Visitor'}</Badge>
                                  </div>
                               </div>
                            </div>
                            <div className="flex items-center gap-4">
                               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{record.method}</p>
                               <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                  <CheckCircle2 size={20} />
                               </div>
                            </div>
                         </div>
                       ))}
                       {sessionRecords.length === 0 && (
                         <div className="p-20 text-center space-y-4">
                           <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-200">
                             <Users size={40} />
                           </div>
                           <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No check-ins yet for this session</p>
                         </div>
                       )}
                     </div>
                  </CardContent>
              </Card>
           </div>

           <div className="lg:col-span-4 space-y-10">
              <Card className="border-none shadow-2xl rounded-[4rem] bg-slate-950 text-white p-12 space-y-10 overflow-hidden relative group">
                 <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                 <div className="relative z-10 space-y-8">
                    <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-slate-950">
                       <Monitor size={32} />
                    </div>
                    <div className="space-y-4">
                       <h3 className="text-3xl font-black uppercase tracking-tight leading-none">Session Status</h3>
                       <div className="space-y-6">
                           <div className="space-y-1">
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Participants</p>
                             <p className="text-5xl font-black text-white tracking-tighter">{sessionRecords.length.toLocaleString()}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Visitors</p>
                                <p className="text-2xl font-black text-emerald-400">
                                  {sessionRecords.filter(r => !r.memberId).length}
                                </p>
                             </div>
                             <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Members</p>
                                <p className="text-2xl font-black text-indigo-400">
                                  {sessionRecords.filter(r => r.memberId).length}
                                </p>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      <ModuleHeader
        title="Attendance"
        subtitle="Sessions, check-ins, and headcounts from attendance data for the selected period."
        icon={CalendarCheck}
        actions={
          <>
            <ActionButton label="Export sessions" icon={Download} variant="secondary" onClick={exportSessionsCsv} />
            <ActionButton 
              label="New session" 
              icon={PlusCircle} 
              variant="primary" 
              onClick={openNewSessionModal}
            />
          </>
        }
      />
      {attendanceError && <FeedbackBanner tone="error">{attendanceError}</FeedbackBanner>}
      {linkedEventId && !isLiveCheckin && (
        <FeedbackBanner tone="info">
          New sessions will link to the current event. To create a standalone session, use New session and confirm when prompted.
        </FeedbackBanner>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          label="Total attendances"
          value={metrics.totalAttendances?.toLocaleString?.() ?? metrics.totalAttendances ?? 0}
          icon={Users}
        />
        <StatCard
          label="Active members (30d)"
          value={metrics.activeMembers30d ?? 0}
          icon={TrendingUp}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          label="Open sessions"
          value={sessions.filter((s) => s.status === 'OPEN').length}
          icon={CalendarCheck}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <ChartSection
            title="Attendance trend"
            subtitle="Recent velocity from attendance metrics"
          >
            <ChurchAreaChart
              data={
                sessions.length > 0
                  ? metrics.recentVelocity.map((v: { date: string; count: number }) => ({
                      day: new Date(v.date).toLocaleDateString(undefined, { weekday: 'short' }),
                      count: v.count,
                    }))
                  : [{ day: 'Sun', count: 0 }]
              }
              xKey="day"
              dataKey="count"
              color={settings.branding.primaryColor}
              gradientId="attendanceTrend"
            />
          </ChartSection>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
           <Card className={cn(ds.card, ds.cardPadding)}>
              <div className="space-y-4">
                 <div className="space-y-1">
                    <p className={ds.kpiLabel}>Avg. per session</p>
                    <p className={ds.kpiValue}>
                        {sessions.length > 0 
                          ? Math.round(sessions.reduce((sum, s) => sum + (s._count?.attendances || 0), 0) / sessions.length).toLocaleString()
                          : '0'
                        }
                    </p>
                 </div>
                 <div className="grid grid-cols-1 gap-3 pt-2">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                       <div>
                          <p className={ds.kpiLabel}>Member check-ins</p>
                          <p className="text-lg font-black text-emerald-600">{metrics.memberParticipation ?? 0}</p>
                       </div>
                       <Users className="w-5 h-5 text-emerald-500/60" />
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                       <div>
                          <p className={ds.kpiLabel}>Visitor check-ins</p>
                          <p className="text-lg font-black text-slate-800">{metrics.visitorConversion ?? 0}</p>
                       </div>
                       <CalendarCheck className="w-5 h-5 text-slate-400" />
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between px-2 border-b border-slate-100 pb-6">
           <div>
             <h2 className={ds.sectionTitle}>Session history</h2>
             <p className="text-sm text-slate-500 font-medium mt-1">Click any session below to open check-in</p>
           </div>
           <Button variant="outline" className="text-[10px] font-black uppercase tracking-widest" onClick={openNewSessionModal}>
             <PlusCircle className="w-4 h-4 mr-2" /> New session
           </Button>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           {sessions.map((session) => (
             <Card 
               key={session.id} 
               role="button"
               tabIndex={0}
               aria-label={`Open check-in for ${session.name}`}
               onClick={() => openSessionCheckIn(session)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' || e.key === ' ') {
                   e.preventDefault();
                   openSessionCheckIn(session);
                 }
               }}
               className={cn(ds.card, 'group cursor-pointer overflow-hidden transition-all hover:shadow-md hover:border-indigo-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-[0.99]')}
             >
               <CardContent className="p-0">
                 <div className="flex h-40">
                    <div className={cn(
                      "w-4 h-full transition-all group-hover:w-6",
                      session.status === 'OPEN' ? "bg-rose-500" : session.status === 'CLOSED' ? "bg-amber-400" : "bg-slate-100"
                    )}></div>
                    <div className="flex-1 p-10 flex justify-between items-center">
                       <div className="space-y-3">
                          <div className="flex items-center gap-3">
                             <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{session.campus?.name || 'All Campuses'} &bull; {new Date(session.date).toLocaleDateString()}</p>
                             {session.status === 'OPEN' && <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>}
                          </div>
                          <h3 className="text-lg font-black text-slate-900 group-hover:text-brand-primary transition-colors leading-tight">{session.name}</h3>
                          <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                            Click to check in →
                          </p>
                          <div className="flex items-center gap-4 pt-1">
                             <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-slate-300" />
                                <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest">{session._count?.attendances || 0} Checked-in</span>
                             </div>
                          </div>
                       </div>
                       <div className="w-14 h-14 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner group-hover:rotate-12">
                          <ArrowRight className="w-7 h-7" />
                       </div>
                    </div>
                 </div>
               </CardContent>
             </Card>
           ))}
           {sessions.length === 0 && (
             <div className={cn('md:col-span-2 p-12 text-center border border-dashed border-slate-200 rounded-2xl', ds.card)}>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No service sessions recorded yet</p>
             </div>
           )}
         </div>
      </div>

      {showNewSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="new-session-title">
          <Card className="w-full max-w-md rounded-3xl border-none shadow-2xl">
            <CardHeader>
              <CardTitle id="new-session-title" className="text-xl font-black">New check-in session</CardTitle>
              <CardDescription>
                {linkedEventId
                  ? 'This session will link to your current event automatically.'
                  : 'Name your session, then start checking people in.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="session-name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Session name</label>
                <Input
                  id="session-name"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="Sunday morning service"
                  autoFocus
                />
              </div>
              {!linkedEventId && (
                <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newSessionStandalone}
                    onChange={(e) => setNewSessionStandalone(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-slate-600">
                    Create a standalone session with no event link. Open Attendance from Events or Sunday Service to link automatically.
                  </span>
                </label>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowNewSessionModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1 bg-indigo-600"
                  disabled={creatingSession || !newSessionName.trim() || (!linkedEventId && !newSessionStandalone)}
                  onClick={() => void createSession()}
                >
                  {creatingSession ? 'Creating…' : 'Start session'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageLayout>
  );
}
