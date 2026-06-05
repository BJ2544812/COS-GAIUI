import { Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma.js';
import type { TenantRequest } from './tenant.middleware.js';

const MAINTENANCE_KEY = 'tenant_maintenance_mode';

const BYPASS_PREFIXES = ['/auth/login', '/auth/setup', '/deploy/setup-status', '/deploy/version', '/health'];

export async function maintenanceMiddleware(req: TenantRequest, res: Response, next: NextFunction) {
  const path = req.originalUrl || req.url;
  if (BYPASS_PREFIXES.some((p) => path.includes(p))) return next();

  const tenantId = req.tenantId;
  if (!tenantId) return next();

  const row = await prisma.setting.findUnique({
    where: { tenantId_key: { tenantId, key: MAINTENANCE_KEY } },
  });
  if (!row?.value) return next();

  let payload: { enabled?: boolean; message?: string } = {};
  try {
    payload = JSON.parse(row.value) as { enabled?: boolean; message?: string };
  } catch {
    payload = { enabled: row.value === 'true' };
  }
  if (!payload.enabled) return next();

  const perms = req.user?.permissions ?? [];
  if (perms.includes('manage_settings')) return next();

  return res.status(503).json({
    status: 'error',
    error: 'maintenance_mode',
    message:
      payload.message ??
      'This church workspace is temporarily in maintenance. Please try again shortly.',
  });
}

export { MAINTENANCE_KEY };
