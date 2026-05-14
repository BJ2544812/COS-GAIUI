import { OutreachRepository } from '../repositories/OutreachRepository.js';
import { Prisma } from '@prisma/client';

export class OutreachService {
  static async createContact(tenantId: string, data: Omit<Prisma.ContactCreateInput, 'tenant'>) {
    return OutreachRepository.createContact(tenantId, data as any);
  }

  static async getContacts(tenantId: string) {
    return OutreachRepository.getContacts(tenantId);
  }

  static async updateContact(tenantId: string, id: string, data: Prisma.ContactUpdateInput) {
    return OutreachRepository.updateContact(tenantId, id, data);
  }

  static async deleteContact(tenantId: string, id: string) {
    return OutreachRepository.deleteContact(tenantId, id);
  }
}
