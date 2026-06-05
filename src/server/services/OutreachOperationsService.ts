import { prisma } from '../utils/prisma.js';
import { EventBus } from '../events/eventBus.js';
import { TaskTargetType } from '@prisma/client';

export class OutreachOperationsService {
  static async registerVisitor(
    tenantId: string,
    data: {
      name: string;
      email?: string;
      phone?: string;
      source?: string;
      assignedUserId?: string;
    },
  ) {
    const email = data.email?.trim() || null;
    const phone = data.phone?.trim() || null;

    let existing = await prisma.contact.findFirst({
      where: {
        tenantId,
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
          { name: data.name.trim() },
        ],
      },
    });

    if (existing) {
      existing = await prisma.contact.update({
        where: { id: existing.id },
        data: {
          visitCount: { increment: 1 },
          lastVisitAt: new Date(),
          isFirstVisit: false,
          status: existing.status === 'Converted' ? 'Converted' : 'Contacted',
        },
      });
      await this.ensureFollowUp(tenantId, {
        contactId: existing.id,
        type: 'repeat_visit',
        assignedUserId: data.assignedUserId,
        dueDate: new Date(Date.now() + 2 * 86400000),
        notes: `Repeat visit #${existing.visitCount}`,
      });
    } else {
      existing = await prisma.contact.create({
        data: {
          tenantId,
          name: data.name.trim(),
          email,
          phone,
          source: data.source ?? 'Sunday',
          assignedUserId: data.assignedUserId ?? null,
          isFirstVisit: true,
          lastVisitAt: new Date(),
          visitCount: 1,
        },
      });
      await this.ensureFollowUp(tenantId, {
        contactId: existing.id,
        type: 'first_visit',
        assignedUserId: data.assignedUserId,
        dueDate: new Date(Date.now() + 86400000),
        notes: 'First-time guest follow-up',
      });
      await EventBus.publish({
        eventName: 'VisitorRegistered',
        tenantId,
        entityId: existing.id,
        entityType: 'Contact',
        payload: { name: existing.name, source: existing.source },
      });
    }

    return existing;
  }

  static async ensureFollowUp(
    tenantId: string,
    data: {
      contactId?: string;
      memberId?: string;
      type: string;
      assignedUserId?: string;
      dueDate?: Date;
      notes?: string;
    },
  ) {
    const open = await prisma.outreachFollowUp.findFirst({
      where: {
        tenantId,
        contactId: data.contactId ?? undefined,
        memberId: data.memberId ?? undefined,
        type: data.type,
        status: { in: ['pending', 'in_progress'] },
      },
    });
    if (open) return open;

    const row = await prisma.outreachFollowUp.create({
      data: {
        tenantId,
        contactId: data.contactId ?? null,
        memberId: data.memberId ?? null,
        type: data.type,
        assignedUserId: data.assignedUserId ?? null,
        dueDate: data.dueDate ?? new Date(Date.now() + 3 * 86400000),
        notes: data.notes ?? null,
      },
    });

    if (data.assignedUserId && data.memberId) {
      await prisma.task.create({
        data: {
          tenantId,
          title: `Follow-up: ${data.type.replace(/_/g, ' ')}`,
          description: data.notes,
          assignedUserId: data.assignedUserId,
          targetType: TaskTargetType.MEMBER,
          targetId: data.memberId,
          dueDate: data.dueDate,
          status: 'PENDING',
          priority: 'MEDIUM',
        },
      });
    }

    return row;
  }

  static async getDashboard(tenantId: string) {
    const now = new Date();
    const [visitors, pending, overdue, completed30, contacts] = await Promise.all([
      prisma.contact.count({ where: { tenantId, isFirstVisit: true, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } } }),
      prisma.outreachFollowUp.count({ where: { tenantId, status: 'pending' } }),
      prisma.outreachFollowUp.count({
        where: { tenantId, status: { in: ['pending', 'in_progress'] }, dueDate: { lt: now } },
      }),
      prisma.outreachFollowUp.count({
        where: { tenantId, status: 'completed', completedAt: { gte: new Date(Date.now() - 30 * 86400000) } },
      }),
      prisma.contact.findMany({
        where: { tenantId },
        orderBy: { lastVisitAt: 'desc' },
        take: 25,
      }),
    ]);

    const followUps = await prisma.outreachFollowUp.findMany({
      where: { tenantId, status: { in: ['pending', 'in_progress'] } },
      orderBy: { dueDate: 'asc' },
      take: 30,
      include: { contact: { select: { name: true, email: true } } },
    });

    return {
      stats: { newVisitors30d: visitors, pending, overdue, completed30d: completed30 },
      contacts,
      followUps,
    };
  }

  static async completeFollowUp(tenantId: string, id: string, notes?: string) {
    const row = await prisma.outreachFollowUp.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        notes: notes ?? undefined,
      },
    });
    if (row.contactId) {
      await prisma.contact.updateMany({
        where: { id: row.contactId, tenantId },
        data: { status: 'Contacted' },
      });
    }
    await EventBus.publish({
      eventName: 'FollowUpCompleted',
      tenantId,
      entityId: id,
      entityType: 'OutreachFollowUp',
      payload: { type: row.type },
    });
    return row;
  }

  static async createMissedAttendanceFollowUps(tenantId: string, daysAbsent = 21) {
    const since = new Date(Date.now() - daysAbsent * 86400000);
    const activeMembers = await prisma.member.findMany({
      where: { tenantId, status: 'Active' },
      select: { id: true, name: true },
      take: 500,
    });
    let created = 0;
    for (const m of activeMembers) {
      const last = await prisma.attendance.findFirst({
        where: { tenantId, memberId: m.id },
        orderBy: { checkInTime: 'desc' },
      });
      if (last && last.checkInTime >= since) continue;
      await this.ensureFollowUp(tenantId, {
        memberId: m.id,
        type: 'missed_attendance',
        dueDate: new Date(Date.now() + 86400000),
        notes: `${m.name} — no check-in for ${daysAbsent}+ days`,
      });
      created += 1;
    }
    return { created };
  }
}
