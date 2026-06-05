/**
 * HR staff-operations simulation (API-only, no DB reset).
 * Exercises role visibility, employment lifecycle, leave, payroll security, reimbursements.
 *
 * Usage: npm run simulate:hr
 * Requires API: http://127.0.0.1:4002
 */
import '../utils/loadEnv.ts';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../utils/prisma.js';

const API = (process.env.SIM_API_BASE || 'http://127.0.0.1:4002/api/v1').replace(/\/$/, '');
const REPORT_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../HR_OPERATIONAL_REPORT.md',
);

type PhaseResult = {
  phase: string;
  step: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'SKIP';
  detail?: string;
};

const results: PhaseResult[] = [];
const issues: { phase: string; summary: string; detail: string }[] = [];

function record(phase: string, step: string, status: PhaseResult['status'], detail?: string) {
  results.push({ phase, step, status, detail });
  const icon = status === 'PASS' ? '✓' : status === 'WARN' ? '⚠' : status === 'SKIP' ? '○' : '✗';
  console.log(`  ${icon} [${phase}] ${step}${detail ? ` — ${detail}` : ''}`);
  if (status === 'FAIL') {
    issues.push({ phase, summary: step, detail: detail || 'failed' });
  }
}

async function resolveTenantId(): Promise<string> {
  const fromEnv = (process.env.TENANT_ID || process.env.VITE_TENANT_ID || '').trim();
  if (fromEnv) return fromEnv;
  const admin = await prisma.user.findFirst({
    where: { username: 'admin' },
    select: { tenantId: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!admin?.tenantId) throw new Error('No admin tenant — run npm run seed first.');
  return admin.tenantId;
}

async function loginAs(
  tenantId: string,
  username: string,
  password = process.env.DEMO_ROLE_PASSWORD || 'demo123',
): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
    body: JSON.stringify({ username, password }),
  });
  const json = (await res.json()) as { token?: string };
  if (!res.ok || !json.token) {
    throw new Error(`Login ${username} failed (${res.status})`);
  }
  return json.token;
}

async function api(
  token: string,
  tenantId: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; json: any }> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-tenant-id': tenantId,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

const ROLES = [
  { phase: '1.1 Roles', user: 'hradmin', label: 'HR Admin' },
  { phase: '1.1 Roles', user: 'pastor', label: 'Pastor' },
  { phase: '1.1 Roles', user: 'finance', label: 'Finance Admin' },
  { phase: '1.1 Roles', user: 'campus', label: 'Campus Leader' },
  { phase: '1.1 Roles', user: 'worship', label: 'Worship Leader' },
  { phase: '1.1 Roles', user: 'admin', label: 'Platform Admin', password: process.env.SIM_PASS || 'admin123' },
] as const;

