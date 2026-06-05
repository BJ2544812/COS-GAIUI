/**
 * Fully connected Grace Community Church seed — realistic church environment (not random demo junk).
 */
import { prisma } from '../../utils/prisma.js';
import { GivingService } from '../../services/GivingService.js';
import { WebsiteService } from '../../services/WebsiteService.js';
import { AccountingService } from '../../services/AccountingService.js';
import {
  CHURCH,
  STAFF,
  MEMBERS,
  MINISTRIES,
  SMALL_GROUPS,
  EVENTS,
  SERMON_SERIES,
  SUNDAY_SERVICE_RUN_SHEET,
} from './churchIdentity.js';

export const TAG = 'gcc-v2';
const EMAIL_DOMAIN = '@gracecommunity.in';

function id(suffix: string) {
  return `${TAG}-${suffix}`;
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000);
}

function serviceDateOnDay(daysFromToday: number, hour: number, minute: number) {
  const d = new Date(Date.now() + daysFromToday * 86400000);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function monthsAgo(months: number, day = 15) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(day);
  d.setHours(10, 0, 0, 0);
  return d;
}

export async function resetGraceCommunityData(tenantId: string) {
  console.log('[grace-community] Resetting prior seed records…');
  await prisma.attendance.deleteMany({ where: { tenantId, id: { startsWith: TAG } } });
  await prisma.attendanceSession.deleteMany({ where: { tenantId, id: { startsWith: TAG } } });
  const runs = await prisma.payrollRun.findMany({ where: { tenantId }, select: { id: true } });
  if (runs.length) {
    await prisma.payrollLine.deleteMany({ where: { runId: { in: runs.map((r) => r.id) } } });
    await prisma.payrollRun.deleteMany({ where: { tenantId } });
  }
  await prisma.donation.deleteMany({ where: { tenantId, reference: { startsWith: TAG } } });
  await prisma.memberResponsibility.deleteMany({ where: { tenantId, id: { startsWith: TAG } } });
  await prisma.smallGroupMember.deleteMany({ where: { tenantId, id: { startsWith: TAG } } });
  await prisma.prayerRequest.deleteMany({ where: { tenantId, id: { startsWith: TAG } } });
  await prisma.notification.deleteMany({ where: { tenantId, id: { startsWith: TAG } } });
  await prisma.communicationDelivery.deleteMany({ where: { tenantId, campaign: { id: { startsWith: TAG } } } }).catch(() => {});
  await prisma.communicationCampaign.deleteMany({ where: { tenantId, id: { startsWith: TAG } } });
  await prisma.document.deleteMany({ where: { tenantId, id: { startsWith: TAG } } });
  await prisma.careCase.deleteMany({ where: { tenantId, id: { startsWith: TAG } } }).catch(() => {});
  await prisma.event.deleteMany({ where: { tenantId, id: { startsWith: TAG } } });
  await prisma.member.deleteMany({
    where: { tenantId, OR: [{ email: { endsWith: EMAIL_DOMAIN } }, { email: { endsWith: '@gracecommunity.demo' } }] },
  });
}

async function ensureAccounts(tenantId: string) {
  const codes = [
    { code: '1010', name: 'Cash in Hand', type: 'Asset' },
    { code: '1020', name: 'HDFC Church Account', type: 'Asset' },
    { code: '2010', name: 'Accounts Payable', type: 'Liability' },
    { code: '3010', name: 'Tithes & Offerings', type: 'Revenue' },
    { code: '3020', name: 'Building Fund', type: 'Revenue' },
    { code: '3030', name: 'Mission Support', type: 'Revenue' },
    { code: '3040', name: 'Event Registration Fees', type: 'Revenue' },
    { code: '4010', name: 'Staff Salaries', type: 'Expense' },
    { code: '4020', name: 'Utilities', type: 'Expense' },
    { code: '4030', name: 'Event Expenses', type: 'Expense' },
    { code: '4040', name: 'Equipment & Maintenance', type: 'Expense' },
    { code: '4050', name: 'Internet & Telecom', type: 'Expense' },
    { code: '4060', name: 'Facility Rent', type: 'Expense' },
    { code: '4070', name: 'Outreach & Benevolence', type: 'Expense' },
    { code: '4080', name: 'Church Maintenance', type: 'Expense' },
  ];
  const map: Record<string, string> = {};
  for (const a of codes) {
    const row = await prisma.account.upsert({
      where: { tenantId_code: { tenantId, code: a.code } },
      update: { name: a.name, type: a.type },
      create: { tenantId, ...a, balance: 0 },
    });
    map[a.code] = row.id;
  }
  return map;
}

