import rateLimit from 'express-rate-limit';

const isProd = process.env.NODE_ENV === 'production';

const authWindow = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
/** In production keep brute-force protection tight; dev/E2E suites login many times per IP. */
const authMax =
  Number(process.env.AUTH_RATE_LIMIT_MAX) || (isProd ? 30 : 2000);

const publicWindow = Number(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS) || 60 * 1000;
const publicMax =
  Number(process.env.PUBLIC_RATE_LIMIT_MAX) || (isProd ? 120 : 5000);

const commWindow = Number(process.env.COMM_RATE_LIMIT_WINDOW_MS) || 60 * 1000;
const commMax = Number(process.env.COMM_RATE_LIMIT_MAX) || 15;

/** Brute-force protection on login / password reset. */
export const authRateLimiter = rateLimit({
  windowMs: authWindow,
  max: authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Try again later.' },
});

/** Public website and donation endpoints. */
export const publicApiRateLimiter = rateLimit({
  windowMs: publicWindow,
  max: publicMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP.' },
});

/** Campaign send / bulk communication throttling per IP. */
export const communicationSendRateLimiter = rateLimit({
  windowMs: commWindow,
  max: commMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Communication rate limit exceeded. Wait before sending again.' },
});
