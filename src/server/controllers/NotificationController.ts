import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { NotificationService } from '../services/NotificationService.js';
import { toErrorResponse } from '../utils/apiErrors.js';
import { prisma } from '../utils/prisma.js';

export class NotificationController {
  static async getNotifications(req: TenantRequest, res: Response) {
    try {
      // Find user role
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { role: true }
      });
      
      const roleName = user?.role?.name || '';
      const notifications = await NotificationService.getNotificationsForUser(req.tenantId!, req.user!.id, roleName);
      
      res.json({ status: 'success', data: notifications });
    } catch (error) {
      res.status(500).json({ status: 'error', message: toErrorResponse(error).message });
    }
  }

  static async markAsRead(req: TenantRequest, res: Response) {
    try {
      const id = req.params.id as string;
      await NotificationService.markAsRead(req.tenantId!, id, req.user!.id);
      res.json({ status: 'success' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: toErrorResponse(error).message });
    }
  }

  static async markAllAsRead(req: TenantRequest, res: Response) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { role: true }
      });
      const roleName = user?.role?.name || '';
      const result = await NotificationService.markAllAsRead(req.tenantId!, req.user!.id, roleName);
      res.json({ status: 'success', data: result });
    } catch (error) {
      res.status(500).json({ status: 'error', message: toErrorResponse(error).message });
    }
  }
}
