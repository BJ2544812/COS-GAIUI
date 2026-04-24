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
  TrendingUp,
  Clock,
  LayoutGrid,
  ArrowLeft,
  Settings,
  Share2,
  Ticket,
  DollarSign,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

const EVENTS = [
  { title: 'Worship Night 2024', date: 'Apr 12, 2024', status: 'Registration Open', attendees: 480, budget: '$12k', type: 'Concert' },
  { title: 'Youth Summer Camp', date: 'Jun 15-20, 2024', status: 'Planning', attendees: 120, budget: '$45k', type: 'Camp' },
  { title: 'Missions Outreach', date: 'May 04, 2024', status: 'Ready', attendees: 84, budget: '$2.5k', type: 'Outreach' },
  { title: 'Leadership Retreat', date: 'Apr 28, 2024', status: 'Invite Only', attendees: 42, budget: '$8k', type: 'Training' },
];

export function EventsModule() {
  const [selectedEvent, setSelectedEvent] = React.useState<typeof EVENTS[0] | null>(null);
  if (selectedEvent) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedEvent(null)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-2" /> Share Event</Button>
            <Button className="bg-indigo-600" size="sm"><Settings className="w-4 h-4 mr-2" /> Event Setup</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                 <div className="relative h-64">
                    <img 
                      src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60" 
                      className="w-full h-full object-cover" 
                      alt="Event" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-8 space-y-2">
                       <Badge className="bg-indigo-50 text-white border-none mb-2">{selectedEvent.type}</Badge>
                       <h2 className="text-4xl font-black text-white">{selectedEvent.title}</h2>
                       <div className="flex items-center gap-4 text-slate-300 font-medium">
                          <span className="flex items-center gap-1.5"><Calendar size={14} /> {selectedEvent.date}</span>
                          <span className="flex items-center gap-1.5"><MapPin size={14} /> Main Sanctuary</span>
                       </div>
                    </div>
                 </div>
                 <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-50">
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Registrations</p>
                       <h3 className="text-2xl font-black text-slate-900 leading-none">{selectedEvent.attendees} / 500</h3>
                       <div className="mt-2 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(selectedEvent.attendees / 500) * 100}%` }} />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Event Budget</p>
                       <h3 className="text-2xl font-black text-slate-900 leading-none">{selectedEvent.budget}</h3>
                       <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tight">Under budget (12%)</p>
                    </div>
                    <div className="space-y-1 text-right md:text-left">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 text-right">Status</p>
                       <Badge className="rounded-full bg-emerald-100 text-emerald-700 border-none font-bold float-right md:float-none">{selectedEvent.status}</Badge>
                    </div>
                 </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                 <CardHeader className="py-5 border-b border-slate-50 bg-slate-50/30 flex flex-row items-center justify-between px-8">
                    <CardTitle className="text-lg font-bold">Attendee Analysis</CardTitle>
                    <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600">View All</button>
                 </CardHeader>
                 <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                       {[
                         { name: 'Michael Scott', group: 'Adults', date: '2 mins ago', status: 'Paid' },
                         { name: 'Pam Beesley', group: 'Young Adults', date: '1 hour ago', status: 'Pending' },
                         { name: 'Jim Halpert', group: 'Adults', date: '3 hours ago', status: 'Paid' },
                         { name: 'Dwight Schrute', group: 'Volunteers', date: 'Yesterday', status: 'Staff' },
                       ].map((person, i) => (
                         <div key={i} className="px-8 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                  {person.name[0]}
                               </div>
                               <div>
                                  <p className="font-bold text-slate-800">{person.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{person.group}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{person.date}</p>
                               <Badge variant="ghost" className="p-0 text-xs text-indigo-500 font-bold">{person.status}</Badge>
                            </div>
                         </div>
                       ))}
                    </div>
                 </CardContent>
              </Card>
           </div>

           <div className="space-y-6">
              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-slate-900 text-white p-6 space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                       <TrendingUp className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Growth Velocity</p>
                       <p className="text-xl font-black">+14.2%</p>
                    </div>
                 </div>
                 <p className="text-xs text-slate-400 leading-relaxed">System analysis shows a higher conversion rate for evening registrations in this category.</p>
                 <Button className="w-full bg-indigo-500 hover:bg-indigo-400 rounded-xl h-12 uppercase tracking-widest text-[10px] font-black group shadow-lg shadow-indigo-600/20 text-white">
                    Generate Report <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
                 </Button>
              </Card>

              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                 <CardHeader className="py-4 border-b border-slate-50 bg-slate-50/30">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Logistics Checklist</CardTitle>
                 </CardHeader>
                 <CardContent className="p-6 space-y-4">
                    {[
                      { task: 'Sound System Test', done: true },
                      { task: 'Catering Finalized', done: true },
                      { task: 'Volunteer Briefing', done: false },
                      { task: 'Seating Arrangement', done: false },
                    ].map((t, i) => (
                      <div key={i} className="flex items-center gap-3">
                         <div className={cn(
                           "w-5 h-5 rounded flex items-center justify-center transition-colors",
                           t.done ? "bg-emerald-500 text-white" : "border-2 border-slate-200"
                         )}>
                            {t.done && <CheckCircle2 size={14} />}
                         </div>
                         <span className={cn("text-xs font-bold", t.done ? "text-slate-400 line-through" : "text-slate-700")}>{t.task}</span>
                      </div>
                    ))}
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Event Management</h1>
          <p className="text-slate-500">End-to-end planning, registrations, logistics, and impact reporting.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all active:scale-95 leading-none">
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {EVENTS.map((event, i) => (
           <Card 
            key={i} 
            onClick={() => setSelectedEvent(event)}
            className="border-none shadow-sm group hover:ring-2 hover:ring-indigo-500/10 cursor-pointer transition-all overflow-hidden bg-white active:scale-95 active:shadow-inner"
          >
              <CardContent className="p-0">
                 <div className="h-2 bg-indigo-500 w-full group-hover:bg-indigo-600 transition-colors"></div>
                 <div className="p-6 space-y-4">
                    <div className="space-y-1">
                       <div className="flex justify-between items-start">
                          <Badge variant="outline" className="text-[9px] uppercase tracking-widest font-black rounded text-indigo-500 border-indigo-100 bg-indigo-50/20">{event.type}</Badge>
                          <span className="text-[10px] font-bold text-slate-300 group-hover:text-indigo-400 transition-colors">{event.date}</span>
                       </div>
                       <h3 className="text-lg font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors pt-1">{event.title}</h3>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400 border-t border-slate-50 pt-4">
                       <span className="flex items-center gap-1.5 group-hover:text-slate-600 transition-colors"><Users size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors" /> {event.attendees} Registered</span>
                       <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold",
                         event.status === 'Registration Open' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500"
                       )}>{event.status}</span>
                    </div>
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm overflow-hidden h-full">
               <CardHeader className="py-5 border-b border-slate-50 flex flex-row items-center justify-between px-6 bg-slate-50/20">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Event Logisitics Overview</CardTitle>
                    <CardDescription>Consolidated status of active projects</CardDescription>
                  </div>
                  <LayoutGrid size={20} className="text-slate-200" />
               </CardHeader>
               <CardContent className="p-0">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left font-sans">
                        <thead className="bg-slate-50/5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                           <tr>
                              <th className="px-6 py-4">Resource</th>
                              <th className="px-6 py-4">Allocation</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4"></th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                           {[
                             { name: 'Transport Vehicles', count: '12 Vans', status: 'Confirmed' },
                             { name: 'Catering Services', count: '800 Meals', status: 'In Review' },
                             { name: 'Audio/Visual Gear', count: 'Main Stage Set', status: 'Deployed' },
                             { name: 'Volunteer Teams', count: '24 Members', status: 'Confirmed' },
                           ].map((item, i) => (
                             <tr key={i} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                <td className="px-6 py-5 font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{item.name}</td>
                                <td className="px-6 py-5 text-slate-500 font-medium">{item.count}</td>
                                <td className="px-6 py-5">
                                   <Badge className={cn("rounded-full border-none shadow-none text-[10px] font-bold px-3 py-1",
                                     item.status === 'Confirmed' ? "bg-emerald-50 text-emerald-600" : item.status === 'In Review' ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"
                                   )}>{item.status}</Badge>
                                </td>
                                <td className="px-6 py-5 text-right"><ArrowRight size={16} className="text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" /></td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </CardContent>
            </Card>
         </div>

         <div className="space-y-6">
            <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative rounded-3xl group cursor-pointer hover:bg-indigo-700 transition-colors">
               <div className="absolute right-0 bottom-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp size={120} /></div>
               <CardHeader>
                  <CardTitle className="text-base font-bold">Conversion Intelligence</CardTitle>
               </CardHeader>
               <CardContent className="space-y-6 pt-0 relative z-10">
                  <div className="space-y-4">
                     {[
                       { label: 'Visits to Account', val: 78 },
                       { label: 'Invites to RSVP', val: 42 },
                       { label: 'RSVP to Check-in', val: 92 },
                     ].map((s, i) => (
                       <div key={i} className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-indigo-200">
                             <span>{s.label}</span>
                             <span>{s.val}%</span>
                          </div>
                          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                             <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${s.val}%` }}></div>
                          </div>
                       </div>
                     ))}
                  </div>
                  <p className="text-[11px] leading-relaxed text-indigo-50 font-medium italic opacity-80 bg-white/5 p-3 rounded-xl border border-white/10">"Predictive model suggests Worship Night will exceed capacity by 15% based on current velocity."</p>
                  <button className="w-full py-3 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transform active:scale-95 transition-all shadow-indigo-900/20">Enable Waiting List</button>
               </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
               <CardHeader className="py-4 border-b border-slate-50 bg-slate-50/30">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                     <Clock size={16} className="text-indigo-500" />
                     Milestone Tracking
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-6 space-y-4">
                  <div className="relative pl-6 border-l-2 border-slate-100 space-y-8">
                    <div className="relative">
                       <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
                       <p className="text-xs font-bold text-slate-800">Registration Portal Live</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Completed 2 days ago</p>
                    </div>
                    <div className="relative">
                       <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow-sm shadow-indigo-100 animate-pulse"></div>
                       <p className="text-xs font-bold text-slate-800">Vendor Payout Cycle</p>
                       <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-tight">Due in 4 days</p>
                    </div>
                    <div className="relative opacity-50">
                       <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-slate-200 border-2 border-white"></div>
                       <p className="text-xs font-bold text-slate-400">Post-Event Archive</p>
                       <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tight">Scheduled</p>
                    </div>
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
