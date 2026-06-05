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
router.post('/donations/:id/reverse', requirePermission('manage_giving'), GivingController.reverseDonation as any);
router.get('/donations/reconciliation', requirePermission('manage_giving'), GivingController.getDonationReconciliation as any);
router.get('/donations/:id/receipt', requirePermission('manage_giving'), GivingController.getDonationReceipt as any);
router.get('/donations/:id/receipt/pdf', requirePermission('manage_giving'), GivingController.getDonationReceiptPdf as any);
router.post('/donations/:id/receipt/regenerate', requirePermission('manage_giving'), GivingController.regenerateDonationReceipt as any);
router.get('/receipts', requirePermission('manage_giving'), GivingController.listFinancialReceipts as any);
router.get('/payment-gateway', requirePermission('manage_giving'), GivingController.getPaymentGateway as any);
router.post('/gateway/estimate-fee', requirePermission('manage_giving'), GivingController.estimateGatewayFee as any);

router.get('/gateway/reconciliation', requirePermission('manage_giving'), GivingController.getGatewayReconciliationDashboard as any);
router.get('/gateway/pending-settlements', requirePermission('manage_giving'), GivingController.listPendingSettlementDonations as any);
router.post('/gateway/settlements/import', requirePermission('manage_giving'), GivingController.importGatewaySettlement as any);
router.post('/gateway/settlements/:settlementId/post', requirePermission('manage_giving'), GivingController.postGatewaySettlement as any);

router.get('/service-sessions', requirePermission('manage_giving'), GivingController.listServiceCollectionSessions as any);
router.post('/service-sessions', requirePermission('manage_giving'), GivingController.createServiceCollectionSession as any);
router.get('/data-quality', requirePermission('manage_giving'), GivingController.getDataQualityReport as any);

export default router;
