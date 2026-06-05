import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { AccountingService } from '../services/AccountingService.js';
import { GivingService } from '../services/GivingService.js';
import { getMergedFinancialSettings } from '../utils/mergeTenantSettings.js';
import { getFinancialYearRange } from '../utils/financialYearRange.js';
import { CodedError, toErrorResponse } from '../utils/apiErrors.js';

function parseDateBody(body: { date?: string | Date }): void {
  if (body?.date) {
    (body as any).date = new Date(body.date);
  }
}

function paramId(p: string | string[] | undefined): string {
  if (p === undefined) return '';
  return Array.isArray(p) ? p[0]! : p;
}

export class AccountingController {
  static async createPayrollRun(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user?.id as string | undefined;
      const run = await AccountingService.createPayrollRun(tenantId, req.body, {
        approvedByUserId: userId ?? null,
        postedByUserId: userId ?? null,
      });
      res.status(201).json({ status: 'success', data: run });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async payPayrollRun(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      if (req.body?.paymentDate) req.body.paymentDate = new Date(req.body.paymentDate);
      const runId = paramId(req.params.runId);
      const userId = req.user?.id as string | undefined;
      const run = await AccountingService.payPayrollRun(tenantId, runId, req.body, {
        approvedByUserId: userId ?? null,
        postedByUserId: userId ?? null,
      });
      res.status(200).json({ status: 'success', data: run });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getPayrollRuns(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const runs = await AccountingService.getPayrollRuns(tenantId);
      res.status(200).json({ status: 'success', data: runs });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getPayslip(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const payrollLineId = paramId(req.params.payrollLineId);
      const payslip = await AccountingService.getPayslip(tenantId, payrollLineId);
      res.status(200).json({ status: 'success', data: payslip });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async createApprovalRule(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user?.id as string | undefined;
      const rule = await AccountingService.createApprovalRule(tenantId, req.body, userId ?? null);
      res.status(201).json({ status: 'success', data: rule });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async submitApprovalRequest(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user?.id as string | undefined;
      const request = await AccountingService.submitApprovalRequest(tenantId, req.body, userId ?? null);
      res.status(201).json({ status: 'success', data: request });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async decideApprovalRequest(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const approvalRequestId = paramId(req.params.approvalRequestId);
      const userId = req.user?.id as string | undefined;
      const request = await AccountingService.decideApprovalRequest(tenantId, approvalRequestId, req.body, userId ?? null);
      res.status(200).json({ status: 'success', data: request });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getApprovalQueue(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const queue = await AccountingService.getApprovalQueue(tenantId);
      res.status(200).json({ status: 'success', data: queue });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async verifyVoucherAttachmentChecksums(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const voucherId = paramId(req.params.voucherId);
      const report = await AccountingService.verifyVoucherAttachmentChecksums(tenantId, voucherId);
      res.status(200).json({ status: 'success', data: report });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async exportCaReport(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const type = String(req.query.type || req.body?.type || '');
      const userId = req.user?.id as string | undefined;
      const report = await AccountingService.exportCaReport(tenantId, type, req.body ?? {}, userId ?? null);
      res.status(200).json({ status: 'success', data: report });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async closeFinancialYear(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const financialYearId = paramId(req.params.financialYearId);
      const userId = req.user?.id as string | undefined;
      const run = await AccountingService.closeFinancialYear(
        tenantId,
        financialYearId,
        (req.body?.notes as string | undefined) ?? null,
        userId ?? null
      );
      res.status(200).json({ status: 'success', data: run });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async capitalizeAsset(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const assetId = paramId(req.params.assetId);
      if (req.body?.purchaseDate) req.body.purchaseDate = new Date(req.body.purchaseDate);
      const userId = req.user?.id as string | undefined;
      const asset = await AccountingService.capitalizeAsset(tenantId, assetId, req.body, {
        approvedByUserId: userId ?? null,
        postedByUserId: userId ?? null,
      });
      res.status(200).json({ status: 'success', data: asset });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async runAssetDepreciation(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      if (req.body?.asOfDate) req.body.asOfDate = new Date(req.body.asOfDate);
      const userId = req.user?.id as string | undefined;
      const result = await AccountingService.runAssetDepreciation(tenantId, req.body, {
        approvedByUserId: userId ?? null,
        postedByUserId: userId ?? null,
      });
      res.status(200).json({ status: 'success', data: result });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async disposeAsset(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const assetId = paramId(req.params.assetId);
      if (req.body?.disposalDate) req.body.disposalDate = new Date(req.body.disposalDate);
      const userId = req.user?.id as string | undefined;
      const result = await AccountingService.disposeAsset(tenantId, assetId, req.body, {
        approvedByUserId: userId ?? null,
        postedByUserId: userId ?? null,
      });
      res.status(200).json({ status: 'success', data: result });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async createPettyCashTopup(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      parseDateBody(req.body);
      const userId = req.user?.id as string | undefined;
      const voucher = await AccountingService.createPettyCashTopup(tenantId, req.body, {
        approvedByUserId: userId ?? null,
        postedByUserId: userId ?? null,
      });
      res.status(201).json({ status: 'success', data: voucher });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async createPettyCashReimbursement(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      parseDateBody(req.body);
      const userId = req.user?.id as string | undefined;
      const voucher = await AccountingService.createPettyCashReimbursement(tenantId, req.body, {
        approvedByUserId: userId ?? null,
        postedByUserId: userId ?? null,
      });
      res.status(201).json({ status: 'success', data: voucher });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getPettyCashSummary(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const accountId = String(req.query.accountId || '');
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const summary = await AccountingService.getPettyCashSummary(tenantId, accountId, { from, to });
      res.status(200).json({ status: 'success', data: summary });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async createBankReconciliationSession(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      if (req.body?.fromDate) req.body.fromDate = new Date(req.body.fromDate);
      if (req.body?.toDate) req.body.toDate = new Date(req.body.toDate);
      const userId = req.user?.id as string | undefined;
      const session = await AccountingService.createBankReconciliationSession(tenantId, req.body, userId ?? null);
      res.status(201).json({ status: 'success', data: session });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async importBankStatementLines(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const sessionId = paramId(req.params.sessionId);
      const lines = Array.isArray(req.body?.lines) ? req.body.lines : [];
      const userId = req.user?.id as string | undefined;
      const created = await AccountingService.importBankStatementLines(
        tenantId,
        sessionId,
        lines.map((l: any) => ({
          txnDate: new Date(l.txnDate),
          amount: l.amount,
          direction: l.direction,
          reference: l.reference,
          description: l.description,
        })),
        userId ?? null
      );
      res.status(201).json({ status: 'success', data: created });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async autoMatchBankReconciliation(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const sessionId = paramId(req.params.sessionId);
      const userId = req.user?.id as string | undefined;
      const summary = await AccountingService.autoMatchBankReconciliation(tenantId, sessionId, userId ?? null);
      res.status(200).json({ status: 'success', data: summary });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getBankReconciliationSummary(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const sessionId = paramId(req.params.sessionId);
      const summary = await AccountingService.getBankReconciliationSummary(tenantId, sessionId);
      res.status(200).json({ status: 'success', data: summary });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async createBudget(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user?.id as string | undefined;
      const budget = await AccountingService.createBudget(tenantId, req.body, userId ?? null);
      res.status(201).json({ status: 'success', data: budget });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getBudgets(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const financialYearId = typeof req.query.financialYearId === 'string' ? req.query.financialYearId : undefined;
      const budgets = await AccountingService.getBudgets(tenantId, financialYearId);
      res.status(200).json({ status: 'success', data: budgets });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getBudgetVsActual(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const financialYearId = typeof req.query.financialYearId === 'string' ? req.query.financialYearId : undefined;
      const report = await AccountingService.getBudgetVsActual(tenantId, { financialYearId });
      res.status(200).json({ status: 'success', data: report });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async postEventAccountingVoucher(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const eventId = paramId(req.params.eventId);
      parseDateBody(req.body);
      const userId = req.user?.id as string | undefined;
      const voucher = await AccountingService.postEventAccountingVoucher(tenantId, eventId, req.body, {
        approvedByUserId: userId ?? null,
        postedByUserId: userId ?? null,
      });
      res.status(201).json({ status: 'success', data: voucher });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getEventAccountingStatement(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const eventId = paramId(req.params.eventId);
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const report = await AccountingService.getEventAccountingStatement(tenantId, eventId, { from, to });
      res.status(200).json({ status: 'success', data: report });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async createVendor(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user?.id as string | undefined;
      const vendor = await AccountingService.createVendor(tenantId, req.body, userId ?? null);
      res.status(201).json({ status: 'success', data: vendor });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getVendors(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const vendors = await AccountingService.getVendors(tenantId);
      res.status(200).json({ status: 'success', data: vendors });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async createPayableBill(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      if (req.body?.billDate) req.body.billDate = new Date(req.body.billDate);
      if (req.body?.dueDate) req.body.dueDate = new Date(req.body.dueDate);
      const userId = req.user?.id as string | undefined;
      const bill = await AccountingService.createPayableBill(tenantId, req.body, {
        approvedByUserId: userId ?? null,
        postedByUserId: userId ?? null,
      });
      res.status(201).json({ status: 'success', data: bill });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getPayableBills(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const bills = await AccountingService.getPayableBills(tenantId);
      res.status(200).json({ status: 'success', data: bills });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async createPayablePayment(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      if (req.body?.paymentDate) req.body.paymentDate = new Date(req.body.paymentDate);
      const userId = req.user?.id as string | undefined;
      const payment = await AccountingService.createPayablePayment(tenantId, req.body, {
        approvedByUserId: userId ?? null,
        postedByUserId: userId ?? null,
      });
      res.status(201).json({ status: 'success', data: payment });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async createFund(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user?.id as string | undefined;
      const fund = await AccountingService.createFund(tenantId, req.body, userId ?? null);
      res.status(201).json({ status: 'success', data: fund });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async updateFund(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const id = paramId(req.params.id);
      const userId = req.user?.id as string | undefined;
      const fund = await AccountingService.updateFund(tenantId, id, req.body, userId ?? null);
      res.status(200).json({ status: 'success', data: fund });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getFunds(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const funds = await AccountingService.getFunds(tenantId);
      res.status(200).json({ status: 'success', data: funds });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async createInterFundTransfer(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      parseDateBody(req.body);
      const userId = req.user?.id as string | undefined;
      const voucher = await AccountingService.createInterFundTransfer(tenantId, req.body, {
        approvedByUserId: userId ?? null,
        postedByUserId: userId ?? null,
      });
      res.status(201).json({ status: 'success', data: voucher });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getFundStatement(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const id = paramId(req.params.id);
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const stmt = await AccountingService.getFundStatement(tenantId, id, { from, to });
      res.status(200).json({ status: 'success', data: stmt });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async createAccount(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const account = await AccountingService.createAccount(tenantId, req.body);
      res.status(201).json({ status: 'success', data: account });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getAccounts(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const accounts = await AccountingService.getAccounts(tenantId);
      res.status(200).json({ status: 'success', data: accounts });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async updateAccount(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const id = paramId(req.params.id);
      const body = req.body as { name?: string; isActive?: boolean };
      const userId = req.user?.id as string | undefined;
      const account = await AccountingService.updateAccountMaster(
        tenantId,
        id,
        { name: body.name, isActive: body.isActive },
        userId ?? null,
      );
      res.status(200).json({ status: 'success', data: account });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  /** Create draft only — no direct posting. */
  static async createVoucherDraft(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      parseDateBody(req.body);
      const b = req.body as Record<string, unknown>;
      const source = (typeof b.source === 'string' && b.source) || 'manual';
      const sourceRefId =
        b.sourceRefId === undefined || b.sourceRefId === null
          ? ((req as TenantRequest & { user?: { id?: string } }).user?.id as string | undefined) ?? null
          : (b.sourceRefId as string);
      const sourceType =
        (typeof b.sourceType === 'string' && b.sourceType) ||
        (typeof b.source === 'string' && b.source) ||
        'manual';
      const sourceId =
        b.sourceId === undefined || b.sourceId === null
          ? sourceRefId
          : (b.sourceId as string);
      const userId = req.user?.id as string | undefined;
      const voucher = await AccountingService.createVoucherDraft(tenantId, {
        ...req.body,
        source,
        sourceRefId: sourceRefId || null,
        sourceType,
        sourceId: sourceId || null,
      } as any, userId ?? null);
      res.status(201).json({ status: 'success', data: voucher });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async updateVoucherDraft(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const id = paramId(req.params.id);
      parseDateBody(req.body);
      const userId = req.user?.id as string | undefined;
      const voucher = await AccountingService.updateVoucherDraft(tenantId, id, req.body, userId ?? null);
      res.status(200).json({ status: 'success', data: voucher });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async deleteVoucherDraft(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const id = paramId(req.params.id);
      await AccountingService.deleteVoucherDraft(tenantId, id);
      res.status(204).send();
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getVoucher(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const id = paramId(req.params.id);
      const voucher = await AccountingService.getVoucher(tenantId, id);
      if (!voucher) {
        return res.status(404).json({
          error: toErrorResponse(new CodedError('VOUCHER_NOT_FOUND', 'Voucher not found')),
        });
      }
      res.status(200).json({ status: 'success', data: voucher });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async approveVoucher(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const id = paramId(req.params.id);
      const userId = req.user?.id as string | undefined;
      const voucher = await AccountingService.approveVoucher(
        tenantId,
        id,
        userId ?? null
      );
      res.status(200).json({ status: 'success', data: voucher });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async unapproveVoucher(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const id = paramId(req.params.id);
      const voucher = await AccountingService.unapproveVoucher(tenantId, id);
      res.status(200).json({ status: 'success', data: voucher });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async postVoucherToLedger(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const id = paramId(req.params.id);
      const userId = req.user?.id as string | undefined;
      const voucher = await AccountingService.postVoucherToLedger(
        tenantId,
        id,
        userId ?? null
      );
      res.status(200).json({ status: 'success', data: voucher });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async createReversalDraft(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const id = paramId(req.params.id);
      const voucher = await AccountingService.createReversalDraft(tenantId, id);
      res.status(201).json({ status: 'success', data: voucher });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getVouchers(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const currentFy = req.query.fy === 'current';
      const statusQ = req.query.status;
      const status = typeof statusQ === 'string' && statusQ ? [statusQ] : undefined;
      const includeDraftsInFy = req.query.includeDrafts === '1' || req.query.all === '1';
      const vouchers = await AccountingService.getVouchers(tenantId, {
        currentFinancialYear: currentFy,
        status,
        includeDraftsInFy,
      });
      if (currentFy) {
        const fin = await getMergedFinancialSettings(tenantId);
        const { start, end, label } = getFinancialYearRange(fin.financialYearStart);
        res.status(200).json({
          status: 'success',
          data: vouchers,
          meta: {
            financialYear: label,
            start: start.toISOString(),
            end: end.toISOString(),
            financialYearStart: fin.financialYearStart,
            currency: fin.currency,
          },
        });
        return;
      }
      res.status(200).json({ status: 'success', data: vouchers });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getTrialBalance(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const report = await AccountingService.getTrialBalance(tenantId);
      res.status(200).json({ status: 'success', data: report });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getLedger(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const accountId = paramId(req.params.accountId);
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const useCurrentFy = req.query.fy === 'current';
      const report = await AccountingService.getLedger(tenantId, accountId, {
        from,
        to,
        useCurrentFy,
      });
      res.status(200).json({ status: 'success', data: report });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getAuditWorkpapers(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const useCurrentFy = req.query.fy === 'current';
      const report = await AccountingService.getAuditWorkpapers(tenantId, { useCurrentFy });
      res.status(200).json({ status: 'success', data: report });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getFinancialAuditLogs(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const entityType = typeof req.query.entityType === 'string' ? req.query.entityType : undefined;
      const entityId = typeof req.query.entityId === 'string' ? req.query.entityId : undefined;
      const action = typeof req.query.action === 'string' ? req.query.action : undefined;
      const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
      const logs = await AccountingService.getFinancialAuditLogs(tenantId, {
        entityType,
        entityId,
        action,
        limit: Number.isFinite(limit) ? limit : undefined,
      });
      res.status(200).json({ status: 'success', data: logs });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getVoucherPdf(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const id = paramId(req.params.id);
      const { buffer, filename } = await AccountingService.generateVoucherPdfBuffer(tenantId, id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.send(buffer);
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async listFinancialReceipts(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const offset = Number(req.query.offset) || 0;
      const result = await GivingService.listFinancialReceipts(tenantId, {
        limit,
        offset,
        search: (req.query.search as string) || undefined,
        fundId: (req.query.fundId as string) || undefined,
        campaignId: (req.query.campaignId as string) || undefined,
        from: (req.query.from as string) || undefined,
        to: (req.query.to as string) || undefined,
      });
      res.status(200).json({ status: 'success', data: result.rows, meta: { total: result.total, limit: result.limit, offset: result.offset } });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getReceiptPdf(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const id = paramId(req.params.id);
      const { buffer, filename } = await GivingService.getReceiptPdfBuffer(tenantId, id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.send(buffer);
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async listDocumentRegistry(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const result = await AccountingService.listDocumentRegistry(tenantId, {
        limit: Number(req.query.limit) || 50,
        offset: Number(req.query.offset) || 0,
        search: (req.query.search as string) || undefined,
        docType: (req.query.docType as 'voucher' | 'receipt' | 'all') || 'all',
        voucherType: (req.query.voucherType as string) || undefined,
        status: (req.query.status as string) || undefined,
        fundId: (req.query.fundId as string) || undefined,
        from: (req.query.from as string) || undefined,
        to: (req.query.to as string) || undefined,
      });
      res.status(200).json({ status: 'success', data: result });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }
}
