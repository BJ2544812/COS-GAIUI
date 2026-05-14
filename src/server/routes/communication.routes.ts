import { Router } from 'express';
import { CommunicationController } from '../controllers/CommunicationController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

// Apply generic middlewares
router.use(tenantMiddleware);
router.use(authenticateToken);

router.post('/', requirePermission('manage_communication'), CommunicationController.sendCommunication as any);
router.get('/', requirePermission('manage_communication'), CommunicationController.getLogs as any);
router.put('/:id/status', requirePermission('manage_communication'), CommunicationController.updateLogStatus as any);

export default router;
