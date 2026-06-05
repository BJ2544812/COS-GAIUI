import { Request, Response, NextFunction } from 'express';
import { newCorrelationId, logStructured } from '../utils/structuredLog.js';
import type { TenantRequest } from './tenant.middleware.js';

export interface RequestWithContext extends TenantRequest {
  correlationId?: string;
  requestStartedAt?: number;
}

export function requestContextMiddleware(req: RequestWithContext, res: Response, next: NextFunction) {
  const incoming = req.headers['x-correlation-id'];
  req.correlationId =
    typeof incoming === 'string' && incoming.trim() ? incoming.trim() : newCorrelationId();
  req.requestStartedAt = Date.now();
  res.setHeader('x-correlation-id', req.correlationId);

  res.on('finish', () => {
    const path = req.originalUrl || req.url;
    if (path.includes('/health') || path.endsWith('/socket.io')) return;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logStructured(level, 'http_request', {
      correlationId: req.correlationId,
      tenantId: req.tenantId,
      method: req.method,
      path,
      statusCode: res.statusCode,
      durationMs: Date.now() - (req.requestStartedAt ?? Date.now()),
    });
  });

  next();
}

export function apiErrorLogger(err: unknown, req: RequestWithContext, res: Response, next: NextFunction) {
  logStructured('error', 'api_unhandled_error', {
    correlationId: req.correlationId,
    tenantId: req.tenantId,
    path: req.originalUrl,
    method: req.method,
    error: err instanceof Error ? err.message : String(err),
  });
  next(err);
}
