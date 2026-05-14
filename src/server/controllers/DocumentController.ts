import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { DocumentService } from '../services/DocumentService.js';

export class DocumentController {
  static async createDocument(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      // Associate uploadedBy with current user
      const uploadedBy = req.user.id;
      const data = { ...req.body, uploadedBy };
      const doc = await DocumentService.createDocument(tenantId, data);
      res.status(201).json({ status: 'success', data: doc });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getDocuments(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const docs = await DocumentService.getDocuments(tenantId);
      res.status(200).json({ status: 'success', data: docs });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteDocument(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      await DocumentService.deleteDocument(tenantId, id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
