import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { DiscipleshipService } from '../services/DiscipleshipService.js';

export class DiscipleshipController {
  static async createCareNote(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      // Auto-assign authorId from the authenticated user
      const authorId = req.user.id;
      const data = { ...req.body, authorId };
      const careNote = await DiscipleshipService.createCareNote(tenantId, data);
      res.status(201).json({ status: 'success', data: careNote });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getCareNotesByMember(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { memberId } = req.params;
      const careNotes = await DiscipleshipService.getCareNotesByMember(tenantId, memberId as string);
      res.status(200).json({ status: 'success', data: careNotes });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateCareNote(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const careNote = await DiscipleshipService.updateCareNote(tenantId, id as string, req.body);
      res.status(200).json({ status: 'success', data: careNote });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteCareNote(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      await DiscipleshipService.deleteCareNote(tenantId, id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
