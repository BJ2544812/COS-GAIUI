import * as React from 'react';
import { Upload, Globe, Users, ImageIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import type { EventPublicProfile } from '@/lib/eventPublicProfile';

export type EventPublicFormState = {
  publishedToWebsite: boolean;
  publicDescription: string;
  bannerImageUrl: string;
  speaker: string;
  category: string;
  acceptsRegistration: boolean;
  capacity: string;
};

export const emptyPublicForm = (): EventPublicFormState => ({
  publishedToWebsite: false,
  publicDescription: '',
  bannerImageUrl: '',
  speaker: '',
  category: '',
  acceptsRegistration: false,
  capacity: '',
});

export function publicFormFromProfile(pub: EventPublicProfile): EventPublicFormState {
  return {
    publishedToWebsite: pub.publishedToWebsite === true,
    publicDescription: pub.publicDescription ?? '',
    bannerImageUrl: pub.bannerImageUrl ?? pub.thumbnailImageUrl ?? '',
    speaker: pub.speaker ?? '',
    category: pub.category ?? '',
    acceptsRegistration: pub.acceptsRegistration === true,
    capacity: pub.capacity != null ? String(pub.capacity) : '',
  };
}

export function publicFormToProfile(form: EventPublicFormState): EventPublicProfile {
  const cap = parseInt(form.capacity, 10);
  return {
    publishedToWebsite: form.publishedToWebsite,
    publicDescription: form.publicDescription.trim() || undefined,
    bannerImageUrl: form.bannerImageUrl.trim() || undefined,
    thumbnailImageUrl: form.bannerImageUrl.trim() || undefined,
    speaker: form.speaker.trim() || undefined,
    category: form.category.trim() || undefined,
    acceptsRegistration: form.acceptsRegistration,
    capacity: Number.isFinite(cap) && cap > 0 ? cap : undefined,
  };
}

export function EventPublicPublishingFields({
  form,
  onChange,
  eventId,
  disabled,
}: {
  form: EventPublicFormState;
  onChange: (patch: Partial<EventPublicFormState>) => void;
  eventId?: string;
  disabled?: boolean;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const uploadBanner = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const q = eventId
        ? `?scope=events&eventId=${encodeURIComponent(eventId)}`
        : '?scope=settings';
      const j = await apiRequest<unknown>(`upload${q}`, { method: 'POST', body: fd });
      const data = parseApiResponse<{ url: string }>(j);
      onChange({ bannerImageUrl: data.url });
    } catch (e) {
      setUploadError(formatApiError(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <Globe className="w-5 h-5 text-indigo-600 shrink-0" />
          <div>
            <p className="font-bold text-slate-900 text-sm">Publish to website</p>
            <p className="text-xs text-slate-500">When on, this event appears on the public calendar and event page.</p>
          </div>
        </div>
        <Switch
          checked={form.publishedToWebsite}
          onCheckedChange={(v) => onChange({ publishedToWebsite: v })}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Public description</label>
        <Textarea
          value={form.publicDescription}
          onChange={(e) => onChange({ publicDescription: e.target.value })}
          rows={4}
          disabled={disabled}
          placeholder="What guests should know — shown on the website (not internal staff notes)."
          className="rounded-2xl bg-slate-50 border-none font-medium"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Speaker / host</label>
          <Input
            value={form.speaker}
            onChange={(e) => onChange({ speaker: e.target.value })}
            disabled={disabled}
            className="h-12 rounded-xl"
            placeholder="e.g. Pastor David"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Category</label>
          <Input
            value={form.category}
            onChange={(e) => onChange({ category: e.target.value })}
            disabled={disabled}
            className="h-12 rounded-xl"
            placeholder="e.g. Youth, Outreach"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Event image</label>
        {form.bannerImageUrl ? (
          <div className="relative rounded-2xl overflow-hidden border border-slate-100">
            <img src={form.bannerImageUrl} alt="" className="w-full h-40 object-cover" />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2"
              disabled={disabled}
              onClick={() => onChange({ bannerImageUrl: '' })}
            >
              Remove
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
            <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {uploading ? 'Uploading…' : 'Upload banner'}
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={disabled || uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void uploadBanner(f);
              }}
            />
          </label>
        )}
        {uploadError && <p className="text-xs text-rose-600">{uploadError}</p>}
      </div>

      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <Users className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold text-slate-900 text-sm">Online registration</p>
            <p className="text-xs text-slate-500">Guests can register from the public event page (free — no ticketing).</p>
          </div>
        </div>
        <Switch
          checked={form.acceptsRegistration}
          onCheckedChange={(v) => onChange({ acceptsRegistration: v })}
          disabled={disabled}
        />
      </div>

      {form.acceptsRegistration && (
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Capacity (optional)</label>
          <Input
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => onChange({ capacity: e.target.value })}
            disabled={disabled}
            className="h-12 rounded-xl max-w-xs"
            placeholder="Leave blank for unlimited"
          />
        </div>
      )}
    </div>
  );
}
