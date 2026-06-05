import { prisma } from '../utils/prisma.js';
import { EventBus } from '../events/eventBus.js';
import { TaskPriority, ConfidentialityLevel } from '@prisma/client';

const PASTORAL_VISIBILITY: ConfidentialityLevel[] = ['PASTORAL', 'SENIOR_PASTORAL', 'RESTRICTED'];

export const PRAYER_STATUSES = [
  'OPEN',
  'IN_PRAYER',
  'FOLLOW_UP',
  'ANSWERED',
  'CLOSED',
  'ARCHIVED',
] as const;

export type PrayerStatus = (typeof PRAYER_STATUSES)[number];

const ACTIVE_STATUSES: PrayerStatus[] = ['OPEN', 'IN_PRAYER', 'FOLLOW_UP', 'ANSWERED'];

function deriveTitle(content: string, title?: string | null): string {
  const t = title?.trim();
  if (t) return t.slice(0, 120);
  const line = content.trim().split(/\n/)[0]?.trim() || 'Prayer request';
  return line.length > 120 ? `${line.slice(0, 117)}...` : line;
}

async function logActivity(
  tenantId: string,
  prayerRequestId: string,
  actionType: string,
  message: string,
  actorUserId?: string | null,
) {
  return prisma.prayerRequestActivity.create({
    data: {
      tenantId,
      prayerRequestId,
      actionType,
      message,
      actorUserId: actorUserId ?? null,
    },
  });
}

