import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { AccountingService } from '../services/AccountingService.js';
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
      const voucher = await AccountingService.createVoucherDraft(tenantId, {
        ...req.body,
        source,
        sourceRefId: sourceRefId || null,
      } as any);
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
      const voucher = await AccountingService.updateVoucherDraft(tenantId, id, req.body);
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
}
