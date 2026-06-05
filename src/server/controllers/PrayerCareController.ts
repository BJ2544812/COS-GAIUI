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
        title?: string;
        content?: string;
        memberId?: string;
        isConfidential?: boolean;
        needsFollowUp?: boolean;
        category?: string;
        urgency?: string;
        assignedUserId?: string;
      };
      if (!body.content?.trim()) {
        return res.status(400).json({ error: 'Prayer request text is required' });
      }
      const visibility = body.isConfidential ? 'PASTORAL' : body.needsFollowUp ? 'PASTORAL' : 'PUBLIC';
      const data = await PrayerCareService.createPrayerRequest(req.tenantId!, {
        title: body.title,
        content: body.content,
        requesterId: body.memberId || null,
        visibility,
        needsFollowUp: body.needsFollowUp,
        category: body.category,
        urgency: body.urgency as any,
        createdById: req.user?.id,
        assignedUserId: body.assignedUserId || null,
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
        includeClosed: req.query.includeClosed === '1',
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

  static async getPrayer(req: TenantRequest, res: Response) {
    try {
      const data = await PrayerCareService.getPrayerRequest(req.tenantId!, String(req.params.id));
      const role = req.user?.role ?? '';
      if (!PrayerCareService.canViewPrayer(data.visibility, role, data.assignedUserId === req.user?.id)) {
        return res.status(403).json({ error: 'Not authorized to view this prayer request' });
      }
      res.status(200).json({ status: 'success', data });
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
      const data = await PrayerCareService.updatePrayer(
        req.tenantId!,
        req.params.id as string,
        req.body,
        req.user?.id,
      );
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async addFollowUp(req: TenantRequest, res: Response) {
    try {
      const { note } = req.body as { note?: string };
      if (!note?.trim()) return res.status(400).json({ error: 'note is required' });
      const data = await PrayerCareService.addFollowUpNote(
        req.tenantId!,
        req.params.id as string,
        note,
        req.user?.id,
      );
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async markAnswered(req: TenantRequest, res: Response) {
    try {
      const { testimony } = req.body as { testimony?: string };
      const data = await PrayerCareService.markAnswered(
        req.tenantId!,
        req.params.id as string,
        testimony || '',
        req.user?.id,
      );
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async closePrayer(req: TenantRequest, res: Response) {
    try {
      const data = await PrayerCareService.closePrayer(
        req.tenantId!,
        req.params.id as string,
        req.user?.id,
      );
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async archivePrayer(req: TenantRequest, res: Response) {
    try {
      const data = await PrayerCareService.archivePrayer(
        req.tenantId!,
        req.params.id as string,
        req.user?.id,
      );
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }
}
