/**
 * Complete operational data reset for a tenant — preserves core platform setup.
 * Removes demo, test, legacy seed, and orphan records; keeps permissions + Super Admin shell.
 *
 * Usage: npm run clean:reset
 * Env: TENANT_ID / VITE_TENANT_ID (default default-tenant-id)
 */
import '../utils/loadEnv.ts';
import { prisma } from '../utils/prisma.js';

const TENANT_ID = (process.env.VITE_TENANT_ID || process.env.E2E_TENANT_ID || 'default-tenant-id').trim();

const PRESERVED_SETTING_KEYS = new Set([
  'financial',
  'branding',
  'organization',
  'documents',
  'paymentGateway',
  'system',
  'operational',
]);

const DEMO_SETTING_KEYS = [
  'seed.expanded_demo_v3',
  'seed.expanded_demo_v4',
  'seed.serving_demo_v1',
  'demo_church_v2',
  'demo_mode',
];

export type ResetStats = Record<string, number>;

export async function cleanInstallReset(tenantId: string): Promise<ResetStats> {
  const stats: ResetStats = {};

  const bump = async (label: string, fn: () => Promise<{ count: number }>) => {
    const r = await fn();
    stats[label] = r.count;
  };

  console.log(`[clean:reset] Tenant ${tenantId} — removing operational & demo data…`);

  // Unlink users from members before member delete (memberId is unique)
  await prisma.user.updateMany({
    where: { tenantId },
    data: { memberId: null },
  });

  // Payroll & HR
  await bump('payrollLines', () => prisma.payrollLine.deleteMany({ where: { tenantId } }));
  await bump('payrollRuns', () => prisma.payrollRun.deleteMany({ where: { tenantId } }));
  await bump('payrollStructures', () => prisma.payrollStructure.deleteMany({ where: { tenantId } }));
  await bump('employmentProfiles', () => prisma.employmentProfile.deleteMany({ where: { tenantId } }));
  await bump('leaveRequests', () => prisma.leaveRequest.deleteMany({ where: { tenantId } }));
  await bump('leaveBalances', () => prisma.leaveBalance.deleteMany({ where: { tenantId } }));
  await bump('reimbursementRequests', () => prisma.reimbursementRequest.deleteMany({ where: { tenantId } }));
  await bump('staffDocuments', () => prisma.staffDocument.deleteMany({ where: { tenantId } }));

  // Finance — children before vouchers
  await bump('journalEntries', () => prisma.journalEntry.deleteMany({ where: { tenantId } }));
  await bump('voucherAttachments', () => prisma.voucherAttachment.deleteMany({ where: { tenantId } }));
  await bump('vouchers', () => prisma.voucher.deleteMany({ where: { tenantId } }));
  await bump('financialReceipts', () => prisma.financialReceipt.deleteMany({ where: { tenantId } }));
  await bump('donations', () => prisma.donation.deleteMany({ where: { tenantId } }));
  await bump('bankStatementLines', () =>
    prisma.bankStatementLine.deleteMany({ where: { tenantId } }),
  );
  await bump('bankReconciliationSessions', () =>
    prisma.bankReconciliationSession.deleteMany({ where: { tenantId } }),
  );

  // Attendance & events
  await bump('attendance', () => prisma.attendance.deleteMany({ where: { tenantId } }));
  await bump('attendanceSessions', () => prisma.attendanceSession.deleteMany({ where: { tenantId } }));
  await bump('events', () => prisma.event.deleteMany({ where: { tenantId } }));

  // Care & discipleship
  await bump('careLogs', () => prisma.careLog.deleteMany({ where: { tenantId } }));
  await bump('careCases', () => prisma.careCase.deleteMany({ where: { tenantId } }));
  await bump('prayerRequests', () => prisma.prayerRequest.deleteMany({ where: { tenantId } }));
  await bump('tasks', () => prisma.task.deleteMany({ where: { tenantId } }));

  // Groups & volunteers
  await bump('smallGroupMembers', () => prisma.smallGroupMember.deleteMany({ where: { tenantId } }));
  await bump('smallGroups', () => prisma.smallGroup.deleteMany({ where: { tenantId } }));
  await bump('memberResponsibilities', () =>
    prisma.memberResponsibility.deleteMany({ where: { tenantId } }),
  );

  // Communications
  await bump('communicationDeliveries', () =>
    prisma.communicationDelivery.deleteMany({ where: { tenantId } }),
  );
  await bump('communicationCampaigns', () =>
    prisma.communicationCampaign.deleteMany({ where: { tenantId } }),
  );
  await bump('communicationLogs', () => prisma.communicationLog.deleteMany({ where: { tenantId } }));

  // Members & families — full wipe for clean install
  await bump('spiritualMilestones', () =>
    prisma.spiritualMilestone.deleteMany({ where: { tenantId } }),
  );
  await bump('memberDocuments', () => prisma.memberDocument.deleteMany({ where: { tenantId } }));
  await bump('members', () => prisma.member.deleteMany({ where: { tenantId } }));

  await bump('families', () => prisma.family.deleteMany({ where: { tenantId } }));

  // Content & website
  await bump('sermons', () => prisma.sermon.deleteMany({ where: { tenantId } }));
  await bump('documents', () => prisma.document.deleteMany({ where: { tenantId } }));
  await bump('pageData', () => prisma.pageData.deleteMany({ where: { tenantId } }));
  await bump('campaigns', () => prisma.campaign.deleteMany({ where: { tenantId } }));
  await bump('ministries', () => prisma.ministry.deleteMany({ where: { tenantId } }));
  await bump('campuses', () => prisma.campus.deleteMany({ where: { tenantId } }));

  // Notifications & event bus logs (operational noise)
  await bump('notifications', () => prisma.notification.deleteMany({ where: { tenantId } }));
  await bump('eventLogs', () => prisma.eventLog.deleteMany({ where: { tenantId } }));

  // Demo users (keep admin)
  await bump('demoUsers', () =>
    prisma.user.deleteMany({
      where: {
        tenantId,
        username: { not: 'admin' },
      },
    }),
  );

  const demoRoles = await prisma.role.findMany({
    where: { tenantId, isSystem: false, name: { notIn: ['Member'] } },
    select: { id: true },
  });
  if (demoRoles.length) {
    await bump('rolePermissions', () =>
      prisma.rolePermission.deleteMany({
        where: { roleId: { in: demoRoles.map((r) => r.id) } },
      }),
    );
  }

  // Demo roles (recreated by seed:demo-roles) — keep Super Admin / Member system roles
  await bump('demoRoles', () =>
    prisma.role.deleteMany({
      where: {
        tenantId,
        isSystem: false,
        name: { notIn: ['Member'] },
      },
    }),
  );

  // Settings: remove demo markers & church-specific seeded keys; keep core config keys
  const allSettings = await prisma.setting.findMany({ where: { tenantId }, select: { key: true } });
  const keysToDelete = allSettings
    .map((s) => s.key)
    .filter(
      (k) =>
        DEMO_SETTING_KEYS.includes(k) ||
        k.startsWith('demo_') ||
        k.startsWith('seed.') ||
        k === 'church_story' ||
        k === 'website_seo' ||
        k === 'website_media',
    )
    .filter((k) => !PRESERVED_SETTING_KEYS.has(k));

  if (keysToDelete.length) {
    await bump('settings', () =>
      prisma.setting.deleteMany({
        where: { tenantId, key: { in: keysToDelete } },
      }),
    );
  }

  // Reset account balances (preserve chart structure)
  await prisma.account.updateMany({
    where: { tenantId },
    data: { balance: 0 },
  });

  // Ensure admin still exists
  const admin = await prisma.user.findFirst({ where: { tenantId, username: 'admin' } });
  if (!admin) {
    console.warn('[clean:reset] admin user missing — run npm run seed after reset');
  }

  console.log('[clean:reset] Done.', stats);
  return stats;
}

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { id: TENANT_ID } });
  if (!tenant) {
    console.error(`Tenant ${TENANT_ID} not found. Run npm run seed once to create tenant.`);
    process.exit(1);
  }
  await cleanInstallReset(TENANT_ID);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
