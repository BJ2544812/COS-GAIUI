/**
 * Runtime boot verification: health, login, and GETs that mirror visible module data loads.
 * Requires API already listening (e.g. npm run dev:server). Run: npm run verify:runtime
 */
import '../utils/loadEnv.ts';
import { prisma } from '../utils/prisma.js';
import fs from 'node:fs';
import path from 'node:path';

function normalizeVerifyApiBase(url: string): string {
  const u = url.replace(/\/$/, '');
  if (/\/api$/i.test(u)) return `${u}/v1`;
  if (!/\/api\//i.test(u)) return `${u}/api/v1`;
  return u;
}
const API = normalizeVerifyApiBase(process.env.RUNTIME_VERIFY_API_BASE || 'http://127.0.0.1:4002/api/v1');
const UI = (process.env.RUNTIME_VERIFY_UI_BASE || 'http://127.0.0.1:3001').replace(/\/$/, '');

type CountRow = { label: string; count: number };
type PlaceholderSurface = { module: string; file: string };

function discoverPlaceholderSurfaces(): PlaceholderSurface[] {
  const modulesDir = path.resolve(process.cwd(), 'src', 'modules');
  if (!fs.existsSync(modulesDir)) return [];

  const out: PlaceholderSurface[] = [];
  const stack = [modulesDir];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(current, e.name);
      if (e.isDirectory()) {
        stack.push(abs);
        continue;
      }
      if (!e.isFile() || !e.name.endsWith('Module.tsx')) continue;
      const body = fs.readFileSync(abs, 'utf8');
      if (!body.includes('PlaceholderModule')) continue;
      const rel = path.relative(process.cwd(), abs).replace(/\\/g, '/');
      out.push({
        file: rel,
        module: e.name.replace(/Module\.tsx$/, ''),
      });
    }
  }
  return out.sort((a, b) => a.file.localeCompare(b.file));
}

function loopbackFallback(url: string): string | null {
  if (url.includes('127.0.0.1')) return url.replace('127.0.0.1', 'localhost');
  if (url.includes('localhost')) return url.replace('localhost', '127.0.0.1');
  return null;
}

