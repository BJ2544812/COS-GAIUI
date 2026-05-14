import React from 'react';
import { Globe } from 'lucide-react';
import { PlaceholderModule } from '@/components/modules/PlaceholderModule';
import { ERPModule } from '@/types';
export function MissionsModule({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  return (
    <PlaceholderModule
      title="Missions" subtitle="Missionary support, outreach campaigns, contact tracking, and global initiative management."
      status="placeholder" icon={Globe}
      capabilities={['Contact model (New, Contacted, Converted)','Source tracking for outreach contacts','Communication log per contact','Status pipeline management','Integration with Communication module']}
      apiEndpoints={['GET /api/v1/outreach','POST /api/v1/outreach','PUT /api/v1/outreach/:id','DELETE /api/v1/outreach/:id']}
      relatedModules={[{label:'Outreach',module:'outreach'},{label:'Communication',module:'communication'},{label:'Events',module:'events'}]}
      onModuleChange={onModuleChange}
    />
  );
}
