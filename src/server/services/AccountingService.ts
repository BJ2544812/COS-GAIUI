import { prisma } from '../utils/prisma.js';
import { EventBus } from '../events/eventBus.js';
import {
  AccountingRepository,
  type CreateVoucherInput,
} from '../repositories/AccountingRepository.js';
import { 
  getMergedFinancialSettings, 
  getMergedOrganizationSettings 
} from '../utils/mergeTenantSettings.js';
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
import { decimalToNumber } from '../utils/money.js';

type Tx = Prisma.TransactionClient;

export class AccountingService {
  static async createAccount(tenantId: string, data: Omit<Prisma.AccountCreateInput, 'tenant'>) {
    return AccountingRepository.createAccount(tenantId, data as any);
  }

  static async getAccounts(tenantId: string) {
    return AccountingRepository.getAccounts(tenantId);
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
  static async createVoucherDraft(tenantId: string, data: CreateVoucherInput) {
    assertValidDoubleEntry(data.entries, data.amount);
    await this.ensureAccountsForLines(tenantId, data.entries);
    return AccountingRepository.createVoucherDraft(tenantId, {
      type: data.type,
      date: data.date,
      amount: data.amount,
      description: data.description,
      entries: data.entries,
      reversesVoucherId: data.reversesVoucherId,
      source: data.source,
      sourceRefId: data.sourceRefId,
    });
  }

  static async updateVoucherDraft(
    tenantId: string,
    voucherId: string,
    data: { date?: Date; amount?: number; description?: string | null; entries: CreateVoucherInput['entries']; type?: string }
  ) {
    const amt = data.amount;
    if (amt === undefined) {
      const v = await AccountingRepository.getVoucherById(tenantId, voucherId);
      if (!v) throw new CodedError('VOUCHER_NOT_FOUND', 'Voucher not found');
      assertValidDoubleEntry(data.entries, decimalToNumber(v.amount));
    } else {
      assertValidDoubleEntry(data.entries, amt);
    }
    await this.ensureAccountsForLines(tenantId, data.entries);
    return AccountingRepository.updateVoucherDraft(tenantId, voucherId, {
      date: data.date,
      amount: data.amount,
      description: data.description,
      type: data.type,
      entries: data.entries,
    });
  }

  static async deleteVoucherDraft(tenantId: string, voucherId: string) {
    return AccountingRepository.deleteVoucherDraft(tenantId, voucherId);
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
    return AccountingRepository.getVoucherById(tenantId, voucherId);
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
    const run = async (tx: Tx) => {
      const { fyStartYear } = getFyStartYearForDate(fin.financialYearStart, data.date);
      const draft = await AccountingRepository.createVoucherDraft(tenantId, data, tx);
      const ar = await AccountingRepository.setVoucherApproved(
        tenantId,
        draft.id,
        audit?.approvedByUserId ?? null,
        tx
      );
      if (ar.count !== 1) throw new CodedError('APPROVE_FAILED', 'Approve step failed');
      
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
    return AccountingRepository.createVoucherDraft(tenantId, {
      type: 'Reversal',
      date: new Date(),
      amount: amountN,
      description: `Reversal of ${orig.voucherNo}`,
      entries: inv,
      reversesVoucherId: orig.id,
      source: 'reversal',
      sourceRefId: orig.id,
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
    accts: { cash: string; bank: string; tithes: string; offerings: string }
  ) {
    const keys = (['cash', 'bank', 'tithes', 'offerings'] as const).map((k) => (accts as any)[k] as string);
    const ids = [...new Set(keys.map((k) => (k || '').trim()).filter(Boolean))];
    if (ids.length === 0) return;
    const loaded = await AccountingRepository.getAccountsByIds(tenantId, ids);
    const map = new Map(loaded.map((a) => [a.id, a]));
    if (map.size !== ids.length) {
      throw new CodedError('DEFAULT_ACCOUNTS_INVALID', 'One or more default account ids are invalid for this organization.');
    }
    assertDefaultAccounts(
      { cash: accts.cash || '', bank: accts.bank || '', tithes: accts.tithes || '', offerings: accts.offerings || '' },
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
}
