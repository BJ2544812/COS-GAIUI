/**
 * Unauthenticated public view for church website pages.
 * Fully loaded with flagship layouts and high-maturity fallbacks.
 */
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Info } from 'lucide-react';
import { VITE_TENANT_DEFAULT } from '@/lib/apiConfig';
import { apiFetch } from '@/lib/apiClient';
import {
  sortSectionsForDisplay,
} from '@/lib/websiteDisplay';
import {
  bindWebsiteSectionData,
  normalizeWebsiteSections,
} from '@/lib/websiteEngine';
import {
  mapCampaignsForWebsite,
  mapEventsForWebsite,
  mapLeadershipForWebsite,
  mapMinistriesForWebsite,
  mapSermonsForWebsite,
} from '@/lib/websiteOperationalData';
import { usePublicSeo } from '@/lib/publicSeo';
import {
  SharedHeroView,
  SharedTextView,
  SharedNavbar,
  SharedFooter,
  SharedMinistryDetailList,
  SharedLeadershipGrid,
  SharedVisionStatement,
  SharedNextSteps,
  SharedAtmosphereGallery,
  SharedSermonFeatured,
  SharedSermonGrid,
  SharedLivestreamBanner,
  SharedEventCalendar,
  SharedGivingFlow,
  SharedGivingImpact,
  SharedContactFull,
  SharedAboutStory,
  SharedMissionVision,
  SharedPrayerExperience,
  SharedImpactStats,
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
    serviceTimes?: string | null;
    livestreamUrl?: string | null;
  };
  branding: {
    primaryColor: string;
    logo: string | null;
  };
  currency: string;
  seo?: {
    siteTitle?: string;
    description?: string;
    keywords?: string;
    allowIndexing?: boolean;
    ogImageUrl?: string;
  };
};

function readSuccess<T>(json: unknown): T | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as Record<string, unknown>;
  if (o.status !== 'success' || o.data === undefined) return null;
  return o.data as T;
}

