/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ERPModule } from './types';
import {
  buildAdminPath,
  isCanonicalAdminModule,
  normalizeAdminModule,
  parseAdminSearchParams,
  resolveAdminNavigation,
} from '@/lib/adminNavigation';
import type { FinanceWorkspaceTab } from '@/lib/financeNavigation';
import { normalizeFinanceTab } from '@/lib/financeNavigation';

import { DashboardModule } from './modules/dashboard/DashboardModule';
import { MembersModule } from './modules/members/MembersModule';
import { DiscipleshipModule } from './modules/discipleship/DiscipleshipModule';
import { AttendanceModule } from './modules/attendance/AttendanceModule';
import { EventsModule } from './modules/events/EventsModule';
import { SundayModeModule } from './modules/sunday/SundayModeModule';
import { GivingModule } from './modules/giving/GivingModule';
import { FinanceModule } from './modules/finance/FinanceModule';
import { DocumentsModule } from './modules/documents/DocumentsModule';
import { CommunicationModule } from './modules/communication/CommunicationModule';
import { OutreachModule } from './modules/outreach/OutreachModule';
import { NotificationsModule } from './modules/notifications/NotificationsModule';
import { ProfileModule } from './modules/profile/ProfileModule';
import { SettingsModule } from './modules/settings/SettingsModule';
import { PermissionsModule } from './modules/permissions/PermissionsModule';
import { SetupWizard } from './modules/setup/SetupWizard';
import { WebsiteModule } from './modules/website/WebsiteModule';
import { WorkforceModule, type HrWorkspaceTab } from './modules/workforce/WorkforceModule';
import { FamiliesModule } from './modules/families/FamiliesModule';
import { VolunteersModule } from './modules/volunteers/VolunteersModule';
import { SmallGroupsModule } from './modules/small-groups/SmallGroupsModule';
import { PathwaysModule } from './modules/pathways/PathwaysModule';
import { WorshipPlanningRedirect, StructureSettingsRedirect } from './modules/sunday-services/SundayServicesModule';
import { SermonsModule } from './modules/sermons/SermonsModule';
import { WorkflowMonitoringModule } from './modules/workflow/WorkflowMonitoringModule';
import { AuditLogsModule } from './modules/audit/AuditLogsModule';
import { AnalyticsModule } from './modules/analytics/AnalyticsModule';
import { SystemAdminCenterModule } from './modules/platform/SystemAdminCenterModule';

import { Lock } from 'lucide-react';
import { LoginPage } from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { PublicWebsitePage } from './pages/PublicWebsitePage';
import { PublicDonationPage } from './pages/PublicDonationPage';
import { PublicSermonDetailPage } from './pages/PublicSermonDetailPage';
import { PublicEventDetailPage } from './pages/PublicEventDetailPage';
import { MemberPortalPage } from './pages/MemberPortalPage';
import { MemberLoginPage } from './pages/MemberLoginPage';
import { AcademyModule } from './modules/academy/AcademyModule';
import { isStaffUser } from '@/lib/staffAccess';
import { API_BASE_URL } from '@/lib/apiConfig';
import { getToken } from '@/lib/authSession';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider, useAuth, usePermissions } from './context/AuthContext';
import { SafeModule } from './components/SafeModule';
import { getRoleExperience, resolvePostLoginPath } from '@/lib/roleExperience';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { loading, user } = useAuth();
  if (!getToken()) return <Navigate to="/login" replace state={{ from: location }} />;
  if (loading) return <FullScreenLoader message="Restoring Session..." />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function FullScreenLoader({ message }: { message: string }) {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 animate-in fade-in duration-500">
      <div className="w-16 h-16 relative mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
      <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] animate-pulse">{message}</p>
    </div>
  );
}

function AccessDenied({ module }: { module: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12 animate-in fade-in duration-500">
      <div className="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-600 mb-8 shadow-xl shadow-rose-100/50">
        <Lock className="w-10 h-10" />
      </div>
      <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-3">Access Restricted</h2>
      <p className="text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
        You do not have the required permissions to access the{' '}
        <span className="font-bold text-rose-600 capitalize">{module.replace(/-/g, ' ')}</span> module.
      </p>
    </div>
  );
}

