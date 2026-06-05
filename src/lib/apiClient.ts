/**
 * Central HTTP client: base URL, tenant + auth headers, 401 handling, response parsing.
 */
import { API_BASE_URL, enforceApiV1InUrl, isValidErpApiUrl, resolveApiUrl, VITE_TENANT_DEFAULT } from './apiConfig';
import { apiErrorHintForUsers } from './churchProductCopy';
import {
  clearToken,
  getToken,
  isWithinLoginGraceWindow,
  LOGIN_GRACE_MS,
  resolveActiveTenantId,
} from './authSession';

export { API_BASE_URL, enforceApiV1InUrl, isValidErpApiUrl, resolveApiUrl } from './apiConfig';

export const TENANT_FALLBACK = VITE_TENANT_DEFAULT;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body: unknown = undefined,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestInitJson = Omit<RequestInit, 'body'> & {
  body?: unknown;
  /** Override request timeout in milliseconds. */
  timeoutMs?: number;
  /** Number of automatic retries for timeout/connectivity failures. */
  retries?: number;
};

function effectiveTenantId(): string {
  return resolveActiveTenantId();
}

function isLoginPath(path: string, absoluteUrl: string): boolean {
  const p = path.replace(/^\//, '');
  if (p === 'auth/login' || p.endsWith('/auth/login')) return true;
  return absoluteUrl.includes('/auth/login');
}

/** Avoid redirect loop when 401 while already on login. */
function isOnLoginPage(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  return path === '/login' || path.endsWith('/login');
}

/** Session bootstrap: avoid `location.replace` on /auth/me 401 — AuthProvider clears state in-SPA. */
function isAuthMePath(path: string, absoluteUrl: string): boolean {
  const p = path.replace(/^\//, '');
  if (p === 'auth/me' || p.endsWith('auth/me')) return true;
  return absoluteUrl.includes('/auth/me');
}

/**
 * Read JSON error message from common backend shapes: { error }, { message }, { errors }.
 */
function errorMessageFromBody(parsed: unknown, fallback: string): string {
  if (parsed && typeof parsed === 'object') {
    const o = parsed as Record<string, unknown>;
    if (typeof o.error === 'string') return o.error;
    if (o.error && typeof o.error === 'object') {
      const errObj = o.error as Record<string, unknown>;
      if (typeof errObj.message === 'string') return errObj.message;
    }
    if (typeof o.message === 'string') return o.message;
    if (o.errors && typeof o.errors === 'object') {
      const e = o.errors as Record<string, string[] | string>;
      const first = Object.values(e).flat().find((v) => typeof v === 'string' && v);
      if (first) return first as string;
    }
  }
  return fallback;
}

/**
 * Standard success parser: requires `status === "success"`, then returns `data` or (for /auth/me) `user`.
 */
export function parseApiResponse<T>(json: unknown): T {
  if (!json || typeof json !== 'object') {
    throw new ApiError(500, 'Invalid response', json);
  }
  const o = json as Record<string, unknown>;
  if (o.status !== 'success') {
    const nested =
      o.error && typeof o.error === 'object' && typeof (o.error as Record<string, unknown>).message === 'string'
        ? ((o.error as Record<string, unknown>).message as string)
        : null;
    const msg =
      typeof o.error === 'string'
        ? o.error
        : nested ?? (typeof o.message === 'string' ? o.message : 'Request was not successful');
    throw new ApiError(500, msg, json);
  }
  if (o.data !== undefined) {
    return o.data as T;
  }
  if (o.user !== undefined) {
    return o.user as T;
  }
  throw new ApiError(500, 'Invalid response: missing data', json);
}

/** @deprecated Use parseApiResponse */
export const getJsonData = parseApiResponse;

/** True when the browser could not complete the HTTP request (backend down, wrong port, CORS, DNS). */
export function isConnectivityFailure(e: unknown): boolean {
  if (!(e instanceof ApiError)) return false;
  if (e.status === 0) return true;
  const m = (e.message || '').toLowerCase();
  return m.includes('failed to fetch') || m.includes('networkerror') || m.includes('cannot reach');
}

export function formatApiError(e: unknown): string {
  if (e instanceof ApiError) {
    if (isConnectivityFailure(e)) {
      return apiErrorHintForUsers(
        'We could not reach the church office server. Check your internet connection.',
      );
    }
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return 'Something went wrong. Please try again.';
}

function buildApiUrl(path: string): string {
  const url = path.startsWith('http') ? enforceApiV1InUrl(path) : resolveApiUrl(path);
  if (import.meta.env.DEV && typeof window !== 'undefined' && !isValidErpApiUrl(url)) {
    console.warn('[apiRequest] URL is missing /api/v1/ — check resolveApiUrl:', url);
  }
  return url;
}

/** Low-level fetch with auth + tenant headers (multipart uploads, public POST, etc.). */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = buildApiUrl(path);
  const token = getToken();
  const headers = new Headers(init.headers);
  const tid = effectiveTenantId();
  if (tid) headers.set('x-tenant-id', tid);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body instanceof FormData && headers.has('Content-Type')) {
    headers.delete('Content-Type');
  }
  return fetch(url, { ...init, headers });
}

export async function apiRequest<T = unknown>(path: string, init: RequestInitJson = {}): Promise<T> {
  const url = buildApiUrl(path);
  if (import.meta.env.DEV) {
    console.log('API CALL:', url);
  }
  const token = getToken();

  const method = String(init.method || 'GET').toUpperCase();
  const { timeoutMs, retries, ...fetchInit } = init;
  const headers = new Headers(fetchInit.headers);
  if (!headers.has('Content-Type') && init.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  const tid = effectiveTenantId();
  if (tid) {
    headers.set('x-tenant-id', tid);
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (import.meta.env.DEV) {
    console.log(`[apiRequest] ${init.method || 'GET'} ${url} | Tenant: ${tid}`);
  }

  const body =
    fetchInit.body === undefined
      ? undefined
      : typeof fetchInit.body === 'string'
        ? fetchInit.body
        : JSON.stringify(fetchInit.body);

  const effectiveTimeout = timeoutMs ?? (method === 'GET' ? 20_000 : 12_000);
  const effectiveRetries = retries ?? (method === 'GET' ? 1 : 0);

  let lastError: unknown = null;
  let res: Response | null = null;
  for (let attempt = 0; attempt <= effectiveRetries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), effectiveTimeout);
    try {
      res = await fetch(url, { ...fetchInit, headers, body, signal: controller.signal });
      break;
    } catch (e) {
      lastError = e;
      const isAbort = (e as Error).name === 'AbortError';
      const isLast = attempt >= effectiveRetries;
      if (isAbort && !isLast) {
        await new Promise((r) => setTimeout(r, 250));
        continue;
      }
      if (isAbort && isLast) {
        throw new ApiError(408, `Request timed out (${Math.round(effectiveTimeout / 1000)}s limit)`, { timeout: true });
      }
      if (!isLast) {
        await new Promise((r) => setTimeout(r, 250));
        continue;
      }
      const raw = e instanceof Error ? e.message : 'Network error';
      const hint =
        import.meta.env.DEV && API_BASE_URL.startsWith('/')
          ? `${raw} — Is the API running on port 4002? Run: npm run dev:server (then keep this Vite tab on port 3001). If migrate failed earlier, run: npm run db:migrate`
          : raw;
      throw new ApiError(0, hint, e);
    } finally {
      clearTimeout(timeoutId);
    }
  }
  if (!res) {
    throw new ApiError(0, 'Network error', lastError);
  }

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = { error: text };
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (res.status === 401) {
    const msg = errorMessageFromBody(parsed, 'Session expired');
    const shouldHardLogout =
      !isLoginPath(path, url) &&
      !isOnLoginPage() &&
      !isWithinLoginGraceWindow(LOGIN_GRACE_MS) &&
      !isAuthMePath(path, url);
    if (shouldHardLogout) {
      clearToken();
      window.location.replace('/login');
    }
    throw new ApiError(401, msg, parsed);
  }

  // Tenant mismatch, missing permission, etc. Do not clear session here — only 401 triggers hard logout.
  if (res.status === 403) {
    const msg = errorMessageFromBody(parsed, 'Forbidden');
    throw new ApiError(403, msg, parsed);
  }

  if (res.status === 503) {
    const body = parsed as Record<string, unknown> | null;
    const msg =
      (typeof body?.message === 'string' && body.message) ||
      errorMessageFromBody(parsed, 'System is in maintenance mode. Try again shortly or contact an administrator.');
    throw new ApiError(503, msg, parsed);
  }

  if (!res.ok) {
    let msg = errorMessageFromBody(parsed, res.statusText || 'Request failed');
    if (res.status === 404 && /route not found/i.test(msg)) {
      msg +=
        ' — Requests must use /api/v1/ (not /api/ alone). Hard-refresh the browser (Ctrl+Shift+R) and restart the API: npm run dev:server.';
    }
    throw new ApiError(res.status, msg, parsed);
  }

  return parsed as T;
}

export function stripUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

/** Fetch binary response (PDF, etc.) with same auth/tenant headers as apiRequest. */
export async function apiDownloadBlob(path: string, init: Omit<RequestInitJson, 'body'> = {}): Promise<Blob> {
  const url = buildApiUrl(path);
  const token = getToken();
  const headers = new Headers(init.headers);
  const tid = effectiveTenantId();
  if (tid) headers.set('x-tenant-id', tid);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), init.timeoutMs ?? 60_000);
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers, signal: controller.signal });
  } catch (e) {
    clearTimeout(timeoutId);
    const raw = e instanceof Error ? e.message : 'Network error';
    throw new ApiError(0, raw, e);
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 401) {
    if (!isOnLoginPage() && !isWithinLoginGraceWindow(LOGIN_GRACE_MS)) {
      clearToken();
      window.location.replace('/login');
    }
    throw new ApiError(401, 'Session expired');
  }
  if (!res.ok) {
    const text = await res.text();
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { error: text };
    }
    throw new ApiError(res.status, errorMessageFromBody(parsed, res.statusText || 'Download failed'), parsed);
  }
  return res.blob();
}

export function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function openBlobInNewTab(blob: Blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
