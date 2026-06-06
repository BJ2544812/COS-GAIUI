/**
 * Idempotent demo staff accounts for role-based UAT (production rollout).
 * Run after main seed: npm run seed:demo-roles
 *
 * All demo passwords: demo123 (override with DEMO_ROLE_PASSWORD env)
 */
import '../utils/loadEnv.ts';
import { prisma } from '../utils/prisma.js';
import bcrypt from 'bcryptjs';

const TENANT_ID = (process.env.VITE_TENANT_ID || process.env.E2E_TENANT_ID || 'default-tenant-id').trim();
const DEMO_PASSWORD = process.env.DEMO_ROLE_PASSWORD || 'demo123';

type RoleSpec = {
  name: string;
  username: string;
  email: string;
  permissions: string[];
};

/** Church-oriented role templates aligned with ROLE_EXPERIENCE_REPORT.md */
const DEMO_ROLES: RoleSpec[] = [
  {
    name: 'Senior Pastor',
    username: 'pastor',
    email: 'ravi.nair@gracecommunity.in',
    permissions: [
      'manage_members',
      'manage_discipleship',
      'manage_communication',
      'manage_analytics',
      'manage_attendance',
      'manage_events',
      'manage_giving',
      'manage_outreach',
    ],
  },
  {
    name: 'Associate Pastor',
    username: 'associate',
    email: 'david.kurian@gracecommunity.in',
    permissions: ['manage_members', 'manage_discipleship', 'manage_events', 'manage_attendance'],
  },
  {
    name: 'Youth Pastor',
    username: 'youth',
    email: 'anita.george@gracecommunity.in',
    permissions: ['manage_members', 'manage_events', 'manage_attendance', 'manage_discipleship'],
  },
  {
    name: 'Church Administrator',
    username: 'churchadmin',
    email: 'sarah.thomas@gracecommunity.in',
    permissions: [
      'manage_members',
      'manage_events',
      'manage_attendance',
      'manage_analytics',
      'manage_settings',
      'manage_communication',
      'manage_website',
    ],
  },
  {
    name: 'Worship Pastor',
    username: 'worship',
    email: 'thomas.menon@gracecommunity.in',
    permissions: ['manage_events', 'manage_attendance'],
  },
  {
    name: 'Volunteer Coordinator',
    username: 'volunteers',
    email: 'volunteers@grace.local',
    permissions: ['manage_members', 'manage_events', 'manage_attendance'],
  },
  {
    name: 'Finance Manager',
    username: 'finance',
    email: 'james.joseph@gracecommunity.in',
    permissions: ['manage_finance', 'manage_giving', 'manage_hr', 'approve_voucher', 'post_voucher'],
  },
  {
    name: 'Accountant',
    username: 'accountant',
    email: 'accountant@grace.local',
    permissions: ['manage_finance', 'manage_giving'],
  },
  {
    name: 'HR Manager',
    username: 'hradmin',
    email: 'hradmin@grace.local',
    permissions: ['manage_hr', 'manage_members', 'manage_finance'],
  },
  {
    name: 'Communications Manager',
    username: 'secretary',
    email: 'secretary@grace.local',
    permissions: ['manage_members', 'manage_communication', 'manage_documents', 'manage_outreach'],
  },
  {
    name: 'Small Group Leader',
    username: 'groupleader',
    email: 'priya.paul@gracecommunity.in',
    permissions: ['manage_members', 'manage_attendance', 'manage_discipleship'],
  },
  {
    name: 'Staff',
    username: 'staffdesk',
    email: 'staffdesk@grace.local',
    permissions: ['manage_members', 'manage_events'],
  },
  {
    name: 'Ministry Leader',
    username: 'events',
    email: 'events@grace.local',
    permissions: ['manage_events', 'manage_attendance'],
  },
  {
    name: 'Counter Team',
    username: 'counter',
    email: 'counter@grace.local',
    permissions: ['manage_attendance', 'manage_events'],
  },
  {
    name: 'Campus Admin',
    username: 'campus',
    email: 'campus@grace.local',
    permissions: ['manage_members', 'manage_events', 'manage_analytics', 'manage_settings'],
  },
];

