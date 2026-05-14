import { Router } from 'express';
import { DiscipleshipController } from '../controllers/DiscipleshipController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

// Apply generic middlewares
router.use(tenantMiddleware);
router.use(authenticateToken);

router.post('/', requirePermission('manage_discipleship'), DiscipleshipController.createCareNote as any);
router.get('/member/:memberId', requirePermission('manage_discipleship'), DiscipleshipController.getCareNotesByMember as any);
router.put('/:id', requirePermission('manage_discipleship'), DiscipleshipController.updateCareNote as any);
router.delete('/:id', requirePermission('manage_discipleship'), DiscipleshipController.deleteCareNote as any);

export default router;
