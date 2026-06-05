import { prisma } from '../utils/prisma.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EventBus } from '../events/eventBus.js';
import {
  AccountingRepository,
  type CreateVoucherInput,
} from '../repositories/AccountingRepository.js';
import {
  getMergedDocumentSettings,
  getMergedFinancialSettings,
  getMergedOrganizationSettings,
} from '../utils/mergeTenantSettings.js';
import { generatePdfFromHtml, resolvePdfAssetSrc } from '../utils/pdfGenerator.js';
import { buildVoucherPdfHtml } from '../utils/voucherPdfTemplate.js';
import { GivingRepository } from '../repositories/GivingRepository.js';
import { getFinancialYearRange, getFyStartYearForDate } from '../utils/financialYearRange.js';
import { Prisma } from '@prisma/client';
import {
  assertValidDoubleEntry,
  assertDefaultAccounts,
  formatVoucherNoForPost,
} from '../utils/accountingValidation.js';
import { DEFAULT_SETTINGS } from '../utils/settingsDefaults.js';
import { assertPostingNotLocked } from '../utils/periodLock.js';
import { strictLedgerRange } from '../utils/reportDateRange.js';
import { CodedError } from '../utils/apiErrors.js';
import { decimalToNumber, toDecimal2 } from '../utils/money.js';

type Tx = Prisma.TransactionClient;
const FUND_TYPES = new Set(['Restricted', 'Unrestricted', 'BoardDesignated']);

export class AccountingService {
  static async createAccount(tenantId: string, data: Omit<Prisma.AccountCreateInput, 'tenant'>) {
    const account = await AccountingRepository.createAccount(tenantId, data as any);
    await AccountingRepository.createFinancialAuditLog(tenantId, {
      action: 'master_data.account.created',
      entityType: 'Account',
      entityId: account.id,
      afterJson: { code: account.code, name: account.name, type: account.type },
    });
    return account;
  }

  static async getAccounts(tenantId: string) {
    return AccountingRepository.getAccounts(tenantId);
  }

  /** Safe master-data update — name and archive only; code/type immutable after creation. */
  static async updateAccountMaster(
    tenantId: string,
    accountId: string,
    data: { name?: string; isActive?: boolean },
    actorUserId?: string | null,
  ) {
    const before = await AccountingRepository.getAccountById(tenantId, accountId);
    if (!before) throw new CodedError('ACCOUNT_NOT_FOUND', 'Account not found');

    if (data.isActive === false) {
      const bal = Number(before.balance);
      if (Math.abs(bal) > 0.005) {
        throw new CodedError(
          'ACCOUNT_HAS_BALANCE',
          'Cannot archive an account with a non-zero balance. Reclassify balances first.',
        );
      }
    }

    const result = await AccountingRepository.updateAccountMaster(tenantId, accountId, data);
    if (result.count !== 1) throw new CodedError('ACCOUNT_UPDATE_FAILED', 'Account update failed');

    const after = await AccountingRepository.getAccountById(tenantId, accountId);
    await AccountingRepository.createFinancialAuditLog(tenantId, {
      action: 'master_data.account.updated',
      entityType: 'Account',
      entityId: accountId,
      actorUserId: actorUserId ?? null,
      beforeJson: { name: before.name, isActive: before.isActive },
      afterJson: after ? { name: after.name, isActive: after.isActive } : null,
    });
    return after;
  }

  static async createFund(
    tenantId: string,
    data: { name: string; type: string; description?: string | null; isActive?: boolean },
    actorUserId?: string | null
  ) {
    const name = String(data.name || '').trim();
    if (!name) throw new CodedError('FUND_NAME_REQUIRED', 'Fund name is required.');
    if (!FUND_TYPES.has(data.type)) {
      throw new CodedError('FUND_TYPE_INVALID', 'Fund type must be Restricted, Unrestricted, or BoardDesignated.');
    }
    const fund = await AccountingRepository.createFund(tenantId, data);
    await AccountingRepository.createFinancialAuditLog(tenantId, {
      action: 'master_data.fund.created',
      entityType: 'Fund',
      entityId: fund.id,
      actorUserId: actorUserId ?? null,
      afterJson: { name: fund.name, type: fund.type, isActive: fund.isActive },
    });
    return fund;
  }

  static async updateFund(
    tenantId: string,
    fundId: string,
    data: { name?: string; type?: string; description?: string | null; isActive?: boolean },
    actorUserId?: string | null
  ) {
    if (data.type && !FUND_TYPES.has(data.type)) {
      throw new CodedError('FUND_TYPE_INVALID', 'Fund type must be Restricted, Unrestricted, or BoardDesignated.');
    }
    const before = await AccountingRepository.getFundById(tenantId, fundId);
    if (!before) throw new CodedError('FUND_NOT_FOUND', 'Fund not found');
    const result = await AccountingRepository.updateFund(tenantId, fundId, data);
    if (result.count !== 1) throw new CodedError('FUND_UPDATE_FAILED', 'Fund update failed');
    const after = await AccountingRepository.getFundById(tenantId, fundId);
    await AccountingRepository.createFinancialAuditLog(tenantId, {
      action: 'master_data.fund.updated',
      entityType: 'Fund',
      entityId: fundId,
      actorUserId: actorUserId ?? null,
      beforeJson: { name: before.name, type: before.type, isActive: before.isActive, description: before.description },
      afterJson: after ? { name: after.name, type: after.type, isActive: after.isActive, description: after.description } : null,
    });
    return after;
  }

  static async getFunds(tenantId: string) {
    return AccountingRepository.getFunds(tenantId);
  }

  private static async resolveCurrentFinancialYear(tenantId: string) {
    const financial = await getMergedFinancialSettings(tenantId);
    const { start, end, label } = getFinancialYearRange(financial.financialYearStart);
    const existing = await prisma.financialYear.findFirst({
      where: {
        tenantId,
        startDate: start,
        endDate: end,
      },
    });
    if (existing) return existing;
    return prisma.financialYear.create({
      data: {
        tenantId,
        name: label,
        startDate: start,
        endDate: end,
        isActive: true,
        isClosed: false,
      },
    });
  }

