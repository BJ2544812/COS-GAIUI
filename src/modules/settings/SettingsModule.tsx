import React from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Lock, 
  Bell, 
  Database, 
  Globe, 
  Keyboard, 
  ShieldCheck,
  Mail,
  Smartphone,
  ChevronRight,
  Palette,
  Cloud,
  HeartHandshake,
  CreditCard,
  Target,
  FileKey,
  Shield,
  Activity,
  Zap,
  Users,
  Search,
  Check,
  ArrowRight,
  Cpu,
  Fingerprint,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Separator } from '@/src/components/ui/separator';
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/utils';

type SettingSection = 'general' | 'security' | 'notifications' | 'integrations' | 'payments' | 'branding';

export function SettingsModule() {
  const [activeSection, setActiveSection] = React.useState<SettingSection>('general');

  const sidebarItems = [
    { id: 'general', label: 'General', icon: SettingsIcon, description: 'Org info & localization' },
    { id: 'security', label: 'Security', icon: Lock, description: 'Auth & access control' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alerts & communications' },
    { id: 'integrations', label: 'Integrations', icon: Cloud, description: 'Connected services' },
    { id: 'payments', label: 'Payments', icon: CreditCard, description: 'Financial & Giving config' },
    { id: 'branding', label: 'Branding', icon: Palette, description: 'Visual identity' },
  ];

  const [settings, setSettings] = React.useState({
    org_name: '',
    address: '',
    email: '',
    phone: ''
  });

  React.useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = data.reduce((acc: any, curr: any) => {
          acc[curr.key] = curr.value;
          return acc;
        }, {});
        setSettings({
          org_name: mapped.org_name || '',
          address: mapped.address || '',
          email: mapped.email || '',
          phone: mapped.phone || ''
        });
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-1000 text-left pb-24 px-4">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <Badge className="bg-indigo-50 text-indigo-600 border-indigo-100 font-black text-[9px] uppercase tracking-[0.2em] px-4 py-1 mb-2">System v4.0.2 Stable</Badge>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 uppercase leading-none">Settings <span className="text-indigo-600 tracking-[-0.1em] ml-1">&</span> Architecture</h1>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] pl-1">Scalable infrastructure & organizational orchestration</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" className="flex-1 md:flex-none h-12 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest border-slate-200 hover:bg-slate-50">
            Export Manifest
          </Button>
          <Button className="flex-1 md:flex-none h-12 rounded-2xl px-8 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-slate-200 group">
            Push All Changes <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-12 text-left">
        {/* Navigation Sidebar */}
        <aside className="space-y-4">
          <div className="p-1.5 bg-slate-100 rounded-[2.5rem] space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as SettingSection)}
                className={cn(
                  "w-full flex items-center gap-5 p-4 rounded-[2rem] transition-all duration-500 text-left border-none relative overflow-hidden group",
                  activeSection === item.id 
                    ? "bg-white shadow-xl shadow-slate-200/50" 
                    : "hover:bg-white/50 opacity-60 hover:opacity-100"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-inner shrink-0",
                  activeSection === item.id 
                    ? "bg-indigo-600 text-white rotate-6 shadow-lg shadow-indigo-100" 
                    : "bg-slate-200/50 text-slate-400 group-hover:bg-white transition-all group-hover:rotate-12"
                )}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className={cn(
                    "font-black uppercase tracking-widest text-[12px]",
                    activeSection === item.id ? "text-slate-950" : "text-slate-500"
                  )}>{item.label}</p>
                  <p className="text-[10px] font-bold text-slate-400 leading-none truncate w-40">{item.description}</p>
                </div>
                {activeSection === item.id && (
                  <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          <Card className="rounded-[2.5rem] border-none shadow-sm bg-indigo-50/50 p-8 border-indigo-100 border relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10"><Cpu size={100} /></div>
             <div className="space-y-4 relative z-10">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Environment Analytics</p>
                <div className="space-y-4">
                   <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                         <span>Compute Load</span>
                         <span>12%</span>
                      </div>
                      <div className="h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-500 w-[12%]" />
                      </div>
                   </div>
                   <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                         <span>API Latency</span>
                         <span>42ms</span>
                      </div>
                      <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 w-[15%]" />
                      </div>
                   </div>
                </div>
             </div>
          </Card>
        </aside>

        {/* Dynamic Content Sections */}
        <main className="space-y-12">
          {activeSection === 'general' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="rounded-[3rem] border-none shadow-2xl bg-white p-10 space-y-10">
                     <div className="space-y-2">
                        <h3 className="text-3xl font-black text-slate-950 tracking-tighter uppercase leading-none">Nexus Protocol</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Core organizational heartbeat</p>
                     </div>
                     <div className="grid gap-8">
                        <div className="space-y-3">
                           <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Entity Display Name</label>
                           <Input 
                              value={settings.org_name} 
                              onChange={(e) => setSettings({...settings, org_name: e.target.value})}
                              className="h-14 bg-slate-50 border-none rounded-[1.5rem] px-6 font-bold text-slate-900 shadow-inner focus:ring-2 focus:ring-indigo-500 transition-all" 
                           />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Operations HQ</label>
                           <Input 
                              value={settings.address} 
                              onChange={(e) => setSettings({...settings, address: e.target.value})}
                              className="h-14 bg-slate-50 border-none rounded-[1.5rem] px-6 font-bold text-slate-900 shadow-inner focus:ring-2 focus:ring-indigo-500 transition-all" 
                           />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-3">
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Comms Endpoint</label>
                              <Input 
                                value={settings.email} 
                                onChange={(e) => setSettings({...settings, email: e.target.value})}
                                className="h-14 bg-slate-50 border-none rounded-[1.5rem] px-6 font-bold text-slate-900 shadow-inner focus:ring-2 focus:ring-indigo-500 transition-all" 
                              />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Legacy Phone</label>
                              <Input 
                                value={settings.phone} 
                                onChange={(e) => setSettings({...settings, phone: e.target.value})}
                                className="h-14 bg-slate-50 border-none rounded-[1.5rem] px-6 font-bold text-slate-900 shadow-inner focus:ring-2 focus:ring-indigo-500 transition-all" 
                              />
                           </div>
                        </div>
                     </div>
                     <Button className="w-full h-14 rounded-[1.5rem] bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Save Core Attributes</Button>
                  </Card>

                  <div className="space-y-8">
                     <Card className="rounded-[3rem] border-none shadow-2xl bg-slate-950 text-white p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform"><Globe size={200} /></div>
                        <div className="space-y-4 relative z-10">
                           <h3 className="text-2xl font-black tracking-tight uppercase leading-none">Localization</h3>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Global system resonance</p>
                        </div>
                        <div className="space-y-6 pt-10 relative z-10">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Geographic Timezone</label>
                              <div className="h-14 bg-white/5 border border-white/10 rounded-2xl px-6 flex items-center font-bold text-sm text-indigo-300">
                                 (GMT+05:30) IST - Mumbai/Delhi
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Native Currency</label>
                              <div className="h-14 bg-white/5 border border-white/10 rounded-2xl px-6 flex items-center font-bold text-sm text-indigo-300">
                                 INR (₹) - Standard Indian Rupee
                              </div>
                           </div>
                        </div>
                     </Card>

                     <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 flex items-center justify-between group cursor-pointer hover:bg-slate-50 transition-all">
                        <div className="flex items-center gap-5">
                           <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg group-hover:rotate-12 group-hover:shadow-indigo-100">
                              <Database className="w-7 h-7" />
                           </div>
                           <div className="space-y-0.5">
                              <p className="text-[13px] font-black uppercase tracking-widest text-slate-950">Cloud Residency</p>
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">ap-south-1 (Mumbai)</p>
                           </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all group-hover:translate-x-1">
                           <ChevronRight className="w-5 h-5" />
                        </div>
                     </Card>
                  </div>
               </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <Card className="md:col-span-2 rounded-[3rem] border-none shadow-2xl bg-white p-12 space-y-12">
                     <div className="flex justify-between items-start">
                        <div className="space-y-2">
                           <h3 className="text-4xl font-black text-slate-950 tracking-tighter uppercase leading-none">Security Stack</h3>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Multi-layered access orchestration</p>
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-widest border-none px-6 py-2 shadow-lg shadow-emerald-100 ring-4 ring-emerald-50">
                           SHIELD V2 ACTIVE
                        </Badge>
                     </div>

                     <div className="grid gap-6">
                        {[
                          { title: 'Biometric MFA', desc: 'Hardware-level authentication tokens required for all staff logins.', status: true, icon: Fingerprint, color: 'text-indigo-600 bg-indigo-50' },
                          { title: 'Session Entropy', desc: 'Dynamic session invalidation after 45 minutes of idle state.', status: false, icon: Clock, color: 'text-amber-600 bg-amber-50' },
                          { title: 'Nexus Guard', desc: 'Allowlisted IP access control for administrative endpoints.', status: true, icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50' },
                          { title: 'Encryption At Rest', desc: 'AES-256 binary encryption for all sensitive member attributes.', status: true, icon: Lock, color: 'text-blue-600 bg-blue-50' }
                        ].map((p, i) => (
                          <div key={i} className="flex items-center justify-between p-8 rounded-[2rem] border border-slate-50 hover:bg-slate-50 transition-all duration-500 group">
                             <div className="flex items-center gap-6">
                                <div className={cn(
                                  "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 shadow-xl group-hover:rotate-6",
                                  p.status ? "bg-slate-950 text-white shadow-slate-200" : "bg-white text-slate-300 border border-slate-100"
                                )}>
                                   <p.icon className="w-7 h-7" />
                                </div>
                                <div className="space-y-1">
                                   <p className="font-black uppercase tracking-widest text-slate-900 text-sm leading-none">{p.title}</p>
                                   <p className="text-[11px] font-bold text-slate-400 leading-tight pr-12">{p.desc}</p>
                                </div>
                             </div>
                             <div className={cn(
                               "w-14 h-7 rounded-full relative cursor-pointer shadow-inner transition-all duration-500",
                               p.status ? "bg-indigo-600" : "bg-slate-200"
                             )}>
                                <div className={cn(
                                  "absolute top-1 w-5 h-5 rounded-full bg-white shadow-xl transition-all duration-500",
                                  p.status ? "right-1" : "left-1"
                                )} />
                             </div>
                          </div>
                        ))}
                     </div>
                  </Card>

                  <div className="space-y-8">
                     <Card className="rounded-[3rem] border-none shadow-2xl bg-indigo-600 text-white p-10 space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-20"><Shield size={200} /></div>
                        <div className="space-y-4 relative z-10">
                           <h4 className="text-2xl font-black tracking-tight uppercase leading-none">Compliance</h4>
                           <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Regulatory Health Engine</p>
                        </div>
                        <div className="space-y-8 relative z-10 pt-4">
                           <div className="space-y-3">
                              <div className="flex justify-between text-[11px] font-black uppercase">
                                 <span>Security Score</span>
                                 <span className="text-emerald-300">98%</span>
                              </div>
                              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden shadow-inner">
                                 <div className="h-full bg-white w-[98%] shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                              </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                                 <p className="text-[9px] font-black text-indigo-300 uppercase">Risk Level</p>
                                 <p className="text-xs font-black uppercase">Negligible</p>
                              </div>
                              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
                                 <p className="text-[9px] font-black text-indigo-300 uppercase">Audit Status</p>
                                 <p className="text-xs font-black uppercase">Passing</p>
                              </div>
                           </div>
                        </div>
                     </Card>

                     <Card className="rounded-[3rem] border-none shadow-xl bg-white p-10 space-y-6">
                        <div className="space-y-2">
                           <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-400">Master Kill-Switch</h4>
                           <p className="text-[10px] font-bold text-slate-400 leading-tight">Revoke all sessions and force system-wide re-authentication.</p>
                        </div>
                        <Button className="w-full h-16 rounded-[1.5rem] bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-rose-100 transition-all active:scale-95">
                           Initiate Lockdown
                        </Button>
                     </Card>
                  </div>
               </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
               <Card className="rounded-[4rem] border-none shadow-3xl bg-white p-16">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-16">
                     <div className="space-y-2">
                        <h3 className="text-5xl font-black text-slate-950 tracking-tighter uppercase leading-none">Signal Ops</h3>
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] pl-1">Intelligent delivery orchestration</p>
                     </div>
                     <Button className="h-14 bg-slate-950 text-white rounded-[1.5rem] px-10 font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-slate-200 hover:bg-indigo-600 transition-all group">
                        Manage Global Templates <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1" />
                     </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     {[
                       { type: 'Financial Events', desc: 'Inbound tithes, budget alerts, audit workflows.', deliver: 'Immediate', ch: ['Email', 'SMS'], icon: CreditCard, color: 'text-emerald-500 bg-emerald-50' },
                       { type: 'Member Insights', desc: 'Predictive churn alerts, spiritual growth shifts.', deliver: 'Real-time', ch: ['Push'], icon: Users, color: 'text-indigo-500 bg-indigo-50' },
                       { type: 'Environmental Status', desc: 'Compute health, API latency, cluster status.', deliver: 'Continuous', ch: ['Push', 'Email'], icon: Zap, color: 'text-amber-500 bg-amber-50' },
                       { type: 'Global Comms', desc: 'Ministry wide broadcasts and newsletters.', deliver: 'Scheduled', ch: ['Email'], icon: Mail, color: 'text-rose-500 bg-rose-50' }
                     ].map((h, i) => (
                       <div key={i} className="p-10 rounded-[3.5rem] border border-slate-50 bg-slate-50/30 hover:bg-white hover:shadow-2xl transition-all duration-700 group border-none">
                          <div className="flex justify-between items-start mb-8">
                             <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all group-hover:rotate-12", h.color)}>
                                <h.icon className="w-7 h-7" />
                             </div>
                             <div className="flex flex-col gap-2 items-end">
                                <Badge className="bg-slate-950 text-white border-none text-[8px] font-black uppercase px-2 py-0.5 tracking-widest h-5">{h.deliver}</Badge>
                                <div className="flex gap-2">
                                   {h.ch.map(c => <span key={c} className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c}</span>)}
                                </div>
                             </div>
                          </div>
                          <div className="space-y-3">
                             <h4 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase leading-none">{h.type}</h4>
                             <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">{h.desc}</p>
                          </div>
                          <div className="pt-8 border-t border-slate-100 flex justify-between items-center mt-8">
                             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active routing policy</span>
                             <Button variant="ghost" className="p-0 h-auto text-[9px] font-black uppercase text-indigo-400 hover:text-indigo-600 hover:bg-transparent">Refine Logic &rarr;</Button>
                          </div>
                       </div>
                     ))}
                  </div>
               </Card>
            </div>
          )}

          {activeSection === 'integrations' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[
                    { name: 'Stripe', status: 'Online', desc: 'Secure payment layer for Cross-Border giving.', logo: 'ST', color: 'bg-white text-indigo-600' },
                    { name: 'Razorpay', status: 'Optimal', desc: 'India-native payment orchestration.', logo: 'RP', color: 'bg-indigo-600 text-white' },
                    { name: 'Google Cloud', status: 'Optimal', desc: 'Infrastructure & AI core services.', logo: 'GC', color: 'bg-slate-950 text-white' },
                    { name: 'Twilio', status: 'Optimal', desc: 'Global SMS & Communication bridge.', logo: 'TW', color: 'bg-rose-500 text-white' },
                    { name: 'Planning Center', status: 'Sync Ready', desc: 'Ministry lifecycle management.', logo: 'PC', color: 'bg-emerald-500 text-white' },
                    { name: 'Mailchimp', status: 'Pending', desc: 'Segmented audience engagement.', logo: 'MC', color: 'bg-amber-400 text-slate-950' },
                  ].map((int, i) => (
                    <Card key={i} className="rounded-[2.5rem] border-none shadow-xl bg-white p-8 flex flex-col justify-between group hover:shadow-2xl transition-all duration-500">
                       <div className="space-y-6">
                          <div className="flex justify-between items-start">
                             <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all group-hover:scale-110", int.color)}>
                                {int.logo}
                             </div>
                             <Badge className={cn(
                               "text-[8px] font-black uppercase px-2 py-0.5 border-none",
                               int.status === 'Online' || int.status === 'Optimal' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                             )}>{int.status}</Badge>
                          </div>
                          <div className="space-y-1.5">
                             <h4 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase leading-none truncate">{int.name}</h4>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed pr-4 line-clamp-2">{int.desc}</p>
                          </div>
                       </div>
                       <Button variant="ghost" className="w-full mt-6 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-50 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">Manage Endpoint</Button>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          {activeSection === 'payments' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
               <Card className="rounded-[4rem] border-none shadow-2xl bg-white p-16 space-y-16">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-4">
                     <div className="space-y-2">
                        <h3 className="text-5xl font-black text-slate-950 tracking-tighter uppercase leading-none">Giving Pipeline</h3>
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] pl-1">Financial architecture & regulatory compliance</p>
                     </div>
                     <div className="flex items-center gap-4 p-5 bg-indigo-50 rounded-[2rem] border border-indigo-100 ring-8 ring-indigo-50/30">
                        <ShieldCheck className="w-8 h-8 text-indigo-600" />
                        <div className="text-left">
                           <p className="text-[11px] font-black text-indigo-900 uppercase tracking-widest">PCI-DSS Secured</p>
                           <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">v4.0 Compliant Hub</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                     <div className="space-y-8">
                        <div className="space-y-4">
                           <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Domestic Gateway (India)</label>
                           <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-50 hover:bg-white hover:shadow-2xl transition-all duration-700 cursor-pointer group relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-8 opacity-5"><Zap size={100} /></div>
                              <div className="flex flex-col gap-6 relative z-10">
                                 <div className="flex justify-between items-start">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center font-black text-white text-xl shadow-xl shadow-indigo-100 group-hover:rotate-6 transition-all">RP</div>
                                    <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black uppercase px-2 py-0.5 tracking-widest">Live Active</Badge>
                                 </div>
                                 <div className="space-y-1">
                                    <h4 className="text-2xl font-black text-slate-950 uppercase tracking-tight">Razorpay Nexus</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Integrated for Credits, Debits, UPI & NetBanking orchestration.</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">Cross-Border Hub</label>
                           <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-50 hover:bg-white hover:shadow-2xl transition-all duration-700 cursor-pointer group relative overflow-hidden opacity-60">
                              <div className="absolute top-0 right-0 p-8 opacity-5"><Globe size={100} /></div>
                              <div className="flex flex-col gap-6 relative z-10">
                                 <div className="flex justify-between items-start">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center font-black text-white text-xl shadow-xl shadow-slate-200 transition-all">ST</div>
                                    <Badge variant="outline" className="text-slate-400 border-slate-200 text-[8px] font-black uppercase px-2 py-0.5 tracking-widest">Configuration Required</Badge>
                                 </div>
                                 <div className="space-y-1">
                                    <h4 className="text-2xl font-black text-slate-950 uppercase tracking-tight">Stripe Connect</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Global giving infrastructure for international support base.</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-8">
                        <Card className="rounded-[3rem] border-none shadow-3xl bg-slate-950 text-white p-12 space-y-10 relative overflow-hidden">
                           <div className="absolute top-0 left-0 p-8 opacity-5 -translate-x-12"><HeartHandshake size={300} /></div>
                           <div className="space-y-2 relative z-10">
                              <h4 className="text-3xl font-black tracking-tight uppercase leading-none">Tax-Exempt (80G)</h4>
                              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Automated Section 80G receipting model</p>
                           </div>
                           <div className="space-y-8 relative z-10">
                              {[
                                { label: 'Form 10 Validation', status: 'Authorized', icon: Check },
                                { label: 'PAN Integration', status: 'Synchronized', icon: Zap },
                                { label: 'Digital Ceritificates', status: 'Encryption Active', icon: FileKey }
                              ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 transition-all cursor-pointer">
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-400">
                                         <item.icon className="w-5 h-5" />
                                      </div>
                                      <span className="text-[11px] font-black uppercase text-slate-300">{item.label}</span>
                                   </div>
                                   <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{item.status}</span>
                                </div>
                              ))}
                           </div>
                           <Button className="w-full h-16 rounded-[2rem] bg-indigo-600 text-white font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-indigo-900/50 hover:bg-indigo-700 transition-all active:scale-95">
                              Push Tax Config Update
                           </Button>
                        </Card>
                     </div>
                  </div>
               </Card>
            </div>
          )}

          {activeSection === 'branding' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <Card className="rounded-[4rem] border-none shadow-2xl bg-white p-16 space-y-16">
                     <div className="space-y-2">
                        <h3 className="text-5xl font-black text-slate-950 tracking-tighter uppercase leading-none">Aesthetic Core</h3>
                        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] pl-1">Visual identity and brand orchestration</p>
                     </div>

                     <div className="space-y-12">
                        <section className="space-y-6">
                           <div className="flex justify-between items-end">
                              <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Color Spectrum</h4>
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Custom Palette V2</span>
                           </div>
                           <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-4">
                                 <label className="text-[10px] font-black uppercase text-slate-900">Primary Core</label>
                                 <div className="flex gap-4">
                                    <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 shadow-2xl shadow-indigo-100 flex items-center justify-center text-white ring-1 ring-white/20 ring-offset-4 ring-offset-white">
                                       <Palette className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                       <p className="text-xs font-black text-slate-900 uppercase">#4F46E5</p>
                                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">IRIS DEEP CORE</p>
                                    </div>
                                 </div>
                              </div>
                              <div className="space-y-4">
                                 <label className="text-[10px] font-black uppercase text-slate-900">Accent Energy</label>
                                 <div className="flex gap-4">
                                    <div className="w-20 h-20 rounded-[2rem] bg-emerald-500 shadow-2xl shadow-emerald-100 flex items-center justify-center text-white ring-1 ring-white/20 ring-offset-4 ring-offset-white">
                                       <Zap className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                       <p className="text-xs font-black text-slate-900 uppercase">#10B981</p>
                                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">VITAL EMERALD</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </section>

                        <section className="space-y-6">
                           <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Symbolic Identity</h4>
                           <div className="p-20 border-3 border-dashed border-slate-100 rounded-[4rem] bg-slate-50 flex flex-col items-center justify-center gap-6 group hover:border-indigo-200 transition-all duration-700 cursor-pointer">
                              <div className="w-28 h-28 rounded-[2.5rem] bg-white shadow-3xl shadow-slate-200 flex items-center justify-center text-slate-200 group-hover:text-indigo-600 group-hover:rotate-12 group-hover:scale-110 transition-all">
                                 <FileKey className="w-12 h-12" />
                              </div>
                              <div className="text-center space-y-2">
                                 <p className="text-sm font-black text-slate-950 uppercase">Upload Vector Nexus</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Accepts SVG, PDF or high-fidelity PNG</p>
                              </div>
                           </div>
                        </section>
                     </div>
                  </Card>

                  <div className="space-y-8">
                     <Card className="rounded-[4rem] border-none shadow-3xl bg-slate-100 p-12 space-y-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-30"><Palette size={200} /></div>
                        <div className="space-y-2 relative z-10">
                           <h4 className="text-3xl font-black tracking-tighter uppercase leading-none">Live UI Nexus</h4>
                           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Real-time aesthetic convergence</p>
                        </div>
                        <div className="relative z-10 p-10 bg-white rounded-[3rem] shadow-3xl space-y-6 border border-slate-200/50 overflow-hidden transform scale-110">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-indigo-600 shadow-xl shadow-indigo-100" />
                              <div className="h-4 w-32 bg-slate-100 rounded-full" />
                           </div>
                           <div className="space-y-3">
                              <div className="h-4 w-full bg-slate-50 rounded-lg" />
                              <div className="h-4 w-[60%] bg-slate-50 rounded-lg" />
                           </div>
                           <div className="h-12 w-full bg-indigo-600 rounded-2xl shadow-2xl shadow-indigo-200 flex items-center justify-center">
                              <div className="h-2 w-20 bg-white/30 rounded-full" />
                           </div>
                        </div>
                        <div className="text-center pt-8">
                           <Badge className="bg-slate-950 text-white uppercase text-[8px] font-black tracking-widest px-4 py-1">Virtual Browser Native</Badge>
                        </div>
                     </Card>

                     <Button className="w-full h-20 rounded-[2.5rem] bg-indigo-600 text-white font-black uppercase text-[12px] tracking-[0.3em] shadow-3xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
                        Synchronize Brand Engine
                     </Button>
                  </div>
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
