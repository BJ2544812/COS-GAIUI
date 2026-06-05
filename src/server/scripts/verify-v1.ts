/**
 * Version 1.0 authoritative runtime validation gate.
 * Run: npm run verify:v1 (API must be current codebase on port 4002)
 */
import '../utils/loadEnv.ts';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../utils/prisma.js';
import { flattenProbes } from '../utils/routeManifest.js';

function normalizeApiBase(url: string): string {
  const u = url.replace(/\/$/, '');
  if (/\/api$/i.test(u)) return `${u}/v1`;
  if (!/\/api\//i.test(u)) return `${u}/api/v1`;
  return u;
}

const PORT = process.env.PORT || '4002';
const HOST = process.env.V1_VERIFY_HOST || '127.0.0.1';
const API = normalizeApiBase(process.env.V1_VERIFY_API_BASE || `http://${HOST}:${PORT}/api/v1`);
const HEALTH = process.env.V1_HEALTH_URL || `http://${HOST}:${PORT}/health`;
const ROUTES_HEALTH = process.env.V1_ROUTES_HEALTH_URL || `http://${HOST}:${PORT}/health/routes`;
const failures: string[] = [];
const passes: string[] = [];
const warnings: string[] = [];

function pass(s: string) {
  passes.push(s);
  console.log(`  ✓ ${s}`);
}
function fail(s: string, d?: string) {
  failures.push(d ? `${s}: ${d}` : s);
  console.error(`  ✗ ${s}${d ? ` — ${d}` : ''}`);
}
function warn(s: string) {
  warnings.push(s);
  console.warn(`  ⚠ ${s}`);
}

async function http(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: unknown,
): Promise<{ ok: boolean; status: number; json?: unknown; text?: string }> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }
  return { ok: res.ok, status: res.status, json, text };
}

