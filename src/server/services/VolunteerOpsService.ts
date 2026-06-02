import { prisma } from '../utils/prisma.js';
import { MemberResponsibilityRepository } from '../repositories/MemberProfileRepository.js';
import { EventBus } from '../events/eventBus.js';
import { broadcastScoped } from '../realtime/socketHub.js';
import { RT } from '../utils/realtimeEvents.js';
import {
  tryAcquireOperationalLock,
  releaseOperationalLock,
  operationalLockKey,
} from '../utils/operationalLocks.js';

export class VolunteerOpsService {
  static async getVolunteerBoard(tenantId: string, eventId?: string, page = 1, pageSize = 25) {
    const where: { tenantId: string; entityType?: string; entityId?: string } = { tenantId };
    if (eventId) {
      where.entityType = 'Event';
      where.entityId = eventId;
    }

    const skip = Math.max(0, (page - 1) * pageSize);
    const take = Math.min(100, Math.max(1, pageSize));
    const [total, rows] = await Promise.all([
      prisma.memberResponsibility.count({ where }),
      prisma.memberResponsibility.findMany({
        where,
        include: {
          member: {
            select: { id: true, name: true, email: true, phone: true, profileImageUrl: true, growthStage: true },
          },
        },
        orderBy: [{ status: 'asc' }, { role: 'asc' }],
        skip,
        take,
      }),
    ]);

    const buckets = {
      assigned: [] as typeof rows,
      confirmed: [] as typeof rows,
      pending: [] as typeof rows,
      inactive: [] as typeof rows,
    };

    for (const r of rows) {
      if (r.status === 'Inactive') buckets.inactive.push(r);
      else if (r.status === 'Pending') buckets.pending.push(r);
      else if (r.status === 'Active') buckets.confirmed.push(r);
      else buckets.assigned.push(r);
    }

    return { rows, buckets, eventId: eventId ?? null, meta: { page, pageSize: take, total } };
  }

  static async reassignResponsibility(
    tenantId: string,
    memberId: string,
    responsibilityId: string,
    patch: { role?: string; status?: string; entityId?: string | null; entityType?: string },
    actorUserId?: string,
  ) {
    const lockKey = operationalLockKey(tenantId, 'responsibility', responsibilityId);
    const owner = actorUserId ?? memberId;
    if (!tryAcquireOperationalLock(lockKey, owner)) {
      throw new Error('Another operator is updating this assignment. Try again in a moment.');
    }
    try {
      return await VolunteerOpsService._reassignResponsibilityCore(
        tenantId,
        memberId,
        responsibilityId,
        patch,
        actorUserId,
        lockKey,
        owner,
      );
    } catch (e) {
      releaseOperationalLock(lockKey, owner);
      throw e;
    }
  }

  private static async _reassignResponsibilityCore(
    tenantId: string,
    memberId: string,
    responsibilityId: string,
    patch: { role?: string; status?: string; entityId?: string | null; entityType?: string },
    actorUserId: string | undefined,
    lockKey: string,
    owner: string,
  ) {
    const item = await MemberResponsibilityRepository.update(responsibilityId, memberId, patch as any);

    await EventBus.publish({
      eventName: 'VolunteerAssignmentChanged',
      tenantId,
      entityId: item.id,
      entityType: 'MemberResponsibility',
      payload: { memberId, role: item.role, entityType: item.entityType, entityId: item.entityId },
    });

    broadcastScoped(
      { tenantId, eventId: item.entityId ?? undefined },
      RT.VOLUNTEER_UPDATE,
      { responsibilityId: item.id, memberId, patch },
    );
    broadcastScoped({ tenantId }, RT.VOLUNTEER_UPDATE, { responsibilityId: item.id });
    broadcastScoped(
      { tenantId, eventId: item.entityId ?? undefined },
      RT.OPS_LOCK,
      { resource: 'responsibility', id: responsibilityId, released: true },
    );

    releaseOperationalLock(lockKey, owner);
    return item;
  }

  static async getVolunteerInsights(tenantId: string) {
    const rows = await prisma.memberResponsibility.findMany({
      where: { tenantId },
      select: { id: true, memberId: true, role: true, status: true, entityType: true },
    });

    const byMember = new Map<string, { active: number; pending: number; roles: Set<string> }>();
    for (const r of rows) {
      const cur = byMember.get(r.memberId) ?? { active: 0, pending: 0, roles: new Set<string>() };
      if (r.status === 'Active') cur.active += 1;
      if (r.status === 'Pending') cur.pending += 1;
      cur.roles.add(r.role);
      byMember.set(r.memberId, cur);
    }

    const overloaded = [...byMember.entries()]
      .filter(([, v]) => v.active >= 4)
      .map(([memberId, v]) => ({ memberId, activeAssignments: v.active, roleCount: v.roles.size }));

    const imbalance = rows.reduce<Record<string, number>>((acc, r) => {
      if (r.status === 'Active') acc[r.role] = (acc[r.role] ?? 0) + 1;
      return acc;
    }, {});

    const rolesSorted = Object.entries(imbalance).sort((a, b) => b[1] - a[1]);

    return {
      totalAssignments: rows.length,
      activeAssignments: rows.filter((r) => r.status === 'Active').length,
      pendingAssignments: rows.filter((r) => r.status === 'Pending').length,
      overloadedMembers: overloaded.slice(0, 10),
      roleDistribution: rolesSorted.slice(0, 12),
      shortageRoles: rolesSorted.filter(([, c]) => c < 2).map(([role]) => role),
    };
  }

  static async suggestSubstitutes(tenantId: string, role: string, excludeMemberId?: string) {
    const members = await prisma.member.findMany({
      where: {
        tenantId,
        status: 'Active',
        growthStage: { in: ['Volunteer', 'Leader', 'Member', 'Staff'] },
        ...(excludeMemberId ? { id: { not: excludeMemberId } } : {}),
      },
      select: { id: true, name: true, growthStage: true, role: true },
      take: 50,
    });

    const roleLower = role.toLowerCase();
    return members
      .filter((m) => {
        const mr = (m.role ?? '').toLowerCase();
        return mr.includes(roleLower) || roleLower.includes('volunteer') || m.growthStage === 'Volunteer';
      })
      .slice(0, 8);
  }
}
