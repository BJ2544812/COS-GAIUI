import { Router } from 'express';
import { AssetController } from '../controllers/AssetController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

// Authentication and tenant middlewares applied first
router.use(tenantMiddleware);
router.use(authenticateToken);

// Asset stats
router.get('/stats', requirePermission('manage_assets'), AssetController.getAssetStats as any);

// Asset CRUD
router.post('/', requirePermission('manage_assets'), AssetController.createAsset as any);
router.get('/', requirePermission('manage_assets'), AssetController.getAssets as any);
router.get('/:id', requirePermission('manage_assets'), AssetController.getAssetById as any);
router.put('/:id', requirePermission('manage_assets'), AssetController.updateAsset as any);
router.delete('/:id', requirePermission('manage_assets'), AssetController.deleteAsset as any);

// Maintenance Logs (sub-resource)
router.post('/:id/maintenance', requirePermission('manage_assets'), AssetController.createMaintenanceLog as any);
router.get('/:id/maintenance', requirePermission('manage_assets'), AssetController.getMaintenanceLogs as any);

export default router;
