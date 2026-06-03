import * as React from 'react';

export type PublicSeoInput = {
  title: string;
  description?: string;
  keywords?: string;
  imageUrl?: string;
  canonicalPath?: string;
  siteName?: string;
  allowIndexing?: boolean;
};

function upsertMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  if (typeof document === 'undefined') return;
  const selector = `meta[${attr}="${name}"]`;
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function upsertLink(rel: string, href: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function usePublicSeo(input: PublicSeoInput) {
  React.useEffect(() => {
    const site = input.siteName?.trim() || 'Kingdom Church';
    const fullTitle = input.title.includes(site) ? input.title : `${input.title} · ${site}`;
    document.title = fullTitle;

    const description =
      input.description?.trim() ||
      `${site} — worship, community, giving, and ministry online.`;

    upsertMeta('description', description);
    if (input.keywords?.trim()) {
      upsertMeta('keywords', input.keywords.trim());
    }
    upsertMeta('og:title', fullTitle, 'property');
    upsertMeta('og:description', description, 'property');
    upsertMeta('og:type', 'website', 'property');
    upsertMeta('twitter:card', 'summary_large_image');
    upsertMeta('twitter:title', fullTitle);
    upsertMeta('twitter:description', description);

    if (input.imageUrl) {
      upsertMeta('og:image', input.imageUrl, 'property');
      upsertMeta('twitter:image', input.imageUrl);
    }

    if (input.allowIndexing === false) {
      upsertMeta('robots', 'noindex, nofollow');
    }

    if (input.canonicalPath && typeof window !== 'undefined') {
      const origin = window.location.origin;
      upsertLink('canonical', `${origin}${input.canonicalPath.startsWith('/') ? '' : '/'}${input.canonicalPath}`);
    }
  }, [input.title, input.description, input.keywords, input.imageUrl, input.canonicalPath, input.siteName, input.allowIndexing]);
}