async function ensurePermission(moduleKey: string) {
  let permission = await prisma.permission.findFirst({
    where: { OR: [{ moduleKey }, { name: moduleKey }] },
  });
  if (!permission) {
    permission = await prisma.permission.create({
      data: { name: moduleKey, moduleKey },
    });
  }
  return permission;
}

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { id: TENANT_ID } });
  if (!tenant) {
    throw new Error(`Tenant ${TENANT_ID} not found. Run npm run seed first.`);
  }

  const hashed = await bcrypt.hash(DEMO_PASSWORD, 10);
  console.log(`[seed:demo-roles] Tenant: ${TENANT_ID}`);
  console.log(`[seed:demo-roles] Password for all demo users: ${DEMO_PASSWORD}`);

  for (const spec of DEMO_ROLES) {
    let role = await prisma.role.findFirst({
      where: { tenantId: TENANT_ID, name: spec.name },
    });
    if (!role) {
      role = await prisma.role.create({
        data: { tenantId: TENANT_ID, name: spec.name, isSystem: false },
      });
    }

    for (const moduleKey of spec.permissions) {
      const permission = await ensurePermission(moduleKey);
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: role.id, permissionId: permission.id },
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: { tenantId: TENANT_ID, username: spec.username },
    });
    const memberForEmail = await prisma.member.findFirst({
      where: { tenantId: TENANT_ID, email: spec.email },
    });
    const userEmail =
      memberForEmail && existingUser?.memberId === memberForEmail.id
        ? spec.email
        : existingUser?.email || spec.email;

    await prisma.user.upsert({
      where: { tenantId_username: { tenantId: TENANT_ID, username: spec.username } },
      update: { password: hashed, roleId: role.id, status: 'Active', ...(userEmail ? { email: userEmail } : {}) },
      create: {
        tenantId: TENANT_ID,
        username: spec.username,
        email: userEmail,
        password: hashed,
        roleId: role.id,
        status: 'Active',
      },
    });

    console.log(`  ✓ ${spec.username} → ${spec.name} (${spec.permissions.join(', ')})`);
  }

  // Legacy alias: Pastor role name → Senior Pastor permissions (if old DB still has "Pastor")
  const legacyPastor = await prisma.role.findFirst({
    where: { tenantId: TENANT_ID, name: 'Pastor' },
  });
  if (legacyPastor) {
    const senior = DEMO_ROLES.find((r) => r.name === 'Senior Pastor');
    if (senior) {
      for (const moduleKey of senior.permissions) {
        const permission = await ensurePermission(moduleKey);
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: legacyPastor.id, permissionId: permission.id },
          },
          update: {},
          create: { roleId: legacyPastor.id, permissionId: permission.id },
        });
      }
      console.log('  ✓ Migrated legacy "Pastor" role permissions to Senior Pastor set');
    }
  }

  const roleMemberEmails: Record<string, string> = {
    pastor: 'ravi.nair@gracecommunity.in',
    associate: 'david.kurian@gracecommunity.in',
    youth: 'anita.george@gracecommunity.in',
    churchadmin: 'sarah.thomas@gracecommunity.in',
    worship: 'thomas.menon@gracecommunity.in',
    finance: 'james.joseph@gracecommunity.in',
    groupleader: 'priya.paul@gracecommunity.in',
    volunteers: 'kevin.joseph@gracecommunity.in',
    hradmin: 'susan.joseph@gracecommunity.in',
    secretary: 'rachel.thomas@gracecommunity.in',
    staffdesk: 'philip.thomas@gracecommunity.in',
    events: 'joshua.george@gracecommunity.in',
    campus: 'arjun.varughese@gracecommunity.in',
    accountant: 'daniel.nair@gracecommunity.in',
  };
  for (const [username, email] of Object.entries(roleMemberEmails)) {
    const member = await prisma.member.findFirst({ where: { tenantId: TENANT_ID, email } });
    const user = await prisma.user.findFirst({ where: { tenantId: TENANT_ID, username } });
    if (!member || !user) continue;
    const taken = await prisma.user.findFirst({
      where: { memberId: member.id, id: { not: user.id } },
    });
    if (taken) {
      console.warn(`  ⚠ Skipped member link for ${username} — member already linked to another user`);
      continue;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { memberId: member.id },
    });
  }

  console.log('\n[seed:demo-roles] Done. Use these accounts for role-based UAT (see TESTER_GUIDE.md).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
