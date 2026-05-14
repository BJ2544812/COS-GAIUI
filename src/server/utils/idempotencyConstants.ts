/** Default TTL for payment idempotency keys (e.g. gateway payment_id). */
export const IDEMPOTENCY_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function idempotencyExpiresAt(): Date {
  return new Date(Date.now() + IDEMPOTENCY_TTL_MS);
}