async function main() {
  console.log('\n[simulate:hr] Kingdom Church OS — HR operational validation\n');

  const health = await fetch(`${API.replace(/\/api\/v1$/, '')}/health`);
  if (!health.ok) {
    console.error('[simulate:hr] API not reachable. Start dev:server on port 4002.');
    process.exit(1);
  }

  const tenantId = await resolveTenantId();
  console.log(`[simulate:hr] Tenant: ${tenantId}\n`);

  let adminToken: string;
  try {
    adminToken = await loginAs(tenantId, 'admin', process.env.SIM_PASS || 'admin123');
    record('0 Setup', 'Admin login', 'PASS');
  } catch (e: any) {
    record('0 Setup', 'Admin login', 'FAIL', e.message);
    writeReport(tenantId);
    process.exit(1);
  }

  // --- Phase 1.1: role visibility ---
  for (const spec of ROLES) {
    const phase = spec.phase;
    const pwd = 'password' in spec ? spec.password : undefined;
    let token: string;
    try {
      token = await loginAs(tenantId, spec.user, pwd);
      record(phase, `${spec.label} login`, 'PASS');
    } catch (e: any) {
      record(phase, `${spec.label} login`, 'WARN', `seed:demo-roles? ${e.message}`);
      continue;
    }

    const cc = await api(token, tenantId, 'GET', '/hr/command-center');
    const worshipScoped = spec.user === 'worship';
    const ccOk = worshipScoped ? cc.status === 403 : cc.status === 200;
    record(
      phase,
      `${spec.label} command-center`,
      ccOk ? 'PASS' : 'FAIL',
      worshipScoped ? '403 expected (no HR read permission)' : `HTTP ${cc.status}`,
    );

    const leaves = await api(token, tenantId, 'GET', '/hr/leave-requests');
    const leavesOk = worshipScoped ? leaves.status === 403 : leaves.status === 200;
    record(
      phase,
      `${spec.label} leave list`,
      leavesOk ? 'PASS' : 'FAIL',
      worshipScoped ? '403 expected' : `HTTP ${leaves.status}`,
    );

    const payroll = await api(token, tenantId, 'GET', '/hr/payroll-structures');
    const canComp =
      payroll.status === 200 &&
      Array.isArray(payroll.json?.data) &&
      payroll.json.data.length > 0 &&
      payroll.json.data[0]?.baseSalary !== '***';
    const blocked = payroll.status === 403;
    const masked =
      payroll.status === 200 &&
      Array.isArray(payroll.json?.data) &&
      payroll.json.data.some((r: { baseSalary?: string }) => r?.baseSalary === '***');

    if (spec.user === 'pastor' || spec.user === 'worship' || spec.user === 'campus') {
      if (blocked || !canComp) {
        record(phase, `${spec.label} payroll denied/masked`, 'PASS', blocked ? '403' : masked ? 'masked' : 'no rows');
      } else {
        record(phase, `${spec.label} payroll denied/masked`, 'FAIL', 'saw unmasked compensation');
      }
    } else if (spec.user === 'finance' || spec.user === 'hradmin' || spec.user === 'admin') {
      if (payroll.status === 200) {
        record(phase, `${spec.label} payroll access`, 'PASS', canComp ? 'full' : 'empty structures');
      } else {
        record(phase, `${spec.label} payroll access`, 'WARN', `HTTP ${payroll.status}`);
      }
    }
  }

  // --- Phase 1.2: employment lifecycle (admin) ---
  const stamp = Date.now();
  const staffEmail = `hr-sim.staff.${stamp}@grace.local`;
  let memberId: string | undefined;

  const memberRes = await api(adminToken, tenantId, 'POST', '/members', {
    name: `HR Sim Staff ${stamp}`,
    email: staffEmail,
    phone: '+91 90000 00001',
    role: 'Staff',
    status: 'Active',
    growthStage: 'Member',
  });
  if (memberRes.status >= 200 && memberRes.status < 300) {
    memberId = memberRes.json?.data?.id;
    record('1.2 Lifecycle', 'Create member', 'PASS', memberId);
  } else {
    const existing = await prisma.member.findFirst({ where: { tenantId, email: staffEmail } });
    memberId = existing?.id;
    record('1.2 Lifecycle', 'Create member', memberId ? 'WARN' : 'FAIL', memberRes.json?.error || 'no id');
  }

  if (memberId) {
    const prof = await api(adminToken, tenantId, 'POST', '/hr/employment-profiles', {
      memberId,
      jobTitle: 'Ministry Coordinator',
      startDate: new Date().toISOString().slice(0, 10),
      status: 'Active',
    });
    record('1.2 Lifecycle', 'Employment profile', prof.status >= 200 && prof.status < 300 ? 'PASS' : 'FAIL');

    const bal = await api(adminToken, tenantId, 'GET', `/hr/leave-balances?memberId=${memberId}`);
    const balances = bal.json?.data ?? [];
    record(
      '1.2 Lifecycle',
      'Leave balances allocated',
      balances.length > 0 ? 'PASS' : 'WARN',
      `${balances.length} types`,
    );

    const start = new Date();
    start.setDate(start.getDate() + 14);
    const end = new Date(start);
    end.setDate(end.getDate() + 2);
    const leave = await api(adminToken, tenantId, 'POST', '/hr/leave-requests', {
      memberId,
      leaveType: 'Annual',
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      reason: 'HR simulation leave',
    });
    const leaveId = leave.json?.data?.id;
    record(
      '1.2 Lifecycle',
      'Leave request',
      leave.status >= 200 && leave.status < 300 ? 'PASS' : 'FAIL',
      leave.json?.data?.hasConflict ? 'conflicts flagged' : 'clean',
    );

    if (leaveId) {
      const approve = await api(adminToken, tenantId, 'PATCH', `/hr/leave-requests/${leaveId}`, {
        status: 'Approved',
        notes: 'HR simulation approval',
      });
      record('1.2 Lifecycle', 'Leave approval', approve.status === 200 ? 'PASS' : 'WARN', `HTTP ${approve.status}`);

      const balAfter = await api(adminToken, tenantId, 'GET', `/hr/leave-balances?memberId=${memberId}`);
      const annual = (balAfter.json?.data ?? []).find((b: { leaveType: string }) => b.leaveType === 'Annual');
      record(
        '1.2 Leave',
        'Balance used after approval',
        annual && Number(annual.used) > 0 ? 'PASS' : 'WARN',
        annual ? `used=${annual.used}` : 'no Annual balance',
      );
    }

    const denyStart = new Date();
    denyStart.setDate(denyStart.getDate() + 30);
    const denyEnd = new Date(denyStart);
    denyEnd.setDate(denyEnd.getDate() + 1);
    const leave2 = await api(adminToken, tenantId, 'POST', '/hr/leave-requests', {
      memberId,
      leaveType: 'Sick',
      startDate: denyStart.toISOString().slice(0, 10),
      endDate: denyEnd.toISOString().slice(0, 10),
      reason: 'HR simulation deny path',
    });
    const leave2Id = leave2.json?.data?.id;
    if (leave2Id) {
      const deny = await api(adminToken, tenantId, 'PATCH', `/hr/leave-requests/${leave2Id}`, {
        status: 'Rejected',
        notes: 'HR simulation denial',
      });
      record('1.2 Leave', 'Leave denial', deny.status === 200 ? 'PASS' : 'FAIL', `HTTP ${deny.status}`);
    }

    const reimb = await api(adminToken, tenantId, 'POST', '/hr/reimbursements', {
      memberId,
      amount: 250,
      category: 'Ministry',
      description: 'HR simulation travel',
    });
    record('1.2 Lifecycle', 'Reimbursement request', reimb.status >= 200 && reimb.status < 300 ? 'PASS' : 'FAIL');

    const recruit = await api(adminToken, tenantId, 'POST', '/hr/recruitment', {
      candidateName: `Applicant ${stamp}`,
      email: `hr-sim.applicant.${stamp}@grace.local`,
      appliedRole: 'Ministry Coordinator',
      stage: 'Interview',
      notes: 'Simulation pipeline',
    });
    record('1.2 Lifecycle', 'Recruitment entry', recruit.status >= 200 && recruit.status < 300 ? 'PASS' : 'FAIL');

    const onboard = await api(adminToken, tenantId, 'POST', '/hr/onboarding', {
      memberId,
      taskName: 'Policy acknowledgement',
      dueDate: new Date().toISOString().slice(0, 10),
    });
    record('1.2 Lifecycle', 'Onboarding task', onboard.status >= 200 && onboard.status < 300 ? 'PASS' : 'FAIL');
  }

  // --- Phase 3: payroll generation (finance) ---
  try {
    const finToken = await loginAs(tenantId, 'finance');
    const gen = await api(finToken, tenantId, 'POST', '/hr/payroll/runs/generate', {
      periodYear: new Date().getFullYear(),
      periodMonth: new Date().getMonth() + 1,
    });
    if (gen.status === 201 || gen.status === 200) {
      record('3.1 Payroll', 'Generate payroll run', 'PASS');
    } else if (gen.status === 400 && /no active payroll/i.test(gen.json?.error || '')) {
      record('3.1 Payroll', 'Generate payroll run', 'WARN', 'no active structures (configure in UI)');
    } else {
      record('3.1 Payroll', 'Generate payroll run', 'FAIL', gen.json?.error || `HTTP ${gen.status}`);
    }
  } catch (e: any) {
    record('3.1 Payroll', 'Finance login', 'WARN', e.message);
  }

  // --- Phase 1.3: conflict scan endpoint ---
  if (memberId) {
    const conflict = await api(adminToken, tenantId, 'GET', `/hr/leave-requests/conflicts?memberId=${memberId}&startDate=2026-06-01&endDate=2026-06-05`);
    record(
      '1.3 Conflicts',
      'Conflict scanner',
      conflict.status === 200 ? 'PASS' : 'FAIL',
      conflict.json?.data?.hasConflict !== undefined ? 'structured report' : '',
    );
  }

  const settings = await api(adminToken, tenantId, 'GET', '/hr/settings');
  const defaults = settings.json?.data?.leaveDefaults ?? settings.json?.data?.defaults;
  record(
    '2 Settings',
    'Tenant leave policy',
    defaults?.Annual !== undefined || defaults?.annual !== undefined ? 'PASS' : 'FAIL',
  );

  writeReport(tenantId);
  const failed = results.filter((r) => r.status === 'FAIL').length;
  console.log(`\n[simulate:hr] Done — ${results.length} steps, ${failed} failed`);
  console.log(`[simulate:hr] Report: ${REPORT_PATH}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

function writeReport(tenantId: string) {
  const pass = results.filter((r) => r.status === 'PASS').length;
  const fail = results.filter((r) => r.status === 'FAIL').length;
  const warn = results.filter((r) => r.status === 'WARN').length;
  const lines = [
    '# HR Operational Simulation Report',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    `**Tenant:** ${tenantId}`,
    `**Command:** \`npm run simulate:hr\``,
    '',
    '## Summary',
    '',
    `| Result | Count |`,
    `|--------|-------|`,
    `| PASS | ${pass} |`,
    `| WARN | ${warn} |`,
    `| FAIL | ${fail} |`,
    '',
    '## Steps',
    '',
    '| Phase | Step | Status | Detail |',
    '|-------|------|--------|--------|',
    ...results.map((r) => `| ${r.phase} | ${r.step} | ${r.status} | ${r.detail ?? ''} |`),
  ];
  if (issues.length) {
    lines.push('', '## Issues to triage', '');
    for (const i of issues) {
      lines.push(`- **${i.summary}** (${i.phase}): ${i.detail}`);
    }
  }
  lines.push(
    '',
    '## Regression gate',
    '',
    '```bash',
    'npm run stabilization:gate',
    'PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test e2e/hr-operations.spec.ts',
    '```',
    '',
  );
  writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
