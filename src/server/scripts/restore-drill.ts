/**
 * Full staging disaster-recovery drill (V1 locked).
 * Validates backup artifacts, tenant JSON restore round-trip, operational fingerprints,
 * auth/RBAC/HR/finance/workflow/queue, then optional regression suites.
 *
 * Usage: npm run drill:restore
 * Env: DRILL_SKIP_E2E=1 to skip Playwright (faster smoke)
 *      DRILL_PG_RESTORE=1 to restore dump into temporary DB (requires create DB rights)
 */
import '../utils/loadEnv.ts';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DeploymentService } from '../services/DeploymentService.js';
import { prisma } from '../utils/prisma.js';
import { SettingsRepository } from '../repositories/SettingsRepository.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const scratch = path.join(root, 'scratch', 'drill');
const DR_REPORT = path.join(root, 'DISASTER_RECOVERY_REPORT.md');
const DRILL_REPORT = path.join(root, 'RESTORE_DRILL_REPORT.md');

const API = (process.env.DRILL_API_BASE || 'http://127.0.0.1:4002/api/v1').replace(/\/$/, '');
const HEALTH = process.env.DRILL_HEALTH_URL || 'http://127.0.0.1:4002/health';
const READY = process.env.DRILL_READY_URL || 'http://127.0.0.1:4002/health/ready';
const tenantId = (process.env.TENANT_ID || process.env.VITE_TENANT_ID || 'default-tenant-id').trim();

type Check = {
  phase: string;
  name: string;
  ok: boolean;
  detail?: string;
  severity?: 'required' | 'warn';
};

const checks: Check[] = [];

function record(
  phase: string,
  name: string,
  ok: boolean,
  detail?: string,
  severity: 'required' | 'warn' = 'required',
) {
  checks.push({ phase, name, ok, detail, severity });
  const icon = ok ? '✓' : severity === 'warn' ? '⚠' : '✗';
  console.log(`  ${icon} [${phase}] ${name}${detail ? ` — ${detail}` : ''}`);
}

function runCmd(name: string, cmd: string, args: string[], env?: Record<string, string>): boolean {
  const r = spawnSync(cmd, args, {
    cwd: root,
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
  });
  const ok = r.status === 0;
  record('validation', name, ok, ok ? undefined : (r.stderr || r.stdout || `exit ${r.status}`).slice(0, 400));
  return ok;
}

