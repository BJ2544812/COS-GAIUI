import React from 'react';
import {
  CheckCircle2,
  Clock,
  LayoutDashboard,
  Users,
  TrendingUp,
  Activity,
  ChevronRight,
  User,
  Heart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { FeedbackBanner, StatCard, PageLayout } from '@/components/modules/ModuleHeader';
import { ds } from '@/lib/designSystem';
import { cn } from '@/lib/utils';
import { ERPModule } from '@/types';
import { OperationsCommandCenter } from '@/components/operations/OperationsCommandCenter';
import { ExecutiveInsightPanel } from '@/components/intelligence/ExecutiveInsightPanel';
import { PastoralInsightPanel } from '@/components/intelligence/PastoralInsightPanel';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { usePermissions } from '@/context/AuthContext';
import { dashboardLensLabel } from '@/lib/churchProductCopy';
import { getRoleExperience, type DashboardLens } from '@/lib/roleExperience';
import { homeLayoutForArchetype, showHomeOnboardingWidgets } from '@/lib/homeLayout';
import {
  filterOperationalTestArtifacts,
  filterOperationalTestTaskTitles,
} from '@/lib/operationalEventFilter';

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
          const raw = parseApiResponse<any[]>(tasksRaw.value) || [];
          setTasks(filterOperationalTestTaskTitles(raw));
        } else {
          setTasks([]);
        }
        if (eventsRaw.status === 'fulfilled') {
          const raw = parseApiResponse<any[]>(eventsRaw.value) || [];
          setEvents(filterOperationalTestArtifacts(raw));
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
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="xl:col-span-8 space-y-8">
        <Card className="border border-slate-100 shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
                <CheckCircle2 className="text-indigo-500" />
                Your tasks today
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm mt-1">Follow-ups assigned to you</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => onModuleChange?.('discipleship')}
            >
              Open pastoral care
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {tasks.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-slate-600 font-medium">Nothing urgent right now.</p>
                <p className="text-sm text-slate-400">New care tasks will appear here when assigned.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {tasks.slice(0, 8).map((task) => (
                  <div key={task.id} className="p-5 px-8 hover:bg-slate-50/50 transition-colors flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="xl:col-span-4 space-y-8">
        <Card className="border border-slate-100 shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Upcoming this week</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            {events.length === 0 ? (
              <p className="text-sm text-slate-400">No events scheduled yet.</p>
            ) : (
              events.slice(0, 4).map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className="flex gap-3 w-full text-left group"
                  onClick={() => onModuleChange?.('events')}
                >
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex flex-col items-center justify-center text-indigo-600 shrink-0">
                    <span className="text-[9px] font-semibold leading-none">
                      {new Date(event.date).toLocaleString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-base font-bold leading-none">{new Date(event.date).getDate()}</span>
                  </div>
                  <div className="py-0.5 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate group-hover:text-indigo-600">{event.name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </button>
              ))
            )}
            <Button variant="ghost" className="w-full text-sm text-indigo-600" onClick={() => onModuleChange?.('events')}>
              View calendar
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-indigo-100 bg-indigo-50/50 rounded-3xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Quick links</h3>
          <div className="flex flex-col gap-2">
            {(roleExp?.dashboardShortcuts ?? ['members', 'events', 'sunday-mode'] as ERPModule[]).slice(0, 4).map((id) => (
              <Button
                key={id}
                type="button"
                variant="outline"
                className="w-full justify-start rounded-xl text-sm"
                onClick={() => onModuleChange?.(id)}
              >
                {id === 'members' ? 'Find a member' : id === 'events' ? 'Events' : id === 'outreach' ? 'Register a visitor' : id === 'sunday-mode' ? 'Sunday service' : id.replace(/-/g, ' ')}
              </Button>
            ))}
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
    const isPastoralHome = roleLens === 'pastoral';
    return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-700">
      {!isPastoralHome && (
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
            className={`px-4 py-2 rounded-lg text-sm font-medium ${roleLens === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>
      )}

      {isPastoralHome ? (
        <>
          <PastoralInsightPanel onModuleChange={onModuleChange} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            <StatCard label="Members" value={analytics?.total ?? '—'} icon={Users} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
            <StatCard label="Giving this period" value={givingDisplay} icon={Heart} iconColor="text-rose-600" iconBg="bg-rose-50" />
          </div>
        </>
      ) : (
        <>
          {roleLens === 'pastoral' ? (
            <PastoralInsightPanel onModuleChange={onModuleChange} />
          ) : (
            <ExecutiveInsightPanel />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Members" value={analytics?.total ?? '—'} icon={Users} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
            <StatCard label="Active members" value={analytics?.active ?? '—'} icon={Users} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
            <StatCard label="New this period" value={analytics?.newMembers?.period ?? '—'} icon={TrendingUp} iconColor="text-sky-600" iconBg="bg-sky-50" />
            <StatCard label="Giving this period" value={givingDisplay} icon={Heart} iconColor="text-rose-600" iconBg="bg-rose-50" />
          </div>
        </>
      )}

      {roleLens === 'finance' && (
        <Card className="border border-slate-100 shadow-sm rounded-3xl">
          <CardHeader className="p-6">
            <CardTitle className="text-lg font-semibold">Finance desk</CardTitle>
            <CardDescription className="text-sm text-slate-500">Common tasks for your accounting week</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button className="h-12 rounded-xl" onClick={() => onModuleChange?.('finance')}>Review vouchers</Button>
            <Button variant="outline" className="h-12 rounded-xl" onClick={() => onModuleChange?.('giving')}>Record gifts</Button>
            <Button variant="outline" className="h-12 rounded-xl" onClick={() => onModuleChange?.('audit-logs')}>Approval history</Button>
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
      {showHomeOnboardingWidgets() ? (
        <OnboardingChecklist compact onModuleChange={(m) => onModuleChange?.(m)} />
      ) : null}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className={ds.pageTitle}>
            {roleExp?.title ?? (view === 'personal' ? 'Welcome back' : 'Home')}
          </h1>
          <p className={cn(ds.pageSubtitle, 'text-base')}>
            {roleExp?.archetype === 'senior_pastor'
              ? 'What needs your attention today.'
              : roleExp?.subtitle ?? (view === 'personal' ? 'Your tasks and schedule for today.' : 'A clear view of church life this week.')}
          </p>
        </div>

        {!roleExp?.focusedHome ? (
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl">
           <button
             onClick={() => setView('personal')}
             className={cn(
               "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
               view === 'personal' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
             )}
           >
             <User size={16} />
             My day
           </button>
           <button
             onClick={() => setView('executive')}
             className={cn(
               "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
               view === 'executive' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
             )}
           >
             <LayoutDashboard size={16} />
             Overview
           </button>
           <button
             onClick={() => setView('operations')}
             className={cn(
               "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
               view === 'operations' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
             )}
           >
             <Activity size={16} />
             This week
           </button>
        </div>
        ) : null}
      </div>

      {(() => {
        const homeLayout = roleExp ? homeLayoutForArchetype(roleExp.archetype) : 'operations';
        const displayView = roleExp?.focusedHome
          ? homeLayout === 'personal'
            ? 'personal'
            : homeLayout === 'pastoral' || homeLayout === 'finance'
              ? 'executive'
              : 'operations'
          : view;
        if (displayView === 'operations') {
          return <OperationsCommandCenter compact onModuleChange={(m) => onModuleChange?.(m)} />;
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
