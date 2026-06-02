/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ERPModule } from './types';

// ── Existing modules ─────────────────────────────────────────────────────────
import { DashboardModule }    from './modules/dashboard/DashboardModule';
import { MembersModule }      from './modules/members/MembersModule';
import { DiscipleshipModule } from './modules/discipleship/DiscipleshipModule';
import { StructureModule }    from './modules/structure/StructureModule';
import { AttendanceModule }   from './modules/attendance/AttendanceModule';
import { EventsModule }       from './modules/events/EventsModule';
import { ServicesModule }     from './modules/services/ServicesModule';
import { GivingModule }       from './modules/giving/GivingModule';
import { FinanceModule }      from './modules/finance/FinanceModule';
import { AssetsModule }       from './modules/assets/AssetsModule';
import { DocumentsModule }    from './modules/documents/DocumentsModule';
import { CommunicationModule} from './modules/communication/CommunicationModule';
import { OutreachModule }     from './modules/outreach/OutreachModule';
import { NotificationsModule} from './modules/notifications/NotificationsModule';
import { ProfileModule }      from './modules/profile/ProfileModule';
import { SettingsModule }     from './modules/settings/SettingsModule';
import { PermissionsModule }  from './modules/permissions/PermissionsModule';
import { SetupWizard }        from './modules/setup/SetupWizard';
import { WebsiteModule }      from './modules/website/WebsiteModule';
// Orphaned → now wired
import { WorkforceModule }    from './modules/workforce/WorkforceModule';
import { MobileAppModule }    from './modules/mobile/MobileAppModule';

// ── New modules ───────────────────────────────────────────────────────────────
import { FamiliesModule }           from './modules/families/FamiliesModule';
import { VolunteersModule }         from './modules/volunteers/VolunteersModule';
import { SmallGroupsModule }        from './modules/small-groups/SmallGroupsModule';
import { PathwaysModule }           from './modules/pathways/PathwaysModule';
import { MissionsModule }           from './modules/missions/MissionsModule';
import { SundayServicesModule, WorshipPlanningRedirect } from './modules/sunday-services/SundayServicesModule';
import { BudgetsModule }            from './modules/budgets/BudgetsModule';
import { FundsModule }              from './modules/funds/FundsModule';
import { VendorsModule }            from './modules/vendors/VendorsModule';
import { SermonsModule }            from './modules/sermons/SermonsModule';
import { EngagementModule }         from './modules/engagement/EngagementModule';
import { WorkflowMonitoringModule } from './modules/workflow/WorkflowMonitoringModule';
import { AuditLogsModule }          from './modules/audit/AuditLogsModule';
import { AnalyticsModule }          from './modules/analytics/AnalyticsModule';
import { PagesModule }              from './modules/pages/PagesModule';
import { FormsModule }              from './modules/forms/FormsModule';
import { MediaLibraryModule }       from './modules/media/MediaLibraryModule';
import { LandingPagesModule }       from './modules/landing-pages/LandingPagesModule';
import { SEOModule }                from './modules/seo/SEOModule';
import { FeatureFlagsModule }       from './modules/platform/FeatureFlagsModule';
import { TenantSettingsModule }     from './modules/platform/TenantSettingsModule';
import { IntegrationsModule }       from './modules/platform/IntegrationsModule';

