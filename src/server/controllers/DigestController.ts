import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { DigestService, type DigestType } from '../services/DigestService.js';

export class DigestController {
  static async list(req: TenantRequest, res: Response) {
    try {
      const data = await DigestService.listRecent(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async generate(req: TenantRequest, res: Response) {
    try {
      const type = (req.params.type || 'daily_ops') as DigestType;
      const data = await DigestService.generate(req.tenantId!, type);
      res.status(201).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async generateAll(req: TenantRequest, res: Response) {
    try {
      const data = await DigestService.generateAllForTenant(req.tenantId!);
      res.status(201).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }
}
