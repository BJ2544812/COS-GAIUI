import React from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Zap, 
  X, 
  RefreshCw, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  BarChart3,
  Search,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { SectionCard, EmptyState, LoadingSkeleton, ActionButton } from '@/components/modules/ModuleHeader';
import { cn } from '@/lib/utils';

export function NotificationsModule() {
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('notifications');
      const data = parseApiResponse<any[]>(res);
      if (data) setNotifications(data);
    } catch {} finally { setLoading(false); }
  };

  React.useEffect(() => { load(); }, []);

  const markRead = async (id: string) => {
    await apiRequest(`notifications/${id}/read`, { method: 'POST' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
  };

  const markAllRead = async () => {
    await apiRequest('notifications/read-all', { method: 'POST' });
    setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
  };

  const priorityIcon = (p: string) => {
    if (p === 'HIGH') return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    if (p === 'LOW')  return <Info className="w-4 h-4 text-slate-400" />;
    return <Zap className="w-4 h-4 text-amber-500" />;
  };

  const visible = filter === 'unread' ? notifications.filter(n => n.status === 'unread') : notifications;
  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-left pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
            Notification Command
            {unreadCount > 0 && (
              <Badge className="bg-rose-500 text-white border-none px-3 py-1 text-xs font-black rounded-full animate-pulse">
                {unreadCount} NEW
              </Badge>
            )}
          </h1>
          <p className="text-slate-500 font-medium mt-1">System-wide delivery analytics, unread activity, and channel monitoring.</p>
        </div>
        <div className="flex items-center gap-3">
          <ActionButton label="Refresh" icon={RefreshCw} variant="secondary" onClick={load} />
          {unreadCount > 0 && <ActionButton label="Clear All" icon={CheckCircle2} variant="primary" onClick={markAllRead} />}
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
            { label: 'Push Notifications', value: '94%', icon: Smartphone, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Email Delivery', value: '99.2%', icon: Mail, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'SMS Velocity', value: '42/min', icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Open Rate Avg', value: '68%', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
         ].map((stat) => (
            <Card key={stat.label} className="border-none shadow-sm rounded-3xl bg-white p-6">
               <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                     <stat.icon size={20} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                     <p className="text-xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                  </div>
               </div>
            </Card>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
         <div className="xl:col-span-8 space-y-8">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
               <CardHeader className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                     {(['all', 'unread'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                           className={cn(
                              "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                              filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                           )}>
                           {f} {f === 'unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
                        </button>
                     ))}
                  </div>
                  <div className="relative w-full md:w-64">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <Input placeholder="Search activity..." className="h-11 pl-11 pr-6 rounded-xl bg-slate-50 border-none font-bold uppercase text-[10px] tracking-widest focus:ring-2 focus:ring-indigo-600" />
                  </div>
               </CardHeader>
               <CardContent className="p-0">
                  {loading ? <LoadingSkeleton rows={5} /> : visible.length === 0 ? (
                     <div className="p-20 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mx-auto">
                           <Bell size={32} />
                        </div>
                        <p className="text-slate-400 font-medium italic">No notifications found in this stream.</p>
                     </div>
                  ) : (
                     <div className="divide-y divide-slate-50">
                        {visible.map((n: any) => (
                           <div key={n.id} className={cn(
                              "flex items-start gap-6 px-10 py-6 hover:bg-slate-50/50 transition-colors border-l-4 border-transparent",
                              n.status === 'unread' ? "bg-indigo-50/20 border-l-indigo-500" : ""
                           )}>
                              <div className="shrink-0 mt-1">{priorityIcon(n.priority)}</div>
                              <div className="flex-1 min-w-0">
                                 <div className="flex items-start justify-between gap-4">
                                    <div>
                                       <p className={cn("text-base font-black uppercase tracking-tight", n.priority === 'HIGH' ? 'text-rose-700' : 'text-slate-900')}>{n.title}</p>
                                       <p className="text-sm font-medium text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                       <span className={cn(
                                          "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm",
                                          n.priority === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                          n.priority === 'LOW' ? 'bg-slate-50 text-slate-400 border-slate-100' : 
                                          'bg-amber-50 text-amber-600 border-amber-100'
                                       )}>{n.priority}</span>
                                       {n.status === 'unread' && (
                                          <button onClick={() => markRead(n.id)} className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                                             <CheckCircle2 className="w-4 h-4" />
                                          </button>
                                       )}
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-4 mt-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                       {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                       {' · '}{n.type}
                                    </p>
                                    <Badge className="bg-slate-100 text-slate-500 border-none text-[8px] font-black uppercase">Delivered</Badge>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </CardContent>
            </Card>
         </div>

         <div className="xl:col-span-4 space-y-8">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden group">
               <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-lg font-black uppercase tracking-tight">Channel Health</CardTitle>
               </CardHeader>
               <CardContent className="p-8 pt-0 space-y-6">
                  {[
                     { name: 'Email (SendGrid)', status: 'Operational', icon: Mail, color: 'text-emerald-400' },
                     { name: 'SMS (Twilio)', status: 'Operational', icon: MessageSquare, color: 'text-emerald-400' },
                     { name: 'Push (FCM)', status: 'Latent', icon: Smartphone, color: 'text-amber-400' },
                  ].map((c) => (
                     <div key={c.name} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                           <c.icon size={18} className="text-slate-500" />
                           <p className="text-xs font-bold">{c.name}</p>
                        </div>
                        <p className={cn("text-[9px] font-black uppercase tracking-widest", c.color)}>{c.status}</p>
                     </div>
                  ))}
               </CardContent>
            </Card>

            <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-8 overflow-hidden relative">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <BarChart3 size={100} />
               </div>
               <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Delivery Volume</h3>
               <div className="flex items-end gap-1 h-32">
                  {[30, 45, 25, 60, 80, 55, 90, 70, 40, 65, 85, 100].map((h, i) => (
                     <div key={i} className="flex-1 bg-indigo-500/10 rounded-t-sm group-hover:bg-indigo-500/30 transition-all" style={{ height: `${h}%` }} />
                  ))}
               </div>
               <div className="mt-6 space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-slate-500">Peak Delivery</span>
                     <span className="text-slate-900">09:00 AM</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-slate-500">Bounce Rate</span>
                     <span className="text-rose-600">0.02%</span>
                  </div>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}

