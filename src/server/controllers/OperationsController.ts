import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { OperationsService } from '../services/OperationsService.js';

export class OperationsController {
  static async getCommandCenter(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const user = req.user!;
      const campusId = typeof req.query.campusId === 'string' && req.query.campusId.trim()
        ? req.query.campusId.trim()
        : undefined;
      const data = await OperationsService.getCommandCenter(tenantId, {
        id: user.id,
        role: user.role,
        permissions: user.permissions ?? [],
      }, campusId);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load command center';
      res.status(400).json({ error: message });
    }
  }

  static async getOperationalInsights(req: TenantRequest, res: Response) {
    try {
      const campusId = typeof req.query.campusId === 'string' && req.query.campusId.trim()
        ? req.query.campusId.trim()
        : undefined;
      const data = await OperationsService.getOperationalInsights(req.tenantId!, campusId);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load operational insights';
      res.status(400).json({ error: message });
    }
  }
}
