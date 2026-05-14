import { prisma } from '../utils/prisma.js';
import { Prisma } from '@prisma/client';

export class DocumentRepository {
  static async createDocument(tenantId: string, data: Prisma.DocumentCreateInput) {
    return prisma.document.create({
      data: {
        ...data,
        tenant: { connect: { id: tenantId } },
      },
    });
  }

  static async getDocuments(tenantId: string) {
    return prisma.document.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  static async deleteDocument(tenantId: string, id: string) {
    return prisma.document.delete({
      where: { id },
    });
  }
}
