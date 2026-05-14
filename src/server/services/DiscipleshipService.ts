import { DiscipleshipRepository } from '../repositories/DiscipleshipRepository.js';
import { Prisma } from '@prisma/client';

export class DiscipleshipService {
  static async createCareNote(tenantId: string, data: Omit<Prisma.CareNoteCreateInput, 'tenant'>) {
    return DiscipleshipRepository.createCareNote(tenantId, data as any);
  }

  static async getCareNotesByMember(tenantId: string, memberId: string) {
    return DiscipleshipRepository.getCareNotesByMember(tenantId, memberId);
  }

  static async updateCareNote(tenantId: string, id: string, data: Prisma.CareNoteUpdateInput) {
    return DiscipleshipRepository.updateCareNote(tenantId, id, data);
  }

  static async deleteCareNote(tenantId: string, id: string) {
    return DiscipleshipRepository.deleteCareNote(tenantId, id);
  }
}
