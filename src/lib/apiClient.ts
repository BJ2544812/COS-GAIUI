/**
 * Central HTTP client: base URL, tenant + auth headers, 401 handling, response parsing.
 */
import { API_BASE_URL, VITE_TENANT_DEFAULT } from './apiConfig';
import { clearToken, getTenantId, getToken, isWithinLoginGraceWindow, LOGIN_GRACE_MS } from './authSession';

export { API_BASE_URL } from './apiConfig';
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
};

function effectiveTenantId(): string {
  return getTenantId() ?? VITE_TENANT_DEFAULT;
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

export function formatApiError(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}

/** True when the browser could not complete the HTTP request (backend down, wrong port, CORS, DNS). */
export function isConnectivityFailure(e: unknown): boolean {
  if (!(e instanceof ApiError)) return false;
  if (e.status === 0) return true;
  const m = (e.message || '').toLowerCase();
  return m.includes('failed to fetch') || m.includes('networkerror') || m.includes('cannot reach');
}

export async function apiRequest<T = unknown>(path: string, init: RequestInitJson = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  if (import.meta.env.DEV) {
    console.log('API CALL:', url);
  }
  const token = getToken();

  const headers = new Headers(init.headers);
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
    init.body === undefined
      ? undefined
      : typeof init.body === 'string'
        ? init.body
        : JSON.stringify(init.body);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s safety timeout

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers, body, signal: controller.signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') {
      throw new ApiError(408, 'Request timed out (10s limit)', { timeout: true });
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

  if (!res.ok) {
    const msg = errorMessageFromBody(parsed, res.statusText || 'Request failed');
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