async function postExpense(
  tenantId: string,
  adminUserId: string,
  accounts: Record<string, string>,
  opts: { key: string; desc: string; amount: number; expenseCode: string; date: Date },
) {
  const exists = await prisma.voucher.findFirst({
    where: { tenantId, description: opts.desc },
  });
  if (exists) return;
  const expenseAcct = accounts[opts.expenseCode];
  const bankAcct = accounts['1020'];
  if (!expenseAcct || !bankAcct) return;
  const draft = await AccountingService.createVoucherDraft(
    tenantId,
    {
      type: 'Payment',
      date: opts.date,
      amount: opts.amount,
      description: opts.desc,
      source: TAG,
      sourceRefId: opts.key,
      entries: [
        { accountId: expenseAcct, debit: opts.amount, credit: 0 },
        { accountId: bankAcct, debit: 0, credit: opts.amount },
      ],
    },
    adminUserId,
  );
  await AccountingService.approveVoucher(tenantId, draft.id, adminUserId);
  await AccountingService.postVoucherToLedger(tenantId, draft.id, adminUserId);
}

async function personalizeWebsite(tenantId: string) {
  const pages = await prisma.pageData.findMany({ where: { tenantId } });
  for (const page of pages) {
    let sections: any[] = [];
    try {
      sections = JSON.parse(page.content || '[]');
    } catch {
      continue;
    }
    let changed = false;
    for (const s of sections) {
      const c = s.config || {};
      if (s.type === 'hero' && page.slug === 'home') {
        c.title = `Welcome to ${CHURCH.name}`;
        c.subtitle = CHURCH.tagline;
        changed = true;
      }
      if (s.type === 'pastoral_note') {
        c.author = 'Pastor Ravi Nair & Associate Pastor David Kurian';
        c.message =
          'For over twenty-five years Grace Community has been a place of welcome in Anna Nagar. Whether you are exploring faith or returning to church, we would be honoured to walk with you.';
        changed = true;
      }
      if (s.type === 'vision_statement') {
        c.title = 'Our Vision';
        c.subtitle = CHURCH.vision;
        changed = true;
      }
      if (s.type === 'text' && page.slug === 'home') {
        c.content = `Sunday Services: ${CHURCH.serviceTimes}\n${CHURCH.address}`;
        changed = true;
      }
      if (s.type === 'contact_form') {
        c.address = CHURCH.address;
        c.email = CHURCH.email;
        c.phone = CHURCH.phone;
        changed = true;
      }
      if (s.type === 'stats_bar' && Array.isArray(c.stats)) {
        c.stats = [
          { label: 'Years of Ministry', value: String(new Date().getFullYear() - CHURCH.foundedYear) },
          { label: 'Active Members', value: '240+' },
          { label: 'Small Groups', value: String(SMALL_GROUPS.length) },
          { label: 'Mission Partners', value: '12' },
        ];
        changed = true;
      }
      s.config = c;
    }
    if (changed) {
      await WebsiteService.updatePageData(tenantId, page.slug, { content: JSON.stringify(sections) });
    }
  }
}

export type SeedSummary = {
  members: number;
  families: number;
  events: number;
  donations: number;
  payrollMonths: number;
  attendanceSessions: number;
};

