import { prisma } from '../utils/prisma.js';
import { Prisma } from '@prisma/client';

export class AttendanceRepository {
  // Session Methods
  static async createSession(tenantId: string, data: Prisma.AttendanceSessionUncheckedCreateInput) {
    return prisma.attendanceSession.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  static async getSessions(tenantId: string) {
    return prisma.attendanceSession.findMany({
      where: { tenantId },
      include: { 
        campus: true, 
        event: true,
        _count: { select: { attendances: true } }
      },
      orderBy: { date: 'desc' },
    });
  }

  static async getSessionById(tenantId: string, id: string) {
    return prisma.attendanceSession.findFirst({
      where: { id, tenantId },
      include: { 
        campus: true, 
        event: true,
        attendances: {
          include: { member: true }
        }
      },
    });
  }

  static async updateSession(tenantId: string, id: string, data: Prisma.AttendanceSessionUpdateInput) {
    return prisma.attendanceSession.update({
      where: { id },
      data,
    });
  }

  // Attendance Record Methods
  static async recordAttendance(tenantId: string, data: Prisma.AttendanceUncheckedCreateInput) {
    // Prevent duplicate member check-ins in the same session
    if (data.memberId) {
      const existing = await prisma.attendance.findFirst({
        where: {
          tenantId,
          sessionId: data.sessionId,
          memberId: data.memberId
        }
      });
      if (existing) {
        // Update status if provided, or just return existing
        return prisma.attendance.update({
          where: { id: existing.id },
          data: {
            status: data.status || existing.status,
            method: data.method || existing.method,
            notes: data.notes || existing.notes
          },
          include: { member: true }
        });
      }
    }

    return prisma.attendance.create({
      data: {
        ...data,
        tenantId,
      },
      include: { member: true }
    });
  }

  static async getRecordsBySession(tenantId: string, sessionId: string) {
    return prisma.attendance.findMany({
      where: { tenantId, sessionId },
      include: { member: true },
      orderBy: { checkInTime: 'desc' },
    });
  }

  static async findByEvent(tenantId: string, eventId: string) {
    return prisma.attendance.findMany({
      where: { 
        tenantId,
        session: { eventId }
      },
      include: { member: true, session: true },
    });
  }

  static async getMetrics(tenantId: string) {
    const sessions = await prisma.attendanceSession.findMany({
      where: { tenantId },
      include: { _count: { select: { attendances: true } } },
      orderBy: { date: 'desc' },
      take: 7
    });

    const totalRecords = await prisma.attendance.count({ where: { tenantId } });
    const membersCount = await prisma.attendance.count({
      where: { tenantId, memberId: { not: null } }
    });
    const visitorsCount = await prisma.attendance.count({
      where: { tenantId, memberId: null }
    });

    // Unique members who attended in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const uniqueActiveMembers = await prisma.attendance.groupBy({
      by: ['memberId'],
      where: {
        tenantId,
        memberId: { not: null },
        checkInTime: { gte: thirtyDaysAgo }
      },
      _count: true
    });

    return {
      totalAttendances: totalRecords,
      memberParticipation: membersCount,
      visitorConversion: visitorsCount,
      activeMembers30d: uniqueActiveMembers.length,
      recentVelocity: sessions.map(s => ({
        name: s.name,
        date: s.date,
        count: s._count.attendances
      })).reverse()
    };
  }
}
