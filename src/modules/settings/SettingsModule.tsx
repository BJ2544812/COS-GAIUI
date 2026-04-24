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
  FileKey
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Separator } from '@/src/components/ui/separator';
import { Badge } from '@/src/components/ui/badge';

export function SettingsModule() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">System Settings</h1>
        <p className="text-slate-500">Configure your ERP environment and organization preferences.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-white border p-1 rounded-xl mb-8">
          <TabsTrigger value="general" className="rounded-lg gap-2">
            <SettingsIcon className="w-4 h-4" /> General
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg gap-2">
            <Lock className="w-4 h-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="rounded-lg gap-2">
            <Cloud className="w-4 h-4" /> Integrations
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg gap-2">
            <CreditCard className="w-4 h-4" /> Payments & Giving
          </TabsTrigger>
          <TabsTrigger value="branding" className="rounded-lg gap-2">
            <Palette className="w-4 h-4" /> Branding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h2 className="text-lg font-bold text-slate-900">Organization Info</h2>
              <p className="text-sm text-slate-500">Public information about your church or organization.</p>
            </div>
            <Card className="md:col-span-2">
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Organization Name</label>
                    <Input defaultValue="Grace Community Church" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Short Name / Alias</label>
                    <Input defaultValue="GCC" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400">Main Office Address</label>
                  <Input defaultValue="123 Faith Avenue, Grace City, GC 54321" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Primary Email</label>
                    <Input defaultValue="hello@gracecommunity.org" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Contact Phone</label>
                    <Input defaultValue="+1 (555) 123-4567" />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button className="bg-indigo-600 hover:bg-indigo-700">Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <h2 className="text-lg font-bold text-slate-900">Localization</h2>
              <p className="text-sm text-slate-500">Timezone and language settings for the administrative panel.</p>
            </div>
            <Card className="md:col-span-2">
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">System Language</label>
                    <Input defaultValue="English (US)" readOnly className="bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Timezone</label>
                    <Input defaultValue="(GMT-05:00) Eastern Time" readOnly className="bg-slate-50" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                Authentication Policy
              </CardTitle>
              <CardDescription>Managed enterprise security settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">Two-Factor Authentication (2FA)</p>
                  <p className="text-xs text-slate-500">Require all staff and admins to verify their identity twice.</p>
                </div>
                <div className="w-12 h-6 bg-indigo-600 rounded-full relative cursor-pointer shadow-inner">
                   <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">Session Timeout</p>
                  <p className="text-xs text-slate-500">Automatically logout users after a period of inactivity.</p>
                </div>
                <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer shadow-inner">
                   <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900">Allowed Login IPs</h3>
                <div className="flex gap-2">
                  <Input placeholder="Enter IP address..." className="flex-1" />
                  <Button variant="outline">Add IP</Button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg text-sm">
                    <code className="text-indigo-600 font-bold">192.168.1.1 (Office HQ)</code>
                    <Button variant="ghost" size="sm" className="h-7 text-red-500 hover:text-red-600 hover:bg-red-50">Remove</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Notifications</CardTitle>
              <CardDescription>How the ERP communicates with your staff members.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { title: 'New Member Registration', icon: User, desc: 'Alert when a new person fills out a connection card.' },
                  { title: 'Donation Alerts', icon: HeartHandshake, desc: 'Notify finance team when large donations are received.' },
                  { title: 'Server Health', icon: Database, desc: 'System status and maintenance alerts.' },
                  { title: 'API Failures', icon: Globe, desc: 'Alerts for failed third-party integrations.' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 gap-2">
                        <Mail className="w-3 h-3" /> Email
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 gap-2 bg-indigo-50 border-indigo-200 text-indigo-700">
                        <Smartphone className="w-3 h-3" /> Push
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Stripe', status: 'Connected', desc: 'Secure payment processing for giving and events.', icon: CreditCard },
              { name: 'Mailchimp', status: 'Not Connected', desc: 'Automate email marketing and newsletters.', icon: Mail },
              { name: 'Twilio', status: 'Connected', desc: 'Reliable SMS and voice communications.', icon: Smartphone },
              { name: 'Google Workspace', status: 'Connected', desc: 'Sync calendars and drive documents.', icon: Cloud },
              { name: 'Planning Center', status: 'Ready to Sync', desc: 'Import service plans and volunteer data.', icon: Target },
            ].map((int, i) => (
              <Card key={i} className="hover:ring-2 hover:ring-indigo-500/10 transition-all cursor-pointer group">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors shadow-sm">
                      <int.icon className="w-6 h-6" />
                    </div>
                    <Badge variant={int.status === 'Connected' ? 'secondary' : 'outline'} className={int.status === 'Connected' ? 'bg-emerald-50 text-emerald-700 border-none px-3' : 'px-3'}>
                      {int.status}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{int.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">{int.desc}</p>
                  </div>
                  <Button variant="ghost" className="w-full text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl text-xs font-bold gap-2">
                    Manage Settings <ChevronRight className="w-3 h-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-2">
                 <h2 className="text-xl font-black text-slate-900 tracking-tight">Financial Gateways</h2>
                 <p className="text-xs text-slate-500 font-medium leading-relaxed italic">Configure how your church receives tithes, offerings, and donations. Highly optimized for Indian banking regulations.</p>
              </div>
              <div className="md:col-span-2 space-y-6">
                 <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden border">
                    <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                       <div>
                          <CardTitle className="text-lg font-black text-slate-800">Razorpay Integration</CardTitle>
                          <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1">Recommended for India Credits/Debits/NetBanking</CardDescription>
                       </div>
                       <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 font-bold">READY TO SYNC</Badge>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Key ID</label>
                             <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                                <Input className="pl-9 bg-slate-50 border-slate-100 rounded-xl" placeholder="rzp_live_..." type="password" />
                             </div>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Key Secret</label>
                             <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                                <Input className="pl-9 bg-slate-50 border-slate-100 rounded-xl" placeholder="••••••••••••" type="password" />
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                          <div className="flex items-center gap-3">
                             <Globe className="w-5 h-5 text-indigo-600" />
                             <span className="text-xs font-bold text-slate-700">Auto-Generate 80G Receipts</span>
                          </div>
                          <div className="w-10 h-5 bg-indigo-600 rounded-full relative p-0.5 shadow-inner cursor-pointer">
                             <div className="w-4 h-4 rounded-full bg-white ml-auto shadow-sm" />
                          </div>
                       </div>
                    </CardContent>
                 </Card>

                 <Card className="rounded-[2.5rem] border-slate-100 shadow-sm overflow-hidden border">
                    <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-50">
                       <CardTitle className="text-lg font-black text-slate-800">UPI & QR Customization</CardTitle>
                       <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1">Direct peer-to-peer church giving</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Primary Organization UPI ID</label>
                          <Input className="bg-slate-50 border-slate-100 rounded-xl h-12" placeholder="churchorg@bank" />
                       </div>
                       <div className="space-y-4">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">QR Theme Selection</p>
                          <div className="grid grid-cols-4 gap-4">
                             {['#4f46e5', '#0ea5e9', '#10b981', '#f43f5e'].map(color => (
                               <div key={color} className="aspect-square rounded-2xl border-2 border-slate-100 flex items-center justify-center p-1 cursor-pointer hover:border-indigo-500 transition-all">
                                  <div className="w-full h-full rounded-xl" style={{ backgroundColor: color }} />
                               </div>
                             ))}
                          </div>
                       </div>
                    </CardContent>
                 </Card>
                 
                 <div className="flex justify-end pt-4">
                    <Button className="bg-indigo-600 hover:bg-indigo-700 h-12 px-12 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100">Save Financial Config</Button>
                 </div>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-2">
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Visual Identity</h2>
              <p className="text-xs text-slate-500 leading-relaxed">Customize the look and feel of your ERP and member-facing portals.</p>
            </div>
            <Card className="md:col-span-2 rounded-3xl overflow-hidden border-slate-100 shadow-sm border">
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Brand Color</label>
                      <div className="flex items-center gap-3">
                         <div className="w-12 h-12 rounded-2xl bg-indigo-600 border shadow-sm" />
                         <Input defaultValue="#4f46e5" className="font-mono text-xs uppercase" />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accent Color</label>
                      <div className="flex items-center gap-3">
                         <div className="w-12 h-12 rounded-2xl bg-emerald-500 border shadow-sm" />
                         <Input defaultValue="#10b981" className="font-mono text-xs uppercase" />
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Organization Logo</label>
                   <div className="p-12 border-2 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center gap-3 group hover:border-indigo-200 transition-all cursor-pointer">
                      <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-indigo-400 transition-colors">
                        <FileKey className="w-8 h-8" />
                      </div>
                      <p className="text-xs font-bold text-slate-400">Drag & Drop Logo (PNG/SVG)</p>
                   </div>
                </div>

                <Separator />
                
                <div className="flex justify-end gap-3">
                   <Button variant="outline">Reset to Defaults</Button>
                   <Button className="bg-indigo-600">Update Identity</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
