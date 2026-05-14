import React from 'react';
import { FileText } from 'lucide-react';
import { PlaceholderModule } from '@/components/modules/PlaceholderModule';
import { ERPModule } from '@/types';
export function PagesModule({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  return (
    <PlaceholderModule
      title="Pages" subtitle="Standalone web pages — About, Contact, Ministries, and custom church pages."
      status="placeholder" icon={FileText}
      capabilities={['PageData model with slug-based routing','Publish/unpublish per page','JSON or Markdown content support','Public website rendering at /website/:slug','Template application to reset page content','Multi-page church website management']}
      apiEndpoints={['GET /api/v1/website/pages (live)','POST /api/v1/website/pages (live)','PATCH /api/v1/website/pages/:slug (live)','POST /api/v1/website/pages/:slug/publish (live)','DELETE /api/v1/website/pages (live)']}
      relatedModules={[{label:'Website Builder',module:'website'},{label:'Landing Pages',module:'landing-pages'},{label:'SEO',module:'seo'}]}
      onModuleChange={onModuleChange}
    />
  );
}
