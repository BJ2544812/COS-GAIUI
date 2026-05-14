import React from 'react';
import { Image } from 'lucide-react';
import { PlaceholderModule } from '@/components/modules/PlaceholderModule';
import { ERPModule } from '@/types';
export function MediaLibraryModule({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  return (
    <PlaceholderModule
      title="Media Library" subtitle="Centralized asset storage — images, videos, PDFs, and sermon thumbnails via MinIO."
      status="placeholder" icon={Image}
      capabilities={['MinIO object storage (live)','Member profile image upload','Family group image upload','Document file storage','Sermon thumbnail storage','Local disk fallback for dev environments']}
      apiEndpoints={['POST /api/v1/upload (live — MinIO upload)','POST /api/v1/members/:id/profile-image (live)','POST /api/v1/families/:id/image (live)']}
      relatedModules={[{label:'Documents',module:'documents'},{label:'Website Builder',module:'website'},{label:'Sermons',module:'sermons'}]}
      onModuleChange={onModuleChange}
    />
  );
}
