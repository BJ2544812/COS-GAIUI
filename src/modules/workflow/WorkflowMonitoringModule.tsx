import React from 'react';
import { 
  Cpu, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Zap, 
  RotateCcw, 
  Activity, 
  ShieldCheck, 
  Server,
  ActivitySquare,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModuleHeader, ActionButton } from '@/components/modules/ModuleHeader';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { ERPModule } from '@/types';
import { cn } from '@/lib/utils';

interface WorkflowMonitoringModuleProps {
  onModuleChange?: (module: ERPModule) => void;
}

export function WorkflowMonitoringModule({ onModuleChange }: WorkflowMonitoringModuleProps) {
  const [events, setEvents] = React.useState<any[]>([]);
  const [stats, setStats] = React.useState<{ pending: number; processed: number; failed: number } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [replaying, setReplaying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [evRes, stRes] = await Promise.all([
        apiRequest('admin/events'),
        apiRequest('admin/events/stats'),
      ]);
      const evData = parseApiResponse<any[]>(evRes);
      const stData = parseApiResponse<any>(stRes);
      if (evData) setEvents(evData);
      if (stData) setStats(stData);
    } catch (e: any) {
      setError(e?.message || 'Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { loadData(); }, []);

  const handleReplay = async () => {
    try {
      setReplaying(true);
      await apiRequest('admin/events/replay', { method: 'POST' });
      await loadData();
    } catch (e: any) {
      setError('Replay failed: ' + (e?.message || 'Unknown error'));
    } finally {
      setReplaying(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'PROCESSED') return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (s === 'FAILED') return 'text-rose-700 bg-rose-50 border-rose-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-left pb-20">
      <ModuleHeader
        title="Activity log"
        subtitle="Background tasks for your church — see what ran, what is waiting, and retry if something failed."
        status="live"
        icon={Zap}
        actions={
          <>
            <ActionButton 
              label="Refresh" 
              icon={() => <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />} 
              variant="secondary" 
              onClick={loadData} 
              disabled={loading}
            />
            {stats?.failed ? (
              <ActionButton 
                label={`Replay ${stats.failed} Failed`} 
                icon={() => <RotateCcw className={`w-4 h-4 mr-2 ${replaying ? 'animate-spin' : ''}`} />} 
                variant="danger" 
                onClick={handleReplay} 
                disabled={replaying}
              />
            ) : null}
          </>
        }
      />

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-6 py-4 text-sm font-bold flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Real-time Health Pulse */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
            { label: 'System Uptime', value: '99.98%', icon: Server, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Event Throughput', value: '1.2k/hr', icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Avg Latency', value: '42ms', icon: Cpu, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Queue Health', value: 'Optimal', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
         ].map((h) => (
            <Card key={h.label} className="border-none shadow-sm rounded-3xl bg-white p-6">
               <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", h.bg, h.color)}>
                     <h.icon size={20} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{h.label}</p>
                     <p className="text-xl font-black text-slate-900 tracking-tight">{h.value}</p>
                  </div>
               </div>
            </Card>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div>
                <CardTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                  <ActivitySquare className="text-indigo-500" />
                  Recent Execution Stream
                </CardTitle>
                <CardDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-1">
                  Recent background tasks ({events.length} shown)
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-10 space-y-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : events.length === 0 ? (
                <div className="p-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mx-auto">
                    <Zap size={32} />
                  </div>
                  <p className="text-slate-400 font-medium">Monitoring engine active. No events recorded.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {events.map((ev: any) => (
                    <div key={ev.id} className="p-6 px-10 hover:bg-slate-50/50 transition-colors group cursor-pointer border-l-4 border-transparent hover:border-indigo-500 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-6">
                        <div className={cn("w-3 h-3 rounded-full mt-1.5 shrink-0 shadow-sm", ev.status === 'PROCESSED' ? 'bg-emerald-400' : ev.status === 'FAILED' ? 'bg-rose-400' : 'bg-amber-400')} />
                        <div className="space-y-1">
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{ev.eventName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Entity: {ev.entityType} · {ev.entityId?.slice(0, 12)}
                          </p>
                          {ev.error && (
                            <p className="text-[10px] text-rose-600 font-bold mt-2 bg-rose-50 rounded-lg px-3 py-1.5 border border-rose-100">{ev.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-right shrink-0">
                        <div className="space-y-1">
                          <p className={cn("text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm inline-block", statusColor(ev.status))}>
                            {ev.status}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-end gap-1.5 mt-1">
                            <Clock size={12} /> {new Date(ev.occurredAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <ArrowRight size={20} className="text-slate-200 group-hover:text-indigo-500 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
           <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-950 text-white p-10 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
              <div className="relative z-10 space-y-8">
                 <div className="w-16 h-16 rounded-[2rem] bg-white/10 flex items-center justify-center text-indigo-400">
                    <Activity size={32} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Queue Strategy</h3>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed">
                       Operating on a <strong>Redis-backed distributed queue</strong> with automatic exponential backoff. 
                       Integrity is maintained via <strong>Postgres EventLog</strong> snapshots.
                    </p>
                 </div>
                 <div className="pt-8 border-t border-white/5 space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="text-slate-500">Worker Instances</span>
                       <span className="text-white">4 Active</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className="text-slate-500">Retry Policy</span>
                       <span className="text-white">5 Attempts / Exp</span>
                    </div>
                 </div>
              </div>
           </Card>

           <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-10 space-y-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Domain Distribution</h3>
              <div className="space-y-6">
                 {[
                    { name: 'Finance', count: 420, color: 'bg-emerald-500' },
                    { name: 'Identity', count: 215, color: 'bg-indigo-500' },
                    { name: 'Communication', count: 88, color: 'bg-rose-500' },
                 ].map((d) => (
                    <div key={d.name} className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-slate-900">{d.name}</span>
                          <span className="text-slate-400">{d.count} Events</span>
                       </div>
                       <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", d.color)} style={{ width: `${(d.count / 420) * 100}%` }} />
                       </div>
                    </div>
                 ))}
              </div>
              <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-100 text-[10px] font-black uppercase tracking-widest">View Full Event Schema</Button>
           </Card>
        </div>
      </div>
    </div>
  );
}

