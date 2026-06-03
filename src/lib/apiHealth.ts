/**
 * Lightweight API reachability probe for login and setup UX.
 * Uses same-origin GET /health (Vite/nginx proxy in dev and production).
 */

const DEFAULT_DEV_API_ROOT = 'http://127.0.0.1:4002';

/** Expected backend root shown in offline guidance (matches vite.config proxy default). */
export const EXPECTED_API_ROOT = (
  typeof import.meta.env.VITE_DEV_PROXY_TARGET === 'string' &&
  import.meta.env.VITE_DEV_PROXY_TARGET.trim() !== ''
    ? import.meta.env.VITE_DEV_PROXY_TARGET.trim().replace(/\/$/, '')
    : DEFAULT_DEV_API_ROOT
);

export type ApiAvailabilityReason =
  | 'available'
  | 'api_unavailable'
  | 'connection_refused'
  | 'server_offline';

export type ApiAvailability = {
  ok: boolean;
  reason: ApiAvailabilityReason;
};

export function resolveHealthUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin.replace(/\/$/, '')}/health`;
  }
  return `${EXPECTED_API_ROOT}/health`;
}

/** User-facing detail bullets for offline states — no stack traces or raw exceptions. */
export function connectivityDetailLabels(reason: ApiAvailabilityReason): string[] {
  switch (reason) {
    case 'connection_refused':
      return ['API unavailable', 'Connection refused', 'Server offline'];
    case 'server_offline':
      return ['API unavailable', 'Server offline'];
    case 'api_unavailable':
      return ['API unavailable', 'Connection refused', 'Server offline'];
    default:
      return [];
  }
}

/** True when a login or session error indicates transport failure, not bad credentials. */
export function isLoginTransportFailure(err: unknown): boolean {
  if (err instanceof Error) {
    const m = err.message.toLowerCase();
    return (
      /cannot reach|failed to fetch|networkerror|connection refused|4002|dev:server|login failed \(500\)|login failed \(502\)|login failed \(503\)/.test(
        m,
      )
    );
  }
  return false;
}

export function isConnectivityLikeMessage(message: string | null | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return /cannot reach|failed to fetch|networkerror|4002|dev:server|connection refused|server offline|api unavailable/.test(
    m,
  );
}

/**
 * Probe GET /health. Does not authenticate; safe to call before login.
 * Treats Vite proxy 5xx (ECONNREFUSED upstream) as server offline.
 */
export async function checkApiAvailability(options?: {
  timeoutMs?: number;
  signal?: AbortSignal;
}): Promise<ApiAvailability> {
  const timeoutMs = options?.timeoutMs ?? 8_000;
  const url = resolveHealthUrl();
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  options?.signal?.addEventListener('abort', onAbort, { once: true });
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });

    if (res.ok) {
      try {
        const json = (await res.json()) as Record<string, unknown>;
        const status = typeof json.status === 'string' ? json.status.toLowerCase() : '';
        if (status === 'healthy' || json.database != null) {
          return { ok: true, reason: 'available' };
        }
      } catch {
        /* non-JSON 2xx still counts as reachable */
      }
      return { ok: true, reason: 'available' };
    }

    if (res.status === 503) {
      return { ok: false, reason: 'server_offline' };
    }
    if (res.status >= 500 || res.status === 502) {
      return { ok: false, reason: 'connection_refused' };
    }
    return { ok: false, reason: 'api_unavailable' };
  } catch (e) {
    if ((e as Error).name === 'AbortError') {
      return { ok: false, reason: 'api_unavailable' };
    }
    return { ok: false, reason: 'connection_refused' };
  } finally {
    clearTimeout(timeoutId);
    options?.signal?.removeEventListener('abort', onAbort);
  }
}