import { Lock } from 'lucide-react';
import { LoginPage }         from './pages/LoginPage';
import ResetPasswordPage     from './pages/ResetPasswordPage';
import { PublicWebsitePage } from './pages/PublicWebsitePage';
import { getToken }          from '@/lib/authSession';
import { SettingsProvider }  from './context/SettingsContext';
import { AuthProvider, useAuth, usePermissions } from './context/AuthContext';
import { SafeModule }        from './components/SafeModule';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { loading, user } = useAuth();
  if (!getToken()) return <Navigate to="/login" replace state={{ from: location }} />;
  if (loading) return <FullScreenLoader message="Restoring Session..." />;
  if (!user)   return <Navigate to="/login" replace />;
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
  const [activeModule, setActiveModule] = React.useState<ERPModule>(() =>
    (localStorage.getItem('church_erp_last_module') as ERPModule) || 'dashboard'
  );
  const [isInitialized] = React.useState<boolean>(true);

  const permissionMap: Record<string, string> = React.useMemo(() => ({
    // Identity
    members: 'manage_members', families: 'manage_members', volunteers: 'manage_members',
    workforce: 'manage_members', 'small-groups': 'manage_members', pathways: 'manage_members',
    discipleship: 'manage_members',
    // Operations
    events: 'manage_events', attendance: 'manage_attendance', services: 'manage_events',
    'sunday-services': 'manage_events', worship: 'manage_events', outreach: 'manage_communication', missions: 'manage_communication',
    structure: 'manage_settings',
    // Finance
    giving: 'manage_giving', finance: 'manage_finance', budgets: 'manage_finance',
    funds: 'manage_finance', assets: 'manage_assets', documents: 'manage_assets',
    vendors: 'manage_finance',
    // Engagement
    sermons: 'manage_events', content: 'manage_communication', communication: 'manage_communication',
    notifications: 'manage_communication', mobile: 'manage_settings',
    // Website
    website: 'manage_settings', pages: 'manage_settings', forms: 'manage_settings',
    'media-library': 'manage_settings', 'landing-pages': 'manage_settings', seo: 'manage_settings',
    // Analytics
    analytics: 'manage_analytics', engagement: 'manage_analytics',
    'workflow-monitor': 'manage_settings', 'event-admin': 'manage_settings',
    'audit-logs': 'manage_settings',
    // Platform
    settings: 'manage_settings', permissions: 'manage_settings',
    'feature-flags': 'manage_settings', 'tenant-settings': 'manage_settings',
    integrations: 'manage_settings',
  }), []);

  const canAccessDashboard = hasAny(['manage_analytics','manage_finance','manage_giving','manage_members','manage_attendance']);

  const pickFirstAccessible = React.useCallback((): ERPModule => {
    const order: ERPModule[] = ['members','attendance','events','giving','finance','assets','communication','settings'];
    for (const m of order) { const req = permissionMap[m]; if (req && has(req)) return m; }
    return 'profile';
  }, [has, permissionMap]);

  React.useLayoutEffect(() => {
    if (!user) return;
    if (activeModule === 'dashboard' && !canAccessDashboard) setActiveModule(pickFirstAccessible());
  }, [user, activeModule, canAccessDashboard, pickFirstAccessible]);

  const renderModule = () => {
    if (!isInitialized) return <SetupWizard onComplete={() => {}} />;
    if (!user) return <FullScreenLoader message="Synchronizing identity..." />;
    return (
      <SafeModule moduleName={activeModule}>
        {(() => {
          const mc = setActiveModule;
          switch (activeModule) {
            // ── Dashboard ───────────────────────────────────────────────────
            case 'dashboard':   return <DashboardModule onModuleChange={mc} />;
            // ── Identity ────────────────────────────────────────────────────
            case 'members':     return <MembersModule onModuleChange={mc} user={user} />;
            case 'families':    return <FamiliesModule onModuleChange={mc} />;
            case 'volunteers':  return <VolunteersModule onModuleChange={mc} />;
            case 'workforce':   return <WorkforceModule onModuleChange={mc} />;
            case 'small-groups':return <SmallGroupsModule onModuleChange={mc} />;
            case 'pathways':    return <PathwaysModule onModuleChange={mc} />;
            case 'discipleship':return <DiscipleshipModule />;
            // ── Operations ──────────────────────────────────────────────────
            case 'events':      return <EventsModule onModuleChange={mc} />;
            case 'attendance':  return <AttendanceModule />;
            case 'sunday-services':
            case 'services':    return <SundayServicesModule onModuleChange={mc} />;
            case 'worship':     return <WorshipPlanningRedirect onModuleChange={mc} />;
            case 'outreach':    return <OutreachModule />;
            case 'missions':    return <MissionsModule onModuleChange={mc} />;
            case 'structure':   return <StructureModule />;
            // ── Finance ─────────────────────────────────────────────────────
            case 'giving':      return <GivingModule onModuleChange={mc} />;
            case 'finance':     return <FinanceModule onModuleChange={mc} user={user} />;
            case 'budgets':     return <BudgetsModule onModuleChange={mc} />;
            case 'funds':       return <FundsModule onModuleChange={mc} />;
            case 'assets':      return <AssetsModule />;
            case 'documents':   return <DocumentsModule />;
            case 'vendors':     return <VendorsModule onModuleChange={mc} />;
            // ── Engagement ──────────────────────────────────────────────────
            case 'sermons':     return <SermonsModule onModuleChange={mc} />;
            case 'content':     return <SermonsModule onModuleChange={mc} />;
            case 'communication':return <CommunicationModule />;
            case 'notifications':return <NotificationsModule />;
            case 'mobile':      return <MobileAppModule />;
            // ── Website ─────────────────────────────────────────────────────
            case 'website':     return <WebsiteModule />;
            case 'pages':       return <PagesModule onModuleChange={mc} />;
            case 'forms':       return <FormsModule onModuleChange={mc} />;
            case 'media-library':return <MediaLibraryModule onModuleChange={mc} />;
            case 'landing-pages':return <LandingPagesModule onModuleChange={mc} />;
            case 'seo':         return <SEOModule onModuleChange={mc} />;
            // ── Intelligence ────────────────────────────────────────────────
            case 'analytics':        return <AnalyticsModule onModuleChange={mc} />;
            case 'engagement':       return <EngagementModule onModuleChange={mc} />;
            case 'workflow-monitor': return <WorkflowMonitoringModule onModuleChange={mc} />;
            case 'event-admin':      return <WorkflowMonitoringModule onModuleChange={mc} />;
            case 'audit-logs':       return <AuditLogsModule onModuleChange={mc} />;
            // ── Platform ────────────────────────────────────────────────────
            case 'settings':         return <SettingsModule />;
            case 'permissions':      return <PermissionsModule />;
            case 'feature-flags':    return <FeatureFlagsModule onModuleChange={mc} />;
            case 'tenant-settings':  return <TenantSettingsModule onModuleChange={mc} />;
            case 'integrations':     return <IntegrationsModule onModuleChange={mc} />;
            // ── User ────────────────────────────────────────────────────────
            case 'profile':     return <ProfileModule />;
            default:            return <AccessDenied module={activeModule} />;
          }
        })()}
      </SafeModule>
    );
  };

  return (
    <AppShell activeModule={activeModule} onModuleChange={setActiveModule} onLogout={logout} currentUser={user} sessionRestoring={false}>
      {renderModule()}
    </AppShell>
  );
}

export default function App() {
  React.useEffect(() => { console.log('[App] Bootstrap'); }, []);
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/website"        element={<Navigate to="/website/home" replace />} />
        <Route path="/website/:slug"  element={<PublicWebsitePage />} />
        <Route path="/*" element={
          <RequireAuth>
            <SettingsProvider>
              <MainApp />
            </SettingsProvider>
          </RequireAuth>
        } />
      </Routes>
    </AuthProvider>
  );
}
