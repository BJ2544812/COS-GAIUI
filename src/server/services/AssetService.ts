import { AssetRepository } from '../repositories/AssetRepository.js';

export class AssetService {
  static async createAsset(tenantId: string, data: any) {
    if (!data.name) throw new Error('Asset name is required');
    if (!data.value && data.value !== 0) throw new Error('Asset value is required');
    return AssetRepository.createAsset(tenantId, data);
  }

  static async getAssets(tenantId: string) {
    return AssetRepository.getAssets(tenantId);
  }

  static async getAssetById(tenantId: string, id: string) {
    return AssetRepository.getAssetById(tenantId, id);
  }

  static async updateAsset(tenantId: string, id: string, data: any) {
    return AssetRepository.updateAsset(tenantId, id, data);
  }

  static async deleteAsset(tenantId: string, id: string) {
    return AssetRepository.deleteAsset(tenantId, id);
  }

  static async createMaintenanceLog(tenantId: string, assetId: string, data: any) {
    if (!data.serviceType) throw new Error('Service type is required');
    if (!data.description) throw new Error('Description is required');
    return AssetRepository.createMaintenanceLog(tenantId, assetId, data);
  }

  static async getMaintenanceLogs(tenantId: string, assetId: string) {
    return AssetRepository.getMaintenanceLogs(tenantId, assetId);
  }

  static async getAssetStats(tenantId: string) {
    return AssetRepository.getAssetStats(tenantId);
  }
}