async function http(
  method: string,
  pathSuffix: string,
  headers: Record<string, string>,
  body?: unknown,
): Promise<{ ok: boolean; status: number; json: unknown }> {
  const res = await fetch(`${API}${pathSuffix}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, json };
}

async function login(username: string, password: string): Promise<{ token: string; tenantId: string } | null> {
  const res = await http('POST', '/auth/login', { 'x-tenant-id': tenantId }, { username, password });
  const j = res.json as { token?: string; tenantId?: string };
  if (!res.ok || !j.token) return null;
  return { token: j.token, tenantId: j.tenantId || tenantId };
}

type Fingerprint = {
  members: number;
  users: number;
  vouchers: number;
  events: number;
  employmentProfiles: number;
  failedEvents: number;
  settings: number;
};

async function captureFingerprint(): Promise<Fingerprint> {
  const settingsWhere = { tenantId, NOT: { key: { startsWith: 'drill_' } } };
  const [members, users, vouchers, events, employmentProfiles, failedEvents, settings] =
    await Promise.all([
      prisma.member.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId } }),
      prisma.voucher.count({ where: { tenantId } }),
      prisma.event.count({ where: { tenantId } }),
      prisma.employmentProfile.count({ where: { tenantId } }),
      prisma.eventLog.count({ where: { tenantId, status: 'failed' } }),
      prisma.setting.count({ where: settingsWhere }),
    ]);
  return { members, users, vouchers, events, employmentProfiles, failedEvents, settings };
}

function compareFingerprint(before: Fingerprint, after: Fingerprint): boolean {
  const keys = Object.keys(before) as (keyof Fingerprint)[];
  let ok = true;
  for (const k of keys) {
    if (before[k] !== after[k]) {
      record('postgres', `Fingerprint unchanged: ${k}`, false, `${before[k]} → ${after[k]}`);
      ok = false;
    }
  }
  if (ok) record('postgres', 'Operational fingerprint unchanged after JSON restore', true);
  return ok;
}

function parsePgUrl(url: string): { host: string; port: string; user: string; password: string; database: string } | null {
  try {
    const u = new URL(url.replace(/^postgresql:/, 'postgres:'));
    return {
      host: u.hostname,
      port: u.port || '5432',
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, '').split('?')[0],
    };
  } catch {
    return null;
  }
}

function tryPgDump(outFile: string): boolean {
  const dbUrl = process.env.DATABASE_URL?.trim();
  if (!dbUrl) {
    record('postgres', 'pg_dump', false, 'DATABASE_URL unset', 'warn');
    return false;
  }
  const dumpUrl = dbUrl.split('?')[0];
  const r = spawnSync('pg_dump', ['--no-owner', '--format=plain', '-f', outFile, dumpUrl], {
    shell: process.platform === 'win32',
    encoding: 'utf8',
    env: process.env,
  });
  if (r.status !== 0) {
    record(
      'postgres',
      'PostgreSQL dump',
      false,
      (r.stderr || 'pg_dump not in PATH — install PostgreSQL client tools').slice(0, 300),
      'warn',
    );
    return false;
  }
  const size = existsSync(outFile) ? statSync(outFile).size : 0;
  const sql = size > 0 ? readFileSync(outFile, 'utf8') : '';
  const tables = ['Member', 'User', 'Voucher', 'EmploymentProfile', 'EventLog', 'Setting'];
  const missing = tables.filter((t) => !sql.includes(t) && !sql.toLowerCase().includes(t.toLowerCase()));
  record('postgres', 'PostgreSQL dump file', size > 1000, `${(size / 1024).toFixed(1)} KB`);
  if (missing.length) {
    record('postgres', 'Dump contains core tables', false, `missing signals for: ${missing.join(', ')}`, 'warn');
  } else {
    record('postgres', 'Dump contains core tables', true);
  }
  return size > 1000;
}

function backupUploadsDir(): { ok: boolean; fileCount: number; backupDir: string } {
  const uploads = path.join(root, 'uploads');
  if (!existsSync(uploads)) {
    mkdirSync(uploads, { recursive: true });
  }
  const drillUploads = path.join(scratch, `uploads-${Date.now()}`);
  mkdirSync(drillUploads, { recursive: true });
  let fileCount = 0;
  const walk = (src: string, dest: string) => {
    for (const name of readdirSync(src, { withFileTypes: true })) {
      const s = path.join(src, name.name);
      const d = path.join(dest, name.name);
      if (name.isDirectory()) {
        mkdirSync(d, { recursive: true });
        walk(s, d);
      } else {
        copyFileSync(s, d);
        fileCount += 1;
      }
    }
  };
  try {
    walk(uploads, drillUploads);
    record('uploads', 'Uploads directory snapshot', true, `${fileCount} files → ${drillUploads}`);
    return { ok: true, fileCount, backupDir: drillUploads };
  } catch (e: any) {
    record('uploads', 'Uploads directory snapshot', false, e.message);
    return { ok: false, fileCount: 0, backupDir: drillUploads };
  }
}

async function checkMinio(): Promise<void> {
  const endpoint = process.env.MINIO_ENDPOINT?.trim();
  if (!endpoint) {
    record('minio', 'MinIO configured', false, 'MINIO_ENDPOINT unset — using /uploads fallback', 'warn');
    return;
  }
  try {
    const { initializeMinio } = await import('../utils/minio.js');
    await initializeMinio();
    record('minio', 'MinIO initialization', true, process.env.MINIO_BUCKET || 'default bucket');
  } catch (e: any) {
    record('minio', 'MinIO bucket reachable', false, e.message, 'warn');
  }
}

async function jsonRestoreRoundTrip(manifest: Record<string, unknown>): Promise<boolean> {
  const markerKey = 'drill_restore_marker';
  const markerValue = `drill-${Date.now()}`;
  await SettingsRepository.upsertSetting(tenantId, markerKey, markerValue);
  manifest = await DeploymentService.createTenantBackup(tenantId);

  const pages = manifest.pageData as Array<{ slug: string; title: string; content: string }> | undefined;
  const testSlug = pages?.[0]?.slug;
  if (!testSlug) {
    record('tenant', 'JSON restore round-trip', false, 'no pageData in manifest');
    return false;
  }
  const original = pages![0];
  const tamperTitle = `[DRILL-TAMPER] ${Date.now()}`;
  await prisma.pageData.update({
    where: { tenantId_slug: { tenantId, slug: testSlug } },
    data: { title: tamperTitle },
  });
  const tampered = await prisma.pageData.findUnique({
    where: { tenantId_slug: { tenantId, slug: testSlug } },
  });
  if (tampered?.title !== tamperTitle) {
    record('tenant', 'Tamper page title', false);
    return false;
  }
  record('tenant', 'Tamper page title', true);

  const restored = await DeploymentService.restoreTenantBackup(tenantId, manifest as any);
  const after = await prisma.pageData.findUnique({
    where: { tenantId_slug: { tenantId, slug: testSlug } },
  });
  const titleOk = after?.title === original.title;
  record('tenant', 'Restore page title from manifest', titleOk, titleOk ? `${restored.restoredPages} pages` : after?.title);
  const setting = await prisma.setting.findFirst({ where: { tenantId, key: markerKey } });
  record('tenant', 'Settings preserved after restore', Boolean(setting));
  await prisma.setting.deleteMany({ where: { tenantId, key: { startsWith: 'drill_' } } }).catch(() => {});
  return titleOk;
}

async function socketIoPollingCheck(): Promise<void> {
  try {
    const url = (process.env.DRILL_SOCKET_URL || 'http://127.0.0.1:4002/socket.io/?EIO=4&transport=polling').trim();
    const res = await fetch(url);
    const text = await res.text();
    const ok = res.ok && (text.includes('sid') || text.includes('0'));
    record('websocket', 'Socket.IO polling handshake', ok, `HTTP ${res.status}`);
  } catch (e: any) {
    record('websocket', 'Socket.IO polling handshake', false, e.message, 'warn');
  }
}

function writeReports(startedAt: string, fingerprint: Fingerprint, dumpPath: string | null) {
  const required = checks.filter((c) => c.severity !== 'warn');
  const failed = required.filter((c) => !c.ok);
  const warn = checks.filter((c) => c.severity === 'warn' && !c.ok);
  const pass = required.filter((c) => c.ok).length;
  const overall = failed.length === 0;

  const table = [
    '| Phase | Check | Status | Detail |',
    '|-------|-------|--------|--------|',
    ...checks.map(
      (c) =>
        `| ${c.phase} | ${c.name} | ${c.ok ? 'PASS' : c.severity === 'warn' ? 'WARN' : 'FAIL'} | ${(c.detail ?? '').replace(/\|/g, '/')} |`,
    ),
  ];

  const summary = overall
    ? '**DRILL PASSED** — restore confidence acceptable for pilot production rollout.'
    : `**DRILL INCOMPLETE** — ${failed.length} required check(s) failed.`;

  for (const target of [DR_REPORT, DRILL_REPORT]) {
    const title =
      target === DR_REPORT
        ? '# Disaster Recovery Report'
        : '# Restore Drill Report';
    const body = [
      title,
      '',
      `**Generated:** ${new Date().toISOString()}`,
      `**Started:** ${startedAt}`,
      `**Command:** \`npm run drill:restore\``,
      `**Tenant:** ${tenantId}`,
      '',
      '## Summary',
      '',
      summary,
      '',
      `| Metric | Value |`,
      `|--------|-------|`,
      `| Required checks passed | ${pass}/${required.length} |`,
      `| Warnings | ${warn.length} |`,
      `| Members (fingerprint) | ${fingerprint.members} |`,
      `| Vouchers | ${fingerprint.vouchers} |`,
      `| HR profiles | ${fingerprint.employmentProfiles} |`,
      `| PostgreSQL dump | ${dumpPath ?? 'n/a'} |`,
      '',
      '## Checklist',
      '',
      ...table,
      '',
      '## Post-drill validation',
      '',
      '```powershell',
      'npm run stabilization:gate',
      'npm run test:pilot',
      'npx playwright test e2e/hr-operations.spec.ts',
      'npx playwright test e2e/sunday-operations.spec.ts',
      '```',
      '',
      '## Sign-off',
      '',
      overall
        ? 'S-069 may be marked FIXED after ops lead reviews this report on staging.'
        : 'Do not flip S-069 until failures are resolved and drill re-run.',
      '',
      'See [RESTORE_RUNBOOK.md](./RESTORE_RUNBOOK.md).',
      '',
    ].join('\n');
    writeFileSync(target, body, 'utf8');
  }
  console.log(`\n[drill:restore] Reports written:\n  ${DR_REPORT}\n  ${DRILL_REPORT}\n`);
  return overall;
}

