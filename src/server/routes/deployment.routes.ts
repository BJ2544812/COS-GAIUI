import { Router } from 'express';
import { DeploymentController } from '../controllers/DeploymentController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

router.get('/setup-status', DeploymentController.setupStatus as any);
router.get('/version', DeploymentController.getVersion as any);

router.get('/infrastructure', tenantMiddleware, DeploymentController.validateInfrastructure as any);

router.use(tenantMiddleware);
router.use(authenticateToken);

router.get('/onboarding', DeploymentController.getOnboarding as any);
router.patch('/onboarding', requirePermission('manage_settings'), DeploymentController.patchOnboarding as any);
router.post('/backup', requirePermission('manage_settings'), DeploymentController.createBackup as any);
router.get('/backups', requirePermission('manage_settings'), DeploymentController.listBackups as any);
router.post('/backups/run', requirePermission('manage_settings'), DeploymentController.runScheduledBackup as any);
router.post('/backups/verify', requirePermission('manage_settings'), DeploymentController.verifyBackup as any);
router.post('/restore', requirePermission('manage_settings'), DeploymentController.restoreBackup as any);
router.post('/demo/activate', requirePermission('manage_settings'), DeploymentController.activateDemo as any);
router.post('/demo/reset', requirePermission('manage_settings'), DeploymentController.resetDemo as any);
router.get('/maintenance', requirePermission('manage_settings'), DeploymentController.getMaintenance as any);
router.put('/maintenance', requirePermission('manage_settings'), DeploymentController.setMaintenance as any);
router.get('/license', requirePermission('manage_settings'), DeploymentController.getLicense as any);

export default router;
