/**
 * Shared website section ordering and hero copy resolution so builder preview and public pages stay aligned.
 * Frontend-only; no API changes.
 */

export const DEFAULT_PUBLIC_MISSION =
  'Growing in faith, serving with compassion, and welcoming everyone God sends our way.';

const GENERIC_HERO_TITLES = /^welcome$/i;

const SECTION_FLOW_PRIORITY: Record<string, number> = {
  hero: 0,
  text: 1,
  event_list: 2,
  sermon_list: 3,
  giving_cta: 4,
  contact_form: 5,
  image: 6,
};

export function sortSectionsForDisplay<T extends { type: string; order?: number }>(sections: T[]): T[] {
  return [...sections].sort((a, b) => {
    if (typeof a.order === 'number' && typeof b.order === 'number') {
      return a.order - b.order;
    }
    const pa = SECTION_FLOW_PRIORITY[a.type] ?? 99;
    const pb = SECTION_FLOW_PRIORITY[b.type] ?? 99;
    return pa - pb;
  });
}

function extractWelcomeToName(rawTitle: string): string | null {
  const m = rawTitle.match(/^Welcome to\s+(.+)$/i);
  if (!m) return null;
  const rest = m[1].trim();
  return rest.length ? rest : null;
}

export function resolveHeroForHomePage(options: {
  heroConfig: Record<string, unknown>;
  publicOrgNameEnv?: string;
  publicTaglineEnv?: string;
}): { h1: string; subtitle: string } {
  const { heroConfig, publicOrgNameEnv, publicTaglineEnv } = options;
  const rawTitle = String(heroConfig.title ?? '').trim();
  const rawSub = String(heroConfig.subtitle ?? '').trim();

  const envName = publicOrgNameEnv?.trim();
  const envTag = publicTaglineEnv?.trim();

  const welcomeName = extractWelcomeToName(rawTitle);
  let h1 = envName || welcomeName || rawTitle;
  if (GENERIC_HERO_TITLES.test(h1)) {
    h1 = welcomeName || 'Faith community';
  }
  if (!h1) h1 = 'Faith community';

  const subtitle = envTag || rawSub || DEFAULT_PUBLIC_MISSION;

  return { h1, subtitle };
}

export function resolveHeroForInnerPage(heroConfig: Record<string, unknown>): { h1: string; subtitle: string } {
  const rawTitle = String(heroConfig.title ?? '').trim();
  const rawSub = String(heroConfig.subtitle ?? '').trim();
  const h1 = rawTitle || 'Gather with us';
  const subtitle = rawSub || DEFAULT_PUBLIC_MISSION;
  return { h1, subtitle };
}

export function heroFieldFallbacksForBuilder(
  pageSlug: string | undefined,
  organizationName: string,
): { titleFallback: string; subtitleFallback: string } {
  const slug = (pageSlug || '').toLowerCase();
  const org = organizationName.trim();
  const titleFallback =
    slug === 'home'
      ? org && org !== 'Church' && org !== 'My Church'
        ? org
        : 'Faith community'
      : '';
  const subtitleFallback = slug === 'home' ? DEFAULT_PUBLIC_MISSION : 'Gather with us this week.';
  return { titleFallback, subtitleFallback };
}
