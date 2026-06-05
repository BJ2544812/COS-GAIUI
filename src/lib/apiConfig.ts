/** Vite dev server port — keep in sync with vite.config.ts `server.port`. */
const VITE_DEV_PORT = 3001;

const DEFAULT_TENANT = 'default-tenant-id';

/**
 * Normalize any API base to end with `/api/v1` (never bare `/api` — server 404 catch-all).
 */
export function normalizeApiBaseUrl(url: string): string {
  let u = String(url || '').trim().replace(/\/$/, '');
  if (!u) return defaultApiBaseUrl();

  if (/\/api\/v1$/i.test(u)) return u;
  if (/\/api$/i.test(u)) return `${u}/v1`;
  if (!/\/api\//i.test(u)) return `${u}/api/v1`;

  const apiIdx = u.toLowerCase().indexOf('/api/');
  if (apiIdx >= 0 && !u.toLowerCase().includes('/api/v1')) {
    return `${u.slice(0, apiIdx)}/api/v1`;
  }

  return u;
}

/** Default API base: same-origin in browser; localhost only for Node/scripts. */
export function defaultApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return '/api/v1';
  }
  if (import.meta.env.DEV) {
    return '/api/v1';
  }
  return 'http://127.0.0.1:4002/api/v1';
}

const rawApi = import.meta.env.VITE_API_BASE_URL;
const trimmed = typeof rawApi === 'string' ? rawApi.trim() : '';

export const API_BASE_URL = normalizeApiBaseUrl(trimmed !== '' ? trimmed : defaultApiBaseUrl());

export const VITE_TENANT_DEFAULT = import.meta.env.VITE_TENANT_ID || DEFAULT_TENANT;

export const VITE_PUBLIC_ORG_NAME = String(import.meta.env.VITE_PUBLIC_ORG_NAME ?? '').trim();
export const VITE_PUBLIC_ORG_TAGLINE = String(import.meta.env.VITE_PUBLIC_ORG_TAGLINE ?? '').trim();

/** Strip accidental API prefix from relative resource paths. */
export function normalizeApiResourcePath(path: string): string {
  let p = String(path || '').trim().replace(/^\//, '');
  p = p.replace(/^(?:api\/v1\/|api\/)/i, '');
  return p;
}

/**
 * Build the final request URL. In the browser we ALWAYS use same-origin `/api/v1/...`
 * so a mis-set `VITE_API_BASE_URL=http://host:4002/api` cannot produce `/api/finance/*` 404s.
 */
export function resolveApiUrl(path: string): string {
  const resource = normalizeApiResourcePath(path);

  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin.replace(/\/$/, '');
    const url = `${origin}/api/v1/${resource}`;
    return url.replace(/([^:]\/)\/+/g, '$1');
  }

  const base = normalizeApiBaseUrl(API_BASE_URL).replace(/\/$/, '');
  const url = `${base}/${resource}`;
  return enforceApiV1InUrl(url);
}

/** Last-resort fix for absolute URLs that still contain `/api/` without `v1`. */
export function enforceApiV1InUrl(url: string): string {
  return url.replace(/\/api\/(?!v1\/)/gi, '/api/v1/');
}

export function isValidErpApiUrl(url: string): boolean {
  try {
    const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1');
    return /\/api\/v1\//i.test(u.pathname);
  } catch {
    return false;
  }
}

export const SERVER_ROOT =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : API_BASE_URL.startsWith('/')
      ? `http://127.0.0.1:${VITE_DEV_PORT}`
      : String(API_BASE_URL).replace(/\/api\/v1\/?$/i, '') || 'http://127.0.0.1:4002';

if (import.meta.env.DEV && typeof window !== 'undefined') {
  console.log('[ApiConfig] API_BASE_URL:', API_BASE_URL, '| resolve →', `${window.location.origin}/api/v1/...`);
}
