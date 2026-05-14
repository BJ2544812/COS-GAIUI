import { Queue } from 'bullmq';
import { getRedisOptional, isRedisConfigured } from './redisConnection.js';

export const RAZORPAY_WEBHOOK_QUEUE_NAME = 'razorpay-webhook';

let queue: Queue | null = null;

function getQueue(): Queue | null {
  const conn = getRedisOptional();
  if (!conn) return null;
  if (!queue) {
    queue = new Queue(RAZORPAY_WEBHOOK_QUEUE_NAME, {
      connection: conn,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: { count: 2000 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    });
  }
  return queue;
}

export type RazorpayWebhookJobData = {
  tenantId: string;
  body: Record<string, unknown>;
  signatureHash: string;
  rawSize: number;
};

export function isWebhookQueueEnabled(): boolean {
  return isRedisConfigured() && getQueue() !== null;
}

/**
 * Enqueues webhook processing. jobId = tenantId:eventId to dedupe; duplicate add returns existing behavior via catch.
 */
export async function enqueueRazorpayWebhook(
  data: RazorpayWebhookJobData
): Promise<{ id: string } | null> {
  const q = getQueue();
  if (!q) return null;
  const eventId = typeof data.body.id === 'string' ? data.body.id : '';
  if (!eventId) {
    throw new Error('Razorpay webhook body must include `id` (event id) for queueing.');
  }
  const jobId = `${data.tenantId}:${eventId}`.slice(0, 128);
  const existing = await q.getJob(jobId);
  if (existing) {
    const st = await existing.getState();
    if (st === 'completed' || st === 'active' || st === 'waiting' || st === 'delayed' || st === 'prioritized' || st === 'waiting-children') {
      return { id: jobId };
    }
    if (st === 'failed') {
      await existing.remove().catch(() => undefined);
    }
  }
  const job = await q.add('process', data, { jobId });
  return { id: job.id! };
}
