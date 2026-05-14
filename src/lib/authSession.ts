/**
 * Central auth session: JWT + tenant for API access.
 * Keys: auth_token, auth_tenant_id
 */
import { API_BASE_URL, VITE_TENANT_DEFAULT } from './apiConfig';

const TOKEN_KEY = 'auth_token';
const TENANT_KEY = 'auth_tenant_id';
const LAST_LOGIN_AT_KEY = 'auth_last_login_at';

/** Do not treat 401 as hard logout for this long after a successful client login. */
export const LOGIN_GRACE_MS = 3500;

export function getDefaultTenantId(): string {
  return VITE_TENANT_DEFAULT;
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getTenantId(): string | null {
  try {
    return localStorage.getItem(TENANT_KEY);
  } catch {
    return null;
  }
}

/**
 * Store JWT and tenant id after successful login. Both are sent on subsequent API calls.
 */
export function setToken(jwt: string, tenantId: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, jwt);
    localStorage.setItem(TENANT_KEY, tenantId);
    localStorage.setItem(LAST_LOGIN_AT_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

/**
 * When the user last completed login in this tab (ms since epoch). Used to avoid
 * racing /me vs token persistence and to defer hard 401 handling.
 */
export function getLastLoginAt(): number | null {
  try {
    const v = localStorage.getItem(LAST_LOGIN_AT_KEY);
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function isWithinLoginGraceWindow(maxMs: number = LOGIN_GRACE_MS): boolean {
  const t = getLastLoginAt();
  if (t == null) return false;
  return Date.now() - t < maxMs;
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TENANT_KEY);
    localStorage.removeItem(LAST_LOGIN_AT_KEY);
  } catch {
    // ignore
  }
}

export interface LoginResult {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
    permissions: string[];
  };
}

/**
 * Public login (no prior Bearer). Does not go through apiRequest to avoid 401 redirect.
 */
export async function loginWithCredentials(
  username: string,
  password: string,
  tenantId: string,
): Promise<LoginResult> {
  const u = String(username).trim();
  const base = API_BASE_URL.replace(/\/$/, '');
  const url = `${base}/auth/login`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId || '',
      },
      body: JSON.stringify({ username: u, password }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Cannot reach the API (${url}). Start the backend on port 4002 (e.g. npm run dev:server) and ensure Vite proxy matches. ${msg}`,
    );
  }
  const text = await res.text();
  let parsed: Record<string, unknown> = {};
  try {
    if (text) parsed = JSON.parse(text) as Record<string, unknown>;
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    const msg =
      typeof parsed.error === 'string'
        ? parsed.error
        : typeof parsed.message === 'string'
          ? parsed.message
          : res.status === 401
            ? 'Invalid credentials'
            : `Login failed (${res.status})`;
    throw new Error(msg);
  }
  if (parsed.status !== 'success' || typeof parsed.token !== 'string') {
    throw new Error(
      typeof parsed.error === 'string' ? parsed.error : 'Invalid response from server',
    );
  }
  return {
    token: parsed.token,
    user: parsed.user as LoginResult['user'],
  };
}
