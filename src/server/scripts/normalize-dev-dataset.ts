/**
 * Dev-only: merge duplicate members (same normalized email) within one tenant.
 *
 * Keeps the oldest record (createdAt) and re-points donations, group memberships,
 * and attendance rows. Skips groups where the keeper is already enrolled (drops duplicate row).
 *
 * Usage:
 *   ALLOW_DEV_DB_NORMALIZE=1 npx tsx src/server/scripts/normalize-dev-dataset.ts
 *
 * Optional: TENANT_ID or VITE_TENANT_ID (defaults to admin's tenant from DB).
 */
import { prisma } from '../utils/prisma.js';

async function resolveTenantId(): Promise<string> {
  const fromEnv = (process.env.TENANT_ID || process.env.VITE_TENANT_ID || process.env.E2E_TENANT_ID || '').trim();
  if (fromEnv) return fromEnv;
  const admin = await prisma.user.findFirst({
    where: { username: 'admin' },
    select: { tenantId: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!admin?.tenantId) throw new Error('No admin user — set TENANT_ID or seed the database.');
  return admin.tenantId;
}

async function mergeMemberPair(keeperId: string, removeId: string, tenantId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.donation.updateMany({
      where: { tenantId, donorId: removeId },
      data: { donorId: keeperId },
    });

    await tx.memberDocument.updateMany({
      where: { tenantId, memberId: removeId },
      data: { memberId: keeperId },
    });
    await tx.spiritualMilestone.updateMany({
      where: { tenantId, memberId: removeId },
      data: { memberId: keeperId },
    });
    await tx.memberResponsibility.updateMany({
      where: { tenantId, memberId: removeId },
      data: { memberId: keeperId },
    });
    await tx.careNote.updateMany({
      where: { tenantId, memberId: removeId },
      data: { memberId: keeperId },
    });
    await tx.careCase.updateMany({
      where: { tenantId, memberId: removeId },
      data: { memberId: keeperId },
    });
    await tx.prayerRequest.updateMany({
      where: { tenantId, requesterId: removeId },
      data: { requesterId: keeperId },
    });
    await tx.memberPathwayProgress.updateMany({
      where: { tenantId, assignedMentorId: removeId },
      data: { assignedMentorId: keeperId },
    });
    const dupProg = await tx.memberPathwayProgress.findMany({
      where: { tenantId, memberId: removeId },
    });
    for (const p of dupProg) {
      const keeperProg = await tx.memberPathwayProgress.findFirst({
        where: { tenantId, memberId: keeperId, pathwayId: p.pathwayId },
      });
      if (keeperProg) {
        await tx.memberPathwayProgress.delete({ where: { id: p.id } });
      } else {
        await tx.memberPathwayProgress.update({
          where: { id: p.id },
          data: { memberId: keeperId },
        });
      }
    }
    await tx.mentorship.updateMany({
      where: { tenantId, mentorId: removeId },
      data: { mentorId: keeperId },
    });
    await tx.mentorship.updateMany({
      where: { tenantId, discipleId: removeId },
      data: { discipleId: keeperId },
    });

    const invalidMentorships = await tx.mentorship.findMany({
      where: { tenantId },
      select: { id: true, mentorId: true, discipleId: true },
    });
    for (const m of invalidMentorships) {
      if (m.mentorId === m.discipleId) {
        await tx.mentorship.delete({ where: { id: m.id } });
      }
    }
    await tx.task.updateMany({
      where: { tenantId, assignedMemberId: removeId },
      data: { assignedMemberId: keeperId },
    });
    await tx.memberEngagementSnapshot.updateMany({
      where: { tenantId, memberId: removeId },
      data: { memberId: keeperId },
    });
    await tx.asset.updateMany({
      where: { tenantId, assignedToId: removeId },
      data: { assignedToId: keeperId },
    });

    const sgRows = await tx.smallGroupMember.findMany({
      where: { tenantId, memberId: removeId },
    });
    for (const row of sgRows) {
      const clash = await tx.smallGroupMember.findFirst({
        where: { tenantId, groupId: row.groupId, memberId: keeperId },
      });
      if (clash) {
        await tx.smallGroupMember.delete({ where: { id: row.id } });
      } else {
        await tx.smallGroupMember.update({
          where: { id: row.id },
          data: { memberId: keeperId },
        });
      }
    }

    await tx.attendance.updateMany({
      where: { tenantId, memberId: removeId },
      data: { memberId: keeperId },
    });

    const removeUser = await tx.user.findFirst({ where: { memberId: removeId } });
    const keeperUser = await tx.user.findFirst({ where: { memberId: keeperId } });
    if (removeUser && !keeperUser) {
      await tx.user.update({
        where: { id: removeUser.id },
        data: { memberId: keeperId },
      });
    }

    await tx.member.delete({ where: { id: removeId } });
  });
}

