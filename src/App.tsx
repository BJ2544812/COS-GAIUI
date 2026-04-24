/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { AppShell } from './components/layout/AppShell';
import { ERPModule } from './types';
import { DashboardModule } from './modules/dashboard/DashboardModule';
import { MembersModule } from './modules/members/MembersModule';
import { StructureModule } from './modules/structure/StructureModule';
import { WorkforceModule } from './modules/workforce/WorkforceModule';
import { AttendanceModule } from './modules/attendance/AttendanceModule';
import { DiscipleshipModule } from './modules/discipleship/DiscipleshipModule';
import { ServicesModule } from './modules/services/ServicesModule';
import { ContentModule } from './modules/content/ContentModule';
import { GivingModule } from './modules/giving/GivingModule';
import { FinanceModule } from './modules/finance/FinanceModule';
import { AssetsModule } from './modules/assets/AssetsModule';
import { EventsModule } from './modules/events/EventsModule';
import { OutreachModule } from './modules/outreach/OutreachModule';
import { DocumentsModule } from './modules/documents/DocumentsModule';
import { WebsiteModule } from './modules/website/WebsiteModule';
import { MobileAppModule } from './modules/mobile/MobileAppModule';
import { SettingsModule } from './modules/settings/SettingsModule';
import { NotificationsModule } from './modules/notifications/NotificationsModule';
import { ProfileModule } from './modules/profile/ProfileModule';
import { CommunicationModule } from './modules/communication/CommunicationModule';
import { AuthModule } from './modules/auth/AuthModule';
import { PermissionsModule } from './modules/permissions/PermissionsModule';
import { SetupWizard } from './modules/setup/SetupWizard';
import { Construction, Loader2 } from 'lucide-react';

export default function App() {
  const [activeModule, setActiveModule] = React.useState<ERPModule>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!localStorage.getItem('token'));
  const [isInitialized, setIsInitialized] = React.useState<boolean | null>(null);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/setup/status');
        const data = await res.json();
        setIsInitialized(data.isInitialized);
      } catch (err) {
        console.error('Core Connectivity Failure');
      }
    };
    checkStatus();
  }, []);

  React.useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data);
          } else {
            handleLogout();
          }
        } catch (err) {
          handleLogout();
        }
      }
    };
    checkAuth();
  }, [isAuthenticated]);

  const handleLogin = (token: string, userData: any) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const renderModule = () => {
    if (isInitialized === null) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-10 font-sans text-white">
           <div className="flex flex-col items-center gap-6 animate-pulse">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Loading Ministry Intelligence...</p>
           </div>
        </div>
      );
    }

    if (!isInitialized) {
      return <SetupWizard onComplete={() => setIsInitialized(true)} />;
    }

    if (!isAuthenticated) return <AuthModule onLogin={handleLogin} />;

    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule onModuleChange={setActiveModule} />;
      case 'members':
        return <MembersModule onModuleChange={setActiveModule} user={user} />;
      case 'structure':
        return <StructureModule onModuleChange={setActiveModule} />;
      case 'workforce':
        return <WorkforceModule onModuleChange={setActiveModule} />;
      case 'attendance':
        return <AttendanceModule />;
      case 'discipleship':
        return <DiscipleshipModule onModuleChange={setActiveModule} />;
      case 'services':
        return <ServicesModule />;
      case 'content':
        return <ContentModule />;
      case 'giving':
        return <GivingModule onModuleChange={setActiveModule} />;
      case 'finance':
        return <FinanceModule onModuleChange={setActiveModule} user={user} />;
      case 'assets':
        return <AssetsModule />;
      case 'events':
        return <EventsModule />;
      case 'outreach':
        return <OutreachModule />;
      case 'communication':
        return <CommunicationModule />;
      case 'documents':
        return <DocumentsModule />;
      case 'website':
        return <WebsiteModule />;
      case 'mobile-app':
        return <MobileAppModule />;
      case 'settings':
        return <SettingsModule />;
      case 'notifications':
        return <NotificationsModule />;
      case 'profile':
        return <ProfileModule />;
      case 'permissions':
        return <PermissionsModule />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-12">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6">
              <Construction className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Module Under Construction</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              We are working hard to build the <span className="font-semibold text-indigo-600 capitalize">{(activeModule as string).replace('-', ' ')}</span> module. 
              This will be available in the next system update.
            </p>
          </div>
        );
    }
  };

  return (
    <AppShell activeModule={activeModule} onModuleChange={setActiveModule} onLogout={handleLogout}>
      {renderModule()}
    </AppShell>
  );
}
