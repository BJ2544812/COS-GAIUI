import React from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3, Users, Layers, CalendarCheck, ShieldCheck,
  Library, HeartHandshake, Building2, Star,
  FileBox, Globe, ChevronRight, Search, Bell,
  User, Settings, MessageCircle, Heart, CreditCard,
  Target, Home, Network, Route, Mic2, Music4,
  Cpu, ScrollText, GraduationCap, Compass,
  X, CheckCircle2, TrendingUp, ChevronDown,
  Briefcase, Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { ERPModule, ModuleStatus } from '@/types';
import { navGroupLabel, navLabel } from '@/lib/churchProductCopy';
import { getRoleExperience, shouldShowInSidebar, sortNavGroups } from '@/lib/roleExperience';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/context/AuthContext';
import { QuickOpsBar } from '@/components/operations/QuickOpsBar';
import { WalkthroughPanel } from '@/components/walkthrough/WalkthroughPanel';

interface AppShellProps {
  children: React.ReactNode;
  activeModule: ERPModule;
  adminTab?: string;
  onModuleChange: (module: ERPModule, tab?: string) => void;
  onNavigateBack?: () => void;
  onLogout?: () => void;
  currentUser?: any;
  sessionRestoring?: boolean;
}

type ModuleItem = {
  id: ERPModule;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
  status: ModuleStatus;
};

type GroupDef = { label: string; color: string; items: ModuleItem[] };

const GROUPS: GroupDef[] = [
  {
    label: 'Identity', color: 'text-indigo-500',
    items: [
      { id: 'members',      label: 'Members',          icon: Users,          permission: 'manage_members',      status: 'live' },
      { id: 'families',     label: 'Families',         icon: Home,           permission: 'manage_members',      status: 'partial' },
      { id: 'volunteers',   label: 'Volunteers',       icon: HeartHandshake, permission: 'manage_members',      status: 'partial' },
      { id: 'hr',           label: 'HR & Staff',         icon: ShieldCheck,   permission: 'manage_members',      status: 'live' },
      { id: 'small-groups', label: 'Small Groups',     icon: Network,        permission: 'manage_members',      status: 'live' },
      { id: 'pathways',     label: 'Growth Pathways',  icon: Route,          permission: 'manage_members',      status: 'live' },
      { id: 'discipleship', label: 'Pastoral Care',    icon: Target,       permission: 'manage_members',      status: 'live' },
    ],
  },
  {
    label: 'Operations', color: 'text-sky-500',
    items: [
      { id: 'sunday-services', label: 'Sunday & Services', icon: Music4,         permission: 'manage_events',       status: 'live' },
      { id: 'sunday-mode',     label: 'Sunday Service',    icon: CalendarCheck,  permission: 'manage_events',       status: 'live' },
      { id: 'events',          label: 'Events',            icon: Star,           permission: 'manage_events',       status: 'operational' },
      { id: 'attendance',      label: 'Attendance',        icon: CalendarCheck,  permission: 'manage_attendance',   status: 'operational' },
      { id: 'outreach',    label: 'Visitors & Outreach', icon: Globe,        permission: 'manage_outreach',       status: 'live' },
      { id: 'structure',   label: 'Church Structure',  icon: Layers,         permission: 'manage_settings',     status: 'partial' },
    ],
  },
  {
    label: 'Finance', color: 'text-emerald-500',
    items: [
      { id: 'giving',    label: 'Giving', icon: Heart,      permission: 'manage_giving',   status: 'live' },
      { id: 'finance',   label: 'Finance',   icon: CreditCard,    permission: 'manage_finance',  status: 'live' },
      { id: 'budgets',   label: 'Budgets', icon: Target,     permission: 'manage_finance',  status: 'operational' },
      { id: 'vendors',   label: 'Vendors & Payroll', icon: Library,   permission: 'manage_finance',  status: 'operational' },
      { id: 'assets',    label: 'Assets',       icon: Building2,     permission: 'manage_assets',   status: 'live' },
      { id: 'documents', label: 'Church Documents', icon: FileBox, permission: 'manage_assets',   status: 'live' },
    ],
  },
  {
    label: 'Engagement', color: 'text-rose-500',
    items: [
      { id: 'sermons',       label: 'Sermons',       icon: Mic2,          permission: 'manage_events',       status: 'operational' },
      { id: 'communication', label: 'Communications', icon: MessageCircle, permission: 'manage_communication',status: 'live' },
      { id: 'notifications', label: 'Notifications', icon: Bell,          permission: 'manage_communication',status: 'live' },
    ],
  },
  {
    label: 'Website', color: 'text-violet-500',
    items: [
      { id: 'website',       label: 'Website Builder', icon: Globe,      permission: 'manage_settings', status: 'operational' },
    ],
  },
  {
    label: 'Insights & Audit', color: 'text-amber-500',
    items: [
      { id: 'dashboard',        label: 'Home',               icon: BarChart3,  permission: 'manage_analytics', status: 'live' },
      { id: 'analytics',        label: 'Reports',            icon: TrendingUp, permission: 'manage_analytics', status: 'live' },
      { id: 'academy',          label: 'Academy',            icon: GraduationCap, permission: 'manage_analytics', status: 'live' },
      { id: 'audit-logs',       label: 'Change History',     icon: ScrollText, permission: 'manage_settings',  status: 'live' },
      { id: 'workflow-monitor', label: 'Activity Log',       icon: Cpu,        permission: 'manage_settings',  status: 'live' },
    ],
  },
  {
    label: 'Platform', color: 'text-slate-500',
    items: [
      { id: 'settings',        label: 'Settings',         icon: Settings,    permission: 'manage_settings', status: 'live' },
      { id: 'admin-center',    label: 'Church Admin',     icon: ShieldCheck, permission: 'manage_settings', status: 'live' },
      { id: 'permissions',     label: 'Roles & Access',   icon: ShieldCheck, permission: 'manage_settings', status: 'live' },
    ],
  },
];

