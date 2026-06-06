import React from 'react';
import { ScrollText, Search, ShieldCheck, Clock, User, FileCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModuleHeader, ActionButton, FeedbackBanner, PageLayout, StatCard } from '@/components/modules/ModuleHeader';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { ERPModule } from '@/types';
import { cn } from '@/lib/utils';
import { navigateToFinanceTab } from '@/lib/financeNavigation';

export function AuditLogsModule({ onModuleChange }: { onModuleChange?: (m: ERPModule, tab?: string) => void }) {
  const [logs, setLogs] = React.useState<any[]>([]);
  const [approvalQueue, setApprovalQueue] = React.useState<any[]>([]);
  const [query, setQuery] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [logsRes, approvalsRes] = await Promise.all([
          apiRequest('finance/audit/logs?limit=300'),
          apiRequest('finance/approvals/queue'),
        ]);
        setLogs(parseApiResponse<any[]>(logsRes) || []);
        setApprovalQueue(parseApiResponse<any[]>(approvalsRes) || []);
      } catch (e) {
        setError(formatApiError(e));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filteredLogs = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) =>
      [l.action, l.entityType, l.entityId, l.actorUserId]
        .map((x) => String(x || '').toLowerCase())
        .join(' ')
        .includes(q),
    );
  }, [logs, query]);

  return (
    <PageLayout>
      <ModuleHeader
        title="Change history"
        subtitle="Who changed what in giving, finance, and church records."
        status="live"
        icon={ScrollText}
        actions={
          <ActionButton
            label="Open Finance"
            icon={ShieldCheck}
            variant="primary"
            onClick={() => navigateToFinanceTab(onModuleChange, 'ca-audit')}
          />
        }
      />
      {error && <FeedbackBanner tone="error">{error}</FeedbackBanner>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
         <StatCard label="Log integrity" value="Verified" icon={ShieldCheck} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
         <StatCard label="Critical actions (30d)" value={logs.length} icon={FileCheck} />
         <StatCard label="Attention items" value={logs.filter((l) => String(l.action || '').includes('failed')).length} icon={AlertCircle} iconColor="text-rose-600" iconBg="bg-rose-50" />
      </div>

      <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
         <CardHeader className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
               <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">System Activity Timeline</CardTitle>
               <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2">Live stream of finance and system changes</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search logs..." className="h-12 pl-12 pr-6 rounded-xl bg-slate-50 border-none font-bold uppercase text-[10px] tracking-widest focus:ring-2 focus:ring-indigo-600" />
            </div>
         </CardHeader>
         <CardContent className="p-0">
            {loading ? (
               <div className="p-10 space-y-6">
                  {[...Array(5)].map((_, i) => (
                     <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
                  ))}
               </div>
            ) : filteredLogs.length === 0 ? (
               <div className="p-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mx-auto">
                     <ScrollText size={32} />
                  </div>
                  <p className="text-slate-400 font-medium">No changes recorded for this period.</p>
               </div>
            ) : (
               <div className="divide-y divide-slate-50">
                  {filteredLogs.map((log: any) => (
                     <div key={log.id} className="p-8 hover:bg-slate-50/50 transition-colors group cursor-pointer border-l-4 border-transparent hover:border-indigo-500 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="flex items-start gap-6">
                           <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                              <User size={20} />
                           </div>
                           <div className="space-y-1">
                              <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{log.action || 'AUDIT_ACTION'}</p>
                              <div className="flex items-center gap-3">
                                 <Badge className="bg-slate-100 text-slate-500 border-none text-[8px] font-black uppercase tracking-widest">{log.entityType || 'ENTITY'}</Badge>
                                 <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><Clock size={12} /> {new Date(log.createdAt || Date.now()).toLocaleString()}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-10">
                           <div className="text-right hidden sm:block">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Entity ID</p>
                              <p className="text-xs font-mono font-bold text-slate-600">{String(log.entityId || '').slice(0, 12)}...</p>
                           </div>
                           <div className={cn("px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border", String(log.action || '').includes('failed') ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100')}>
                              {String(log.action || '').includes('failed') ? 'WARNING' : 'VERIFIED'}
                           </div>
                           <User size={20} className="text-slate-200 group-hover:text-indigo-500 transition-colors" />
                        </div>
                     </div>
                  ))}
               </div>
            )}
            <div className="p-8 border-t border-slate-50 bg-slate-50/10 text-center">
               <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600" onClick={() => navigateToFinanceTab(onModuleChange, 'vouchers')}>Open voucher registry</Button>
            </div>
         </CardContent>
      </Card>

      <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
        <CardHeader className="p-8 border-b border-slate-50">
          <CardTitle className="text-lg font-black tracking-tight uppercase">Approval Workflow Inbox</CardTitle>
          <CardDescription className="text-xs text-slate-500">Pending requests requiring threshold approvals</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {approvalQueue.length === 0 ? (
              <div className="px-8 py-12 text-center text-sm text-slate-500">No pending approvals.</div>
            ) : (
              approvalQueue.map((req) => (
                <div key={req.id} className="px-8 py-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{req.entityType} · Level {req.currentLevel}/{req.minRequiredLevel}</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">{req.moduleKey || 'finance'} · {new Date(req.createdAt).toLocaleString()}</p>
                  </div>
                  <Badge className="bg-amber-50 text-amber-700 border-none text-[9px] font-black uppercase tracking-widest">{req.status}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
