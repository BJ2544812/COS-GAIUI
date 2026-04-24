import React from 'react';
import { 
  Globe, 
  Eye, 
  Edit3, 
  Settings, 
  ExternalLink, 
  Monitor, 
  Smartphone, 
  Layout, 
  Star,
  MousePointer2,
  Navigation,
  Image as ImageIcon,
  Palette,
  Layers,
  ChevronRight,
  Share2,
  Lock,
  ArrowUpRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

export function WebsiteModule() {
  const [activeTab, setActiveTab] = React.useState('Pages');
  const [device, setDevice] = React.useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-none">Public Digital Platform</h1>
          <p className="text-slate-500 font-medium tracking-tight mt-1">Design and publish your outward-facing portal, sermon library, and event gates.</p>
        </div>
        <div className="flex gap-3">
          <button className="h-11 flex items-center gap-2 px-6 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm active:scale-95">
            <Eye className="w-4 h-4" />
            Live View
          </button>
          <button className="h-11 flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all uppercase tracking-widest active:scale-95 border-none">
            <Share2 className="w-4 h-4" />
            Publish
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-3 space-y-6">
            <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden p-3 bg-white">
               <div className="space-y-1 mb-4 p-4 pt-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Site Designer</p>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Main Portal</h3>
               </div>
               <div className="space-y-1">
                  {[
                    { name: 'Pages & Hierarchy', icon: Layers },
                    { name: 'Theme & Palette', icon: Palette },
                    { name: 'Menu Navigation', icon: Navigation },
                    { name: 'Media Vault', icon: ImageIcon },
                    { name: 'SEO & Performance', icon: Zap },
                    { name: 'Site Settings', icon: Settings },
                  ].map((item, i) => (
                    <button 
                      key={i} 
                      onClick={() => setActiveTab(item.name)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl text-xs font-bold transition-all group",
                        activeTab === item.name ? "bg-slate-950 text-white shadow-xl shadow-slate-200" : "hover:bg-slate-50 text-slate-500"
                      )}
                    >
                       <div className="flex items-center gap-3">
                          <item.icon size={16} className={activeTab === item.name ? "text-indigo-400" : "text-slate-300 group-hover:text-indigo-500"} />
                          <span>{item.name}</span>
                       </div>
                       <ChevronRight className={cn("w-3.5 h-3.5 transition-all opacity-0", activeTab === item.name && "opacity-100 translate-x-1")} />
                    </button>
                  ))}
               </div>
            </Card>

            <Card className="rounded-[2.5rem] border-none bg-indigo-600 text-white p-8 overflow-hidden relative group cursor-pointer shadow-xl shadow-indigo-100 ring-4 ring-white">
               <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
               <div className="relative z-10 space-y-6">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                     <Sparkles className="w-5 h-5 text-indigo-200" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black leading-tight tracking-tight">AI Content Assistant</h4>
                    <p className="text-[11px] text-indigo-100 font-medium leading-relaxed mt-2 opacity-80 italic">Ready to generate SEO-optimized copy for your latest sermon series page.</p>
                  </div>
                  <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border-none transition-all active:scale-95 shadow-xl shadow-indigo-900/40">Launch Writer</Button>
               </div>
            </Card>
         </div>

         <div className="lg:col-span-9 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center bg-slate-50 p-2 rounded-3xl border border-slate-100 shadow-inner gap-4">
               <div className="flex items-center gap-4 px-4">
                  <div className="flex gap-1.5 leading-none">
                     <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                     <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                  </div>
                  <div className="h-4 w-px bg-slate-200 mx-2"></div>
                  <div className="flex bg-white px-4 py-2 rounded-xl border border-slate-200 text-[10px] font-mono font-bold text-slate-400 items-center gap-2 shadow-sm min-w-[280px]">
                     <Lock size={10} className="text-emerald-500" />
                     <span className="truncate">gracecommunity.org/en/preview-hero</span>
                  </div>
               </div>
               <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <button 
                    onClick={() => setDevice('desktop')}
                    className={cn("p-3 rounded-xl transition-all", device === 'desktop' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50")}
                  >
                    <Monitor size={14} />
                  </button>
                  <button 
                    onClick={() => setDevice('mobile')}
                    className={cn("p-3 rounded-xl transition-all", device === 'mobile' ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:bg-slate-50")}
                  >
                    <Smartphone size={14} />
                  </button>
               </div>
            </div>

            <div className={cn(
              "mx-auto transition-all duration-700 ease-in-out bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden relative flex flex-col group/preview",
              device === 'desktop' ? "w-full aspect-[16/10]" : "w-[375px] aspect-[9/19] rounded-[2.5rem]"
            )}>
               <div className="h-20 border-b border-slate-50 flex items-center justify-between px-10 shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center text-white font-black text-xs">G</div>
                  {device === 'desktop' ? (
                    <div className="flex gap-8">
                       {['Mission', 'Events', 'Sermons', 'Give'].map(nav => (
                         <div key={nav} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors cursor-pointer">{nav}</div>
                       ))}
                    </div>
                  ) : null}
                  <div className="w-24 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase tracking-widest">Connect</div>
               </div>
               
               <div className="flex-1 relative overflow-y-auto overflow-x-hidden custom-scrollbar">
                  <div className={cn(
                    "flex flex-col items-center justify-center text-center space-y-10 py-32 px-12",
                    device === 'mobile' && "py-20 px-6"
                  )}>
                     <div className="space-y-4 max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <Badge className="bg-indigo-50 text-indigo-600 border-none px-4 py-1.5 font-black uppercase text-[9px] tracking-[0.2em] mb-4">Latest Series: Deep Waters</Badge>
                        <h2 className={cn(
                          "font-black text-slate-900 tracking-tighter leading-[0.9]",
                          device === 'desktop' ? "text-7xl" : "text-4xl"
                        )}>
                          Welcome to the <span className="text-indigo-600">House</span> of Grace
                        </h2>
                        <p className={cn(
                          "text-slate-400 font-medium leading-relaxed max-w-lg mx-auto",
                          device === 'desktop' ? "text-lg pt-4" : "text-sm pt-2"
                        )}>
                          Join us this Sunday as we continue our journey through the Gospel of John. Experience worship that moves the soul.
                        </p>
                     </div>
                     <div className={cn("flex gap-4 w-full justify-center", device === 'mobile' && "flex-col")}>
                        <button className="h-16 px-10 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-indigo-200 active:scale-95 transition-all">Join us Online</button>
                        <button className="h-16 px-10 bg-white border border-slate-100 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-sm active:scale-95 transition-all">Visit Downtown</button>
                     </div>
                  </div>

                  {/* Section indicator */}
                  <div className="mt-12 px-10">
                     <div className="grid grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="aspect-[4/5] bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4 group/card hover:bg-white hover:shadow-xl transition-all">
                             <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-300 group-hover/card:bg-indigo-600 group-hover/card:text-white transition-all shadow-sm">
                                <Layout size={20} />
                             </div>
                             <div className="space-y-1">
                                <div className="h-3 w-20 bg-slate-200 rounded-full mx-auto"></div>
                                <div className="h-2 w-12 bg-slate-100 rounded-full mx-auto"></div>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
               
               <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/preview:opacity-100 transition-all duration-300 flex items-center justify-center cursor-default backdrop-blur-[4px] z-50">
                  <button className="flex items-center gap-3 px-8 py-4 bg-white text-slate-900 font-black rounded-2xl shadow-2xl transform scale-90 group-hover/preview:scale-100 transition-all duration-500 uppercase text-[10px] tracking-widest">
                     <Edit3 size={18} className="text-indigo-600" />
                     Edit Hero Component
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
