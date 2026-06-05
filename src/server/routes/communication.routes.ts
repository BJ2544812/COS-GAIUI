import { Router } from 'express';
import { CommunicationController } from '../controllers/CommunicationController.js';
import { CommunicationHubController } from '../controllers/CommunicationHubController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { communicationSendRateLimiter } from '../middleware/rateLimits.js';

const router = Router();

router.use(tenantMiddleware);
router.use(authenticateToken);

router.get('/hub', requirePermission('manage_communication'), CommunicationHubController.getCommandCenter as any);
router.post('/hub/audience/preview', requirePermission('manage_communication'), CommunicationHubController.previewAudience as any);
router.post('/hub/campaigns', requirePermission('manage_communication'), CommunicationHubController.createCampaign as any);
router.post(
  '/hub/campaigns/:id/send',
  requirePermission('manage_communication'),
  communicationSendRateLimiter,
  CommunicationHubController.sendCampaign as any,
);

router.post('/', requirePermission('manage_communication'), CommunicationController.sendCommunication as any);
router.get('/', requirePermission('manage_communication'), CommunicationController.getLogs as any);
router.put('/:id/status', requirePermission('manage_communication'), CommunicationController.updateLogStatus as any);

export default router;
