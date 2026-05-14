import { Router } from 'express';
import { DocumentController } from '../controllers/DocumentController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

// Apply generic middlewares
router.use(tenantMiddleware);
router.use(authenticateToken);

router.post('/', requirePermission('manage_documents'), DocumentController.createDocument as any);
router.get('/', requirePermission('manage_documents'), DocumentController.getDocuments as any);
router.delete('/:id', requirePermission('manage_documents'), DocumentController.deleteDocument as any);

export default router;
