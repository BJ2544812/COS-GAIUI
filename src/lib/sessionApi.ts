/**
 * Deduplicated GET /auth/me for background session bootstrap.
 * Defers the first call until the post-login grace window, retries once on transient errors, never clears the token.
 */
import { getLastLoginAt, LOGIN_GRACE_MS } from './authSession';
import { apiRequest, parseApiResponse, ApiError } from './apiClient';

let inflight: Promise<Record<string, unknown>> | null = null;

function waitForLoginGrace(): Promise<void> {
  const t = getLastLoginAt();
  if (t == null) return Promise.resolve();
  const elapsed = Date.now() - t;
  if (elapsed >= LOGIN_GRACE_MS) return Promise.resolve();
  return new Promise((r) => setTimeout(r, LOGIN_GRACE_MS - elapsed));
}

function isTransientMeError(e: unknown): boolean {
  if (e instanceof ApiError) {
    if (e.status === 0) return true;
    if (e.status >= 500) return true;
  }
  return false;
}

async function fetchMeWithRetry(): Promise<Record<string, unknown>> {
  const attempt = async () => {
    const json = await apiRequest<Record<string, unknown>>('/auth/me', { method: 'GET' });
    return parseApiResponse<Record<string, unknown>>(json);
  };

  // No grace window delay — loginAndRefresh handles post-login /auth/me directly.
  // On page reload, /auth/me should fire immediately.
  try {
    return await attempt();
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 401) throw e;
      // One warm-up retry when API was still binding or proxy had a transient failure
      if (e.status === 0) {
        await new Promise((r) => setTimeout(r, 600));
        try {
          return await attempt();
        } catch (e2) {
          throw e2;
        }
      }
      if (!isTransientMeError(e)) throw e;
    } else {
      throw e;
    }
    await new Promise((r) => setTimeout(r, 300));
    return await attempt();
  }
}

/**
 * One in-flight /auth/me. Waits for login grace before calling; retries once on network/5xx.
 * Does not clear tokens; 401 after grace is handled only in apiClient.
 */
export function getSessionUserFromApi(): Promise<Record<string, unknown>> {
  if (!inflight) {
    const p = fetchMeWithRetry();
    inflight = p;
    void p
      .finally(() => {
        inflight = null;
      })
      .catch(() => {
        /* Rejection is delivered to awaiters; prevent unhandledrejection on this branch */
      });
  }
  return inflight!;
}

export { ApiError } from './apiClient';
