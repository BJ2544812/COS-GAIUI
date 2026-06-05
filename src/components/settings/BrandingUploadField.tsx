import * as React from 'react';
import { Loader2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { apiFetch, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

const MAX_BYTES = 5 * 1024 * 1024;

export function BrandingUploadField({
  label,
  hint,
  value,
  onChange,
  onError,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (url: string) => void;
  onError?: (msg: string) => void;
}) {
  const [uploading, setUploading] = React.useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError?.('Please choose an image file (PNG, JPEG, WebP, GIF, or SVG).');
      return;
    }
    if (file.size > MAX_BYTES) {
      onError?.('Image must be 5 MB or smaller.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiFetch('upload', { method: 'POST', body: formData });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || 'Upload failed');
      }
      const result = await response.json();
      const data = parseApiResponse<{ url: string }>(result);
      onChange(data.url);
    } catch (err) {
      onError?.(formatApiError(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <div className="flex flex-wrap items-center gap-4">
        {value ? (
          <img
            src={value}
            alt=""
            className="w-16 h-16 object-contain rounded-lg border border-slate-200 bg-white p-1"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-xs">
            None
          </div>
        )}
        <label
          className={cn(
            'inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-slate-200 text-sm font-bold cursor-pointer hover:bg-slate-50',
            uploading && 'opacity-60 pointer-events-none',
          )}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Uploading…' : 'Choose file'}
          <Input type="file" accept="image/*" className="sr-only" onChange={handleFile} disabled={uploading} />
        </label>
        {value && (
          <button
            type="button"
            className="text-xs font-bold text-rose-600 hover:underline min-h-[44px] px-2"
            onClick={() => onChange('')}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
