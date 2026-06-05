import { prisma } from '../utils/prisma.js';
import { TaskStatus } from '@prisma/client';

function campusWhere(campusId?: string) {
  return campusId ? { campusId } : {};
}

export class OperationsRepository {
  static async getUpcomingEvents(tenantId: string, limit = 12, campusId?: string) {
    const now = new Date();
    return prisma.event.findMany({
      where: { tenantId, ...campusWhere(campusId), date: { gte: new Date(now.getTime() - 86400000) } },
      include: {
        attendanceSessions: { select: { id: true, status: true } },
      },
      orderBy: { date: 'asc' },
      take: limit,
    });
  }

  static async getTodayServices(tenantId: string, campusId?: string) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return prisma.event.findMany({
      where: {
        tenantId,
        ...campusWhere(campusId),
        type: 'Service',
        date: { gte: start, lt: end },
      },
      orderBy: { date: 'asc' },
    });
  }

  static async countEventVolunteers(tenantId: string, eventId: string) {
    return prisma.memberResponsibility.count({
      where: { tenantId, entityType: 'Event', entityId: eventId, status: 'Active' },
    });
  }

  static async getVolunteerGaps(tenantId: string, minVolunteers = 2, campusId?: string) {
    const events = await prisma.event.findMany({
      where: {
        tenantId,
        ...campusWhere(campusId),
        status: { in: ['APPROVED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ACTIVE'] },
        date: { gte: new Date() },
      },
      orderBy: { date: 'asc' },
      take: 20,
    });
    const gaps: Array<{ eventId: string; name: string; date: Date; count: number }> = [];
    for (const ev of events) {
      const count = await this.countEventVolunteers(tenantId, ev.id);
      if (count < minVolunteers) {
        gaps.push({ eventId: ev.id, name: ev.name, date: ev.date, count });
      }
    }
    return gaps;
  }

  static async getOperationalTasks(tenantId: string, userId: string) {
    return prisma.task.findMany({
      where: {
        tenantId,
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
        OR: [{ assignedUserId: userId }, { createdById: userId }],
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      take: 40,
    });
  }

  static async getTeamTasks(tenantId: string) {
    return prisma.task.findMany({
      where: {
        tenantId,
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
      },
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
      take: 50,
    });
  }

  static async getOverdueTasks(tenantId: string) {
    return prisma.task.findMany({
      where: {
        tenantId,
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
        dueDate: { lt: new Date() },
      },
      orderBy: { dueDate: 'asc' },
      take: 30,
    });
  }

  static async getRecentDomainActivity(tenantId: string, limit = 25) {
    return prisma.eventLog.findMany({
      where: { tenantId },
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });
  }

  static async getOpenAttendanceSessions(tenantId: string) {
    return prisma.attendanceSession.findMany({
      where: { tenantId, status: 'OPEN' },
      include: { event: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
      take: 10,
    });
  }

  static async getUnreadNotificationCount(tenantId: string, userId: string, userRole: string) {
    return prisma.notification.count({
      where: {
        tenantId,
        status: 'unread',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
        AND: [
          {
            OR: [
              { userId },
              { targetRole: { equals: userRole, mode: 'insensitive' } },
              { targetRole: 'All' },
            ],
          },
        ],
      },
    });
  }

  static async getRecentNotifications(tenantId: string, userId: string, userRole: string, take = 15) {
    return prisma.notification.findMany({
      where: {
        tenantId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        AND: [
          {
            OR: [
              { userId },
              { targetRole: { equals: userRole, mode: 'insensitive' } },
              { targetRole: 'All' },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  static async getEventResponsibilitySummary(tenantId: string) {
    return prisma.memberResponsibility.groupBy({
      by: ['entityId', 'status'],
      where: { tenantId, entityType: 'Event', entityId: { not: null } },
      _count: { id: true },
    });
  }
}
