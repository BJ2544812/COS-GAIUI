import { prisma } from '../utils/prisma.js';
import { Prisma } from '@prisma/client';

export class SermonService {
  static async getSermons(tenantId: string, opts?: { publishedOnly?: boolean }) {
    return prisma.sermon.findMany({
      where: { tenantId, ...(opts?.publishedOnly ? { isPublished: true } : {}) },
      orderBy: { date: 'desc' }
    });
  }

  static async getSermonById(tenantId: string, id: string) {
    return prisma.sermon.findFirst({
      where: { tenantId, id }
    });
  }

  static async createSermon(tenantId: string, data: Omit<Prisma.SermonUncheckedCreateInput, 'tenantId'>) {
    return prisma.sermon.create({
      data: {
        ...data,
        tenantId
      }
    });
  }

  static async updateSermon(tenantId: string, id: string, data: Partial<Prisma.SermonUncheckedUpdateInput>) {
    const existing = await prisma.sermon.findFirst({ where: { tenantId, id } });
    if (!existing) throw new Error('Sermon not found');
    return prisma.sermon.update({
      where: { id },
      data,
    });
  }

  static async deleteSermon(tenantId: string, id: string) {
    const existing = await prisma.sermon.findFirst({ where: { tenantId, id } });
    if (!existing) throw new Error('Sermon not found');
    return prisma.sermon.delete({
      where: { id },
    });
  }
}
