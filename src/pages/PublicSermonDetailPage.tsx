/**
 * Public sermon watch page — loads published sermon by id from website API.
 */
import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import { VITE_TENANT_DEFAULT } from '@/lib/apiConfig';
import { apiFetch } from '@/lib/apiClient';
import { mapSermonsForWebsite } from '@/lib/websiteOperationalData';
import { usePublicSeo } from '@/lib/publicSeo';
import {
  SharedNavbar,
  SharedFooter,
  ResilientImage,
  IMAGE_FALLBACKS,
  type PublicSermonRow,
} from '@/lib/websiteSharedBlocks';

function readSuccess<T>(json: unknown): T | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as Record<string, unknown>;
  if (o.status !== 'success' || o.data === undefined) return null;
  return o.data as T;
}

export function PublicSermonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = React.useState(true);
  const [sermon, setSermon] = React.useState<PublicSermonRow | null>(null);
  const [orgName, setOrgName] = React.useState('Grace Community');
  const [primaryColor, setPrimaryColor] = React.useState('#4F46E5');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setError('Sermon not found.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const headers = { 'x-tenant-id': VITE_TENANT_DEFAULT };
        const [sermonRes, settingsRes] = await Promise.all([
          apiFetch(`website/public/sermons/${encodeURIComponent(id)}`, { headers }),
          apiFetch('website/public/settings', { headers }),
        ]);
        const sermonJson = await sermonRes.json();
        const settingsJson = await settingsRes.json();
        if (cancelled) return;
        const settings = readSuccess<{ organization?: { name?: string }; branding?: { primaryColor?: string } }>(settingsJson);
        if (settings?.organization?.name) setOrgName(settings.organization.name);
        if (settings?.branding?.primaryColor) setPrimaryColor(settings.branding.primaryColor);

        if (!sermonRes.ok || sermonJson.status !== 'success') {
          setError('This message is not available.');
          setSermon(null);
          return;
        }
        const mapped = mapSermonsForWebsite([sermonJson.data])[0];
        setSermon(mapped ?? null);
      } catch {
        if (!cancelled) setError('Unable to load sermon.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  usePublicSeo({
    title: sermon?.title ?? 'Message',
    description: sermon?.description || `${sermon?.speaker ?? 'Teaching'} — ${orgName}`,
    siteName: orgName,
    canonicalPath: id ? `/sermons/watch/${id}` : '/sermons',
    imageUrl: sermon?.thumbnail,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 font-black uppercase tracking-widest text-xs">
        Loading message…
      </div>
    );
  }

  if (error || !sermon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-6 text-center gap-6">
        <p className="text-slate-400">{error || 'Sermon not found.'}</p>
        <Link to="/sermons" className="text-indigo-400 font-black uppercase text-xs tracking-widest">Back to Sermons</Link>
      </div>
    );
  }

  const videoEmbed =
    sermon.videoUrl && /youtube\.com|youtu\.be|vimeo\.com/.test(sermon.videoUrl)
      ? sermon.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
      : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <SharedNavbar organizationName={orgName} primaryColor={primaryColor} />
      <main className="flex-1 py-24 px-10">
        <div className="max-w-5xl mx-auto space-y-12">
          <Link to="/sermons" className="inline-flex items-center gap-2 text-indigo-400 font-black uppercase text-[10px] tracking-widest hover:text-white">
            <ArrowLeft size={16} /> All Messages
          </Link>
          <div className="aspect-video rounded-[3rem] overflow-hidden bg-slate-900 border border-white/10 relative">
            {videoEmbed ? (
              <iframe
                src={videoEmbed}
                title={sermon.title}
                className="w-full h-full border-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                <ResilientImage
                  src={sermon.thumbnail}
                  fallbackSrc={IMAGE_FALLBACKS.sermon}
                  className="w-full h-full object-cover"
                  alt={sermon.title}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/50">
                  {sermon.videoUrl ? (
                    <a href={sermon.videoUrl} target="_blank" rel="noreferrer" className="text-white">
                      <PlayCircle size={72} />
                    </a>
                  ) : (
                    <PlayCircle size={72} className="text-white/40" />
                  )}
                </div>
              </>
            )}
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">{sermon.title}</h1>
            {sermon.speaker && (
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-500">{sermon.speaker}</p>
            )}
            {sermon.description && <p className="text-xl text-slate-400 font-medium leading-relaxed">{sermon.description}</p>}
          </div>
        </div>
      </main>
      <SharedFooter organizationName={orgName} />
    </div>
  );
}
