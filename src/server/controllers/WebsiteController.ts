import { Response } from 'express';
import { WebsiteService } from '../services/WebsiteService.js';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { toErrorResponse } from '../utils/apiErrors.js';

export class WebsiteController {
  static async getPublicEvents(req: TenantRequest, res: Response) {
    try {
      const raw = req.query.limit as string | undefined;
      const limit = raw != null ? parseInt(raw, 10) : 20;
      const events = await WebsiteService.getPublicEvents(req.tenantId!, Number.isFinite(limit) ? limit : 20);
      res.json({ status: 'success', data: events });
    } catch (error) {
      console.error('[WebsiteController.getPublicEvents]', error);
      res.status(500).json({ error: toErrorResponse(error) });
    }
  }

  static async getPublicEventById(req: TenantRequest, res: Response) {
    try {
      const { EventPublicService } = await import('../services/EventPublicService.js');
      const event = await EventPublicService.getPublishedEvent(req.tenantId!, req.params.id as string);
      if (!event) {
        return res.status(404).json({ status: 'error', message: 'Event not found or not published' });
      }
      res.json({ status: 'success', data: event });
    } catch (error) {
      console.error('[WebsiteController.getPublicEventById]', error);
      res.status(500).json({ error: toErrorResponse(error) });
    }
  }

  static async registerForPublicEvent(req: TenantRequest, res: Response) {
    try {
      const { EventPublicService } = await import('../services/EventPublicService.js');
      const { name, email, phone } = req.body as { name?: string; email?: string; phone?: string };
      if (!name?.trim()) {
        return res.status(400).json({ status: 'error', message: 'Name is required' });
      }
      const result = await EventPublicService.registerGuest(req.tenantId!, req.params.id as string, {
        name,
        email,
        phone,
      });
      res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      const code = /capacity|not open|not published|already registered/i.test(message) ? 400 : 500;
      res.status(code).json({ status: 'error', message });
    }
  }

