import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { EventService } from '../services/EventService.js';

export class EventController {
  static async createEvent(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      // convert date string to Date object
      if (req.body.date) {
        req.body.date = new Date(req.body.date);
      }
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
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.status(200).json({ status: 'success', data: event });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateEvent(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      if (req.body.date) {
        req.body.date = new Date(req.body.date);
      }
      const event = await EventService.updateEvent(tenantId, id as string, req.body);
      res.status(200).json({ status: 'success', data: event });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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
