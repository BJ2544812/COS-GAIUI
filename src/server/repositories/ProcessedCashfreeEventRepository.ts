import { Prisma } from '@prisma/client';

export class ProcessedCashfreeEventRepository {
  static async findByEventId(tx: Prisma.TransactionClient, tenantId: string, eventId: string) {
    return tx.processedCashfreeEvent.findFirst({ where: { tenantId, eventId } });
  }

  static async create(
    tx: Prisma.TransactionClient,
    data: {
      tenantId: string;
      eventId: string;
      eventType?: string | null;
      orderId?: string | null;
      paymentId?: string | null;
      signatureHash?: string | null;
      donationId?: string | null;
      voucherId?: string | null;
    }
  ) {
    return tx.processedCashfreeEvent.create({ data });
  }
}
