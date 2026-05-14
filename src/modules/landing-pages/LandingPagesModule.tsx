import React from 'react';
import { Layout } from 'lucide-react';
import { PlaceholderModule } from '@/components/modules/PlaceholderModule';
import { ERPModule } from '@/types';
export function LandingPagesModule({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  return (
    <PlaceholderModule
      title="Landing Pages" subtitle="Event landing pages, online giving pages, and campaign microsites."
      status="placeholder" icon={Layout}
      capabilities={['Event-specific landing pages','Online giving campaign pages','Visitor first-contact forms','Mobile-optimized layouts','Social sharing meta tags','Analytics tracking integration']}
      apiEndpoints={['GET /api/v1/website/events (live)','GET /api/v1/giving/campaigns (live)','POST /api/v1/website/pages (live)']}
      relatedModules={[{label:'Website Builder',module:'website'},{label:'Giving',module:'giving'},{label:'Events',module:'events'}]}
      onModuleChange={onModuleChange}
    />
  );
}
