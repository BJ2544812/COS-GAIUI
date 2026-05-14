import { prisma } from '../utils/prisma.js';
import { Prisma } from '@prisma/client';

export class CommunicationRepository {
  static async logCommunication(tenantId: string, data: Prisma.CommunicationLogCreateInput) {
    const rawStatus = typeof data.status === 'string' ? data.status.trim() : '';
    /** No SMTP/SMS transport in this build — never persist misleading "Sent". */
    const status =
      !rawStatus || rawStatus === 'Sent' || rawStatus === 'Pending' ? 'Logged (not delivered)' : rawStatus;
    return prisma.communicationLog.create({
      data: {
        ...data,
        tenant: { connect: { id: tenantId } },
        status,
      },
    });
  }

  static async getLogs(tenantId: string) {
    return prisma.communicationLog.findMany({ where: { tenantId }, orderBy: { sentAt: 'desc' } });
  }

  static async updateLogStatus(tenantId: string, id: string, status: string) {
    return prisma.communicationLog.update({
      where: { id },
      data: { status },
    });
  }
}
