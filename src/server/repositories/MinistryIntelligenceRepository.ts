import { prisma } from '../utils/prisma.js';
import { TaskStatus, TaskTargetType } from '@prisma/client';

const MS_DAY = 86_400_000;

export class MinistryIntelligenceRepository {
  static async listCampuses(tenantId: string) {
    return prisma.campus.findMany({
      where: { tenantId },
      select: { id: true, name: true, type: true },
      orderBy: { name: 'asc' },
    });
  }

  static async getVolunteerAssignments(tenantId: string) {
    return prisma.memberResponsibility.findMany({
      where: { tenantId },
      select: {
        id: true,
        memberId: true,
        role: true,
        status: true,
        entityType: true,
        entityId: true,
        startDate: true,
        endDate: true,
        notes: true,
        member: { select: { id: true, name: true, growthStage: true, status: true } },
      },
    });
  }

  static async getRecentServices(tenantId: string, days = 90, campusId?: string) {
    const since = new Date(Date.now() - days * MS_DAY);
    return prisma.event.findMany({
      where: {
        tenantId,
        type: 'Service',
        date: { gte: since },
        ...(campusId ? { campusId } : {}),
      },
      select: {
        id: true,
        name: true,
        date: true,
        status: true,
        campusId: true,
        runSheet: true,
        opsConfig: true,
        location: true,
      },
      orderBy: { date: 'desc' },
      take: 40,
    });
  }

  static async getRecentEvents(tenantId: string, days = 120, campusId?: string) {
    const since = new Date(Date.now() - days * MS_DAY);
    return prisma.event.findMany({
      where: {
        tenantId,
        type: { not: 'Service' },
        date: { gte: since },
        ...(campusId ? { campusId } : {}),
      },
      select: {
        id: true,
        name: true,
        date: true,
        status: true,
        campusId: true,
        registrationOpen: true,
        opsConfig: true,
      },
      orderBy: { date: 'desc' },
      take: 40,
    });
  }

  static async getAttendanceByMember(tenantId: string, since: Date) {
    return prisma.attendance.groupBy({
      by: ['memberId'],
      where: {
        tenantId,
        memberId: { not: null },
        checkInTime: { gte: since },
      },
      _count: { id: true },
    });
  }

  static async getSessionAttendanceTotals(tenantId: string, since: Date, campusId?: string) {
    return prisma.attendanceSession.findMany({
      where: {
        tenantId,
        date: { gte: since },
        ...(campusId ? { campusId } : {}),
      },
      select: {
        id: true,
        name: true,
        date: true,
        eventId: true,
        campusId: true,
        status: true,
        _count: { select: { attendances: true } },
      },
    });
  }

  static async getEngagementSnapshots(tenantId: string) {
    return prisma.memberEngagementSnapshot.findMany({
      where: { tenantId },
      orderBy: { calculatedAt: 'desc' },
      distinct: ['memberId'],
      take: 500,
      include: { member: { select: { id: true, name: true, growthStage: true, status: true } } },
    });
  }

  static async getMemberAttendanceTimeline(tenantId: string, memberId: string, limit = 30) {
    return prisma.attendance.findMany({
      where: { tenantId, memberId },
      orderBy: { checkInTime: 'desc' },
      take: limit,
      select: {
        id: true,
        checkInTime: true,
        method: true,
        session: { select: { id: true, name: true, type: true, eventId: true } },
      },
    });
  }

  static async getMemberResponsibilities(tenantId: string, memberId: string) {
    return prisma.memberResponsibility.findMany({
      where: { tenantId, memberId },
      orderBy: { startDate: 'desc' },
      take: 40,
    });
  }

  static async getMemberTasks(tenantId: string, memberId: string) {
    return prisma.task.findMany({
      where: {
        tenantId,
        targetType: TaskTargetType.MEMBER,
        targetId: memberId,
      },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });
  }

  static async getFailedDomainEvents(tenantId: string, limit = 30) {
    return prisma.eventLog.findMany({
      where: { tenantId, status: 'FAILED' },
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });
  }

  static async getOpenFollowUpTasks(tenantId: string) {
    return prisma.task.findMany({
      where: {
        tenantId,
        status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
        OR: [
          { title: { contains: 'follow', mode: 'insensitive' } },
          { title: { contains: 'guest', mode: 'insensitive' } },
          { title: { contains: 'absent', mode: 'insensitive' } },
        ],
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: 40,
    });
  }

  static async getMembersWithLowAttendance(tenantId: string, since: Date, maxCount = 1) {
    const activeMembers = await prisma.member.findMany({
      where: { tenantId, status: 'Active', growthStage: { in: ['Member', 'Volunteer', 'Leader'] } },
      select: { id: true, name: true, growthStage: true },
      take: 300,
    });
    const counts = await this.getAttendanceByMember(tenantId, since);
    const countMap = new Map(counts.map((c) => [c.memberId!, c._count.id]));
    return activeMembers
      .filter((m) => (countMap.get(m.id) ?? 0) <= maxCount)
      .map((m) => ({ ...m, attendanceCount: countMap.get(m.id) ?? 0 }));
  }

  static async getEventVolunteerCounts(tenantId: string, eventIds: string[]) {
    if (eventIds.length === 0) return [];
    return prisma.memberResponsibility.groupBy({
      by: ['entityId'],
      where: {
        tenantId,
        entityType: 'Event',
        entityId: { in: eventIds },
        status: 'Active',
      },
      _count: { id: true },
    });
  }

  static async getDonationsForEvents(tenantId: string, since: Date) {
    return prisma.donation.groupBy({
      by: ['eventId'],
      where: {
        tenantId,
        eventId: { not: null },
        createdAt: { gte: since },
      },
      _sum: { amount: true },
      _count: { id: true },
    });
  }
}
