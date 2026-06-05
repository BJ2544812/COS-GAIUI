/**
 * Wait until the Kingdom OS API health endpoint responds (used before starting Vite in CI).
 * Usage: node scripts/wait-for-health.mjs [url]
 * For route table: pass /health/routes — requires JSON status "ready"
 */
const url = process.argv[2] || process.env.HEALTH_URL || 'http://127.0.0.1:4002/health';
const requireRoutesReady = url.includes('/health/routes');
const deadline = Date.now() + Number(process.env.HEALTH_WAIT_MS || 120_000);
const interval = 400;

console.log('[wait-for-health] Waiting for', url, requireRoutesReady ? '(routes ready)' : '…');

while (Date.now() < deadline) {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 8000);
    const res = await fetch(url, { signal: ac.signal });
    clearTimeout(t);
    if (requireRoutesReady) {
      let body;
      try {
        body = await res.json();
      } catch {
        body = null;
      }
      if (res.ok && body?.status === 'ready') {
        console.log('[wait-for-health] Route table ready', body.bootId ?? '');
        process.exit(0);
      }
    } else if (res.ok) {
      console.log('[wait-for-health] OK', res.status);
      process.exit(0);
    }
  } catch {
    /* try again */
  }
  await new Promise((r) => setTimeout(r, interval));
}

console.error('[wait-for-health] Timed out waiting for API at', url);
if (requireRoutesReady) {
  console.error('[wait-for-health] Run: npm run runtime:clean && npm run dev:server:fresh');
}
process.exit(1);
