/**
 * HR / staff operations capability audit (read-only API probes).
 * Usage: npm run audit:hr
 */
import '../utils/loadEnv.ts';
import { prisma } from '../utils/prisma.js';

const API = (process.env.SIM_API_BASE || 'http://127.0.0.1:4002/api/v1').replace(/\/$/, '');

type Row = { area: string; capability: string; status: 'implemented' | 'partial' | 'missing'; note: string };

const rows: Row[] = [];

function add(area: string, capability: string, status: Row['status'], note: string) {
  rows.push({ area, capability, status, note });
}

async function main() {
  const tenantId =
    process.env.TENANT_ID?.trim() ||
    (
      await prisma.user.findFirst({
        where: { username: 'admin' },
        select: { tenantId: true },
      })
    )?.tenantId;
  if (!tenantId) throw new Error('No tenant');

  const login = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const { token } = (await login.json()) as { token?: string };
  if (!token) throw new Error('Login failed');

  const h = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-tenant-id': tenantId,
  };

  async function probe(method: string, path: string, body?: unknown) {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: h,
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, json: await res.json().catch(() => null) };
  }

  const staffMember = await prisma.member.findFirst({
    where: { tenantId, OR: [{ growthStage: 'Staff' }, { growthStage: 'Leader' }, { workforceClass: 'staff' }] },
    select: { id: true, name: true, workforceClass: true, employmentType: true, department: true },
  });
  add(
    'Staff records',
    'Member workforce fields (workforceClass, employmentType, department)',
    staffMember?.workforceClass || staffMember?.employmentType ? 'implemented' : 'partial',
    staffMember
      ? `Sample: ${staffMember.name} class=${staffMember.workforceClass ?? '—'} type=${staffMember.employmentType ?? '—'}`
      : 'Schema exists; few records populated',
  );

  const userLinked = await prisma.user.count({ where: { tenantId, memberId: { not: null } } });
  add(
    'Staff records',
    'ERP User ↔ Member link',
    userLinked > 0 ? 'partial' : 'partial',
    `${userLinked} users linked to member profiles (manual in Permissions)`,
  );

  const perms = await probe('GET', '/permissions/users');
  add(
    'Onboarding',
    'Staff ERP account creation',
    perms.status === 200 ? 'partial' : 'missing',
    'Permissions module upsertUser — not employment onboarding workflow',
  );

  const payrollList = await probe('GET', '/finance/payroll/runs');
  add(
    'Payroll',
    'Payroll run list (accounting)',
    payrollList.status === 200 ? 'partial' : 'missing',
    'API + Vendors read-only tab; no salary master, no HR payroll UI create',
  );

  const leaveProbe = await probe('GET', '/hr/leave-requests');
  add('Leave', 'Leave management', leaveProbe.status === 404 ? 'missing' : 'partial', `GET /hr/leave-requests → ${leaveProbe.status}`);

  const petty = await probe('GET', '/finance/petty-cash/summary?accountId=invalid');
  add(
    'Reimbursements',
    'Petty cash reimbursement (finance voucher)',
    petty.status === 400 || petty.status === 404 ? 'partial' : 'partial',
    'POST /finance/petty-cash/reimbursements exists; no staff expense request workflow',
  );

  const volBoard = await probe('GET', '/operations/volunteer-board');
  add('Volunteers', 'Volunteer ops board', volBoard.status === 200 ? 'implemented' : 'partial', 'Distinct from paid HR');

  const structure = await probe('GET', '/structure/campuses');
  add(
    'Ministry hierarchy',
    'Campus / ministry structure',
    structure.status === 200 ? 'implemented' : 'partial',
    'Campus.departments[] + ministries; not org-chart HR reporting lines',
  );

  const respCount = await prisma.memberResponsibility.count({ where: { tenantId, status: 'Active' } });
  add(
    'Assignments',
    'MemberResponsibility (ministry/event roles)',
    respCount > 0 ? 'implemented' : 'partial',
    `${respCount} active assignments`,
  );

  const careCases = await probe('GET', '/discipleship/v2/care-cases');
  add(
    'Pastoral HR overlap',
    'Care cases (not HR performance)',
    careCases.status === 200 ? 'implemented' : 'partial',
    'Shepherd/care — separate from HR reviews',
  );

  const docs = await probe('GET', '/documents');
  add(
    'Contracts/documents',
    'Compliance document registry',
    docs.status === 200 ? 'partial' : 'missing',
    'Tenant compliance docs + member documents; not employment contracts module',
  );

  console.log('\n[audit:hr] Capability probe summary\n');
  for (const r of rows) {
    const icon = r.status === 'implemented' ? '✓' : r.status === 'partial' ? '◐' : '✗';
    console.log(`  ${icon} [${r.area}] ${r.capability} — ${r.note}`);
  }
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
