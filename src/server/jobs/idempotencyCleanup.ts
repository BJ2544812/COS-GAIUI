import { prisma } from '../utils/prisma.js';
import { accountingLog } from '../utils/accountingLog.js';

/**
 * Removes expired idempotency keys; safe to run on an interval.
 */
export async function runIdempotencyCleanup(): Promise<{ deleted: number }> {
  const now = new Date();
  const r = await prisma.idempotencyKey.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  if (r.count > 0) {
    accountingLog('idempotency', 'cleanup', { deleted: r.count, at: now.toISOString() });
  }
  return { deleted: r.count };
}