async function main() {
  console.log('[v1] Kingdom Church OS — runtime validation\n');
  console.log(`[v1] Target API: ${API}\n`);

  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as { version?: string };
    if (pkg.version === '1.0.0') pass('Package version 1.0.0');
    else fail('Package version', `expected 1.0.0, got ${pkg.version ?? 'unknown'}`);
  } catch (e) {
    fail('Package version', e instanceof Error ? e.message : String(e));
  }

  const h = await fetch(HEALTH, { signal: AbortSignal.timeout(10_000) });
  if (h.ok) {
    const body = (await h.json()) as { database?: string; version?: string; bootId?: string };
    pass(`Health (${body.database ?? 'ok'}, v${body.version ?? '?'})`);
    if (!body.version || body.version !== '1.0.0') {
      warn(`Health reports version ${body.version ?? 'unknown'} — possible stale API binary`);
    }
  } else {
    fail('Health', String(h.status));
  }

  try {
    const rr = await fetch(ROUTES_HEALTH, { signal: AbortSignal.timeout(15_000) });
    const routesBody = (await rr.json()) as {
      status?: string;
      failures?: string[];
      bootId?: string;
      probes?: Array<{ label: string; ok: boolean; status: number }>;
    };
    if (rr.ok && routesBody.status === 'ready') {
      pass(`Route table ready (boot ${routesBody.bootId ?? '?'})`);
    } else {
      fail(
        'Route table /health/routes',
        routesBody.status ?? String(rr.status),
      );
      for (const f of routesBody.failures ?? []) {
        fail('  route probe', f);
      }
      console.error(
        '\n[v1] STALE RUNTIME DETECTED — run: npm run runtime:clean && npm run dev:server:fresh\n',
      );
    }
  } catch (e) {
    fail('/health/routes', e instanceof Error ? e.message : String(e));
  }

  for (const probe of flattenProbes()) {
    if (!probe.public) continue;
    const r = await http('GET', probe.path);
    if (r.ok) pass(`Public route ${probe.label}`);
    else fail(`Public route ${probe.label}`, String(r.status));
  }

  if (!process.env.DATABASE_URL?.trim()) fail('DATABASE_URL');
  else pass('DATABASE_URL configured');

  if (!process.env.JWT_SECRET?.trim() && process.env.NODE_ENV === 'production') {
    fail('JWT_SECRET required in production');
  } else {
    pass('JWT configuration');
  }

  if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL?.trim()) {
    fail('REDIS_URL required in production');
  } else if (!process.env.REDIS_URL?.trim()) {
    warn('REDIS_URL not set — queue uses sync fallback (dev only)');
  } else {
    pass('Redis configured');
  }

  const tenantId =
    process.env.TENANT_ID?.trim() ||
    (
      await prisma.user.findFirst({
        where: { username: 'admin' },
        select: { tenantId: true },
        orderBy: { createdAt: 'asc' },
      })
    )?.tenantId;

  if (!tenantId) {
    fail('Tenant resolution');
    printSummary();
    process.exit(1);
  }

  const login = await http('POST', '/auth/login', { 'x-tenant-id': tenantId }, {
    username: process.env.V1_VERIFY_USER || 'admin',
    password: process.env.V1_VERIFY_PASS || 'admin123',
  });
  const token = (login.json as { token?: string })?.token;
  if (!token) {
    fail('Staff login (JWT)');
    printSummary();
    process.exit(1);
  }
  pass('Staff login (JWT)');

  const headers = { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId };

  const me = await http('GET', '/auth/me', headers);
  if (me.ok) pass('JWT session /auth/me');
  else fail('JWT session', String(me.status));

  const authenticatedChecks: [string, string][] = [
    ['Deploy infrastructure', '/deploy/infrastructure'],
    ['Deploy license', '/deploy/license'],
    ['Deploy maintenance', '/deploy/maintenance'],
    ['Platform health', '/platform/health'],
    ['Platform incidents', '/platform/incidents'],
    ['Platform queue metrics', '/platform/queue-metrics'],
    ['Command center', '/operations/command-center'],
    ['Operational insights', '/operations/operational-insights'],
    ['Global search', '/platform/search?q=test'],
    ['Operator diagnostics', '/platform/operator/diagnostics'],
    ['Integrations registry', '/platform/integrations'],
    ['Communication hub', '/communication/hub'],
    ['Outreach dashboard', '/outreach/dashboard'],
    ['Care dashboard', '/care/dashboard'],
    ['Member portal summary', '/member-portal/summary'],
    ['Events list', '/events'],
    ['Backup list', '/deploy/backups'],
  ];

  for (const [label, path] of authenticatedChecks) {
    const r = await http('GET', path, headers);
    if (r.ok) pass(label);
    else fail(label, `${r.status}${r.text ? ` ${r.text.slice(0, 80)}` : ''}`);
  }

  const campus = await prisma.campus.findFirst({ where: { tenantId }, select: { id: true } });
  if (campus?.id) {
    const cc = await http('GET', `/operations/command-center?campusId=${encodeURIComponent(campus.id)}`, headers);
    if (cc.ok) pass('Command center campus filter');
    else fail('Command center campus filter', String(cc.status));
  } else {
    pass('Command center campus filter (skipped — no campuses)');
  }

  const search = await http('GET', '/platform/search?q=ser', headers);
  if (search.ok) {
    const d = (search.json as { data?: Record<string, unknown> })?.data ?? {};
    if ('volunteers' in d && 'prayers' in d && 'workflows' in d) pass('Expanded global search contract');
    else fail('Expanded global search contract', 'missing keys');
  } else {
    fail('Expanded global search', String(search.status));
  }

  const integrations = await http('GET', '/platform/integrations', headers);
  if (integrations.ok) {
    const caps = (integrations.json as { data?: Record<string, unknown> })?.data;
    if (caps && typeof caps === 'object' && 'email' in caps && 'sso' in caps) {
      pass('Integration adapter registry contract');
    } else {
      fail('Integration adapter registry', 'unexpected shape');
    }
  }

  const publicSettings = await http('GET', '/website/public/settings', { 'x-tenant-id': tenantId });
  if (publicSettings.status < 500) pass('Public website settings');
  else fail('Public website settings', String(publicSettings.status));

  const replay = await http('POST', '/platform/workflows/replay-failed', headers, {});
  if (replay.ok || replay.status === 400) pass('Workflow replay safety endpoint');
  else fail('Workflow replay', String(replay.status));

  const maintProbe = await http('GET', '/deploy/maintenance', headers);
  if (maintProbe.ok) pass('Maintenance mode API (RBAC)');

  for (const f of ['EVENT_CONTRACTS.md', 'API_CONTRACTS.md']) {
    try {
      readFileSync(join(process.cwd(), f), 'utf8');
      pass(`Contract doc: ${f}`);
    } catch {
      fail(`Contract doc: ${f}`, 'missing');
    }
  }

  printSummary();
  process.exit(failures.length ? 1 : 0);
}

function printSummary() {
  console.log(`\n[v1] ${passes.length} passed, ${warnings.length} warnings, ${failures.length} failed`);
  if (warnings.length) {
    console.warn('[v1] Warnings:\n', warnings.map((w) => `  - ${w}`).join('\n'));
  }
  if (failures.length) {
    console.error('[v1] Failures:\n', failures.map((f) => `  - ${f}`).join('\n'));
    console.error('\n[v1] Fix: npm run runtime:clean && npm run dev:server:fresh && npm run verify:v1\n');
  } else {
    console.log('[v1] Version 1.0 runtime validation: PASSED');
  }
}

main()
  .catch((e) => {
    console.error('[v1] Fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
