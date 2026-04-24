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
  ArrowUpRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { cn } from '@/src/lib/utils';

const SESSIONS = [
  { id: '1', name: 'Sunday Morning (9:00 AM)', date: 'Today', count: 842, growth: '+5%', campus: 'Downtown', status: 'Live' },
  { id: '2', name: 'Sunday Morning (11:00 AM)', date: 'Today', count: 1250, growth: '+2%', campus: 'Downtown', status: 'Upcoming' },
  { id: '3', name: 'Westside Gathering', date: 'Today', count: 420, growth: '-3%', campus: 'Westside', status: 'Past' },
  { id: '4', name: 'Youth Night', date: 'Yesterday', count: 184, growth: '+12%', campus: 'Downtown', status: 'Past' },
];

const ATTENDEES = [
  { name: 'Sarah Jenkins', time: '8:45 AM', method: 'Mobile App', type: 'Member' },
  { name: 'Michael Miller', time: '8:50 AM', method: 'Kiosk', type: 'Member' },
  { name: 'John Doe', time: '8:55 AM', method: 'Manual', type: 'Visitor' },
  { name: 'Emily White', time: '9:02 AM', method: 'Mobile App', type: 'Regular' },
];

export function AttendanceModule() {
  const [selectedSession, setSelectedSession] = React.useState<any | null>(null);
  const [isLiveCheckin, setIsLiveCheckin] = React.useState(false);
  const [showQR, setShowQR] = React.useState<string | null>(null);
  const [checkinMode, setCheckinMode] = React.useState<'default' | 'staff' | 'visitor'>('default');
  const [dutyReason, setDutyReason] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState('Lead Usher');
  const [attendanceRecords, setAttendanceRecords] = React.useState<any[]>([]);
  const [sessions, setSessions] = React.useState(SESSIONS);

  const fetchAttendance = React.useCallback(async () => {
    try {
      const res = await fetch('/api/attendance');
      const data = await res.json();
      setAttendanceRecords(data);
      
      // Update session counts if we have real data
      if (data.length > 0) {
        const total = data.reduce((sum: number, r: any) => sum + r.count, 0);
        const avg = Math.round(total / data.length);
        console.log('Attendance Hydrated:', avg);
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    }
  }, []);

  React.useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const handleManualCheckIn = async (count: number = 1) => {
    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_name: selectedSession?.name || 'Manual Entry',
          count: count,
          campus: selectedSession?.campus || 'Downtown'
        })
      });
      fetchAttendance();
    } catch (err) {
      console.error('Check-in failed:', err);
    }
  };

  if (isLiveCheckin) {
    const currentSession = selectedSession || SESSIONS[0];
    
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setIsLiveCheckin(false)} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Live Intake Portal</h1>
                <p className="text-sm text-slate-500 font-medium tracking-tight">Managing current service check-ins live.</p>
              </div>
           </div>
           <div className="flex gap-2">
              <Button 
                onClick={() => setCheckinMode(checkinMode === 'staff' ? 'default' : 'staff')} 
                variant={checkinMode === 'staff' ? 'default' : 'outline'} 
                className={cn(
                  "rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-4",
                  checkinMode === 'staff' ? "bg-indigo-600 text-white" : "text-slate-600 border-slate-200"
                )}
              >
                Staff Mode
              </Button>
              <Button onClick={() => setShowQR(showQR ? null : currentSession.id)} variant="outline" className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 h-10 border-slate-200 text-slate-600">
                <QrCode className="w-4 h-4" /> {showQR ? 'Hide Kiosk' : 'Show Kiosk'}
              </Button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="md:col-span-2 space-y-6">
              {showQR && (
                <Card className="rounded-[2.5rem] border-none bg-slate-950 text-white p-12 text-center space-y-8 animate-in zoom-in-95 duration-300 relative overflow-hidden shadow-2xl">
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent"></div>
                   <div className="relative z-10 space-y-4">
                      <div className="space-y-2">
                        <h2 className="text-4xl font-black tracking-tighter uppercase">Self Check-in</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Scan to participate in {currentSession.name}</p>
                      </div>
                      <div className="w-64 h-64 bg-white rounded-[2rem] mx-auto p-6 shadow-[0_0_50px_rgba(99,102,241,0.3)] flex items-center justify-center">
                         <QRCodeSVG value={`https://gracecommunity.app/checkin/${showQR}`} size={220} className="rounded-xl" />
                      </div>
                      <div className="pt-4">
                         <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 px-4 py-2 font-black uppercase tracking-[0.2em] text-[9px]">Session ID: #{currentSession.id}-{new Date().getFullYear()}</Badge>
                      </div>
                   </div>
                </Card>
              )}

              <Card className="rounded-[2.5rem] border-none shadow-xl p-8 space-y-8 bg-white overflow-hidden relative">
                 <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                       <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] leading-none">Activity Feed</h3>
                    </div>
                    {checkinMode === 'staff' && (
                       <Badge className="bg-rose-50 text-rose-600 border-none px-4 py-1.5 font-black uppercase tracking-widest text-[9px] shadow-sm">STAFF OVERRIDE ACTIVE</Badge>
                    )}
                 </div>

                 {checkinMode === 'staff' && (
                   <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 animate-in slide-in-from-top-4 duration-300">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Staff Check-in Detail</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Role</label>
                            <select 
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value)}
                              className="w-full h-12 bg-white border-none rounded-xl px-4 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-sm appearance-none cursor-pointer"
                            >
                               <option>Lead Usher</option>
                               <option>Production Team</option>
                               <option>Worship Leader</option>
                               <option>Children's Ministry</option>
                               <option>Security/Safety</option>
                               <option>Hospitality</option>
                               <option>Media & Arts</option>
                            </select>
                         </div>
                         <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duty Reason</label>
                            <input 
                              value={dutyReason}
                              onChange={(e) => setDutyReason(e.target.value)}
                              className="w-full h-12 bg-white border-none rounded-xl px-4 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                              placeholder="e.g. Early Setup, Late Shift" 
                            />
                         </div>
                      </div>
                      <div className="pt-2">
                        <Button className="w-full h-10 rounded-xl bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-widest">Add Staff Note & Check-in</Button>
                      </div>
                   </div>
                 )}

                 <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <input className="w-full h-16 bg-slate-50 border-none rounded-[1.5rem] pl-14 pr-6 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner transition-all placeholder:text-slate-300" placeholder="Search by name, ID, or phone number..." />
                 </div>
                 
                 <div className="space-y-4 pt-2">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2">Most Recent Logins</p>
                    <div className="space-y-3">
                       {ATTENDEES.map((person, i) => (
                         <div key={i} className="flex items-center justify-between p-5 bg-white border border-slate-50 rounded-[1.5rem] group hover:border-indigo-100 hover:shadow-lg transition-all cursor-pointer active:scale-[0.99]">
                            <div className="flex items-center gap-4">
                               <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 font-black text-lg group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm border border-slate-100 leading-none">
                                  {person.name[0]}
                               </div>
                               <div>
                                  <p className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight leading-none mb-1.5">{person.name}</p>
                                  <div className="flex items-center gap-3">
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">IN AT {person.time}</p>
                                     <Badge className="h-4 p-0 px-2 text-[8px] font-black uppercase tracking-widest bg-slate-50 text-slate-400 border-none">{person.type}</Badge>
                                  </div>
                               </div>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="text-right">
                                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{person.method}</p>
                               </div>
                               <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                  <CheckCircle2 className="w-5 h-5" />
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </Card>
           </div>

           <div className="space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-xl p-8 space-y-6 bg-slate-900 text-white overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-8 opacity-10"><Smartphone size={80} /></div>
                 <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] leading-none relative z-10">Live Stats Matrix</h3>
                 <div className="space-y-8 relative z-10 pt-4">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Intake</p>
                       <p className="text-5xl font-black tracking-tighter leading-none">1,242</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-1">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Visitors</p>
                          <p className="text-2xl font-black text-emerald-400">24</p>
                       </div>
                       <div className="p-5 rounded-3xl bg-white/5 border border-white/10 space-y-1">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Staff On Duty</p>
                          <p className="text-2xl font-black text-indigo-400">12 / 15</p>
                       </div>
                    </div>
                 </div>
                 <Button className="w-full bg-indigo-600 hover:bg-indigo-500 h-14 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] border-none transition-all active:scale-95 shadow-2xl shadow-indigo-950 text-white relative z-10">Notify All Staff</Button>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-sm p-8 space-y-5 bg-slate-50 text-left">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Service Console</h3>
                 <div className="space-y-4">
                    <div className="flex items-center gap-4 p-5 bg-white rounded-[1.5rem] group cursor-pointer hover:shadow-md transition-all active:scale-95 border-l-4 border-l-transparent hover:border-l-indigo-600">
                       <Smartphone className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                       <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Sync Hardware</span>
                    </div>
                    <div className="flex items-center gap-4 p-5 bg-white rounded-[1.5rem] group cursor-pointer hover:shadow-md transition-all active:scale-95 border-l-4 border-l-transparent hover:border-l-indigo-600">
                       <QrCode className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                       <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Kiosk Manager</span>
                    </div>
                    <div className="flex items-center gap-4 p-5 bg-white rounded-[1.5rem] group cursor-pointer hover:shadow-md transition-all active:scale-95 border-l-4 border-l-transparent hover:border-l-indigo-600">
                       <ArrowUpRight className="w-6 h-6 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                       <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Public Redirect</span>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  if (selectedSession) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 text-left">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedSession(null)} className="gap-2 px-0 hover:bg-transparent hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-5 h-5" /> <span className="font-black uppercase text-[10px] tracking-widest">Back to Dashboard</span>
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl font-black uppercase text-[10px] tracking-widest h-11 border-slate-200">Live Monitor</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-black uppercase text-[10px] tracking-widest h-11 shadow-xl shadow-indigo-100 text-white">Manual Export</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/10 border-b border-slate-100 p-10">
                   <div className="flex justify-between items-start">
                      <div className="space-y-4">
                        <Badge variant="outline" className={cn(
                          "px-4 py-1.5 font-black uppercase tracking-[0.2em] text-[8px] rounded-full",
                          selectedSession.status === 'Live' ? "bg-rose-50 text-rose-600 border-none animate-pulse" : "bg-slate-100 text-slate-500 border-none"
                        )}>
                          {selectedSession.status} Session
                        </Badge>
                        <CardTitle className="text-4xl font-black text-slate-900 tracking-tighter">{selectedSession.name}</CardTitle>
                        <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                          {selectedSession.date} &bull; {selectedSession.campus} Campus &bull; Managed by AI
                        </CardDescription>
                      </div>
                      <div className="text-right space-y-1">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Count</p>
                         <h2 className="text-6xl font-black text-indigo-600 tracking-tighter leading-none">{selectedSession.count}</h2>
                      </div>
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-[10px]">Registry Stream</h3>
                      <div className="relative w-full sm:w-80">
                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                         <Input placeholder="Search records..." className="pl-11 h-12 rounded-2xl bg-slate-50 border-none font-bold text-xs shadow-inner" />
                      </div>
                   </div>
                   <div className="divide-y divide-slate-50">
                      {ATTENDEES.map((person, i) => (
                        <div key={i} className="px-10 py-6 flex items-center justify-between hover:bg-slate-50/50 transition-all group cursor-pointer active:bg-slate-100">
                           <div className="flex items-center gap-6">
                              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-300 border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all text-lg shadow-sm">
                                 {person.name[0]}
                              </div>
                              <div>
                                 <p className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">{person.name}</p>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{person.type} &bull; VIA {person.method}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-10">
                              <span className="text-xs font-black text-slate-300 tracking-widest uppercase">{person.time}</span>
                              <Button variant="ghost" size="icon" className="text-slate-200 hover:text-slate-600 active:scale-90"><MoreVertical className="w-5 h-5" /></Button>
                           </div>
                        </div>
                      ))}
                   </div>
                </CardContent>
              </Card>
           </div>

           <div className="space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-950 text-white overflow-hidden p-8 space-y-8 relative">
                 <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent"></div>
                 <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] relative z-10">Session Analytics</h3>
                 <div className="space-y-8 relative z-10 pt-4">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vs Historical Average</p>
                       <div className="flex items-baseline gap-3">
                         <h3 className="text-5xl font-black tracking-tighter text-emerald-400">+12.4%</h3>
                         <TrendingUp className="w-8 h-8 text-emerald-500" />
                       </div>
                       <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mt-4">
                          <div className="h-full bg-emerald-400 w-full animate-in slide-in-from-left duration-1000 ease-out" />
                       </div>
                    </div>
                    <div className="space-y-2 pt-4 border-t border-white/5">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Integrity Score</p>
                       <h3 className="text-3xl font-black tracking-tighter">98%</h3>
                       <p className="text-[10px] text-slate-500 font-bold leading-relaxed mt-2">Processing latency: <span className="text-indigo-400">1.2s</span> &bull; Packet Loss: <span className="text-indigo-400">0.02%</span></p>
                    </div>
                 </div>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-sm bg-amber-50 relative overflow-hidden p-8 space-y-4">
                 <div className="absolute top-2 right-2"><Clock className="w-6 h-6 text-amber-200" /></div>
                 <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] leading-none mb-2">Sync Alerts</h3>
                 <div className="space-y-1">
                    <p className="text-xs font-black text-amber-800 uppercase tracking-tight">Delayed Cloud Flush</p>
                    <p className="text-[10px] font-bold leading-relaxed text-amber-700/80 italic">"External check-in records from the youth cafe are currently syncing with a 5-minute delay due to local network congestion."</p>
                 </div>
                 <button className="text-[9px] font-black uppercase tracking-widest text-white bg-amber-600 px-4 py-2 rounded-xl mt-2 shadow-lg shadow-amber-200 active:scale-95 transition-all">Force Sync</button>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Intake Intelligence</h1>
          <p className="text-slate-500 font-medium tracking-tight">Real-time participation tracking, growth patterns, and automated absence detection models.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm">
            <Download className="w-4 h-4" />
            Full Audit
          </button>
          <button 
            onClick={() => {
              setSelectedSession(SESSIONS[0]);
              setIsLiveCheckin(true);
            }}
            className="flex items-center gap-3 px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black hover:bg-indigo-700 shadow-[0_10px_30px_rgba(99,102,241,0.2)] transition-all active:scale-95 uppercase tracking-[0.2em] border-none"
          >
            <Plus className="w-5 h-5" />
            Live Portal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-xl h-full rounded-[2.5rem] bg-white overflow-hidden">
           <CardHeader className="flex flex-row items-center justify-between p-10 pb-6">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Velocity Trend</CardTitle>
                <CardDescription className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Participation momentum across all active clusters</CardDescription>
              </div>
              <Badge className="bg-indigo-50 text-indigo-600 border-none px-4 py-1.5 font-black uppercase text-[9px]">Live Data</Badge>
           </CardHeader>
           <CardContent className="p-10 pt-0">
              <div className="h-[300px] mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={attendanceRecords.length > 0 ? attendanceRecords.slice(-7).map(r => ({ 
                    day: new Date(r.date).toLocaleDateString(undefined, { weekday: 'short' }), 
                    count: r.count 
                  })) : [
                    { day: 'Sun', count: 2400 },
                    { day: 'Mon', count: 120 },
                    { day: 'Tue', count: 210 },
                    { day: 'Wed', count: 480 },
                    { day: 'Thu', count: 150 },
                    { day: 'Fri', count: 220 },
                    { day: 'Sat', count: 350 },
                  ]}>
                    <defs>
                      <linearGradient id="colorAttend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#cbd5e1'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#cbd5e1'}} />
                    <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '16px' }} />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={5} fill="url(#colorAttend)" dot={{ r: 6, strokeWidth: 3, fill: 'white', stroke: '#6366f1' }} activeDot={{ r: 8, strokeWidth: 0, fill: '#6366f1' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </CardContent>
        </Card>

        <Card className="border-none shadow-xl h-full rounded-[2.5rem] bg-slate-900 text-white overflow-hidden p-8 space-y-8 relative group">
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent group-hover:from-indigo-500/20 transition-all"></div>
           <CardHeader className="p-0 space-y-1 relative z-10">
              <CardTitle className="text-xl font-black tracking-tight">Key Intake Vectors</CardTitle>
              <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Global performance metrics</CardDescription>
           </CardHeader>
           <CardContent className="space-y-6 pt-2 p-0 relative z-10">
              <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex justify-between items-center group-hover:bg-white/10 transition-all">
                 <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-2">Weekly Average</p>
                    <p className="text-4xl font-black text-indigo-400 leading-none tracking-tighter uppercase font-mono">
                       {attendanceRecords.length > 0 
                         ? Math.round(attendanceRecords.reduce((sum, r) => sum + r.count, 0) / attendanceRecords.length).toLocaleString()
                         : '1,942'
                       }
                    </p>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
                    <TrendingUp className="w-6 h-6" />
                 </div>
              </div>
              <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex justify-between items-center group-hover:bg-white/10 transition-all">
                 <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-2">New Converts</p>
                    <p className="text-4xl font-black text-emerald-400 leading-none tracking-tighter">42</p>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                    <Users className="w-6 h-6" />
                 </div>
              </div>
              <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex justify-between items-center group-hover:bg-white/10 transition-all">
                 <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mb-2">Absence Rate</p>
                    <p className="text-4xl font-black text-rose-400 leading-none tracking-tighter">4.2%</p>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center text-rose-400 shadow-inner">
                    <CalendarCheck className="w-6 h-6" />
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Active Intake Channels</h2>
           <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600">History Audit</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SESSIONS.map((session, i) => (
            <Card 
              key={i} 
              onClick={() => setSelectedSession(session)}
              className="border-none shadow-sm group hover:shadow-2xl cursor-pointer overflow-hidden transition-all active:scale-[0.98] rounded-[2rem] bg-white relative"
            >
              <CardContent className="p-0">
                <div className="flex h-36">
                   <div className={cn(
                     "w-3 h-full transition-all group-hover:w-4",
                     session.status === 'Live' ? "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]" : session.status === 'Upcoming' ? "bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]" : "bg-slate-200"
                   )}></div>
                   <div className="flex-1 p-8 flex justify-between items-center">
                      <div className="space-y-2">
                         <div className="flex items-center gap-3">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{session.campus} &bull; {session.date}</p>
                            {session.status === 'Live' && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>}
                         </div>
                         <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tighter leading-none uppercase">{session.name}</h3>
                         <div className="flex items-center gap-4 pt-1">
                            <div className="flex items-center gap-2">
                               <Users className="w-4 h-4 text-slate-300" />
                               <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{session.count} Participants</span>
                            </div>
                            <Badge className="bg-slate-50 text-emerald-600 border-none shadow-none font-black px-3 py-1 text-[9px] uppercase tracking-widest">{session.growth}</Badge>
                         </div>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner group-hover:rotate-12">
                         <ArrowRight className="w-6 h-6" />
                      </div>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