function MainApp() {
  const { logout, user } = useAuth();
  const { has, hasAny } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();

  const routeFromUrl = React.useMemo(
    () => parseAdminSearchParams(location.search),
    [location.search],
  );

  const [activeModule, setActiveModule] = React.useState<ERPModule>(() => routeFromUrl.module);
  const [adminTab, setAdminTab] = React.useState<string | undefined>(() => routeFromUrl.tab);
  const [isInitialized, setIsInitialized] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setActiveModule(routeFromUrl.module);
    setAdminTab(routeFromUrl.tab);
  }, [routeFromUrl.module, routeFromUrl.tab]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/deploy/setup-status`);
        const json = await res.json();
        if (!cancelled) {
          setIsInitialized(json?.data?.needsSetup === false);
        }
      } catch {
        if (!cancelled) setIsInitialized(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    if (!location.pathname.startsWith('/admin')) return;
    const params = new URLSearchParams(location.search);
    const raw = params.get('module');
    if (!raw) return;
    const resolved = resolveAdminNavigation(raw, params.get('tab') || undefined);
    if (resolved.module !== raw || (resolved.tab && resolved.tab !== params.get('tab'))) {
      navigate(buildAdminPath(resolved), { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  React.useEffect(() => {
    if (!user) return;
    if (!location.pathname.startsWith('/admin')) return;
    if (!isStaffUser(user)) {
      navigate('/portal', { replace: true });
      return;
    }
    if (!location.search) {
      const last = localStorage.getItem('church_erp_last_module');
      if (last) {
        navigate(buildAdminPath(resolveAdminNavigation(last)), { replace: true });
      } else {
        navigate(resolvePostLoginPath(user), { replace: true });
      }
    }
  }, [user, location.pathname, location.search, navigate]);

  const permissionMap: Record<string, string> = React.useMemo(() => ({
    members: 'manage_members', families: 'manage_members', volunteers: 'manage_members',
    workforce: 'manage_members',
    hr: 'manage_hr',
    'small-groups': 'manage_members',
    pathways: 'manage_members',
    discipleship: 'manage_discipleship',
    events: 'manage_events',
    'sunday-services': 'manage_events',
    attendance: 'manage_attendance',
    'sunday-mode': 'manage_events',
    worship: 'manage_events',
    services: 'manage_events',
    outreach: 'manage_outreach',
    structure: 'manage_settings',
    giving: 'manage_giving', finance: 'manage_finance', budgets: 'manage_finance',
    assets: 'manage_assets', documents: 'manage_assets',
    vendors: 'manage_finance',
    sermons: 'manage_events', communication: 'manage_communication',
    notifications: 'manage_communication',
    website: 'manage_website',
    analytics: 'manage_analytics',
    academy: 'manage_analytics',
    'workflow-monitor': 'manage_settings',
    'audit-logs': 'manage_settings',
    settings: 'manage_settings', permissions: 'manage_settings',
    'admin-center': 'manage_settings',
  }), []);

  const canAccessDashboard = hasAny(['manage_analytics', 'manage_finance', 'manage_giving', 'manage_members', 'manage_attendance']);
  const canAccessModule = React.useCallback(
    (moduleId: ERPModule) => {
      if (moduleId === 'dashboard') return canAccessDashboard;
      if (moduleId === 'profile') return true;
      if (moduleId === 'hr') return hasAny(['manage_hr', 'manage_members']);
      if (moduleId === 'discipleship') return hasAny(['manage_discipleship', 'manage_members']);
      if (moduleId === 'documents') return hasAny(['manage_assets', 'manage_documents']);
      if (moduleId === 'academy') return Boolean(user && isStaffUser(user));
      const req = permissionMap[moduleId];
      if (moduleId === 'outreach') return hasAny(['manage_outreach', 'manage_communication']);
      return req ? has(req) : false;
    },
    [canAccessDashboard, has, hasAny, permissionMap],
  );

  const pickFirstAccessible = React.useCallback((): ERPModule => {
    if (!user) return 'profile';
    const order = getRoleExperience(user).modulePriority;
    for (const m of order) {
      if (canAccessModule(m)) return m;
    }
    return 'profile';
  }, [user, canAccessModule]);

  const navigateAdmin = React.useCallback(
    (module: ERPModule, tab?: string) => {
      const state = resolveAdminNavigation(module, tab);
      setActiveModule(state.module);
      setAdminTab(state.tab);
      if (isCanonicalAdminModule(state.module)) {
        localStorage.setItem('church_erp_last_module', state.module);
      }
      navigate(buildAdminPath(state));
    },
    [navigate],
  );

  React.useLayoutEffect(() => {
    if (!user) return;
    if (activeModule === 'dashboard' && !canAccessDashboard) {
      navigateAdmin(pickFirstAccessible());
    }
  }, [user, activeModule, canAccessDashboard, pickFirstAccessible, navigateAdmin]);

  const renderModule = () => {
    if (isInitialized === null) return <FullScreenLoader message="Checking deployment…" />;
    if (!isInitialized) return <SetupWizard onComplete={() => setIsInitialized(true)} />;
    if (!user) return <FullScreenLoader message="Synchronizing identity..." />;
    if (!canAccessModule(activeModule)) return <AccessDenied module={activeModule} />;

    const mc = navigateAdmin;
    const financeTab =
      activeModule === 'finance' || activeModule === 'budgets' || activeModule === 'vendors' || activeModule === 'assets'
        ? normalizeFinanceTab(
            activeModule === 'finance'
              ? adminTab
              : activeModule === 'budgets'
                ? adminTab === 'funds'
                  ? 'funds'
                  : 'budgets'
                : activeModule === 'vendors'
                  ? adminTab === 'payroll'
                    ? 'payroll'
                    : 'vendors'
                  : 'assets',
          )
        : undefined;

    return (
      <SafeModule moduleName={activeModule}>
        {(() => {
          switch (activeModule) {
            case 'dashboard':
              return <DashboardModule onModuleChange={mc} />;
            case 'members':
              return <MembersModule onModuleChange={mc} user={user} />;
            case 'families':
              return <FamiliesModule onModuleChange={mc} />;
            case 'volunteers':
              return <VolunteersModule onModuleChange={mc} />;
            case 'workforce':
            case 'hr': {
              const hrTabs: HrWorkspaceTab[] = [
                'dashboard',
                'directory',
                'hierarchy',
                'leaves',
                'payroll',
                'reimbursements',
                'pipeline',
                'performance',
                'self_service',
              ];
              const hrTab: HrWorkspaceTab | undefined =
                activeModule === 'workforce'
                  ? 'directory'
                  : adminTab && hrTabs.includes(adminTab as HrWorkspaceTab)
                    ? (adminTab as HrWorkspaceTab)
                    : undefined;
              return <WorkforceModule onModuleChange={mc} initialTab={hrTab} />;
            }
            case 'small-groups':
              return <SmallGroupsModule onModuleChange={mc} />;
            case 'pathways':
              return <PathwaysModule onModuleChange={mc} />;
            case 'discipleship':
              return <DiscipleshipModule />;
            case 'events':
              return <EventsModule onModuleChange={mc} initialTab={adminTab} />;
            case 'sunday-services':
            case 'services':
            case 'worship':
              return <WorshipPlanningRedirect onModuleChange={mc} />;
            case 'attendance':
              return <AttendanceModule onModuleChange={mc} />;
            case 'sunday-mode':
              return <SundayModeModule onModuleChange={mc} />;
            case 'outreach':
              return <OutreachModule onModuleChange={mc} />;
            case 'structure':
              return <StructureSettingsRedirect onModuleChange={mc} />;
            case 'giving':
              return <GivingModule onModuleChange={mc} />;
            case 'finance':
            case 'budgets':
            case 'vendors':
            case 'assets':
              return <FinanceModule onModuleChange={mc} user={user} initialTab={financeTab} />;
            case 'documents':
              return <DocumentsModule />;
            case 'sermons':
              return <SermonsModule onModuleChange={mc} />;
            case 'communication':
              return <CommunicationModule />;
            case 'notifications':
              return <NotificationsModule onModuleChange={mc} />;
            case 'website':
              return <WebsiteModule initialView={adminTab} />;
            case 'analytics':
              return <AnalyticsModule onModuleChange={mc} />;
            case 'academy':
              return <AcademyModule onModuleChange={mc} initialTab={adminTab} />;
            case 'workflow-monitor':
              return <WorkflowMonitoringModule onModuleChange={mc} />;
            case 'audit-logs':
              return <AuditLogsModule onModuleChange={mc} />;
            case 'settings':
              return <SettingsModule initialSection={adminTab} />;
            case 'permissions':
              return <PermissionsModule />;
            case 'admin-center':
              return (
                <SystemAdminCenterModule
                  onModuleChange={mc}
                  initialTab={adminTab as 'health' | 'incidents' | 'operator' | 'governance' | 'flags' | 'audit' | 'exports' | 'deployment' | undefined}
                />
              );
            case 'profile':
              return <ProfileModule />;
            default:
              return <AccessDenied module={activeModule} />;
          }
        })()}
      </SafeModule>
    );
  };

  return (
    <AppShell
      activeModule={activeModule}
      adminTab={adminTab}
      onModuleChange={navigateAdmin}
      onNavigateBack={() => navigate(-1)}
      onLogout={logout}
      currentUser={user}
      sessionRestoring={false}
    >
      {renderModule()}
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/member-login" element={<MemberLoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/portal"
          element={
            <RequireAuth>
              <MemberPortalPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/*"
          element={
            <RequireAuth>
              <SettingsProvider>
                <MainApp />
              </SettingsProvider>
            </RequireAuth>
          }
        />
        <Route path="/" element={<PublicWebsitePage slug="home" />} />
        <Route path="/donate" element={<PublicDonationPage />} />
        <Route path="/sermons/watch/:id" element={<PublicSermonDetailPage />} />
        <Route path="/events/:id" element={<PublicEventDetailPage />} />
        <Route path="/:slug" element={<PublicWebsitePage />} />
      </Routes>
    </AuthProvider>
  );
}
