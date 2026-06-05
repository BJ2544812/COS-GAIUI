import { Router } from 'express';
import { AccountingController } from '../controllers/AccountingController.js';
import { authenticateToken, requirePermission } from '../middleware/auth.middleware.js';
import { tenantMiddleware } from '../middleware/tenant.middleware.js';

const router = Router();

// Apply generic middlewares
router.use(tenantMiddleware);
router.use(authenticateToken);

router.post('/accounts', requirePermission('manage_finance'), AccountingController.createAccount as any);
router.patch('/accounts/:id', requirePermission('manage_finance'), AccountingController.updateAccount as any);
router.get('/accounts', requirePermission('manage_finance'), AccountingController.getAccounts as any);
router.post('/vendors', requirePermission('manage_finance'), AccountingController.createVendor as any);
router.get('/vendors', requirePermission('manage_finance'), AccountingController.getVendors as any);
router.post('/budgets', requirePermission('manage_finance'), AccountingController.createBudget as any);
router.get('/budgets', requirePermission('manage_finance'), AccountingController.getBudgets as any);
router.get('/budgets/vs-actual', requirePermission('manage_finance'), AccountingController.getBudgetVsActual as any);
router.post('/events/:eventId/accounting', requirePermission('manage_finance'), AccountingController.postEventAccountingVoucher as any);
router.get('/events/:eventId/accounting-statement', requirePermission('manage_finance'), AccountingController.getEventAccountingStatement as any);
router.post('/bank-reconciliation/sessions', requirePermission('manage_finance'), AccountingController.createBankReconciliationSession as any);
router.post('/bank-reconciliation/sessions/:sessionId/lines', requirePermission('manage_finance'), AccountingController.importBankStatementLines as any);
router.post('/bank-reconciliation/sessions/:sessionId/auto-match', requirePermission('manage_finance'), AccountingController.autoMatchBankReconciliation as any);
router.get('/bank-reconciliation/sessions/:sessionId', requirePermission('manage_finance'), AccountingController.getBankReconciliationSummary as any);
router.post('/petty-cash/topups', requirePermission('manage_finance'), AccountingController.createPettyCashTopup as any);
router.post('/petty-cash/reimbursements', requirePermission('manage_finance'), AccountingController.createPettyCashReimbursement as any);
router.get('/petty-cash/summary', requirePermission('manage_finance'), AccountingController.getPettyCashSummary as any);
router.post('/payroll/runs', requirePermission('manage_finance'), AccountingController.createPayrollRun as any);
router.get('/payroll/runs', requirePermission('manage_finance'), AccountingController.getPayrollRuns as any);
router.post('/payroll/runs/:runId/pay', requirePermission('manage_finance'), AccountingController.payPayrollRun as any);
router.get('/payroll/payslips/:payrollLineId', requirePermission('manage_finance'), AccountingController.getPayslip as any);
router.post('/assets/:assetId/capitalize', requirePermission('manage_finance'), AccountingController.capitalizeAsset as any);
router.post('/assets/depreciation/run', requirePermission('manage_finance'), AccountingController.runAssetDepreciation as any);
router.post('/assets/:assetId/dispose', requirePermission('manage_finance'), AccountingController.disposeAsset as any);
router.post('/payables/bills', requirePermission('manage_finance'), AccountingController.createPayableBill as any);
router.get('/payables/bills', requirePermission('manage_finance'), AccountingController.getPayableBills as any);
router.post('/payables/payments', requirePermission('manage_finance'), AccountingController.createPayablePayment as any);
router.post('/funds', requirePermission('manage_finance'), AccountingController.createFund as any);
router.get('/funds', requirePermission('manage_finance'), AccountingController.getFunds as any);
router.patch('/funds/:id', requirePermission('manage_finance'), AccountingController.updateFund as any);
router.post('/fund-transfers', requirePermission('manage_finance'), AccountingController.createInterFundTransfer as any);
router.get('/funds/:id/statement', requirePermission('manage_finance'), AccountingController.getFundStatement as any);

router.post('/vouchers', requirePermission('manage_finance'), AccountingController.createVoucherDraft as any);
router.get('/vouchers', requirePermission('manage_finance'), AccountingController.getVouchers as any);
router.get('/vouchers/:id', requirePermission('manage_finance'), AccountingController.getVoucher as any);
router.get('/vouchers/:id/pdf', requirePermission('manage_finance'), AccountingController.getVoucherPdf as any);
router.put('/vouchers/:id', requirePermission('manage_finance'), AccountingController.updateVoucherDraft as any);
router.delete('/vouchers/:id', requirePermission('manage_finance'), AccountingController.deleteVoucherDraft as any);
router.post('/vouchers/:id/approve', requirePermission('approve_voucher'), AccountingController.approveVoucher as any);
router.post('/vouchers/:id/unapprove', requirePermission('manage_finance'), AccountingController.unapproveVoucher as any);
router.post('/vouchers/:id/post', requirePermission('post_voucher'), AccountingController.postVoucherToLedger as any);
router.post('/vouchers/:id/reversal', requirePermission('manage_finance'), AccountingController.createReversalDraft as any);
router.get('/vouchers/:voucherId/attachment-checksums', requirePermission('manage_finance'), AccountingController.verifyVoucherAttachmentChecksums as any);

router.post('/approvals/rules', requirePermission('manage_finance'), AccountingController.createApprovalRule as any);
router.post('/approvals/requests', requirePermission('manage_finance'), AccountingController.submitApprovalRequest as any);
router.post('/approvals/requests/:approvalRequestId/decide', requirePermission('manage_finance'), AccountingController.decideApprovalRequest as any);
router.get('/approvals/queue', requirePermission('manage_finance'), AccountingController.getApprovalQueue as any);

router.get('/trial-balance', requirePermission('manage_finance'), AccountingController.getTrialBalance as any);
router.get('/ledger/:accountId', requirePermission('manage_finance'), AccountingController.getLedger as any);
router.post('/ca-exports', requirePermission('manage_finance'), AccountingController.exportCaReport as any);
router.post('/financial-years/:financialYearId/close', requirePermission('manage_finance'), AccountingController.closeFinancialYear as any);
router.get('/audit/workpapers', requirePermission('manage_finance'), AccountingController.getAuditWorkpapers as any);
router.get('/audit/logs', requirePermission('manage_finance'), AccountingController.getFinancialAuditLogs as any);

router.get('/receipts', requirePermission('manage_finance'), AccountingController.listFinancialReceipts as any);
router.get('/receipts/:id/pdf', requirePermission('manage_finance'), AccountingController.getReceiptPdf as any);
router.get('/documents/registry', requirePermission('manage_finance'), AccountingController.listDocumentRegistry as any);

export default router;
