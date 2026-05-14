import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
  tenantId?: string;
  user?: any; // To be populated by Auth Middleware
}

export const tenantMiddleware = (req: TenantRequest, res: Response, next: NextFunction) => {
  // Skip tenant check for preflight requests
  if (req.method === 'OPTIONS') {
    return next();
  }

  const tenantId = req.headers['x-tenant-id'] as string;

  if (!tenantId) {
    return res.status(400).json({ error: 'x-tenant-id header is required' });
  }

  req.tenantId = tenantId;
  next();
};