export function AppShell({
  children,
  activeModule,
  adminTab,
  onModuleChange,
  onNavigateBack,
  onLogout,
  currentUser = null,
  sessionRestoring = false,
}: AppShellProps) {
  const { has, hasAny } = usePermissions();
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showCommandPalette, setShowCommandPalette] = React.useState(false);
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [licensePlan, setLicensePlan] = React.useState<string | null>(null);
  const [maintenanceMsg, setMaintenanceMsg] = React.useState<string | null>(null);
  const [showWalkthrough, setShowWalkthrough] = React.useState(false);

  React.useEffect(() => {
    if (activeModule) localStorage.setItem('church_erp_last_module', activeModule);
  }, [activeModule]);

  React.useEffect(() => {
    if (!currentUser) return;
    void apiRequest<unknown>('deploy/license', { method: 'GET' })
      .then((j) => {
        const d = parseApiResponse<{ plan?: string }>(j);
        setLicensePlan(d.plan ?? null);
      })
      .catch(() => undefined);
    void apiRequest<unknown>('deploy/maintenance', { method: 'GET' })
      .then((j) => {
        const d = parseApiResponse<{ enabled?: boolean; message?: string }>(j);
        setMaintenanceMsg(d.enabled ? d.message ?? 'The church office is in maintenance mode. Please try again later.' : null);
      })
      .catch(() => undefined);
  }, [currentUser]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setShowCommandPalette(o => !o); }
      if (e.key === 'l' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onModuleChange('sunday-mode');
      }
      if (e.key === 'd' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onModuleChange('dashboard');
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [onModuleChange]);

  React.useEffect(() => {
    if (!currentUser) return;
    const fetchNotifs = async () => {
      try {
        const res = await apiRequest('notifications');
        const data = parseApiResponse<any[]>(res);
        if (data) setNotifications(data);
      } catch {}
    };
    fetchNotifs();
    const t = setInterval(fetchNotifs, 30000);
    return () => clearInterval(t);
  }, [currentUser]);

  const unreadCount = notifications.filter(n => n.status === 'unread').length;
  const activeLabel = React.useMemo(() => navLabel(activeModule), [activeModule]);

  const activeGroup = React.useMemo(() => {
    return GROUPS.find((g) => g.items.some((m) => m.id === activeModule))?.label ?? '';
  }, [activeModule]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiRequest(`notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiRequest('notifications/read-all', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
    } catch {}
  };

  const toggleGroup = (label: string) => setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));

  const canSeeItem = (item: ModuleItem) => {
    if (item.id === 'dashboard') return hasAny(['manage_analytics','manage_finance','manage_giving','manage_members','manage_attendance']);
    if (item.id === 'academy') return has('manage_analytics');
    if (item.id === 'hr') return hasAny(['manage_hr', 'manage_members']);
    if (item.id === 'documents') return hasAny(['manage_assets', 'manage_documents']);
    if (item.id === 'outreach') return hasAny(['manage_outreach', 'manage_communication']);
    if (item.id === 'discipleship') return hasAny(['manage_discipleship', 'manage_members']);
    return has(item.permission);
  };

  const roleExp = React.useMemo(() => {
    if (!currentUser?.role) return null;
    return getRoleExperience({
      role: currentUser.role,
      permissions: Array.isArray(currentUser.permissions) ? currentUser.permissions : [],
    });
  }, [currentUser]);

  const orderedGroups = React.useMemo(
    () => (roleExp?.navGroupOrder.length ? sortNavGroups(GROUPS, roleExp.navGroupOrder) : GROUPS),
    [roleExp],
  );

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <div className="flex min-h-screen w-full bg-slate-50/50">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-900/40 md:hidden"
          onClick={closeMobileNav}
        />
      )}
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'w-64 shrink-0 flex flex-col bg-white border-r border-slate-200 z-50',
          'fixed md:sticky top-0 h-screen overflow-hidden transition-transform duration-200',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-slate-100 shrink-0">
          <button onClick={() => onModuleChange('dashboard')} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/30 group-hover:bg-indigo-700 transition-colors">K</div>
            <div className="text-left">
              <p className="font-black text-slate-900 text-sm leading-none tracking-tight">KINGDOM OS</p>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-0.5">Ministry operating system</p>
            </div>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {orderedGroups.map(group => {
            const visibleItems = group.items.filter(
              (item) => canSeeItem(item) && shouldShowInSidebar(roleExp, item.id as import('@/types').ERPModule),
            );
            if (visibleItems.length === 0) return null;
            const isCollapsed = collapsedGroups[group.label];
            return (
              <div key={group.label} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-3 py-1.5 group"
                >
                  <span className={cn('text-[9px] font-black uppercase tracking-[0.18em]', group.color)}>{navGroupLabel(group.label)}</span>
                  <ChevronDown className={cn('w-3 h-3 text-slate-300 transition-transform duration-200', isCollapsed && '-rotate-90')} />
                </button>
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {visibleItems.map(item => {
                      const isActive = activeModule === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-testid={`nav-${item.id}`}
                          onClick={() => onModuleChange(item.id)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group/item text-left',
                            isActive
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          )}
                        >
                          <item.icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-indigo-600' : 'text-slate-400 group-hover/item:text-slate-600')} />
                          <span className="flex-1 truncate">{navLabel(item.id, item.label)}</span>
                          {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="shrink-0 border-t border-slate-100 p-3">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-black">
              {currentUser?.username?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{currentUser?.username ?? 'User'}</p>
              <p className="text-[10px] text-slate-400 font-medium truncate">{currentUser?.role ?? ''}</p>
            </div>
            <Link to="/portal" title="Member portal" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors">
              <Heart className="w-3.5 h-3.5" />
            </Link>
            <button onClick={() => onModuleChange('profile')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <User className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full md:pl-0">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
          <button
            type="button"
            aria-label="Open navigation"
            className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 shrink-0"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          {onNavigateBack && (
            <button
              type="button"
              onClick={onNavigateBack}
              className="hidden sm:inline-flex text-xs font-bold text-slate-500 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-slate-50 shrink-0"
            >
              Back
            </button>
          )}
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm min-w-0 flex-1">
            <button type="button" onClick={() => onModuleChange('dashboard')} className="text-slate-400 font-medium hover:text-indigo-600">
              Church Office
            </button>
            {activeGroup && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-slate-400 font-medium">{activeGroup}</span>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-slate-800">{activeLabel}</span>
            {adminTab && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                <span className="font-medium text-slate-600 capitalize">{adminTab.replace(/_/g, ' ')}</span>
              </>
            )}
            {licensePlan && (
              <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                {licensePlan}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowWalkthrough(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              title="Explore Ultimate Church OS by role"
            >
              <Compass className="w-4 h-4" />
              Explore Ultimate Church OS
            </button>

            {/* Search */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="hidden md:flex items-center gap-2 pl-3 pr-4 py-1.5 bg-slate-100 rounded-full text-sm text-slate-400 hover:bg-slate-200 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="font-medium">Search…</span>
              <kbd className="ml-2 text-[10px] font-black bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-500">⌘K</kbd>
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn('relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors', showNotifications ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100')}
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                    <div className="flex items-center gap-3">
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllAsRead} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                          Mark all read
                        </button>
                      )}
                      <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-medium">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        No notifications
                      </div>
                    ) : notifications.slice(0, 10).map(n => (
                      <div
                        key={n.id}
                        onClick={() => { handleMarkAsRead(n.id); setShowNotifications(false); }}
                        className={cn('p-4 flex gap-3 cursor-pointer hover:bg-slate-50 transition-colors', n.status === 'unread' && 'bg-indigo-50/30')}
                      >
                        <div className="shrink-0 mt-0.5">
                          {n.status === 'unread'
                            ? <div className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5" />
                            : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-xs font-bold leading-tight truncate', n.priority === 'HIGH' ? 'text-rose-600' : 'text-slate-900')}>{n.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Logout */}
            {onLogout && (
              <button onClick={onLogout} className="hidden md:block text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50">
                Sign out
              </button>
            )}
          </div>
        </header>

        {sessionRestoring && (
          <div className="shrink-0 bg-indigo-50 border-b border-indigo-100 px-4 py-2 text-center text-xs font-semibold text-indigo-700">
            Restoring session…
          </div>
        )}

        {maintenanceMsg && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-sm font-medium text-amber-900" role="status">
            {maintenanceMsg} (Settings admins can still operate.)
          </div>
        )}

        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 pb-24 md:pb-8 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>

      <QuickOpsBar
        activeModule={activeModule}
        onModuleChange={onModuleChange}
        hidden={roleExp ? !roleExp.showQuickOps : false}
        modules={roleExp?.quickOps}
      />

      {showWalkthrough && <WalkthroughPanel onClose={() => setShowWalkthrough(false)} />}

      {showCommandPalette && (
        <CommandPaletteOverlay
          onClose={() => setShowCommandPalette(false)}
          onModuleChange={(m) => {
            const label = GROUPS.flatMap((g) => g.items).find((i) => i.id === m)?.label ?? m;
            import('@/lib/recentActivity').then(({ recordRecentModule }) => recordRecentModule(m, label));
            onModuleChange(m);
          }}
          visibleModules={GROUPS.flatMap((g) => g.items).filter(canSeeItem)}
        />
      )}
    </div>
  );
}

function CommandPaletteOverlay({
  onClose,
  onModuleChange,
  visibleModules,
}: {
  onClose: () => void;
  onModuleChange: (m: ERPModule) => void;
  visibleModules: ModuleItem[];
}) {
  const [query, setQuery] = React.useState('');
  const [members, setMembers] = React.useState<any[]>([]);
  const [events, setEvents] = React.useState<any[]>([]);
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [volunteers, setVolunteers] = React.useState<any[]>([]);
  const [prayers, setPrayers] = React.useState<any[]>([]);
  const [workflows, setWorkflows] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [recent, setRecent] = React.useState<import('@/lib/recentActivity').RecentEntry[]>([]);

  React.useEffect(() => {
    import('@/lib/recentActivity').then(({ getRecentModules }) => setRecent(getRecentModules()));
  }, []);

  React.useEffect(() => {
    if (query.length < 2) {
      setMembers([]);
      setEvents([]);
      setTasks([]);
      setVolunteers([]);
      setPrayers([]);
      setWorkflows([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiRequest<unknown>(`platform/search?q=${encodeURIComponent(query)}`);
        const data = parseApiResponse<{
          members: any[];
          events: any[];
          tasks: any[];
          volunteers?: any[];
          prayers?: any[];
          workflows?: any[];
        }>(res);
        setMembers(data.members ?? []);
        setEvents(data.events ?? []);
        setTasks(data.tasks ?? []);
        setVolunteers(data.volunteers ?? []);
        setPrayers(data.prayers ?? []);
        setWorkflows(data.workflows ?? []);
      } catch {
        const res = await apiRequest(`members?search=${encodeURIComponent(query)}`);
        setMembers(parseApiResponse(res) || []);
        setEvents([]);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const filteredModules = query.length > 0
    ? visibleModules.filter(m => m.label.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 border-b border-slate-100">
          <Search className="w-4 h-4 text-indigo-500 shrink-0" />
          <input
            autoFocus type="text"
            className="flex-1 h-14 bg-transparent outline-none text-base font-semibold text-slate-900 placeholder:text-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg"
            aria-label="Global search"
            placeholder="Search members, events, tasks, modules…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredModules.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Modules</p>
              {filteredModules.map(m => (
                <button key={m.id} onClick={() => { onClose(); onModuleChange(m.id); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors text-left group">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                    <m.icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">{m.label}</span>
                </button>
              ))}
            </div>
          )}
          {events.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Events & services</p>
              {events.slice(0, 4).map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    sessionStorage.setItem('ucos_open_event_id', ev.id);
                    onModuleChange(ev.type === 'Service' ? 'services' : 'events');
                  }}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left text-sm font-bold text-slate-900 truncate"
                >
                  {ev.name}
                </button>
              ))}
            </div>
          )}
          {tasks.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Tasks</p>
              {tasks.slice(0, 3).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    onModuleChange('discipleship');
                  }}
                  className="w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left text-sm font-bold text-slate-800 truncate"
                >
                  {t.title}
                </button>
              ))}
            </div>
          )}
          {members.length > 0 && (
            <div>
              <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Members</p>
              {members.slice(0, 5).map(m => (
                <button key={m.id} onClick={() => { onClose(); onModuleChange('members'); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                    {m.name?.[0] ?? 'M'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{m.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{m.status}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {volunteers.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Volunteers</p>
              {volunteers.slice(0, 3).map((v) => (
                <button key={v.id} type="button" onClick={() => { onClose(); onModuleChange('volunteers'); }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 text-left text-sm font-bold truncate">
                  {v.member?.name ?? v.role}
                </button>
              ))}
            </div>
          )}
          {prayers.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Prayer</p>
              {prayers.slice(0, 3).map((p) => (
                <button key={p.id} type="button" onClick={() => { onClose(); onModuleChange('discipleship'); }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 text-left text-sm truncate">
                  {(p.content as string)?.slice(0, 60)}
                </button>
              ))}
            </div>
          )}
          {workflows.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Workflows</p>
              {workflows.slice(0, 3).map((w) => (
                <button key={w.id} type="button" onClick={() => { onClose(); onModuleChange('workflow-monitor'); }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 text-left text-sm font-bold truncate">
                  {w.eventName} · {w.status}
                </button>
              ))}
            </div>
          )}
          {query.length === 0 && recent.length > 0 && (
            <div className="mb-2">
              <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Recent</p>
              {recent.slice(0, 5).map((r) => (
                <button key={`${r.module}-${r.at}`} type="button" onClick={() => { onClose(); onModuleChange(r.module); }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 text-left text-sm font-bold text-slate-700">
                  {r.label}
                </button>
              ))}
            </div>
          )}
          {query.length === 0 && (
            <div>
              <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Access</p>
              {(['members', 'attendance', 'sunday-mode', 'admin-center', 'giving', 'finance', 'discipleship', 'dashboard'] as ERPModule[])
                .filter((id) => visibleModules.some((m) => m.id === id))
                .map((id) => {
                const Icon =
                  id === 'members' ? Users
                  : id === 'attendance' ? CalendarCheck
                  : id === 'sunday-mode' ? CalendarCheck
                  : id === 'admin-center' ? ShieldCheck
                  : id === 'giving' ? Heart
                  : id === 'finance' ? CreditCard
                  : id === 'discipleship' ? Target
                  : BarChart3;
                return (
                <button key={id} onClick={() => { onClose(); onModuleChange(id); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                    <Icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{navLabel(id)}</span>
                </button>
              );})}
            </div>
          )}
          {loading && <div className="p-4 text-center text-sm font-medium text-slate-400">Searching…</div>}
        </div>
      </div>
    </div>
  );
}
