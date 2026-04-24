import React from 'react';
import { 
  BarChart3, 
  Users, 
  Layers, 
  Briefcase, 
  CalendarCheck, 
  ShieldCheck, 
  Sun, 
  Library, 
  HeartHandshake, 
  CircleDollarSign, 
  Building2, 
  Star, 
  MapPin, 
  MessageSquare, 
  FileBox, 
  Globe, 
  Smartphone,
  ChevronRight,
  Search,
  Bell,
  User,
  Settings,
  MessageCircle,
  Activity,
  Heart,
  Calendar,
  CreditCard,
  Target
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { ERPModule } from '@/src/types';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarProvider
} from '@/src/components/ui/sidebar';

interface AppShellProps {
  children: React.ReactNode;
  activeModule: ERPModule;
  onModuleChange: (module: ERPModule) => void;
  onLogout?: () => void;
}

const MODULE_CONFIG = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, group: 'Main' },
  { id: 'members', label: 'Members & Family', icon: Users, group: 'People' },
  { id: 'structure', label: 'Church Structure', icon: Layers, group: 'Organization' },
  { id: 'workforce', label: 'Volunteer & Staff', icon: Briefcase, group: 'People' },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck, group: 'Participation' },
  { id: 'discipleship', label: 'Discipleship', icon: ShieldCheck, group: 'Ministry' },
  { id: 'services', label: 'Service Planning', icon: Sun, group: 'Ministry' },
  { id: 'content', label: 'Sermon Library', icon: Library, group: 'Content' },
  { id: 'giving', label: 'Giving', icon: Heart, group: 'Finance' },
  { id: 'finance', label: 'Accounting', icon: CreditCard, group: 'Finance' },
  { id: 'assets', label: 'Assets', icon: Building2, group: 'Organization' },
  { id: 'events', label: 'Events', icon: Star, group: 'Participation' },
  { id: 'outreach', label: 'Outreach', icon: Target, group: 'Ministry' },
  { id: 'communication', label: 'Communication', icon: MessageCircle, group: 'Interaction' },
  { id: 'documents', label: 'Documents', icon: FileBox, group: 'Main' },
  { id: 'website', label: 'Public Website', icon: Globe, group: 'Public' },
  { id: 'mobile-app', label: 'Member App', icon: Smartphone, group: 'Public' },
  { id: 'permissions', label: 'Access Control', icon: ShieldCheck, group: 'Admin' },
  { id: 'settings', label: 'System Settings', icon: Settings, group: 'Admin' },
] as const;

export function AppShell({ children, activeModule, onModuleChange, onLogout }: AppShellProps) {
  const groups = Array.from(new Set(MODULE_CONFIG.map(m => m.group)));
  const [currentUser, setCurrentUser] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchMe = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) setCurrentUser(await res.json());
        } catch (err) {
          console.error('Auth sync failed');
        }
      }
    };
    fetchMe();
  }, [activeModule]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50/50">
        <Sidebar className="border-r border-slate-200">
          <SidebarHeader className="h-16 flex items-center px-6 border-bottom border-slate-100">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onModuleChange('dashboard')}>
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">C</div>
              <span className="font-bold text-slate-800 tracking-tight transition-all hover:text-indigo-600">CHURCH ERP</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3 pb-6">
            {groups.map(group => (
              <SidebarGroup key={group}>
                <SidebarGroupLabel className="text-[10px] uppercase tracking-wider font-bold text-slate-400 px-3 mt-4">
                  {group}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {MODULE_CONFIG.filter(m => m.group === group).map((item) => {
                      const hasPermission = !currentUser || currentUser.roleId === 'admin' || currentUser.permissions?.some((p: string) => p.includes(item.id) || p === `view_${item.id}`);
                      if (!hasPermission && item.group !== 'Admin') return null;
                      
                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            isActive={activeModule === item.id}
                            onClick={() => onModuleChange(item.id as ERPModule)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group text-sm font-medium",
                              activeModule === item.id 
                                ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            )}
                          >
                            <item.icon className={cn(
                              "w-4 h-4 transition-colors",
                              activeModule === item.id ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                            )} />
                            <span>{item.label}</span>
                            {activeModule === item.id && (
                              <ChevronRight className="ml-auto w-4 h-4 text-indigo-400" />
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8">
            <div className="flex items-center gap-4 text-slate-500">
              <span className="text-sm font-medium text-slate-400 capitalize">{activeModule.replace('-', ' ')}</span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative group hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Global search..." 
                  className="pl-10 pr-4 py-1.5 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 rounded-full text-sm w-64 transition-all outline-none"
                />
              </div>
              
              <button 
                onClick={() => onModuleChange('notifications')}
                className={cn(
                  "relative w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors",
                  activeModule === 'notifications' && "bg-indigo-50 text-indigo-600"
                )}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              
              <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>
              
              <div 
                className={cn(
                  "flex items-center gap-3 cursor-pointer group p-1.5 pr-3 rounded-full transition-all",
                  activeModule === 'profile' ? "bg-indigo-50" : "hover:bg-slate-100"
                )}
              >
                <div className="text-right hidden sm:block" onClick={() => onModuleChange('profile')}>
                  <p className={cn("text-xs font-bold leading-none", activeModule === 'profile' ? "text-indigo-900" : "text-slate-800")}>
                    {currentUser?.username || 'Admin User'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium tracking-tight">
                    {currentUser?.roleId === 'admin' ? 'Super Administrator' : 'Staff Member'}
                  </p>
                </div>
                <div 
                  onClick={onLogout}
                  className={cn(
                  "w-10 h-10 rounded-full bg-indigo-100 border-2 flex items-center justify-center text-indigo-600 overflow-hidden transition-all",
                  activeModule === 'profile' ? "border-indigo-500 ring-4 ring-indigo-500/10" : "border-white shadow-sm group-hover:border-indigo-200"
                )}>
                  <User className="w-5 h-5" />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
