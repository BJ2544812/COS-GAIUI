#!/usr/bin/env node
/**
 * Production deployment orchestration with runtime alignment guards.
 * Usage: npm run deploy:production
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const projectRoot = path.join(root, '..');

function run(cmd, args, label) {
  console.log(`\n[deploy] ${label}: ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) {
    console.error(`[deploy] FAILED: ${label}`);
    process.exit(r.status ?? 1);
  }
}

console.log('[deploy] Kingdom Church OS — production deployment (v1 runtime aligned)');

if (!process.env.SKIP_RUNTIME_CLEAN) {
  run('node', ['scripts/runtime-cleanup.mjs'], 'Runtime cleanup');
}

run('npm', ['run', 'db:migrate'], 'Database migrations (required for V1 models)');
run('npx', ['prisma', 'generate'], 'Prisma client');
console.log('\n[deploy] After migrations, restart API if it was already running (npm run dev:server:fresh).');

if (!process.env.SKIP_BUILD) {
  run('npm', ['run', 'build'], 'Frontend build');
}

const port = process.env.PORT || '4002';
const healthUrl = process.env.HEALTH_URL || `http://127.0.0.1:${port}/health`;
const routesUrl = process.env.ROUTES_HEALTH_URL || `http://127.0.0.1:${port}/health/routes`;

console.log('\n[deploy] Start API with current code: npm run dev:server:fresh');
run('node', ['scripts/wait-for-health.mjs', healthUrl], 'Health check');
run('node', ['scripts/wait-for-health.mjs', routesUrl], 'V1 route table (/health/routes)');

if (!process.env.SKIP_VERIFY) {
  run('npm', ['run', 'verify:v1'], 'V1 runtime verification');
  run('npm', ['run', 'report:runtime'], 'Runtime activation report');
}

console.log('\n[deploy] Deployment steps completed successfully.');
