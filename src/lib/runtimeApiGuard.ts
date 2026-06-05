/**
 * Dev-only guard: warn when same-origin ERP fetches skip /api/v1 (stale bundle or misconfig).
 */
export function installRuntimeApiGuard(): void {
  if (!import.meta.env.DEV || typeof window === 'undefined') return;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const raw =
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      const u = new URL(raw, window.location.origin);
      const sameOrigin = u.origin === window.location.origin;
      const isErpApi =
        sameOrigin &&
        u.pathname.startsWith('/api/') &&
        !u.pathname.startsWith('/api/v1/');
      if (isErpApi) {
        console.error(
          '[RuntimeApiGuard] Non-v1 ERP API URL — hard refresh (Ctrl+Shift+R) and restart dev:server:',
          u.pathname,
        );
      }
    } catch {
      /* ignore malformed URLs */
    }
    return nativeFetch(input, init);
  };

  console.info('[RuntimeApiGuard] Active — ERP API calls must use /api/v1/ on this origin.');
}
