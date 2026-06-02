import * as React from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { useSettings } from '@/context/SettingsContext';
import { ModuleHeader, ActionButton } from '@/components/modules/ModuleHeader';
import {
  enqueueOfflineCheckIn,
  getOfflineQueue,
  removeOfflineIds,
} from '@/lib/offlineAttendanceQueue';
import { ApiError } from '@/lib/apiClient';

export function AttendanceModule() {
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

  const loadSessions = React.useCallback(async () => {
    try {
      setAttendanceError(null);
      const res = await apiRequest<any>('attendance/sessions');
      setSessions(parseApiResponse(res) || []);
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

  /** Deep link from Events: open a specific session in the live portal */
  React.useEffect(() => {
    if (sessions.length === 0) return;
    const sid = sessionStorage.getItem('ucos_open_attendance_session_id');
    if (!sid) return;
    sessionStorage.removeItem('ucos_open_attendance_session_id');
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

  const handleCheckIn = async (memberId: string | null, visitorData?: any) => {
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
      loadRecords(selectedSession.id);
      loadSessions(); // Update counts
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
        <div className="flex items-center justify-between border-b border-slate-100 pb-8">
           <div className="flex items-center gap-6">
              <Button variant="ghost" size="icon" onClick={() => setIsLiveCheckin(false)} className="rounded-full h-12 w-12 bg-slate-100">
                <ArrowLeft className="w-5 h-5 text-slate-900" />
              </Button>
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Live Attendance Portal</h1>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Accepting check-ins for {currentSession.name}</p>
              </div>
           </div>
           <div className="flex gap-3">
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
                  className="h-14 px-8 rounded-2xl bg-amber-500 text-white font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-amber-600"
                >
                  <Clock className="w-4 h-4 mr-2" /> Close Session
                </Button>
              )}
              <Button onClick={() => setShowQR(showQR ? null : currentSession.id)} className="h-14 px-8 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl">
                <QrCode className="w-4 h-4 mr-2" /> {showQR ? 'Hide Kiosk Mode' : 'Open Kiosk Mode'}
              </Button>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-8 space-y-10">
              {showQR && (
                <Card className="border-none shadow-2xl rounded-[4rem] bg-slate-950 text-white p-20 text-center space-y-10 animate-in zoom-in-95 duration-500 overflow-hidden relative">
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent"></div>
                   <div className="relative z-10 space-y-6">
                      <div className="space-y-2">
                        <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">Scan to Check-in</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">
                          Demo QR payload only — not a live public check-in URL until a member app is deployed.
                        </p>
                      </div>
                      <div className="w-72 h-72 bg-white rounded-[3rem] mx-auto p-10 shadow-2xl flex items-center justify-center">
                         <QRCodeSVG value={`https://example.invalid/checkin/${showQR}`} size={220} className="rounded-2xl" />
                      </div>
                      <div className="pt-4 flex justify-center gap-4">
                         <Badge className="bg-white/10 text-white border-white/10 px-6 py-2 font-black uppercase tracking-widest text-[10px]">Session Active</Badge>
                      </div>
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
                              handleCheckIn(null, {
                                visitorName: formData.get('name'),
                                visitorPhone: formData.get('phone')
                              });
                              setCheckinMode('default');
                            }}
                            className="bg-indigo-50 rounded-[2rem] p-8 space-y-4 animate-in slide-in-from-top-4"
                          >
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest ml-1">Visitor Quick-Entry</p>
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
                    <Button
                      type="button"
                      disabled
                      title="Staff blast notifications are not wired to a provider in this build."
                      className="w-full h-16 bg-white/40 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] border border-white/20 cursor-not-allowed"
                    >
                      Notify All Staff (not connected)
                    </Button>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-left pb-20">
      <ModuleHeader
        title="Attendance"
        subtitle="Sessions, check-ins, and headcounts from attendance data for the selected period."
        status="live"
        icon={CalendarCheck}
        actions={
          <>
            <ActionButton label="Export records" icon={Download} variant="secondary" />
            <ActionButton 
              label="Open Live Portal" 
              icon={PlusCircle} 
              variant="primary" 
              onClick={async () => {
                const name = prompt('Session Name:', `Service - ${new Date().toLocaleDateString()}`);
                if (!name) return;
                try {
                  const res = await apiRequest<any>('attendance/sessions', {
                    method: 'POST',
                    body: { name, type: 'SERVICE', status: 'OPEN' }
                  });
                  const session = parseApiResponse(res);
                  setSelectedSession(session);
                  setIsLiveCheckin(true);
                  loadSessions();
                } catch (e) {
                  setAttendanceError(formatApiError(e));
                }
              }} 
              className="bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100/50" 
            />
          </>
        }
      />
      {attendanceError && (
        <div className="mt-4 mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 font-bold text-sm">
          {attendanceError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
           <Card className="border-none shadow-2xl rounded-[4rem] bg-white overflow-hidden">
              <CardHeader className="p-12 border-b border-slate-50 flex flex-row items-center justify-between">
                 <div className="space-y-2">
                    <CardTitle className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">Attendance trend</CardTitle>
                    <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">From attendance/metrics when sessions exist; otherwise flat zeros.</CardDescription>
                 </div>
                 <div className="w-14 h-14 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-inner">
                    <TrendingUp size={24} />
                 </div>
              </CardHeader>
              <CardContent className="p-12">
                 <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sessions.length > 0 ? metrics.recentVelocity.map((v: any) => ({ 
                         day: new Date(v.date).toLocaleDateString(undefined, { weekday: 'short' }), 
                         count: v.count 
                       })) : [
                         { day: 'Sun', count: 0 },
                       ]}>
                          <defs>
                             <linearGradient id="colorAttend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={settings.branding.primaryColor} stopOpacity={0.15} />
                                <stop offset="95%" stopColor={settings.branding.primaryColor} stopOpacity={0} />
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                          <Tooltip contentStyle={{ borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: 'none' }} />
                          <Area type="monotone" dataKey="count" stroke={settings.branding.primaryColor} strokeWidth={6} fill="url(#colorAttend)" dot={{ r: 6, strokeWidth: 3, fill: 'white', stroke: settings.branding.primaryColor }} />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </CardContent>
           </Card>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-10">
           <Card className="border-none shadow-2xl rounded-[4rem] bg-slate-950 text-white p-12 space-y-12 flex-1 relative overflow-hidden group">
              <div className="absolute top-[-40px] right-[-40px] w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
              <div className="relative z-10 space-y-10">
                 <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Participations</p>
                    <h3 className="text-6xl font-black text-white tracking-tighter leading-none">
                        {sessions.length > 0 
                          ? Math.round(sessions.reduce((sum, s) => sum + (s._count?.attendances || 0), 0) / sessions.length).toLocaleString()
                          : '0'
                        }
                    </h3>
                 </div>
                 <div className="space-y-6">
                    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex justify-between items-center group-hover:bg-white/10 transition-all">
                       <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Members (30d)</p>
                          <p className="text-2xl font-black text-emerald-400">42</p>
                       </div>
                       <Users className="w-6 h-6 text-emerald-500/50" />
                    </div>
                    <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex justify-between items-center group-hover:bg-white/10 transition-all">
                       <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Visitors</p>
                          <p className="text-2xl font-black text-rose-400">4.2%</p>
                       </div>
                       <CalendarCheck className="w-6 h-6 text-rose-500/50" />
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between px-2 border-b border-slate-100 pb-6">
           <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Recent Service Sessions</h2>
           <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50">View History Archive</Button>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           {sessions.map((session, i) => (
             <Card 
               key={i} 
               onClick={() => {
                 setSelectedSession(session);
                 setIsLiveCheckin(true);
               }}
               className="border-none shadow-2xl group hover:translate-y-[-8px] cursor-pointer overflow-hidden transition-all active:scale-[0.98] rounded-[3rem] bg-white relative"
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
                          <h3 className="text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tighter leading-none uppercase">{session.name}</h3>
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
             <div className="md:col-span-2 p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No service sessions recorded yet</p>
             </div>
           )}
         </div>
      </div>
    </div>
  );
}
