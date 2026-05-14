import { prisma } from '../utils/prisma.js';
import bcrypt from 'bcryptjs';
import { AccountingService } from '../services/AccountingService.js';
import { GivingRepository } from '../repositories/GivingRepository.js';

/** Align with frontend `VITE_TENANT_ID` / E2E so admin login and seed target the same tenant. */
const TENANT_ID = (process.env.VITE_TENANT_ID || process.env.E2E_TENANT_ID || 'default-tenant-id').trim();
/** Idempotent: bulk demo runs once per tenant until this setting is removed. */
const SEED_SETTING_KEYS = ['seed.expanded_demo_v3', 'seed.expanded_demo_v4'] as const;
const SEED_SETTING_KEY = 'seed.expanded_demo_v4';

const permissionsList = [
  'manage_analytics',
  'manage_members',
  'manage_events',
  'manage_attendance',
  'manage_finance',
  'approve_voucher',
  'post_voucher',
  'manage_giving',
  'manage_discipleship',
  'manage_assets',
  'manage_outreach',
  'manage_communication',
  'manage_documents',
  'manage_website',
  'manage_settings',
];


async function ensureCoreAuth() {
  const tenant = await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: {
      name: 'Grace Community Church',
      domain: 'grace.local',
    },
    create: {
      id: TENANT_ID,
      name: 'Grace Community Church',
      domain: 'grace.local',
    },
  });

  let adminRole = await prisma.role.findFirst({
    where: { tenantId: tenant.id, name: 'Super Admin' },
  });
  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: 'Super Admin',
        isSystem: true,
      },
    });
  }

  const memberRoleExists = await prisma.role.findFirst({
    where: { tenantId: tenant.id, name: 'Member' },
  });
  if (!memberRoleExists) {
    await prisma.role.create({
      data: { tenantId: tenant.id, name: 'Member', isSystem: false },
    });
  }

  for (const p of permissionsList) {
    const permission = await prisma.permission.upsert({
      where: { name: p },
      update: {},
      create: { name: p, moduleKey: p },
    });

    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: {
      tenantId_username: {
        tenantId: tenant.id,
        username: 'admin',
      },
    },
    update: {
      password: hashedPassword,
      email: 'admin@grace.local',
      roleId: adminRole.id,
    },
    create: {
      tenantId: tenant.id,
      username: 'admin',
      email: 'admin@grace.local',
      password: hashedPassword,
      roleId: adminRole.id,
    },
  });

  console.log('Admin login ready: admin / admin123');
  return tenant;
}

type ChartAccounts = {
  cash: { id: string };
  bank: { id: string };
  tithes: { id: string };
  offerings: { id: string };
  building: { id: string };
  missions: { id: string };
};

async function ensureFullChart(tenantId: string): Promise<ChartAccounts> {
  const cash = await prisma.account.upsert({
    where: { tenantId_code: { tenantId, code: '1010' } },
    update: { name: 'Cash Account' },
    create: {
      tenantId,
      code: '1010',
      name: 'Cash Account',
      type: 'Asset',
    },
  });
  const bank = await prisma.account.upsert({
    where: { tenantId_code: { tenantId, code: '1000' } },
    update: { name: 'Bank Account' },
    create: {
      tenantId,
      code: '1000',
      name: 'Bank Account',
      type: 'Asset',
    },
  });
  const tithes = await prisma.account.upsert({
    where: { tenantId_code: { tenantId, code: '4010' } },
    update: {},
    create: {
      tenantId,
      code: '4010',
      name: 'Tithes',
      type: 'Revenue',
    },
  });
  const offerings = await prisma.account.upsert({
    where: { tenantId_code: { tenantId, code: '4020' } },
    update: {},
    create: {
      tenantId,
      code: '4020',
      name: 'Offerings',
      type: 'Revenue',
    },
  });
  const building = await prisma.account.upsert({
    where: { tenantId_code: { tenantId, code: '4030' } },
    update: {},
    create: {
      tenantId,
      code: '4030',
      name: 'Building Fund',
      type: 'Revenue',
    },
  });
  const missions = await prisma.account.upsert({
    where: { tenantId_code: { tenantId, code: '4040' } },
    update: {},
    create: {
      tenantId,
      code: '4040',
      name: 'Missions',
      type: 'Revenue',
    },
  });
  return { cash, bank, tithes, offerings, building, missions };
}

