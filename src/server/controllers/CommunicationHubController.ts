import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { CommunicationHubService } from '../services/CommunicationHubService.js';
import type { MessageChannel } from '../services/messaging/MessageProvider.js';

export class CommunicationHubController {
  static async getCommandCenter(req: TenantRequest, res: Response) {
    try {
      const data = await CommunicationHubService.getCommandCenter(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async previewAudience(req: TenantRequest, res: Response) {
    try {
      const filter = CommunicationHubService.parseFilter(req.body?.audienceFilter ?? req.body ?? {});
      const data = await CommunicationHubService.previewAudience(req.tenantId!, filter);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async createCampaign(req: TenantRequest, res: Response) {
    try {
      const { title, body, channels, audienceFilter, scheduledAt } = req.body as {
        title?: string;
        body?: string;
        channels?: MessageChannel[];
        audienceFilter?: unknown;
        scheduledAt?: string | null;
      };
      if (!title?.trim() || !body?.trim()) {
        return res.status(400).json({ error: 'title and body are required' });
      }
      const data = await CommunicationHubService.createCampaign(req.tenantId!, {
        title: title.trim(),
        body: body.trim(),
        channels: Array.isArray(channels) ? channels : ['in_app'],
        audienceFilter: CommunicationHubService.parseFilter(audienceFilter ?? {}),
        scheduledAt,
        createdById: req.user?.id,
      });
      res.status(201).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async sendCampaign(req: TenantRequest, res: Response) {
    try {
      const data = await CommunicationHubService.sendCampaign(req.tenantId!, req.params.id as string);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }
}