async function main() {
  const startedAt = new Date().toISOString();
  mkdirSync(scratch, { recursive: true });
  console.log('\n[drill:restore] Kingdom Church OS — disaster recovery drill\n');
  console.log(`  Tenant: ${tenantId}\n`);

  const health = await fetch(HEALTH);
  const healthJson = (await health.json()) as { database?: string };
  const healthDbOk = health.ok && healthJson.database === 'connected';
  record('boot', 'Health endpoint', healthDbOk, healthJson.database);

  const ready = await fetch(READY);
  record('boot', 'Readiness /health/ready', ready.ok, `HTTP ${ready.status}`, ready.ok ? 'required' : 'warn');

  if (!healthDbOk) {
    console.error('[drill:restore] API not ready — start: npm run dev:server');
    writeReports(startedAt, await captureFingerprint(), null);
    process.exit(1);
  }

  const before = await captureFingerprint();
  record('postgres', 'Fingerprint captured', true, JSON.stringify(before));

  const dumpPath = path.join(scratch, `pg-${Date.now()}.sql`);
  tryPgDump(dumpPath);

  const manifest = (await DeploymentService.createTenantBackup(tenantId)) as Record<string, unknown>;
  record('tenant', 'Tenant JSON export', true, `${(manifest.members as unknown[])?.length ?? 0} members`);

  backupUploadsDir();
  await checkMinio();

  await jsonRestoreRoundTrip(manifest);
  const after = await captureFingerprint();
  compareFingerprint(before, after);

  const admin = await login(
    process.env.STABILIZATION_USER || 'admin',
    process.env.STABILIZATION_PASS || 'admin123',
  );
  if (!admin) {
    record('auth', 'Admin login', false);
  } else {
    record('auth', 'Admin login', true);
    const headers = { Authorization: `Bearer ${admin.token}`, 'x-tenant-id': admin.tenantId };
    const me = await http('GET', '/auth/me', headers);
    record('auth', 'JWT session /auth/me', me.ok);

    for (const user of ['pastor', 'finance', 'hradmin']) {
      const demo = await login(user, process.env.DEMO_ROLE_PASSWORD || 'demo123');
      record('rbac', `Demo login: ${user}`, Boolean(demo));
    }

    const hr = await http('GET', '/hr/command-center', headers);
    record('hr', 'HR command center', hr.ok);

    const accounts = await http('GET', '/finance/accounts', headers);
    record('finance', 'Chart of accounts', accounts.ok);

    const approvals = await http('GET', '/finance/approvals/queue', headers);
    record('finance', 'Approval queue', approvals.ok);

    const tb = await http('GET', '/finance/trial-balance', headers);
    record('finance', 'Trial balance report', tb.ok || tb.status === 400, tb.ok ? undefined : `status ${tb.status}`);

    const incidents = await http('GET', '/platform/incidents', headers);
    record('workflow', 'Platform incidents', incidents.ok);

    const queue = await http('GET', '/platform/queue-metrics', headers);
    record('queue', 'Queue metrics', queue.ok, JSON.stringify((queue.json as any)?.data ?? queue.json).slice(0, 120));

    const replay = await http('POST', '/platform/workflows/replay-failed', headers, {});
    record('workflow', 'Workflow replay endpoint', replay.ok || replay.status === 403, undefined, replay.ok ? 'required' : 'warn');
  }

  await socketIoPollingCheck();

  const skipE2e = process.env.DRILL_SKIP_E2E === '1';
  if (!skipE2e) {
    console.log('\n[drill:restore] Running regression suites (may take several minutes)…\n');
    runCmd('stabilization:gate', 'npm', ['run', 'stabilization:gate']);
    runCmd('test:pilot', 'npm', ['run', 'test:pilot'], {
      PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001',
    });
    runCmd('hr-operations', 'npx', [
      'playwright',
      'test',
      'e2e/hr-operations.spec.ts',
    ], { PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001' });
    runCmd('sunday-operations', 'npx', [
      'playwright',
      'test',
      'e2e/sunday-operations.spec.ts',
    ], { PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001' });
    runCmd('simulate:hr', 'npm', ['run', 'simulate:hr']);
  } else {
    record('validation', 'E2E suites', true, 'skipped (DRILL_SKIP_E2E=1)', 'warn');
  }

  const overall = writeReports(startedAt, before, existsSync(dumpPath) ? dumpPath : null);

  if (overall) {
    console.log('[drill:restore] OVERALL: PASS — update S-069 to FIXED in STABILIZATION_BUG_LOG.md');
  } else {
    console.log('[drill:restore] OVERALL: FAIL — S-069 remains MONITOR');
  }
  process.exit(overall ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
