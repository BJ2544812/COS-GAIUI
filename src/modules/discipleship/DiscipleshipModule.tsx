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
  const [view, setView] = React.useState<'overview' | 'journey' | 'create-case'>('overview');

  if (view === 'create-case') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 text-left">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView('overview')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Initialize Care Protocol</h1>
            <p className="text-sm text-slate-500 font-medium tracking-tight">Document and track pastoral interventions, counsel, or prayer focus.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-2xl p-10 space-y-8 bg-white border border-slate-50">
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 font-sans">Primary Subject</label>
                    <input type="text" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-inner" placeholder="Enter member name..." />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 font-sans">Care Category</label>
                       <select className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 appearance-none shadow-inner">
                          <option>General Pastoral Care</option>
                          <option>Pre-Marital Counseling</option>
                          <option>Bereavement Support</option>
                          <option>Leadership Mentorship</option>
                          <option>Crisis Intervention</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 font-sans">Priority Level</label>
                       <select className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 appearance-none shadow-inner">
                          <option>Routine Follow-up</option>
                          <option>High Priority</option>
                          <option>Critical / Urgent</option>
                          <option>Confidential / Senior Oversight</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 font-sans">Observation & Initial Notes</label>
                    <textarea className="w-full h-40 bg-slate-50 border-none rounded-3xl p-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-inner resize-none" placeholder="Provide context for the care request or observation..."></textarea>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1 font-sans">Assigned Counselor / Leader</label>
                    <input type="text" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-inner" placeholder="Select from ministry staff..." />
                 </div>
              </div>

              <div className="pt-4 flex gap-4">
                 <Button className="flex-1 h-16 rounded-[2rem] bg-indigo-600 text-white hover:bg-indigo-700 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100" onClick={() => setView('overview')}>Register Case</Button>
                 <Button variant="ghost" className="px-8 h-16 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] font-sans" onClick={() => setView('overview')}>Cancel</Button>
              </div>
           </Card>

           <div className="space-y-6">
              <Card className="rounded-[2.5rem] bg-slate-900 text-white p-8 space-y-6 overflow-hidden relative shadow-2xl">
                 <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
                 <h3 className="font-black text-lg tracking-tight relative z-10">Privacy & Ethics</h3>
                 <p className="text-xs text-slate-400 leading-relaxed font-bold relative z-10 font-sans uppercase tracking-[0.1em]">"Counseling notes are cryptographically restricted. Visibility is limited to assigned staff and senior oversight."</p>
                 <div className="flex items-center gap-3 py-4 border-y border-white/10 relative z-10">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">GDPR/DPD Compliant Storage</span>
                 </div>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-sm p-8 text-left space-y-4 bg-slate-50 border border-slate-100">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">Recent Successes</h4>
                 <div className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                       <p className="text-xs font-bold text-slate-600 font-sans">Michael T. integrated into Small Group</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                       <p className="text-xs font-bold text-slate-600 font-sans">Williams family crisis stabilized</p>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'journey') {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 text-left">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setView('overview')} className="gap-2 px-0 hover:bg-transparent">
            <ArrowLeft className="w-5 h-5" /> <span className="font-black text-[10px] tracking-widest uppercase text-slate-400">Back back Care Hub</span>
          </Button>
          <Button className="bg-slate-950 text-white rounded-2xl h-12 px-8 font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 border-none shadow-xl">Configure Global Pathway</Button>
        </div>

        <div className="text-center space-y-3 mb-16">
           <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">The Spiritual Engine</h1>
           <p className="text-slate-500 font-bold max-w-xl mx-auto uppercase tracking-widest text-[10px]">Mapping the movement from first-encounter to leadership maturity.</p>
        </div>

        <div className="relative">
           {/* Connection Lines */}
           <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -translate-y-1/2 -z-10 hidden lg:block"></div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { 
                  label: 'CONNECT', 
                  title: 'Visitors', 
                  desc: 'Assimilation through high-touch hospitality and personal follow-up.',
                  icon: UserPlus,
                  color: 'text-blue-500',
                  bgColor: 'bg-blue-50',
                  metrics: '124 active'
                },
                { 
                  label: 'BELIEVE', 
                  title: 'Faith Path', 
                  desc: 'Foundational salvation classes and spiritual identity mentorship.',
                  icon: Heart,
                  color: 'text-rose-500',
                  bgColor: 'bg-rose-50',
                  metrics: '18 decisions'
                },
                { 
                  label: 'COMMIT', 
                  title: 'Core Life', 
                  desc: 'Integration into small group ecosystems and church membership.',
                  icon: Users,
                  color: 'text-indigo-500',
                  bgColor: 'bg-indigo-50',
                  metrics: '56 in class'
                },
                { 
                  label: 'SERVE', 
                  title: 'Send Out', 
                  desc: 'Empowering kingdom-first individuals to lead and serve locally.',
                  icon: Star,
                  color: 'text-amber-500',
                  bgColor: 'bg-amber-50',
                  metrics: '42 trainees'
                },
              ].map((step, i) => (
                <div key={i} className="space-y-8 group text-center">
                   <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-28 h-28 rounded-[2.5rem] bg-white shadow-2xl border border-slate-50 transition-all duration-700 flex items-center justify-center relative group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-indigo-100",
                        step.bgColor
                      )}>
                         <step.icon className={cn("w-12 h-12 transition-transform duration-500 group-hover:scale-110", step.color)} />
                         <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center text-white text-xs font-black ring-8 ring-white">
                            0{i + 1}
                         </div>
                      </div>
                   </div>
                   <Card className="border-none shadow-none text-center bg-transparent group-hover:px-4 transition-all">
                      <p className={cn("text-[10px] font-black uppercase tracking-[0.3em] mb-3", step.color)}>{step.label}</p>
                      <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight uppercase leading-none">{step.title}</h3>
                      <p className="text-[11px] text-slate-400 leading-relaxed mb-6 font-bold uppercase tracking-widest">{step.desc}</p>
                      <div className="pt-6 border-t border-slate-100 flex items-center justify-center gap-3">
                         <Target className="w-4 h-4 text-slate-200" />
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{step.metrics}</span>
                      </div>
                   </Card>
                </div>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-16">
           <Card className="rounded-[3rem] border-none shadow-2xl overflow-hidden bg-slate-950 text-white relative">
              <div className="absolute top-0 right-0 p-10 opacity-5"><Sparkles size={200} /></div>
              <CardHeader className="p-10 relative z-10">
                 <CardTitle className="flex items-center gap-3 text-2xl tracking-tight font-black uppercase">
                    <Zap className="w-6 h-6 text-indigo-400 fill-indigo-400" />
                    Predictive Intelligence
                 </CardTitle>
                 <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">AI suggests these 5 individuals are ready for their next spiritual milestone.</CardDescription>
              </CardHeader>
              <CardContent className="px-10 pb-10 space-y-4 relative z-10">
                 {['David Chen', 'Amanda Ross', 'Kevin Miller'].map((name, i) => (
                   <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/10 group hover:bg-white/10 transition-all cursor-pointer active:scale-95">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-black text-sm">{name[0]}</div>
                         <div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-white">{name}</span>
                            <div className="flex items-center gap-2 mt-1">
                               <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                               <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">94% Confidence</span>
                            </div>
                         </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-[9px] font-black text-indigo-400 hover:text-indigo-100 hover:bg-transparent uppercase tracking-widest p-0">Initialize Transition &rarr;</Button>
                   </div>
                 ))}
              </CardContent>
           </Card>

           <Card className="rounded-[3rem] border-none shadow-xl p-12 flex flex-col justify-center items-center text-center space-y-6 bg-white border border-slate-50">
              <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                 <ShieldCheck className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Automation Engine</h3>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto">Configure smart triggers for immediate pastoral alerts based on attendance patterns.</p>
              </div>
              <Button variant="outline" className="rounded-2xl px-10 h-14 font-black tracking-[0.2em] text-[10px] uppercase border-slate-200 hover:bg-slate-50">Configure Neural Triggers</Button>
           </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 text-left">
       <div className="flex justify-between items-end">
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">Pastoral Intelligence</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] pl-1">Monitoring spiritual health, care workflows, and kingdom expansion.</p>
        </div>
        <button 
          onClick={() => setView('create-case')}
          className="flex items-center gap-3 px-8 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black hover:bg-slate-900 shadow-2xl transition-all active:scale-95 uppercase tracking-[0.22em] font-sans border-none"
        >
          <Plus className="w-5 h-5" />
          Initialize New Case
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STAGES.map((stage, i) => (
          <Card key={i} className="border-none shadow-xl h-full group hover:shadow-2xl transition-all cursor-pointer bg-white rounded-[2.5rem] active:scale-[0.98] overflow-hidden">
            <CardContent className="p-8">
               <div className="flex justify-between items-start mb-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-indigo-600 transition-colors">{stage.name}</p>
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <stage.icon className="w-5 h-5" />
                  </div>
               </div>
               <div className="flex items-baseline gap-2 mb-4">
                 <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{stage.count}</h3>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Souls</span>
               </div>
               <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                 <div className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    i === 0 ? "bg-blue-500 w-[80%]" : i === 1 ? "bg-emerald-500 w-[60%]" : i === 2 ? "bg-indigo-500 w-[40%]" : "bg-amber-500 w-[30%]"
                 )}></div>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <Card className="border-none shadow-xl overflow-hidden rounded-[3rem] bg-white">
              <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between bg-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-10 opacity-5 scale-150 rotate-12"><Activity size={100} /></div>
                 <div className="relative z-10 space-y-1">
                    <CardTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Spiritual Growth Pathways</CardTitle>
                    <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Movement through high-frequency care stages</CardDescription>
                 </div>
                 <Button 
                   onClick={() => setView('journey')}
                   className="text-[10px] font-black text-indigo-600 hover:text-white transition-all uppercase tracking-widest px-6 h-11 bg-indigo-50 hover:bg-indigo-600 rounded-xl shadow-sm border-none relative z-10"
                 >
                   View Journey Map
                 </Button>
              </CardHeader>
              <CardContent className="p-12">
                 <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {[
                      { icon: UserPlus, label: 'Connect', color: 'text-blue-500' },
                      { icon: ShieldCheck, label: 'Grow', color: 'text-emerald-500' },
                      { icon: Heart, label: 'Serve', color: 'text-rose-500' },
                      { icon: Star, label: 'Lead', color: 'text-amber-500' }
                    ].map((step, i) => (
                      <React.Fragment key={i}>
                        <div className="flex flex-col items-center gap-4 group cursor-pointer active:scale-95 transition-all">
                           <div className="w-20 h-20 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-xl group-hover:shadow-indigo-100 group-hover:rotate-3">
                             <step.icon className="w-10 h-10" />
                           </div>
                           <p className={cn("text-[10px] font-black group-hover:text-indigo-600 transition-colors uppercase tracking-[0.25em] font-sans", step.color)}>{step.label}</p>
                        </div>
                        {i < 3 && <ChevronRight className="w-6 h-6 text-slate-100 hidden md:block" />}
                      </React.Fragment>
                    ))}
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-xl rounded-[3rem] bg-white overflow-hidden">
              <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between bg-white">
                 <div className="space-y-1">
                    <CardTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase">Pastoral Care Alerts</CardTitle>
                    <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">High-touch cases requiring immediate oversight</CardDescription>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-rose-600 animate-ping"></div>
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">3 Priority Cases</span>
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="divide-y divide-slate-50">
                    {[
                      { name: 'Michael Thompson', reason: 'Attendance drop (> 3 weeks)', risk: 'Critical', color: 'text-rose-600 bg-rose-50' },
                      { name: 'The Williams Family', reason: 'Repeated crisis prayer requests', risk: 'Elevated', color: 'text-amber-600 bg-amber-50' },
                      { name: 'Deborah Vance', reason: 'Leadership burnout indicators', risk: 'Routine', color: 'text-indigo-600 bg-indigo-50' },
                    ].map((care, i) => (
                      <div key={i} className="flex items-center justify-between px-10 py-8 hover:bg-slate-50 transition-all group active:bg-slate-100">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all text-xl shadow-inner">{care.name.charAt(0)}</div>
                            <div onClick={() => onModuleChange?.('profile')} className="cursor-pointer space-y-1">
                               <p className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{care.name}</p>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{care.reason}</p>
                            </div>
                         </div>
                         <Badge className={cn(
                            "rounded-full px-4 py-1.5 border-none font-black text-[9px] uppercase tracking-widest shadow-sm",
                            care.color
                         )}>{care.risk} RESPONSE</Badge>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </div>

        <div className="space-y-8">
           <Card className="border-none shadow-2xl bg-white h-full rounded-[3rem] overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/50">
                 <CardTitle className="text-[10px] font-black text-slate-800 uppercase tracking-[0.25em] leading-none mb-1 font-sans">Inbound Care Stream</CardTitle>
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Real-time ministry requests</p>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="divide-y divide-slate-50">
                    {RECENT_REQUESTS.map((req, i) => (
                      <div key={i} className="p-8 space-y-6 hover:bg-slate-50/50 transition-all cursor-pointer group active:bg-slate-50">
                         <div className="flex justify-between items-start">
                            <div onClick={() => onModuleChange?.('profile')} className="space-y-2">
                               <p className="text-lg font-black text-slate-900 leading-none group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{req.user}</p>
                               <div className="flex items-center gap-3">
                                 <Badge className="bg-slate-950 text-white border-none shadow-none text-[8px] font-black px-2 py-0 h-4 uppercase tracking-widest">{req.type}</Badge>
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{req.category}</span>
                               </div>
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{req.time}</span>
                         </div>
                         <div className="flex gap-3 pt-2">
                            <button className="flex-1 h-11 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-white hover:text-indigo-600 transition-all active:scale-95 shadow-sm">Route Box</button>
                            <button className="flex-1 h-11 bg-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest text-white hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100">Care Pack</button>
                         </div>
                      </div>
                    ))}
                 </div>
                 <div className="p-8">
                   <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-transparent">View Archived Care Streams</Button>
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
