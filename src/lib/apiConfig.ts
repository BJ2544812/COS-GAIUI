/** Vite dev server port — keep in sync with vite.config.ts `server.port`. */
const VITE_DEV_PORT = 3001;

/**
 * In Vite dev, default to same-origin `/api/v1` so requests use vite.config.ts proxy → API (port 4002).
 * Set VITE_API_BASE_URL explicitly to override (e.g. direct http://localhost:4002/api/v1).
 */
const rawApi = import.meta.env.VITE_API_BASE_URL;
const trimmed = typeof rawApi === 'string' ? rawApi.trim() : '';
export const API_BASE_URL =
  trimmed !== ''
    ? trimmed.replace(/\/$/, '')
    : import.meta.env.DEV
      ? '/api/v1'
      : 'http://localhost:4002/api/v1';

const DEFAULT_TENANT = 'default-tenant-id';

export const VITE_TENANT_DEFAULT = import.meta.env.VITE_TENANT_ID || DEFAULT_TENANT;

/** Optional: mirrors Settings → Organization for the unauthenticated public site (hero / header). */
export const VITE_PUBLIC_ORG_NAME = String(import.meta.env.VITE_PUBLIC_ORG_NAME ?? '').trim();
/** Optional: one-line mission or tagline on the public home hero. */
export const VITE_PUBLIC_ORG_TAGLINE = String(import.meta.env.VITE_PUBLIC_ORG_TAGLINE ?? '').trim();

/**
 * Origin for absolute URLs (uploads, images). With proxied API (`/api/v1`), use same browser origin
 * so `/uploads/...` resolves via Vite proxy.
 */
export const SERVER_ROOT =
  API_BASE_URL.startsWith('/')
    ? typeof window !== 'undefined'
      ? window.location.origin
      : `http://localhost:${VITE_DEV_PORT}`
    : String(API_BASE_URL).replace(/\/api\/v1\/?$/, '') || 'http://127.0.0.1:4002';

if (import.meta.env.DEV) {
  console.log('[ApiConfig] API_BASE_URL:', API_BASE_URL, '| Tenant:', VITE_TENANT_DEFAULT);
}
