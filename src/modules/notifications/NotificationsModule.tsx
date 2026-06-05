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
import { SectionCard, EmptyState, LoadingSkeleton, ActionButton, ModuleHeader, PageLayout, StatCard } from '@/components/modules/ModuleHeader';
import { cn } from '@/lib/utils';
import type { ERPModule } from '@/types';
import { normalizeAdminModule } from '@/lib/adminNavigation';
import { useOperationalSocket } from '@/hooks/useOperationalSocket';

function openNotificationAction(
  n: { actionType?: string | null; actionLink?: string | null },
  onNavigate?: (m: ERPModule, tab?: string) => void,
) {
  const link = (n.actionLink || '').trim();
  if (!link) return;
  const target = normalizeAdminModule(link);
  onNavigate?.(target.module, target.tab);
}

export function NotificationsModule({ onModuleChange }: { onModuleChange?: (m: ERPModule, tab?: string) => void }) {
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
  useOperationalSocket(() => { void load(); });

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
    <PageLayout>
      <ModuleHeader
        title="Notifications"
        subtitle="Delivery activity, unread items, and channel monitoring."
        icon={Bell}
        actions={
          <>
            <ActionButton label="Refresh" icon={RefreshCw} variant="secondary" onClick={load} />
            {unreadCount > 0 && (
              <ActionButton label={`Mark all read (${unreadCount})`} icon={CheckCircle2} variant="primary" onClick={markAllRead} />
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
         <StatCard label="Total" value={notifications.length} icon={Bell} loading={loading} />
         <StatCard label="Unread" value={unreadCount} icon={Zap} iconColor="text-amber-600" iconBg="bg-amber-50" loading={loading} />
         <StatCard
           label="High priority"
           value={notifications.filter((n) => n.priority === 'HIGH').length}
           icon={AlertTriangle}
           iconColor="text-rose-600"
           iconBg="bg-rose-50"
           loading={loading}
         />
         <StatCard
           label="Actionable"
           value={notifications.filter((n) => n.actionLink).length}
           icon={CheckCircle2}
           iconColor="text-emerald-600"
           iconBg="bg-emerald-50"
           loading={loading}
         />
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
                                    {n.actionLink && (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="text-[9px] font-black uppercase h-7"
                                        onClick={() => {
                                          void markRead(n.id);
                                          openNotificationAction(n, onModuleChange);
                                        }}
                                      >
                                        Open
                                      </Button>
                                    )}
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
    </PageLayout>
  );
}

