import { prisma } from '../utils/prisma.js';

export class ProcessedRazorpayEventRepository {
  static findByEventId(tenantId: string, eventId: string) {
    return prisma.processedRazorpayEvent.findFirst({
      where: { tenantId, eventId },
    });
  }

  static create(
    data: {
      tenantId: string;
      eventId: string;
      paymentId?: string | null;
      signatureHash?: string | null;
      donationId?: string | null;
      voucherId?: string | null;
    }
  ) {
    return prisma.processedRazorpayEvent.create({ data });
  }
}
