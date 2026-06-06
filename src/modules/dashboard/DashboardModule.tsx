import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Plus, 
  LayoutDashboard, 
  FileText, 
  Users, 
  TrendingUp, 
  Activity, 
  ChevronRight,
  Zap,
  User,
  Heart,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { FeedbackBanner, StatCard, ModuleHeader, PageLayout } from '@/components/modules/ModuleHeader';
import { ds } from '@/lib/designSystem';
import { cn } from '@/lib/utils';
import { ERPModule } from '@/types';
import { OperationsCommandCenter } from '@/components/operations/OperationsCommandCenter';
import { ExecutiveInsightPanel } from '@/components/intelligence/ExecutiveInsightPanel';
import { PastoralInsightPanel } from '@/components/intelligence/PastoralInsightPanel';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { usePermissions } from '@/context/AuthContext';
import { dashboardLensLabel } from '@/lib/churchProductCopy';
import { getRoleExperience, type DashboardLens, type RoleArchetype } from '@/lib/roleExperience';
import { RoleFirstDayPanel } from '@/components/role/RoleFirstDayPanel';
import { QuickTestNextCard } from '@/components/guided-learning/QuickTestNextCard';

const FIRST_DAY_ARCHETYPES: RoleArchetype[] = [
  'church_admin',
  'youth_pastor',
  'accountant',
  'volunteer_coordinator',
  'small_group_leader',
  'staff_desk',
];

