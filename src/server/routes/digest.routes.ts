import { Router } from 'express';
import { DigestController } from '../controllers/DigestController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

router.use(tenantMiddleware);
router.use(authenticateToken);

router.get('/', requirePermission('manage_settings'), DigestController.list as any);
router.post('/generate-all', requirePermission('manage_settings'), DigestController.generateAll as any);
router.post('/:type', requirePermission('manage_settings'), DigestController.generate as any);

export default router;
