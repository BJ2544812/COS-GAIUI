import { Response } from 'express';
import { SermonService } from '../services/SermonService.js';
import { TenantRequest } from '../middleware/tenant.middleware.js';

export class SermonController {
  static async getSermons(req: TenantRequest, res: Response) {
    try {
      const publishedOnly = req.path.includes('/public/');
      const sermons = await SermonService.getSermons(req.tenantId!, { publishedOnly });
      res.json({ status: 'success', data: sermons });
    } catch (error) {
      console.error('[SermonController.getSermons]', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch sermons' });
    }
  }

  static async getSermonById(req: TenantRequest, res: Response) {
    try {
      const sermon = await SermonService.getSermonById(req.tenantId!, req.params.id as string);
      if (!sermon) return res.status(404).json({ status: 'error', message: 'Sermon not found' });
      res.json({ status: 'success', data: sermon });
    } catch (error) {
      console.error('[SermonController.getSermonById]', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch sermon' });
    }
  }

  static async getPublicSermonById(req: TenantRequest, res: Response) {
    try {
      const sermon = await SermonService.getSermonById(req.tenantId!, req.params.id as string);
      if (!sermon || !sermon.isPublished) {
        return res.status(404).json({ status: 'error', message: 'Sermon not found' });
      }
      res.json({ status: 'success', data: sermon });
    } catch (error) {
      console.error('[SermonController.getPublicSermonById]', error);
      res.status(500).json({ status: 'error', message: 'Failed to fetch sermon' });
    }
  }

  static async createSermon(req: TenantRequest, res: Response) {
    try {
      const body = { ...req.body } as Record<string, unknown>;
      if (typeof body.date === 'string') body.date = new Date(body.date);
      const sermon = await SermonService.createSermon(req.tenantId!, body as any);
      res.status(201).json({ status: 'success', data: sermon });
    } catch (error) {
      console.error('[SermonController.createSermon]', error);
      res.status(500).json({ status: 'error', message: 'Failed to create sermon' });
    }
  }

  static async updateSermon(req: TenantRequest, res: Response) {
    try {
      const body = { ...req.body } as Record<string, unknown>;
      if (typeof body.date === 'string') body.date = new Date(body.date);
      const sermon = await SermonService.updateSermon(req.tenantId!, req.params.id as string, body as any);
      res.json({ status: 'success', data: sermon });
    } catch (error) {
      console.error('[SermonController.updateSermon]', error);
      res.status(500).json({ status: 'error', message: 'Failed to update sermon' });
    }
  }

  static async deleteSermon(req: TenantRequest, res: Response) {
    try {
      await SermonService.deleteSermon(req.tenantId!, req.params.id as string);
      res.json({ status: 'success', data: { deleted: true } });
    } catch (error) {
      console.error('[SermonController.deleteSermon]', error);
      res.status(500).json({ status: 'error', message: 'Failed to delete sermon' });
    }
  }
}