export function DashboardModule({
  onModuleChange,
}: {
  onModuleChange?: (m: ERPModule, tab?: string) => void;
}) {
  const { user } = usePermissions();
  const roleExp = React.useMemo(
    () => (user ? getRoleExperience(user) : null),
    [user],
  );

  const [view, setView] = React.useState<'personal' | 'executive' | 'operations'>('operations');
  const [roleLens, setRoleLens] = React.useState<DashboardLens>('executive');
  const [roleViewApplied, setRoleViewApplied] = React.useState(false);

  React.useEffect(() => {
    if (!roleExp || roleViewApplied) return;
    setView(roleExp.dashboardView);
    setRoleLens(roleExp.dashboardLens);
    setRoleViewApplied(true);
  }, [roleExp, roleViewApplied]);
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [notes, setNotes] = React.useState<string>('');
  const [events, setEvents] = React.useState<any[]>([]);
  const [analytics, setAnalytics] = React.useState<any>(null);
  const [financial, setFinancial] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadWarning, setLoadWarning] = React.useState<string | null>(null);

  const loadDashboard = React.useCallback(async () => {
      try {
        setLoading(true);
        setLoadWarning(null);
        // Per-endpoint isolation: no global /tasks/me or /notes routes — avoid failing the whole dashboard.
        const [tasksRaw, eventsRaw, analyticsRaw, financialRaw] = await Promise.allSettled([
          apiRequest('discipleship/v2/tasks/my-tasks'),
          apiRequest('events'),
          apiRequest('analytics/members'),
          apiRequest('analytics/financial'),
        ]);
        if (tasksRaw.status === 'fulfilled') {
          setTasks(parseApiResponse<any[]>(tasksRaw.value) || []);
        } else {
          setTasks([]);
        }
        setNotes('');
        if (eventsRaw.status === 'fulfilled') {
          setEvents(parseApiResponse<any[]>(eventsRaw.value) || []);
        } else {
          setEvents([]);
        }
        if (analyticsRaw.status === 'fulfilled') {
          setAnalytics(parseApiResponse(analyticsRaw.value));
        } else {
          setAnalytics(null);
        }
        if (financialRaw.status === 'fulfilled') {
          setFinancial(parseApiResponse(financialRaw.value));
        } else {
          setFinancial(null);
        }
        const failedPanels: string[] = [];
        if (tasksRaw.status === 'rejected') failedPanels.push('tasks');
        if (eventsRaw.status === 'rejected') failedPanels.push('events');
        if (analyticsRaw.status === 'rejected') failedPanels.push('member analytics');
        if (financialRaw.status === 'rejected') failedPanels.push('financial analytics');
        if (failedPanels.length > 0) {
          setLoadWarning(`Some dashboard panels are unavailable: ${failedPanels.join(', ')}. You can continue using other modules and retry.`);
        }
      } catch (e) {
        console.error('Dashboard fetch error:', e);
        setLoadWarning('Dashboard failed to load completely. Please retry.');
      } finally {
        setLoading(false);
      }
    }, []);

  React.useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Loading dashboard…</p>
      </div>
    );
  }

  const renderPersonalView = () => (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* LEFT: Tasks & Notes */}
      <div className="xl:col-span-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Tasks Card */}
          <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden group">
            <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div>
                <CardTitle className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                  <CheckCircle2 className="text-indigo-500" />
                  Action Items
                </CardTitle>
                <CardDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-1">Pending tasks for you</CardDescription>
              </div>
              <Button
                size="icon"
                variant="ghost"
                type="button"
                onClick={() => onModuleChange?.('discipleship')}
                className="rounded-xl bg-slate-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
                title="Open Pastoral Care"
              >
                <Plus size={20} />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {tasks.length === 0 ? (
                <div className="p-16 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-200 mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-slate-400 font-medium italic">Inbox zero. Great job!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {tasks.slice(0, 5).map(task => (
                    <div key={task.id} className="p-6 px-8 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4 group/item">
                      <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-lg border-2 border-slate-100 flex items-center justify-center group-hover/item:border-indigo-500 transition-colors cursor-pointer" />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{task.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-200 group-hover/item:text-indigo-500 transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Notes Card */}
          <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden group">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-xl font-black tracking-tight flex items-center gap-3 uppercase">
                <FileText className="text-amber-400" />
                Quick Insights
              </CardTitle>
              <CardDescription className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-1">Scratch pad (local only — not synced)</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-4">
              <div className="p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer h-32 overflow-y-auto custom-scrollbar">
                <p className="text-sm font-medium leading-relaxed italic text-slate-300">
                  {notes || 'No notes stored yet. Open Pastoral Care for care cases and follow-up notes.'}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full h-14 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px]"
                onClick={() => onModuleChange?.('discipleship')}
              >
                Open Pastoral Care
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RECENT ACTIVITY */}
        <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
          <CardHeader className="p-10 border-b border-slate-50">
            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-4 uppercase">
              <Activity className="text-emerald-500" />
              At a glance
            </CardTitle>
            <CardDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-2">
              Your open tasks and next events
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Tasks</p>
              {tasks.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium">No open tasks assigned to you.</p>
              ) : (
                <ul className="space-y-2">
                  {tasks.slice(0, 5).map((t) => (
                    <li key={t.id} className="text-sm font-bold text-slate-800 flex justify-between gap-2">
                      <span className="truncate">{t.title}</span>
                      {t.dueDate && (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(t.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Upcoming events</p>
              {events.length === 0 ? (
                <p className="text-sm text-slate-400 font-medium">No events loaded.</p>
              ) : (
                <ul className="space-y-2">
                  {events.slice(0, 5).map((ev) => (
                    <li key={ev.id} className="text-sm font-bold text-slate-800">
                      {ev.name}{' '}
                      <span className="text-slate-400 font-medium text-xs">
                        · {new Date(ev.date).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Button variant="ghost" className="w-full rounded-2xl text-[10px] font-black uppercase tracking-widest" onClick={() => onModuleChange?.('analytics')}>
              Open analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT: Calendar & Stats */}
      <div className="xl:col-span-4 space-y-10">
        <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
           <CardHeader className="p-8 pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Upcoming Events</CardTitle>
           </CardHeader>
           <CardContent className="p-8 pt-0 space-y-6">
              {events.length === 0 ? (
                 <p className="text-xs text-slate-400 italic">No scheduled events for today.</p>
              ) : (
                 events.slice(0, 3).map(event => (
                    <div key={event.id} className="flex gap-4 group cursor-pointer" onClick={() => onModuleChange?.('events')}>
                       <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex flex-col items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <span className="text-[10px] font-black uppercase leading-none">{new Date(event.date).toLocaleString('en-US', { month: 'short' })}</span>
                          <span className="text-lg font-black leading-none mt-0.5">{new Date(event.date).getDate()}</span>
                       </div>
                       <div className="space-y-1 py-1">
                          <p className="text-sm font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{event.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><Clock size={12} /> {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                       </div>
                    </div>
                 ))
              )}
              <Button variant="ghost" className="w-full rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600" onClick={() => onModuleChange?.('events')}>View Calendar</Button>
           </CardContent>
        </Card>

        <Card className="border-none shadow-2xl rounded-[3rem] bg-indigo-600 text-white p-10 overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <Zap size={120} />
           </div>
           <div className="relative z-10 space-y-4">
              <h3 className="text-xl font-black uppercase tracking-tight leading-none">Shortcuts</h3>
              <p className="text-sm font-medium text-indigo-100 leading-relaxed">
                Jump to the modules you use most — same tools as the sidebar, fewer clicks.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                {(roleExp?.dashboardShortcuts ?? ['members', 'events', 'giving', 'attendance'] as ERPModule[]).map((id) => (
                  <Button key={id} type="button" variant="outline" className="w-full justify-center border-white/30 bg-white/10 text-white hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={() => onModuleChange?.(id)}>
                    {id === 'members' ? 'Members' : id === 'events' ? 'Events' : id === 'giving' ? 'Giving' : id === 'discipleship' ? 'Pastoral care' : id === 'finance' ? 'Finance' : id === 'sunday-mode' ? 'Sunday service' : id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ')}
                  </Button>
                ))}
              </div>
           </div>
        </Card>
      </div>
    </div>
  );

  const renderExecutiveView = () => {
    const periodGiving = financial?.totalGiving?.period;
    const givingDisplay =
      periodGiving != null && !Number.isNaN(Number(periodGiving))
        ? `₹${Number(periodGiving).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
        : '—';
    return (
    <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1 w-fit">
        {(
          [
            ['executive', dashboardLensLabel('executive')],
            ['finance', dashboardLensLabel('finance')],
            ['pastoral', dashboardLensLabel('pastoral')],
            ['operations', dashboardLensLabel('operations')],
          ] as const
        )
          .filter(([id]) => {
            const lenses = roleExp?.visibleLenses;
            if (!lenses?.length) return roleExp?.archetype !== 'member_portal';
            return lenses.includes(id);
          })
          .map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setRoleLens(id)}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${roleLens === id ? 'bg-white text-indigo-600' : 'text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {roleLens === 'pastoral' ? (
        <PastoralInsightPanel onModuleChange={onModuleChange} />
      ) : (
        <ExecutiveInsightPanel />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <StatCard label="Total members" value={analytics?.total ?? '—'} icon={Users} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
         <StatCard label="Active (status)" value={analytics?.active ?? '—'} icon={Users} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
         <StatCard label="New members (period)" value={analytics?.newMembers?.period ?? '—'} icon={TrendingUp} iconColor="text-sky-600" iconBg="bg-sky-50" />
         <StatCard label="Giving (period)" value={givingDisplay} icon={Heart} iconColor="text-rose-600" iconBg="bg-rose-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
            <CardHeader className="p-10 border-b border-slate-50">
               <CardTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase">At a glance</CardTitle>
               <CardDescription className="text-slate-500 font-medium text-sm mt-2">
                 Quick counts from your church records. Open Reports for full detail.
               </CardDescription>
            </CardHeader>
            <CardContent className="p-10 space-y-4 text-sm text-slate-600 font-medium">
              <p>Upcoming events loaded on this dashboard: <span className="font-black text-slate-900">{events.length}</span></p>
              <Button variant="outline" className="rounded-xl font-black uppercase text-[10px] tracking-widest" onClick={() => onModuleChange?.('analytics')}>
                Open reports
              </Button>
            </CardContent>
         </Card>

         <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white overflow-hidden relative">
            <CardHeader className="p-10 pb-4 relative z-10">
               <CardTitle className="text-xl font-black tracking-tight uppercase flex items-center gap-3">
                  <ShieldCheck className="text-emerald-400" />
                  Go to work
               </CardTitle>
               <CardDescription className="text-slate-400 text-xs font-medium mt-2">
                 Practical entry points for weekly church operations.
               </CardDescription>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-3 relative z-10">
               {(['attendance', 'giving', 'events'] as ERPModule[]).map((id) => (
                 <Button key={id} type="button" variant="outline" className="w-full justify-center border-white/20 bg-white/5 text-white hover:bg-white/15 rounded-xl text-[10px] font-black uppercase tracking-widest" onClick={() => onModuleChange?.(id)}>
                    {id === 'events' ? 'Worship Services' : id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ')}
                 </Button>
               ))}
            </CardContent>
         </Card>
      </div>

      {roleLens !== 'executive' && (
        <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
          <CardHeader className="p-10 border-b border-slate-50">
            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              {roleLens === 'finance' ? 'Finance desk' : roleLens === 'pastoral' ? 'Pastoral care' : 'Operations desk'}
            </CardTitle>
            <CardDescription className="text-xs uppercase tracking-widest font-bold text-slate-400">
              Shortcuts for your weekly role
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {roleLens === 'finance' && (
              <>
                <Button className="h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={() => onModuleChange?.('finance')}>Voucher registry</Button>
                <Button variant="outline" className="h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={() => onModuleChange?.('budgets')}>Fund and budgets</Button>
                <Button variant="outline" className="h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={() => onModuleChange?.('audit-logs')}>Approvals & history</Button>
              </>
            )}
            {roleLens === 'pastoral' && (
              <>
                <Button className="h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={() => onModuleChange?.('members')}>Member care</Button>
                <Button variant="outline" className="h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={() => onModuleChange?.('giving')}>Donor follow-up</Button>
                <Button variant="outline" className="h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={() => onModuleChange?.('events')}>Upcoming events</Button>
              </>
            )}
            {roleLens === 'operations' && (
              <>
                {(roleExp?.dashboardShortcuts ?? ['events', 'volunteers', 'attendance'] as ERPModule[]).map((id, idx) => (
                  <Button
                    key={id}
                    variant={idx === 0 ? 'default' : 'outline'}
                    className="h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                    onClick={() => onModuleChange?.(id)}
                  >
                    {id === 'sunday-mode'
                      ? 'Sunday service'
                      : id === 'volunteers'
                        ? 'Volunteer desk'
                        : id === 'small-groups'
                          ? 'Small groups'
                          : id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, ' ')}
                  </Button>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
    );
  };

  return (
    <PageLayout>
      {loadWarning ? (
        <FeedbackBanner tone="warning">
          <div className="flex items-center justify-between gap-4">
            <span>{loadWarning}</span>
            <Button size="sm" variant="outline" onClick={() => void loadDashboard()}>
              Retry
            </Button>
          </div>
        </FeedbackBanner>
      ) : null}
      {roleExp && FIRST_DAY_ARCHETYPES.includes(roleExp.archetype) ? (
        <RoleFirstDayPanel archetype={roleExp.archetype} onModuleChange={onModuleChange} />
      ) : null}
      <QuickTestNextCard className="mb-2" />
      <OnboardingChecklist compact onModuleChange={(m) => onModuleChange?.(m)} />
      {!roleExp?.focusedHome && view === 'operations' ? (
        <OnboardingChecklist onModuleChange={(m) => onModuleChange?.(m)} />
      ) : null}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className={ds.pageTitle}>
            {roleExp?.title ?? (view === 'personal' ? 'Welcome back' : 'Overview')}
          </h1>
          <p className={cn(ds.pageSubtitle, 'text-base')}>
            {roleExp?.subtitle ?? (view === 'personal' ? 'Here is a snapshot of your day and responsibilities.' : 'A clear view of church life this week.')}
          </p>
        </div>

        {!roleExp?.focusedHome ? (
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[1.5rem]">
           <button
             onClick={() => setView('personal')}
             className={cn(
               "flex items-center gap-3 px-6 py-3 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all",
               view === 'personal' ? "bg-white text-indigo-600 shadow-xl shadow-indigo-100/50" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
             )}
           >
             <User size={16} />
             My day
           </button>
           <button
             onClick={() => setView('executive')}
             className={cn(
               "flex items-center gap-3 px-6 py-3 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all",
               view === 'executive' ? "bg-white text-indigo-600 shadow-xl shadow-indigo-100/50" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
             )}
           >
             <LayoutDashboard size={16} />
             Overview
           </button>
           <button
             onClick={() => setView('operations')}
             className={cn(
               "flex items-center gap-3 px-6 py-3 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all",
               view === 'operations' ? "bg-white text-indigo-600 shadow-xl shadow-indigo-100/50" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
             )}
           >
             <Activity size={16} />
             This week
           </button>
        </div>
        ) : null}
      </div>

      {(() => {
        const displayView = roleExp?.focusedHome
          ? roleExp.archetype === 'staff_desk'
            ? 'personal'
            : roleExp.archetype === 'accountant'
              ? 'executive'
              : 'operations'
          : view;
        if (displayView === 'operations') {
          return <OperationsCommandCenter onModuleChange={(m) => onModuleChange?.(m)} />;
        }
        if (displayView === 'personal') {
          return renderPersonalView();
        }
        return renderExecutiveView();
      })()}
      
      {/* Global CSS for scrollbars */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
      `}</style>
    </PageLayout>
  );
}
