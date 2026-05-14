import React from 'react';
import {
  BarChart3, Users, Layers, CalendarCheck, ShieldCheck,
  Library, HeartHandshake, Building2, Star,
  FileBox, Globe, ChevronRight, Search, Bell,
  User, Settings, MessageCircle, Heart, CreditCard,
  Target, Home, Network, Route, Mic2, Music4,
  Cpu, ScrollText,
  X, CheckCircle2, TrendingUp, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { ERPModule, ModuleStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/context/AuthContext';

interface AppShellProps {
  children: React.ReactNode;
  activeModule: ERPModule;
  onModuleChange: (module: ERPModule) => void;
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

const STATUS_DOT: Record<ModuleStatus, string> = {
  live:            'bg-emerald-400',
  operational:     'bg-teal-400',
  partial:         'bg-amber-400',
  prototype:       'bg-orange-400',
  placeholder:     'bg-slate-400',
  'backend-ready': 'bg-blue-400',
  planned:         'bg-slate-300',
  experimental:    'bg-purple-400',
};

const GROUPS: GroupDef[] = [
  {
    label: 'Identity', color: 'text-indigo-500',
    items: [
      { id: 'members',      label: 'Members',          icon: Users,          permission: 'manage_members',      status: 'live' },
      { id: 'families',     label: 'Families',         icon: Home,           permission: 'manage_members',      status: 'partial' },
      { id: 'volunteers',   label: 'Volunteers',       icon: HeartHandshake, permission: 'manage_members',      status: 'partial' },
      { id: 'small-groups', label: 'Small Groups',     icon: Network,        permission: 'manage_members',      status: 'backend-ready' },
      { id: 'pathways',     label: 'Pathways',         icon: Route,          permission: 'manage_members',      status: 'backend-ready' },
      { id: 'discipleship', label: 'Shepherd Workspace', icon: Target,       permission: 'manage_members',      status: 'partial' },
    ],
  },
  {
    label: 'Operations', color: 'text-sky-500',
    items: [
      { id: 'events',      label: 'Events',            icon: Star,           permission: 'manage_events',       status: 'operational' },
      { id: 'attendance',  label: 'Attendance',        icon: CalendarCheck,  permission: 'manage_attendance',   status: 'operational' },
      { id: 'worship',     label: 'Worship planning',  icon: Music4,         permission: 'manage_events',       status: 'partial' },
      { id: 'outreach',    label: 'Outreach',          icon: Globe,          permission: 'manage_communication',status: 'partial' },
      { id: 'structure',   label: 'Church Structure',  icon: Layers,         permission: 'manage_settings',     status: 'partial' },
    ],
  },
  {
    label: 'Finance', color: 'text-emerald-500',
    items: [
      { id: 'giving',    label: 'Giving',       icon: Heart,         permission: 'manage_giving',   status: 'live' },
      { id: 'finance',   label: 'Accounting',   icon: CreditCard,    permission: 'manage_finance',  status: 'live' },
      { id: 'assets',    label: 'Assets',       icon: Building2,     permission: 'manage_assets',   status: 'live' },
      { id: 'documents', label: 'Documents',    icon: FileBox,       permission: 'manage_assets',   status: 'live' },
    ],
  },
  {
    label: 'Engagement', color: 'text-rose-500',
    items: [
      { id: 'sermons',       label: 'Sermons',       icon: Mic2,          permission: 'manage_events',       status: 'operational' },
      { id: 'communication', label: 'Communication', icon: MessageCircle, permission: 'manage_communication',status: 'partial' },
      { id: 'notifications', label: 'Notifications', icon: Bell,          permission: 'manage_communication',status: 'partial' },
    ],
  },
  {
    label: 'Website', color: 'text-violet-500',
    items: [
      { id: 'website',       label: 'Website Builder', icon: Globe,      permission: 'manage_settings', status: 'operational' },
    ],
  },
  {
    label: 'Insights', color: 'text-amber-500',
    items: [
      { id: 'dashboard',        label: 'Dashboard',          icon: BarChart3,  permission: 'manage_analytics', status: 'partial' },
      { id: 'analytics',        label: 'Analytics',          icon: TrendingUp, permission: 'manage_analytics', status: 'partial' },
      { id: 'workflow-monitor', label: 'Event queue',        icon: Cpu,        permission: 'manage_settings',  status: 'operational' },
      { id: 'audit-logs',       label: 'Audit Logs',         icon: ScrollText, permission: 'manage_settings',  status: 'backend-ready' },
    ],
  },
  {
    label: 'Platform', color: 'text-slate-500',
    items: [
      { id: 'settings',        label: 'System Settings',  icon: Settings,    permission: 'manage_settings', status: 'live' },
      { id: 'permissions',     label: 'Roles & Permissions', icon: ShieldCheck, permission: 'manage_settings', status: 'live' },
    ],
  },
];

export function AppShell({ children, activeModule, onModuleChange, onLogout, currentUser = null, sessionRestoring = false }: AppShellProps) {
  const { has, hasAny } = usePermissions();
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showCommandPalette, setShowCommandPalette] = React.useState(false);
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (activeModule) localStorage.setItem('church_erp_last_module', activeModule);
  }, [activeModule]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setShowCommandPalette(o => !o); }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

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
    return has(item.permission);
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50/50">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-64 shrink-0 flex flex-col bg-white border-r border-slate-200 sticky top-0 h-screen overflow-hidden">
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
          {GROUPS.map(group => {
            const visibleItems = group.items.filter(canSeeItem);
            if (visibleItems.length === 0) return null;
            const isCollapsed = collapsedGroups[group.label];
            return (
              <div key={group.label} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full flex items-center justify-between px-3 py-1.5 group"
                >
                  <span className={cn('text-[9px] font-black uppercase tracking-[0.18em]', group.color)}>{group.label}</span>
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
                          <span className="flex-1 truncate">{item.label}</span>
                          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', STATUS_DOT[item.status])} title={item.status} />
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
            <button onClick={() => onModuleChange('profile')} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <User className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Status Legend */}
          <div className="mt-3 px-2 space-y-1">
            {(
              [
                ['live', 'Live'],
                ['operational', 'Operational'],
                ['partial', 'Partial'],
                ['prototype', 'Prototype'],
                ['placeholder', 'Placeholder'],
                ['backend-ready', 'Backend ready'],
                ['planned', 'Planned'],
                ['experimental', 'Experimental'],
              ] as [ModuleStatus, string][]
            ).map(([s, l]) => (
              <div key={s} className="flex items-center gap-2">
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', STATUS_DOT[s])} />
                <span className="text-[9px] text-slate-400 font-medium">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-400 font-medium">Kingdom OS</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="font-bold text-slate-800 capitalize">{activeModule.replace(/-/g, ' ')}</span>
          </div>

          <div className="flex items-center gap-3">
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

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {showCommandPalette && (
        <CommandPaletteOverlay onClose={() => setShowCommandPalette(false)} onModuleChange={onModuleChange} />
      )}
    </div>
  );
}

function CommandPaletteOverlay({ onClose, onModuleChange }: { onClose: () => void; onModuleChange: (m: ERPModule) => void }) {
  const [query, setQuery] = React.useState('');
  const [members, setMembers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (query.length < 2) { setMembers([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiRequest(`members?search=${encodeURIComponent(query)}`);
        setMembers(parseApiResponse(res) || []);
      } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const allModules = GROUPS.flatMap(g => g.items);
  const filteredModules = query.length > 0
    ? allModules.filter(m => m.label.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 border-b border-slate-100">
          <Search className="w-4 h-4 text-indigo-500 shrink-0" />
          <input
            autoFocus type="text"
            className="flex-1 h-14 bg-transparent outline-none text-base font-semibold text-slate-900 placeholder:text-slate-300"
            placeholder="Search modules, members…"
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
                  <span className={cn('ml-auto w-1.5 h-1.5 rounded-full', STATUS_DOT[m.status])} />
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
          {query.length === 0 && (
            <div>
              <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Access</p>
              {([['members','Members',Users],['attendance','Attendance',CalendarCheck],['giving','Giving',Heart],['finance','Accounting',CreditCard],['discipleship','Shepherd Workspace',Target]] as [ERPModule, string, any][]).map(([id, label, Icon]) => (
                <button key={id} onClick={() => { onClose(); onModuleChange(id); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                    <Icon className="w-4 h-4 text-slate-500 group-hover:text-indigo-600" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700">{label}</span>
                </button>
              ))}
            </div>
          )}
          {loading && <div className="p-4 text-center text-sm font-medium text-slate-400">Searching…</div>}
        </div>
      </div>
    </div>
  );
}
