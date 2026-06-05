import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TenantRequest } from './tenant.middleware.js';
import { prisma } from '../utils/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'church-erp-super-secret-key-2026';

export const authenticateToken = (req: TenantRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
    if (err) {
      console.error("[AUTH DEBUG] Token verification failed:", err.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // JWT tenant is authoritative; repair stale x-tenant-id from outdated env/localStorage
    if (decoded.tenantId && req.tenantId && decoded.tenantId !== req.tenantId) {
      console.warn(
        `[auth] x-tenant-id (${req.tenantId}) mismatches JWT (${decoded.tenantId}); using JWT tenant.`,
      );
      req.tenantId = decoded.tenantId;
    } else if (decoded.tenantId && !req.tenantId) {
      req.tenantId = decoded.tenantId;
    }

    try {
      // FETCH FRESH PERMISSIONS FROM DB - JWT is NOT source of truth
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: { 
          role: { 
            include: { 
              rolePermissions: { 
                include: { permission: true } 
              } 
            } 
          } 
        }
      });

      if (!user || user.status !== 'Active') {
        return res.status(401).json({ error: 'User is inactive or not found' });
      }

      if (decoded.tenantId && user.tenantId !== decoded.tenantId) {
        return res.status(401).json({ error: 'Session invalid for this account. Please sign in again.' });
      }

      if (!user.role) {
        console.error('[AUTH] User has no role row (orphaned roleId or DB inconsistency):', user.id, user.roleId);
        return res.status(401).json({
          error: 'Account configuration is invalid (missing role). Contact an administrator or sign in again after cleanup.',
        });
      }

      const permissions =
        user.role.rolePermissions
          ?.map((rp) => rp.permission?.moduleKey)
          .filter((k): k is string => typeof k === 'string' && k.length > 0) ?? [];
      
      req.user = {
        ...decoded,
        role: user.role.name,
        permissions
      };

      if (!permissions.includes('manage_settings') && req.tenantId) {
        const maintRow = await prisma.setting.findUnique({
          where: { tenantId_key: { tenantId: req.tenantId, key: 'tenant_maintenance_mode' } },
        });
        if (maintRow?.value) {
          let maint: { enabled?: boolean; message?: string } = {};
          try {
            maint = JSON.parse(maintRow.value) as { enabled?: boolean; message?: string };
          } catch {
            maint = { enabled: maintRow.value === 'true' };
          }
          if (maint.enabled) {
            return res.status(503).json({
              status: 'error',
              error: 'maintenance_mode',
              message:
                maint.message ??
                'This church workspace is temporarily in maintenance. Please try again shortly.',
            });
          }
        }
      }
      
      console.log("[AUTH DEBUG] User authenticated:", {
        id: req.user.id,
        roleFromDB: user.role.name,
        permissionsCount: permissions.length
      });

      next();
    } catch (e) {
      res.status(500).json({ error: 'Internal security synchronization error' });
    }
  });
};

/**
 * Standardized permission check.
 * user.permissions is an array of module keys (e.g., ['manage_members', 'manage_finance']).
 */
export const requirePermission = (requiredPermission: string) => {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({ error: 'Authentication required' });
    }

    // SUPER ADMIN BYPASS (CRITICAL)
    const normalizedRole = req.user.role?.toUpperCase()?.replace(/\s/g, '_');
    
    console.log("[AUTH DEBUG] requirePermission:", {
      role: req.user.role,
      normalizedRole,
      permissions: req.user.permissions,
      required: requiredPermission
    });

    if (normalizedRole === 'SUPER_ADMIN') {
      return next();
    }

    if (!Array.isArray(req.user.permissions)) {
      return res.status(403).json({ error: 'No permissions defined for user' });
    }

    const hasPermission = req.user.permissions.includes(requiredPermission);

    if (!hasPermission) {
      return res.status(403).json({ 
        error: `Access Restricted: Missing required permission: ${requiredPermission}` 
      });
    }

    next();
  };
};

/** User must have at least one of the given module keys. */
export const requireAnyPermission = (...moduleKeys: string[]) => {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({ error: 'Authentication required' });
    }

    // SUPER ADMIN BYPASS (CRITICAL)
    const normalizedRole = req.user.role?.toUpperCase()?.replace(/\s/g, '_');
    
    console.log("[AUTH DEBUG] requireAnyPermission:", {
      role: req.user.role,
      normalizedRole,
      permissions: req.user.permissions,
      required: moduleKeys
    });

    if (normalizedRole === 'SUPER_ADMIN') {
      return next();
    }

    if (!Array.isArray(req.user.permissions)) {
      return res.status(403).json({ error: 'No permissions defined for user' });
    }

    if (moduleKeys.length === 0) {
      return next();
    }

    const hasAny = moduleKeys.some(key => req.user?.permissions.includes(key));

    if (!hasAny) {
      return res.status(403).json({ 
        error: `Access Restricted: Missing one of required permissions: ${moduleKeys.join(', ')}` 
      });
    }

    next();
  };
};
