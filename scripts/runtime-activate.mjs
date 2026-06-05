#!/usr/bin/env node
/**
 * Full runtime activation: clean ports → start API → verify:v1 → report.
 * Usage: npm run runtime:activate
 */
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = process.env.PORT || '4002';
const routesUrl = `http://127.0.0.1:${port}/health/routes`;
const deadline = Date.now() + Number(process.env.API_START_WAIT_MS || 180_000);

spawnSync('node', ['scripts/runtime-cleanup.mjs'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
spawnSync('npx', ['prisma', 'generate'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });

console.log('[activate] Starting API (dev:server)...');
const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev:server'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, SKIP_ROUTE_VERIFY: '0' },
});

child.on('exit', (code) => {
  if (code && code !== 0) process.exit(code);
});

console.log('[activate] Waiting for route table', routesUrl);

while (Date.now() < deadline) {
  try {
    const res = await fetch(routesUrl, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const body = await res.json();
      if (body.status === 'ready') {
        console.log('[activate] Routes ready — running verify:v1');
        const v1 = spawnSync('npm', ['run', 'verify:v1'], {
          cwd: root,
          stdio: 'inherit',
          shell: process.platform === 'win32',
        });
        spawnSync('npm', ['run', 'report:runtime'], {
          cwd: root,
          stdio: 'inherit',
          shell: process.platform === 'win32',
        });
        child.kill();
        process.exit(v1.status ?? 0);
      }
    }
  } catch {
    /* retry */
  }
  await new Promise((r) => setTimeout(r, 800));
}

console.error('[activate] Timed out waiting for V1 routes');
child.kill();
process.exit(1);
