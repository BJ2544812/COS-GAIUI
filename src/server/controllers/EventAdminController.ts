import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { prisma } from '../utils/prisma.js';
import { EventBus } from '../events/eventBus.js';

export class EventAdminController {
  /**
   * Returns a paginated list of recent events for operational visibility.
   */
  static async getRecentEvents(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const status = req.query.status as string; // Optional filter (e.g. 'FAILED')
      const take = Number(req.query.limit) || 50;

      const where: any = { tenantId };
      if (status) where.status = status;

      const events = await prisma.eventLog.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        take
      });

      res.status(200).json({ status: 'success', data: events });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Returns high-level statistics about the event queue.
   */
  static async getEventStats(req: TenantRequest, res: Response) {
    try {
      const stats = await EventBus.getEventStats(req.tenantId!);
      res.status(200).json({ status: 'success', data: stats });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Manually triggers a replay of all 'FAILED' events for the tenant.
   */
  static async replayFailedEvents(req: TenantRequest, res: Response) {
    try {
      const requeuedCount = await EventBus.replayFailedEvents();
      res.status(200).json({ status: 'success', data: { requeuedCount } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
