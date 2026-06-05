/**
 * Post go-live stabilization verification.
 * Run with API up: npm run verify:stabilization
 */
import '../utils/loadEnv.ts';
import { prisma } from '../utils/prisma.js';

const API = (process.env.STABILIZATION_API_BASE || 'http://127.0.0.1:4002/api/v1').replace(/\/$/, '');
const HEALTH = process.env.STABILIZATION_HEALTH_URL || 'http://127.0.0.1:4002/health';

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
  console.log('[stabilization] Real-world readiness checks\n');

  const h = await fetch(HEALTH);
  if (h.ok) pass('Health');
  else fail('Health', String(h.status));

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
    fail('Tenant');
    process.exit(1);
  }

  const login = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
    body: JSON.stringify({
      username: process.env.STABILIZATION_USER || 'admin',
      password: process.env.STABILIZATION_PASS || 'admin123',
    }),
  });
  const loginJson = (await login.json()) as { token?: string; tenantId?: string };
  if (!login.ok || !loginJson.token) {
    fail('Login');
    process.exit(1);
  }
  pass('Login');
  if (loginJson.tenantId === tenantId) pass('Login returns tenantId');
  else fail('Login tenantId', `${loginJson.tenantId} vs ${tenantId}`);

  for (const demoUser of ['pastor', 'finance', 'worship', 'events']) {
    const demoLogin = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
      body: JSON.stringify({
        username: demoUser,
        password: process.env.DEMO_ROLE_PASSWORD || 'demo123',
      }),
    });
    const demoJson = (await demoLogin.json()) as { token?: string; tenantId?: string };
    if (demoLogin.ok && demoJson.token && demoJson.tenantId === tenantId) {
      pass(`Demo role login: ${demoUser}`);
    } else {
      fail(`Demo role login: ${demoUser}`, `Run npm run seed:demo-roles — status ${demoLogin.status}`);
    }
  }

  const headers = {
    Authorization: `Bearer ${loginJson.token}`,
    'x-tenant-id': tenantId,
  };

  const cc = await fetch(`${API}/operations/command-center`, { headers });
  if (cc.ok) pass('Command center');
  else fail('Command center', String(cc.status));

  const campus = await prisma.campus.findFirst({
    where: { tenantId },
    select: { id: true },
  });
  if (campus?.id) {
    const ccCampus = await fetch(
      `${API}/operations/command-center?campusId=${encodeURIComponent(campus.id)}`,
      { headers },
    );
    if (ccCampus.ok) pass('Command center campus filter');
    else fail('Command center campus filter', String(ccCampus.status));
  } else {
    pass('Command center campus filter (skipped — no campuses)');
  }

  const events = await fetch(`${API}/events`, { headers });
  if (events.ok) pass('Events list (Sunday simulation path)');
  else fail('Events', String(events.status));

  const portal = await fetch(`${API}/member-portal/summary`, { headers });
  if (portal.ok) pass('Member portal summary');
  else fail('Member portal', String(portal.status));

  const publicSettings = await fetch(`${API}/website/public/settings`, {
    headers: { 'x-tenant-id': tenantId },
  });
  if (publicSettings.status < 500) pass('Public website settings');
  else fail('Public website', String(publicSettings.status));

  const replay = await fetch(`${API}/platform/workflows/replay-failed`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (replay.ok || replay.status === 400) pass('Workflow replay endpoint');
  else fail('Workflow replay', String(replay.status));

  console.log(`\n[stabilization] ${passes.length} passed, ${failures.length} failed`);
  if (failures.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
