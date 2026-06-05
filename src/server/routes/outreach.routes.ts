import { Router } from 'express';
import { OutreachController } from '../controllers/OutreachController.js';
import { OutreachOperationsController } from '../controllers/OutreachOperationsController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

router.use(tenantMiddleware);
router.use(authenticateToken);

router.get('/dashboard', requirePermission('manage_outreach'), OutreachOperationsController.getDashboard as any);
router.post('/visitors', requirePermission('manage_outreach'), OutreachOperationsController.registerVisitor as any);
router.post('/follow-ups/:id/complete', requirePermission('manage_outreach'), OutreachOperationsController.completeFollowUp as any);
router.post('/scan/missed-attendance', requirePermission('manage_outreach'), OutreachOperationsController.runMissedAttendanceScan as any);

router.post('/', requirePermission('manage_outreach'), OutreachController.createContact as any);
router.get('/', requirePermission('manage_outreach'), OutreachController.getContacts as any);
router.put('/:id', requirePermission('manage_outreach'), OutreachController.updateContact as any);
router.delete('/:id', requirePermission('manage_outreach'), OutreachController.deleteContact as any);

export default router;
