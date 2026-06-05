import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { PrayerCareService } from '../services/PrayerCareService.js';

export class PrayerCareController {
  static async getDashboard(req: TenantRequest, res: Response) {
    try {
      const data = await PrayerCareService.getCareDashboard(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async createPrayer(req: TenantRequest, res: Response) {
    try {
      const body = req.body as {
        content?: string;
        memberId?: string;
        isConfidential?: boolean;
        needsFollowUp?: boolean;
        category?: string;
      };
      if (!body.content?.trim()) {
        return res.status(400).json({ error: 'Prayer request text is required' });
      }
      const visibility = body.isConfidential ? 'PASTORAL' : body.needsFollowUp ? 'PASTORAL' : 'PUBLIC';
      const data = await PrayerCareService.createPrayerRequest(req.tenantId!, {
        content: body.content,
        requesterId: body.memberId || null,
        visibility,
        needsFollowUp: body.needsFollowUp,
        category: body.category,
        createdById: req.user?.id,
      });
      res.status(201).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async listPrayer(req: TenantRequest, res: Response) {
    try {
      const role = req.user?.role ?? '';
      const isPastoral = role.toLowerCase().includes('pastor') || role.toLowerCase().includes('admin');
      const data = await PrayerCareService.listPrayerRequests(req.tenantId!, {
        includeConfidential: isPastoral,
        assignedUserId: typeof req.query.mine === 'string' ? req.user?.id : undefined,
      });
      const filtered = data.filter((p) =>
        PrayerCareService.canViewPrayer(
          p.visibility,
          role,
          p.assignedUserId === req.user?.id,
        ),
      );
      res.status(200).json({ status: 'success', data: filtered });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async assignPrayer(req: TenantRequest, res: Response) {
    try {
      const { assignedUserId } = req.body as { assignedUserId?: string };
      if (!assignedUserId) return res.status(400).json({ error: 'assignedUserId required' });
      const data = await PrayerCareService.assignPrayer(
        req.tenantId!,
        req.params.id as string,
        assignedUserId,
        req.user?.id,
      );
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async updatePrayer(req: TenantRequest, res: Response) {
    try {
      const data = await PrayerCareService.updatePrayer(req.tenantId!, req.params.id as string, req.body);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }
}