function printFooter(
  tenantId: string,
  stats?: { members: number; donations: number; events: number },
) {
  console.log('\n🎉 Seed completed successfully!');
  console.log('--------------------------------------------------');
  console.log(`Tenant ID: ${tenantId}`);
  console.log('Admin Username: admin');
  console.log('Admin Password: admin123');
  if (stats) {
    console.log(`Members: ${stats.members}`);
    console.log(`Donations: ${stats.donations}`);
    console.log(`Events: ${stats.events}`);
  }
  console.log('--------------------------------------------------');
}

/** Grouped households + singles — mid-size congregation directory (fresh seeds only). */
const HOUSEHOLDS: { last: string; firsts: string[] }[] = [
  { last: 'Bennett', firsts: ['David', 'Susan', 'Emily'] },
  { last: 'Martinez', firsts: ['Carlos', 'Rosa'] },
  { last: 'Thompson', firsts: ['James', 'Rachel', 'Noah'] },
  { last: 'Nguyen', firsts: ['Linh', 'Minh'] },
  { last: 'Patel', firsts: ['Priya', 'Arjun'] },
  { last: 'Collins', firsts: ['Marcus', 'Tanya'] },
  { last: 'Reyes', firsts: ['Sofia'] },
  { last: 'Brooks', firsts: ['Jordan', 'Casey'] },
];

const SINGLE_MEMBERS: { first: string; last: string }[] = [
  { first: 'Eleanor', last: 'Scott' },
  { first: 'Vincent', last: 'Price' },
  { first: 'Amara', last: 'Lewis' },
  { first: 'Theo', last: 'Ramirez' },
];

function demoEmail(localBase: string, seq: number) {
  const safe = localBase.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return `${safe}${seq}@members.grace.local`;
}