export async function seedGraceCommunityChurch(
  tenantId: string,
  adminUserId: string,
): Promise<SeedSummary> {
  const summary: SeedSummary = {
    members: 0,
    families: 0,
    events: 0,
    donations: 0,
    payrollMonths: 0,
    attendanceSessions: 0,
  };

  await prisma.tenant.update({ where: { id: tenantId }, data: { name: CHURCH.name } });

  await prisma.setting.upsert({
    where: { tenantId_key: { tenantId, key: 'organization' } },
    update: {
      value: JSON.stringify({
        name: CHURCH.name,
        tagline: CHURCH.tagline,
        address: CHURCH.address,
        phone: CHURCH.phone,
        email: CHURCH.email,
        serviceTimes: CHURCH.serviceTimes,
        livestreamUrl: '',
        website: CHURCH.website,
      }),
    },
    create: {
      tenantId,
      key: 'organization',
      value: JSON.stringify({
        name: CHURCH.name,
        tagline: CHURCH.tagline,
        address: CHURCH.address,
        phone: CHURCH.phone,
        email: CHURCH.email,
        serviceTimes: CHURCH.serviceTimes,
        livestreamUrl: '',
        website: CHURCH.website,
      }),
    },
  });

  await prisma.setting.upsert({
    where: { tenantId_key: { tenantId, key: 'church_story' } },
    update: {
      value: JSON.stringify({
        foundedYear: CHURCH.foundedYear,
        history: CHURCH.history,
        vision: CHURCH.vision,
        mission: CHURCH.mission,
        leadership: STAFF.map((s) => ({ name: s.name, title: s.jobTitle })),
      }),
    },
    create: {
      tenantId,
      key: 'church_story',
      value: JSON.stringify({
        foundedYear: CHURCH.foundedYear,
        history: CHURCH.history,
        vision: CHURCH.vision,
        mission: CHURCH.mission,
        leadership: STAFF.map((s) => ({ name: s.name, title: s.jobTitle })),
      }),
    },
  });

  await prisma.setting.upsert({
    where: { tenantId_key: { tenantId, key: 'website_seo' } },
    update: {
      value: JSON.stringify({
        siteTitle: `${CHURCH.name} | Chennai`,
        description: CHURCH.vision,
        keywords: 'Grace Community Church, Chennai church, worship, Anna Nagar, Christian church',
        allowIndexing: true,
        ogImageUrl: '',
      }),
    },
    create: {
      tenantId,
      key: 'website_seo',
      value: JSON.stringify({
        siteTitle: `${CHURCH.name} | Chennai`,
        description: CHURCH.vision,
        keywords: 'Grace Community Church, Chennai church, worship, Anna Nagar, Christian church',
        allowIndexing: true,
        ogImageUrl: '',
      }),
    },
  });

  const mainCampus = await prisma.campus.upsert({
    where: { id: id('campus-main') },
    update: { name: 'Grace Main Campus', address: CHURCH.address },
    create: {
      id: id('campus-main'),
      tenantId,
      name: 'Grace Main Campus',
      type: 'Campus',
      address: CHURCH.address,
    },
  });

  await prisma.campus.upsert({
    where: { id: id('campus-north') },
    update: { name: 'Grace North Campus' },
    create: {
      id: id('campus-north'),
      tenantId,
      name: 'Grace North Campus',
      type: 'Campus',
      address: '18 North Avenue, Kilpauk, Chennai 600010',
    },
  });

  const accounts = await ensureAccounts(tenantId);
  const memberByKey = new Map<string, { id: string; email: string; name: string }>();

  for (const spec of MEMBERS) {
    const email = spec.email;
    const m = await prisma.member.upsert({
      where: { id: id(spec.id) },
      update: {
        name: spec.name,
        email,
        phone: `+91 ${spec.phone}`,
        city: spec.city,
        growthStage: spec.growthStage,
        status: 'Active',
        addressLine1: spec.address || CHURCH.address,
        membershipDate: daysAgo(400 + MEMBERS.indexOf(spec) * 14),
      },
      create: {
        id: id(spec.id),
        tenantId,
        name: spec.name,
        email,
        phone: `+91 ${spec.phone}`,
        city: spec.city,
        growthStage: spec.growthStage,
        status: 'Active',
        addressLine1: spec.address || CHURCH.address,
        membershipDate: daysAgo(400 + MEMBERS.indexOf(spec) * 14),
      },
    });
    memberByKey.set(spec.id, { id: m.id, email, name: m.name });
  }
  summary.members = memberByKey.size;

  const familyKeys = [...new Set(MEMBERS.map((m) => m.familyKey).filter(Boolean))] as string[];
  for (const fk of familyKeys) {
    const famMembers = MEMBERS.filter((m) => m.familyKey === fk);
    const fam = await prisma.family.upsert({
      where: { id: id(`family-${fk}`) },
      update: { name: `The ${fk!.charAt(0).toUpperCase()}${fk!.slice(1)} Family` },
      create: {
        id: id(`family-${fk}`),
        tenantId,
        name: `The ${fk!.charAt(0).toUpperCase()}${fk!.slice(1)} Family`,
      },
    });
    for (const fm of famMembers) {
      const mid = memberByKey.get(fm.id)?.id;
      if (mid) await prisma.member.update({ where: { id: mid }, data: { familyId: fam.id } });
    }
    summary.families++;
  }

  const staffMemberKey: Record<string, string> = {
    'staff-pastor': 'm01',
    'staff-associate': 'm03',
    'staff-admin': 'm05',
    'staff-finance': 'm07',
    'staff-youth': 'm09',
    'staff-worship': 'm11',
  };

  for (const s of STAFF) {
    const memberId = memberByKey.get(staffMemberKey[s.id]!)!.id;

    await prisma.member.update({
      where: { id: memberId },
      data: {
        growthStage: 'Staff',
        role: s.jobTitle,
        workforceClass: 'staff',
        reportingManagerId: s.id === 'staff-pastor' ? null : memberByKey.get('m01')?.id,
      },
    });

    await prisma.employmentProfile.upsert({
      where: { memberId },
      update: { jobTitle: s.jobTitle, status: 'Active', startDate: new Date(CHURCH.foundedYear + 10, 0, 1) },
      create: {
        tenantId,
        memberId,
        jobTitle: s.jobTitle,
        status: 'Active',
        startDate: new Date(CHURCH.foundedYear + 10, 0, 1),
        notes: `Joined ${CHURCH.shortName} leadership team.`,
      },
    });

    await prisma.payrollStructure.upsert({
      where: { memberId },
      update: {
        baseSalary: s.baseSalary,
        allowances: s.allowances,
        deductions: s.deductions,
        salaryExpenseAccountId: accounts['4010']!,
        payrollPayableAccountId: accounts['2010']!,
        isActive: true,
      },
      create: {
        tenantId,
        memberId,
        baseSalary: s.baseSalary,
        allowances: s.allowances,
        deductions: s.deductions,
        salaryExpenseAccountId: accounts['4010']!,
        payrollPayableAccountId: accounts['2010']!,
        isActive: true,
      },
    });
  }

  for (const m of MINISTRIES) {
    await prisma.ministry.upsert({
      where: { id: id(m.id) },
      update: { name: m.name },
      create: { id: id(m.id), tenantId, campusId: mainCampus.id, name: m.name },
    });
  }

  const eventIds = new Map<string, string>();
  const sundayLiveOpsConfig = {
    liveActive: true,
    liveStartedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    currentSegmentIndex: 1,
    segmentStartedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    mediaReady: true,
    livestreamReady: false,
    issues: [
      {
        id: `${TAG}-issue-mic`,
        text: 'Wireless mic pack #2 — low battery, swap before message',
        at: new Date().toISOString(),
        severity: 'medium',
      },
    ],
    announcements: ['Visitors welcome desk open in the foyer after service.'],
    volunteerPresence: {
      [`${TAG}-vol-ev-0`]: 'present',
      [`${TAG}-vol-ev-1`]: 'present',
      [`${TAG}-vol-ev-2`]: 'confirmed',
      [`${TAG}-vol-ev-3`]: 'late',
      [`${TAG}-vol-ev-4`]: 'pending',
    },
  };

  for (const ev of EVENTS) {
    const evHour = 'hour' in ev ? (ev as { hour?: number }).hour : undefined;
    const evMinute = 'minute' in ev ? (ev as { minute?: number }).minute : undefined;
    const eventDate =
      typeof evHour === 'number'
        ? serviceDateOnDay(ev.days, evHour, evMinute ?? 0)
        : new Date(Date.now() + ev.days * 86400000);
    const isPrimarySunday = ev.id === 'ev-sunday';
    const isSundayService = ev.type === 'Service' && (ev.id === 'ev-sunday' || ev.id === 'ev-sunday-1130');

    const row = await prisma.event.upsert({
      where: { id: id(ev.id) },
      update: {
        name: ev.name,
        type: ev.type,
        date: eventDate,
        location: ev.location,
        registrationOpen: ev.registrationOpen,
        status: isPrimarySunday ? 'ACTIVE' : ev.registrationOpen ? 'REGISTRATION_OPEN' : 'APPROVED',
        runSheet: isSundayService ? [...SUNDAY_SERVICE_RUN_SHEET] : undefined,
        opsConfig: isPrimarySunday ? sundayLiveOpsConfig : undefined,
      },
      create: {
        id: id(ev.id),
        tenantId,
        campusId: mainCampus.id,
        name: ev.name,
        type: ev.type,
        date: eventDate,
        location: ev.location,
        registrationOpen: ev.registrationOpen,
        status: isPrimarySunday ? 'ACTIVE' : ev.registrationOpen ? 'REGISTRATION_OPEN' : 'APPROVED',
        runSheet: isSundayService ? [...SUNDAY_SERVICE_RUN_SHEET] : undefined,
        opsConfig: isPrimarySunday ? sundayLiveOpsConfig : undefined,
      },
    });
    eventIds.set(ev.id, row.id);
  }
  summary.events = eventIds.size;

  const campaignMap: Record<string, string> = {};
  for (const name of ['General Fund', 'Building Fund', 'Mission Support', 'Benevolence Fund']) {
    const row =
      (await prisma.campaign.findFirst({ where: { tenantId, name } })) ??
      (await prisma.campaign.create({
        data: {
          tenantId,
          name,
          goal: name === 'Building Fund' ? 2_500_000 : name === 'Mission Support' ? 500_000 : 1_000_000,
        },
      }));
    campaignMap[name] = row.id;
  }

  const creditByType: Record<string, string> = {
    tithe: '3010',
    offering: '3010',
    building: '3020',
    mission: '3030',
    event: '3040',
  };

  for (let month = 0; month < 6; month++) {
    const periodDate = monthsAgo(month, 1);
    const y = periodDate.getFullYear();
    const m = periodDate.getMonth() + 1;

    for (let week = 0; week < 4; week++) {
      const giftDate = new Date(y, m - 1, 7 + week * 7);
      const ref = `${TAG}-gift-${y}-${m}-w${week}`;
      if (await prisma.donation.findFirst({ where: { tenantId, reference: ref } })) continue;
      const donor = [...memberByKey.values()][(month * 4 + week) % memberByKey.size];
      const amount = 42000 + (week * 3500) + (month % 3) * 2000;
      await GivingService.recordDonation(
        tenantId,
        {
          amount,
          donor: { connect: { id: donor.id } },
          date: giftDate,
          method: week % 2 === 0 ? 'UPI' : 'Cash',
          reference: ref,
          campaign: { connect: { id: campaignMap['General Fund'] } },
        } as any,
        { debitAccountId: accounts['1020'], creditAccountId: accounts[creditByType.offering] },
        { userId: adminUserId },
      );
      summary.donations++;
    }

    const buildingRef = `${TAG}-building-${y}-${m}`;
    if (!(await prisma.donation.findFirst({ where: { tenantId, reference: buildingRef } }))) {
      await GivingService.recordDonation(
        tenantId,
        {
          amount: 15000 + month * 1200,
          donor: { connect: { id: memberByKey.get('m07')!.id } },
          date: new Date(y, m - 1, 12),
          method: 'UPI',
          reference: buildingRef,
          campaign: { connect: { id: campaignMap['Building Fund'] } },
        } as any,
        { debitAccountId: accounts['1020'], creditAccountId: accounts[creditByType.building] },
        { userId: adminUserId },
      );
      summary.donations++;
    }

    const missionRef = `${TAG}-mission-${y}-${m}`;
    if (!(await prisma.donation.findFirst({ where: { tenantId, reference: missionRef } }))) {
      await GivingService.recordDonation(
        tenantId,
        {
          amount: 8500 + month * 500,
          donor: { connect: { id: memberByKey.get('m13')!.id } },
          date: new Date(y, m - 1, 20),
          method: 'Cash',
          reference: missionRef,
          campaign: { connect: { id: campaignMap['Mission Support'] } },
        } as any,
        { debitAccountId: accounts['1020'], creditAccountId: accounts[creditByType.mission] },
        { userId: adminUserId },
      );
      summary.donations++;
    }

    if (month % 2 === 0) {
      const vbsRef = `${TAG}-vbs-reg-${y}-${m}`;
      if (!(await prisma.donation.findFirst({ where: { tenantId, reference: vbsRef } }))) {
        await GivingService.recordDonation(
          tenantId,
          {
            amount: 2500,
            donor: { connect: { id: memberByKey.get('m19')!.id } },
            date: new Date(y, m - 1, 18),
            method: 'UPI',
            reference: vbsRef,
            campaign: { connect: { id: campaignMap['General Fund'] } },
            event: { connect: { id: eventIds.get('ev-vbs')! } },
          } as any,
          { debitAccountId: accounts['1020'], creditAccountId: accounts[creditByType.event] },
          { userId: adminUserId },
        );
        summary.donations++;
      }
    }

    const existingPayroll = await prisma.payrollRun.findFirst({
      where: { tenantId, periodYear: y, periodMonth: m },
    });
    if (!existingPayroll) {
      const lines = STAFF.map((s) => {
        const memberId =
          s.id === 'staff-pastor'
            ? memberByKey.get('m01')!.id
            : s.id === 'staff-associate'
              ? memberByKey.get('m03')!.id
              : s.id === 'staff-admin'
                ? memberByKey.get('m05')!.id
                : s.id === 'staff-finance'
                  ? memberByKey.get('m07')!.id
                  : s.id === 'staff-youth'
                    ? memberByKey.get('m09')!.id
                    : memberByKey.get('m11')!.id;
        return {
          memberId,
          grossAmount: s.baseSalary + s.allowances,
          deductionAmount: s.deductions,
          salaryExpenseAccountId: accounts['4010']!,
          payrollPayableAccountId: accounts['2010']!,
        };
      });
      const run = await AccountingService.createPayrollRun(
        tenantId,
        { periodYear: y, periodMonth: m, lines },
        { approvedByUserId: adminUserId, postedByUserId: adminUserId },
      );
      await AccountingService.payPayrollRun(
        tenantId,
        run.id,
        { paymentAccountId: accounts['1020']!, paymentDate: new Date(y, m - 1, 28) },
        { approvedByUserId: adminUserId, postedByUserId: adminUserId },
      );
      summary.payrollMonths++;
    }

    const monthlyExpenses = [
      { key: `util-${y}-${m}`, desc: `Utilities — ${y}-${String(m).padStart(2, '0')}`, amount: 17800 + month * 200, code: '4020' },
      { key: `net-${y}-${m}`, desc: `Internet & telecom — ${y}-${String(m).padStart(2, '0')}`, amount: 3200, code: '4050' },
      { key: `rent-${y}-${m}`, desc: `Facility rent — ${y}-${String(m).padStart(2, '0')}`, amount: 45000, code: '4060' },
    ];
    if (month % 2 === 0) {
      monthlyExpenses.push({
        key: `outreach-${y}-${m}`,
        desc: `Community outreach supplies — ${y}-${String(m).padStart(2, '0')}`,
        amount: 12000,
        code: '4070',
      });
    } else {
      monthlyExpenses.push({
        key: `maint-${y}-${m}`,
        desc: `Building maintenance — ${y}-${String(m).padStart(2, '0')}`,
        amount: 9500,
        code: '4080',
      });
    }
    if (month % 3 === 0) {
      monthlyExpenses.push({
        key: `equip-${y}-${m}`,
        desc: `AV equipment service — ${y}-${String(m).padStart(2, '0')}`,
        amount: 18500,
        code: '4040',
      });
    }
    if (month % 2 === 1) {
      monthlyExpenses.push({
        key: `event-${y}-${m}`,
        desc: `Youth fellowship refreshments — ${y}-${String(m).padStart(2, '0')}`,
        amount: 4800,
        code: '4030',
      });
    }

    for (const ex of monthlyExpenses) {
      await postExpense(tenantId, adminUserId, accounts, {
        key: ex.key,
        desc: ex.desc,
        amount: ex.amount,
        expenseCode: ex.code,
        date: new Date(y, m - 1, 25),
      });
    }
  }

  const sundayEventId = eventIds.get('ev-sunday')!;
  const liveSessionDate = serviceDateOnDay(0, 9, 0);
  const liveSession = await prisma.attendanceSession.upsert({
    where: { id: id('session-sun-live-today') },
    update: { date: liveSessionDate, eventId: sundayEventId, status: 'OPEN' },
    create: {
      id: id('session-sun-live-today'),
      tenantId,
      name: 'Sunday Worship — 9:00 AM (today)',
      date: liveSessionDate,
      type: 'SERVICE',
      status: 'OPEN',
      campusId: mainCampus.id,
      eventId: sundayEventId,
    },
  });
  summary.attendanceSessions++;
  const liveAttendees = [...memberByKey.values()].slice(0, 14);
  for (let a = 0; a < liveAttendees.length; a++) {
    await prisma.attendance.upsert({
      where: { id: id(`att-live-today-${a}`) },
      update: { checkInTime: new Date() },
      create: {
        id: id(`att-live-today-${a}`),
        tenantId,
        sessionId: liveSession.id,
        memberId: liveAttendees[a].id,
        checkInTime: new Date(Date.now() - (14 - a) * 120000),
        method: a % 2 === 0 ? 'MOBILE' : 'MANUAL',
        status: 'PRESENT',
      },
    });
  }

  for (let w = 0; w < 26; w++) {
    const sessionDate = daysAgo(w * 7);
    const session = await prisma.attendanceSession.upsert({
      where: { id: id(`session-sun-${w}`) },
      update: { date: sessionDate, eventId: sundayEventId },
      create: {
        id: id(`session-sun-${w}`),
        tenantId,
        name: 'Sunday Worship Service — 9:00 AM',
        date: sessionDate,
        type: 'SERVICE',
        status: 'CLOSED',
        campusId: mainCampus.id,
        eventId: sundayEventId,
      },
    });
    summary.attendanceSessions++;
    const attendees = [...memberByKey.values()].slice(0, 18 + (w % 5));
    for (let a = 0; a < attendees.length; a++) {
      await prisma.attendance.upsert({
        where: { id: id(`att-${w}-${a}`) },
        update: {},
        create: {
          id: id(`att-${w}-${a}`),
          tenantId,
          sessionId: session.id,
          memberId: attendees[a].id,
          checkInTime: sessionDate,
          method: a % 3 === 0 ? 'MOBILE' : 'MANUAL',
          status: 'PRESENT',
        },
      });
    }
  }

  for (const [gi, g] of SMALL_GROUPS.entries()) {
    const group = await prisma.smallGroup.upsert({
      where: { id: id(g.id) },
      update: { name: g.name, meetingDay: g.meetingDay },
      create: {
        id: id(g.id),
        tenantId,
        name: g.name,
        type: 'Cell',
        meetingDay: g.meetingDay,
        isActive: true,
      },
    });
    const leaderId = memberByKey.get(g.leaderMemberId)?.id;
    if (leaderId) {
      await prisma.smallGroupMember.upsert({
        where: { id: id(`sgm-leader-${gi}`) },
        update: {},
        create: {
          id: id(`sgm-leader-${gi}`),
          tenantId,
          groupId: group.id,
          memberId: leaderId,
          role: 'LEADER',
        },
      });
    }
    const groupMembers = MEMBERS.filter((_, idx) => idx % SMALL_GROUPS.length === gi).slice(0, 6);
    for (const [mi, gm] of groupMembers.entries()) {
      const mid = memberByKey.get(gm.id)?.id;
      if (!mid) continue;
      await prisma.smallGroupMember.upsert({
        where: { id: id(`sgm-${gi}-${mi}`) },
        update: {},
        create: {
          id: id(`sgm-${gi}-${mi}`),
          tenantId,
          groupId: group.id,
          memberId: mid,
          role: mid === leaderId ? 'LEADER' : 'PARTICIPANT',
        },
      });
    }
  }

  const volunteerRoles = [
    { event: 'ev-sunday', role: 'Worship lead', member: 'm09' },
    { event: 'ev-sunday', role: 'Media / slides', member: 'm11' },
    { event: 'ev-sunday', role: 'Host / announcements', member: 'm01' },
    { event: 'ev-sunday', role: 'Usher', member: 'm21' },
    { event: 'ev-sunday', role: 'Greeter', member: 'm22' },
    { event: 'ev-sunday-1130', role: 'Worship lead', member: 'm09' },
    { event: 'ev-sunday-1130', role: 'Greeter', member: 'm23' },
    { event: 'ev-youth', role: 'Youth Host', member: 'm25' },
    { event: 'ev-vbs', role: 'Registration Desk', member: 'm13' },
    { event: 'ev-christmas', role: 'Outreach Team', member: 'm17' },
  ];
  for (const [vi, v] of volunteerRoles.entries()) {
    await prisma.memberResponsibility.upsert({
      where: { id: id(`vol-ev-${vi}`) },
      update: {},
      create: {
        id: id(`vol-ev-${vi}`),
        tenantId,
        memberId: memberByKey.get(v.member)!.id,
        role: v.role,
        entityType: 'Event',
        entityId: eventIds.get(v.event),
        status: 'Active',
      },
    });
  }

  for (let i = 0; i < 8; i++) {
    await prisma.memberResponsibility.upsert({
      where: { id: id(`vol-min-${i}`) },
      update: {},
      create: {
        id: id(`vol-min-${i}`),
        tenantId,
        memberId: [...memberByKey.values()][10 + i].id,
        role: i % 2 === 0 ? 'Greeter' : 'Usher',
        entityType: 'Ministry',
        entityId: id(MINISTRIES[i % MINISTRIES.length]!.id),
        status: 'Active',
      },
    });
  }

  const prayers = [
    'Please pray for my mother\'s recovery after surgery.',
    'Grateful for the youth team — praying for more volunteers.',
    'Requesting prayer for job direction this season.',
    'Thanksgiving — our family joined the Anna Nagar home group.',
  ];
  for (let i = 0; i < prayers.length; i++) {
    await prisma.prayerRequest.upsert({
      where: { id: id(`prayer-${i}`) },
      update: { content: prayers[i]! },
      create: {
        id: id(`prayer-${i}`),
        tenantId,
        requesterId: [...memberByKey.values()][i + 3].id,
        content: prayers[i]!,
        category: 'general',
        status: 'Active',
      },
    });
  }

  for (let i = 0; i < 3; i++) {
    const subject = [...memberByKey.values()][5 + i];
    await prisma.careCase.upsert({
      where: { id: id(`care-${i}`) },
      update: {},
      create: {
        id: id(`care-${i}`),
        tenantId,
        memberId: subject.id,
        category: 'Pastoral Visit',
        status: i === 0 ? 'OPEN' : 'IN_PROGRESS',
        urgency: i === 0 ? 'HIGH' : 'MEDIUM',
        createdById: adminUserId,
      },
    });
  }

  const comms = [
    { title: 'Sunday Welcome', body: 'We look forward to worshiping with you this Sunday at 9, 11, and 5.' },
    { title: 'VBS Registration Open', body: 'Vacation Bible School registration is open — invite a family today.' },
    { title: 'Building Fund Update', body: 'Thank you for your generosity toward our north campus expansion.' },
  ];
  for (const [ci, c] of comms.entries()) {
    const camp = await prisma.communicationCampaign.upsert({
      where: { id: id(`comm-${ci}`) },
      update: { title: c.title, body: c.body, status: 'sent', sentAt: daysAgo(14 - ci * 5) },
      create: {
        id: id(`comm-${ci}`),
        tenantId,
        title: c.title,
        body: c.body,
        channels: JSON.stringify(['in_app', 'email']),
        audienceFilter: JSON.stringify({ allMembers: true }),
        status: 'sent',
        sentAt: daysAgo(14 - ci * 5),
        createdById: adminUserId,
      },
    });
    for (let d = 0; d < 5; d++) {
      const mem = [...memberByKey.values()][d];
      await prisma.communicationDelivery.upsert({
        where: { id: id(`comm-del-${ci}-${d}`) },
        update: {},
        create: {
          id: id(`comm-del-${ci}-${d}`),
          tenantId,
          campaignId: camp.id,
          channel: 'in_app',
          recipientKey: mem.email,
          memberId: mem.id,
          status: 'delivered',
          deliveredAt: daysAgo(14 - ci * 5),
        },
      });
    }
  }

  const docs = [
    { title: 'Child Safety Policy 2025', category: 'Policy' },
    { title: 'Membership Handbook', category: 'Handbook' },
    { title: 'Annual Report FY24-25', category: 'Reports' },
  ];
  for (const [di, doc] of docs.entries()) {
    await prisma.document.upsert({
      where: { id: id(`doc-${di}`) },
      update: {},
      create: {
        id: id(`doc-${di}`),
        tenantId,
        title: doc.title,
        category: doc.category,
        url: `/uploads/${tenantId}/settings/policy-${di + 1}.pdf`,
        uploadedBy: adminUserId,
      },
    });
  }

  for (let i = 0; i < 6; i++) {
    const series = SERMON_SERIES[i % SERMON_SERIES.length]!;
    await prisma.sermon.upsert({
      where: { id: id(`sermon-${i}`) },
      update: {},
      create: {
        id: id(`sermon-${i}`),
        tenantId,
        title: `${series.title} — Part ${(i % 3) + 1}`,
        speaker: series.speaker,
        date: daysAgo(i * 7),
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        isPublished: true,
        scripture: 'John 3:16',
      },
    });
  }

  try {
    await WebsiteService.applyTemplate(tenantId, 'flagship-v2');
    await personalizeWebsite(tenantId);
    await prisma.pageData.updateMany({ where: { tenantId }, data: { isPublished: true } });
  } catch (e) {
    console.warn('[grace-community] Website:', e instanceof Error ? e.message : e);
  }

  for (const s of STAFF) {
    const memberId = memberByKey.get(staffMemberKey[s.id]!)?.id;
    if (!memberId) continue;
    await prisma.user.updateMany({
      where: { tenantId, username: s.username },
      data: { memberId },
    });
  }

  await prisma.notification.upsert({
    where: { id: id('notif-sunday') },
    update: {},
    create: {
      id: id('notif-sunday'),
      tenantId,
      userId: adminUserId,
      type: 'Announcement',
      title: 'Sunday worship reminder',
      message: `Join us this Sunday — ${CHURCH.serviceTimes} at ${CHURCH.address}.`,
      status: 'unread',
      priority: 'MEDIUM',
    },
  });

  return summary;
}
