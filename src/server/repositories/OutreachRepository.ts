import { prisma } from '../utils/prisma.js';
import { Prisma } from '@prisma/client';

export class OutreachRepository {
  static async createContact(tenantId: string, data: Prisma.ContactCreateInput) {
    return prisma.contact.create({
      data: {
        ...data,
        tenant: { connect: { id: tenantId } },
      },
    });
  }

  static async getContacts(tenantId: string) {
    return prisma.contact.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
  }

  static async updateContact(tenantId: string, id: string, data: Prisma.ContactUpdateInput) {
    return prisma.contact.update({
      where: { id },
      data,
    });
  }

  static async deleteContact(tenantId: string, id: string) {
    return prisma.contact.delete({
      where: { id },
    });
  }
}
