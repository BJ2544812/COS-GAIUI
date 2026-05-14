/**
 * API smoke test against a running server + DATABASE_URL (Prisma).
 *
 * Usage (from repo root, with Postgres + server env configured):
 *   npm run test:e2e
 *
 * Requires: server listening (default http://localhost:4002), seeded admin (admin / admin123),
 * chart of accounts (scripts/seed.ts or seed_full.ts).
 */
import { prisma } from '../utils/prisma.js';

const API_BASE =
  process.env.E2E_API_BASE_URL?.replace(/\/$/, '') ||
  process.env.VITE_API_BASE_URL?.replace(/\/$/, '') ||
  `http://localhost:${process.env.PORT || 4002}/api/v1`;

async function resolveTenantId(): Promise<string> {
  const envId = process.env.E2E_TENANT_ID?.trim();
  if (envId) return envId;
  const admin = await prisma.user.findFirst({
    where: { username: 'admin' },
    select: { tenantId: true },
  });
  if (!admin?.tenantId) {
    throw new Error(
      'No admin user found. Seed the DB (e.g. npx tsx src/server/seed.ts or npx tsx src/server/scripts/seed.ts) and set DATABASE_URL.',
    );
  }
  return admin.tenantId;
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOrThrow(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Cannot reach ${url} (${msg}). Start the API server (e.g. npm run dev:server), check PORT / E2E_API_BASE_URL, and ensure CORS/network allows this host.`,
    );
  }
}

async function runE2ETests() {
  console.log('Starting API smoke tests...\n');
  console.log(`API_BASE: ${API_BASE}\n`);

  const tenantId = await resolveTenantId();
  console.log(`Tenant: ${tenantId}\n`);

  // 1. Login
  console.log('1. Authentication...');
  const loginRes = await fetchOrThrow(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-tenant-id': tenantId,
    },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const loginBody = (await readJson(loginRes)) as Record<string, unknown> | null;
  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginRes.status} — ${JSON.stringify(loginBody)}`);
  }
  const token = typeof loginBody?.token === 'string' ? loginBody.token : null;
  if (!token) throw new Error('Login response missing token');
  console.log('   OK\n');

  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,
    Authorization: `Bearer ${token}`,
  };

  // 2. Member
  console.log('2. Member create...');
  const memberRes = await fetchOrThrow(`${API_BASE}/members`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'E2E Test Member',
      email: `e2e-${Date.now()}@test.com`,
      growthStage: 'Visitor',
    }),
  });
  const memberBody = (await readJson(memberRes)) as { data?: { id?: string }; error?: unknown };
  if (!memberRes.ok) throw new Error(`Member create failed: ${memberRes.status} — ${JSON.stringify(memberBody)}`);
  const memberId = memberBody.data?.id;
  if (!memberId) throw new Error('Member response missing data.id');
  console.log('   OK', memberId, '\n');

  console.log('2b. Structure pathways (read)...');
  const pwRes = await fetchOrThrow(`${API_BASE}/structure/pathways`, {
    method: 'GET',
    headers: authHeaders,
  });
  const pwBody = await readJson(pwRes);
  if (!pwRes.ok) {
    throw new Error(`Pathways list failed: ${pwRes.status} — ${JSON.stringify(pwBody)}`);
  }
  console.log('   OK\n');

  // 3. Event
  console.log('3. Event create...');
  const eventRes = await fetchOrThrow(`${API_BASE}/events`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'E2E Test Event',
      type: 'Special',
      date: new Date().toISOString(),
    }),
  });
  const eventBody = (await readJson(eventRes)) as { data?: { id?: string } };
  if (!eventRes.ok) throw new Error(`Event create failed: ${eventRes.status} — ${JSON.stringify(eventBody)}`);
  const eventId = eventBody.data?.id;
  if (!eventId) throw new Error('Event response missing data.id');
  console.log('   OK', eventId, '\n');

  // 4. Attendance session + record
  console.log('4. Attendance session + record...');
  const sessionRes = await fetchOrThrow(`${API_BASE}/attendance/sessions`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: 'E2E Service',
      date: new Date().toISOString(),
      eventId,
      type: 'EVENT',
      status: 'OPEN',
    }),
  });
  const sessionBody = (await readJson(sessionRes)) as { data?: { id?: string }; error?: unknown };
  if (!sessionRes.ok) {
    throw new Error(`Attendance session failed: ${sessionRes.status} — ${JSON.stringify(sessionBody)}`);
  }
  const sessionId = sessionBody.data?.id;
  if (!sessionId) throw new Error('Attendance session missing data.id');

  const recordRes = await fetchOrThrow(`${API_BASE}/attendance/sessions/${sessionId}/records`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ memberId, status: 'PRESENT', method: 'MANUAL' }),
  });
  const recordBody = await readJson(recordRes);
  if (!recordRes.ok) {
    throw new Error(`Attendance record failed: ${recordRes.status} — ${JSON.stringify(recordBody)}`);
  }
  console.log('   OK\n');

  // 5. Giving + ledger
  console.log('5. Giving donation + ledger...');
  const bankAccount =
    (await prisma.account.findFirst({ where: { tenantId, code: '1020' } })) ||
    (await prisma.account.findFirst({ where: { tenantId, type: 'Asset' }, orderBy: { code: 'asc' } }));
  const titheAccount =
    (await prisma.account.findFirst({ where: { tenantId, code: '3010' } })) ||
    (await prisma.account.findFirst({ where: { tenantId, type: 'Revenue' }, orderBy: { code: 'asc' } }));
  if (!bankAccount || !titheAccount) {
    throw new Error('No accounts found for tenant — run scripts/seed or seed_full after migrations.');
  }

  const before = Number(bankAccount.balance);
  const givingRes = await fetchOrThrow(`${API_BASE}/giving/donations`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      amount: 250,
      method: 'Bank Transfer',
      reference: `E2E-TXN-${Date.now()}`,
      debitAccountId: bankAccount.id,
      creditAccountId: titheAccount.id,
    }),
  });
  const givingBody = await readJson(givingRes);
  if (!givingRes.ok) {
    throw new Error(`Donation failed: ${givingRes.status} — ${JSON.stringify(givingBody)}`);
  }
  await delay(200);
  const updatedBank = await prisma.account.findUnique({ where: { id: bankAccount.id } });
  const after = Number(updatedBank?.balance);
  if (after === before) {
    throw new Error('Bank account balance did not change after donation (ledger may not have posted).');
  }
  console.log('   OK (bank balance changed)\n');

  console.log('All smoke tests passed.');
}

runE2ETests()
  .catch((e: Error) => {
    console.error('\nSmoke tests failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
