import { prisma } from '../utils/prisma.js';
import { Prisma } from '@prisma/client';

export class MemberRepository {
  static async create(tenantId: string, data: Omit<Prisma.MemberCreateInput, 'tenant'>) {
    if (data.membershipDate && typeof data.membershipDate === 'string') {
      data.membershipDate = new Date(data.membershipDate).toISOString();
    }
    if (data.dob && typeof data.dob === 'string') {
      data.dob = new Date(data.dob).toISOString();
    }
    console.log('FINAL DATA TO PRISMA (CREATE):', data);
    return prisma.member.create({
      data: {
        ...data as any,
        tenant: { connect: { id: tenantId } },
      },
    });
  }

  static async findAll(tenantId: string) {
    return prisma.member.findMany({
      where: { tenantId },
      include: {
        family: true,
        smallGroupMembers: { include: { group: true } },
        memberResponsibilities: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findById(tenantId: string, id: string) {
    return prisma.member.findFirst({
      where: { id, tenantId },
      include: { 
        family: true,
        memberDocuments: true,
        spiritualMilestones: { orderBy: { date: 'desc' } },
        attendances: {
          include: { session: true }
        },
        careNotes: true,
        donations: {
          include: { campaign: true }
        },
        memberResponsibilities: { orderBy: { createdAt: 'desc' } },
        smallGroupMembers: { include: { group: true } }
      },
    });
  }

  static async update(tenantId: string, id: string, data: Prisma.MemberUpdateInput) {
    const member = await prisma.member.findFirst({ where: { id, tenantId } });
    if (!member) throw new Error('Member not found');
    if (data.membershipDate && typeof data.membershipDate === 'string') {
      data.membershipDate = new Date(data.membershipDate).toISOString();
    }
    if (data.dob && typeof data.dob === 'string') {
      data.dob = new Date(data.dob).toISOString();
    }
    console.log('FINAL DATA TO PRISMA (UPDATE):', data);
    await prisma.member.update({
      where: { id },
      data,
    });
    const full = await this.findById(tenantId, id);
    if (!full) throw new Error('Member not found after update');
    return full;
  }

  static async delete(tenantId: string, id: string) {
    const member = await prisma.member.findFirst({ where: { id, tenantId } });
    if (!member) throw new Error('Member not found');
    return prisma.member.delete({
      where: { id },
    });
  }
}
