import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { CommunicationService } from '../services/CommunicationService.js';

export class CommunicationController {
  static async sendCommunication(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const log = await CommunicationService.sendCommunication(tenantId, req.body);
      res.status(201).json({ status: 'success', data: log });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getLogs(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const logs = await CommunicationService.getLogs(tenantId);
      res.status(200).json({ status: 'success', data: logs });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateLogStatus(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const { status } = req.body;
      const log = await CommunicationService.updateLogStatus(tenantId, id as string, status);
      res.status(200).json({ status: 'success', data: log });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
