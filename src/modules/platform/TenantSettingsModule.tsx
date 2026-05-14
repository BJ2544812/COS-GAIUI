import React from 'react';
import { Building } from 'lucide-react';
import { PlaceholderModule } from '@/components/modules/PlaceholderModule';
import { ERPModule } from '@/types';
export function TenantSettingsModule({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  return (
    <PlaceholderModule
      title="Tenant Settings" subtitle="Multi-tenant configuration — domain mapping, isolation rules, and per-tenant defaults."
      status="placeholder" icon={Building}
      capabilities={['Tenant model with domain mapping','Per-tenant Setting key-value store (live)','Church name, logo, and branding config','Campus configuration per tenant','Financial year and accounting defaults','Email and notification sender identity']}
      apiEndpoints={['GET /api/v1/settings (live)','POST /api/v1/settings (live)','GET /api/v1/settings/:key (live)']}
      relatedModules={[{label:'System Settings',module:'settings'},{label:'Church Structure',module:'structure'},{label:'Feature Flags',module:'feature-flags'}]}
      onModuleChange={onModuleChange}
    />
  );
}