function extractLastName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return '';
  return parts[parts.length - 1]!.trim();
}

async function enrichOperationalDataset(tenantId: string) {
  const members = await prisma.member.findMany({
    where: { tenantId },
    select: {
      id: true,
      name: true,
      familyId: true,
      email: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  if (members.length === 0) return;

  // 1) Family cohesion: create household rows from shared last names and assign unlinked members.
  const familyByName = new Map<string, string>();
  const existingFamilies = await prisma.family.findMany({
    where: { tenantId },
    select: { id: true, name: true },
  });
  for (const f of existingFamilies) familyByName.set(f.name.toLowerCase(), f.id);

  const bucket = new Map<string, { id: string; familyId: string | null }[]>();
  for (const m of members) {
    const last = extractLastName(m.name);
    if (!last) continue;
    const key = `${last} Family`;
    const list = bucket.get(key) || [];
    list.push({ id: m.id, familyId: m.familyId ?? null });
    bucket.set(key, list);
  }

  for (const [familyName, list] of bucket) {
    if (list.length < 2) continue;
    let familyId = familyByName.get(familyName.toLowerCase());
    if (!familyId) {
      const f = await prisma.family.create({
        data: { tenantId, name: familyName },
        select: { id: true },
      });
      familyId = f.id;
      familyByName.set(familyName.toLowerCase(), familyId);
    }
    const toAssign = list.filter((x) => !x.familyId).map((x) => x.id);
    if (toAssign.length > 0) {
      await prisma.member.updateMany({
        where: { tenantId, id: { in: toAssign } },
        data: { familyId },
      });
    }
  }

  // 2) Attendance realism: if no attendance rows, seed a few closed sessions from recent events.
  const attendanceCount = await prisma.attendance.count({ where: { tenantId } });
  if (attendanceCount === 0) {
    const events = await prisma.event.findMany({
      where: { tenantId },
      orderBy: { date: 'desc' },
      take: 4,
      select: { id: true, name: true, date: true, type: true, campusId: true },
    });
    const activeMembers = await prisma.member.findMany({
      where: { tenantId, status: 'Active' },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: 35,
    });
    for (let i = 0; i < events.length; i++) {
      const e = events[i]!;
      const session = await prisma.attendanceSession.create({
        data: {
          tenantId,
          name: e.name,
          date: e.date,
          status: 'CLOSED',
          type: e.type?.toUpperCase() === 'SERVICE' ? 'SERVICE' : 'EVENT',
          campusId: e.campusId ?? undefined,
          eventId: e.id,
        },
        select: { id: true },
      });
      const headCount = Math.max(12, Math.min(28, 16 + i * 3));
      const rows = activeMembers.slice(0, headCount).map((m) => ({
        tenantId,
        sessionId: session.id,
        memberId: m.id,
        status: 'PRESENT',
        method: 'MANUAL',
      }));
      if (rows.length > 0) {
        await prisma.attendance.createMany({ data: rows });
      }
    }
  }

  // 3) Small groups: ensure at least one operational group with members.
  const smallGroupCount = await prisma.smallGroup.count({ where: { tenantId } });
  if (smallGroupCount === 0) {
    const sg = await prisma.smallGroup.create({
      data: {
        tenantId,
        name: 'Downtown Bible Study',
        type: 'Cell',
        meetingDay: 'Wednesday',
        isActive: true,
      },
      select: { id: true },
    });
    const picks = members.slice(0, 10);
    if (picks.length > 0) {
      await prisma.smallGroupMember.createMany({
        data: picks.map((m, idx) => ({
          tenantId,
          groupId: sg.id,
          memberId: m.id,
          role: idx === 0 ? 'LEADER' : 'PARTICIPANT',
        })),
      });
    }
  }

  // 4) Pathways: ensure one pathway exists and some members have progress.
  let pathway = await prisma.pathway.findFirst({
    where: { tenantId },
    select: { id: true },
  });
  if (!pathway) {
    pathway = await prisma.pathway.create({
      data: {
        tenantId,
        name: 'Faith Foundations',
        description: 'Operational pathway for new member growth',
      },
      select: { id: true },
    });
    await prisma.pathwayStep.createMany({
      data: [
        { tenantId, pathwayId: pathway.id, name: 'Attend Sunday Service', sequence: 1 },
        { tenantId, pathwayId: pathway.id, name: 'Join Orientation', sequence: 2 },
        { tenantId, pathwayId: pathway.id, name: 'Complete Membership Class', sequence: 3 },
      ],
    });
  }
  const progressCount = await prisma.memberPathwayProgress.count({
    where: { tenantId, pathwayId: pathway.id },
  });
  if (progressCount === 0) {
    const picks = members.slice(0, 8);
    if (picks.length > 0) {
      await prisma.memberPathwayProgress.createMany({
        data: picks.map((m) => ({
          tenantId,
          memberId: m.id,
          pathwayId: pathway!.id,
          status: 'InProgress',
        })),
      });
    }
  }

  // 5) Shepherd baseline: one care case + one log for realism if empty.
  const careCaseCount = await prisma.careCase.count({ where: { tenantId } });
  if (careCaseCount === 0 && members.length > 0) {
    const admin = await prisma.user.findFirst({
      where: { tenantId, username: 'admin' },
      select: { id: true },
    });
    const target = members[0]!;
    const cc = await prisma.careCase.create({
      data: {
        tenantId,
        memberId: target.id,
        assignedUserId: admin?.id ?? undefined,
        createdById: admin?.id ?? undefined,
        updatedById: admin?.id ?? undefined,
        category: 'Pastoral Follow-up',
        status: 'OPEN',
      },
      select: { id: true },
    });
    if (admin?.id) {
      await prisma.careLog.create({
        data: {
          tenantId,
          careCaseId: cc.id,
          authorId: admin.id,
          createdById: admin.id,
          interactionType: 'NOTE',
          content: 'Initial pastoral check-in created during dev normalization.',
        },
      });
    }
  }
}

async function main() {
  if (process.env.ALLOW_DEV_DB_NORMALIZE !== '1') {
    console.error('Refusing to run: set ALLOW_DEV_DB_NORMALIZE=1');
    process.exit(1);
  }

  const tenantId = await resolveTenantId();
  console.log(`[normalize-dev-dataset] tenant=${tenantId}`);

  const members = await prisma.member.findMany({
    where: { tenantId },
    select: { id: true, email: true, createdAt: true, name: true },
    orderBy: { createdAt: 'asc' },
  });

  const buckets = new Map<string, typeof members>();
  for (const m of members) {
    const raw = (m.email || '').trim().toLowerCase();
    if (!raw) continue;
    const list = buckets.get(raw) || [];
    list.push(m);
    buckets.set(raw, list);
  }

  let merged = 0;
  for (const [, list] of buckets) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const keeper = sorted[0]!;
    for (const dup of sorted.slice(1)) {
      console.log(`  merge duplicate email → keep ${keeper.name} (${keeper.id}), remove ${dup.name} (${dup.id})`);
      await mergeMemberPair(keeper.id, dup.id, tenantId);
      merged++;
    }
  }

  if (process.env.ENRICH_OPERATIONAL_DATA === '1') {
    await enrichOperationalDataset(tenantId);
    console.log('[normalize-dev-dataset] operational enrichment applied.');
  }

  console.log(`[normalize-dev-dataset] done. Merged ${merged} duplicate member row(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
