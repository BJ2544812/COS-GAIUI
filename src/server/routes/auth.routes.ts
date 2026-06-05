import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';
import { authRateLimiter } from '../middleware/rateLimits.js';

const router = Router();

// Public route to setup a new tenant (no tenantMiddleware required)
router.post('/setup', AuthController.setupTenant as any);

// Routes that require tenant context
router.use(tenantMiddleware);
router.post('/login', authRateLimiter, AuthController.login as any);
router.post('/forgot-password', authRateLimiter, AuthController.forgotPassword as any);
router.post('/reset-password', authRateLimiter, AuthController.resetPassword as any);

// Routes that require both tenant context and auth
router.get('/me', authenticateToken, AuthController.me as any);

export default router;
