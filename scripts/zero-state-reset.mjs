#!/usr/bin/env node
/**
 * Absolute-zero church install simulation prep:
 * - stop stale dev processes
 * - wipe local uploads
 * - reset database + migrations
 * - regenerate Prisma client + seed
 *
 * Usage: npm run zero-state:reset
 * Requires: DATABASE_URL (Postgres), same as dev:server
 */
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function run(cmd, opts = {}) {
  console.log(`\n[zero-state] $ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: 'inherit', shell: true, ...opts });
}

function clearDirContents(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return;
  }
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    fs.rmSync(p, { recursive: true, force: true });
  }
}

console.log('[zero-state] Phase 1 — runtime cleanup');
spawnSync('node', ['scripts/runtime-cleanup.mjs'], { cwd: root, stdio: 'inherit', shell: true });

console.log('[zero-state] Phase 1.3 — clear uploads/');
clearDirContents(path.join(root, 'uploads'));

const skipDb = process.argv.includes('--skip-db');
if (!skipDb) {
  console.log('[zero-state] Phase 1.2 — drop public schema + baseline from schema.prisma');
  // Migrations are incremental (no base migration); empty DB needs db push first.
  run('npx tsx src/server/scripts/drop-public-schema.ts');
  run('npx prisma db push --accept-data-loss');
  console.log('[zero-state] Baseline migration history (schema already matches prisma/schema.prisma)');
  const migDir = path.join(root, 'prisma', 'migrations');
  const names = fs
    .readdirSync(migDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  for (const name of names) {
    try {
      execSync(`npx prisma migrate resolve --applied ${name}`, {
        cwd: root,
        stdio: 'pipe',
        shell: true,
      });
    } catch {
      /* already resolved */
    }
  }
} else {
  console.log('[zero-state] Skipping DB reset (--skip-db)');
  run('npx prisma migrate deploy');
}

console.log('[zero-state] Prisma generate');
run('npx prisma generate');

if (!skipDb) {
  console.log('[zero-state] Seed dev tenant + admin');
  run('npm run seed');
}

console.log('\n[zero-state] Done. Start fresh stack: npm run dev:server & npm run dev');
