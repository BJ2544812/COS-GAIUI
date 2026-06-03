import { prisma } from '../utils/prisma.js';
import { Prisma } from '@prisma/client';

export class EventRepository {
  static async create(tenantId: string, data: Prisma.EventCreateInput) {
    return prisma.event.create({
      data: {
        ...data,
        tenant: { connect: { id: tenantId } },
      },
    });
  }

  static async findAll(tenantId: string) {
    return prisma.event.findMany({
      where: { tenantId },
      include: {
        campus: true,
        attendanceSessions: { select: { id: true, _count: { select: { attendances: true } } } },
      },
      orderBy: { date: 'desc' },
    });
  }

  /** Candidates for public website (filtered by published flag in service layer). */
  static async findPublishedForWebsite(tenantId: string, take = 60) {
    return prisma.event.findMany({
      where: {
        tenantId,
        status: { notIn: ['CANCELLED', 'ARCHIVED'] },
      },
      include: { campus: true },
      orderBy: { date: 'asc' },
      take,
    });
  }

  static async findById(tenantId: string, id: string) {
    return prisma.event.findFirst({
      where: { id, tenantId },
      include: {
        campus: true,
        attendanceSessions: {
          orderBy: { date: 'desc' },
          include: { _count: { select: { attendances: true } } },
        },
      },
    });
  }

  static async findResponsibilitiesForEvent(tenantId: string, eventId: string) {
    return prisma.memberResponsibility.findMany({
      where: { tenantId, entityType: 'Event', entityId: eventId },
      include: { member: { select: { id: true, name: true, email: true, phone: true, profileImageUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async update(tenantId: string, id: string, data: Prisma.EventUpdateInput) {
    const event = await prisma.event.findFirst({ where: { id, tenantId } });
    if (!event) throw new Error('Event not found');
    return prisma.event.update({
      where: { id },
      data,
    });
  }

  static async delete(tenantId: string, id: string) {
    const event = await prisma.event.findFirst({ where: { id, tenantId } });
    if (!event) throw new Error('Event not found');
    return prisma.event.delete({
      where: { id },
    });
  }
}
