import { prisma } from '../utils/prisma.js';
import { EventBus } from '../events/eventBus.js';
import { TaskPriority, ConfidentialityLevel } from '@prisma/client';

const PASTORAL_VISIBILITY: ConfidentialityLevel[] = ['PASTORAL', 'SENIOR_PASTORAL', 'RESTRICTED'];

export class PrayerCareService {
  static async listPrayerRequests(
    tenantId: string,
    opts: { includeConfidential?: boolean; assignedUserId?: string } = {},
  ) {
    const where: Record<string, unknown> = { tenantId, status: { not: 'Archived' } };
    if (!opts.includeConfidential) {
      where.visibility = { in: ['PUBLIC', 'GROUP'] as ConfidentialityLevel[] };
    }
    if (opts.assignedUserId) where.assignedUserId = opts.assignedUserId;

    return prisma.prayerRequest.findMany({
      where,
      orderBy: [{ urgency: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      include: {
        requester: { select: { id: true, name: true } },
      },
    });
  }

  static async createPrayerRequest(
    tenantId: string,
    input: {
      content: string;
      requesterId?: string | null;
      visibility?: ConfidentialityLevel;
      urgency?: TaskPriority;
      category?: string;
      createdById?: string;
      needsFollowUp?: boolean;
    },
  ) {
    const text = input.content.trim();
    if (!text) throw new Error('Prayer request text is required');

    const visibility: ConfidentialityLevel = input.visibility
      ?? (input.needsFollowUp ? 'PASTORAL' : 'PUBLIC');

    return prisma.prayerRequest.create({
      data: {
        tenantId,
        requesterId: input.requesterId ?? null,
        content: text,
        visibility,
        status: 'Active',
        urgency: input.urgency ?? 'MEDIUM',
        category: input.category ?? 'general',
        createdById: input.createdById ?? null,
      },
      include: {
        requester: { select: { id: true, name: true } },
      },
    });
  }

  static async assignPrayer(
    tenantId: string,
    prayerId: string,
    assignedUserId: string,
    actorUserId?: string,
  ) {
    const prayer = await prisma.prayerRequest.update({
      where: { id: prayerId },
      data: { assignedUserId, status: 'Assigned' },
    });
    if (prayer.tenantId !== tenantId) throw new Error('Not found');

    await EventBus.publish({
      eventName: 'PrayerRequestAssigned',
      tenantId,
      entityId: prayerId,
      entityType: 'PrayerRequest',
      payload: { assignedUserId, actorUserId },
    });

    const { NotificationService } = await import('./NotificationService.js');
    await NotificationService.createNotification({
      tenantId,
      userId: assignedUserId,
      type: 'PrayerAssignment',
      title: 'Prayer request assigned',
      message: 'A pastoral prayer request has been assigned to you.',
      targetRole: 'Pastoral',
      priority: prayer.urgency === 'HIGH' || prayer.urgency === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
      actionType: 'VIEW_MODULE',
      actionLink: 'communication',
    });

    return prayer;
  }

  static async updatePrayer(
    tenantId: string,
    prayerId: string,
    patch: {
      status?: string;
      urgency?: TaskPriority;
      category?: string;
      testimony?: string;
      visibility?: ConfidentialityLevel;
    },
  ) {
    const existing = await prisma.prayerRequest.findFirst({ where: { id: prayerId, tenantId } });
    if (!existing) throw new Error('Prayer request not found');
    return prisma.prayerRequest.update({
      where: { id: prayerId },
      data: patch,
    });
  }

  static async getCareDashboard(tenantId: string) {
    const [openCases, prayerActive, prayerUrgent, recentLogs] = await Promise.all([
      prisma.careCase.count({ where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.prayerRequest.count({ where: { tenantId, status: { in: ['Active', 'Assigned'] } } }),
      prisma.prayerRequest.count({
        where: {
          tenantId,
          urgency: { in: ['HIGH', 'CRITICAL'] },
          status: { in: ['Active', 'Assigned'] },
        },
      }),
      prisma.careLog.findMany({
        where: { tenantId },
        orderBy: { date: 'desc' },
        take: 15,
        include: {
          careCase: {
            select: {
              category: true,
              member: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    const pastoralPrayers = await prisma.prayerRequest.findMany({
      where: {
        tenantId,
        visibility: { in: PASTORAL_VISIBILITY },
        status: { in: ['Active', 'Assigned'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      stats: { openCases, prayerActive, prayerUrgent },
      pastoralPrayers,
      recentLogs,
    };
  }

  static canViewPrayer(
    visibility: ConfidentialityLevel,
    userRole: string,
    isAssignee: boolean,
  ): boolean {
    if (visibility === 'PUBLIC' || visibility === 'GROUP') return true;
    if (isAssignee) return true;
    const role = userRole.toLowerCase();
    if (visibility === 'PASTORAL') return role.includes('pastor') || role.includes('admin');
    if (visibility === 'SENIOR_PASTORAL' || visibility === 'RESTRICTED') {
      return role.includes('admin') || role.includes('senior');
    }
    return false;
  }
}
