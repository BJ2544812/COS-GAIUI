import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { EventService } from '../services/EventService.js';
import { LiveOpsService } from '../services/LiveOpsService.js';
import { EVENT_STATUSES } from '../utils/eventLifecycle.js';

export class EventController {
  static async createEvent(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      if (req.body.date) req.body.date = new Date(req.body.date);
      const event = await EventService.createEvent(tenantId, req.body);
      res.status(201).json({ status: 'success', data: event });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getEvents(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const events = await EventService.getEvents(tenantId);
      res.status(200).json({ status: 'success', data: events });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getEventById(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const event = await EventService.getEventById(tenantId, id as string);
      if (!event) return res.status(404).json({ error: 'Event not found' });
      res.status(200).json({ status: 'success', data: event });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getEventWorkspace(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const workspace = await EventService.getWorkspace(tenantId, id as string, {
        userId: req.user?.id,
        hasManageEvents: req.user?.permissions?.includes('manage_events') ?? false,
      });
      res.status(200).json({ status: 'success', data: workspace });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getEventResponsibilities(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const rows = await EventService.listEventResponsibilities(tenantId, id as string);
      res.status(200).json({ status: 'success', data: rows });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getLifecycleMeta(_req: TenantRequest, res: Response) {
    res.status(200).json({ status: 'success', data: { statuses: EVENT_STATUSES } });
  }

  static async transitionEvent(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const { status } = req.body as { status?: string };
      if (!status) return res.status(400).json({ error: 'status is required' });
      const event = await EventService.transitionStatus(tenantId, id as string, status, req.user?.id);
      res.status(200).json({ status: 'success', data: event });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateRunSheet(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const event = await EventService.updateRunSheet(tenantId, id as string, req.body.runSheet);
      res.status(200).json({ status: 'success', data: event });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateOpsConfig(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const event = await EventService.updateOpsConfig(tenantId, id as string, req.body.opsConfig);
      res.status(200).json({ status: 'success', data: event });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateEvent(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      if (req.body.date) req.body.date = new Date(req.body.date);
      const event = await EventService.updateEvent(tenantId, id as string, req.body);
      res.status(200).json({ status: 'success', data: event });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getLiveOps(req: TenantRequest, res: Response) {
    try {
      const data = await LiveOpsService.getLiveOps(req.tenantId!, req.params.id as string);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load live ops';
      res.status(400).json({ error: message });
    }
  }

  static async updateLiveOps(req: TenantRequest, res: Response) {
    try {
      const data = await LiveOpsService.updateLiveOps(
        req.tenantId!,
        req.params.id as string,
        req.body ?? {},
        req.user?.id,
      );
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update live ops';
      res.status(400).json({ error: message });
    }
  }

  static async advanceLiveSegment(req: TenantRequest, res: Response) {
    try {
      const { action, index } = req.body as { action?: string; index?: number };
      if (!action || !['complete', 'skip', 'goto'].includes(action)) {
        return res.status(400).json({ error: 'action must be complete, skip, or goto' });
      }
      const data = await LiveOpsService.advanceSegment(
        req.tenantId!,
        req.params.id as string,
        action as 'complete' | 'skip' | 'goto',
        index,
        req.user?.id,
      );
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to advance segment';
      res.status(400).json({ error: message });
    }
  }

  static async liveEmergency(req: TenantRequest, res: Response) {
    try {
      const { message } = req.body as { message?: string };
      if (!message?.trim()) return res.status(400).json({ error: 'message is required' });
      const data = await LiveOpsService.triggerEmergency(
        req.tenantId!,
        req.params.id as string,
        message.trim(),
        req.user?.id,
      );
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send alert';
      res.status(400).json({ error: message });
    }
  }

  static async deleteEvent(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      await EventService.deleteEvent(tenantId, id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
