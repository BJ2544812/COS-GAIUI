import { Router } from 'express';
import { AccountingController } from '../controllers/AccountingController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

// Apply generic middlewares
router.use(tenantMiddleware);
router.use(authenticateToken);

router.post('/accounts', requirePermission('manage_finance'), AccountingController.createAccount as any);
router.get('/accounts', requirePermission('manage_finance'), AccountingController.getAccounts as any);

router.post('/vouchers', requirePermission('manage_finance'), AccountingController.createVoucherDraft as any);
router.get('/vouchers', requirePermission('manage_finance'), AccountingController.getVouchers as any);
router.get('/vouchers/:id', requirePermission('manage_finance'), AccountingController.getVoucher as any);
router.put('/vouchers/:id', requirePermission('manage_finance'), AccountingController.updateVoucherDraft as any);
router.delete('/vouchers/:id', requirePermission('manage_finance'), AccountingController.deleteVoucherDraft as any);
router.post('/vouchers/:id/approve', requirePermission('approve_voucher'), AccountingController.approveVoucher as any);
router.post('/vouchers/:id/unapprove', requirePermission('manage_finance'), AccountingController.unapproveVoucher as any);
router.post('/vouchers/:id/post', requirePermission('post_voucher'), AccountingController.postVoucherToLedger as any);
router.post('/vouchers/:id/reversal', requirePermission('manage_finance'), AccountingController.createReversalDraft as any);

router.get('/trial-balance', requirePermission('manage_finance'), AccountingController.getTrialBalance as any);
router.get('/ledger/:accountId', requirePermission('manage_finance'), AccountingController.getLedger as any);
router.get('/audit/workpapers', requirePermission('manage_finance'), AccountingController.getAuditWorkpapers as any);

export default router;
