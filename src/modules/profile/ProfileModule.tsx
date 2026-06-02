import React from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Edit3, 
  LogOut,
  Camera,
  Activity,
  History,
  Lock,
  Key,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export function ProfileModule() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="relative">
        <div className="h-48 w-full bg-gradient-to-r from-indigo-600 to-indigo-900 rounded-[3rem] overflow-hidden shadow-xl shadow-indigo-100">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)]"></div>
        </div>
        
        <div className="absolute -bottom-12 left-12 flex items-end gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-[2.5rem] bg-white p-1.5 shadow-2xl overflow-hidden">
               <div className="w-full h-full rounded-[2rem] bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200">
                  <User className="w-16 h-16" />
               </div>
            </div>
            <button className="absolute -right-2 -bottom-2 w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors group">
              <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
          
          <div className="pb-4 space-y-1">
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">{user?.username ?? 'User'}</h1>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-emerald-500 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">Active Now</Badge>
              <span className="text-slate-400 font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" /> {user?.role ?? 'Church staff'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="absolute -bottom-6 right-12 flex gap-4">
          <Button variant="ghost" className="gap-2 rounded-2xl border-slate-200 shadow-sm bg-white hover:bg-slate-50 font-black uppercase text-[10px] tracking-widest h-12 px-6">
            <Edit3 className="w-4 h-4" /> Edit Profile
          </Button>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-xl shadow-indigo-100 font-black uppercase text-[10px] tracking-widest h-12 px-8">
             Account Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-12">
        <div className="lg:col-span-1 space-y-8">
          <Card className="rounded-[3rem] border-none shadow-xl bg-white">
            <CardHeader className="p-10 pb-4">
              <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Your details</CardTitle>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</p>
                    <p className="text-sm font-bold text-slate-700">{user?.email ?? 'admin@church.com'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Access Role</p>
                    <p className="text-sm font-bold text-slate-700">{user?.role ?? 'Staff'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Areas you can access</p>
                    <p className="text-sm font-bold text-indigo-600">{user?.permissions.length ?? 0} modules</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-50" />

              <div className="pt-2">
                <Button variant="ghost" onClick={logout} className="w-full justify-between text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl group font-black uppercase text-[10px] tracking-widest h-14 px-6">
                  Logout Session
                  <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[3rem] border-none shadow-2xl bg-slate-950 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-1000">
              <Zap size={100} strokeWidth={1} />
            </div>
            <CardHeader className="p-10">
              <CardTitle className="text-indigo-400 uppercase tracking-widest text-xs font-black">Account security</CardTitle>
            </CardHeader>
            <CardContent className="p-10 pt-0">
              <div className="text-5xl font-black mb-4">A+</div>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">Your sign-in is protected by role-based access — only the modules your church assigned to you.</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-10">
           <Card className="rounded-[3.5rem] border-none shadow-xl bg-white overflow-hidden">
             <CardHeader className="p-10 border-b border-slate-50 bg-slate-50/30">
               <div className="flex items-center justify-between">
                 <div className="space-y-1">
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Access Log</CardTitle>
                    <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Account Activity</CardDescription>
                 </div>
                 <Button variant="ghost" size="sm" className="font-black uppercase text-[10px] tracking-widest text-indigo-600">Full History</Button>
               </div>
             </CardHeader>
             <CardContent className="p-0">
                {[
                  { action: 'System Login', details: 'Successful authentication from Chrome (Win)', date: '2 mins ago', icon: Lock, color: 'bg-emerald-50 text-emerald-600' },
                  { action: 'Website Update', details: 'Published Home Page changes', date: '4 hours ago', icon: Activity, color: 'bg-blue-50 text-blue-600' },
                  { action: 'Access review', details: 'Verified role settings for staff', date: 'Yesterday', icon: Shield, color: 'bg-indigo-50 text-indigo-600' },
                  { action: 'Permissions updated', details: 'Church access settings refreshed', date: '1 day ago', icon: History, color: 'bg-amber-50 text-amber-600' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-6 p-8 hover:bg-slate-50/50 transition-all border-b border-slate-50 last:border-0 group cursor-pointer">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105", item.color)}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-black text-slate-800 text-sm tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{item.action}</p>
                      <p className="text-xs text-slate-500 font-medium">{item.details}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.date}</span>
                    </div>
                  </div>
                ))}
             </CardContent>
           </Card>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
             <Card className="rounded-[2.5rem] border-none shadow-lg hover:shadow-2xl transition-all cursor-pointer group bg-white p-8 flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-slate-900 uppercase tracking-tight">Sign-in activity</p>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Recent access</p>
                </div>
             </Card>
             <Card className="rounded-[2.5rem] border-none shadow-lg hover:shadow-2xl transition-all cursor-pointer group bg-white p-8 flex items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-slate-900 uppercase tracking-tight">Integrations</p>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">For technical admins</p>
                </div>
             </Card>
           </div>
        </div>
      </div>
    </div>
  );
}
