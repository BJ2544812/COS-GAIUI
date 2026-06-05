import type { Request, Response, NextFunction } from 'express';

/**
 * Lightweight production security headers (no helmet dependency).
 * Does not set strict CSP — SPA + Vite dev need inline assets in non-prod.
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV !== 'production') {
    next();
    return;
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.removeHeader('X-Powered-By');
  next();
}
