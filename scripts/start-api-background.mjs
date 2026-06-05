#!/usr/bin/env node
/**
 * Start API in background and wait for /health/routes to report ready.
 * Usage: node scripts/start-api-background.mjs
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = process.env.PORT || '4002';
const healthUrl = process.env.HEALTH_URL || `http://127.0.0.1:${port}/health`;
const routesUrl = process.env.ROUTES_HEALTH_URL || `http://127.0.0.1:${port}/health/routes`;
const deadline = Date.now() + Number(process.env.API_START_WAIT_MS || 180_000);

const child = spawn(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['run', 'dev:server'],
  { cwd: root, stdio: 'inherit', env: { ...process.env, SKIP_ROUTE_VERIFY: process.env.SKIP_ROUTE_VERIFY ?? '0' } },
);

child.on('error', (e) => {
  console.error('[start-api] Failed to spawn:', e);
  process.exit(1);
});

console.log('[start-api] Waiting for', healthUrl);
while (Date.now() < deadline) {
  try {
    const h = await fetch(healthUrl, { signal: AbortSignal.timeout(5000) });
    if (h.ok) {
      const routes = await fetch(routesUrl, { signal: AbortSignal.timeout(8000) });
      if (routes.ok) {
        const body = await routes.json();
        if (body.status === 'ready') {
          console.log('[start-api] API ready — bootId:', body.bootId);
          process.exit(0);
        }
      }
    }
  } catch {
    /* retry */
  }
  await new Promise((r) => setTimeout(r, 500));
}

console.error('[start-api] Timed out waiting for API');
child.kill();
process.exit(1);
