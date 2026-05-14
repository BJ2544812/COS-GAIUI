import { CommunicationRepository } from '../repositories/CommunicationRepository.js';
import { Prisma } from '@prisma/client';

export class CommunicationService {
  static async sendCommunication(tenantId: string, data: Omit<Prisma.CommunicationLogCreateInput, 'tenant'>) {
    // No third-party transport configured here — persist intent as a log row only.
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[communication] log-only send ${data.type} → ${data.recipient}`);
    }
    return CommunicationRepository.logCommunication(tenantId, data as any);
  }

  static async getLogs(tenantId: string) {
    return CommunicationRepository.getLogs(tenantId);
  }

  static async updateLogStatus(tenantId: string, id: string, status: string) {
    return CommunicationRepository.updateLogStatus(tenantId, id, status);
  }
}
