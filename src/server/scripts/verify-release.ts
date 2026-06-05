/**
 * Release candidate validation gate.
 * Run: npm run verify:release (API must be listening)
 */
import '../utils/loadEnv.ts';
import { prisma } from '../utils/prisma.js';

const API = (process.env.RELEASE_VERIFY_API_BASE || 'http://127.0.0.1:4002/api/v1').replace(/\/$/, '');
const failures: string[] = [];
const passes: string[] = [];

function pass(s: string) {
  passes.push(s);
  console.log(`  ✓ ${s}`);
}
function fail(s: string, d?: string) {
  failures.push(d ? `${s}: ${d}` : s);
  console.error(`  ✗ ${s}${d ? ` — ${d}` : ''}`);
}

async function main() {
  console.log('[release] RC validation\n');

  const h = await fetch(process.env.RELEASE_HEALTH_URL || 'http://127.0.0.1:4002/health');
  if (h.ok) pass('Health');
  else fail('Health', String(h.status));

  const tenantId =
    process.env.TENANT_ID?.trim() ||
    (await prisma.user.findFirst({ where: { username: 'admin' }, select: { tenantId: true } }))?.tenantId;
  if (!tenantId) {
    fail('Tenant');
    process.exit(1);
  }

  const login = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const { token } = (await login.json()) as { token?: string };
  if (!token) {
    fail('Login');
    process.exit(1);
  }
  pass('Login');

  const headers = { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId };

  const checks: [string, string][] = [
    ['Deploy license', '/deploy/license'],
    ['Deploy maintenance', '/deploy/maintenance'],
    ['Global search', '/platform/search?q=test'],
    ['Operator diagnostics', '/platform/operator/diagnostics'],
    ['Integrations registry', '/platform/integrations'],
    ['Command center', '/operations/command-center'],
    ['Communication hub', '/communication/hub'],
    ['Outreach dashboard', '/outreach/dashboard'],
    ['Member portal', '/member-portal/summary'],
    ['Incidents', '/platform/incidents'],
  ];

  for (const [label, path] of checks) {
    const r = await fetch(`${API}${path}`, { headers });
    if (r.ok) pass(label);
    else fail(label, String(r.status));
  }

  const search = await fetch(`${API}/platform/search?q=ser`, { headers });
  if (search.ok) {
    const body = (await search.json()) as { data?: Record<string, unknown> };
    const d = body.data ?? {};
    if ('volunteers' in d && 'prayers' in d && 'workflows' in d) pass('Expanded search shape');
    else fail('Expanded search shape');
  }

  console.log(`\n[release] ${passes.length} passed, ${failures.length} failed`);
  process.exit(failures.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
