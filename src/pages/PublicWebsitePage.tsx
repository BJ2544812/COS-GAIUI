/**
 * Unauthenticated public view for church website pages.
 */
import * as React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  API_BASE_URL,
  VITE_TENANT_DEFAULT,
} from '@/lib/apiConfig';
import {
  sortSectionsForDisplay,
} from '@/lib/websiteDisplay';
import {
  SharedContactView,
  SharedEventListView,
  SharedGivingCtaView,
  SharedSermonGrid,
  SharedHeroView,
  SharedTextView,
  SharedNavbar,
  SharedFooter,
  type PublicEventRow,
  type PublicSermonRow,
} from '@/lib/websiteSharedBlocks';

type PagePayload = {
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
};

type PublicSettings = {
  organization: {
    name: string;
    tagline: string;
    address: string;
    email: string;
    phone: string;
  };
  branding: {
    primaryColor: string;
    logo: string | null;
  };
  currency: string;
};

type SectionRow = { id?: string; type: string; config?: Record<string, unknown> };

function readSuccess<T>(json: unknown): T | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as Record<string, unknown>;
  if (o.status !== 'success' || o.data === undefined) return null;
  return o.data as T;
}

function renderSections(
  contentJson: string,
  pageSlug: string,
  opts: { events: PublicEventRow[]; sermons: PublicSermonRow[]; branding: any; orgName: string; orgSettings: PublicSettings | null }
) {
  let sections: SectionRow[] = [];
  try {
    const parsed = JSON.parse(contentJson || '[]') as unknown;
    if (Array.isArray(parsed)) sections = parsed as SectionRow[];
  } catch {
    return <p className="text-slate-600 p-10 text-center">Content could not be displayed.</p>;
  }

  const sorted = sortSectionsForDisplay(sections);

  return sorted.map((s, i) => {
    const c = s.config ?? {};
    const key = (s.id && String(s.id)) || `${s.type}-${i}`;

    if (s.type === 'hero') {
      return (
        <SharedHeroView 
          key={key} 
          config={c} 
          branding={opts.branding} 
          pageSlug={pageSlug} 
          organizationName={opts.orgName} 
        />
      );
    }
    if (s.type === 'text') {
      return <SharedTextView key={key} config={c} />;
    }
    if (s.type === 'event_list') {
      const limit = Math.min(50, Math.max(1, Number(c.limit) || 10));
      return (
        <SharedEventListView key={key} title={String(c.title ?? '')} events={opts.events} limit={limit} />
      );
    }
    if (s.type === 'sermon_list') {
      const limit = Math.min(50, Math.max(1, Number(c.limit) || 9));
      return (
        <SharedSermonGrid key={key} title={String(c.title ?? '')} sermons={opts.sermons} limit={limit} />
      );
    }
    if (s.type === 'giving_cta') {
      return (
        <SharedGivingCtaView
          key={key}
          title={String(c.title ?? '')}
          description={String(c.description ?? '')}
          buttonText={String(c.buttonText ?? '')}
          primaryColor={opts.branding?.primaryColor}
        />
      );
    }
    if (s.type === 'contact_form') {
      const org = opts.orgSettings?.organization;
      const emailVal = (c.email != null && String(c.email).trim()) ? String(c.email) : (org?.email || undefined);
      const phoneVal = (c.phone != null && String(c.phone).trim()) ? String(c.phone) : (org?.phone || undefined);
      const addressVal = (c.address != null && String(c.address).trim()) ? String(c.address) : (org?.address || undefined);
      return (
        <SharedContactView
          key={key}
          title={String(c.title ?? '')}
          email={emailVal}
          phone={phoneVal}
          address={addressVal}
        />
      );
    }
    return null;
  });
}

export function PublicWebsitePage() {
  const { slug } = useParams<{ slug: string }>();
  const effectiveSlug = (slug || 'home').trim().toLowerCase();

  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState<PagePayload | null>(null);
  const [settings, setSettings] = React.useState<PublicSettings | null>(null);
  const [allPages, setAllPages] = React.useState<{ slug: string; title: string }[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [events, setEvents] = React.useState<PublicEventRow[]>([]);
  const [sermons, setSermons] = React.useState<PublicSermonRow[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const base = API_BASE_URL.replace(/\/$/, '');
        const tenant = VITE_TENANT_DEFAULT;
        const headers = { 'x-tenant-id': tenant };

        const pageUrl = `${base}/website/public/pages/${encodeURIComponent(effectiveSlug)}`;
        const [pageRes, evRes, seRes, setRes] = await Promise.all([
          fetch(pageUrl, { headers }),
          fetch(`${base}/website/public/events?limit=30`, { headers }),
          fetch(`${base}/website/public/sermons`, { headers }),
          fetch(`${base}/website/public/settings`, { headers }),
        ]);

        const pageJson = (await pageRes.json()) as { status?: string; data?: PagePayload; message?: string };
        const evJson = await evRes.json();
        const seJson = await seRes.json();
        const setJson = await setRes.json();

        if (cancelled) return;

        const pubSettings = readSuccess<PublicSettings>(setJson);
        setSettings(pubSettings);

        if (!pageRes.ok || pageJson.status !== 'success' || !pageJson.data) {
          setPage(null);
          setError(pageJson.message || `Unable to load page (${pageRes.status})`);
          return;
        }

        setPage(pageJson.data);
        setEvents(readSuccess<PublicEventRow[]>(evJson) ?? []);
        setSermons(readSuccess<PublicSermonRow[]>(seJson) ?? []);

        // Also fetch page list for navbar
        const pagesRes = await fetch(`${base}/website/public/pages`, { headers });
        const pagesJson = await pagesRes.json();
        const pagesData = readSuccess<{ slug: string; title: string }[]>(pagesJson);
        if (pagesData) setAllPages(pagesData);

      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setPage(null);
          setError('Network error loading website.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveSlug]);

  if (!slug) {
    return <Navigate to="/website/home" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-400 font-black uppercase tracking-widest text-xs">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 rounded-2xl border-4 border-indigo-600 border-t-transparent animate-spin" />
           Initializing Site...
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center">
           <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <div className="space-y-2">
           <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Page Not Found</h1>
           <p className="text-slate-500 font-medium max-w-md mx-auto">{error || 'The requested page is not available or has been unpublished.'}</p>
        </div>
        <a href="/website/home" className="h-14 px-10 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center shadow-xl">
           Return Home
        </a>
      </div>
    );
  }

  const orgName = settings?.organization?.name || 'Grace Community';
  const primaryColor = settings?.branding?.primaryColor || '#4F46E5';

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <SharedNavbar 
        organizationName={orgName} 
        primaryColor={primaryColor} 
        pages={allPages} 
      />
      
      <main className="flex-1 animate-in fade-in duration-1000">
        {renderSections(page.content, effectiveSlug, { 
          events, 
          sermons, 
          branding: settings?.branding,
          orgName,
          orgSettings: settings 
        })}
      </main>

      <SharedFooter organizationName={orgName} />
    </div>
  );
}
