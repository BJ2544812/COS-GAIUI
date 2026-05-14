import rateLimit from 'express-rate-limit';

const windowMs = Math.max(1000, Number(process.env.WEBHOOK_RATE_LIMIT_WINDOW_MS) || 60_000);
const max = Math.max(1, Number(process.env.WEBHOOK_RATE_LIMIT_MAX) || 300);

/** Per-IP limiter for public webhook routes (after tenant middleware, IP is still client IP). */
export const razorpayWebhookRateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'WEBHOOK_RATE_LIMIT', message: 'Too many webhook requests' } },
});
