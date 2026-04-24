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
  const [view, setView] = React.useState<'list' | 'details' | 'create'>('list');
  const [selectedEvent, setSelectedEvent] = React.useState<typeof EVENTS[0] | null>(null);

  const handleEventClick = (event: typeof EVENTS[0]) => {
    setSelectedEvent(event);
    setView('details');
  };

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-2xl p-8 space-y-8 text-left">
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Event Title</label>
                    <input type="text" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="e.g. Annual Youth Conclave" />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Start Date</label>
                       <input type="date" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">End Date</label>
                       <input type="date" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" />
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
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Budget (INR)</label>
                       <div className="relative">
                          <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input type="number" className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-12 pr-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="0.00" />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Expense Allocation</label>
                       <select className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 appearance-none transition-all cursor-pointer">
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
                       <input type="text" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Admin / Treasurer Name" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">External Partner %</label>
                       <input type="number" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Payout / Share" />
                    </div>
                 </div>
              </div>

              <div className="pt-4 flex gap-4">
                 <Button className="flex-1 h-16 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-200" onClick={() => setView('list')}>Publish Event</Button>
                 <Button variant="ghost" className="px-8 h-16 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em]" onClick={() => setView('list')}>Save Draft</Button>
              </div>
           </Card>

           <div className="space-y-6">
              <Card className="rounded-[2.5rem] bg-slate-950 text-white p-8 space-y-6 overflow-hidden relative">
                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
                 <div className="relative z-10 space-y-4">
                    <h3 className="font-black text-lg tracking-tight">Website Visibility</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium capitalize">Instantly sync this event with your public website's registration portal and sermon library.</p>
                    <div className="flex items-center gap-3 py-3 border-y border-white/5">
                       <div className="w-10 h-5 bg-indigo-600 rounded-full relative p-1 transition-all shadow-inner">
                          <div className="w-3 h-3 bg-white rounded-full ml-auto"></div>
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Sync Active</span>
                    </div>
                 </div>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-sm p-8 text-left space-y-6">
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Required Approvals</h4>
                    <div className="space-y-4">
                       {[
                         { name: 'Financial Voucher', status: 'Pending' },
                         { name: 'Media/AV Rider', status: 'Approved' },
                         { name: 'Security Protocol', status: 'In Review' },
                       ].map((app, i) => (
                         <div key={i} className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">{app.name}</span>
                            <Badge variant={app.status === 'Approved' ? 'default' : 'outline'} className="text-[9px] font-black px-2">{app.status}</Badge>
                         </div>
                       ))}
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'details' && selectedEvent) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 text-left">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setView('list')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-2" /> Share Event</Button>
            <Button className="bg-indigo-600" size="sm"><Settings className="w-4 h-4 mr-2" /> Event Setup</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden bg-white">
                 <div className="relative h-64">
                    <img 
                      src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60" 
                      className="w-full h-full object-cover" 
                      alt="Event" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-8 space-y-2">
                       <Badge className="bg-indigo-500 text-white border-none mb-2 px-3 py-1 text-[10px] font-black tracking-widest">{selectedEvent.type}</Badge>
                       <h2 className="text-4xl font-black text-white tracking-tight">{selectedEvent.title}</h2>
                       <div className="flex items-center gap-5 text-slate-300 font-bold text-xs uppercase tracking-widest">
                          <span className="flex items-center gap-2"><Calendar size={14} className="text-indigo-400" /> {selectedEvent.date}</span>
                          <span className="flex items-center gap-2"><MapPin size={14} className="text-indigo-400" /> Main Sanctuary</span>
                       </div>
                    </div>
                 </div>
                 <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-50">
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Registrations</p>
                       <h3 className="text-3xl font-black text-slate-900 leading-none">{selectedEvent.attendees} / 500</h3>
                       <div className="mt-3 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${(selectedEvent.attendees / 500) * 100}%` }} />
                       </div>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Voucher Balance</p>
                       <h3 className="text-3xl font-black text-slate-900 leading-none">{selectedEvent.budget}</h3>
                       <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1">Under budget (12%)</p>
                    </div>
                    <div className="space-y-1 text-right md:text-left flex flex-col items-end md:items-start">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">Planning Status</p>
                       <Badge className="rounded-xl bg-emerald-100 text-emerald-700 border-none font-black text-[10px] uppercase tracking-widest p-2 px-4 shadow-sm">{selectedEvent.status}</Badge>
                    </div>
                 </CardContent>
              </Card>

              <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden bg-white">
                 <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/10 flex flex-row items-center justify-between">
                    <div>
                       <CardTitle className="text-lg font-black tracking-tight">Real-time Guest List</CardTitle>
                       <CardDescription className="text-xs font-medium text-slate-500">Live monitoring of financial settlements per guest</CardDescription>
                    </div>
                    <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl">Full Audit</button>
                 </CardHeader>
                 <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                       {[
                         { name: 'Michael Scott', group: 'Adults', date: '2 mins ago', status: 'Paid', amount: '₹1200' },
                         { name: 'Pam Beesley', group: 'Young Adults', date: '1 hour ago', status: 'Pending', amount: '₹0' },
                         { name: 'Jim Halpert', group: 'Adults', date: '3 hours ago', status: 'Paid', amount: '₹1200' },
                         { name: 'Dwight Schrute', group: 'Volunteers', date: 'Yesterday', status: 'Staff', amount: '--' },
                       ].map((person, i) => (
                         <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-all cursor-pointer group active:bg-slate-100 border-l-4 border-l-transparent hover:border-l-indigo-500">
                            <div className="flex items-center gap-5">
                               <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                  {person.name[0]}
                               </div>
                               <div>
                                  <p className="font-black text-slate-800 text-base tracking-tight">{person.name}</p>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{person.group} &bull; {person.date}</p>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="font-black text-slate-900 text-sm font-mono">{person.amount}</p>
                               <Badge variant="outline" className={cn(
                                 "p-1 px-3 text-[9px] font-black uppercase tracking-widest rounded-lg border-none",
                                 person.status === 'Paid' ? "bg-emerald-50 text-emerald-600" : person.status === 'Pending' ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-400"
                               )}>{person.status}</Badge>
                            </div>
                         </div>
                       ))}
                    </div>
                 </CardContent>
              </Card>
           </div>

           <div className="space-y-6">
              <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden bg-slate-900 text-white p-8 space-y-6 text-left">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                       <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Growth Velocity</p>
                       <p className="text-2xl font-black tracking-tight">+14.2%</p>
                    </div>
                 </div>
                 <p className="text-sm text-slate-400 leading-relaxed font-medium">System predictive analysis suggests a higher conversion rate for evening registrations.</p>
                 <Button className="w-full bg-indigo-600 hover:bg-indigo-500 rounded-2xl h-14 uppercase tracking-widest text-[11px] font-black group shadow-xl shadow-indigo-600/20 text-white">
                    Generate Report <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                 </Button>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white text-left">
                 <CardHeader className="p-8 pb-4 border-b border-slate-50 bg-slate-50/10">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logistics Checklist</CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 space-y-5">
                    {[
                      { task: 'Sound System Test', done: true },
                      { task: 'Catering Finalized', done: true },
                      { task: 'Volunteer Briefing', done: false },
                      { task: 'Seating Arrangement', done: false },
                    ].map((t, i) => (
                      <div key={i} className="flex items-center gap-4 group cursor-pointer">
                         <div className={cn(
                           "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                           t.done ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200" : "border-2 border-slate-200 group-hover:border-indigo-400"
                         )}>
                            {t.done && <CheckCircle2 size={16} />}
                         </div>
                         <span className={cn("text-sm font-bold tracking-tight", t.done ? "text-slate-300 line-through" : "text-slate-700")}>{t.task}</span>
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
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Event Intelligence</h1>
          <p className="text-slate-500 font-medium tracking-tight">Full-lifecycle orchestration: from creative planning to final audit and impact reporting.</p>
        </div>
          <div className="flex gap-3 relative z-10">
            <Button 
              onClick={() => setView('create')}
              className="flex items-center gap-3 px-8 h-12 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {EVENTS.map((event, i) => (
           <Card 
            key={i} 
            onClick={() => handleEventClick(event)}
            className="border-none shadow-sm group hover:shadow-2xl cursor-pointer transition-all overflow-hidden bg-white active:scale-95 rounded-[2rem]"
          >
              <CardContent className="p-0">
                 <div className="h-2 bg-indigo-500 w-full group-hover:bg-indigo-600 transition-colors"></div>
                 <div className="p-8 space-y-6">
                    <div className="space-y-2">
                       <div className="flex justify-between items-start">
                          <Badge variant="outline" className="text-[9px] uppercase tracking-[0.2em] font-black rounded-lg text-indigo-600 border-indigo-100 bg-indigo-50/30 px-3 py-1.5">{event.type}</Badge>
                          <span className="text-[10px] font-black text-slate-300 group-hover:text-indigo-400 transition-colors uppercase tracking-widest">{event.date}</span>
                       </div>
                       <h3 className="text-xl font-black text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors pt-1 leading-tight">{event.title}</h3>
                    </div>
                    
                    <div className="flex justify-between items-center border-t border-slate-50 pt-5 mt-2">
                       <span className="flex items-center gap-2 group-hover:text-slate-600 transition-colors text-[11px] font-bold text-slate-400"><Users size={16} className="text-slate-200 group-hover:text-indigo-400 transition-colors" /> {event.attendees} INTAKE</span>
                       <Badge className={cn("text-[9px] px-3 py-1.5 rounded-full font-black border-none uppercase tracking-widest",
                         event.status === 'Registration Open' ? "bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100" : "bg-slate-50 text-slate-500"
                       )}>{event.status}</Badge>
                    </div>
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm overflow-hidden h-full rounded-[2.5rem] bg-white">
               <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/5">
                  <div>
                    <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Mission Logistics Matrix</CardTitle>
                    <CardDescription className="font-medium text-slate-500 mt-1">Consolidated status of active equipment & personnel</CardDescription>
                  </div>
                  <LayoutGrid size={24} className="text-slate-200" />
               </CardHeader>
               <CardContent className="p-0">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left font-sans">
                        <thead className="bg-slate-50/20 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                           <tr>
                              <th className="px-8 py-5">Resource</th>
                              <th className="px-6 py-5">Allocation</th>
                              <th className="px-6 py-5">Accounting Status</th>
                              <th className="px-8 py-5"></th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                           {[
                             { name: 'Transport Vehicles', count: '12 Vans', status: 'Settled' },
                             { name: 'Catering Services', count: '800 Meals', status: 'Voucher Pending' },
                             { name: 'Audio/Visual Gear', count: 'Main Stage Set', status: 'Contract Signed' },
                             { name: 'Volunteer Teams', count: '24 Members', status: 'Allocated' },
                           ].map((item, i) => (
                             <tr key={i} className="hover:bg-slate-50 transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-indigo-600">
                                <td className="px-8 py-6 font-black text-slate-700 group-hover:text-indigo-600 transition-colors text-[15px]">{item.name}</td>
                                <td className="px-6 py-6 text-slate-500 font-bold text-xs uppercase tracking-tight">{item.count}</td>
                                <td className="px-6 py-6">
                                   <Badge className={cn("rounded-xl border-none shadow-none text-[9px] font-black tracking-widest px-4 py-2",
                                     item.status === 'Settled' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : item.status === 'Voucher Pending' ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                                   )}>{item.status}</Badge>
                                </td>
                                <td className="px-8 py-6 text-right"><ArrowRight size={20} className="text-slate-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" /></td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </CardContent>
            </Card>
         </div>

         <div className="space-y-6 text-left">
            <Card className="border-none shadow-2xl bg-indigo-600 text-white overflow-hidden relative rounded-[2.5rem] group cursor-pointer hover:bg-slate-900 transition-all">
               <div className="absolute right-0 bottom-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><TrendingUp size={140} /></div>
               <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl font-black tracking-tight">Account Intelligence</CardTitle>
               </CardHeader>
               <CardContent className="space-y-6 pt-0 relative z-10 p-8">
                  <div className="space-y-5">
                     {[
                       { label: 'Visits to Account', val: 78 },
                       { label: 'Invites to RSVP', val: 42 },
                       { label: 'RSVP to Check-in', val: 92 },
                     ].map((s, i) => (
                       <div key={i} className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-200">
                             <span>{s.label}</span>
                             <span>{s.val}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                             <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${s.val}%` }}></div>
                          </div>
                       </div>
                     ))}
                  </div>
                  <p className="text-[12px] leading-relaxed text-indigo-50 font-bold italic bg-white/10 p-5 rounded-2xl border border-white/10 shadow-inner">
                    "Member payout integration ready. Link website registration with main finance ledger for automated receipts."
                  </p>
                  <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-900/40 transform active:scale-95 transition-all">Connect Global Website</button>
               </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
               <CardHeader className="p-8 pb-4 border-b border-slate-50 bg-slate-50/10">
                  <CardTitle className="text-sm font-black flex items-center gap-3 text-slate-800 uppercase tracking-widest leading-none">
                     <Clock size={18} className="text-indigo-500" />
                     Milestones
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8 space-y-6">
                  <div className="relative pl-8 border-l-4 border-slate-50 space-y-10">
                    <div className="relative">
                       <div className="absolute -left-[38px] top-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-lg shadow-emerald-200"></div>
                       <p className="text-sm font-bold text-slate-800 tracking-tight">Portal Live</p>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">2 days ago</p>
                    </div>
                    <div className="relative">
                       <div className="absolute -left-[38px] top-1 w-5 h-5 rounded-full bg-indigo-500 border-4 border-white shadow-lg shadow-indigo-200 animate-pulse"></div>
                       <p className="text-sm font-bold text-slate-800 tracking-tight">Payout Cycle</p>
                       <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">Due in 4 days</p>
                    </div>
                    <div className="relative opacity-30">
                       <div className="absolute -left-[38px] top-1 w-5 h-5 rounded-full bg-slate-200 border-4 border-white"></div>
                       <p className="text-sm font-bold text-slate-400 tracking-tight">Archive</p>
                       <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mt-1">Scheduled</p>
                    </div>
                  </div>
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
