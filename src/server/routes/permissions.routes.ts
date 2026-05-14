import { Router } from 'express';
import { PermissionController } from '../controllers/PermissionController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

router.use(tenantMiddleware);
router.use(authenticateToken);
router.use(requirePermission('manage_settings')); // High-level gate for entire module

// Roles
router.get('/roles', PermissionController.getRoles as any);
router.post('/roles', PermissionController.upsertRole as any);
router.delete('/roles/:id', PermissionController.deleteRole as any);

// Users
router.get('/users', PermissionController.getUsers as any);
router.post('/users', PermissionController.upsertUser as any);
router.post('/users/reset-password', PermissionController.resetPassword as any);

// Master Permission List
router.get('/list', PermissionController.getPermissions as any);

export default router;