  static async createPageData(req: TenantRequest, res: Response) {
    try {
      const page = await WebsiteService.createPageData(req.tenantId!, req.body);
      res.status(201).json({ status: 'success', data: page });
    } catch (error) {
      console.error('[WebsiteController.createPageData]', error);
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getPages(req: TenantRequest, res: Response) {
    try {
      const onlyPublished = req.query.published === 'true';
      const pages = await WebsiteService.getPages(req.tenantId!, onlyPublished);
      res.json({ status: 'success', data: pages });
    } catch (error) {
      console.error('[WebsiteController.getPages]', error);
      res.status(500).json({ error: toErrorResponse(error) });
    }
  }

  static async getPublicPageBySlug(req: TenantRequest, res: Response) {
    try {
      const slug = req.params.slug as string;
      const page = await WebsiteService.getPublicPageBySlug(req.tenantId!, slug);
      if (!page) {
        return res.status(404).json({ status: 'error', message: 'Page not found' });
      }
      res.json({ status: 'success', data: page });
    } catch (error) {
      console.error('[WebsiteController.getPublicPageBySlug]', error);
      res.status(500).json({ error: toErrorResponse(error) });
    }
  }

  static async getAdminPageBySlug(req: TenantRequest, res: Response) {
    try {
      const slug = req.params.slug as string;
      const page = await WebsiteService.getPageBySlug(req.tenantId!, slug);
      if (!page) {
        return res.status(404).json({ status: 'error', message: 'Page not found' });
      }
      res.json({ status: 'success', data: page });
    } catch (error) {
      console.error('[WebsiteController.getAdminPageBySlug]', error);
      res.status(500).json({ error: toErrorResponse(error) });
    }
  }

  static async updatePageData(req: TenantRequest, res: Response) {
    try {
      const page = await WebsiteService.updatePageData(req.tenantId!, req.params.slug as string, req.body);
      res.json({ status: 'success', data: page });
    } catch (error) {
      console.error('[WebsiteController.updatePageData]', error);
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async publishPage(req: TenantRequest, res: Response) {
    try {
      const { isPublished } = req.body;
      if (typeof isPublished !== 'boolean') {
        return res.status(400).json({ error: toErrorResponse(new Error('isPublished boolean required')) });
      }
      const page = await WebsiteService.publishPage(req.tenantId!, req.params.slug as string, isPublished);
      res.json({ status: 'success', data: page });
    } catch (error) {
      console.error('[WebsiteController.publishPage]', error);
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async applyTemplate(req: TenantRequest, res: Response) {
    try {
      const templateId = (req.body as { templateId?: string })?.templateId;
      if (typeof templateId !== 'string' || !templateId.trim()) {
        return res.status(400).json({ error: toErrorResponse(new Error('templateId is required')) });
      }
      const pages = await WebsiteService.applyTemplate(req.tenantId!, templateId.trim());
      res.json({ status: 'success', data: pages });
    } catch (error) {
      console.error('[WebsiteController.applyTemplate]', error);
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async restoreFlagship(req: TenantRequest, res: Response) {
    try {
      const pages = await WebsiteService.restoreFlagshipWebsite(req.tenantId!);
      res.json({ status: 'success', data: pages });
    } catch (error) {
      console.error('[WebsiteController.restoreFlagship]', error);
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async wipeAllPages(req: TenantRequest, res: Response) {
    try {
      await WebsiteService.wipeAllPages(req.tenantId!);
      res.status(204).send();
    } catch (error) {
      console.error('[WebsiteController.wipeAllPages]', error);
      res.status(500).json({ error: toErrorResponse(error) });
    }
  }

  static async deletePage(req: TenantRequest, res: Response) {
    try {
      const slug = req.params.slug as string;
      await WebsiteService.deletePage(req.tenantId!, slug);
      res.status(204).send();
    } catch (error) {
      console.error('[WebsiteController.deletePage]', error);
      res.status(500).json({ error: toErrorResponse(error) });
    }
  }

  static async getPublicSettings(req: TenantRequest, res: Response) {
    try {
      const settings = await WebsiteService.getPublicSettings(req.tenantId!);
      res.json({ status: 'success', data: settings });
    } catch (error) {
      console.error('[WebsiteController.getPublicSettings]', error);
      res.status(500).json({ error: toErrorResponse(error) });
    }
  }

  static async getPublicPageList(req: TenantRequest, res: Response) {
    try {
      const pages = await WebsiteService.getPages(req.tenantId!, true);
      res.json({ status: 'success', data: pages });
    } catch (error) {
      console.error('[WebsiteController.getPublicPageList]', error);
      res.status(500).json({ error: toErrorResponse(error) });
    }
  }

  static async getPublicLeadership(req: TenantRequest, res: Response) {
    try {
      const raw = req.query.limit as string | undefined;
      const limit = raw != null ? parseInt(raw, 10) : 12;
      const leaders = await WebsiteService.getPublicLeadership(
        req.tenantId!,
        Number.isFinite(limit) ? limit : 12,
      );
      res.json({ status: 'success', data: leaders });
    } catch (error) {
      console.error('[WebsiteController.getPublicLeadership]', error);
      res.status(500).json({ error: toErrorResponse(error) });
    }
  }

  static async getPublicCampaigns(req: TenantRequest, res: Response) {
    try {
      const campaigns = await WebsiteService.getPublicCampaigns(req.tenantId!);
      res.json({ status: 'success', data: campaigns });
    } catch (error) {
      console.error('[WebsiteController.getPublicCampaigns]', error);
      res.status(500).json({ error: toErrorResponse(error) });
    }
  }

  static async createPublicPrayerRequest(req: TenantRequest, res: Response) {
    try {
      const row = await WebsiteService.createPublicPrayerRequest(req.tenantId!, req.body ?? {});
      res.status(201).json({ status: 'success', data: { id: row.id } });
    } catch (error) {
      console.error('[WebsiteController.createPublicPrayerRequest]', error);
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getWebsiteSeo(req: TenantRequest, res: Response) {
    try {
      const seo = await WebsiteService.getWebsiteSeo(req.tenantId!);
      res.json({ status: 'success', data: seo });
    } catch (error) {
      res.status(500).json({ error: toErrorResponse(error) });
    }
  }

  static async saveWebsiteSeo(req: TenantRequest, res: Response) {
    try {
      const seo = await WebsiteService.saveWebsiteSeo(req.tenantId!, req.body ?? {});
      res.json({ status: 'success', data: seo });
    } catch (error) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getWebsiteMedia(req: TenantRequest, res: Response) {
    try {
      const media = await WebsiteService.getWebsiteMedia(req.tenantId!);
      res.json({ status: 'success', data: media });
    } catch (error) {
      res.status(500).json({ error: toErrorResponse(error) });
    }
  }

  static async addWebsiteMedia(req: TenantRequest, res: Response) {
    try {
      const { url, filename } = req.body as { url?: string; filename?: string };
      if (!url?.trim()) return res.status(400).json({ error: 'url is required' });
      const item = await WebsiteService.addWebsiteMediaItem(req.tenantId!, {
        url: url.trim(),
        filename,
      });
      res.status(201).json({ status: 'success', data: item });
    } catch (error) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async removeWebsiteMedia(req: TenantRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const media = await WebsiteService.removeWebsiteMediaItem(req.tenantId!, id);
      res.json({ status: 'success', data: media });
    } catch (error) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }
}
