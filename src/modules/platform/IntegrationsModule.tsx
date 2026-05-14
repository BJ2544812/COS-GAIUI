import React from 'react';
import { Plug } from 'lucide-react';
import { PlaceholderModule } from '@/components/modules/PlaceholderModule';
import { ERPModule } from '@/types';
export function IntegrationsModule({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  return (
    <PlaceholderModule
      title="Integrations" subtitle="Third-party connections — payment gateways, email providers, cloud storage, and webhooks."
      status="placeholder" icon={Plug}
      capabilities={['Razorpay payment gateway (live — webhook + reconciliation)','MinIO cloud file storage (live — member images, docs)','Redis + BullMQ async queue (live — event processing)','SMTP email via EmailService (partial)','Webhook idempotency via IdempotencyKey model','Razorpay reconciliation job (auto-running)']}
      apiEndpoints={['POST /api/v1/giving/webhooks/razorpay (live)','POST /api/v1/upload (live — MinIO)','GET /api/v1/giving/payment-gateway (live)']}
      relatedModules={[{label:'Giving',module:'giving'},{label:'System Settings',module:'settings'},{label:'Workflow Monitor',module:'workflow-monitor'}]}
      onModuleChange={onModuleChange}
    />
  );
}
