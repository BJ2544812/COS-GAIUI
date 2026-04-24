import * as React from 'react';
import { 
  ShieldCheck, 
  Heart, 
  MessageSquare, 
  UserPlus, 
  ChevronRight, 
  Clock, 
  Star,
  Activity,
  Plus,
  ArrowLeft,
  Users,
  Target,
  Sparkles,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { ERPModule } from '@/src/types';

const STAGES = [
  { name: 'First-time Visitor', count: 124, color: 'bg-blue-100 text-blue-700', icon: UserPlus },
  { name: 'Salvation Decision', count: 18, color: 'bg-emerald-100 text-emerald-700', icon: Heart },
  { name: 'Baptism Pipeline', count: 24, color: 'bg-indigo-100 text-indigo-700', icon: Zap },
  { name: 'Membership Class', count: 56, color: 'bg-amber-100 text-amber-700', icon: Star },
];

const RECENT_REQUESTS = [
  { user: 'Robert Chen', type: 'Prayer', category: 'Health', time: '1h ago', urgent: true },
  { user: 'James Wilson', type: 'Counseling', category: 'Family', time: '3h ago', urgent: false },
  { user: 'Sarah Miller', type: 'Visit', category: 'Bereavement', time: '5h ago', urgent: true },
];

interface DiscipleshipModuleProps {
  onModuleChange?: (module: ERPModule) => void;
}

export function DiscipleshipModule({ onModuleChange }: DiscipleshipModuleProps) {
  const [view, setView] = React.useState<'overview' | 'journey'>('overview');

  if (view === 'journey') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setView('overview')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Care Dashboard
          </Button>
          <Button className="bg-indigo-600 shadow-lg shadow-indigo-200">Configure Growth Path</Button>
        </div>

        <div className="text-center space-y-2 mb-12">
           <h1 className="text-4xl font-black text-slate-900 tracking-tight">The Growth Pathway</h1>
           <p className="text-slate-500 font-medium max-w-xl mx-auto">A structured journey designed to move individuals from first encounter to leadership maturity.</p>
        </div>

        <div className="relative">
           {/* Connection Lines */}
           <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 -z-10 hidden lg:block"></div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { 
                  label: 'CONNECT', 
                  title: 'New Visitors', 
                  desc: 'Assimilation through welcome centers and follow-up calls.',
                  icon: UserPlus,
                  color: 'blue',
                  metrics: '124 active'
                },
                { 
                  label: 'BELIEVE', 
                  title: 'Salvation', 
                  desc: 'Foundational classes and spiritual mentorship.',
                  icon: Heart,
                  color: 'rose',
                  metrics: '18 decisions'
                },
                { 
                  label: 'COMMIT', 
                  title: 'Membership', 
                  desc: 'Integration into small groups and church membership.',
                  icon: Users,
                  color: 'indigo',
                  metrics: '56 in class'
                },
                { 
                  label: 'SERVE', 
                  title: 'Leadership', 
                  desc: 'Empowering individuals to lead and serve in ministries.',
                  icon: Star,
                  color: 'amber',
                  metrics: '42 trainees'
                },
              ].map((step, i) => (
                <div key={i} className="space-y-6 group">
                   <div className="flex flex-col items-center">
                      <div className={`w-24 h-24 rounded-[32px] bg-white shadow-xl shadow-slate-100 border-2 border-transparent group-hover:border-${step.color}-500 transition-all duration-500 flex items-center justify-center relative overflow-hidden`}>
                         <div className={`absolute inset-0 bg-${step.color}-500 opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                         <step.icon className={`w-10 h-10 text-${step.color}-600 group-hover:scale-110 transition-transform duration-500`} />
                         <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold ring-4 ring-white">
                            {i + 1}
                         </div>
                      </div>
                   </div>
                   <Card className="border-none shadow-sm text-center p-6 rounded-3xl group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-500">
                      <p className={`text-[10px] font-black text-${step.color}-600 uppercase tracking-[0.2em] mb-2`}>{step.label}</p>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">{step.desc}</p>
                      <div className="pt-4 border-t border-slate-50 flex items-center justify-center gap-2">
                         <Target className="w-3.5 h-3.5 text-slate-400" />
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{step.metrics}</span>
                      </div>
                   </Card>
                </div>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
           <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-slate-900 text-white">
              <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-300" />
                    AI-Driven Intervention
                 </CardTitle>
                 <CardDescription className="text-slate-400">Predictive analysis suggests these 5 individuals are ready for their next step.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {['David Chen', 'Amanda Ross', 'Kevin Miller'].map((name, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-xs">{name[0]}</div>
                         <span className="text-sm font-medium">{name}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs text-indigo-300 hover:text-indigo-100 p-0 h-auto">Suggest Move &rarr;</Button>
                   </div>
                 ))}
              </CardContent>
           </Card>

           <Card className="rounded-3xl border-slate-100 shadow-sm p-8 flex flex-col justify-center items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                 <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Automation Settings</h3>
              <p className="text-sm text-slate-500 max-w-xs">Define triggers for automatic pastoral alerts based on attendance drops or missing milestones.</p>
              <Button variant="outline" className="rounded-xl px-8 h-12 font-bold tracking-widest text-[10px] uppercase">Configure Triggers</Button>
           </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
       <div className="flex justify-between items-center text-left">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Discipleship & Pastoral Care</h1>
          <p className="text-slate-500">Track spiritual milestones, manage prayer requests, and coordinate counseling.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all active:scale-95">
          <Plus className="w-4 h-4" />
          New Case
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAGES.map((stage, i) => (
          <Card key={i} className="border-none shadow-sm h-full group hover:bg-slate-50 transition-colors cursor-pointer">
            <CardContent className="p-6">
               <div className="flex justify-between items-start mb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stage.name}</p>
                  <stage.icon className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
               </div>
               <div className="flex items-baseline gap-2">
                 <h3 className="text-3xl font-bold text-slate-900">{stage.count}</h3>
                 <span className="text-xs font-medium text-slate-400">Individuals</span>
               </div>
               <div className="w-full h-1 bg-slate-100 rounded-full mt-4 overflow-hidden">
                 <div className={cn(
                   "h-full rounded-full transition-all duration-1000",
                   i === 0 ? "bg-blue-500 w-[80%]" : i === 1 ? "bg-emerald-500 w-[60%]" : i === 2 ? "bg-indigo-500 w-[40%]" : "bg-amber-500 w-[30%]"
                 )}></div>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="py-5 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/30">
                 <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Spiritual Growth Pathways</CardTitle>
                    <CardDescription>Visualizing movement through church integration stages</CardDescription>
                 </div>
                 <Button 
                   onClick={() => setView('journey')}
                   className="text-[10px] font-bold text-indigo-600 hover:text-white transition-all uppercase tracking-widest px-4 py-2 bg-indigo-50 hover:bg-indigo-600 rounded-xl"
                 >
                   View Journey Map
                 </Button>
              </CardHeader>
              <CardContent className="p-8">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {[
                      { icon: UserPlus, label: 'Connect' },
                      { icon: ShieldCheck, label: 'Grow' },
                      { icon: Heart, label: 'Serve' },
                      { icon: Star, label: 'Lead' }
                    ].map((step, i) => (
                      <React.Fragment key={i}>
                        <div className="flex flex-col items-center gap-3 group cursor-pointer">
                           <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-indigo-200">
                             <step.icon className="w-8 h-8" />
                           </div>
                           <p className="text-sm font-bold text-slate-600 group-hover:text-indigo-600 transition-colors uppercase tracking-widest text-[10px]">{step.label}</p>
                        </div>
                        {i < 3 && <ChevronRight className="w-5 h-5 text-slate-200 hidden md:block" />}
                      </React.Fragment>
                    ))}
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm">
              <CardHeader className="py-5 border-b border-slate-50 flex flex-row items-center justify-between">
                 <CardTitle className="text-lg font-bold text-slate-800">Pastoral Care Alerts</CardTitle>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">3 Priority Cases</span>
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="divide-y divide-slate-50">
                    {[
                      { name: 'Michael Thompson', reason: 'Attendance drop (> 3 weeks)', risk: 'Medium' },
                      { name: 'The Williams Family', reason: 'Repeated crisis prayer requests', risk: 'High' },
                      { name: 'Deborah Vance', reason: 'Leadership burnout indicators', risk: 'Low' },
                    ].map((care, i) => (
                      <div key={i} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors group">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">{care.name.charAt(0)}</div>
                            <div onClick={() => onModuleChange?.('profile')} className="cursor-pointer">
                               <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{care.name}</p>
                               <p className="text-xs text-slate-500">{care.reason}</p>
                            </div>
                         </div>
                         <Badge className={cn(
                           "rounded-full px-3 py-0.5 border-none font-bold text-[10px]",
                           care.risk === 'High' ? "bg-rose-50 text-rose-700" : care.risk === 'Medium' ? "bg-amber-50 text-amber-700" : "bg-teal-50 text-teal-700"
                         )}>Risk: {care.risk}</Badge>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="border-none shadow-sm h-full">
              <CardHeader className="py-5 border-b border-slate-50">
                 <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-widest">Inbound Care Requests</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="divide-y divide-slate-50">
                    {RECENT_REQUESTS.map((req, i) => (
                      <div key={i} className="p-5 space-y-3 hover:bg-slate-50/50 transition-all cursor-pointer group">
                         <div className="flex justify-between items-start">
                            <div onClick={() => onModuleChange?.('profile')}>
                               <p className="text-sm font-bold text-slate-900 leading-none group-hover:text-indigo-600">{req.user}</p>
                               <div className="flex items-center gap-2 mt-1.5">
                                 <Badge className="bg-indigo-50 text-indigo-700 border-none shadow-none text-[9px] h-4">{req.type}</Badge>
                                 <span className="text-[10px] font-bold text-slate-400">{req.category}</span>
                               </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{req.time}</span>
                         </div>
                         <div className="flex gap-2">
                            <button className="flex-1 py-1.5 bg-slate-100 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-200 transition-colors">Assign</button>
                            <button className="flex-1 py-1.5 bg-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white hover:bg-emerald-700 transition-colors">Respond</button>
                         </div>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
