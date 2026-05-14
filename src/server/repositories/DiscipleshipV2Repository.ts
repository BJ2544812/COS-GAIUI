import { prisma } from '../utils/prisma.js';
import { Prisma, TaskStatus, CareCaseStatus, ConfidentialityLevel } from '@prisma/client';

export class DiscipleshipV2Repository {
  // --- Task Engine ---
  static async createTask(tenantId: string, data: Prisma.TaskUncheckedCreateInput) {
    return prisma.task.create({
      data: {
        ...data,
        tenantId,
      },
    });
  }

  static async getTaskById(tenantId: string, taskId: string) {
    return prisma.task.findFirst({
      where: { id: taskId, tenantId },
    });
  }

  static async findVisibleTasks(tenantId: string, assignedUserId?: string) {
    const where: Prisma.TaskWhereInput = { tenantId };
    if (assignedUserId) where.assignedUserId = assignedUserId;

    return prisma.task.findMany({
      where,
      orderBy: { dueDate: 'asc' },
    });
  }

  static async updateTask(tenantId: string, id: string, data: Prisma.TaskUncheckedUpdateInput) {
    const task = await prisma.task.findFirst({ where: { id, tenantId } });
    if (!task) throw new Error('Task not found');
    
    return prisma.task.update({
      where: { id },
      data,
    });
  }

  // --- Care System ---
  static async createCareCase(tenantId: string, memberId: string, data: Omit<Prisma.CareCaseUncheckedCreateInput, 'tenantId' | 'memberId'>) {
    return prisma.careCase.create({
      data: {
        ...data,
        memberId,
        tenantId,
      },
    });
  }

  static async getCareCaseById(tenantId: string, caseId: string) {
    return prisma.careCase.findFirst({
      where: { id: caseId, tenantId },
      include: {
        member: { select: { id: true, name: true, profileImageUrl: true } },
        assignedUser: { select: { id: true, username: true } },
        logs: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  static async updateCareCase(tenantId: string, id: string, data: Prisma.CareCaseUncheckedUpdateInput) {
    const careCase = await prisma.careCase.findFirst({ where: { id, tenantId } });
    if (!careCase) throw new Error('CareCase not found');
    
    return prisma.careCase.update({
      where: { id },
      data,
    });
  }

  /**
   * Enforces visibility rules at the repository layer.
   */
  static async findVisibleCareCases(tenantId: string, allowedLevels: ConfidentialityLevel[], assignedUserId?: string) {
    const where: Prisma.CareCaseWhereInput = { 
      tenantId,
      confidentialityLevel: { in: allowedLevels }
    };
    
    // If user is restricted to seeing only their own assignments, we could apply that logic here.
    if (assignedUserId) {
      where.assignedUserId = assignedUserId;
    }

    return prisma.careCase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        member: { select: { id: true, name: true, profileImageUrl: true } },
        assignedUser: { select: { id: true, username: true } },
        logs: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  static async createCareLog(tenantId: string, careCaseId: string, data: Omit<Prisma.CareLogUncheckedCreateInput, 'tenantId' | 'careCaseId'>) {
    return prisma.careLog.create({
      data: {
        ...data,
        careCaseId,
        tenantId,
      },
    });
  }

  // --- Mentorship ---
  static async createMentorship(tenantId: string, mentorId: string, discipleId: string, data: Partial<Prisma.MentorshipUncheckedCreateInput> = {}) {
    return prisma.mentorship.create({
      data: {
        status: 'Active',
        startDate: new Date(),
        ...data,
        mentorId,
        discipleId,
        tenantId,
      },
    });
  }

  static async getMentorshipById(tenantId: string, mentorshipId: string) {
    return prisma.mentorship.findFirst({
      where: { id: mentorshipId, tenantId },
    });
  }

  static async updateMentorship(tenantId: string, id: string, data: Prisma.MentorshipUncheckedUpdateInput) {
    const mentorship = await prisma.mentorship.findFirst({ where: { id, tenantId } });
    if (!mentorship) throw new Error('Mentorship not found');
    return prisma.mentorship.update({
      where: { id },
      data,
    });
  }

  static async getMentorships(tenantId: string, memberId: string) {
    return prisma.mentorship.findMany({
      where: {
        tenantId,
        OR: [
          { mentorId: memberId },
          { discipleId: memberId }
        ]
      },
      include: {
        mentor: { select: { id: true, name: true } },
        disciple: { select: { id: true, name: true } }
      }
    });
  }
}
