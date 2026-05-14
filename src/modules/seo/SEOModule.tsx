import React from 'react';
import { Search } from 'lucide-react';
import { PlaceholderModule } from '@/components/modules/PlaceholderModule';
import { ERPModule } from '@/types';
export function SEOModule({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  return (
    <PlaceholderModule
      title="SEO" subtitle="Search engine optimization — meta tags, sitemaps, structured data, and page indexing controls."
      status="placeholder" icon={Search}
      capabilities={[
        'Roadmap: per-page title & meta (partial data via website pages today)',
        'Roadmap: Open Graph + structured data exports',
        'Roadmap: sitemap.xml and robots.txt generation',
      ]}
      apiEndpoints={['GET /api/v1/website/pages (live — title data source)']}
      relatedModules={[{label:'Pages',module:'pages'},{label:'Website Builder',module:'website'},{label:'Landing Pages',module:'landing-pages'}]}
      onModuleChange={onModuleChange}
    />
  );
}