export class PrayerCareService {
  static async listPrayerRequests(
    tenantId: string,
    opts: { includeConfidential?: boolean; assignedUserId?: string; includeClosed?: boolean } = {},
  ) {
    const where: Record<string, unknown> = { tenantId };
    if (!opts.includeClosed) {
      where.status = { in: ACTIVE_STATUSES };
    } else {
      where.status = { not: 'ARCHIVED' };
    }
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
        createdBy: { select: { id: true, username: true } },
        activities: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    });
  }

  static async getPrayerRequest(tenantId: string, prayerId: string) {
    const prayer = await prisma.prayerRequest.findFirst({
      where: { id: prayerId, tenantId },
      include: {
        requester: { select: { id: true, name: true } },
        createdBy: { select: { id: true, username: true } },
        activities: {
          orderBy: { createdAt: 'asc' },
          include: { actor: { select: { id: true, username: true } } },
        },
      },
    });
    if (!prayer) throw new Error('Prayer request not found');
    return prayer;
  }

  static async createPrayerRequest(
    tenantId: string,
    input: {
      title?: string | null;
      content: string;
      requesterId?: string | null;
      visibility?: ConfidentialityLevel;
      urgency?: TaskPriority;
      category?: string;
      createdById?: string;
      needsFollowUp?: boolean;
      assignedUserId?: string | null;
    },
  ) {
    const text = input.content.trim();
    if (!text) throw new Error('Prayer request text is required');

    const visibility: ConfidentialityLevel = input.visibility
      ?? (input.needsFollowUp ? 'PASTORAL' : 'PUBLIC');

    const status: PrayerStatus = input.needsFollowUp ? 'FOLLOW_UP' : 'OPEN';

    const prayer = await prisma.prayerRequest.create({
      data: {
        tenantId,
        requesterId: input.requesterId ?? null,
        title: deriveTitle(text, input.title),
        content: text,
        visibility,
        status,
        urgency: input.urgency ?? 'MEDIUM',
        category: input.category ?? 'general',
        createdById: input.createdById ?? null,
        assignedUserId: input.assignedUserId ?? null,
      },
      include: {
        requester: { select: { id: true, name: true } },
        createdBy: { select: { id: true, username: true } },
      },
    });

    await logActivity(tenantId, prayer.id, 'CREATED', 'Prayer request created', input.createdById);
    if (input.assignedUserId) {
      await logActivity(
        tenantId,
        prayer.id,
        'ASSIGNED',
        'Prayer request assigned on creation',
        input.createdById,
      );
    }

    return prayer;
  }

  static async assignPrayer(
    tenantId: string,
    prayerId: string,
    assignedUserId: string,
    actorUserId?: string,
  ) {
    const existing = await prisma.prayerRequest.findFirst({ where: { id: prayerId, tenantId } });
    if (!existing) throw new Error('Prayer request not found');

    const prayer = await prisma.prayerRequest.update({
      where: { id: prayerId },
      data: { assignedUserId, status: 'IN_PRAYER' },
    });

    await logActivity(tenantId, prayerId, 'ASSIGNED', 'Assigned to pastoral team member', actorUserId);

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
      actionLink: 'discipleship',
    });

    return prayer;
  }

  static async updatePrayer(
    tenantId: string,
    prayerId: string,
    patch: {
      title?: string | null;
      content?: string;
      status?: string;
      urgency?: TaskPriority;
      category?: string;
      testimony?: string | null;
      followUpNotes?: string | null;
      visibility?: ConfidentialityLevel;
    },
    actorUserId?: string,
  ) {
    const existing = await prisma.prayerRequest.findFirst({ where: { id: prayerId, tenantId } });
    if (!existing) throw new Error('Prayer request not found');

    const data: Record<string, unknown> = { ...patch };
    if (patch.content) data.title = deriveTitle(patch.content, patch.title ?? existing.title);

    const prayer = await prisma.prayerRequest.update({
      where: { id: prayerId },
      data: data as any,
    });

    if (patch.status && patch.status !== existing.status) {
      await logActivity(
        tenantId,
        prayerId,
        'STATUS_CHANGED',
        `Status changed to ${patch.status}`,
        actorUserId,
      );
    } else {
      await logActivity(tenantId, prayerId, 'UPDATED', 'Prayer request updated', actorUserId);
    }

    return prayer;
  }

  static async addFollowUpNote(
    tenantId: string,
    prayerId: string,
    note: string,
    actorUserId?: string,
  ) {
    const existing = await prisma.prayerRequest.findFirst({ where: { id: prayerId, tenantId } });
    if (!existing) throw new Error('Prayer request not found');
    const trimmed = note.trim();
    if (!trimmed) throw new Error('Follow-up note is required');

    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const merged = [existing.followUpNotes, `[${stamp}] ${trimmed}`].filter(Boolean).join('\n');

    const prayer = await prisma.prayerRequest.update({
      where: { id: prayerId },
      data: {
        followUpNotes: merged,
        status: existing.status === 'OPEN' ? 'FOLLOW_UP' : existing.status,
      },
    });

    await logActivity(tenantId, prayerId, 'FOLLOW_UP', trimmed, actorUserId);
    return prayer;
  }

  static async markAnswered(
    tenantId: string,
    prayerId: string,
    testimony: string,
    actorUserId?: string,
  ) {
    const testimonyText = testimony.trim();
    if (!testimonyText) throw new Error('Answered testimony is required');

    const prayer = await prisma.prayerRequest.update({
      where: { id: prayerId },
      data: { status: 'ANSWERED', testimony: testimonyText },
    });
    if (prayer.tenantId !== tenantId) throw new Error('Not found');

    await logActivity(tenantId, prayerId, 'ANSWERED', testimonyText, actorUserId);
    return prayer;
  }

  static async closePrayer(tenantId: string, prayerId: string, actorUserId?: string) {
    const prayer = await prisma.prayerRequest.update({
      where: { id: prayerId },
      data: { status: 'CLOSED' },
    });
    if (prayer.tenantId !== tenantId) throw new Error('Not found');
    await logActivity(tenantId, prayerId, 'CLOSED', 'Prayer request closed', actorUserId);
    return prayer;
  }

  static async archivePrayer(tenantId: string, prayerId: string, actorUserId?: string) {
    const prayer = await prisma.prayerRequest.update({
      where: { id: prayerId },
      data: { status: 'ARCHIVED' },
    });
    if (prayer.tenantId !== tenantId) throw new Error('Not found');
    await logActivity(tenantId, prayerId, 'ARCHIVED', 'Prayer request archived', actorUserId);
    return prayer;
  }

  static async getCareDashboard(tenantId: string) {
    const [openCases, prayerActive, prayerUrgent, recentLogs] = await Promise.all([
      prisma.careCase.count({ where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.prayerRequest.count({ where: { tenantId, status: { in: ACTIVE_STATUSES } } }),
      prisma.prayerRequest.count({
        where: {
          tenantId,
          urgency: { in: ['HIGH', 'CRITICAL'] },
          status: { in: ACTIVE_STATUSES },
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
        status: { in: ACTIVE_STATUSES },
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
