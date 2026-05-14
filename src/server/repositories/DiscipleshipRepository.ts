import { prisma } from '../utils/prisma.js';
import { Prisma } from '@prisma/client';

export class DiscipleshipRepository {
  static async createCareNote(tenantId: string, data: any) {
    return prisma.careNote.create({
      data: {
        note: data.note,
        date: data.date,
        authorId: data.authorId,
        tenant: { connect: { id: tenantId } },
        member: { connect: { id: data.memberId } }
      },
    });
  }

  static async getCareNotesByMember(tenantId: string, memberId: string) {
    return prisma.careNote.findMany({
      where: { tenantId, memberId },
      orderBy: { date: 'desc' },
    });
  }

  static async updateCareNote(tenantId: string, id: string, data: Prisma.CareNoteUpdateInput) {
    const note = await prisma.careNote.findFirst({ where: { id, tenantId } });
    if (!note) throw new Error('CareNote not found');
    return prisma.careNote.update({
      where: { id },
      data,
    });
  }

  static async deleteCareNote(tenantId: string, id: string) {
    const note = await prisma.careNote.findFirst({ where: { id, tenantId } });
    if (!note) throw new Error('CareNote not found');
    return prisma.careNote.delete({
      where: { id },
    });
  }
}
