import React from 'react';
import { ToggleLeft } from 'lucide-react';
import { PlaceholderModule } from '@/components/modules/PlaceholderModule';
import { ERPModule } from '@/types';
export function FeatureFlagsModule({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  return (
    <PlaceholderModule
      title="Feature Flags" subtitle="Runtime feature toggles, A/B experiments, and gradual rollout controls."
      status="placeholder" icon={ToggleLeft}
      capabilities={['Per-tenant feature flags','Environment-specific overrides','Gradual rollout by member segment','Integration with Settings module','Real-time flag evaluation without redeploy']}
      apiEndpoints={[]}
      relatedModules={[{label:'System Settings',module:'settings'},{label:'Tenant Settings',module:'tenant-settings'},{label:'Integrations',module:'integrations'}]}
      onModuleChange={onModuleChange}
    />
  );
}
