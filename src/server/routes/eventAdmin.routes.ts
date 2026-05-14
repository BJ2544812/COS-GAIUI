import { Router } from 'express';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { EventAdminController } from '../controllers/EventAdminController.js';

export const eventAdminRouter = Router();

// Apply tenant context and auth to all routes
eventAdminRouter.use(tenantMiddleware);
eventAdminRouter.use(authenticateToken);
// Assuming 'manage_settings' or a generic admin permission is appropriate for operational visibility
eventAdminRouter.use(requirePermission('manage_settings'));

eventAdminRouter.get('/', EventAdminController.getRecentEvents);
eventAdminRouter.get('/stats', EventAdminController.getEventStats);
eventAdminRouter.post('/replay', EventAdminController.replayFailedEvents);
