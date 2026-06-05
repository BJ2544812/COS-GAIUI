import type { Response } from 'express';

export function sendSuccess<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ status: 'success', data });
}

export function sendError(res: Response, message: string, status = 400, extra?: Record<string, unknown>) {
  return res.status(status).json({
    status: 'error',
    error: message,
    ...extra,
  });
}
