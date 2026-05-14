import IORedis from 'ioredis';

let client: IORedis | undefined;
let initFailed: boolean;

/** Returns a shared ioredis client when REDIS_URL is set; otherwise undefined (BullMQ disabled = sync webhooks). */
export function getRedisOptional(): IORedis | undefined {
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    return undefined;
  }
  if (initFailed) {
    return undefined;
  }
  if (!client) {
    try {
      client = new IORedis(url, { maxRetriesPerRequest: null });
    } catch (e) {
      initFailed = true;
      console.warn('[redis] Invalid REDIS_URL; Razorpay webhooks will run synchronously.', e);
      return undefined;
    }
  }
  return client;
}
export function isRedisConfigured(): boolean {
  return !!process.env.REDIS_URL?.trim();
}
