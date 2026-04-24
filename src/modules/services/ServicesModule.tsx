import * as React from 'react';
import { 
  Sun, 
  Clock, 
  Music, 
  Video, 
  Users, 
  Calendar, 
  ChevronRight, 
  Plus, 
  ListOrdered,
  Mic2,
  Settings,
  ArrowLeft,
  LayoutGrid,
  Play,
  Share2,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

const UPCOMING_SERVICES = [
  { name: 'Easter Sunday Celebration', date: 'Mar 31, 2024', status: 'In Planning', leader: 'Dr. Arthur Penhaligon', team: 12 },
  { name: 'Midweek Healing Service', date: 'Apr 03, 2024', status: 'Ready', leader: 'Rev. Sarah Jenkins', team: 4 },
  { name: 'Sunday Morning (Combined)', date: 'Apr 07, 2024', status: 'Draft', leader: 'Pastor Mike Ross', team: 8 },
];

export function ServicesModule() {
  const [selectedService, setSelectedService] = React.useState<typeof UPCOMING_SERVICES[0] | null>(null);

  if (selectedService) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedService(null)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Schedule
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-2" /> Share Run Sheet</Button>
            <Button className="bg-indigo-600" size="sm"><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
          </div>
        </div>

        <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
           <CardHeader className="bg-slate-900 text-white p-8 border-none">
              <div className="flex justify-between items-start">
                 <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                       <Badge className="bg-indigo-500 text-white border-none">{selectedService.date}</Badge>
                       <Badge variant="outline" className="text-indigo-400 border-indigo-400/30 font-bold uppercase tracking-widest text-[9px]">Run Sheet v2.4</Badge>
                    </div>
                    <CardTitle className="text-3xl font-black">{selectedService.name}</CardTitle>
                    <p className="text-slate-400 font-medium">Service Producer: <span className="text-indigo-300">{selectedService.leader}</span></p>
                 </div>
                 <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                    <Settings className="w-4 h-4 mr-2" /> Service Settings
                 </Button>
              </div>
           </CardHeader>
           <CardContent className="p-0">
              <div className="overflow-x-auto">
                 <table className="w-full text-left font-sans">
                    <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                       <tr>
                          <th className="px-8 py-4">Time</th>
                          <th className="px-8 py-4">Dur</th>
                          <th className="px-8 py-4">Item Name / Segment</th>
                          <th className="px-8 py-4">Media / Notes</th>
                          <th className="px-8 py-4 text-right">Owner</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                       {[
                         { time: '09:00', dur: '05:00', item: 'Pre-service Loop', media: 'Service Bumper v1', owner: 'Media Team' },
                         { time: '09:05', dur: '10:00', item: 'Praise & Worship', media: 'Chord Sheets @PCO', owner: 'Worship Lead' },
                         { time: '09:15', dur: '03:00', item: 'Welcome & Announcements', media: 'Slide Deck: Mar31', owner: 'Pastor Mike' },
                         { time: '09:18', dur: '12:00', item: 'Sermon: The Hope', media: 'Keynote Prep Completed', owner: 'Lead Pastor' },
                         { time: '09:30', dur: '05:00', item: 'Closing Prayer / Song', media: 'BG Loop: Soft', owner: 'Church Staff' },
                       ].map((item, i) => (
                         <tr key={i} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-8 py-5 font-mono font-bold text-indigo-600">{item.time}</td>
                            <td className="px-8 py-5 font-mono text-slate-400 font-bold">{item.dur}</td>
                            <td className="px-8 py-5">
                               <p className="font-bold text-slate-800">{item.item}</p>
                               <div className="flex gap-2 mt-1">
                                  <Badge variant="ghost" className="p-0 text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1"><Play size={10} /> Live</Badge>
                               </div>
                            </td>
                            <td className="px-8 py-5">
                               <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                  {item.media}
                               </div>
                            </td>
                            <td className="px-8 py-5 text-right font-bold text-slate-400 group-hover:text-indigo-600 transition-colors uppercase tracking-widest text-[10px]">{item.owner}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
       <div className="flex justify-between items-center whitespace-nowrap">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Service Planning</h1>
          <p className="text-slate-500 text-sm sm:text-base">Coordinate rehearsals, worship sets, media, and run sheets.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all active:scale-95 leading-none">
          <Plus className="w-4 h-4" />
          Plan Service
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Drafting', count: 4, color: 'bg-slate-100 text-slate-700' },
                { title: 'In Planning', count: 2, color: 'bg-indigo-100 text-indigo-700' },
                { title: 'Ready', count: 1, color: 'bg-emerald-100 text-emerald-700' },
              ].map((cat, i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-100 bg-white flex justify-between items-center shadow-sm">
                   <span className="text-sm font-bold text-slate-600 uppercase tracking-widest leading-none text-[10px]">{cat.title}</span>
                   <Badge className={cn("rounded-full border-none px-3 font-black", cat.color)}>{cat.count}</Badge>
                </div>
              ))}
           </div>

           <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="py-5 border-b border-slate-50 flex flex-row items-center justify-between px-6 bg-slate-50/20">
                 <CardTitle className="text-lg font-bold text-slate-800">Master Schedule</CardTitle>
                 <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="h-8 text-xs font-bold uppercase tracking-widest transform active:scale-95">Calendar View</Button>
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="divide-y divide-slate-50">
                    {UPCOMING_SERVICES.map((srv, i) => (
                      <div 
                        key={i} 
                        onClick={() => setSelectedService(srv)}
                        className="p-6 hover:bg-slate-50/50 transition-all group flex flex-col md:flex-row justify-between md:items-center gap-4 cursor-pointer active:bg-slate-100"
                      >
                         <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-slate-400 group-hover:bg-white group-hover:border-indigo-200 transition-all shadow-sm">
                               <span className="text-[10px] font-bold uppercase leading-none mb-1">{srv.date.split(' ')[0]}</span>
                               <span className="text-xl font-black text-slate-700 leading-none group-hover:text-indigo-600 transition-colors">{srv.date.split(' ')[1].replace(',', '')}</span>
                            </div>
                            <div className="space-y-0.5">
                               <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-lg leading-tight">{srv.name}</h3>
                               <p className="text-xs text-slate-400 font-medium">Head: {srv.leader} &bull; {srv.team} Team Members</p>
                            </div>
                         </div>

                         <div className="flex items-center gap-6">
                            <div className="flex -space-x-2">
                               {[1, 2, 3].map(m => (
                                 <div key={m} className={cn(
                                   "w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-sm transition-transform group-hover:scale-105",
                                   m === 1 ? "bg-amber-100 text-amber-700" : m === 2 ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"
                                 )}>U{m}</div>
                               ))}
                               <div className="w-9 h-9 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-[10px] font-black text-white">+9</div>
                            </div>

                            <Badge className={cn(
                              "rounded-full px-4 py-1.5 font-black border-none text-[9px] uppercase tracking-widest leading-none shadow-sm",
                              srv.status === 'Ready' ? "bg-emerald-50 text-emerald-700" : srv.status === 'Draft' ? "bg-slate-100 text-slate-500" : "bg-indigo-50 text-indigo-700"
                            )}>
                               {srv.status}
                            </Badge>
                            
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                         </div>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>

        <div className="space-y-6">
            <Card className="border-none shadow-sm h-fit rounded-3xl overflow-hidden">
              <CardHeader className="py-5 border-b border-slate-50 bg-slate-50/30">
                 <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-widest">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                 <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50/50 text-slate-600 text-xs font-black uppercase tracking-widest border border-transparent hover:border-indigo-100 transition-all active:scale-95 text-left">
                    <Music className="w-4 h-4 text-indigo-500" />
                    Song Database
                 </button>
                 <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-50/50 text-slate-600 text-xs font-black uppercase tracking-widest border border-transparent hover:border-emerald-100 transition-all active:scale-95 text-left">
                    <ListOrdered className="w-4 h-4 text-emerald-500" />
                    Step-Sheets
                 </button>
                 <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-amber-50/50 text-slate-600 text-xs font-black uppercase tracking-widest border border-transparent hover:border-amber-100 transition-all active:scale-95 text-left">
                    <Mic2 className="w-4 h-4 text-amber-500" />
                    Volunteer Rotation
                 </button>
                 <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100/50 text-slate-600 text-xs font-black uppercase tracking-widest border border-transparent hover:border-slate-200 transition-all active:scale-95 text-left">
                    <Settings className="w-4 h-4 text-slate-400" />
                    Settings
                 </button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden rounded-3xl group cursor-pointer hover:bg-slate-950 transition-colors">
               <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                     <Video className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                     Multi-Campus Sync
                  </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4 pt-0">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                     <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                        <span>Streaming Status</span>
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> Live</span>
                     </div>
                     <p className="text-xs font-medium leading-relaxed text-slate-300">Broadcasting sermon to 4 remote locations simultaneously.</p>
                  </div>
                  <button className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-95">Open Media Control</button>
               </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
