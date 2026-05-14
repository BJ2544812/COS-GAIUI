import { Router } from 'express';
import { EventController } from '../controllers/EventController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

// Apply generic middlewares
router.use(tenantMiddleware);
router.use(authenticateToken);

router.post('/', requirePermission('manage_events'), EventController.createEvent as any);
router.get('/', requirePermission('manage_events'), EventController.getEvents as any);
router.get('/:id', requirePermission('manage_events'), EventController.getEventById as any);
router.put('/:id', requirePermission('manage_events'), EventController.updateEvent as any);
router.delete('/:id', requirePermission('manage_events'), EventController.deleteEvent as any);

export default router;
