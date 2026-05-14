import { Worker } from 'bullmq';
import { RAZORPAY_WEBHOOK_QUEUE_NAME } from '../queue/razorpayWebhookQueue.js';
import { getRedisOptional } from '../queue/redisConnection.js';
import { GivingService } from '../services/GivingService.js';
import { triggerWebhookFailureAlert } from '../utils/alerting.js';

const DEFAULT_ATTEMPTS = 5;

/**
 * Processes Razorpay webhook jobs from BullMQ. No-op if REDIS_URL is unset.
 * Alerts once when a job exhausts all retries.
 */
export function startRazorpayWebhookWorker(): void {
  const conn = getRedisOptional();
  if (!conn) return;
  let worker: Worker;
  try {
    worker = new Worker(
    RAZORPAY_WEBHOOK_QUEUE_NAME,
    async (job) => {
      const { tenantId, body, signatureHash, rawSize } = job.data as {
        tenantId: string;
        body: Record<string, unknown>;
        signatureHash: string;
        rawSize: number;
      };
      return GivingService.handleRazorpayWebhook(tenantId, body, { signatureHash, rawSize });
    },
    { connection: conn, concurrency: 3 }
    );
  } catch (e) {
    console.error('[razorpay worker] could not start BullMQ worker; webhooks will use sync mode.', e);
    return;
  }
  worker.on('failed', (job, err) => {
    if (!job) return;
    const max = (job.opts.attempts as number) ?? DEFAULT_ATTEMPTS;
    if (job.attemptsMade >= max) {
      const tenantId = (job.data as { tenantId?: string })?.tenantId;
      void triggerWebhookFailureAlert(err, {
        jobId: String(job.id),
        queue: RAZORPAY_WEBHOOK_QUEUE_NAME,
        tenantId: tenantId ?? 'unknown',
        attemptsMade: job.attemptsMade,
      });
    }
  });
  worker.on('error', (err) => {
    console.error('[razorpay-webhook worker]', err);
  });
}
