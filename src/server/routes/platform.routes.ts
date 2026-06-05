import { Router } from 'express';
import { PlatformController } from '../controllers/PlatformController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

router.use(tenantMiddleware);
router.use(authenticateToken);

router.get('/health', requirePermission('manage_settings'), PlatformController.getHealth as any);
router.get('/admin-overview', requirePermission('manage_settings'), PlatformController.getAdminOverview as any);
router.get('/incidents', requirePermission('manage_settings'), PlatformController.getIncidents as any);
router.get('/queue-metrics', requirePermission('manage_settings'), PlatformController.getQueueMetrics as any);
router.post('/workflows/replay-failed', requirePermission('manage_settings'), PlatformController.replayFailedWorkflows as any);
router.post('/incidents/:id/resolve', requirePermission('manage_settings'), PlatformController.resolveIncident as any);
router.post('/operator/cache-flush', requirePermission('manage_settings'), PlatformController.flushCache as any);
router.get('/operator/diagnostics', requirePermission('manage_settings'), PlatformController.getDiagnostics as any);
router.get('/operator/diagnostics/export', requirePermission('manage_settings'), PlatformController.exportDiagnostics as any);
router.get('/integrations', requirePermission('manage_settings'), PlatformController.getIntegrations as any);
router.get('/search', PlatformController.globalSearch as any);
router.get('/feature-flags', requirePermission('manage_settings'), PlatformController.getFeatureFlags as any);
router.put('/feature-flags', requirePermission('manage_settings'), PlatformController.updateFeatureFlags as any);
router.get('/compliance-audit', requirePermission('manage_settings'), PlatformController.getComplianceAudit as any);
router.get('/reports/:kind', requirePermission('manage_analytics'), PlatformController.exportReport as any);
router.post('/client-errors', PlatformController.logClientError as any);

export default router;
