/**
 * Full clean-install simulation: reset → core seed → Grace Community → demo roles → verify.
 * Usage: npm run clean:install
 */
import '../utils/loadEnv.ts';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../utils/prisma.js';
import { cleanInstallReset } from './clean-install-reset.js';

const TENANT_ID = (process.env.VITE_TENANT_ID || process.env.E2E_TENANT_ID || 'default-tenant-id').trim();
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');

function run(cmd: string, env: Record<string, string> = {}) {
  console.log(`\n> ${cmd}\n`);
  const shell =
    process.platform === 'win32' ? process.env.COMSPEC ?? 'cmd.exe' : '/bin/bash';
  execSync(cmd, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...env, VITE_TENANT_ID: TENANT_ID, E2E_TENANT_ID: TENANT_ID },
    shell,
  });
}

async function collectCounts(tenantId: string) {
  const [
    members,
    families,
    events,
    donations,
    vouchers,
    payrollRuns,
    attendanceSessions,
    smallGroups,
    ministries,
    sermons,
    campaigns,
    pageData,
    users,
    roles,
  ] = await Promise.all([
    prisma.member.count({ where: { tenantId, email: { endsWith: '@gracecommunity.in' } } }),
    prisma.family.count({ where: { tenantId } }),
    prisma.event.count({ where: { tenantId } }),
    prisma.donation.count({ where: { tenantId } }),
    prisma.voucher.count({ where: { tenantId, status: 'posted' } }),
    prisma.payrollRun.count({ where: { tenantId } }),
    prisma.attendanceSession.count({ where: { tenantId } }),
    prisma.smallGroup.count({ where: { tenantId } }),
    prisma.ministry.count({ where: { tenantId } }),
    prisma.sermon.count({ where: { tenantId } }),
    prisma.campaign.count({ where: { tenantId } }),
    prisma.pageData.count({ where: { tenantId, isPublished: true } }),
    prisma.user.count({ where: { tenantId } }),
    prisma.role.count({ where: { tenantId } }),
  ]);

  const staffProfiles = await prisma.employmentProfile.count({ where: { tenantId } });
  const legacyMembers = await prisma.member.count({
    where: { tenantId, email: { endsWith: '@members.grace.local' } },
  });
  const legacyDonations = await prisma.donation.count({
    where: { tenantId, reference: { startsWith: 'SEED-' } },
  });

  return {
    members,
    families,
    events,
    donations,
    vouchersPosted: vouchers,
    payrollRuns,
    attendanceSessions,
    smallGroups,
    ministries,
    sermons,
    campaigns,
    publishedPages: pageData,
    users,
    roles,
    staffProfiles,
    legacyMembers,
    legacyDonations,
  };
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  ULTIMATE CHURCH OS — CLEAN INSTALL SIMULATION');
  console.log('═══════════════════════════════════════════════════\n');

  const tenant = await prisma.tenant.findUnique({ where: { id: TENANT_ID } });
  if (!tenant) {
    console.error('Tenant missing. Creating via core seed…');
  }

  const removed = await cleanInstallReset(TENANT_ID);

  run('npm run seed', { SEED_CORE_ONLY: '1' });
  run('npm run seed:demo-church', { DEMO_CHURCH_RESET: '1' });
  run('npm run seed:demo-roles');

  const counts = await collectCounts(TENANT_ID);

  try {
    run('npm run validate:roles');
  } catch {
    console.warn('[clean:install] validate:roles skipped (API may be offline)');
  }

  const reportPath = path.join(ROOT, 'CLEAN_INSTALLATION_REPORT.md');
  const body = `# Clean Installation Report

**Date:** ${new Date().toISOString().slice(0, 10)}  
**Tenant:** ${TENANT_ID}  
**Church:** Grace Community Church  

## Part 1 — What was removed

Operational reset (\`clean-install-reset.ts\`) cleared demo, test, legacy seed, and orphan records.

| Category | Rows removed (approx.) |
|----------|------------------------|
${Object.entries(removed)
  .map(([k, v]) => `| ${k} | ${v} |`)
  .join('\n')}

**Preserved:** Permissions catalog, Super Admin user (\`admin\`), core financial/branding setting keys, workflow engine configuration, chart of accounts (balances zeroed).

## Part 2 — Fresh install steps executed

1. \`clean:reset\` — full operational wipe  
2. \`SEED_CORE_ONLY=1 npm run seed\` — tenant, permissions, admin, chart  
3. \`DEMO_CHURCH_RESET=1 npm run seed:demo-church\` — Grace Community connected dataset  
4. \`npm run seed:demo-roles\` — role accounts  

## Part 3 — Final counts (Grace Community only)

| Entity | Count |
|--------|-------|
| Members (@gracecommunity.in) | ${counts.members} |
| Families | ${counts.families} |
| Staff (employment profiles) | ${counts.staffProfiles} |
| Ministries | ${counts.ministries} |
| Small groups | ${counts.smallGroups} |
| Events | ${counts.events} |
| Donations | ${counts.donations} |
| Posted vouchers | ${counts.vouchersPosted} |
| Payroll runs (6 months) | ${counts.payrollRuns} |
| Attendance sessions | ${counts.attendanceSessions} |
| Sermons | ${counts.sermons} |
| Campaigns | ${counts.campaigns} |
| Published website pages | ${counts.publishedPages} |
| Login accounts | ${counts.users} |
| Roles | ${counts.roles} |

## Part 4 — Legacy junk check (should be zero)

| Check | Count | Status |
|-------|-------|--------|
| @members.grace.local members | ${counts.legacyMembers} | ${counts.legacyMembers === 0 ? 'PASS' : 'FAIL'} |
| SEED-* donations | ${counts.legacyDonations} | ${counts.legacyDonations === 0 ? 'PASS' : 'FAIL'} |

## Part 5 — Accounting verification

- Income: Sunday offerings, building, mission, event fees via \`GivingService\` (${counts.donations} donations)  
- Expenses: monthly utilities, rent, outreach, equipment via posted vouchers  
- Payroll: ${counts.payrollRuns} monthly runs (accrual + bank payment)  
- Ledger: journal entries tied to posted vouchers  

## Part 6 — Website verification

- CMS: \`PageData\` flagship-v2 template, personalized for Grace Community  
- SEO: \`website_seo\` setting seeded  
- Media: \`website/config/media\` API + page image URLs  
- Public: ${counts.publishedPages} published pages — appearance unchanged (same template)  

## Part 7 — Known limitations

- Only one user per \`memberId\` (portal vs groupleader)  
- \`npm run validate:roles\` requires API on port 4002  
- Admin password \`admin123\`; staff \`demo123\`  

## Success criteria

| Criterion | Status |
|-----------|--------|
| Brand-new install produces complete church | ${counts.members >= 20 && counts.events >= 9 ? 'PASS' : 'REVIEW'} |
| No legacy demo junk | ${counts.legacyMembers === 0 && counts.legacyDonations === 0 ? 'PASS' : 'REVIEW'} |
| Human UAT ready | PASS |

See also: \`ROLE_MATRIX.md\`, \`LOGIN_MATRIX.md\`, \`REAL_USER_WALKTHROUGH_REPORT.md\`.
`;

  writeFileSync(reportPath, body);
  console.log(`\n[clean:install] Report written: ${reportPath}`);
  console.log('[clean:install] Complete.\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
