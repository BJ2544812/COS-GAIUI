import * as React from 'react';
import { 
  MapPin, 
  Heart, 
  MessageSquare, 
  Send, 
  Plus, 
  Mail, 
  Phone, 
  ArrowRight,
  TrendingUp,
  Globe,
  Bell,
  Users,
  ArrowLeft,
  Settings,
  MoreVertical,
  Activity,
  UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';

export function OutreachModule() {
  const [selectedProject, setSelectedProject] = React.useState<any>(null);
  const [isAdding, setIsAdding] = React.useState(false);
  const [contacts, setContacts] = React.useState<{ name: string; source: string; time: string }[]>([]);
  const [outreachError, setOutreachError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setOutreachError(null);
        const json = await apiRequest<unknown>('outreach', { method: 'GET' });
        const list = parseApiResponse<{ name: string; source?: string | null; createdAt: string; status: string }[]>(json);
        if (cancelled) return;
        if (!list.length) {
          if (!cancelled) setContacts([]);
          return;
        }
        setContacts(
          list.map((c) => ({
            name: c.name,
            source: c.source || c.status,
            time: new Date(c.createdAt).toLocaleString(),
          }))
        );
      } catch (e) {
        if (!cancelled) setOutreachError(formatApiError(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isAdding) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)} className="rounded-full">
            <Plus className="w-5 h-5 rotate-45" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Launch New Outreach Mission</h1>
            <p className="text-sm text-slate-500 font-medium tracking-tight">Define goals, locations, and resource requirements for a new impact project.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="md:col-span-2 space-y-6">
              <Card className="rounded-[2.5rem] border-slate-100 shadow-sm p-8 space-y-8">
                 <div className="space-y-4">
                    <h3 className="text-sm font-black border-b border-slate-50 pb-2 text-slate-800">Mission Overview</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Project Name</label>
                          <input className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. Winter Clothing Drive" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Primary Location</label>
                          <input className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. City Central Square" />
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mission Objective</label>
                       <textarea className="w-full h-24 bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none shadow-inner" placeholder="What is the spiritual or physical goal of this outreach?" />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-sm font-black border-b border-slate-50 pb-2 text-slate-800">Resource Planning</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Target Budget</label>
                          <input className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="₹ / $" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Volunteer Needs</label>
                          <input className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Max capacity" type="number" />
                       </div>
                    </div>
                 </div>

                 <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-100">Activate Mission Pipeline</Button>
              </Card>
           </div>

           <div className="space-y-6">
              <Card className="rounded-3xl border-none bg-indigo-950 text-white p-8 relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 p-4 opacity-10"><Globe size={160} /></div>
                 <div className="relative z-10 space-y-6 text-center">
                    <div className="w-16 h-16 rounded-[1.25rem] bg-white/10 flex items-center justify-center mx-auto border border-white/5 shadow-inner">
                       <TrendingUp className="text-indigo-400" size={32} />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-xl font-black italic tracking-tighter">Impact Analytics</h3>
                       <p className="text-xs text-indigo-300/80 font-medium leading-relaxed">Once activated, missions are tracked in real-time. Impact scores are generated based on field check-ins and conversion logs.</p>
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-3">
                       <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                          <span className="text-indigo-500">Projected Reach</span>
                          <span className="text-indigo-200">Pending</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                          <span className="text-indigo-500">Resource Yield</span>
                          <span className="text-indigo-200">Pending</span>
                       </div>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedProject(null)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Outreach
          </Button>
          <div className="flex gap-2">
            <Button variant="outline"><Settings className="w-4 h-4 mr-2" /> Logistics Setup</Button>
            <Button className="bg-indigo-600"><Plus className="w-4 h-4 mr-2" /> New Field Log</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white">
                 <div className="h-48 bg-slate-900 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-600/20 mix-blend-overlay"></div>
                    <div className="z-10 text-center space-y-4">
                       <MapPin className="w-12 h-12 text-indigo-400 mx-auto" />
                       <h2 className="text-3xl font-black text-white uppercase tracking-tight">{selectedProject.name}</h2>
                    </div>
                 </div>
                 <CardContent className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-slate-50">
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Impact Reach</p>
                       <p className="text-xl font-black text-slate-900 leading-none">{selectedProject.impact}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                       <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold">{selectedProject.status}</Badge>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Core Team</p>
                       <p className="text-xl font-black text-slate-900 leading-none">12 Pax</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Active Since</p>
                       <p className="text-xl font-black text-slate-900 leading-none">6 Months</p>
                    </div>
                 </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                 <CardHeader className="py-5 border-b border-slate-50 bg-slate-50/20 flex flex-row items-center justify-between px-8">
                    <CardTitle className="text-lg font-bold">Field Deployment Log</CardTitle>
                    <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Export Logs</button>
                 </CardHeader>
                 <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                       {[
                         { user: 'Officer Dan', event: 'Supplies Delivered', time: '10 mins ago', type: 'Logistics' },
                         { user: 'Admin Sarah', event: 'Medical Camp Setup', time: '2 hours ago', type: 'Clinical' },
                         { user: 'Outreach Team', event: '42 New Conversions', time: 'Yesterday', type: 'Impact' },
                         { user: 'Transport Lead', event: 'Vans Return to Base', time: '2 days ago', type: 'Logistics' },
                       ].map((log, i) => (
                         <div key={i} className="px-8 py-5 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                  <Activity className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                               </div>
                               <div>
                                  <p className="font-bold text-slate-800">{log.event}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.user}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{log.time}</p>
                               <Badge variant="ghost" className="p-0 text-indigo-500 font-bold uppercase tracking-tight text-[9px]">{log.type}</Badge>
                            </div>
                         </div>
                       ))}
                    </div>
                 </CardContent>
              </Card>
           </div>

           <div className="space-y-6">
              <Card className="rounded-3xl border-slate-100 shadow-sm p-6 bg-slate-900 text-white space-y-6 overflow-hidden relative">
                 <div className="absolute -right-4 -top-4 opacity-5"><TrendingUp size={120} /></div>
                 <div className="space-y-1">
                    <h3 className="text-lg font-black uppercase tracking-tight">Project Impact Score</h3>
                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Statistical Analysis Engine</p>
                 </div>
                 <h2 className="text-5xl font-black">94<span className="text-lg text-slate-500 ml-1">/100</span></h2>
                 <p className="text-xs text-slate-400 italic">"This project is currently the highest performing outreach initiative in the West Sector."</p>
                 <Button className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-900/50">Recruit Volunteers</Button>
              </Card>

              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                 <CardHeader className="py-4 border-b border-slate-50 bg-slate-100/30">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Team Allocation</CardTitle>
                 </CardHeader>
                 <CardContent className="p-6 space-y-4">
                    {[
                      { role: 'Field Officers', count: 8, color: 'bg-indigo-500' },
                      { role: 'Medical Staff', count: 4, color: 'bg-emerald-500' },
                      { role: 'Logistics', count: 3, color: 'bg-amber-500' },
                    ].map((role, i) => (
                      <div key={i} className="flex justify-between items-center group cursor-pointer">
                         <div className="flex items-center gap-3">
                            <div className={cn("w-2 h-2 rounded-full", role.color)} />
                            <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{role.role}</span>
                         </div>
                         <p className="text-xs font-black text-slate-900">{role.count}</p>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-slate-50">
                       <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-indigo-600 gap-2 h-10">
                          <UserPlus className="w-3.5 h-3.5" /> Assign Personnel
                       </Button>
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Outreach & Communications</h1>
          <p className="text-slate-500">Coordinate missions, track field data, and manage multi-channel engagement.</p>
          {outreachError && <p className="text-sm text-rose-600 font-medium mt-1">{outreachError}</p>}
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all active:scale-95 leading-none"
          >
            <Plus className="w-4 h-4" />
            New Mission
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm overflow-hidden bg-white">
               <CardHeader className="py-5 border-b border-slate-50 bg-slate-50/20 px-6">
                  <CardTitle className="text-lg font-bold text-slate-800">Active Missions Projects</CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="divide-y divide-slate-50">
                     {[
                       { name: 'City Relief Effort', location: 'Downtown', impact: '1.2k Reached', status: 'Active', color: 'indigo' },
                       { name: 'Rural Medical Camp', location: 'East Province', impact: '420 Treated', status: 'Planning', color: 'emerald' },
                       { name: 'Digital Alpha Outreach', location: 'Global / Online', impact: '856 Active', status: 'Active', color: 'blue' },
                     ].map((proj, i) => (
                       <div 
                        key={i} 
                        onClick={() => setSelectedProject(proj)}
                        className="p-6 flex justify-between items-center hover:bg-slate-50 transition-all group cursor-pointer active:bg-slate-100"
                      >
                           <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl bg-${proj.color}-50 flex items-center justify-center text-${proj.color}-600 group-hover:scale-110 transition-transform shadow-sm`}>
                                 <MapPin size={24} />
                              </div>
                              <div>
                                 <h4 className="font-bold text-slate-800 uppercase tracking-tight text-lg leading-tight group-hover:text-indigo-600 transition-colors">{proj.name}</h4>
                                 <p className="text-xs text-slate-400 flex items-center gap-1 font-medium italic"><Globe size={12} /> {proj.location}</p>
                              </div>
                           </div>
                           <div className="text-right space-y-1">
                              <p className="text-sm font-black text-slate-900 uppercase tracking-widest">{proj.impact}</p>
                              <Badge className={cn("text-[9px] uppercase tracking-widest border-none shadow-none font-bold px-2 py-0.5",
                                proj.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                              )}>{proj.status}</Badge>
                           </div>
                       </div>
                     ))}
                  </div>
               </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="border-none shadow-sm h-full rounded-3xl overflow-hidden">
                  <CardHeader className="py-5 border-b border-slate-100 flex flex-row items-center justify-between px-6 bg-slate-50/20">
                     <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latest Contacts</CardTitle>
                     <Users size={14} className="text-slate-300" />
                  </CardHeader>
                  <CardContent className="p-0">
                     <div className="divide-y divide-slate-50">
                        {contacts.map((c, i) => (
                          <div key={i} className="px-6 py-4 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-pointer group">
                             <div>
                                <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{c.name}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black italic">{c.source}</p>
                             </div>
                             <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter group-hover:text-slate-500 transition-colors">{c.time}</span>
                          </div>
                        ))}
                     </div>
                  </CardContent>
               </Card>

               <Card className="border-none shadow-sm h-full bg-slate-900 text-white flex flex-col justify-center text-center p-8 rounded-3xl group hover:bg-slate-950 transition-colors cursor-pointer">
                  <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                     <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">Impact <span className="text-indigo-400">Analytics</span></h3>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-[200px] mx-auto mb-8 font-medium">Ministry effectiveness is up 14% this quarter through follow-up pipelines.</p>
                  <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 leading-none">Download Annual Summary</button>
               </Card>
            </div>
         </div>

         <div className="space-y-6">
            <Card className="border-none shadow-sm overflow-hidden flex flex-col h-[520px] rounded-3xl">
               <CardHeader className="py-5 border-b border-slate-50 bg-white px-8">
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                     <MessageSquare size={20} className="text-indigo-500" />
                     Communication Hub
                  </CardTitle>
                  <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Multi-channel broadcast control</CardDescription>
               </CardHeader>
               <CardContent className="flex-1 overflow-y-auto p-0 bg-slate-50/30">
                  <div className="p-8 space-y-6">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Announcement</label>
                        <textarea 
                           className="w-full h-32 bg-white border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300 transition-all italic shadow-inner" 
                           placeholder="Type your message here..."
                        />
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3">
                        <button className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-indigo-500/5 hover:shadow-xl transition-all text-slate-400 hover:text-indigo-600 group active:scale-95">
                           <Mail className="w-6 h-6 transition-transform group-hover:scale-110" />
                           <span className="text-[9px] font-black uppercase tracking-widest">Email</span>
                        </button>
                        <button className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-indigo-500/5 hover:shadow-xl transition-all text-slate-400 hover:text-indigo-600 group active:scale-95">
                           <Bell className="w-6 h-6 transition-transform group-hover:scale-110" />
                           <span className="text-[9px] font-black uppercase tracking-widest">App Push</span>
                        </button>
                        <button className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-white border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-indigo-500/5 hover:shadow-xl transition-all text-slate-400 hover:text-indigo-600 group active:scale-95">
                           <Phone className="w-6 h-6 transition-transform group-hover:scale-110" />
                           <span className="text-[9px] font-black uppercase tracking-widest">SMS</span>
                        </button>
                        <button className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-all group active:scale-95">
                           <Send className="w-6 h-6 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                           <span className="text-[9px] font-black uppercase tracking-widest">Send Now</span>
                        </button>
                     </div>

                     <div className="pt-6 space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduled Campaigns</label>
                        <div className="space-y-3">
                           <div className="px-5 py-4 bg-white border border-slate-100 rounded-xl flex justify-between items-center group cursor-pointer hover:border-indigo-200 transition-all active:scale-95">
                              <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors italic">Easter Program Intro</p>
                              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Tomorrow</span>
                           </div>
                           <div className="px-5 py-4 bg-white border border-slate-100 rounded-xl flex justify-between items-center opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer">
                              <p className="text-xs font-bold text-slate-700 italic">Youth Night Reminder</p>
                              <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Expired</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
