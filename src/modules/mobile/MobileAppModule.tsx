import React from 'react';
import { 
  Smartphone, 
  User, 
  Calendar, 
  Heart, 
  BookOpen, 
  MessageSquare,
  ChevronRight,
  Bell,
  Search,
  Activity,
  PlayCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';

export function MobileAppModule() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Member App Experience</h1>
          <p className="text-slate-500">Preview and manage the digital experience for your congregation.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all">
            Engagement Analytics
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
         <div className="lg:col-span-4 flex justify-center">
            <div className="w-[320px] aspect-[9/18.5] bg-slate-900 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden relative group">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20"></div>
               
               <div className="absolute inset-0 bg-white flex flex-col pt-10 px-6 space-y-6 overflow-y-auto">
                  <div className="flex justify-between items-center">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Welcome back,</p>
                        <h4 className="text-lg font-black text-slate-900 leading-none">James Wilson</h4>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400"><User size={20} /></div>
                  </div>

                  <Card className="border-none shadow-xl shadow-indigo-100/50 bg-indigo-600 text-white overflow-hidden relative shrink-0">
                     <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={60} /></div>
                     <CardContent className="p-5 space-y-4 relative z-10">
                        <div className="space-y-1">
                           <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Next Service</p>
                           <h5 className="text-sm font-bold uppercase tracking-tight">Main Sanctuary • 09:00 AM</h5>
                        </div>
                        <button className="w-full bg-white/20 backdrop-blur-md border border-white/20 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">Self Check-in</button>
                     </CardContent>
                  </Card>

                  <div className="space-y-3">
                     <div className="flex justify-between items-center">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your Discipleship</h5>
                        <ChevronRight size={14} className="text-slate-300" />
                     </div>
                     <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                        {[
                          { title: 'Foundations', progress: 80, icon: BookOpen },
                          { title: 'Leadership', progress: 20, icon: Smartphone }
                        ].map((m, i) => (
                           <div key={i} className="min-w-[140px] p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                              <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-indigo-500 shadow-sm"><m.icon size={16} /></div>
                              <p className="text-[11px] font-bold text-slate-700">{m.title}</p>
                              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                 <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${m.progress}%` }}></div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-3">
                     <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latest Teaching</h5>
                     <div className="aspect-video bg-slate-100 rounded-2xl relative overflow-hidden group/sermon">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                        <PlayCircle className="absolute inset-0 m-auto text-white opacity-80 group-hover/sermon:scale-110 transition-transform" size={42} />
                        <div className="absolute bottom-3 left-4 right-4">
                           <p className="text-[11px] font-bold text-white leading-tight uppercase tracking-tight">Deep Waters: Part 4</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="absolute bottom-0 left-0 w-full h-16 bg-white/80 backdrop-blur-md border-t border-slate-100 z-20 flex justify-around items-center px-4">
                  <Heart size={20} className="text-rose-500 fill-rose-500" />
                  <Calendar size={20} className="text-slate-300" />
                  <div className="w-12 h-12 bg-indigo-600 rounded-2xl -mt-8 shadow-xl shadow-indigo-200 flex items-center justify-center text-white"><Search size={24} /></div>
                  <MessageSquare size={20} className="text-slate-300" />
                  <User size={20} className="text-slate-300" />
               </div>
            </div>
         </div>

         <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm h-fit">
               <CardHeader className="py-5 border-b border-slate-50">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">App Branding</CardTitle>
               </CardHeader>
               <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Primary Color</label>
                     <div className="flex gap-2">
                        {['bg-indigo-600', 'bg-rose-600', 'bg-emerald-600', 'bg-slate-900'].map((c, i) => (
                          <div key={i} className={`w-8 h-8 rounded-full ${c} border-4 ${i === 0 ? 'border-slate-200' : 'border-transparent'} cursor-pointer`}></div>
                        ))}
                     </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Feature Toggles</label>
                    {[
                      { name: 'Online Giving', enabled: true },
                      { name: 'Sermon Archive', enabled: true },
                      { name: 'Chat Communities', enabled: false },
                      { name: 'Resource Downloads', enabled: true },
                    ].map((f, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                         <span className="text-xs font-bold text-slate-700">{f.name}</span>
                         <div className={cn("w-10 h-5 rounded-full p-1 transition-colors", f.enabled ? "bg-indigo-600 flex justify-end" : "bg-slate-300 flex justify-start")}>
                            <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                         </div>
                      </div>
                    ))}
                  </div>
               </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-indigo-900 text-white p-8 space-y-6 flex flex-col justify-center">
               <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-2"><Bell className="text-indigo-300" size={32} /></div>
               <div className="space-y-2">
                 <h3 className="text-xl font-bold uppercase tracking-tighter italic">Push Automation</h3>
                 <p className="text-xs text-indigo-200/70 leading-relaxed font-medium">Automatic notifications are generated when a member's engagement score drops below 40% or when new content matches their interest tags.</p>
               </div>
               <button className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">Open Notify Engine</button>
            </Card>
         </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
