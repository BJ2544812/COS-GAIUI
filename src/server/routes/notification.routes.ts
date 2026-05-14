import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

router.use(tenantMiddleware);
router.use(authenticateToken);

router.get('/', NotificationController.getNotifications as any);
router.post('/read-all', NotificationController.markAllAsRead as any);
router.post('/:id/read', NotificationController.markAsRead as any);

export default router;
