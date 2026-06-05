import { Router } from 'express';
import { MemberPortalController } from '../controllers/MemberPortalController.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

router.use(tenantMiddleware);
router.use(authenticateToken);

router.get('/summary', MemberPortalController.getSummary as any);
router.post('/prayer-requests', MemberPortalController.submitPrayerRequest as any);

export default router;
