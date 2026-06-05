import { Router } from 'express';
import { PrayerCareController } from '../controllers/PrayerCareController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

router.use(tenantMiddleware);
router.use(authenticateToken);

router.get('/dashboard', requirePermission('manage_discipleship'), PrayerCareController.getDashboard as any);
router.post('/prayer', requirePermission('manage_discipleship'), PrayerCareController.createPrayer as any);
router.get('/prayer', requirePermission('manage_discipleship'), PrayerCareController.listPrayer as any);
router.get('/prayer/:id', requirePermission('manage_discipleship'), PrayerCareController.getPrayer as any);
router.post('/prayer/:id/assign', requirePermission('manage_discipleship'), PrayerCareController.assignPrayer as any);
router.patch('/prayer/:id', requirePermission('manage_discipleship'), PrayerCareController.updatePrayer as any);
router.post('/prayer/:id/follow-up', requirePermission('manage_discipleship'), PrayerCareController.addFollowUp as any);
router.post('/prayer/:id/answered', requirePermission('manage_discipleship'), PrayerCareController.markAnswered as any);
router.post('/prayer/:id/close', requirePermission('manage_discipleship'), PrayerCareController.closePrayer as any);
router.post('/prayer/:id/archive', requirePermission('manage_discipleship'), PrayerCareController.archivePrayer as any);

export default router;
