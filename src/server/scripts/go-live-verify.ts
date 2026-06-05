/**
 * Go-live hardening verification — production readiness gates.
 * Requires API listening. Run: npm run verify:go-live
 */
import '../utils/loadEnv.ts';
import { prisma } from '../utils/prisma.js';

function normalizeApiBase(url: string): string {
  const u = url.replace(/\/$/, '');
  if (/\/api$/i.test(u)) return `${u}/v1`;
  if (!/\/api\//i.test(u)) return `${u}/api/v1`;
  return u;
}

const API = normalizeApiBase(process.env.GO_LIVE_VERIFY_API_BASE || 'http://127.0.0.1:4002/api/v1');
const failures: string[] = [];
const passes: string[] = [];

function pass(label: string) {
  passes.push(label);
  console.log(`  ✓ ${label}`);
}

function fail(label: string, detail?: string) {
  const msg = detail ? `${label}: ${detail}` : label;
  failures.push(msg);
  console.error(`  ✗ ${msg}`);
}

async function http(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: unknown,
): Promise<{ ok: boolean; status: number; json?: unknown }> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    json = undefined;
  }
  return { ok: res.ok, status: res.status, json };
}

async function resolveTenantAndToken(): Promise<{ tenantId: string; token: string }> {
  const tenantId =
    process.env.TENANT_ID?.trim() ||
    process.env.VITE_TENANT_ID?.trim() ||
    (
      await prisma.user.findFirst({
        where: { username: 'admin' },
        select: { tenantId: true },
        orderBy: { createdAt: 'asc' },
      })
    )?.tenantId;

  if (!tenantId) throw new Error('No tenant — seed database first.');

  const login = await http('POST', '/auth/login', { 'x-tenant-id': tenantId }, {
    username: process.env.GO_LIVE_USER || 'admin',
    password: process.env.GO_LIVE_PASS || 'admin123',
  });

  const token = (login.json as { token?: string })?.token;
  if (!token) throw new Error(`Login failed (${login.status})`);
  return { tenantId, token };
}

async function main() {
  console.log('[go-live] Verifying production readiness at', API);

  const healthUrl = process.env.GO_LIVE_HEALTH_URL || 'http://127.0.0.1:4002/health';
  const h = await fetch(healthUrl);
  if (h.ok) {
    const body = (await h.json()) as { database?: string };
    pass(`Health endpoint (${body.database ?? 'unknown'} DB)`);
  } else {
    fail('Health endpoint', String(h.status));
  }

  const setup = await http('GET', '/deploy/setup-status');
  if (setup.ok) pass('Deploy setup-status');
  else fail('Deploy setup-status', String(setup.status));

  const version = await http('GET', '/deploy/version');
  if (version.ok) pass('Deploy version metadata');
  else fail('Deploy version', String(version.status));

  let tenantId: string;
  let token: string;
  try {
    ({ tenantId, token } = await resolveTenantAndToken());
    pass('Staff authentication');
  } catch (e) {
    fail('Staff authentication', e instanceof Error ? e.message : String(e));
    printSummary();
    process.exit(1);
  }

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'x-tenant-id': tenantId,
  };

  const incidents = await http('GET', '/platform/incidents', authHeaders);
  if (incidents.ok) {
    const data = (incidents.json as { data?: { summary?: unknown } })?.data;
    pass(`Incident panel API${data?.summary ? '' : ' (empty summary)'}`);
  } else {
    fail('Incident panel API', String(incidents.status));
  }

  const queue = await http('GET', '/platform/queue-metrics', authHeaders);
  if (queue.ok) pass('Queue metrics API');
  else fail('Queue metrics API', String(queue.status));

  const infra = await http('GET', '/deploy/infrastructure', authHeaders);
  if (infra.ok) pass('Infrastructure validation');
  else fail('Infrastructure validation', String(infra.status));

  const cc = await http('GET', '/operations/command-center', authHeaders);
  if (cc.ok) pass('Command center (cached ops path)');
  else fail('Command center', String(cc.status));

  if (!process.env.JWT_SECRET?.trim() && process.env.NODE_ENV === 'production') {
    fail('JWT_SECRET required in production');
  } else {
    pass('JWT configuration');
  }

  if (!process.env.DATABASE_URL?.trim()) {
    fail('DATABASE_URL missing');
  } else {
    pass('DATABASE_URL configured');
  }

  printSummary();
  process.exit(failures.length > 0 ? 1 : 0);
}

function printSummary() {
  console.log(`\n[go-live] ${passes.length} passed, ${failures.length} failed`);
  if (failures.length) {
    console.error('[go-live] Failures:\n', failures.map((f) => `  - ${f}`).join('\n'));
  }
}

main().catch((e) => {
  console.error('[go-live] Fatal:', e);
  process.exit(1);
});
