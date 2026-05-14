import { Prisma } from '@prisma/client';
import { idempotencyExpiresAt } from '../utils/idempotencyConstants.js';

type Tx = Prisma.TransactionClient;

export const OP_GATEWAY_PAYMENT = 'gateway_payment';

export class IdempotencyRepository {
  /**
   * Returns a non-expired idempotency row, or null. Deletes an expired row for this key to allow refresh.
   */
  static async findValidByKey(
    db: Tx,
    tenantId: string,
    key: string,
    operation: string
  ) {
    const row = await db.idempotencyKey.findUnique({
      where: { tenantId_key_operation: { tenantId, key, operation } },
    });
    if (!row) return null;
    if (row.expiresAt <= new Date()) {
      await db.idempotencyKey.delete({ where: { id: row.id } });
      return null;
    }
    return row;
  }

  static async create(
    db: Tx,
    tenantId: string,
    key: string,
    operation: string,
    resultRefId: string
  ) {
    return db.idempotencyKey.create({
      data: {
        tenantId,
        key,
        operation,
        resultRefId,
        expiresAt: idempotencyExpiresAt(),
      },
    });
  }
}
