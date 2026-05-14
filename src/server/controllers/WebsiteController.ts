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
}
