import React from 'react';
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
  const [selectedSession, setSelectedSession] = React.useState<typeof SESSIONS[0] | null>(null);
  const [isLiveCheckin, setIsLiveCheckin] = React.useState(false);
  const [showQR, setShowQR] = React.useState(false);

  if (isLiveCheckin) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setIsLiveCheckin(false)} className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-black text-slate-900">Live Intake Portal</h1>
                <p className="text-sm text-slate-500 font-medium">Managing current service check-ins live.</p>
              </div>
           </div>
           <Button onClick={() => setShowQR(!showQR)} variant="outline" className="rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2 h-10">
              <QrCode className="w-4 h-4" /> {showQR ? 'Hide Kiosk QR' : 'Show Kiosk QR'}
           </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="md:col-span-2 space-y-6">
              {showQR && (
                <Card className="rounded-[2.5rem] border-none bg-indigo-600 text-white p-12 text-center space-y-8 animate-in zoom-in-95 duration-300">
                   <div className="space-y-2">
                      <h2 className="text-3xl font-black tracking-tighter">Self Check-in Active</h2>
                      <p className="text-indigo-100 font-medium opacity-80">Scan this code with the Member App to instantly log participation.</p>
                   </div>
                   <div className="w-64 h-64 bg-white rounded-3xl mx-auto p-4 shadow-2xl flex items-center justify-center">
                      <QRCodeSVG value="https://gracecommunity.app/checkin/live" size={220} />
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Session ID: #LIVE-2024-SUNDAY</p>
                </Card>
              )}

              <Card className="rounded-[2.5rem] border-slate-100 shadow-sm p-8 space-y-6">
                 <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">Manual Check-in Lookup</h3>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 font-bold">LIVE FEED ACTIVE</Badge>
                 </div>
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input className="w-full h-14 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner" placeholder="Search by name, ID, or phone number..." />
                 </div>
                 
                 <div className="space-y-4">
                    {ATTENDEES.map((person, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-50 rounded-2xl group hover:border-indigo-100 transition-all cursor-pointer">
                         <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200">
                               {person.name[0]}
                            </div>
                            <div>
                               <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{person.name}</p>
                               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Checked in {person.time}</p>
                            </div>
                         </div>
                         <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="w-4 h-4" />
                         </div>
                      </div>
                    ))}
                 </div>
              </Card>
           </div>

           <div className="space-y-6">
              <Card className="rounded-[2rem] border-slate-100 shadow-sm p-8 space-y-6 bg-slate-900 text-white border-none">
                 <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Live Service Stats</h3>
                 <div className="space-y-6">
                    <div className="space-y-1">
                       <p className="text-xs font-bold text-slate-400 uppercase">Current Count</p>
                       <p className="text-4xl font-black tracking-tighter">1,242</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-xs font-bold text-slate-400 uppercase">First Time Visitors</p>
                       <p className="text-2xl font-black">24</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-xs font-bold text-slate-400 uppercase">Staff Presence</p>
                       <p className="text-2xl font-black">12 / 15</p>
                    </div>
                 </div>
                 <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-none transition-all active:scale-95 shadow-xl shadow-indigo-900">Push App Reminder</Button>
              </Card>

              <Card className="rounded-[2rem] border-slate-100 shadow-sm p-8 space-y-4 bg-slate-50 border-none">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Scanning Hardware</h3>
                 <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 group cursor-pointer hover:border-indigo-400 transition-all">
                    <Smartphone className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    <span className="text-xs font-bold text-slate-700 uppercase">Link External Scanner</span>
                 </div>
                 <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 group cursor-pointer hover:border-indigo-400 transition-all">
                    <QrCode className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    <span className="text-xs font-bold text-slate-700 uppercase">Toggle Kiosk Mode</span>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  if (selectedSession) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedSession(null)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Overview
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">Live Monitor</Button>
            <Button className="bg-indigo-600">Print Check-in List</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                   <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Badge variant="outline" className={cn(
                          "mb-2 font-bold",
                          selectedSession.status === 'Live' ? "bg-red-50 text-red-600 border-red-100 animate-pulse" : "bg-slate-100 text-slate-500"
                        )}>
                          {selectedSession.status} Session
                        </Badge>
                        <CardTitle className="text-3xl font-black text-slate-900">{selectedSession.name}</CardTitle>
                        <CardDescription className="text-slate-500 font-medium">
                          {selectedSession.date} • {selectedSession.campus} Campus
                        </CardDescription>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attendance</p>
                         <h2 className="text-4xl font-black text-indigo-600 leading-none">{selectedSession.count}</h2>
                      </div>
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800">Recent Check-ins</h3>
                      <div className="relative w-64">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                         <Input placeholder="Search attendees..." className="pl-10 h-9 rounded-xl" />
                      </div>
                   </div>
                   <div className="divide-y divide-slate-50">
                      {ATTENDEES.map((person, i) => (
                        <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 border border-slate-200">
                                 {person.name[0]}
                              </div>
                              <div>
                                 <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{person.name}</p>
                                 <p className="text-xs text-slate-500">{person.type} • via {person.method}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-8">
                              <span className="text-sm font-semibold text-slate-400 tracking-tight">{person.time}</span>
                              <Button variant="ghost" size="icon" className="text-slate-300 hover:text-slate-600"><MoreVertical className="w-4 h-4" /></Button>
                           </div>
                        </div>
                      ))}
                   </div>
                </CardContent>
              </Card>
           </div>

           <div className="space-y-6">
              <Card className="rounded-3xl border-slate-100 shadow-sm bg-indigo-900 text-white overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-300" />
                    Session Comparisons
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Vs Last Week</p>
                      <h3 className="text-2xl font-bold">+12.4%</h3>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-2">
                         <div className="h-full bg-emerald-400 w-full animate-in slide-in-from-left duration-1000 ease-out" />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Kiosk Efficiency</p>
                      <h3 className="text-2xl font-bold">98%</h3>
                      <p className="text-xs text-indigo-200">Processing 42 people per minute at Downtown Hub.</p>
                   </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-100 shadow-sm">
                 <CardHeader className="py-4 border-b border-slate-50">
                    <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Session Alerts</CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                    <div className="p-4 flex items-start gap-4 text-amber-700 bg-amber-50">
                       <Clock className="w-5 h-5 shrink-0" />
                       <div className="space-y-1">
                          <p className="text-xs font-bold uppercase">Delayed Sync</p>
                          <p className="text-[10px] font-medium leading-relaxed">External check-in records from the youth cafe are currently syncing with a 5-minute delay.</p>
                       </div>
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Attendance Intelligence</h1>
          <p className="text-slate-500">Real-time participation tracking, growth patterns, and absence detection.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest">
            <Download className="w-4 h-4" />
            Download Full Report
          </button>
          <button 
            onClick={() => setIsLiveCheckin(true)}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase tracking-widest border-none"
          >
            <Plus className="w-4 h-4" />
            Launch Live Check-in
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm h-full">
           <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">Weekly Attendance Trend</CardTitle>
                <CardDescription>Daily participation across all activities</CardDescription>
              </div>
           </CardHeader>
           <CardContent>
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
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
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} fill="url(#colorAttend)" dot={{ r: 4, strokeWidth: 2, fill: 'white' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </CardContent>
        </Card>

        <Card className="border-none shadow-sm h-full">
           <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-800">Key Metrics</CardTitle>
           </CardHeader>
           <CardContent className="space-y-6 pt-2">
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex justify-between items-center">
                 <div>
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest leading-none mb-1.5">Weekly Average</p>
                    <p className="text-2xl font-bold text-indigo-700">1,942</p>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <TrendingUp className="w-5 h-5" />
                 </div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex justify-between items-center">
                 <div>
                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest leading-none mb-1.5">First Timers</p>
                    <p className="text-2xl font-bold text-emerald-700">42</p>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Users className="w-5 h-5" />
                 </div>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex justify-between items-center">
                 <div>
                    <p className="text-xs font-bold text-rose-400 uppercase tracking-widest leading-none mb-1.5">Recent Absences</p>
                    <p className="text-2xl font-bold text-rose-700">12</p>
                 </div>
                 <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                    <CalendarCheck className="w-5 h-5" />
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Active Sessions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SESSIONS.map((session, i) => (
            <Card 
              key={i} 
              onClick={() => setSelectedSession(session)}
              className="border-none shadow-sm group hover:ring-2 hover:ring-indigo-500/10 cursor-pointer overflow-hidden transition-all active:scale-[0.98]"
            >
              <CardContent className="p-0">
                <div className="flex h-32">
                   <div className={cn(
                     "w-2 h-full",
                     session.status === 'Live' ? "bg-red-500" : session.status === 'Upcoming' ? "bg-amber-400" : "bg-slate-300"
                   )}></div>
                   <div className="flex-1 p-6 flex justify-between items-center">
                      <div className="space-y-1">
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{session.campus} • {session.date}</p>
                         <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{session.name}</h3>
                         <div className="flex items-center gap-1.5 pt-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-sm font-semibold text-slate-600">{session.count} Attendees</span>
                            <Badge className="ml-2 bg-emerald-50 text-emerald-600 border-none shadow-none hover:bg-emerald-50">{session.growth}</Badge>
                         </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
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
