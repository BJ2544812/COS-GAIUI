import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { OutreachService } from '../services/OutreachService.js';

export class OutreachController {
  static async createContact(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const contact = await OutreachService.createContact(tenantId, req.body);
      res.status(201).json({ status: 'success', data: contact });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getContacts(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const contacts = await OutreachService.getContacts(tenantId);
      res.status(200).json({ status: 'success', data: contacts });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateContact(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const contact = await OutreachService.updateContact(tenantId, id as string, req.body);
      res.status(200).json({ status: 'success', data: contact });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteContact(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      await OutreachService.deleteContact(tenantId, id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
