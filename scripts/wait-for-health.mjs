/**
 * Wait until the Kingdom OS API health endpoint responds (used before starting Vite in CI).
 * Usage: node scripts/wait-for-health.mjs [url]
 * Default: http://127.0.0.1:4002/health
 */
const url = process.argv[2] || process.env.HEALTH_URL || 'http://127.0.0.1:4002/health';
const deadline = Date.now() + Number(process.env.HEALTH_WAIT_MS || 120_000);
const interval = 400;

console.log('[wait-for-health] Waiting for', url, '…');

while (Date.now() < deadline) {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 5000);
    const res = await fetch(url, { signal: ac.signal });
    clearTimeout(t);
    if (res.ok) {
      console.log('[wait-for-health] OK', res.status);
      process.exit(0);
    }
  } catch {
    /* try again */
  }
  await new Promise((r) => setTimeout(r, interval));
}

console.error('[wait-for-health] Timed out waiting for API at', url);
process.exit(1);