function pastSundayDate(weeksAgo: number, hour: number, minute: number): Date {
  const d = new Date();
  const dow = d.getDay();
  d.setDate(d.getDate() - dow - weeksAgo * 7);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function daysFromNow(days: number, hour: number, minute: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log('🌱 Starting database seed...');
  console.log(`[seed] Target tenant id: ${TENANT_ID}`);

  const tenant = await ensureCoreAuth();
  console.log(`✅ Tenant (idempotent): ${tenant.id}`);
  console.log('✅ Super Admin + permissions + user admin / admin123 ensured');

  await ensureFullChart(tenant.id);
  console.log('✅ Chart of Accounts ensured (Cash, Bank, Tithes, Offerings, Building Fund, Missions)');

  const demoMarker = await prisma.setting.findFirst({
    where: { tenantId: tenant.id, key: { in: [...SEED_SETTING_KEYS] } },
  });
  const existingMembers = await prisma.member.count({ where: { tenantId: tenant.id } });
  if (demoMarker && existingMembers > 0) {
    const [mc, dc, ec] = await Promise.all([
      prisma.member.count({ where: { tenantId: tenant.id } }),
      prisma.donation.count({ where: { tenantId: tenant.id } }),
      prisma.event.count({ where: { tenantId: tenant.id } }),
    ]);
    console.log(`ℹ️  Expanded demo already applied (${demoMarker.key}); skipping bulk demo.`);
    printFooter(tenant.id, { members: mc, donations: dc, events: ec });
    return;
  }
  if (demoMarker && existingMembers === 0) {
    for (const k of SEED_SETTING_KEYS) {
      await prisma.setting
        .delete({ where: { tenantId_key: { tenantId: tenant.id, key: k } } })
        .catch(() => undefined);
    }
    console.log('⚠️  Seed marker was set but no members found — re-running bulk demo.');
  }

  const admin = await prisma.user.findFirst({
    where: { tenantId: tenant.id, username: 'admin' },
  });
  if (!admin) {
    throw new Error('Admin user missing after ensureCoreAuth');
  }

  const accounts = await ensureFullChart(tenant.id);
  const batchTs = Date.now();

  const memberCount = HOUSEHOLDS.reduce((n, h) => n + h.firsts.length, 0) + SINGLE_MEMBERS.length;
  const donationCount = 28;
  const eventDefs: { name: string; type: string; date: Date }[] = [];
  for (let w = 1; w <= 4; w++) {
    eventDefs.push({
      name: w % 2 === 0 ? 'Sunday Worship Gathering' : 'Sunday Service',
      type: 'Service',
      date: pastSundayDate(w, 10, 30),
    });
  }
  const midweek = new Date();
  midweek.setDate(midweek.getDate() - 4);
  midweek.setHours(19, 0, 0, 0);
  eventDefs.push({ name: 'Wednesday Bible Study', type: 'SmallGroup', date: midweek });
  const youth = new Date();
  youth.setDate(youth.getDate() - 6);
  youth.setHours(18, 45, 0, 0);
  eventDefs.push({ name: 'Youth Service', type: 'SmallGroup', date: youth });
  eventDefs.push({ name: 'Community Thanksgiving Dinner', type: 'Special', date: daysFromNow(12, 17, 0) });
  eventDefs.push({ name: 'Guest Speaker Night', type: 'Special', date: daysFromNow(5, 18, 30) });

  const fundDefs = [
    { campaignName: 'Tithes', revenueId: accounts.tithes.id },
    { campaignName: 'General Offerings', revenueId: accounts.offerings.id },
    { campaignName: 'Building Fund', revenueId: accounts.building.id },
    { campaignName: 'Missions Fund', revenueId: accounts.missions.id },
  ] as const;

  await prisma.$transaction(async (tx) => {
    const members: { id: string }[] = [];
    let memberSeq = 0;

    for (const h of HOUSEHOLDS) {
      for (const fn of h.firsts) {
        const growthStage = memberSeq % 6 !== 0 ? 'Member' : 'Visitor';
        const membershipDate = new Date();
        membershipDate.setDate(membershipDate.getDate() - (30 + (memberSeq * 41) % 420));
        const m = await tx.member.create({
          data: {
            tenantId: tenant.id,
            name: `${fn} ${h.last}`,
            email: demoEmail(`${fn}.${h.last}`, memberSeq),
            phone: `+1555${String(2010000 + memberSeq).slice(-7)}`,
            status: 'Active',
            growthStage,
            membershipDate,
          },
        });
        members.push(m);
        memberSeq++;
      }
    }
    for (const sm of SINGLE_MEMBERS) {
      const growthStage = memberSeq % 6 !== 0 ? 'Member' : 'Visitor';
      const membershipDate = new Date();
      membershipDate.setDate(membershipDate.getDate() - (45 + (memberSeq * 37) % 480));
      const m = await tx.member.create({
        data: {
          tenantId: tenant.id,
          name: `${sm.first} ${sm.last}`,
          email: demoEmail(`${sm.first}.${sm.last}`, memberSeq),
          phone: `+1555${String(2010000 + memberSeq).slice(-7)}`,
          status: 'Active',
          growthStage,
          membershipDate,
        },
      });
      members.push(m);
      memberSeq++;
    }

    await tx.campus.create({
      data: {
        tenantId: tenant.id,
        name: 'Main Campus',
        type: 'Primary',
        leader: 'Campus Pastor',
      },
    });

    await tx.pathway.create({
      data: {
        tenantId: tenant.id,
        name: 'Faith Foundations',
        description: 'Seeded new-member pathway for UI testing',
        steps: {
          create: [
            { tenantId: tenant.id, name: 'Attend worship', sequence: 1 },
            { tenantId: tenant.id, name: 'Welcome lunch', sequence: 2 },
            { tenantId: tenant.id, name: 'Membership class', sequence: 3 },
          ],
        },
      },
    });

    const smallGroupSeeds = [
      { name: 'Young Adults Bible Study', meetingDay: 'Thursday', type: 'Cell' as const },
      { name: "Women's Fellowship", meetingDay: 'Tuesday', type: 'Group' as const },
    ];
    for (const sg of smallGroupSeeds) {
      const g = await tx.smallGroup.create({
        data: {
          tenantId: tenant.id,
          name: sg.name,
          type: sg.type,
          meetingDay: sg.meetingDay,
          isActive: true,
        },
      });
      const cap = Math.min(6, members.length);
      for (let mi = 0; mi < cap; mi++) {
        await tx.smallGroupMember.create({
          data: {
            tenantId: tenant.id,
            groupId: g.id,
            memberId: members[mi]!.id,
            role: mi === 0 ? 'LEADER' : 'PARTICIPANT',
          },
        });
      }
    }

    const events: { id: string }[] = [];
    for (let idx = 0; idx < eventDefs.length; idx++) {
      const ed = eventDefs[idx];
      const ev = await tx.event.create({
        data: {
          tenantId: tenant.id,
          name: ed.name,
          type: ed.type,
          date: ed.date,
        },
      });
      events.push(ev);

      const session = await tx.attendanceSession.create({
        data: {
          tenantId: tenant.id,
          eventId: ev.id,
          name: ed.name,
          date: ed.date,
          status: 'CLOSED',
          type: ed.type === 'Service' ? 'SERVICE' : 'GROUP',
        }
      });

      const headcount = 18 + ((idx * 7) % 25);
      const rot = [...members.slice(idx * 2), ...members.slice(0, idx * 2)];
      const n = Math.min(headcount, rot.length);
      for (let k = 0; k < n; k++) {
        await tx.attendance.create({
          data: {
            tenantId: tenant.id,
            sessionId: session.id,
            memberId: rot[k].id,
            status: 'PRESENT',
          },
        });
      }
    }

    const fundRows: { campaignId: string; revenueId: string }[] = [];
    for (const f of fundDefs) {
      let c = await tx.campaign.findFirst({
        where: { tenantId: tenant.id, name: f.campaignName },
      });
      if (!c) {
        c = await tx.campaign.create({
          data: { tenantId: tenant.id, name: f.campaignName },
        });
      }
      fundRows.push({ campaignId: c.id, revenueId: f.revenueId });
    }

    const sermonSeeds = [
      { title: 'Walking in Faith', speaker: 'Pastor David', daysAgo: 7 },
      { title: 'Generous Hearts', speaker: 'Pastor Rachel', daysAgo: 14 },
      { title: 'Hope for the City', speaker: 'Elder Michael', daysAgo: 21 },
      { title: 'The Good Shepherd', speaker: 'Pastor David', daysAgo: 28 },
    ];
    for (const s of sermonSeeds) {
      const sd = new Date();
      sd.setDate(sd.getDate() - s.daysAgo);
      await tx.sermon.create({
        data: {
          tenantId: tenant.id,
          title: s.title,
          speaker: s.speaker,
          date: sd,
          description: 'Sunday message — demo archive.',
        },
      });
    }

    const methods = ['Cash', 'Card', 'Bank Transfer'] as const;

    const recurringIx = [0, 1, 2, 3, 4, 5, 6, 7];
    const recurringCap = Math.min(18, donationCount);
    for (let i = 0; i < donationCount; i++) {
      const donorIdx =
        i < recurringCap
          ? recurringIx[i % recurringIx.length]!
          : ((i * 13) % members.length + 3) % members.length;
      const donor = members[donorIdx]!;
      let amount = 110 + (i % 7) * 55 + (donorIdx % 4) * 40;
      if (i % 11 === 0) amount = 6500 + (i % 5) * 400;
      if (i % 17 === 0) amount = 14000 + (i % 3) * 500;
      if (donorIdx <= 2 && i % 3 === 0) amount += 180;
      const donationDate = new Date();
      donationDate.setDate(donationDate.getDate() - (i % 58) - Math.floor(i / 11) * 2);
      const ref = `SEED-${batchTs}-D-${String(i + 1).padStart(3, '0')}`;
      const method = methods[i % methods.length];
      const fund = fundRows[i % fundRows.length];
      const debitAccountId = i % 2 === 0 ? accounts.bank.id : accounts.cash.id;

      const donation = await GivingRepository.createDonationTx(tx, tenant.id, {
        campaignId: fund.campaignId,
        donorId: donor.id,
        amount,
        method,
        reference: ref,
        date: donationDate,
        source: 'seed',
        sourceRefId: ref,
      } as any);

      await AccountingService.createApproveAndPostVoucher(
        tenant.id,
        {
          type: 'Receipt',
          date: donationDate,
          amount,
          description: `Donation via ${method} - Ref: ${ref}`,
          entries: [
            { accountId: debitAccountId, debit: amount, credit: 0 },
            { accountId: fund.revenueId, debit: 0, credit: amount },
          ],
          source: 'donation',
          sourceRefId: donation.id,
        },
        { approvedByUserId: admin.id, postedByUserId: admin.id },
        tx
      );
    }

    await tx.setting.upsert({
      where: { tenantId_key: { tenantId: tenant.id, key: SEED_SETTING_KEY } },
      create: {
        tenantId: tenant.id,
        key: SEED_SETTING_KEY,
        value: String(batchTs),
      },
      update: { value: String(batchTs) },
    });
  });

  console.log(
    `✅ Expanded demo in one transaction (batch ${batchTs}): ${memberCount} members, ${eventDefs.length} events, ${donationCount} donations + vouchers`,
  );

  try {
    const { WebsiteService } = await import('../services/WebsiteService.js');
    const pages = await WebsiteService.applyTemplate(tenant.id, 'classic');
    console.log(`✅ Website template applied: ${pages.length} pages (Home, About, Sermons, Events, Giving, Contact)`);
  } catch (e) {
    console.warn('[seed] Classic website template not applied:', e);
  }

  printFooter(tenant.id, {
    members: memberCount,
    donations: donationCount,
    events: eventDefs.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
