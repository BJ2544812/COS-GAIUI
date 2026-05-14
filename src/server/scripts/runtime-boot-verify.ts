/**
 * Runtime boot verification: health, login, and GETs that mirror visible module data loads.
 * Requires API already listening (e.g. npm run dev:server). Run: npm run verify:runtime
 */
import '../utils/loadEnv.ts';
import { prisma } from '../utils/prisma.js';

const API = (process.env.RUNTIME_VERIFY_API_BASE || 'http://localhost:4002/api/v1').replace(/\/$/, '');
const UI = (process.env.RUNTIME_VERIFY_UI_BASE || 'http://localhost:3001').replace(/\/$/, '');

async function resolveTenantId(): Promise<string> {
  const fromEnv = process.env.VITE_TENANT_ID?.trim() || process.env.E2E_TENANT_ID?.trim();
  if (fromEnv) return fromEnv;
  const admin = await prisma.user.findFirst({
    where: { username: 'admin' },
    select: { tenantId: true },
  });
  if (!admin?.tenantId) {
    throw new Error('No admin user in DB — seed (e.g. npx tsx src/server/seed.ts) and set VITE_TENANT_ID if needed.');
  }
  return admin.tenantId;
}

async function http(
  method: string,
  url: string,
  headers: Record<string, string>,
  body?: unknown,
): Promise<{ ok: boolean; status: number; snippet: string }> {
  const h = new Headers(headers);
  const init: RequestInit = { method, headers: h };
  if (body !== undefined) {
    if (!h.has('Content-Type')) h.set('Content-Type', 'application/json');
    init.body = JSON.stringify(body);
  }
  const res = await fetch(url, init);
  const text = await res.text();
  const snippet = text.slice(0, 200).replace(/\s+/g, ' ');
  return { ok: res.ok, status: res.status, snippet };
}

async function main() {
  const results: { step: string; ok: boolean; detail: string }[] = [];

  const healthUrl = 'http://localhost:4002/health';
  const health = await http('GET', healthUrl, {});
  results.push({
    step: 'GET /health',
    ok: health.ok,
    detail: `${health.status} ${health.snippet}`,
  });
  if (!health.ok) {
    console.error(JSON.stringify(results, null, 2));
    process.exit(1);
  }

  const tenantId = await resolveTenantId();

  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const loginText = await loginRes.text();
  results.push({
    step: 'POST /auth/login',
    ok: loginRes.ok,
    detail: `${loginRes.status} ${loginText.slice(0, 200)}`,
  });
  if (!loginRes.ok) {
    console.error(JSON.stringify(results, null, 2));
    process.exit(1);
  }
  const loginJson = JSON.parse(loginText) as { token?: string };
  const token = typeof loginJson.token === 'string' ? loginJson.token : null;
  if (!token) {
    results.push({ step: 'parse login token', ok: false, detail: loginText.slice(0, 300) });
    console.error(JSON.stringify(results, null, 2));
    process.exit(1);
  }

  const auth = () => ({
    Authorization: `Bearer ${token}`,
    'x-tenant-id': tenantId,
  });

  const checks: { step: string; path: string }[] = [
    { step: 'auth/me (session)', path: '/auth/me' },
    { step: 'Dashboard: analytics/members', path: '/analytics/members' },
    { step: 'Dashboard: analytics/financial', path: '/analytics/financial' },
    { step: 'Dashboard: events', path: '/events' },
    { step: 'Dashboard: tasks/my-tasks', path: '/discipleship/v2/tasks/my-tasks' },
    { step: 'Members', path: '/members?limit=5' },
    { step: 'Families', path: '/families' },
    { step: 'Volunteers (members list)', path: '/members?limit=5' },
    { step: 'Small groups', path: '/structure/small-groups' },
    { step: 'Pathways (structure)', path: '/structure/pathways' },
    { step: 'Shepherd: care-cases', path: '/discipleship/v2/care-cases' },
    { step: 'Events', path: '/events' },
    { step: 'Attendance sessions', path: '/attendance/sessions' },
    { step: 'Worship (events list)', path: '/events' },
    { step: 'Outreach', path: '/outreach' },
    { step: 'Structure campuses', path: '/structure/campuses' },
    { step: 'Giving campaigns', path: '/giving/campaigns' },
    { step: 'Accounting accounts', path: '/finance/accounts' },
    { step: 'Assets', path: '/assets' },
    { step: 'Documents', path: '/documents' },
    { step: 'Sermons', path: '/website/sermons' },
    { step: 'Website pages', path: '/website/pages' },
    { step: 'Notifications', path: '/notifications' },
    { step: 'Analytics attendance', path: '/analytics/attendance' },
    { step: 'Event queue', path: '/admin/events' },
    { step: 'Settings', path: '/settings' },
    { step: 'Permissions roles', path: '/permissions/roles' },
  ];

  for (const c of checks) {
    const r = await http('GET', `${API}${c.path}`, auth());
    results.push({ step: c.step, ok: r.ok, detail: `${r.status} ${r.snippet}` });
    if (!r.ok) {
      console.error('FAILED:', c.step, r.status, r.snippet);
    }
  }

  const uiGet = await http('GET', `${UI}/`, {});
  results.push({ step: `GET UI ${UI}/`, ok: uiGet.ok, detail: `${uiGet.status}` });

  const failed = results.filter((x) => !x.ok);
  console.log(JSON.stringify({ tenantId, passed: failed.length === 0, results }, null, 2));
  if (failed.length) process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
