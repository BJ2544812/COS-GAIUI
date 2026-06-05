/**
 * Real-user walkthrough validation for Grace Community Church seeded tenant.
 * Usage: npm run validate:roles  (API on :4002, seed + seed:demo-roles applied)
 */
import '../utils/loadEnv.ts';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../utils/prisma.js';

const API = (process.env.SIM_API_BASE || 'http://127.0.0.1:4002/api/v1').replace(/\/$/, '');
const DEMO_PASS = process.env.DEMO_ROLE_PASSWORD || 'demo123';
const ADMIN_PASS = process.env.SIM_PASS || process.env.ADMIN_PASSWORD || 'admin123';

type Row = {
  role: string;
  username: string;
  login: 'PASS' | 'FAIL';
  checks: { name: string; status: 'PASS' | 'FAIL' | 'WARN'; detail?: string }[];
};

const ROLES: { username: string; label: string; paths: string[] }[] = [
  { username: 'admin', label: 'Admin', paths: ['/members', '/analytics/summary', '/website/pages'] },
  { username: 'pastor', label: 'Senior Pastor', paths: ['/members', '/care/cases', '/events', '/giving/donations'] },
  { username: 'churchadmin', label: 'Church Administrator', paths: ['/members', '/events', '/attendance/sessions'] },
  { username: 'associate', label: 'Associate Pastor', paths: ['/members', '/care/cases', '/events'] },
  { username: 'youth', label: 'Youth Pastor', paths: ['/members', '/events'] },
  { username: 'worship', label: 'Worship Pastor', paths: ['/events', '/attendance/sessions'] },
  { username: 'finance', label: 'Finance Manager', paths: ['/finance/summary', '/finance/vouchers', '/finance/payroll/runs', '/giving/donations'] },
  { username: 'accountant', label: 'Accountant', paths: ['/finance/vouchers', '/finance/ledger'] },
  { username: 'hradmin', label: 'HR Manager', paths: ['/hr/employment-profiles', '/finance/payroll/runs'] },
  { username: 'volunteers', label: 'Volunteer Coordinator', paths: ['/members', '/events'] },
  { username: 'secretary', label: 'Communications Manager', paths: ['/communication/campaigns', '/documents'] },
  { username: 'groupleader', label: 'Small Group Leader', paths: ['/members', '/groups'] },
  { username: 'staffdesk', label: 'Staff', paths: ['/members', '/events'] },
  { username: 'member', label: 'Member Portal', paths: ['/auth/me', '/events', '/care/prayer'] },
];

async function resolveTenantId(): Promise<string> {
  const fromEnv = (process.env.TENANT_ID || process.env.VITE_TENANT_ID || '').trim();
  if (fromEnv) return fromEnv;
  const admin = await prisma.user.findFirst({ where: { username: 'admin' }, select: { tenantId: true } });
  if (!admin?.tenantId) throw new Error('No tenant');
  return admin.tenantId;
}

async function login(tenantId: string, username: string): Promise<string | null> {
  const password = username === 'admin' ? ADMIN_PASS : DEMO_PASS;
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
    body: JSON.stringify({ username, password }),
  });
  const json = (await res.json()) as { token?: string };
  return res.ok && json.token ? json.token : null;
}

async function probe(token: string, tenantId: string, apiPath: string) {
  const res = await fetch(`${API}${apiPath}`, {
    headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId },
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, json };
}

async function main() {
  const tenantId = await resolveTenantId();
  const memberCount = await prisma.member.count({ where: { tenantId, email: { endsWith: '@gracecommunity.in' } } });
  const donationCount = await prisma.donation.count({ where: { tenantId } });
  const payrollCount = await prisma.payrollRun.count({ where: { tenantId } });

  console.log(`[validate:roles] Tenant ${tenantId}`);
  console.log(`  Grace members: ${memberCount}, donations: ${donationCount}, payroll runs: ${payrollCount}`);

  const results: Row[] = [];

  for (const spec of ROLES) {
    const row: Row = { role: spec.label, username: spec.username, login: 'FAIL', checks: [] };
    const token = await login(tenantId, spec.username);
    if (!token) {
      row.checks.push({ name: 'login', status: 'FAIL', detail: 'Invalid credentials' });
      results.push(row);
      console.log(`✗ ${spec.label} — login failed`);
      continue;
    }
    row.login = 'PASS';

    for (const p of spec.paths) {
      const { status, ok, json } = await probe(token, tenantId, p);
      if (ok || status === 200) {
        const data = (json as { data?: unknown }).data;
        const count = Array.isArray(data) ? data.length : data != null ? 1 : 0;
        row.checks.push({
          name: p,
          status: count > 0 || data != null ? 'PASS' : 'WARN',
          detail: Array.isArray(data) ? `${count} rows` : status === 200 ? 'ok' : String(status),
        });
      } else if (status === 403) {
        row.checks.push({ name: p, status: 'WARN', detail: '403 forbidden' });
      } else {
        row.checks.push({ name: p, status: 'FAIL', detail: `HTTP ${status}` });
      }
    }
    results.push(row);
    const fails = row.checks.filter((c) => c.status === 'FAIL').length;
    console.log(`${fails ? '⚠' : '✓'} ${spec.label} (${row.checks.filter((c) => c.status === 'PASS').length}/${row.checks.length} endpoints)`);
  }

  const publicHome = await fetch(`${API}/website/public/pages/home`, {
    headers: { 'x-tenant-id': tenantId },
  });
  const publicSeo = await fetch(`${API}/website/public/settings`, {
    headers: { 'x-tenant-id': tenantId },
  });

  const reportPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../REAL_USER_WALKTHROUGH_REPORT.md');
  const lines = [
    '# Real User Walkthrough Report',
    '',
    `**Date:** ${new Date().toISOString().slice(0, 10)}`,
    `**Tenant:** ${tenantId}`,
    `**Church:** Grace Community Church`,
    '',
    '## Data presence',
    '',
    `| Entity | Count |`,
    `|--------|-------|`,
    `| Members (@gracecommunity.in) | ${memberCount} |`,
    `| Donations | ${donationCount} |`,
    `| Payroll runs | ${payrollCount} |`,
    '',
    '## Role API walkthrough',
    '',
    '| Role | Login | Endpoints OK | Notes |',
    '|------|-------|--------------|-------|',
  ];

  for (const r of results) {
    const ok = r.checks.filter((c) => c.status === 'PASS').length;
    const warn = r.checks.filter((c) => c.status === 'WARN').length;
    const fail = r.checks.filter((c) => c.status === 'FAIL').length;
    lines.push(`| ${r.role} | ${r.login} | ${ok}/${r.checks.length} | ${fail ? `${fail} fail` : warn ? `${warn} warn` : 'OK'} |`);
  }

  lines.push('', '## Public website', '', `| Check | Status |`, `|-------|--------|`, `| GET public/home | ${publicHome.ok ? 'PASS' : 'FAIL'} |`, `| GET public/settings (SEO) | ${publicSeo.ok ? 'PASS' : 'FAIL'} |`, '', '## Detail', '');

  for (const r of results) {
    lines.push(`### ${r.role} (\`${r.username}\`)`, '');
    for (const c of r.checks) {
      lines.push(`- **${c.name}**: ${c.status}${c.detail ? ` — ${c.detail}` : ''}`);
    }
    lines.push('');
  }

  writeFileSync(reportPath, lines.join('\n'));
  console.log(`\n[validate:roles] Report: ${reportPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
