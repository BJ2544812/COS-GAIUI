/**
 * Grace Community Church — fully connected realistic church environment.
 * Idempotent. Reset: DEMO_CHURCH_RESET=1 npm run seed:demo-church
 *
 * Also run: npm run seed:demo-roles
 */
import '../utils/loadEnv.ts';
import { prisma } from '../utils/prisma.js';
import bcrypt from 'bcryptjs';
import {
  resetGraceCommunityData,
  seedGraceCommunityChurch,
  TAG,
} from './demo-church/seedGraceCommunity.js';
import { CHURCH } from './demo-church/churchIdentity.js';

const TENANT_ID = (process.env.VITE_TENANT_ID || process.env.E2E_TENANT_ID || 'default-tenant-id').trim();
const RESET = process.env.DEMO_CHURCH_RESET === '1';
const MEMBER_PORTAL_USER = 'member';
const MEMBER_PORTAL_PASS = process.env.DEMO_MEMBER_PASSWORD || 'demo123';

async function linkPortalUser(tenantId: string) {
  const portalMember = await prisma.member.findFirst({
    where: { tenantId, email: 'meera.kurian@gracecommunity.in' },
  });
  if (!portalMember) return;

  let memberRole = await prisma.role.findFirst({ where: { tenantId, name: 'Member' } });
  if (!memberRole) {
    memberRole = await prisma.role.create({
      data: { tenantId, name: 'Member', isSystem: true },
    });
  }

  const hashed = await bcrypt.hash(MEMBER_PORTAL_PASS, 10);
  await prisma.user.upsert({
    where: { tenantId_username: { tenantId, username: MEMBER_PORTAL_USER } },
    update: {
      password: hashed,
      roleId: memberRole.id,
      memberId: portalMember.id,
      email: `portal@${CHURCH.name.toLowerCase().replace(/\s+/g, '')}.in`,
    },
    create: {
      tenantId,
      username: MEMBER_PORTAL_USER,
      email: `portal@gracecommunity.in`,
      password: hashed,
      roleId: memberRole.id,
      memberId: portalMember.id,
      status: 'Active',
    },
  });

  await prisma.prayerRequest.upsert({
    where: { id: `${TAG}-prayer-portal` },
    update: {
      content: 'Thankful for our home group and Sunday worship — please pray for wisdom at work.',
    },
    create: {
      id: `${TAG}-prayer-portal`,
      tenantId,
      requesterId: portalMember.id,
      content: 'Thankful for our home group and Sunday worship — please pray for wisdom at work.',
      category: 'general',
      status: 'Active',
      visibility: 'PASTORAL',
    },
  });

  for (let n = 0; n < 3; n++) {
    const portalUser = await prisma.user.findFirst({
      where: { tenantId, username: MEMBER_PORTAL_USER },
    });
    if (!portalUser) break;
    await prisma.notification.upsert({
      where: { id: `${TAG}-portal-notif-${n}` },
      update: {},
      create: {
        id: `${TAG}-portal-notif-${n}`,
        tenantId,
        userId: portalUser.id,
        type: 'Announcement',
        title: n === 0 ? 'Your giving statement is ready' : 'Upcoming: Vacation Bible School',
        message:
          n === 0
            ? 'View your year-to-date contributions in the member portal.'
            : 'Registration is open — share the link with a neighbour family.',
        status: n === 0 ? 'unread' : 'read',
        priority: 'LOW',
      },
    });
  }

  await prisma.memberDocument.upsert({
    where: { id: `${TAG}-doc-portal` },
    update: {},
    create: {
      id: `${TAG}-doc-portal`,
      tenantId,
      memberId: portalMember.id,
      type: 'MembershipDeclaration',
      verified: true,
    },
  });
}

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { id: TENANT_ID } });
  if (!tenant) throw new Error(`Tenant ${TENANT_ID} not found. Run npm run seed first.`);

  if (RESET) await resetGraceCommunityData(TENANT_ID);

  const adminUser = await prisma.user.findFirst({
    where: { tenantId: TENANT_ID, username: 'admin' },
  });
  if (!adminUser) throw new Error('admin user missing — run npm run seed');

  const summary = await seedGraceCommunityChurch(TENANT_ID, adminUser.id);
  await linkPortalUser(TENANT_ID);

  await prisma.setting.upsert({
    where: { tenantId_key: { tenantId: TENANT_ID, key: 'demo_church_v2' } },
    update: {
      value: JSON.stringify({
        tag: TAG,
        version: 3,
        church: CHURCH.name,
        seededAt: new Date().toISOString(),
        summary,
      }),
    },
    create: {
      tenantId: TENANT_ID,
      key: 'demo_church_v2',
      value: JSON.stringify({
        tag: TAG,
        version: 3,
        church: CHURCH.name,
        seededAt: new Date().toISOString(),
        summary,
      }),
    },
  });

  console.log(`\n[grace-community] ${CHURCH.name} is ready.`);
  console.log(`  Members: ${summary.members}`);
  console.log(`  Families: ${summary.families}`);
  console.log(`  Events: ${summary.events}`);
  console.log(`  Donations (this run): ${summary.donations}`);
  console.log(`  Payroll months (this run): ${summary.payrollMonths}`);
  console.log(`  Sunday attendance sessions: ${summary.attendanceSessions}`);
  console.log(`  Member portal: ${MEMBER_PORTAL_USER} / ${MEMBER_PORTAL_PASS} (Meera Kurian)`);
  console.log('  Staff roles: npm run seed:demo-roles (demo123)\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
