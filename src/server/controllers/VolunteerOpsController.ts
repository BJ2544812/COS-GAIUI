import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { VolunteerOpsService } from '../services/VolunteerOpsService.js';

export class VolunteerOpsController {
  static async getBoard(req: TenantRequest, res: Response) {
    try {
      const eventId = typeof req.query.eventId === 'string' ? req.query.eventId : undefined;
      const page = Math.max(1, Number(req.query.page ?? 1) || 1);
      const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 25) || 25));
      const data = await VolunteerOpsService.getVolunteerBoard(req.tenantId!, eventId, page, pageSize);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load volunteer board';
      res.status(400).json({ error: message });
    }
  }

  static async getInsights(req: TenantRequest, res: Response) {
    try {
      const data = await VolunteerOpsService.getVolunteerInsights(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load insights';
      res.status(400).json({ error: message });
    }
  }

  static async reassign(req: TenantRequest, res: Response) {
    try {
      const { memberId, responsibilityId, ...patch } = req.body as {
        memberId: string;
        responsibilityId: string;
        role?: string;
        status?: string;
        entityId?: string | null;
        entityType?: string;
      };
      if (!memberId || !responsibilityId) {
        return res.status(400).json({ error: 'memberId and responsibilityId are required' });
      }
      const item = await VolunteerOpsService.reassignResponsibility(
        req.tenantId!,
        memberId,
        responsibilityId,
        patch,
        req.user?.id,
      );
      res.status(200).json({ status: 'success', data: item });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to reassign';
      res.status(400).json({ error: message });
    }
  }

  static async substitutes(req: TenantRequest, res: Response) {
    try {
      const role = typeof req.query.role === 'string' ? req.query.role : '';
      const exclude = typeof req.query.excludeMemberId === 'string' ? req.query.excludeMemberId : undefined;
      if (!role) return res.status(400).json({ error: 'role is required' });
      const data = await VolunteerOpsService.suggestSubstitutes(req.tenantId!, role, exclude);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load substitutes';
      res.status(400).json({ error: message });
    }
  }
}
