import { Router } from 'express';
import { GivingController } from '../controllers/GivingController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

// Apply generic middlewares
router.use(tenantMiddleware);
router.use(authenticateToken);

router.post('/campaigns', requirePermission('manage_giving'), GivingController.createCampaign as any);
router.get('/campaigns', requirePermission('manage_giving'), GivingController.getCampaigns as any);

router.post('/donations', requirePermission('manage_giving'), GivingController.recordDonation as any);
router.get('/donations', requirePermission('manage_giving'), GivingController.getDonations as any);
router.get('/payment-gateway', requirePermission('manage_giving'), GivingController.getPaymentGateway as any);

export default router;