async function resolveTenantId(): Promise<string> {
  const fromEnv =
    process.env.TENANT_ID?.trim() ||
    process.env.VITE_TENANT_ID?.trim() ||
    process.env.E2E_TENANT_ID?.trim();
  if (fromEnv) return fromEnv;
  const admin = await prisma.user.findFirst({
    where: { username: 'admin' },
    select: { tenantId: true },
    orderBy: { createdAt: 'asc' },
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
  const warnings: string[] = [];

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

  const meRes = await fetch(`${API}/auth/me`, { headers: auth() });
  if (meRes.ok) {
    const meJson = (await meRes.json()) as { user?: { tenantId?: string } };
    const authTenant = meJson.user?.tenantId?.trim();
    if (authTenant && authTenant !== tenantId) {
      warnings.push(
        `Tenant mismatch: login requested tenant "${tenantId}" but auth/me resolved "${authTenant}".`,
      );
    }
  }

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
    { step: 'Finance document registry', path: '/finance/documents/registry?limit=5&docType=all' },
    { step: 'Finance receipts list', path: '/finance/receipts?limit=5' },
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

  // Deep tenant safety check: permission roles payload must not include foreign tenant rows.
  try {
    const rolesRes = await fetch(`${API}/permissions/roles`, { headers: auth() });
    if (rolesRes.ok) {
      const rolesPayload = (await rolesRes.json()) as {
        status?: string;
        data?: Array<{ tenantId?: string | null; id?: string; name?: string }>;
      };
      const roles = Array.isArray(rolesPayload.data) ? rolesPayload.data : [];
      const leakedRoles = roles.filter(
        (r) => r.tenantId != null && String(r.tenantId).trim() !== tenantId,
      );
      if (leakedRoles.length > 0) {
        warnings.push(
          `Permissions roles payload contains ${leakedRoles.length} foreign-tenant row(s): ${leakedRoles
            .map((r) => `${r.name ?? r.id}@${r.tenantId}`)
            .join(', ')}`,
        );
      }
    } else {
      warnings.push(`Permissions role integrity check skipped: /permissions/roles returned ${rolesRes.status}.`);
    }
  } catch (err) {
    warnings.push(`Permissions role integrity check failed to execute: ${String(err)}`);
  }

  let uiGet: { ok: boolean; status: number; snippet: string } | null = null;
  let uiBaseUsed = UI;
  try {
    uiGet = await http('GET', `${UI}/`, {});
  } catch (err) {
    const fallback = loopbackFallback(UI);
    if (!fallback) throw err;
    uiBaseUsed = fallback;
    uiGet = await http('GET', `${fallback}/`, {});
    warnings.push(`UI base ${UI} unreachable; fell back to ${fallback}.`);
  }
  results.push({ step: `GET UI ${uiBaseUsed}/`, ok: uiGet.ok, detail: `${uiGet.status}` });

  const [memberCount, familyCount, eventCount, attendanceCount, donationCount, sermonCount] = await Promise.all([
    prisma.member.count({ where: { tenantId } }),
    prisma.family.count({ where: { tenantId } }),
    prisma.event.count({ where: { tenantId } }),
    prisma.attendance.count({ where: { tenantId } }),
    prisma.donation.count({ where: { tenantId } }),
    prisma.sermon.count({ where: { tenantId } }),
  ]);
  const dataCompleteness: CountRow[] = [
    { label: 'members', count: memberCount },
    { label: 'families', count: familyCount },
    { label: 'events', count: eventCount },
    { label: 'attendance', count: attendanceCount },
    { label: 'donations', count: donationCount },
    { label: 'sermons', count: sermonCount },
  ];
  if (memberCount === 0) warnings.push('No members found for tenant.');
  if (eventCount === 0) warnings.push('No events found for tenant.');
  if (donationCount === 0) warnings.push('No donations found for tenant.');

  const [roleTenantDriftRows, orphanCareNotesRows, duplicateEmailsRows] = await Promise.all([
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "User" u
      JOIN "Role" r ON r.id = u."roleId"
      WHERE u."tenantId" = ${tenantId}
        AND r."tenantId" IS NOT NULL
        AND r."tenantId" <> u."tenantId"
    `,
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "CareNote" cn
      LEFT JOIN "User" u ON u.id = cn."authorId"
      WHERE cn."tenantId" = ${tenantId}
        AND u.id IS NULL
    `,
    prisma.$queryRaw<{ duplicates: bigint }[]>`
      SELECT COUNT(*)::bigint AS duplicates
      FROM (
        SELECT lower(trim(email)) AS normalized_email
        FROM "Member"
        WHERE "tenantId" = ${tenantId}
          AND email IS NOT NULL
          AND trim(email) <> ''
        GROUP BY lower(trim(email))
        HAVING COUNT(*) > 1
      ) d
    `,
  ]);

  const roleTenantDrift = Number(roleTenantDriftRows[0]?.count ?? 0n);
  const orphanCareNotes = Number(orphanCareNotesRows[0]?.count ?? 0n);
  const duplicateMemberEmailBuckets = Number(duplicateEmailsRows[0]?.duplicates ?? 0n);

  if (roleTenantDrift > 0) {
    warnings.push(`Found ${roleTenantDrift} user->role tenant mismatch row(s).`);
  }
  if (orphanCareNotes > 0) {
    warnings.push(`Found ${orphanCareNotes} care notes with missing author user.`);
  }
  if (duplicateMemberEmailBuckets > 0) {
    warnings.push(`Found ${duplicateMemberEmailBuckets} duplicate member email bucket(s).`);
  }

  const placeholderSurfaces = discoverPlaceholderSurfaces();

  const failed = results.filter((x) => !x.ok);
  console.log(
    JSON.stringify(
      {
        tenantId,
        passed: failed.length === 0,
        warnings,
        results,
        dataCompleteness,
        integrity: {
          roleTenantDrift,
          orphanCareNotes,
          duplicateMemberEmailBuckets,
        },
        placeholderSurfaces,
      },
      null,
      2,
    ),
  );
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
