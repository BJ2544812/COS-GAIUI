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
import { Construction } from 'lucide-react';

export default function App() {
  const [activeModule, setActiveModule] = React.useState<ERPModule>('dashboard');

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule onModuleChange={setActiveModule} />;
      case 'members':
        return <MembersModule onModuleChange={setActiveModule} />;
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
        return <FinanceModule onModuleChange={setActiveModule} />;
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
    <AppShell activeModule={activeModule} onModuleChange={setActiveModule}>
      {renderModule()}
    </AppShell>
  );
}
