import { Router } from 'express';
import { EventController } from '../controllers/EventController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

router.use(tenantMiddleware);
router.use(authenticateToken);

router.get('/lifecycle/meta', requirePermission('manage_events'), EventController.getLifecycleMeta as any);
router.post('/', requirePermission('manage_events'), EventController.createEvent as any);
router.get('/', requirePermission('manage_events'), EventController.getEvents as any);
router.get('/:id/workspace', requirePermission('manage_events'), EventController.getEventWorkspace as any);
router.get('/:id/responsibilities', requirePermission('manage_events'), EventController.getEventResponsibilities as any);
router.post('/:id/transition', requirePermission('manage_events'), EventController.transitionEvent as any);
router.put('/:id/run-sheet', requirePermission('manage_events'), EventController.updateRunSheet as any);
router.put('/:id/ops-config', requirePermission('manage_events'), EventController.updateOpsConfig as any);
router.get('/:id/live-ops', requirePermission('manage_events'), EventController.getLiveOps as any);
router.put('/:id/live-ops', requirePermission('manage_events'), EventController.updateLiveOps as any);
router.post('/:id/live-ops/advance', requirePermission('manage_events'), EventController.advanceLiveSegment as any);
router.post('/:id/live-ops/emergency', requirePermission('manage_events'), EventController.liveEmergency as any);
router.get('/:id', requirePermission('manage_events'), EventController.getEventById as any);
router.put('/:id', requirePermission('manage_events'), EventController.updateEvent as any);
router.delete('/:id', requirePermission('manage_events'), EventController.deleteEvent as any);

export default router;
