import { Router } from 'express';
import { SettingsController } from '../controllers/SettingsController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

// Apply generic middlewares
router.use(tenantMiddleware);
router.use(authenticateToken);

router.post('/', requirePermission('manage_settings'), SettingsController.upsertSetting as any);
router.get('/', requirePermission('manage_settings'), SettingsController.getSettings as any);
router.get('/:key', requirePermission('manage_settings'), SettingsController.getSettingByKey as any);
router.delete('/:key', requirePermission('manage_settings'), SettingsController.deleteSetting as any);

export default router;
