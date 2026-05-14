import React from 'react';
import { FormInput } from 'lucide-react';
import { PlaceholderModule } from '@/components/modules/PlaceholderModule';
import { ERPModule } from '@/types';
export function FormsModule({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  return (
    <PlaceholderModule
      title="Forms & Lead Capture" subtitle="Embedded web forms, prayer request submissions, event registration, and contact capture."
      status="placeholder" icon={FormInput}
      capabilities={['Prayer request form → PrayerRequest model','Visitor card → Contact/Member creation','Event registration form integration','Custom field builder','Email notification on submission','Public embeddable form widget']}
      apiEndpoints={['POST /api/v1/discipleship/v2/prayer-requests (planned)','POST /api/v1/outreach (live — contact creation)']}
      relatedModules={[{label:'Outreach',module:'outreach'},{label:'Website Builder',module:'website'},{label:'Landing Pages',module:'landing-pages'}]}
      onModuleChange={onModuleChange}
    />
  );
}
