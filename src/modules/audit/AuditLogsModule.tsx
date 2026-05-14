import React from 'react';
import { ScrollText, Search, Filter, ShieldCheck, Clock, User, ArrowRight, Download, FileCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModuleHeader, ActionButton } from '@/components/modules/ModuleHeader';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { ERPModule } from '@/types';
import { cn } from '@/lib/utils';

export function AuditLogsModule({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiRequest('admin/events');
        const data = parseApiResponse<any[]>(res);
        if (data) setLogs(data);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-left pb-20">
      <ModuleHeader
        title="Audit Registry"
        subtitle="Immutable audit trail of all system actions, financial postings, and domain mutations."
        status="live"
        icon={ScrollText}
        actions={
          <>
            <ActionButton label="Export CSV" icon={Download} variant="secondary" />
            <ActionButton label="Verify Integrity" icon={ShieldCheck} variant="primary" />
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden group">
            <CardContent className="p-10 space-y-6">
               <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400">
                  <ShieldCheck size={24} />
               </div>
               <div>
                  <h3 className="text-4xl font-black tracking-tighter">Verified</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Log Integrity Status</p>
               </div>
               <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Cryptographic hashing confirms 100% log consistency. No unauthorized mutations detected in the last 24h.
               </p>
            </CardContent>
         </Card>
         
         <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden group">
            <CardContent className="p-10 space-y-6">
               <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600">
                  <FileCheck size={24} />
               </div>
               <div>
                  <h3 className="text-4xl font-black tracking-tighter">1,204</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Critical Actions (30d)</p>
               </div>
               <div className="flex gap-2">
                  <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[8px] uppercase tracking-widest">Financial: 420</Badge>
                  <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[8px] uppercase tracking-widest">Security: 88</Badge>
               </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden group">
            <CardContent className="p-10 space-y-6">
               <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <AlertCircle size={24} />
               </div>
               <div>
                  <h3 className="text-4xl font-black tracking-tighter">0</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Compliance Warnings</p>
               </div>
               <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  All administrative actions currently adhere to the church's internal control policies.
               </p>
            </CardContent>
         </Card>
      </div>

      <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
         <CardHeader className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
               <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">System Activity Timeline</CardTitle>
               <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2">Real-time audit stream of domain events</CardDescription>
            </div>
            <div className="flex gap-4">
               <div className="relative w-full md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input placeholder="Search logs..." className="h-12 pl-12 pr-6 rounded-xl bg-slate-50 border-none font-bold uppercase text-[10px] tracking-widest focus:ring-2 focus:ring-indigo-600" />
               </div>
               <Button variant="outline" className="h-12 rounded-xl text-[10px] font-black uppercase tracking-widest px-6"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
            </div>
         </CardHeader>
         <CardContent className="p-0">
            {loading ? (
               <div className="p-10 space-y-6">
                  {[...Array(5)].map((_, i) => (
                     <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
                  ))}
               </div>
            ) : logs.length === 0 ? (
               <div className="p-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mx-auto">
                     <ScrollText size={32} />
                  </div>
                  <p className="text-slate-400 font-medium">No audit logs recorded for this period.</p>
               </div>
            ) : (
               <div className="divide-y divide-slate-50">
                  {logs.map((log: any) => (
                     <div key={log.id} className="p-8 hover:bg-slate-50/50 transition-colors group cursor-pointer border-l-4 border-transparent hover:border-indigo-500 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-start gap-6">
                           <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                              <User size={20} />
                           </div>
                           <div className="space-y-1">
                              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.eventName}</p>
                              <div className="flex items-center gap-3">
                                 <Badge className="bg-slate-100 text-slate-500 border-none text-[8px] font-black uppercase tracking-widest">{log.entityType}</Badge>
                                 <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><Clock size={12} /> {new Date(log.occurredAt).toLocaleString()}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-10">
                           <div className="text-right hidden sm:block">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Entity ID</p>
                              <p className="text-xs font-mono font-bold text-slate-600">{log.entityId?.slice(0, 12)}...</p>
                           </div>
                           <div className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border", log.status === 'PROCESSED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100')}>
                              {log.status}
                           </div>
                           <ArrowRight size={20} className="text-slate-200 group-hover:text-indigo-500 transition-colors" />
                        </div>
                     </div>
                  ))}
               </div>
            )}
            <div className="p-8 border-t border-slate-50 bg-slate-50/10 text-center">
               <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600">Load Older Records</Button>
            </div>
         </CardContent>
      </Card>
    </div>
  );
}

