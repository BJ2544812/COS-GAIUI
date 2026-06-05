import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { MemberPortalService } from '../services/MemberPortalService.js';

export class MemberPortalController {
  static async getSummary(req: TenantRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
      const data = await MemberPortalService.getPortalSummary(req.tenantId!, req.user.id);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async submitPrayerRequest(req: TenantRequest, res: Response) {
    try {
      if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
      const content = String((req.body as { content?: string })?.content ?? '');
      const row = await MemberPortalService.submitPrayerRequest(req.tenantId!, req.user.id, content);
      res.status(201).json({ status: 'success', data: row });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }
}