  static async createBudget(
    tenantId: string,
    data: {
      financialYearId?: string;
      fundId?: string | null;
      costCenterId?: string | null;
      amount: number;
      trackingMode?: string;
    },
    actorUserId?: string | null
  ) {
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new CodedError('BUDGET_AMOUNT_INVALID', 'Budget amount must be greater than zero.');
    }
    const mode = (data.trackingMode || 'SOFT').toUpperCase();
    if (!['SOFT', 'STRICT'].includes(mode)) {
      throw new CodedError('BUDGET_TRACKING_MODE', 'trackingMode must be SOFT or STRICT.');
    }
    if (!data.fundId && !data.costCenterId) {
      throw new CodedError('BUDGET_DIMENSION_REQUIRED', 'At least fundId or costCenterId is required.');
    }
    await this.ensureDimensionsForLines(tenantId, [
      { fundId: data.fundId ?? undefined, costCenterId: data.costCenterId ?? undefined },
    ]);
    let financialYearId = data.financialYearId;
    if (!financialYearId) {
      const fy = await this.resolveCurrentFinancialYear(tenantId);
      financialYearId = fy.id;
    } else {
      const fy = await prisma.financialYear.findFirst({ where: { id: financialYearId, tenantId } });
      if (!fy) throw new CodedError('FINANCIAL_YEAR_NOT_FOUND', 'Financial year not found for tenant.');
    }
    const budget = await AccountingRepository.createBudget(tenantId, {
      financialYearId,
      fundId: data.fundId ?? null,
      costCenterId: data.costCenterId ?? null,
      amount,
      trackingMode: mode,
    });
    await AccountingRepository.createFinancialAuditLog(tenantId, {
      action: 'budget.created',
      entityType: 'Budget',
      entityId: budget.id,
      actorUserId: actorUserId ?? null,
      afterJson: {
        financialYearId,
        fundId: budget.fundId,
        costCenterId: budget.costCenterId,
        amount,
        trackingMode: mode,
      },
    });
    return budget;
  }

  static async getBudgets(tenantId: string, financialYearId?: string) {
    return AccountingRepository.getBudgets(tenantId, financialYearId);
  }

  static async getBudgetVsActual(tenantId: string, options?: { financialYearId?: string }) {
    const fy = options?.financialYearId
      ? await prisma.financialYear.findFirst({ where: { id: options.financialYearId, tenantId } })
      : await this.resolveCurrentFinancialYear(tenantId);
    if (!fy) throw new CodedError('FINANCIAL_YEAR_NOT_FOUND', 'Financial year not found.');
    const budgets = await AccountingRepository.getBudgets(tenantId, fy.id);
    const rows = await Promise.all(
      budgets.map(async (b) => {
        const agg = await prisma.journalEntry.aggregate({
          _sum: { debit: true, credit: true },
          where: {
            tenantId,
            voucher: { status: 'posted', date: { gte: fy.startDate, lte: fy.endDate } },
            account: { type: 'Expense' },
            ...(b.fundId ? { fundId: b.fundId } : {}),
            ...(b.costCenterId ? { costCenterId: b.costCenterId } : {}),
          },
        });
        const actual = decimalToNumber(agg._sum.debit || 0) - decimalToNumber(agg._sum.credit || 0);
        const budgetAmount = decimalToNumber(b.amount);
        return {
          budgetId: b.id,
          financialYearId: b.financialYearId,
          fundId: b.fundId,
          costCenterId: b.costCenterId,
          trackingMode: b.trackingMode,
          budgetAmount,
          actualAmount: actual,
          variance: budgetAmount - actual,
          utilizationPercent: budgetAmount > 0 ? (actual / budgetAmount) * 100 : 0,
        };
      })
    );
    return {
      financialYear: { id: fy.id, name: fy.name, startDate: fy.startDate, endDate: fy.endDate },
      totals: {
        budget: rows.reduce((s, r) => s + r.budgetAmount, 0),
        actual: rows.reduce((s, r) => s + r.actualAmount, 0),
      },
      rows,
    };
  }

  static async postEventAccountingVoucher(
    tenantId: string,
    eventId: string,
    data: {
      date?: Date;
      amount: number;
      debitAccountId: string;
      creditAccountId: string;
      fundId?: string | null;
      costCenterId?: string | null;
      description?: string | null;
      reference?: string | null;
    },
    actor?: { approvedByUserId?: string | null; postedByUserId?: string | null }
  ) {
    const event = await prisma.event.findFirst({ where: { id: eventId, tenantId } });
    if (!event) throw new CodedError('EVENT_NOT_FOUND', 'Event not found for tenant.');
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new CodedError('EVENT_AMOUNT_INVALID', 'Event accounting amount must be greater than zero.');
    }
    await this.ensureAccountsForLines(tenantId, [{ accountId: data.debitAccountId }, { accountId: data.creditAccountId }]);
    await this.ensureDimensionsForLines(tenantId, [
      { fundId: data.fundId ?? undefined, costCenterId: data.costCenterId ?? undefined },
    ]);
    return this.createApproveAndPostVoucher(
      tenantId,
      {
        type: 'Journal',
        date: data.date ?? new Date(),
        amount,
        description: data.description?.trim() || `Event accounting: ${event.name}`,
        source: 'event_accounting',
        sourceType: 'event_accounting',
        sourceId: eventId,
        sourceMetadata: {
          eventId,
          eventName: event.name,
          reference: data.reference ?? null,
        },
        entries: [
          {
            accountId: data.debitAccountId,
            debit: amount,
            credit: 0,
            narration: `Event ${event.name} debit`,
            fundId: data.fundId || undefined,
            costCenterId: data.costCenterId || undefined,
          },
          {
            accountId: data.creditAccountId,
            debit: 0,
            credit: amount,
            narration: `Event ${event.name} credit`,
            fundId: data.fundId || undefined,
            costCenterId: data.costCenterId || undefined,
          },
        ],
      },
      actor
    );
  }

  static async getEventAccountingStatement(
    tenantId: string,
    eventId: string,
    range?: { from?: string; to?: string }
  ) {
    const event = await prisma.event.findFirst({ where: { id: eventId, tenantId } });
    if (!event) throw new CodedError('EVENT_NOT_FOUND', 'Event not found for tenant.');
    const from = range?.from ? new Date(range.from) : undefined;
    const to = range?.to ? new Date(range.to) : undefined;
    const vouchers = await prisma.voucher.findMany({
      where: {
        tenantId,
        status: 'posted',
        sourceType: 'event_accounting',
        sourceId: eventId,
        ...(from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      },
      include: { journalEntries: { include: { account: true } } },
      orderBy: { date: 'asc' },
    });
    const lines = vouchers.map((v) => ({
      voucherId: v.id,
      voucherNo: v.voucherNo,
      date: v.date,
      amount: decimalToNumber(v.amount),
      description: v.description,
      entries: v.journalEntries.map((e) => ({
        accountId: e.accountId,
        accountCode: e.account.code,
        accountName: e.account.name,
        accountType: e.account.type,
        debit: decimalToNumber(e.debit),
        credit: decimalToNumber(e.credit),
      })),
    }));
    const income = lines
      .flatMap((v) => v.entries)
      .filter((e) => e.accountType === 'Revenue')
      .reduce((s, e) => s + e.credit - e.debit, 0);
    const expenses = lines
      .flatMap((v) => v.entries)
      .filter((e) => e.accountType === 'Expense')
      .reduce((s, e) => s + e.debit - e.credit, 0);
    return {
      event: { id: event.id, name: event.name, date: event.date },
      range: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null },
      totals: { income, expenses, net: income - expenses },
      vouchers: lines,
    };
  }

  static async createVendor(
    tenantId: string,
    data: {
      name: string;
      category?: string | null;
      contactName?: string | null;
      email?: string | null;
      phone?: string | null;
      gstin?: string | null;
      pan?: string | null;
      address?: string | null;
      isActive?: boolean;
    },
    actorUserId?: string | null
  ) {
    const name = String(data.name || '').trim();
    if (!name) throw new CodedError('VENDOR_NAME_REQUIRED', 'Vendor name is required.');
    const vendor = await AccountingRepository.createVendor(tenantId, { ...data, name });
    await AccountingRepository.createFinancialAuditLog(tenantId, {
      action: 'master_data.vendor.created',
      entityType: 'Vendor',
      entityId: vendor.id,
      actorUserId: actorUserId ?? null,
      afterJson: { name: vendor.name, category: vendor.category, isActive: vendor.isActive },
    });
    return vendor;
  }

  static async getVendors(tenantId: string) {
    return AccountingRepository.getVendors(tenantId);
  }

  static async createPayableBill(
    tenantId: string,
    data: {
      vendorId: string;
      billNo: string;
      billDate: Date;
      dueDate?: Date | null;
      amount: number;
      expenseAccountId: string;
      payableAccountId: string;
      fundId?: string | null;
      costCenterId?: string | null;
      description?: string | null;
    },
    actor?: { approvedByUserId?: string | null; postedByUserId?: string | null }
  ) {
    const vendor = await AccountingRepository.getVendorById(tenantId, data.vendorId);
    if (!vendor || !vendor.isActive) throw new CodedError('VENDOR_NOT_FOUND', 'Vendor not found or inactive.');
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new CodedError('BILL_AMOUNT_INVALID', 'Bill amount must be greater than zero.');
    const accounts = await AccountingRepository.getAccountsByIds(tenantId, [data.expenseAccountId, data.payableAccountId]);
    const expense = accounts.find((a) => a.id === data.expenseAccountId);
    const payable = accounts.find((a) => a.id === data.payableAccountId);
    if (!expense || !payable) throw new CodedError('ACCOUNTS_INVALID', 'Expense/payable accounts are invalid.');
    if (expense.type !== 'Expense') throw new CodedError('EXPENSE_ACCOUNT_TYPE', 'Expense account must be type Expense.');
    if (payable.type !== 'Liability') throw new CodedError('PAYABLE_ACCOUNT_TYPE', 'Payable account must be type Liability.');

    return prisma.$transaction(async (tx) => {
      const postedVoucher = await this.createApproveAndPostVoucher(
        tenantId,
        {
          type: 'Journal',
          date: data.billDate,
          amount,
          description: data.description?.trim() || `Vendor bill ${data.billNo} - ${vendor.name}`,
          source: 'vendor_bill',
          sourceType: 'vendor_bill',
          sourceId: data.billNo,
          sourceMetadata: { vendorId: vendor.id, billNo: data.billNo },
          entries: [
            {
              accountId: data.expenseAccountId,
              debit: amount,
              credit: 0,
              narration: `Bill expense: ${vendor.name}`,
              fundId: data.fundId || undefined,
              costCenterId: data.costCenterId || undefined,
            },
            {
              accountId: data.payableAccountId,
              debit: 0,
              credit: amount,
              narration: `Payable created: ${vendor.name}`,
              fundId: data.fundId || undefined,
              costCenterId: data.costCenterId || undefined,
            },
          ],
        },
        actor,
        tx
      );
      const bill = await AccountingRepository.createPayableBill(
        tenantId,
        {
          ...data,
          amount,
          sourceType: 'vendor_bill',
          sourceId: data.billNo,
          sourceMetadata: { vendorId: vendor.id, billNo: data.billNo },
          billVoucherId: postedVoucher.id,
        },
        tx
      );
      await AccountingRepository.createFinancialAuditLog(
        tenantId,
        {
          action: 'payable.bill.created',
          entityType: 'PayableBill',
          entityId: bill.id,
          actorUserId: actor?.postedByUserId ?? actor?.approvedByUserId ?? null,
          afterJson: { billNo: bill.billNo, amount, outstanding: amount, vendorId: vendor.id, voucherId: postedVoucher.id },
        },
        tx
      );
      return bill;
    });
  }

  static async getPayableBills(tenantId: string) {
    return AccountingRepository.getPayableBills(tenantId);
  }

  static async createPayablePayment(
    tenantId: string,
    data: {
      billId: string;
      paymentDate: Date;
      amount: number;
      paymentAccountId: string;
      notes?: string | null;
    },
    actor?: { approvedByUserId?: string | null; postedByUserId?: string | null }
  ) {
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new CodedError('PAYMENT_AMOUNT_INVALID', 'Payment amount must be greater than zero.');
    return prisma.$transaction(async (tx) => {
      const bill = await AccountingRepository.getPayableBillById(tenantId, data.billId, tx);
      if (!bill) throw new CodedError('BILL_NOT_FOUND', 'Payable bill not found.');
      if (bill.status === 'Cancelled') throw new CodedError('BILL_CANCELLED', 'Cancelled bill cannot be paid.');
      const outstanding = decimalToNumber(bill.outstanding);
      if (amount > outstanding) throw new CodedError('PAYMENT_EXCEEDS_OUTSTANDING', 'Payment exceeds bill outstanding.');
      const accounts = await AccountingRepository.getAccountsByIds(tenantId, [data.paymentAccountId, bill.payableAccountId]);
      const paymentAccount = accounts.find((a) => a.id === data.paymentAccountId);
      const payable = accounts.find((a) => a.id === bill.payableAccountId);
      if (!paymentAccount || !payable) throw new CodedError('ACCOUNTS_INVALID', 'Payment/payable accounts are invalid.');
      if (paymentAccount.type !== 'Asset') throw new CodedError('PAYMENT_ACCOUNT_TYPE', 'Payment account must be Asset.');
      if (payable.type !== 'Liability') throw new CodedError('PAYABLE_ACCOUNT_TYPE', 'Payable account must be Liability.');

      const postedVoucher = await this.createApproveAndPostVoucher(
        tenantId,
        {
          type: 'Payment',
          date: data.paymentDate,
          amount,
          description: data.notes?.trim() || `Vendor payment for bill ${bill.billNo}`,
          source: 'vendor_payment',
          sourceType: 'vendor_payment',
          sourceId: bill.id,
          sourceMetadata: { billId: bill.id, billNo: bill.billNo, vendorId: bill.vendorId },
          entries: [
            {
              accountId: bill.payableAccountId,
              debit: amount,
              credit: 0,
              narration: `Payable settled for bill ${bill.billNo}`,
              fundId: bill.fundId || undefined,
              costCenterId: bill.costCenterId || undefined,
            },
            {
              accountId: data.paymentAccountId,
              debit: 0,
              credit: amount,
              narration: `Payment made for bill ${bill.billNo}`,
              fundId: bill.fundId || undefined,
              costCenterId: bill.costCenterId || undefined,
            },
          ],
        },
        actor,
        tx
      );
      const payment = await AccountingRepository.createPayablePayment(
        tenantId,
        {
          vendorId: bill.vendorId,
          billId: bill.id,
          paymentDate: data.paymentDate,
          amount,
          paymentAccountId: data.paymentAccountId,
          payableAccountId: bill.payableAccountId,
          fundId: bill.fundId,
          costCenterId: bill.costCenterId,
          notes: data.notes,
          sourceType: 'vendor_payment',
          sourceId: bill.id,
          paymentVoucherId: postedVoucher.id,
        },
        tx
      );
      const nextOutstanding = Math.max(0, outstanding - amount);
      const nextStatus = nextOutstanding === 0 ? 'Paid' : 'PartiallyPaid';
      await AccountingRepository.updatePayableBillOutstanding(tenantId, bill.id, nextOutstanding, nextStatus);
      await AccountingRepository.createFinancialAuditLog(
        tenantId,
        {
          action: 'payable.payment.recorded',
          entityType: 'PayablePayment',
          entityId: payment.id,
          actorUserId: actor?.postedByUserId ?? actor?.approvedByUserId ?? null,
          afterJson: { billId: bill.id, amount, outstandingAfter: nextOutstanding, paymentVoucherId: postedVoucher.id },
        },
        tx
      );
      return payment;
    });
  }

  private static async ensureAccountsForLines(
    tenantId: string,
    lines: { accountId: string }[]
  ) {
    const ids = [...new Set(lines.map((l) => l.accountId))];
    const accs = await AccountingRepository.getAccountsByIds(tenantId, ids);
    if (accs.length !== ids.length) {
      throw new CodedError('ACCOUNTS_INVALID', 'One or more accounts do not exist for this organization.');
    }
    const inactive = accs.find((a) => !a.isActive);
    if (inactive) {
      throw new CodedError('ACCOUNT_INACTIVE', `Account ${inactive.code} (${inactive.name}) is inactive.`);
    }
  }

  private static async ensureDimensionsForLines(
    tenantId: string,
    lines: { fundId?: string | null; costCenterId?: string | null }[]
  ) {
    const fundIds = [...new Set(lines.map((l) => l.fundId).filter(Boolean) as string[])];
    if (fundIds.length) {
      const funds = await AccountingRepository.getFundsByIds(tenantId, fundIds);
      if (funds.length !== fundIds.length) {
        throw new CodedError('FUNDS_INVALID', 'One or more funds do not exist for this organization.');
      }
      const inactiveFund = funds.find((f) => !f.isActive);
      if (inactiveFund) {
        throw new CodedError('FUND_INACTIVE', `Fund "${inactiveFund.name}" is inactive.`);
      }
    }
    const ccIds = [...new Set(lines.map((l) => l.costCenterId).filter(Boolean) as string[])];
    if (ccIds.length) {
      const costCenters = await AccountingRepository.getCostCentersByIds(tenantId, ccIds);
      if (costCenters.length !== ccIds.length) {
        throw new CodedError('COST_CENTER_INVALID', 'One or more cost centers do not exist for this organization.');
      }
      const inactiveCc = costCenters.find((c) => !c.isActive);
      if (inactiveCc) {
        throw new CodedError('COST_CENTER_INACTIVE', `Cost center "${inactiveCc.name}" is inactive.`);
      }
    }
  }

  private static async enforceFinancialRules(tx: Tx, tenantId: string, date: Date, entries: any[]) {
    // 1. Financial Period Lock Enforcement
    const period = await tx.financialPeriod.findFirst({
      where: {
        financialYear: { tenantId },
        startDate: { lte: date },
        endDate: { gte: date }
      }
    });
    if (period?.isLocked) {
      throw new CodedError('PERIOD_LOCKED', 'The financial period for this date is locked.');
    }

    // 2. Budget Enforcement & 3. Fund Balance Validation
    for (const entry of entries) {
      const entryDebit = decimalToNumber(entry.debit);
      const isExpense = entry.account ? entry.account.type === 'Expense' : true; // fallback if account not loaded
      
      if (entry.fundId || entry.costCenterId) {
        // Find budgets matching this entry
        const budgets = await tx.budget.findMany({
          where: {
            tenantId,
            OR: [
              { fundId: entry.fundId || undefined },
              { costCenterId: entry.costCenterId || undefined }
            ]
          }
        });
        
        for (const budget of budgets) {
          if (isExpense && entryDebit > 0) {
            const spentRes = await tx.journalEntry.aggregate({
              _sum: { debit: true, credit: true },
              where: {
                tenantId,
                voucher: { status: 'posted', date: { gte: period?.startDate, lte: period?.endDate } },
                account: { type: 'Expense' },
                ...(budget.fundId ? { fundId: budget.fundId } : {}),
                ...(budget.costCenterId ? { costCenterId: budget.costCenterId } : {})
              }
            });
            const currentSpent = decimalToNumber(spentRes._sum.debit || 0) - decimalToNumber(spentRes._sum.credit || 0);
            
            if (currentSpent + entryDebit > decimalToNumber(budget.amount)) {
              if (budget.trackingMode === 'STRICT') {
                throw new CodedError('BUDGET_EXCEEDED', 'Transaction exceeds strict budget limits.');
              } else {
                await EventBus.publish({
                  eventName: 'BudgetExceeded',
                  tenantId,
                  entityId: budget.id,
                  entityType: 'Budget',
                  payload: { exceededBy: currentSpent + entryDebit - decimalToNumber(budget.amount) }
                });
              }
            }
          }
        }
      }

      // Fund Balance Validation
      if (entry.fundId && entryDebit > 0) {
        const fund = await tx.fund.findUnique({ where: { id: entry.fundId } });
        if (fund?.type === 'Restricted' && isExpense) {
          const balRes = await tx.journalEntry.aggregate({
            _sum: { credit: true, debit: true },
            where: { tenantId, fundId: entry.fundId, voucher: { status: 'posted' } }
          });
          const availableBalance = decimalToNumber(balRes._sum.credit || 0) - decimalToNumber(balRes._sum.debit || 0);
          if (entryDebit > availableBalance) {
            throw new CodedError('FUND_OVERSPEND', 'Expense exceeds available restricted fund balance.');
          }
        }
      }
    }
  }

  /** Create a draft voucher (no GL impact). */
  static async createVoucherDraft(
    tenantId: string,
    data: CreateVoucherInput,
    actorUserId?: string | null
  ) {
    assertValidDoubleEntry(data.entries, data.amount);
    await this.ensureAccountsForLines(tenantId, data.entries);
    await this.ensureDimensionsForLines(tenantId, data.entries);
    const voucher = await AccountingRepository.createVoucherDraft(tenantId, {
      type: data.type,
      date: data.date,
      amount: data.amount,
      description: data.description,
      entries: data.entries,
      reversesVoucherId: data.reversesVoucherId,
      source: data.source,
      sourceRefId: data.sourceRefId,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      sourceMetadata: data.sourceMetadata,
      attachments: data.attachments,
    });
    await AccountingRepository.createFinancialAuditLog(tenantId, {
      action: 'voucher.created',
      entityType: 'Voucher',
      entityId: voucher.id,
      actorUserId: actorUserId ?? null,
      afterJson: {
        voucherNo: voucher.voucherNo,
        type: voucher.type,
        status: voucher.status,
        amount: decimalToNumber(voucher.amount),
        sourceType: voucher.sourceType ?? voucher.source ?? null,
        sourceId: voucher.sourceId ?? voucher.sourceRefId ?? null,
      },
    });
    return voucher;
  }

  static async updateVoucherDraft(
    tenantId: string,
    voucherId: string,
    data: {
      date?: Date;
      amount?: number;
      description?: string | null;
      entries: CreateVoucherInput['entries'];
      type?: string;
      source?: string | null;
      sourceRefId?: string | null;
      sourceType?: string | null;
      sourceId?: string | null;
      sourceMetadata?: Prisma.InputJsonValue | null;
      attachments?: CreateVoucherInput['attachments'];
    },
    actorUserId?: string | null
  ) {
    const existing = await AccountingRepository.getVoucherById(tenantId, voucherId);
    if (!existing) throw new CodedError('VOUCHER_NOT_FOUND', 'Voucher not found');
    const amt = data.amount;
    if (amt === undefined) {
      assertValidDoubleEntry(data.entries, decimalToNumber(existing.amount));
    } else {
      assertValidDoubleEntry(data.entries, amt);
    }
    await this.ensureAccountsForLines(tenantId, data.entries);
    await this.ensureDimensionsForLines(tenantId, data.entries);
    const voucher = await AccountingRepository.updateVoucherDraft(tenantId, voucherId, {
      date: data.date,
      amount: data.amount,
      description: data.description,
      type: data.type,
      entries: data.entries,
      source: data.source,
      sourceRefId: data.sourceRefId,
      sourceType: data.sourceType,
      sourceId: data.sourceId,
      sourceMetadata: data.sourceMetadata,
      attachments: data.attachments,
    });
    await AccountingRepository.createFinancialAuditLog(tenantId, {
      action: 'voucher.updated',
      entityType: 'Voucher',
      entityId: voucher.id,
      actorUserId: actorUserId ?? null,
      beforeJson: { status: existing.status, amount: decimalToNumber(existing.amount) },
      afterJson: { status: voucher.status, amount: decimalToNumber(voucher.amount) },
    });
    return voucher;
  }

  static async deleteVoucherDraft(tenantId: string, voucherId: string) {
    const existing = await AccountingRepository.getVoucherById(tenantId, voucherId);
    await AccountingRepository.deleteVoucherDraft(tenantId, voucherId);
    if (existing) {
      await AccountingRepository.createFinancialAuditLog(tenantId, {
        action: 'voucher.deleted_draft',
        entityType: 'Voucher',
        entityId: existing.id,
        beforeJson: { status: existing.status, voucherNo: existing.voucherNo },
      });
    }
  }

  /** draft → approved (ready to post) */
  static async approveVoucher(
    tenantId: string,
    voucherId: string,
    approvedByUserId: string | null
  ) {
    const v = await AccountingRepository.getVoucherById(tenantId, voucherId);
    if (!v) throw new CodedError('VOUCHER_NOT_FOUND', 'Voucher not found');
    if (v.status !== 'draft') {
      throw new CodedError('VOUCHER_NOT_DRAFT', 'Only draft vouchers can be approved.');
    }
    const r = await AccountingRepository.setVoucherApproved(tenantId, voucherId, approvedByUserId);
    if (r.count !== 1) throw new CodedError('APPROVE_FAILED', 'Approve failed');
    const voucher = await AccountingRepository.getVoucherById(tenantId, voucherId);
    if (voucher) {
      await AccountingRepository.createFinancialAuditLog(tenantId, {
        action: 'voucher.approved',
        entityType: 'Voucher',
        entityId: voucher.id,
        actorUserId: approvedByUserId ?? null,
        afterJson: { status: voucher.status, approvedByUserId: voucher.approvedByUserId },
      });
    }
    
    // Track A: Event Emission
    if (voucher) {
      await EventBus.publish({
        eventName: 'VoucherApproved',
        tenantId,
        entityId: voucher.id,
        entityType: 'Voucher',
        payload: { type: voucher.type, amount: decimalToNumber(voucher.amount) }
      });
    }
    
    return voucher;
  }

  /** approved → draft */
  static async unapproveVoucher(tenantId: string, voucherId: string) {
    const v = await AccountingRepository.getVoucherById(tenantId, voucherId);
    if (!v) throw new CodedError('VOUCHER_NOT_FOUND', 'Voucher not found');
    if (v.status !== 'approved') {
      throw new CodedError('VOUCHER_NOT_APPROVED', 'Only approved vouchers can be sent back to draft.');
    }
    const r = await AccountingRepository.setVoucherUnapproved(tenantId, voucherId);
    if (r.count !== 1) throw new CodedError('UNAPPROVE_FAILED', 'Unapprove failed');
    const voucher = await AccountingRepository.getVoucherById(tenantId, voucherId);
    if (voucher) {
      await AccountingRepository.createFinancialAuditLog(tenantId, {
        action: 'voucher.unapproved',
        entityType: 'Voucher',
        entityId: voucher.id,
        afterJson: { status: voucher.status },
      });
    }
    return voucher;
  }

  /**
   * approved → posted: assigns sequential PREFIX-YYYY-#####, updates balances.
   * Uses voucher.date for FY scope and settings.* for format.
   */
  static async postVoucherToLedger(
    tenantId: string,
    voucherId: string,
    postedByUserId: string | null
  ) {
    const v0 = await AccountingRepository.getVoucherById(tenantId, voucherId);
    if (!v0) throw new CodedError('VOUCHER_NOT_FOUND', 'Voucher not found');
    const fin = await getMergedFinancialSettings(tenantId);
    assertPostingNotLocked(fin, v0.date);
    const { fyStartYear } = getFyStartYearForDate(fin.financialYearStart, v0.date);
    const run = async (tx: Tx) => {
      await this.enforceFinancialRules(tx, tenantId, v0.date, v0.journalEntries);
      const seq = await AccountingRepository.reserveNextFySequence(tx, tenantId, fyStartYear, v0.type);
      const vno = formatVoucherNoForPost(
        fin.voucherPrefix,
        fyStartYear,
        seq,
        fin.numberingFormat || DEFAULT_SETTINGS.financial.numberingFormat,
        v0.type
      );
      return AccountingRepository.postApprovedVoucherWithTx(tx, tenantId, voucherId, vno, postedByUserId);
    };
    const postedVoucher = await prisma.$transaction((tx) => run(tx));
    await AccountingRepository.createFinancialAuditLog(tenantId, {
      action: postedVoucher.reversesVoucherId ? 'voucher.reversed' : 'voucher.posted',
      entityType: 'Voucher',
      entityId: postedVoucher.id,
      actorUserId: postedByUserId ?? null,
      afterJson: {
        status: postedVoucher.status,
        voucherNo: postedVoucher.voucherNo,
        postedAt: postedVoucher.postedAt?.toISOString() ?? null,
        reversesVoucherId: postedVoucher.reversesVoucherId ?? null,
      },
    });
    
    // Track A: Event Emission
    await EventBus.publish({
      eventName: 'TransactionPosted',
      tenantId,
      entityId: postedVoucher.id,
      entityType: 'Voucher',
      payload: { voucherNo: postedVoucher.voucherNo, type: postedVoucher.type }
    });
    
    return postedVoucher;
  }

  /**
   * System integration: draft → approved → posted in one transaction.
   * Used by Giving; does not allow skipping human workflow for UI-created vouchers.
   */
  static async createApproveAndPostVoucher(
    tenantId: string,
    data: CreateVoucherInput,
    audit?: { approvedByUserId?: string | null; postedByUserId?: string | null },
    outerTx?: Tx
  ) {
    const fin = await getMergedFinancialSettings(tenantId);
    assertPostingNotLocked(fin, data.date);
    assertValidDoubleEntry(data.entries, data.amount);
    await this.ensureAccountsForLines(tenantId, data.entries);
    await this.ensureDimensionsForLines(tenantId, data.entries);
    const run = async (tx: Tx) => {
      const { fyStartYear } = getFyStartYearForDate(fin.financialYearStart, data.date);
      const draft = await AccountingRepository.createVoucherDraft(tenantId, data, tx);
      await AccountingRepository.createFinancialAuditLog(
        tenantId,
        {
          action: 'voucher.created',
          entityType: 'Voucher',
          entityId: draft.id,
          actorUserId: audit?.approvedByUserId ?? null,
          afterJson: { status: draft.status, type: draft.type, amount: decimalToNumber(draft.amount) },
        },
        tx
      );
      const ar = await AccountingRepository.setVoucherApproved(
        tenantId,
        draft.id,
        audit?.approvedByUserId ?? null,
        tx
      );
      if (ar.count !== 1) throw new CodedError('APPROVE_FAILED', 'Approve step failed');
      await AccountingRepository.createFinancialAuditLog(
        tenantId,
        {
          action: 'voucher.approved',
          entityType: 'Voucher',
          entityId: draft.id,
          actorUserId: audit?.approvedByUserId ?? null,
          afterJson: { status: 'approved' },
        },
        tx
      );
      
      const v0 = await AccountingRepository.getVoucherById(tenantId, draft.id, tx);
      await this.enforceFinancialRules(tx, tenantId, draft.date, v0!.journalEntries);
      
      const seq = await AccountingRepository.reserveNextFySequence(tx, tenantId, fyStartYear, draft.type);
      const vno = formatVoucherNoForPost(
        fin.voucherPrefix,
        fyStartYear,
        seq,
        fin.numberingFormat || DEFAULT_SETTINGS.financial.numberingFormat,
        draft.type
      );
      const posted = await AccountingRepository.postApprovedVoucherWithTx(
        tx,
        tenantId,
        draft.id,
        vno,
        audit?.postedByUserId ?? null
      );
      await AccountingRepository.createFinancialAuditLog(
        tenantId,
        {
          action: posted.reversesVoucherId ? 'voucher.reversed' : 'voucher.posted',
          entityType: 'Voucher',
          entityId: posted.id,
          actorUserId: audit?.postedByUserId ?? null,
          afterJson: { status: posted.status, voucherNo: posted.voucherNo },
        },
        tx
      );
      
      // Track A: Event Emission within tx callback (will execute after tx commits if handled right, but await is fine here)
      await EventBus.publish({
        eventName: 'VoucherApproved',
        tenantId,
        entityId: draft.id,
        entityType: 'Voucher',
        payload: { type: draft.type, amount: decimalToNumber(draft.amount) }
      });
      await EventBus.publish({
        eventName: 'TransactionPosted',
        tenantId,
        entityId: draft.id,
        entityType: 'Voucher',
        payload: { voucherNo: vno, type: draft.type }
      });
      
      return posted;
    };
    if (outerTx) return run(outerTx);
    return prisma.$transaction((tx) => run(tx));
  }

  static async getVoucher(tenantId: string, id: string) {
    return AccountingRepository.getVoucherById(tenantId, id);
  }

  /**
   * Reversal: creates a new draft (then caller must approve + post) or
   * we return draft only — user said reversal allowed; use full flow for audit.
   */
  static async createReversalDraft(tenantId: string, originalVoucherId: string) {
    const orig = await AccountingRepository.getVoucherById(tenantId, originalVoucherId);
    if (!orig) throw new CodedError('VOUCHER_NOT_FOUND', 'Original voucher not found');
    if (orig.status !== 'posted') {
      throw new CodedError('REVERSAL_NOT_POSTED', 'Only posted vouchers can be reversed.');
    }
    if (orig.reversalVoucher) {
      throw new CodedError('REVERSAL_EXISTS', 'This voucher already has a reversal.');
    }
    if (orig.journalEntries.length < 2) {
      throw new CodedError('VOUCHER_LINES', 'Original voucher has no lines to reverse.');
    }
    const amountN = decimalToNumber(orig.amount);
    const inv = orig.journalEntries.map((e) => ({
      accountId: e.accountId,
      debit: decimalToNumber(e.credit),
      credit: decimalToNumber(e.debit),
      narration: e.narration ? `Reversal: ${e.narration}` : 'Reversal',
    }));
    assertValidDoubleEntry(inv, amountN);
    await this.ensureAccountsForLines(tenantId, inv);
    return this.createVoucherDraft(tenantId, {
      type: 'Reversal',
      date: new Date(),
      amount: amountN,
      description: `Reversal of ${orig.voucherNo}`,
      entries: inv,
      reversesVoucherId: orig.id,
      source: 'reversal',
      sourceRefId: orig.id,
      sourceType: 'reversal',
      sourceId: orig.id,
      sourceMetadata: {
        originalVoucherId: orig.id,
        originalVoucherNo: orig.voucherNo,
      },
    });
  }

  static async getVouchers(
    tenantId: string,
    options?: {
      currentFinancialYear?: boolean;
      status?: string[];
      /** When true (default with current FY), list only posted vouchers unless status is set. */
      includeDraftsInFy?: boolean;
    }
  ) {
    let range: { gte: Date; lte: Date } | undefined;
    if (options?.currentFinancialYear) {
      const financial = await getMergedFinancialSettings(tenantId);
      const { start, end } = getFinancialYearRange(financial.financialYearStart);
      range = { gte: start, lte: end };
    }
    let statusIn = options?.status;
    if (options?.currentFinancialYear && !statusIn?.length && options?.includeDraftsInFy !== true) {
      statusIn = ['posted'];
    }
    return AccountingRepository.getVouchers(tenantId, range, statusIn);
  }

  static async getTrialBalance(tenantId: string) {
    const fin = await getMergedFinancialSettings(tenantId);
    const rows = await AccountingRepository.getTrialBalanceAccounts(tenantId);
    const lines: {
      id: string;
      code: string;
      name: string;
      type: string;
      balance: number;
      debitColumn: number;
      creditColumn: number;
    }[] = [];
    let tDebit = 0;
    let tCredit = 0;
    for (const a of rows) {
      const b = decimalToNumber(a.balance);
      const isD = ['Asset', 'Expense'].includes(a.type);
      let dCol = 0;
      let cCol = 0;
      if (isD) {
        if (b >= 0) dCol = b;
        else cCol = -b;
      } else {
        if (b >= 0) cCol = b;
        else dCol = -b;
      }
      tDebit += dCol;
      tCredit += cCol;
      lines.push({
        id: a.id,
        code: a.code,
        name: a.name,
        type: a.type,
        balance: b,
        debitColumn: dCol,
        creditColumn: cCol,
      });
    }
    return {
      currency: fin.currency,
      financialYearStart: fin.financialYearStart,
      basis: 'account_balances_from_posted_vouchers' as const,
      accounts: lines,
      totals: { debit: tDebit, credit: tCredit, difference: tDebit - tCredit },
    };
  }

  static async getLedger(
    tenantId: string,
    accountId: string,
    range?: { from?: string; to?: string; useCurrentFy?: boolean }
  ) {
    const fin = await getMergedFinancialSettings(tenantId);
    const r = strictLedgerRange(
      fin.financialYearStart,
      range?.from,
      range?.to,
      range?.useCurrentFy
    ) ??
      (range?.from && range?.to
        ? { gte: new Date(range.from), lte: new Date(range.to) }
        : undefined);
    const acc = await AccountingRepository.getAccountById(tenantId, accountId);
    if (!acc) throw new CodedError('ACCOUNT_NOT_FOUND', 'Account not found');
    let jrows = await AccountingRepository.getLedgerRows(tenantId, accountId, r);
    if (r && r.gte.getTime() > r.lte.getTime()) {
      jrows = [];
    }
    const isD = ['Asset', 'Expense'].includes(acc.type);
    let opening = 0;
    if (r) {
      const pre = await AccountingRepository.getLedgerRowsBefore(tenantId, accountId, r.gte);
      for (const j of pre) {
        const jd = decimalToNumber(j.debit);
        const jc = decimalToNumber(j.credit);
        const d = isD ? jd - jc : jc - jd;
        opening += d;
      }
    }
    let running = opening;
    const lines: {
      id: string;
      isOpening?: boolean;
      date: Date;
      voucherNo: string;
      voucherId: string | null;
      description: string | null;
      type: string;
      debit: number;
      credit: number;
      lineNarration: string | null;
      runningBalance: number;
    }[] = [];
    if (r) {
      lines.push({
        id: 'opening',
        isOpening: true,
        date: r.gte,
        voucherNo: '—',
        voucherId: null,
        description: 'Opening balance',
        type: 'Opening',
        debit: 0,
        credit: 0,
        lineNarration: null,
        runningBalance: opening,
      });
    }
    for (const j of jrows) {
      const jd = decimalToNumber(j.debit);
      const jc = decimalToNumber(j.credit);
      const d = isD ? jd - jc : jc - jd;
      running += d;
      lines.push({
        id: j.id,
        date: j.voucher.date,
        voucherNo: j.voucher.voucherNo,
        voucherId: j.voucherId,
        description: j.voucher.description,
        type: j.voucher.type,
        debit: jd,
        credit: jc,
        lineNarration: j.narration,
        runningBalance: running,
      });
    }
    return {
      currency: fin.currency,
      account: { id: acc.id, code: acc.code, name: acc.name, type: acc.type },
      currentBalance: decimalToNumber(acc.balance),
      lines,
    };
  }

  /** Validate default account ids in saved financial settings (used from Settings or ops). */
  static async validateDefaultAccountIds(
    tenantId: string,
    accts: {
      cash: string;
      bank: string;
      gatewayClearing?: string;
      gatewayRecoveryIncome?: string;
      gatewayChargesExpense?: string;
      tithes: string;
      offerings: string;
    }
  ) {
    const keys = (
      ['cash', 'bank', 'gatewayClearing', 'gatewayRecoveryIncome', 'gatewayChargesExpense', 'tithes', 'offerings'] as const
    ).map((k) => (accts as any)[k] as string);
    const ids = [...new Set(keys.map((k) => (k || '').trim()).filter(Boolean))];
    if (ids.length === 0) return;
    const loaded = await AccountingRepository.getAccountsByIds(tenantId, ids);
    const map = new Map(loaded.map((a) => [a.id, a]));
    if (map.size !== ids.length) {
      throw new CodedError('DEFAULT_ACCOUNTS_INVALID', 'One or more default account ids are invalid for this organization.');
    }
    assertDefaultAccounts(
      {
        cash: accts.cash || '',
        bank: accts.bank || '',
        gatewayClearing: accts.gatewayClearing || '',
        gatewayRecoveryIncome: accts.gatewayRecoveryIncome || '',
        gatewayChargesExpense: accts.gatewayChargesExpense || '',
        tithes: accts.tithes || '',
        offerings: accts.offerings || '',
      },
      map
    );
  }
  static async getAuditWorkpapers(tenantId: string, options?: { useCurrentFy?: boolean }) {
    const fin = await getMergedFinancialSettings(tenantId);
    const org = await getMergedOrganizationSettings(tenantId);
    const range = options?.useCurrentFy 
      ? getFinancialYearRange(fin.financialYearStart) 
      : undefined;

    // ... 1. Trial Balance (existing logic) ...
    const trialBalance = await this.getTrialBalance(tenantId);

    // ... 2. Voucher Register (existing logic) ...
    const postedVouchers = await AccountingRepository.getVouchers(
      tenantId, 
      range ? { gte: range.start, lte: range.end } : undefined, 
      ['posted']
    );

    // ... 3. Exception Report (existing logic) ...
    const exceptions: { type: string; voucherId: string; voucherNo: string; message: string }[] = [];
    const allVouchers = await AccountingRepository.getVouchers(
      tenantId,
      range ? { gte: range.start, lte: range.end } : undefined,
      undefined // all statuses
    );

    // ... report generation logic ...
    const metadata = {
      organization: org.name || 'Church Organization',
      currency: fin.currency,
      financialYear: range?.label || 'All Time',
      generatedAt: new Date().toISOString(),
    };

    const LARGE_TX_THRESHOLD = 50000; // Example threshold for Indian accounting audit
    
    for (const v of allVouchers) {
      if (v.status !== 'posted') {
        exceptions.push({
          type: 'UNPOSTED',
          voucherId: v.id,
          voucherNo: v.voucherNo || 'DRAFT',
          message: `Voucher is in ${v.status} state.`,
        });
      }
      if (!v.description || v.description.trim().length < 5) {
        exceptions.push({
          type: 'MISSING_NARRATION',
          voucherId: v.id,
          voucherNo: v.voucherNo || 'DRAFT',
          message: 'Voucher has missing or insufficient narration.',
        });
      }
      if (decimalToNumber(v.amount) >= LARGE_TX_THRESHOLD) {
        exceptions.push({
          type: 'LARGE_TRANSACTION',
          voucherId: v.id,
          voucherNo: v.voucherNo || 'DRAFT',
          message: `Large transaction above ${LARGE_TX_THRESHOLD}.`,
        });
      }
      
      // Backdated check vs lock date
      if (fin.lockedUntilDate && v.date <= new Date(fin.lockedUntilDate)) {
         exceptions.push({
           type: 'BACKDATED',
           voucherId: v.id,
           voucherNo: v.voucherNo || 'DRAFT',
           message: 'Voucher date is on or before the period lock date.',
         });
      }
    }

    // 4. Receipts & Payments and Income & Expenditure
    // For simplicity, we aggregate from the posted vouchers in memory for this pass
    const accountAggregates: Record<string, { name: string; type: string; debit: number; credit: number }> = {};
    
    for (const v of postedVouchers) {
      for (const entry of v.journalEntries) {
        const acc = entry.account;
        if (!accountAggregates[acc.id]) {
          accountAggregates[acc.id] = { name: acc.name, type: acc.type, debit: 0, credit: 0 };
        }
        accountAggregates[acc.id]!.debit += decimalToNumber(entry.debit);
        accountAggregates[acc.id]!.credit += decimalToNumber(entry.credit);
      }
    }

    const receiptsAndPayments = Object.entries(accountAggregates)
      .filter(([_, data]) => data.type === 'Asset' || data.type === 'Liability')
      .map(([id, data]) => ({ id, ...data }));

    const incomeAndExpenditure = Object.entries(accountAggregates)
      .filter(([_, data]) => data.type === 'Revenue' || data.type === 'Expense')
      .map(([id, data]) => ({ id, ...data }));

    return {
      metadata,
      trialBalance,
      receiptsAndPayments,
      incomeAndExpenditure,
      voucherRegister: postedVouchers.map(v => ({
        id: v.id,
        no: v.voucherNo,
        date: v.date,
        amount: decimalToNumber(v.amount),
        description: v.description
      })),
      exceptions
    };
  }

  static async getFinancialAuditLogs(
    tenantId: string,
    options?: { entityType?: string; entityId?: string; action?: string; limit?: number }
  ) {
    return AccountingRepository.getFinancialAuditLogs(tenantId, options);
  }

  static async createInterFundTransfer(
    tenantId: string,
    data: {
      fromFundId: string;
      toFundId: string;
      amount: number;
      transferAccountId: string;
      date?: Date;
      description?: string;
    },
    actor?: { approvedByUserId?: string | null; postedByUserId?: string | null }
  ) {
    const fromFund = await AccountingRepository.getFundById(tenantId, data.fromFundId);
    const toFund = await AccountingRepository.getFundById(tenantId, data.toFundId);
    if (!fromFund || !toFund) {
      throw new CodedError('FUND_NOT_FOUND', 'Both source and destination funds are required.');
    }
    if (!fromFund.isActive || !toFund.isActive) {
      throw new CodedError('FUND_INACTIVE', 'Cannot transfer with inactive funds.');
    }
    if (fromFund.id === toFund.id) {
      throw new CodedError('FUND_TRANSFER_SAME', 'Source and destination funds must be different.');
    }
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new CodedError('FUND_TRANSFER_AMOUNT', 'Transfer amount must be greater than zero.');
    }
    const date = data.date ?? new Date();
    return this.createApproveAndPostVoucher(
      tenantId,
      {
        type: 'Journal',
        date,
        amount,
        description:
          data.description?.trim() ||
          `Inter-fund transfer: ${fromFund.name} -> ${toFund.name}`,
        source: 'inter_fund_transfer',
        sourceType: 'inter_fund_transfer',
        sourceId: `${fromFund.id}:${toFund.id}:${date.toISOString()}`,
        sourceMetadata: {
          fromFundId: fromFund.id,
          toFundId: toFund.id,
        },
        entries: [
          {
            accountId: data.transferAccountId,
            debit: amount,
            credit: 0,
            narration: `Transfer in to ${toFund.name}`,
            fundId: toFund.id,
          },
          {
            accountId: data.transferAccountId,
            debit: 0,
            credit: amount,
            narration: `Transfer out from ${fromFund.name}`,
            fundId: fromFund.id,
          },
        ],
      },
      {
        approvedByUserId: actor?.approvedByUserId ?? null,
        postedByUserId: actor?.postedByUserId ?? null,
      }
    );
  }

  static async getFundStatement(
    tenantId: string,
    fundId: string,
    range?: { from?: string; to?: string }
  ) {
    const fund = await AccountingRepository.getFundById(tenantId, fundId);
    if (!fund) throw new CodedError('FUND_NOT_FOUND', 'Fund not found');
    const from = range?.from ? new Date(range.from) : undefined;
    const to = range?.to ? new Date(range.to) : undefined;
    const [openingAgg, periodAgg] = await Promise.all([
      prisma.journalEntry.aggregate({
        _sum: { debit: true, credit: true },
        where: {
          tenantId,
          fundId,
          voucher: { status: 'posted', ...(from ? { date: { lt: from } } : {}) },
        },
      }),
      prisma.journalEntry.aggregate({
        _sum: { debit: true, credit: true },
        where: {
          tenantId,
          fundId,
          voucher: {
            status: 'posted',
            ...(from || to
              ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
              : {}),
          },
        },
      }),
    ]);
    const openingBalance = decimalToNumber(openingAgg._sum.credit || 0) - decimalToNumber(openingAgg._sum.debit || 0);
    const periodCredits = decimalToNumber(periodAgg._sum.credit || 0);
    const periodDebits = decimalToNumber(periodAgg._sum.debit || 0);
    return {
      fund: { id: fund.id, name: fund.name, type: fund.type, isActive: fund.isActive },
      range: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null },
      openingBalance,
      receipts: periodCredits,
      expensesAndTransfersOut: periodDebits,
      netChange: periodCredits - periodDebits,
      closingBalance: openingBalance + periodCredits - periodDebits,
    };
  }

  static async createBankReconciliationSession(
    tenantId: string,
    data: { accountId: string; fromDate: Date; toDate: Date },
    actorUserId?: string | null
  ) {
    if (data.fromDate > data.toDate) {
      throw new CodedError('RECO_RANGE_INVALID', 'fromDate must be before toDate.');
    }
    const account = await AccountingRepository.getAccountById(tenantId, data.accountId);
    if (!account) throw new CodedError('ACCOUNT_NOT_FOUND', 'Bank account not found.');
    if (account.type !== 'Asset') throw new CodedError('BANK_ACCOUNT_TYPE', 'Reconciliation account must be an Asset/bank account.');
    const session = await AccountingRepository.createBankReconciliationSession(tenantId, data);
    await AccountingRepository.createFinancialAuditLog(tenantId, {
      action: 'bank_reco.session.created',
      entityType: 'BankReconciliationSession',
      entityId: session.id,
      actorUserId: actorUserId ?? null,
      afterJson: { accountId: session.accountId, fromDate: session.fromDate, toDate: session.toDate },
    });
    return session;
  }

  static async importBankStatementLines(
    tenantId: string,
    sessionId: string,
    lines: Array<{ txnDate: Date; amount: number; direction: string; reference?: string | null; description?: string | null }>,
    actorUserId?: string | null
  ) {
    const session = await AccountingRepository.getBankReconciliationSession(tenantId, sessionId);
    if (!session) throw new CodedError('RECO_SESSION_NOT_FOUND', 'Reconciliation session not found.');
    if (session.status !== 'Open') throw new CodedError('RECO_SESSION_CLOSED', 'Cannot import into a closed reconciliation session.');
    const clean = lines.map((l) => {
      const amount = Number(l.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new CodedError('RECO_LINE_AMOUNT', 'Statement line amount must be greater than zero.');
      }
      const direction = String(l.direction || '').trim();
      if (!['Debit', 'Credit'].includes(direction)) {
        throw new CodedError('RECO_LINE_DIRECTION', 'Statement line direction must be Debit or Credit.');
      }
      return {
        txnDate: l.txnDate instanceof Date ? l.txnDate : new Date(l.txnDate),
        amount,
        direction,
        reference: l.reference ?? null,
        description: l.description ?? null,
      };
    });
    const created = await AccountingRepository.createBankStatementLines(
      tenantId,
      sessionId,
      session.accountId,
      clean
    );
    await AccountingRepository.createFinancialAuditLog(tenantId, {
      action: 'bank_reco.lines.imported',
      entityType: 'BankReconciliationSession',
      entityId: session.id,
      actorUserId: actorUserId ?? null,
      afterJson: { importedCount: created.length },
    });
    return created;
  }

  static async autoMatchBankReconciliation(tenantId: string, sessionId: string, actorUserId?: string | null) {
    const session = await AccountingRepository.getBankReconciliationSession(tenantId, sessionId);
    if (!session) throw new CodedError('RECO_SESSION_NOT_FOUND', 'Reconciliation session not found.');
    const unmatched = await AccountingRepository.getUnmatchedBankStatementLines(tenantId, sessionId);
    const usedVoucherIds = new Set<string>();
    let matched = 0;
    for (const line of unmatched) {
      const amount = decimalToNumber(line.amount);
      const from = new Date(line.txnDate);
      from.setDate(from.getDate() - 3);
      const to = new Date(line.txnDate);
      to.setDate(to.getDate() + 3);
      const candidates = await prisma.journalEntry.findMany({
        where: {
          tenantId,
          accountId: session.accountId,
          voucher: { status: 'posted', date: { gte: from, lte: to } },
          OR: [{ debit: toDecimal2(amount) }, { credit: toDecimal2(amount) }],
        },
        include: { voucher: true },
        orderBy: [{ voucher: { date: 'asc' } }],
      });
      const candidate = candidates.find((c) => !usedVoucherIds.has(c.voucherId));
      if (!candidate) continue;
      const res = await AccountingRepository.markBankStatementLineMatched(tenantId, line.id, candidate.voucherId);
      if (res.count === 1) {
        matched += 1;
        usedVoucherIds.add(candidate.voucherId);
      }
    }
    await AccountingRepository.createFinancialAuditLog(tenantId, {
      action: 'bank_reco.auto_matched',
      entityType: 'BankReconciliationSession',
      entityId: session.id,
      actorUserId: actorUserId ?? null,
      afterJson: { matchedCount: matched },
    });
    return this.getBankReconciliationSummary(tenantId, sessionId);
  }

  static async getBankReconciliationSummary(tenantId: string, sessionId: string) {
    const session = await AccountingRepository.getBankReconciliationSession(tenantId, sessionId);
    if (!session) throw new CodedError('RECO_SESSION_NOT_FOUND', 'Reconciliation session not found.');
    const lines = session.statementLines ?? [];
    const matchedLines = lines.filter((l: any) => l.isMatched);
    const unmatchedLines = lines.filter((l: any) => !l.isMatched);
    const matchedAmount = matchedLines.reduce((s: number, l: any) => s + decimalToNumber(l.amount), 0);
    const unmatchedAmount = unmatchedLines.reduce((s: number, l: any) => s + decimalToNumber(l.amount), 0);
    return {
      session: {
        id: session.id,
        accountId: session.accountId,
        accountCode: session.account?.code ?? null,
        accountName: session.account?.name ?? null,
        fromDate: session.fromDate,
        toDate: session.toDate,
        status: session.status,
      },
      totals: {
        lines: lines.length,
        matchedLines: matchedLines.length,
        unmatchedLines: unmatchedLines.length,
        matchedAmount,
        unmatchedAmount,
      },
      lines,
    };
  }

  static async createPettyCashTopup(
    tenantId: string,
    data: {
      date?: Date;
      amount: number;
      fromAccountId: string;
      pettyCashAccountId: string;
      description?: string | null;
    },
    actor?: { approvedByUserId?: string | null; postedByUserId?: string | null }
  ) {
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new CodedError('PETTY_CASH_AMOUNT', 'Top-up amount must be greater than zero.');
    }
    const accounts = await AccountingRepository.getAccountsByIds(tenantId, [
      data.fromAccountId,
      data.pettyCashAccountId,
    ]);
    const from = accounts.find((a) => a.id === data.fromAccountId);
    const petty = accounts.find((a) => a.id === data.pettyCashAccountId);
    if (!from || !petty) throw new CodedError('ACCOUNTS_INVALID', 'Petty cash top-up accounts are invalid.');
    if (from.type !== 'Asset' || petty.type !== 'Asset') {
      throw new CodedError('PETTY_CASH_ACCOUNT_TYPE', 'Both top-up accounts must be Asset type.');
    }
    return this.createApproveAndPostVoucher(
      tenantId,
      {
        type: 'Contra',
        date: data.date ?? new Date(),
        amount,
        description: data.description?.trim() || 'Petty cash top-up',
        source: 'petty_cash_topup',
        sourceType: 'petty_cash_topup',
        entries: [
          {
            accountId: data.pettyCashAccountId,
            debit: amount,
            credit: 0,
            narration: 'Petty cash top-up received',
          },
          {
            accountId: data.fromAccountId,
            debit: 0,
            credit: amount,
            narration: 'Petty cash top-up disbursed',
          },
        ],
      },
      actor
    );
  }

  static async createPettyCashReimbursement(
    tenantId: string,
    data: {
      date?: Date;
      amount: number;
      expenseAccountId: string;
      pettyCashAccountId: string;
      fundId?: string | null;
      costCenterId?: string | null;
      description?: string | null;
      reference?: string | null;
    },
    actor?: { approvedByUserId?: string | null; postedByUserId?: string | null }
  ) {
    const amount = Number(data.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new CodedError('REIMBURSEMENT_AMOUNT', 'Reimbursement amount must be greater than zero.');
    }
    const accounts = await AccountingRepository.getAccountsByIds(tenantId, [
      data.expenseAccountId,
      data.pettyCashAccountId,
    ]);
    const expense = accounts.find((a) => a.id === data.expenseAccountId);
    const petty = accounts.find((a) => a.id === data.pettyCashAccountId);
    if (!expense || !petty) throw new CodedError('ACCOUNTS_INVALID', 'Expense/petty cash accounts are invalid.');
    if (expense.type !== 'Expense') throw new CodedError('EXPENSE_ACCOUNT_TYPE', 'Expense account must be Expense type.');
    if (petty.type !== 'Asset') throw new CodedError('PETTY_CASH_ACCOUNT_TYPE', 'Petty cash account must be Asset type.');
    await this.ensureDimensionsForLines(tenantId, [
      { fundId: data.fundId ?? undefined, costCenterId: data.costCenterId ?? undefined },
    ]);
    return this.createApproveAndPostVoucher(
      tenantId,
      {
        type: 'Payment',
        date: data.date ?? new Date(),
        amount,
        description: data.description?.trim() || 'Petty cash reimbursement',
        source: 'petty_cash_reimbursement',
        sourceType: 'petty_cash_reimbursement',
        sourceMetadata: { reference: data.reference ?? null },
        entries: [
          {
            accountId: data.expenseAccountId,
            debit: amount,
            credit: 0,
            narration: 'Expense reimbursement via petty cash',
            fundId: data.fundId || undefined,
            costCenterId: data.costCenterId || undefined,
          },
          {
            accountId: data.pettyCashAccountId,
            debit: 0,
            credit: amount,
            narration: 'Petty cash paid out',
            fundId: data.fundId || undefined,
            costCenterId: data.costCenterId || undefined,
          },
        ],
      },
      actor
    );
  }

  static async getPettyCashSummary(
    tenantId: string,
    accountId: string,
    range?: { from?: string; to?: string }
  ) {
    const account = await AccountingRepository.getAccountById(tenantId, accountId);
    if (!account) throw new CodedError('ACCOUNT_NOT_FOUND', 'Petty cash account not found.');
    if (account.type !== 'Asset') throw new CodedError('PETTY_CASH_ACCOUNT_TYPE', 'Petty cash account must be Asset type.');
    const from = range?.from ? new Date(range.from) : undefined;
    const to = range?.to ? new Date(range.to) : undefined;
    const [openingAgg, periodAgg] = await Promise.all([
      prisma.journalEntry.aggregate({
        _sum: { debit: true, credit: true },
        where: {
          tenantId,
          accountId,
          voucher: { status: 'posted', ...(from ? { date: { lt: from } } : {}) },
        },
      }),
      prisma.journalEntry.aggregate({
        _sum: { debit: true, credit: true },
        where: {
          tenantId,
          accountId,
          voucher: {
            status: 'posted',
            ...(from || to
              ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
              : {}),
          },
        },
      }),
    ]);
    const openingBalance = decimalToNumber(openingAgg._sum.debit || 0) - decimalToNumber(openingAgg._sum.credit || 0);
    const inflow = decimalToNumber(periodAgg._sum.debit || 0);
    const outflow = decimalToNumber(periodAgg._sum.credit || 0);
    return {
      account: { id: account.id, code: account.code, name: account.name },
      range: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null },
      openingBalance,
      inflow,
      outflow,
      closingBalance: openingBalance + inflow - outflow,
    };
  }

  static async createPayrollRun(
    tenantId: string,
    data: {
      periodYear: number;
      periodMonth: number;
      lines: Array<{
        memberId: string;
        grossAmount: number;
        deductionAmount?: number;
        salaryExpenseAccountId: string;
        payrollPayableAccountId: string;
      }>;
    },
    actor?: { approvedByUserId?: string | null; postedByUserId?: string | null }
  ) {
    if (!data.lines?.length) throw new CodedError('PAYROLL_LINES_REQUIRED', 'Payroll run requires at least one line.');
    const periodYear = Number(data.periodYear);
    const periodMonth = Number(data.periodMonth);
    if (!Number.isInteger(periodYear) || !Number.isInteger(periodMonth) || periodMonth < 1 || periodMonth > 12) {
      throw new CodedError('PAYROLL_PERIOD_INVALID', 'Invalid payroll period.');
    }
    return prisma.$transaction(async (tx) => {
      const existing = await (tx as any).payrollRun.findFirst({ where: { tenantId, periodYear, periodMonth } });
      if (existing) throw new CodedError('PAYROLL_RUN_EXISTS', 'Payroll run already exists for this period.');
      const totalGross = data.lines.reduce((s, l) => s + Number(l.grossAmount || 0), 0);
      const totalDeductions = data.lines.reduce((s, l) => s + Number(l.deductionAmount || 0), 0);
      const totalNet = totalGross - totalDeductions;
      if (totalNet <= 0) throw new CodedError('PAYROLL_NET_INVALID', 'Payroll total net must be greater than zero.');

      const payableAccountId = data.lines[0]!.payrollPayableAccountId;
      const postedVoucher = await this.createApproveAndPostVoucher(
        tenantId,
        {
          type: 'Journal',
          date: new Date(periodYear, periodMonth - 1, 1),
          amount: totalNet,
          description: `Payroll accrual ${periodYear}-${String(periodMonth).padStart(2, '0')}`,
          source: 'payroll_run',
          sourceType: 'payroll_run',
          sourceId: `${periodYear}-${periodMonth}`,
          entries: [
            {
              accountId: data.lines[0]!.salaryExpenseAccountId,
              debit: totalNet,
              credit: 0,
              narration: 'Salary expense accrual',
            },
            {
              accountId: payableAccountId,
              debit: 0,
              credit: totalNet,
              narration: 'Salary payable accrual',
            },
          ],
        },
        actor,
        tx
      );

      const run = await (tx as any).payrollRun.create({
        data: {
          tenantId,
          periodYear,
          periodMonth,
          status: 'Posted',
          totalGross: toDecimal2(totalGross),
          totalDeductions: toDecimal2(totalDeductions),
          totalNet: toDecimal2(totalNet),
          payableVoucherId: postedVoucher.id,
        },
      });
      for (const line of data.lines) {
        const gross = Number(line.grossAmount || 0);
        const ded = Number(line.deductionAmount || 0);
        const net = gross - ded;
        if (net <= 0) throw new CodedError('PAYROLL_LINE_INVALID', 'Payroll line net must be greater than zero.');
        await (tx as any).payrollLine.create({
          data: {
            tenantId,
            runId: run.id,
            memberId: line.memberId,
            grossAmount: toDecimal2(gross),
            deductionAmount: toDecimal2(ded),
            netAmount: toDecimal2(net),
            salaryExpenseAccountId: line.salaryExpenseAccountId,
            payrollPayableAccountId: line.payrollPayableAccountId,
            payslipNo: `PS-${periodYear}-${String(periodMonth).padStart(2, '0')}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
          },
        });
      }
      await AccountingRepository.createFinancialAuditLog(
        tenantId,
        {
          action: 'payroll.run.created',
          entityType: 'PayrollRun',
          entityId: run.id,
          actorUserId: actor?.postedByUserId ?? actor?.approvedByUserId ?? null,
          afterJson: { periodYear, periodMonth, totalGross, totalDeductions, totalNet, payableVoucherId: postedVoucher.id },
        },
        tx
      );
      return (tx as any).payrollRun.findFirst({
        where: { id: run.id, tenantId },
        include: { lines: true },
      });
    });
  }

  static async payPayrollRun(
    tenantId: string,
    runId: string,
    data: { paymentAccountId: string; paymentDate?: Date; notes?: string | null },
    actor?: { approvedByUserId?: string | null; postedByUserId?: string | null }
  ) {
    return prisma.$transaction(async (tx) => {
      const run = await (tx as any).payrollRun.findFirst({
        where: { tenantId, id: runId },
        include: { lines: true },
      });
      if (!run) throw new CodedError('PAYROLL_RUN_NOT_FOUND', 'Payroll run not found.');
      if (run.paymentVoucherId) throw new CodedError('PAYROLL_ALREADY_PAID', 'Payroll run already paid.');
      const payableAccountId = run.lines[0]?.payrollPayableAccountId;
      if (!payableAccountId) throw new CodedError('PAYROLL_PAYABLE_MISSING', 'Payroll payable account missing.');
      const totalNet = decimalToNumber(run.totalNet);
      const posted = await this.createApproveAndPostVoucher(
        tenantId,
        {
          type: 'Payment',
          date: data.paymentDate ?? new Date(),
          amount: totalNet,
          description: data.notes?.trim() || `Payroll payment ${run.periodYear}-${String(run.periodMonth).padStart(2, '0')}`,
          source: 'payroll_payment',
          sourceType: 'payroll_payment',
          sourceId: run.id,
          entries: [
            { accountId: payableAccountId, debit: totalNet, credit: 0, narration: 'Payroll payable settlement' },
            { accountId: data.paymentAccountId, debit: 0, credit: totalNet, narration: 'Payroll paid from bank/cash' },
          ],
        },
        actor,
        tx
      );
      await (tx as any).payrollRun.update({
        where: { id: run.id },
        data: { paymentVoucherId: posted.id, status: 'Closed' },
      });
      await AccountingRepository.createFinancialAuditLog(
        tenantId,
        {
          action: 'payroll.run.paid',
          entityType: 'PayrollRun',
          entityId: run.id,
          actorUserId: actor?.postedByUserId ?? actor?.approvedByUserId ?? null,
          afterJson: { paymentVoucherId: posted.id, status: 'Closed' },
        },
        tx
      );
      return (tx as any).payrollRun.findFirst({ where: { id: run.id, tenantId }, include: { lines: true } });
    });
  }

  static async getPayrollRuns(tenantId: string) {
    return (prisma as any).payrollRun.findMany({
      where: { tenantId },
      include: { lines: true },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });
  }

  static async getPayslip(tenantId: string, payrollLineId: string) {
    const line = await (prisma as any).payrollLine.findFirst({
      where: { tenantId, id: payrollLineId },
      include: { member: true, run: true },
    });
    if (!line) throw new CodedError('PAYSLIP_NOT_FOUND', 'Payslip not found.');
    return {
      payslipNo: line.payslipNo,
      periodYear: line.run.periodYear,
      periodMonth: line.run.periodMonth,
      member: { id: line.member.id, name: line.member.name },
      grossAmount: decimalToNumber(line.grossAmount),
      deductionAmount: decimalToNumber(line.deductionAmount),
      netAmount: decimalToNumber(line.netAmount),
    };
  }

  static async capitalizeAsset(
    tenantId: string,
    assetId: string,
    data: {
      fixedAssetAccountId: string;
      paymentAccountId: string;
      value?: number;
      purchaseDate?: Date;
      usefulLifeMonths?: number;
      residualValue?: number;
      depreciationMethod?: string;
      notes?: string;
    },
    actor?: { approvedByUserId?: string | null; postedByUserId?: string | null }
  ) {
    return prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findFirst({ where: { id: assetId, tenantId } });
      if (!asset) throw new CodedError('ASSET_NOT_FOUND', 'Asset not found.');
      const value = Number(data.value ?? asset.value ?? 0);
      if (value <= 0) throw new CodedError('ASSET_VALUE_INVALID', 'Asset capitalization value must be greater than zero.');
      const voucher = await this.createApproveAndPostVoucher(
        tenantId,
        {
          type: 'Payment',
          date: data.purchaseDate ?? asset.purchaseDate ?? new Date(),
          amount: value,
          description: data.notes?.trim() || `Asset capitalization - ${asset.name}`,
          source: 'asset_capitalization',
          sourceType: 'asset_capitalization',
          sourceId: asset.id,
          entries: [
            { accountId: data.fixedAssetAccountId, debit: value, credit: 0, narration: 'Asset capitalization' },
            { accountId: data.paymentAccountId, debit: 0, credit: value, narration: 'Asset purchase payment' },
          ],
        },
        actor,
        tx
      );
      await tx.asset.update({
        where: { id: asset.id },
        data: {
          value,
          purchaseDate: data.purchaseDate ?? asset.purchaseDate ?? new Date(),
          capitalizationVoucherId: voucher.id,
          usefulLifeMonths: data.usefulLifeMonths ?? asset.usefulLifeMonths ?? 60,
          residualValue: data.residualValue ?? asset.residualValue ?? 0,
          depreciationMethod: data.depreciationMethod ?? asset.depreciationMethod ?? 'SLM',
          status: 'Active',
        },
      });
      return tx.asset.findFirst({ where: { id: asset.id, tenantId } });
    });
  }

  static async runAssetDepreciation(
    tenantId: string,
    data: {
      asOfDate?: Date;
      depreciationExpenseAccountId: string;
      accumulatedDepreciationAccountId: string;
      assetIds?: string[];
    },
    actor?: { approvedByUserId?: string | null; postedByUserId?: string | null }
  ) {
    return prisma.$transaction(async (tx) => {
      const asOfDate = data.asOfDate ?? new Date();
      const where: any = {
        tenantId,
        status: { not: 'Disposed' },
        purchaseDate: { not: null, lte: asOfDate },
      };
      if (data.assetIds?.length) where.id = { in: data.assetIds };
      const assets = await tx.asset.findMany({ where });
      const calc = assets
        .map((asset) => {
          const usefulLife = Number(asset.usefulLifeMonths || 0);
          if (usefulLife <= 0) return null;
          const base = Number(asset.value || 0) - Number(asset.residualValue || 0);
          if (base <= 0) return null;
          const monthly = decimalToNumber(toDecimal2(base / usefulLife));
          if (monthly <= 0) return null;
          return { asset, amount: monthly };
        })
        .filter(Boolean) as Array<{ asset: any; amount: number }>;
      if (!calc.length) return { posted: false, message: 'No depreciable assets found for run.', entries: [] };
      const total = calc.reduce((s, c) => s + c.amount, 0);
      const voucher = await this.createApproveAndPostVoucher(
        tenantId,
        {
          type: 'Journal',
          date: asOfDate,
          amount: total,
          description: `Asset depreciation run ${asOfDate.toISOString().slice(0, 10)}`,
          source: 'asset_depreciation',
          sourceType: 'asset_depreciation',
          sourceId: `dep-${asOfDate.toISOString().slice(0, 10)}`,
          entries: [
            {
              accountId: data.depreciationExpenseAccountId,
              debit: total,
              credit: 0,
              narration: 'Depreciation expense',
            },
            {
              accountId: data.accumulatedDepreciationAccountId,
              debit: 0,
              credit: total,
              narration: 'Accumulated depreciation',
            },
          ],
        },
        actor,
        tx
      );
      for (const row of calc) {
        const nextAccum = decimalToNumber(toDecimal2(Number(row.asset.accumulatedDepreciation || 0) + row.amount));
        await tx.asset.update({
          where: { id: row.asset.id },
          data: {
            accumulatedDepreciation: nextAccum,
            lastDepreciationDate: asOfDate,
          },
        });
        await (tx as any).assetDepreciationEntry.create({
          data: {
            tenantId,
            assetId: row.asset.id,
            periodDate: asOfDate,
            amount: toDecimal2(row.amount),
            accumulatedAfter: toDecimal2(nextAccum),
            voucherId: voucher.id,
          },
        });
      }
      return {
        posted: true,
        voucherId: voucher.id,
        count: calc.length,
        totalDepreciation: toDecimal2(total),
      };
    });
  }

  static async disposeAsset(
    tenantId: string,
    assetId: string,
    data: {
      fixedAssetAccountId: string;
      accumulatedDepreciationAccountId: string;
      receiptAccountId: string;
      gainLossAccountId: string;
      proceedsAmount?: number;
      disposalDate?: Date;
      notes?: string;
    },
    actor?: { approvedByUserId?: string | null; postedByUserId?: string | null }
  ) {
    return prisma.$transaction(async (tx) => {
      const asset = await tx.asset.findFirst({ where: { tenantId, id: assetId } });
      if (!asset) throw new CodedError('ASSET_NOT_FOUND', 'Asset not found.');
      if (asset.status === 'Disposed') throw new CodedError('ASSET_ALREADY_DISPOSED', 'Asset already disposed.');
      const assetValue = Number(asset.value || 0);
      const accum = Number(asset.accumulatedDepreciation || 0);
      const proceeds = Number(data.proceedsAmount || 0);
      const book = decimalToNumber(toDecimal2(assetValue - accum));
      const diff = decimalToNumber(toDecimal2(proceeds - book));
      const entries: Array<{ accountId: string; debit: number; credit: number; narration?: string }> = [
        { accountId: data.accumulatedDepreciationAccountId, debit: decimalToNumber(toDecimal2(accum)), credit: 0, narration: 'Reverse accumulated depreciation' },
        { accountId: data.fixedAssetAccountId, debit: 0, credit: decimalToNumber(toDecimal2(assetValue)), narration: 'Remove asset cost' },
      ];
      if (proceeds > 0) entries.push({ accountId: data.receiptAccountId, debit: decimalToNumber(toDecimal2(proceeds)), credit: 0, narration: 'Disposal proceeds received' });
      if (diff < 0) entries.push({ accountId: data.gainLossAccountId, debit: Math.abs(diff), credit: 0, narration: 'Loss on disposal' });
      if (diff > 0) entries.push({ accountId: data.gainLossAccountId, debit: 0, credit: diff, narration: 'Gain on disposal' });

      const voucher = await this.createApproveAndPostVoucher(
        tenantId,
        {
          type: 'Journal',
          date: data.disposalDate ?? new Date(),
          amount: Math.max(assetValue, proceeds, Math.abs(diff)),
          description: data.notes?.trim() || `Asset disposal - ${asset.name}`,
          source: 'asset_disposal',
          sourceType: 'asset_disposal',
          sourceId: asset.id,
          entries,
        },
        actor,
        tx
      );
      await tx.asset.update({
        where: { id: asset.id },
        data: {
          status: 'Disposed',
          disposedAt: data.disposalDate ?? new Date(),
          disposalVoucherId: voucher.id,
        },
      });
      return tx.asset.findFirst({ where: { id: asset.id, tenantId } });
    });
  }

  static async createApprovalRule(
    tenantId: string,
    data: { entityType: string; minAmount?: number; moduleKey?: string | null; approverRoleId?: string | null; level?: number },
    actorUserId?: string | null
  ) {
    const rule = await (prisma as any).approvalRule.create({
      data: {
        tenantId,
        entityType: data.entityType,
        minAmount: data.minAmount !== undefined ? toDecimal2(data.minAmount) : null,
        moduleKey: data.moduleKey ?? null,
        approverRoleId: data.approverRoleId ?? null,
        level: data.level ?? 1,
        isActive: true,
      },
    });
    await AccountingRepository.createFinancialAuditLog(tenantId, {
      action: 'approval.rule.created',
      entityType: 'ApprovalRule',
      entityId: rule.id,
      actorUserId: actorUserId ?? null,
      afterJson: { entityType: rule.entityType, level: rule.level, minAmount: rule.minAmount },
    });
    return rule;
  }

  static async submitApprovalRequest(
    tenantId: string,
    data: { entityType: string; entityId: string; amount?: number; moduleKey?: string | null },
    requestedByUserId?: string | null
  ) {
    const rules = await (prisma as any).approvalRule.findMany({
      where: { tenantId, entityType: data.entityType, isActive: true },
      orderBy: { level: 'desc' },
    });
    const maxLevel = rules.reduce((m: number, r: any) => Math.max(m, Number(r.level || 1)), 1);
    const req = await (prisma as any).approvalRequest.create({
      data: {
        tenantId,
        entityType: data.entityType,
        entityId: data.entityId,
        requestedByUserId: requestedByUserId ?? null,
        status: 'Pending',
        currentLevel: 1,
        minRequiredLevel: maxLevel,
        amount: data.amount !== undefined ? toDecimal2(data.amount) : null,
        moduleKey: data.moduleKey ?? null,
      },
    });
    return req;
  }

  static async decideApprovalRequest(
    tenantId: string,
    approvalRequestId: string,
    data: { decision: 'Approved' | 'Rejected'; notes?: string | null },
    actorUserId?: string | null
  ) {
    return prisma.$transaction(async (tx) => {
      const req = await (tx as any).approvalRequest.findFirst({ where: { tenantId, id: approvalRequestId } });
      if (!req) throw new CodedError('APPROVAL_REQUEST_NOT_FOUND', 'Approval request not found.');
      if (req.status !== 'Pending') throw new CodedError('APPROVAL_FINALIZED', 'Approval request already finalized.');
      await (tx as any).approvalDecision.create({
        data: {
          tenantId,
          approvalRequestId,
          level: req.currentLevel,
          decision: data.decision,
          actorUserId: actorUserId ?? null,
          notes: data.notes ?? null,
        },
      });
      if (data.decision === 'Rejected') {
        await (tx as any).approvalRequest.update({
          where: { id: req.id },
          data: { status: 'Rejected' },
        });
      } else {
        const nextLevel = req.currentLevel + 1;
        const done = nextLevel > req.minRequiredLevel;
        await (tx as any).approvalRequest.update({
          where: { id: req.id },
          data: {
            status: done ? 'Approved' : 'Pending',
            currentLevel: done ? req.currentLevel : nextLevel,
          },
        });
      }
      return (tx as any).approvalRequest.findFirst({
        where: { id: req.id, tenantId },
        include: { decisions: true },
      });
    });
  }

  static async getApprovalQueue(tenantId: string) {
    return (prisma as any).approvalRequest.findMany({
      where: { tenantId, status: 'Pending' },
      include: { decisions: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async verifyVoucherAttachmentChecksums(tenantId: string, voucherId: string) {
    const voucher = await AccountingRepository.getVoucherById(tenantId, voucherId);
    if (!voucher) throw new CodedError('VOUCHER_NOT_FOUND', 'Voucher not found.');
    const checks = await Promise.all(
      (voucher.attachments || []).map(async (a: any) => {
        if (!a.fileUrl || !a.checksumSha256) {
          return { attachmentId: a.id, fileUrl: a.fileUrl, verified: false, reason: 'missing_file_or_checksum' };
        }
        const normalized = String(a.fileUrl);
        const relative = normalized.startsWith('/uploads/') ? normalized.replace('/uploads/', '') : normalized.replace(/^\/+/, '');
        const full = path.join(process.cwd(), 'uploads', relative);
        if (!fs.existsSync(full)) {
          return { attachmentId: a.id, fileUrl: a.fileUrl, verified: false, reason: 'file_missing' };
        }
        const bytes = fs.readFileSync(full);
        const hash = crypto.createHash('sha256').update(bytes).digest('hex');
        return { attachmentId: a.id, fileUrl: a.fileUrl, verified: hash === a.checksumSha256, expected: a.checksumSha256, actual: hash };
      })
    );
    return {
      voucherId,
      total: checks.length,
      verified: checks.filter((c) => c.verified).length,
      failed: checks.filter((c) => !c.verified).length,
      checks,
    };
  }

  static async exportCaReport(
    tenantId: string,
    exportType: string,
    options: Record<string, unknown> | undefined,
    generatedByUserId?: string | null
  ) {
    const type = String(exportType || '').trim().toLowerCase();
    let rows: any[] = [];
    if (type === 'trial_balance') {
      const tb = await this.getTrialBalance(tenantId);
      rows = tb.accounts.map((a) => ({
        code: a.code,
        name: a.name,
        type: a.type,
        debit: a.debitColumn,
        credit: a.creditColumn,
      }));
    } else if (type === 'ledger') {
      const accountId = String(options?.accountId || '');
      const report = await this.getLedger(tenantId, accountId, {
        from: options?.from as string | undefined,
        to: options?.to as string | undefined,
      });
      rows = report.lines.map((l) => ({
        date: l.date,
        voucherNo: l.voucherNo,
        type: l.type,
        debit: l.debit,
        credit: l.credit,
        runningBalance: l.runningBalance,
      }));
    } else if (type === 'day_book') {
      const vouchers = await this.getVouchers(tenantId, { status: ['posted'] });
      rows = vouchers.map((v) => ({
        date: v.date,
        voucherNo: v.voucherNo,
        type: v.type,
        amount: decimalToNumber(v.amount),
        description: v.description,
      }));
    } else if (type === 'cash_bank_book') {
      const accts = await this.getAccounts(tenantId);
      const ids = accts.filter((a) => a.type === 'Asset').map((a) => a.id);
      const lines = await prisma.journalEntry.findMany({
        where: { tenantId, accountId: { in: ids }, voucher: { status: 'posted' } },
        include: { voucher: true, account: true },
        orderBy: [{ voucher: { date: 'asc' } }],
      });
      rows = lines.map((l) => ({
        date: l.voucher.date,
        account: `${l.account.code} ${l.account.name}`,
        voucherNo: l.voucher.voucherNo,
        debit: decimalToNumber(l.debit),
        credit: decimalToNumber(l.credit),
      }));
    } else if (type === 'donor_statements') {
      const donations = await (prisma as any).donation.findMany({ where: { tenantId }, include: { donor: true }, orderBy: { date: 'asc' } });
      rows = donations.map((d: any) => ({
        date: d.date,
        donorName: d.donor?.name || 'Anonymous',
        amount: Number(d.amount),
        reference: d.reference,
      }));
    } else if (type === 'fund_statements') {
      const funds = await this.getFunds(tenantId);
      rows = [];
      for (const fund of funds) {
        const s = await this.getFundStatement(tenantId, fund.id);
        rows.push({ fund: fund.name, opening: s.openingBalance, receipts: s.receipts, outflow: s.expensesAndTransfersOut, closing: s.closingBalance });
      }
    } else if (type === 'event_pnl') {
      const events = await (prisma as any).event.findMany({ where: { tenantId }, take: 20, orderBy: { date: 'desc' } });
      rows = [];
      for (const e of events) {
        const s = await this.getEventAccountingStatement(tenantId, e.id);
        rows.push({ event: e.name, date: e.date, income: s.totals.income, expenses: s.totals.expenses, net: s.totals.net });
      }
    } else if (type === 'tally_foundation') {
      const vouchers = await this.getVouchers(tenantId, { status: ['posted'] });
      rows = vouchers.flatMap((v) =>
        v.journalEntries.map((e) => ({
          voucherNo: v.voucherNo,
          date: v.date,
          voucherType: v.type,
          account: `${e.account.code} ${e.account.name}`,
          debit: decimalToNumber(e.debit),
          credit: decimalToNumber(e.credit),
          narration: e.narration,
        }))
      );
    } else {
      throw new CodedError('EXPORT_TYPE_INVALID', 'Unsupported export type.');
    }
    const csvHeader = rows.length ? Object.keys(rows[0]).join(',') : 'no_data';
    const csvBody = rows
      .map((r) => Object.values(r).map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const csv = `${csvHeader}\n${csvBody}`;
    const checksum = crypto.createHash('sha256').update(csv).digest('hex');
    const log = await (prisma as any).exportLog.create({
      data: {
        tenantId,
        exportType: type,
        filtersJson: options ?? null,
        rowCount: rows.length,
        checksumSha256: checksum,
        generatedByUserId: generatedByUserId ?? null,
      },
    });
    await AccountingRepository.createFinancialAuditLog(tenantId, {
      action: 'ca_export.generated',
      entityType: 'ExportLog',
      entityId: log.id,
      actorUserId: generatedByUserId ?? null,
      afterJson: { exportType: type, rowCount: rows.length, checksumSha256: checksum },
    });
    return { exportId: log.id, exportType: type, rowCount: rows.length, checksumSha256: checksum, csv };
  }

  static async closeFinancialYear(
    tenantId: string,
    financialYearId: string,
    notes?: string | null,
    actorUserId?: string | null
  ) {
    return prisma.$transaction(async (tx) => {
      const fy = await tx.financialYear.findFirst({ where: { tenantId, id: financialYearId } });
      if (!fy) throw new CodedError('FINANCIAL_YEAR_NOT_FOUND', 'Financial year not found.');
      if (fy.isClosed) throw new CodedError('FINANCIAL_YEAR_ALREADY_CLOSED', 'Financial year already closed.');
      const tb = await this.getTrialBalance(tenantId);
      if (Math.abs(tb.totals.difference) > 0.01) {
        throw new CodedError('YEAR_CLOSE_TRIAL_BALANCE', 'Cannot close year: trial balance is not in equilibrium.');
      }
      await tx.financialPeriod.updateMany({
        where: { financialYearId: fy.id },
        data: { isLocked: true, isOpen: false },
      });
      await tx.financialYear.update({
        where: { id: fy.id },
        data: { isClosed: true, isActive: false },
      });
      const nextStart = new Date(fy.endDate);
      nextStart.setDate(nextStart.getDate() + 1);
      const nextEnd = new Date(nextStart);
      nextEnd.setFullYear(nextEnd.getFullYear() + 1);
      nextEnd.setDate(nextEnd.getDate() - 1);
      const nextName = `FY ${nextStart.getFullYear()}-${nextEnd.getFullYear()}`;
      await tx.financialYear.create({
        data: {
          tenantId,
          name: nextName,
          startDate: nextStart,
          endDate: nextEnd,
          isActive: true,
          isClosed: false,
        },
      });
      const run = await (tx as any).yearCloseRun.create({
        data: {
          tenantId,
          financialYearId: fy.id,
          status: 'Completed',
          notes: notes ?? null,
        },
      });
      await AccountingRepository.createFinancialAuditLog(
        tenantId,
        {
          action: 'year_close.completed',
          entityType: 'YearCloseRun',
          entityId: run.id,
          actorUserId: actorUserId ?? null,
          afterJson: { financialYearId: fy.id, closedName: fy.name, nextYear: nextName },
        },
        tx
      );
      return run;
    });
  }

  static async generateVoucherPdfBuffer(tenantId: string, voucherId: string) {
    const voucher = await AccountingRepository.getVoucherById(tenantId, voucherId);
    if (!voucher) throw new CodedError('VOUCHER_NOT_FOUND', 'Voucher not found.');

    const [org, fin, docs] = await Promise.all([
      getMergedOrganizationSettings(tenantId),
      getMergedFinancialSettings(tenantId),
      getMergedDocumentSettings(tenantId),
    ]);

    const approval = await prisma.approvalRequest.findFirst({
      where: { tenantId, entityType: { in: ['Voucher', 'voucher'] }, entityId: voucherId },
      include: { decisions: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    const fundIds = [...new Set(voucher.journalEntries.map((je) => je.fundId).filter(Boolean))] as string[];
    const funds =
      fundIds.length > 0
        ? await prisma.fund.findMany({ where: { tenantId, id: { in: fundIds } }, select: { id: true, name: true } })
        : [];
    const fundMap = new Map(funds.map((f) => [f.id, f.name]));

    let totalDebit = 0;
    let totalCredit = 0;
    const lines = voucher.journalEntries.map((je) => {
      const debit = decimalToNumber(je.debit);
      const credit = decimalToNumber(je.credit);
      totalDebit += debit;
      totalCredit += credit;
      return {
        accountCode: je.account.code,
        accountName: je.account.name,
        narration: je.narration,
        debit: debit > 0 ? `${fin.currency} ${debit.toFixed(2)}` : '—',
        credit: credit > 0 ? `${fin.currency} ${credit.toFixed(2)}` : '—',
        fundName: je.fundId ? fundMap.get(je.fundId) ?? null : null,
      };
    });

    const fundNames = [...new Set(lines.map((l) => l.fundName).filter(Boolean))];
    const html = buildVoucherPdfHtml({
      organizationName: org.name || 'Organization',
      organizationAddress: org.address || '',
      organizationEmail: org.email || '',
      organizationPhone: org.phone || '',
      registrationNumber: org.registrationNumber || '',
      taxId: org.taxId || '',
      logoSrc: resolvePdfAssetSrc(org.logo),
      voucherNo: voucher.voucherNo,
      voucherType: voucher.type,
      voucherDate: new Date(voucher.date).toLocaleDateString('en-IN'),
      status: voucher.status,
      narration: voucher.description,
      sourceType: voucher.sourceType || voucher.source || null,
      sourceRef: voucher.sourceId || voucher.sourceRefId || null,
      fundSummary: fundNames.length ? fundNames.join(', ') : null,
      lines,
      totalDebit: `${fin.currency} ${totalDebit.toFixed(2)}`,
      totalCredit: `${fin.currency} ${totalCredit.toFixed(2)}`,
      currency: fin.currency,
      approvedBy: voucher.approvedByUserId || null,
      postedBy: voucher.postedByUserId || null,
      approvalStatus: approval?.status ?? null,
      auditRef: voucher.id,
      generatedAt: new Date().toLocaleString('en-IN'),
      signatoryName: docs.authorizedSignatoryName || null,
      pastorSignatureSrc: resolvePdfAssetSrc(docs.pastorSignature),
      accountantSignatureSrc: resolvePdfAssetSrc(docs.accountantSignature),
      sealSrc: resolvePdfAssetSrc(docs.sealStamp),
    });

    const buffer = await generatePdfFromHtml(html);
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    const safeName = voucher.voucherNo.replace(/[^A-Za-z0-9_-]/g, '_');
    return { buffer, filename: `${safeName}.pdf`, checksum, voucherId: voucher.id };
  }

  static async listDocumentRegistry(
    tenantId: string,
    opts?: {
      limit?: number;
      offset?: number;
      search?: string;
      docType?: 'voucher' | 'receipt' | 'all';
      voucherType?: string;
      status?: string;
      fundId?: string;
      from?: string;
      to?: string;
    }
  ) {
    const limit = Math.min(opts?.limit ?? 50, 100);
    const offset = opts?.offset ?? 0;
    const docType = opts?.docType ?? 'all';
    const from = opts?.from ? new Date(opts.from) : undefined;
    const to = opts?.to ? new Date(opts.to) : undefined;

    const items: Array<{
      id: string;
      kind: 'voucher' | 'receipt';
      number: string;
      type: string;
      date: Date;
      amount: number;
      status: string;
      narration?: string | null;
      donorName?: string | null;
      fundName?: string | null;
      pdfAvailable: boolean;
    }> = [];

    if (docType === 'all' || docType === 'voucher') {
      const vouchers = await AccountingRepository.getVouchersPaginated(
        tenantId,
        from || to ? { gte: from ?? new Date(0), lte: to ?? new Date() } : undefined,
        opts?.status ? [opts.status] : undefined,
        limit,
        offset
      );
      for (const v of vouchers.rows) {
        if (opts?.voucherType && v.type !== opts.voucherType) continue;
        const q = opts?.search?.toLowerCase();
        if (q && !`${v.voucherNo} ${v.description}`.toLowerCase().includes(q)) continue;
        items.push({
          id: v.id,
          kind: 'voucher',
          number: v.voucherNo,
          type: v.type,
          date: v.date,
          amount: decimalToNumber(v.amount),
          status: v.status,
          narration: v.description,
          pdfAvailable: true,
        });
      }
    }

    if (docType === 'all' || docType === 'receipt') {
      const receipts = await GivingRepository.listFinancialReceipts(tenantId, {
        limit,
        offset,
        search: opts?.search,
        fundId: opts?.fundId,
        from,
        to,
      });
      for (const r of receipts.rows) {
        items.push({
          id: r.id,
          kind: 'receipt',
          number: r.receiptNo,
          type: 'Donation Receipt',
          date: r.issueDate,
          amount: Number(r.amount.toString()),
          status: 'issued',
          narration: r.donation?.reference ?? null,
          donorName: r.donorName,
          fundName: r.fund?.name ?? null,
          pdfAvailable: Boolean(r.pdfUrl),
        });
      }
    }

    items.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    return { items: items.slice(0, limit), limit, offset };
  }
}
