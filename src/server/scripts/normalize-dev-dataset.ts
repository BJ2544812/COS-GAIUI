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

  console.log(`[normalize-dev-dataset] done. Merged ${merged} duplicate member row(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
