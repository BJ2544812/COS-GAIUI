import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { OutreachOperationsService } from '../services/OutreachOperationsService.js';
import { OutreachService } from '../services/OutreachService.js';

export class OutreachOperationsController {
  static async getDashboard(req: TenantRequest, res: Response) {
    try {
      const data = await OutreachOperationsService.getDashboard(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async registerVisitor(req: TenantRequest, res: Response) {
    try {
      const data = await OutreachOperationsService.registerVisitor(req.tenantId!, req.body);
      res.status(201).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async completeFollowUp(req: TenantRequest, res: Response) {
    try {
      const data = await OutreachOperationsService.completeFollowUp(
        req.tenantId!,
        req.params.id as string,
        req.body?.notes,
      );
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async listContacts(req: TenantRequest, res: Response) {
    try {
      const data = await OutreachService.getContacts(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async runMissedAttendanceScan(req: TenantRequest, res: Response) {
    try {
      const days = Number(req.body?.daysAbsent) || 21;
      const data = await OutreachOperationsService.createMissedAttendanceFollowUps(req.tenantId!, days);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }
}