// --- Flagship Website Fallback Section Registry ---
function getFallbackSections(slug: string): any[] {
  const s = slug.toLowerCase().trim();
  if (s === "home") {
    return [
      { type: "hero", config: { variant: "centered", title: "Welcome Home", subtitle: "A community centered on the radical love of Jesus and the pursuit of His purpose.", imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=2000" } },
      { type: "text", config: { alignment: "center", title: "Gather With Us", content: "Sunday Services: 9:00 AM • 11:00 AM • 5:00 PM\\nExperience the presence of God through music, prayer, and authentic community." } },
      { type: "vision_statement", config: { title: "Built for Glory", subtitle: "To reach people far from God and teach them how to follow Jesus step by radical step." } },
      { type: "pastoral_note", config: { title: "A Message from Our Pastors", author: "Pastors David & Sarah Chen", message: "We believe that church isn't just a building you visit, but a family where you truly belong and are deeply loved." } },
      { type: "ministry_grid", config: { title: "Find Your Tribe" } },
      { type: "event_list", config: { title: "Featured Gatherings", limit: 2 } },
      { type: "sermon_list", config: { title: "Latest Message", limit: 1 } },
      { type: "giving_cta", config: { title: "Support the Vision", buttonText: "Give Online", description: "Your generosity enables us to serve our city and share the message of Jesus globally." } }
    ];
  }
  if (s === "about") {
    return [
      { type: "hero", config: { variant: "centered", title: "Our Heritage", subtitle: "A legacy of faith, anchored in the truth of the Gospel and the power of the Spirit.", imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=2000" } },
      { type: "timeline", config: { title: "The Journey" } },
      { type: "values", config: { title: "The Kingdom DNA" } },
      { type: "leadership_grid", config: { title: "The Team" } },
      { type: "pastoral_note", config: { title: "Come As You Are", message: "We are a church of second chances and new beginnings. You don't have to have it all figured out to be a part of what God is doing here.", author: "Pastoral Team" } }
    ];
  }
  if (s === "ministries") {
    return [
      { type: "hero", config: { variant: "centered", title: "Connect & Serve", subtitle: "Discover a place where you can grow, belong, and use your unique gifts for His glory.", imageUrl: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=2000" } },
      { type: "ministry_highlight", config: { title: "Grace Kids", subtitle: "A safe, high-energy environment where your children can discover the love of Jesus through play and biblical teaching.", imageUrl: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&q=80&w=1000" } },
      { type: "ministry_grid", config: { title: "Opportunities" } },
      { type: "ministry_highlight", config: { title: "Youth Collective", subtitle: "Empowering the next generation to live with influence through authentic discipleship and community.", imageUrl: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=1000", reversed: true } },
      { type: "next_steps", config: { title: "Find Your Next Step" } }
    ];
  }
  if (s === "sermons") {
    return [
      { type: "hero", config: { variant: "centered", title: "The Message", subtitle: "Explore teachings centered on the timeless truth of Scripture and the person of Jesus.", imageUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=2000" } },
      { type: "worship", config: { title: "Atmosphere of Praise" } },
      { type: "sermon_list", config: { title: "Watch Latest", limit: 12 } }
    ];
  }
  if (s === "events") {
    return [
      { type: "hero", config: { variant: "centered", title: "Gatherings", subtitle: "Life happens in community. Join us for what's next in the life of our church.", imageUrl: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=2000" } },
      { type: "event_list", config: { title: "Full Calendar", limit: 20 } },
      { type: "faq", config: { title: "Event FAQs" } }
    ];
  }
  if (s === "giving") {
    return [
      { type: "hero", config: { variant: "centered", title: "Radical Generosity", subtitle: "Join us in fueling a movement of grace through faithful and visionary stewardship.", imageUrl: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=2000" } },
      { type: "text", config: { alignment: "center", title: "The Heart of Giving", content: "We believe giving is a response to the grace we have received. Your partnership enables every outreach, mission, and moment of transformation." } },
      { type: "giving_impact", config: { title: "Collective Impact", campaigns: [
        { title: "Local Care Hub", progress: 65, target: "$25,000", current: "$16,250", desc: "Expanding our reach to serve underprivileged families in our neighborhood." },
        { title: "Global Mission Partners", progress: 80, target: "$40,000", current: "$32,000", desc: "Supporting sustainable gospel work across our international partner networks." }
      ] } },
      { type: "qr_payment", config: { title: "Quick & Secure", fundName: "Vision Fund" } },
      { type: "giving_cta", config: { title: "Partner With Us", buttonText: "Give Online" } }
    ];
  }
  if (s === "prayer") {
    return [
      { type: "hero", config: { variant: "centered", title: "Stand Together", subtitle: "We believe in the power of persistent prayer and the active presence of God.", imageUrl: "https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&q=80&w=2000" } },
      { type: "text", config: { alignment: "center", title: "Pastoral Encouragement", content: "\"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.\" — Philippians 4:6" } },
      { type: "pastoral_note", config: { title: "We Pray For You", message: "Our pastoral team and intercessors are dedicated to standing in the gap for you with honor and faith.", author: "Grace Prayer Team" } },
      { type: "prayer_cta", config: { title: "How Can We Pray?", subtitle: "Share your heart with our private and confidential prayer team." } }
    ];
  }
  if (s === "contact") {
    return [
      { type: "hero", config: { variant: "centered", title: "Get In Touch", subtitle: "Connect with our team digitally or join us at our campus this weekend.", imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=2000" } },
      { type: "contact_form", config: { title: "Reach Out", subtitle: "General inquiries, baptism interest, or pastoral needs." } },
      { type: "faq", config: { title: "Got Questions?" } }
    ];
  }
  return [{ type: "hero", config: { title: "Welcome Home" } }];
}

function renderSections(
  contentJson: string,
  pageSlug: string,
  opts: {
    events: PublicEventRow[];
    sermons: PublicSermonRow[];
    ministries: ReturnType<typeof mapMinistriesForWebsite>;
    campaigns: ReturnType<typeof mapCampaignsForWebsite>;
    leadership: ReturnType<typeof mapLeadershipForWebsite>;
    campuses: unknown[];
    branding: PublicSettings['branding'] | undefined;
    orgName: string;
    orgSettings: PublicSettings | null;
  },
) {
  let sections = [];
  try {
    const raw = (contentJson || '').trim();
    const parsed = JSON.parse(raw || '[]') as unknown;
    sections = normalizeWebsiteSections(parsed);
  } catch (err) {
    sections = normalizeWebsiteSections([{ type: 'hero', config: { title: 'Welcome Home' } }]);
  }

  if (sections.length === 0) {
    sections = normalizeWebsiteSections(getFallbackSections(pageSlug));
  }

  const sorted = sortSectionsForDisplay(
    sections.map((section) =>
      bindWebsiteSectionData(section, {
        events: opts.events,
        sermons: opts.sermons,
        ministries: opts.ministries,
        campaigns: opts.campaigns,
        leadership: opts.leadership,
        campuses: opts.campuses,
        settings: opts.orgSettings ?? undefined,
      }),
    ),
  );

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
    if (s.type === 'worship') {
      return <SharedAtmosphereGallery key={key} config={c} />;
    }
    if (s.type === 'sermon_list') {
      const limit = Math.max(1, Number(c.limit) || 9);
      if (limit <= 1) return <SharedSermonFeatured key={key} config={c} sermon={opts.sermons[0]} />;
      return <SharedSermonGrid key={key} title={String(c.title ?? 'Messages')} sermons={opts.sermons.slice(0, limit)} />;
    }
    if (s.type === 'event_list') {
      return <SharedEventCalendar key={key} title={String(c.title ?? 'Events')} events={opts.events} limit={Number(c.limit) || 4} />;
    }
    if (s.type === 'giving_cta' || s.type === 'qr_payment') {
      return <SharedGivingFlow key={key} title={String(c.title ?? 'Give')} primaryColor={opts.branding?.primaryColor} />;
    }
    if (s.type === 'contact_form') {
      return <SharedContactFull key={key} config={c} orgSettings={opts.orgSettings} />;
    }
    if (s.type === 'ministry_grid' || s.type === 'ministry_highlight') {
      return <SharedMinistryDetailList key={key} title={String(c.title ?? 'Ministries')} ministries={opts.ministries} />;
    }
    if (s.type === 'leadership_grid') {
      return <SharedLeadershipGrid key={key} title={String(c.title ?? 'Leadership')} leaders={(c.staff as any[]) || (c.leaders as any[]) || []} />;
    }
    if (s.type === 'vision_statement') {
      return <SharedVisionStatement key={key} title={String(c.title ?? '')} subtitle={String(c.subtitle ?? '')} />;
    }
    if (s.type === 'next_steps') {
      return <SharedNextSteps key={key} config={c} />;
    }
    if (s.type === 'timeline' || s.type === 'pastoral_note' || s.type === 'welcome_vision') {
      return <SharedAboutStory key={key} config={c} />;
    }
    if (s.type === 'values') {
      return <SharedMissionVision key={key} title={String(c.title ?? '')} mission={String(c.mission ?? '')} vision={String(c.vision ?? '')} values={c.values as any[]} />;
    }
    if (s.type === 'prayer_cta') {
      return <SharedPrayerExperience key={key} config={c} />;
    }
    if (s.type === 'giving_impact') {
      return <SharedGivingImpact key={key} config={c} primaryColor={opts.branding?.primaryColor} />;
    }
    if (s.type === 'stats_bar') {
      return <SharedImpactStats key={key} config={c} />;
    }
    if ((s.type as string) === 'livestream_widget') {
      const url = String(c.livestreamUrl ?? opts.orgSettings?.organization?.livestreamUrl ?? '');
      if (!url) return null;
      return (
        <SharedLivestreamBanner
          key={key}
          url={url}
          title={String(c.title ?? 'Watch live')}
          primaryColor={opts.branding?.primaryColor}
        />
      );
    }

    return null;
  });
}

export function PublicWebsitePage({ slug: propSlug }: { slug?: string } = {}) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = propSlug || paramSlug;
  const effectiveSlug = (slug || 'home').trim().toLowerCase();

  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState<PagePayload | null>(null);
  const [settings, setSettings] = React.useState<PublicSettings | null>(null);
  const [allPages, setAllPages] = React.useState<{ slug: string; title: string }[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [events, setEvents] = React.useState<PublicEventRow[]>([]);
  const [sermons, setSermons] = React.useState<PublicSermonRow[]>([]);
  const [ministries, setMinistries] = React.useState<any[]>([]);
  const [campaigns, setCampaigns] = React.useState<any[]>([]);
  const [campuses, setCampuses] = React.useState<any[]>([]);
  const [leadership, setLeadership] = React.useState<any[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const tenant = VITE_TENANT_DEFAULT;
        const headers = { 'x-tenant-id': tenant };

        const settled = await Promise.allSettled([
          apiFetch(`website/public/pages/${encodeURIComponent(effectiveSlug)}`, { headers }),
          apiFetch('website/public/events?limit=30', { headers }),
          apiFetch('website/public/sermons', { headers }),
          apiFetch('website/public/settings', { headers }),
          apiFetch('website/public/ministries', { headers }),
          apiFetch('website/public/campaigns', { headers }),
          apiFetch('website/public/campuses', { headers }),
          apiFetch('website/public/leadership', { headers }),
        ]);

        if (cancelled) return;

        const [pageResS, evResS, seResS, setResS, minResS, camResS, campusResS, leadResS] = settled;
        const pageRes = pageResS.status === 'fulfilled' ? pageResS.value : null;
        const evRes = evResS.status === 'fulfilled' ? evResS.value : null;
        const seRes = seResS.status === 'fulfilled' ? seResS.value : null;
        const setRes = setResS.status === 'fulfilled' ? setResS.value : null;
        const minRes = minResS.status === 'fulfilled' ? minResS.value : null;
        const camRes = camResS.status === 'fulfilled' ? camResS.value : null;
        const campusRes = campusResS.status === 'fulfilled' ? campusResS.value : null;
        const leadRes = leadResS.status === 'fulfilled' ? leadResS.value : null;

        const pageJson = pageRes ? await pageRes.json() : null;
        const evJson = evRes ? await evRes.json() : null;
        const seJson = seRes ? await seRes.json() : null;
        const setJson = setRes ? await setRes.json() : null;
        const minJson = minRes ? await minRes.json() : null;
        const camJson = camRes ? await camRes.json() : null;
        const campusJson = campusRes ? await campusRes.json() : null;
        const leadJson = leadRes ? await leadRes.json() : null;

        const pubSettings = readSuccess<PublicSettings>(setJson);
        setSettings(pubSettings);

        if (!pageRes || !pageRes.ok || !pageJson || pageJson.status !== 'success' || !pageJson.data) {
          if (['home', 'about', 'ministries', 'sermons', 'events', 'giving', 'prayer', 'contact'].includes(effectiveSlug)) {
             setPage({ title: effectiveSlug.toUpperCase(), slug: effectiveSlug, content: '[]', isPublished: true });
          } else {
            setPage(null);
            setError(((pageJson as any)?.message as string | undefined) || `Unable to load page (${pageRes?.status ?? 'network'})`);
            return;
          }
        } else {
          setPage(pageJson.data);
        }

        setEvents(readSuccess<PublicEventRow[]>(evJson) ?? []);
        setSermons(readSuccess<PublicSermonRow[]>(seJson) ?? []);
        setMinistries(readSuccess<any[]>(minJson) ?? []);
        setCampaigns(readSuccess<any[]>(camJson) ?? []);
        setCampuses(readSuccess<any[]>(campusJson) ?? []);
        setLeadership(readSuccess<any[]>(leadJson) ?? []);

        const pagesRes = await apiFetch('website/public/pages', { headers });
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

  const orgName = settings?.organization?.name || 'Grace Community';
  const primaryColor = settings?.branding?.primaryColor || '#4F46E5';
  const currency = settings?.currency || 'INR';
  const livestreamUrl = settings?.organization?.livestreamUrl?.trim() || '';

  const seo = settings?.seo;
  usePublicSeo({
    title: seo?.siteTitle || page?.title || effectiveSlug,
    description:
      seo?.description ||
      settings?.organization?.tagline ||
      `${orgName} — worship, community, and ministry online.`,
    keywords: seo?.keywords,
    siteName: orgName,
    canonicalPath: effectiveSlug === 'home' ? '/' : `/${effectiveSlug}`,
    imageUrl: seo?.ogImageUrl || settings?.branding?.logo || undefined,
    allowIndexing: seo?.allowIndexing !== false,
  });

  const boundOpts = React.useMemo(
    () => ({
      events: mapEventsForWebsite(events),
      sermons: mapSermonsForWebsite(sermons),
      ministries: mapMinistriesForWebsite(ministries),
      campaigns: mapCampaignsForWebsite(campaigns, currency),
      leadership: mapLeadershipForWebsite(leadership),
      campuses,
      branding: settings?.branding,
      orgName,
      orgSettings: settings,
    }),
    [events, sermons, ministries, campaigns, leadership, campuses, settings, currency, orgName],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 font-black uppercase tracking-widest text-xs">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 rounded-2xl border-4 border-indigo-600 border-t-transparent animate-spin" />
           {orgName}
        </div>
      </div>
    );
  }

  if (error && !page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-6 text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center">
           <Info className="w-10 h-10" />
        </div>
        <div className="space-y-2">
           <h1 className="text-3xl font-black text-white uppercase tracking-tight">Experience Not Found</h1>
           <p className="text-slate-400 font-medium max-w-md mx-auto">{error || 'The requested page is not available.'}</p>
        </div>
        <a href="/" className="h-14 px-10 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center shadow-xl shadow-indigo-600/20">
           Return Home
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col">
      <SharedNavbar 
        organizationName={orgName} 
        primaryColor={primaryColor} 
        pages={allPages} 
      />
      
      <main className="flex-1 animate-in fade-in duration-1000">
        {effectiveSlug === 'home' && livestreamUrl && (
          <SharedLivestreamBanner url={livestreamUrl} primaryColor={primaryColor} />
        )}
        {page && renderSections(page.content, effectiveSlug, boundOpts)}
      </main>

      <SharedFooter organizationName={orgName} orgSettings={settings} />
    </div>
  );
}
