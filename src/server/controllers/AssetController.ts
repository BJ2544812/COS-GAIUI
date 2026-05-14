import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { AssetService } from '../services/AssetService.js';

export class AssetController {
  static async createAsset(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const asset = await AssetService.createAsset(tenantId, req.body);
      res.status(201).json({ status: 'success', data: asset });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAssets(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const assets = await AssetService.getAssets(tenantId);
      res.status(200).json({ status: 'success', data: assets });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAssetById(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const asset = await AssetService.getAssetById(tenantId, id as string);
      if (!asset) return res.status(404).json({ status: 'error', message: 'Asset not found' });
      res.status(200).json({ status: 'success', data: asset });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async updateAsset(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const asset = await AssetService.updateAsset(tenantId, id as string, req.body);
      res.status(200).json({ status: 'success', data: asset });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteAsset(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      await AssetService.deleteAsset(tenantId, id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async createMaintenanceLog(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const log = await AssetService.createMaintenanceLog(tenantId, id as string, req.body);
      res.status(201).json({ status: 'success', data: log });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getMaintenanceLogs(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const logs = await AssetService.getMaintenanceLogs(tenantId, id as string);
      res.status(200).json({ status: 'success', data: logs });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getAssetStats(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const stats = await AssetService.getAssetStats(tenantId);
      res.status(200).json({ status: 'success', data: stats });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
