import { Router } from 'express';
import { OutreachController } from '../controllers/OutreachController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

// Apply generic middlewares
router.use(tenantMiddleware);
router.use(authenticateToken);

router.post('/', requirePermission('manage_outreach'), OutreachController.createContact as any);
router.get('/', requirePermission('manage_outreach'), OutreachController.getContacts as any);
router.put('/:id', requirePermission('manage_outreach'), OutreachController.updateContact as any);
router.delete('/:id', requirePermission('manage_outreach'), OutreachController.deleteContact as any);

export default router;
