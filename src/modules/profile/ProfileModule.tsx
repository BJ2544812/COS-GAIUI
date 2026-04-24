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
  Lock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Separator } from '@/src/components/ui/separator';
import { cn } from '@/src/lib/utils';

export function ProfileModule() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="relative">
        <div className="h-48 w-full bg-gradient-to-r from-indigo-600 to-indigo-900 rounded-3xl overflow-hidden shadow-xl shadow-indigo-200">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)]"></div>
        </div>
        
        <div className="absolute -bottom-12 left-12 flex items-end gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-3xl bg-white p-1.5 shadow-2xl overflow-hidden">
               <div className="w-full h-full rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 border border-indigo-200">
                  <User className="w-16 h-16" />
               </div>
            </div>
            <button className="absolute -right-2 -bottom-2 w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors group">
              <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
          
          <div className="pb-4 space-y-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Admin User</h1>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-3">Active Now</Badge>
              <span className="text-slate-500 font-medium text-sm flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Global Administrator
              </span>
            </div>
          </div>
        </div>
        
        <div className="absolute -bottom-6 right-12 flex gap-3">
          <Button variant="outline" className="gap-2 rounded-xl border-slate-200 shadow-sm bg-white hover:bg-slate-50">
            <Edit3 className="w-4 h-4" /> Edit Profile
          </Button>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200">
             Account Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-3xl border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">About Me</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-slate-600 leading-relaxed">
                Dedicated administrator specializing in organizational efficiency and digital transformation for non-profit systems. Over 10 years of experience in church management.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">admin@gracecommunity.local</span>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">+1 (555) 789-0123</span>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">Headquarters, Grace City</span>
                </div>
                <div className="flex items-center gap-4 text-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">Joined Jan 2018</span>
                </div>
              </div>

              <Separator />

              <div className="pt-2">
                <Button variant="ghost" className="w-full justify-between text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl group font-bold">
                  Logout Session
                  <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-100 shadow-sm bg-indigo-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <Activity className="w-24 h-24" />
            </div>
            <CardHeader>
              <CardTitle className="text-indigo-200">Engagement Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black mb-2">98.5</div>
              <p className="text-xs text-indigo-300 font-medium">Top 1% of Administrative productivity this quarter.</p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-8">
           <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
             <CardHeader className="border-b border-slate-50 bg-slate-50/50">
               <div className="flex items-center justify-between">
                 <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-600" />
                    Recent Activity
                 </CardTitle>
                 <Button variant="ghost" size="sm" className="text-xs font-bold text-indigo-600">View History</Button>
               </div>
             </CardHeader>
             <CardContent className="p-0">
                {[
                  { action: 'Updated Service Plan', details: 'Main Service - Sunday Morning', date: '2 hours ago', icon: Calendar, color: 'bg-emerald-50 text-emerald-600' },
                  { action: 'Approved Member Export', details: 'Annual membership directory report', date: '5 hours ago', icon: Shield, color: 'bg-blue-50 text-blue-600' },
                  { action: 'Modified System Settings', details: 'Added 2 new IP addresses to whitelist', date: 'Yesterday', icon: Lock, color: 'bg-orange-50 text-orange-600' },
                  { action: 'Generated Monthly Finance Report', details: 'Q1 Financial Summary - PDF', date: '2 days ago', icon: Activity, color: 'bg-purple-50 text-purple-600' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group cursor-pointer">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm", item.color)}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <p className="font-bold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{item.action}</p>
                      <p className="text-xs text-slate-500">{item.details}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{item.date}</span>
                    </div>
                  </div>
                ))}
             </CardContent>
           </Card>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <Card className="rounded-3xl border-slate-100 shadow-sm hover:border-indigo-200 transition-colors cursor-pointer group">
               <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Security Audit</p>
                    <p className="text-xs text-slate-500">Review account access logs</p>
                  </div>
               </CardContent>
             </Card>
             <Card className="rounded-3xl border-slate-100 shadow-sm hover:border-indigo-200 transition-colors cursor-pointer group">
               <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Edit3 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">API Access</p>
                    <p className="text-xs text-slate-500">Manage developer tokens</p>
                  </div>
               </CardContent>
             </Card>
           </div>
        </div>
      </div>
    </div>
  );
}
