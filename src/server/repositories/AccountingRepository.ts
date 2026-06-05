import { randomUUID } from 'crypto';
import { prisma } from '../utils/prisma.js';
import { Prisma } from '@prisma/client';
import { accountBalanceChange, type JournalLine } from '../utils/accountingValidation.js';
import { toDecimal2 } from '../utils/money.js';
import { CodedError } from '../utils/apiErrors.js';

type Tx = Prisma.TransactionClient;

export interface CreateVoucherInput {
  type: string;
  date: Date;
  amount: number;
  description?: string;
  entries: JournalLine[];
  /** When set, this draft is a reversal of a posted voucher (links after create). */
  reversesVoucherId?: string | null;
  /** Traceability: donation | manual | reversal | import */
  source?: string | null;
  sourceRefId?: string | null;
  sourceType?: string | null;
  sourceId?: string | null;
  sourceMetadata?: Prisma.InputJsonValue | null;
  attachments?: {
    documentId?: string | null;
    fileUrl?: string | null;
    title?: string | null;
    mimeType?: string | null;
    checksumSha256?: string | null;
    sizeBytes?: number | null;
    notes?: string | null;
    createdByUserId?: string | null;
  }[];
}

export class AccountingRepository {
  /** Balance is only updated when posting approved vouchers; creation always starts at zero. */
  static async createAccount(tenantId: string, data: Prisma.AccountCreateInput) {
    const { balance: _drop, ...rest } = data as Prisma.AccountCreateInput & { balance?: number };
    return prisma.account.create({
      data: {
        ...rest,
        balance: 0,
        tenant: { connect: { id: tenantId } },
      },
    });
  }

  static async updateAccountMaster(
    tenantId: string,
    accountId: string,
    data: { name?: string; isActive?: boolean },
  ) {
    return prisma.account.updateMany({
      where: { id: accountId, tenantId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  static async createFund(
    tenantId: string,
    data: { name: string; type: string; description?: string | null; isActive?: boolean }
  ) {
    return prisma.fund.create({
      data: {
        tenantId,
        name: data.name.trim(),
        type: data.type,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
      },
    });
  }

  static async updateFund(
    tenantId: string,
    fundId: string,
    data: { name?: string; type?: string; description?: string | null; isActive?: boolean }
  ) {
    return prisma.fund.updateMany({
      where: { id: fundId, tenantId },
      data: {
        ...(data.name !== undefined ? { name: data.name.trim() } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
  }

  static async getFunds(tenantId: string) {
    return prisma.fund.findMany({
      where: { tenantId },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  static async getFundById(tenantId: string, fundId: string) {
    return prisma.fund.findFirst({ where: { id: fundId, tenantId } });
  }

  static async createBudget(
    tenantId: string,
    data: {
      financialYearId: string;
      fundId?: string | null;
      costCenterId?: string | null;
      amount: number;
      trackingMode?: string;
    }
  ) {
    return prisma.budget.create({
      data: {
        tenantId,
        financialYearId: data.financialYearId,
        fundId: data.fundId ?? null,
        costCenterId: data.costCenterId ?? null,
        amount: toDecimal2(data.amount),
        trackingMode: data.trackingMode || 'SOFT',
      },
      include: { fund: true, costCenter: true, financialYear: true },
    });
  }

  static async getBudgets(tenantId: string, financialYearId?: string) {
    return prisma.budget.findMany({
      where: {
        tenantId,
        ...(financialYearId ? { financialYearId } : {}),
      },
      include: { fund: true, costCenter: true, financialYear: true },
      orderBy: [{ financialYear: { startDate: 'desc' } }],
    });
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
    }
  ) {
    return (prisma as any).vendor.create({
      data: {
        tenantId,
        name: data.name.trim(),
        category: data.category ?? null,
        contactName: data.contactName ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        gstin: data.gstin ?? null,
        pan: data.pan ?? null,
        address: data.address ?? null,
        isActive: data.isActive ?? true,
      },
    });
  }

  static async getVendors(tenantId: string) {
    return (prisma as any).vendor.findMany({
      where: { tenantId },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
  }

  static async getVendorById(tenantId: string, vendorId: string) {
    return (prisma as any).vendor.findFirst({ where: { tenantId, id: vendorId } });
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
      sourceType?: string | null;
      sourceId?: string | null;
      sourceMetadata?: Prisma.InputJsonValue | null;
      billVoucherId?: string | null;
    },
    tx: Tx | null = null
  ) {
    const db = tx ?? prisma;
    return (db as any).payableBill.create({
      data: {
        tenantId,
        vendorId: data.vendorId,
        billNo: data.billNo.trim(),
        billDate: data.billDate,
        dueDate: data.dueDate ?? null,
        amount: toDecimal2(data.amount),
        outstanding: toDecimal2(data.amount),
        expenseAccountId: data.expenseAccountId,
        payableAccountId: data.payableAccountId,
        fundId: data.fundId ?? null,
        costCenterId: data.costCenterId ?? null,
        description: data.description ?? null,
        sourceType: data.sourceType ?? null,
        sourceId: data.sourceId ?? null,
        sourceMetadata: data.sourceMetadata ?? null,
        billVoucherId: data.billVoucherId ?? null,
      },
      include: { vendor: true },
    });
  }

  static async getPayableBills(tenantId: string) {
    return (prisma as any).payableBill.findMany({
      where: { tenantId },
      include: { vendor: true, billVoucher: true, payments: true },
      orderBy: [{ billDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  static async getPayableBillById(tenantId: string, billId: string, tx: Tx | null = null) {
    const db = tx ?? prisma;
    return (db as any).payableBill.findFirst({
      where: { tenantId, id: billId },
      include: { vendor: true, billVoucher: true, payments: true },
    });
  }

  static async createPayablePayment(
    tenantId: string,
    data: {
      vendorId: string;
      billId: string;
      paymentDate: Date;
      amount: number;
      paymentAccountId: string;
      payableAccountId: string;
      fundId?: string | null;
      costCenterId?: string | null;
      notes?: string | null;
      sourceType?: string | null;
      sourceId?: string | null;
      paymentVoucherId?: string | null;
    },
    tx: Tx | null = null
  ) {
    const db = tx ?? prisma;
    return (db as any).payablePayment.create({
      data: {
        tenantId,
        vendorId: data.vendorId,
        billId: data.billId,
        paymentDate: data.paymentDate,
        amount: toDecimal2(data.amount),
        paymentAccountId: data.paymentAccountId,
        payableAccountId: data.payableAccountId,
        fundId: data.fundId ?? null,
        costCenterId: data.costCenterId ?? null,
        notes: data.notes ?? null,
        sourceType: data.sourceType ?? null,
        sourceId: data.sourceId ?? null,
        paymentVoucherId: data.paymentVoucherId ?? null,
      },
      include: { vendor: true, bill: true },
    });
  }

  static async updatePayableBillOutstanding(
    tenantId: string,
    billId: string,
    outstanding: number,
    status: 'Pending' | 'PartiallyPaid' | 'Paid'
  ) {
    return (prisma as any).payableBill.updateMany({
      where: { tenantId, id: billId },
      data: { outstanding: toDecimal2(outstanding), status },
    });
  }

  static async createBankReconciliationSession(
    tenantId: string,
    data: { accountId: string; fromDate: Date; toDate: Date }
  ) {
    return (prisma as any).bankReconciliationSession.create({
      data: {
        tenantId,
        accountId: data.accountId,
        fromDate: data.fromDate,
        toDate: data.toDate,
        status: 'Open',
      },
    });
  }

  static async getBankReconciliationSession(tenantId: string, sessionId: string) {
    return (prisma as any).bankReconciliationSession.findFirst({
      where: { tenantId, id: sessionId },
      include: { statementLines: true, account: true },
    });
  }

  static async createBankStatementLines(
    tenantId: string,
    sessionId: string,
    accountId: string,
    lines: Array<{ txnDate: Date; amount: number; direction: string; reference?: string | null; description?: string | null }>
  ) {
    return prisma.$transaction(async (tx) => {
      const out: any[] = [];
      for (const line of lines) {
        const created = await (tx as any).bankStatementLine.create({
          data: {
            tenantId,
            sessionId,
            accountId,
            txnDate: line.txnDate,
            amount: toDecimal2(line.amount),
            direction: line.direction,
            reference: line.reference ?? null,
            description: line.description ?? null,
          },
        });
        out.push(created);
      }
      return out;
    });
  }

  static async getUnmatchedBankStatementLines(tenantId: string, sessionId: string) {
    return (prisma as any).bankStatementLine.findMany({
      where: { tenantId, sessionId, isMatched: false },
      orderBy: { txnDate: 'asc' },
    });
  }

  static async markBankStatementLineMatched(tenantId: string, lineId: string, voucherId: string) {
    return (prisma as any).bankStatementLine.updateMany({
      where: { tenantId, id: lineId, isMatched: false },
      data: {
        isMatched: true,
        matchedVoucherId: voucherId,
        matchedAt: new Date(),
      },
    });
  }

  static async getAccountById(tenantId: string, id: string) {
    return prisma.account.findFirst({ where: { id, tenantId } });
  }

  static async getAccounts(tenantId: string) {
    return prisma.account.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
    });
  }

  static async getAccountsByIds(tenantId: string, ids: string[]) {
    if (ids.length === 0) return [];
    return prisma.account.findMany({ where: { tenantId, id: { in: ids } } });
  }

  static async getFundsByIds(tenantId: string, ids: string[]) {
    if (ids.length === 0) return [];
    return prisma.fund.findMany({ where: { tenantId, id: { in: ids } } });
  }

  static async getCostCentersByIds(tenantId: string, ids: string[]) {
    if (ids.length === 0) return [];
    return prisma.costCenter.findMany({ where: { tenantId, id: { in: ids } } });
  }

  static async getVoucherById(tenantId: string, id: string, tx: Tx = prisma) {
    return tx.voucher.findFirst({
      where: { id, tenantId },
      include: {
        journalEntries: { include: { account: true } },
        attachments: true,
        reversalVoucher: { select: { id: true, voucherNo: true, status: true } },
      },
    });
  }

  private static applyLinesToBalance(
    tx: Tx,
    tenantId: string,
    lines: { accountId: string; debit: unknown; credit: unknown }[]
  ) {
    return (async () => {
      for (const entry of lines) {
        const account = await tx.account.findUnique({ where: { id: entry.accountId } });
        if (!account) throw new CodedError('ACCOUNT_NOT_FOUND', `Account ${entry.accountId} not found`);
        if (account.tenantId !== tenantId) throw new CodedError('ACCOUNT_TENANT', 'Account belongs to another tenant');
        const delta = accountBalanceChange(account, {
          debit: entry.debit,
          credit: entry.credit,
        });
        await tx.account.update({
          where: { id: entry.accountId },
          data: { balance: { increment: delta } },
        });
      }
    })();
  }

  private static removeLinesFromBalance(
    tx: Tx,
    tenantId: string,
    lines: { accountId: string; debit: number; credit: number }[]
  ) {
    const inverted = lines.map((l) => ({
      accountId: l.accountId,
      debit: l.credit,
      credit: l.debit,
    }));
    return this.applyLinesToBalance(tx, tenantId, inverted);
  }

  static async createVoucherDraft(
    tenantId: string,
    data: CreateVoucherInput,
    tx: Tx | null = null
  ) {
    const db = tx ?? prisma;
    const draftNo = `DRAFT-${randomUUID()}`;
    return db.voucher.create({
      data: {
        tenantId,
        voucherNo: draftNo,
        type: data.type,
        date: data.date,
        amount: toDecimal2(data.amount as number),
        description: data.description,
        status: 'draft',
        postedAt: null,
        reversesVoucherId: data.reversesVoucherId ?? null,
        source: data.source ?? null,
        sourceRefId: data.sourceRefId ?? null,
        sourceType: data.sourceType ?? data.source ?? null,
        sourceId: data.sourceId ?? data.sourceRefId ?? null,
        sourceMetadata: data.sourceMetadata ?? null,
        journalEntries: {
          create: data.entries.map((e) => ({
            tenantId,
            accountId: e.accountId,
            debit: toDecimal2(e.debit),
            credit: toDecimal2(e.credit),
            narration: e.narration,
            fundId: e.fundId || null,
            costCenterId: e.costCenterId || null,
          })),
        },
        attachments: data.attachments?.length
          ? {
              create: data.attachments.map((a) => ({
                tenantId,
                documentId: a.documentId || null,
                fileUrl: a.fileUrl || null,
                title: a.title || null,
                mimeType: a.mimeType || null,
                checksumSha256: a.checksumSha256 || null,
                sizeBytes: a.sizeBytes ?? null,
                notes: a.notes || null,
                createdByUserId: a.createdByUserId || null,
              })),
            }
          : undefined,
      },
      include: { journalEntries: { include: { account: true } }, attachments: true },
    });
  }

  static async updateVoucherDraft(
    tenantId: string,
    voucherId: string,
    data: {
      date?: Date;
      amount?: number;
      description?: string | null;
      entries: JournalLine[];
      type?: string;
      source?: string | null;
      sourceRefId?: string | null;
      sourceType?: string | null;
      sourceId?: string | null;
      sourceMetadata?: Prisma.InputJsonValue | null;
      attachments?: CreateVoucherInput['attachments'];
    }
  ) {
    return prisma.$transaction(async (tx) => {
      return AccountingRepository._updateVoucherDraftTx(tenantId, voucherId, data, tx);
    });
  }

  static async _updateVoucherDraftTx(
    tenantId: string,
    voucherId: string,
    data: {
      date?: Date;
      amount?: number;
      description?: string | null;
      entries: JournalLine[];
      type?: string;
      source?: string | null;
      sourceRefId?: string | null;
      sourceType?: string | null;
      sourceId?: string | null;
      sourceMetadata?: Prisma.InputJsonValue | null;
      attachments?: CreateVoucherInput['attachments'];
    },
    tx: Tx
  ) {
    const v = await tx.voucher.findFirst({ where: { id: voucherId, tenantId } });
    if (!v) throw new Error('Voucher not found');
    if (v.status !== 'draft') {
      throw new Error('Only draft vouchers can be edited. Unapprove or use reversal for posted vouchers.');
    }
    await tx.voucherAttachment.deleteMany({ where: { voucherId, tenantId } });
    await tx.journalEntry.deleteMany({ where: { voucherId, tenantId } });
    return tx.voucher.update({
      where: { id: voucherId },
      data: {
        date: data.date,
        amount: data.amount !== undefined ? toDecimal2(data.amount) : undefined,
        description: data.description,
        type: data.type,
        source: data.source,
        sourceRefId: data.sourceRefId,
        sourceType: data.sourceType ?? data.source,
        sourceId: data.sourceId ?? data.sourceRefId,
        sourceMetadata: data.sourceMetadata ?? null,
        journalEntries: {
          create: data.entries.map((e) => ({
            tenantId,
            accountId: e.accountId,
            debit: toDecimal2(e.debit),
            credit: toDecimal2(e.credit),
            narration: e.narration,
            fundId: e.fundId || null,
            costCenterId: e.costCenterId || null,
          })),
        },
        attachments: data.attachments?.length
          ? {
              create: data.attachments.map((a) => ({
                tenantId,
                documentId: a.documentId || null,
                fileUrl: a.fileUrl || null,
                title: a.title || null,
                mimeType: a.mimeType || null,
                checksumSha256: a.checksumSha256 || null,
                sizeBytes: a.sizeBytes ?? null,
                notes: a.notes || null,
                createdByUserId: a.createdByUserId || null,
              })),
            }
          : undefined,
      },
      include: { journalEntries: { include: { account: true } }, attachments: true },
    });
  }

  static async deleteVoucherDraft(tenantId: string, voucherId: string) {
    return prisma.$transaction(async (tx) => {
      const v = await tx.voucher.findFirst({ where: { id: voucherId, tenantId } });
      if (!v) throw new Error('Voucher not found');
      if (v.status !== 'draft') throw new Error('Only draft vouchers can be deleted');
      await tx.voucherAttachment.deleteMany({ where: { voucherId, tenantId } });
      await tx.journalEntry.deleteMany({ where: { voucherId, tenantId } });
      await tx.voucher.delete({ where: { id: voucherId } });
    });
  }

  static async setVoucherStatus(
    tenantId: string,
    voucherId: string,
    status: 'draft' | 'approved' | 'posted',
    tx: Tx | null = null
  ) {
    const db = tx ?? prisma;
    return db.voucher.updateMany({
      where: { id: voucherId, tenantId },
      data: { status },
    });
  }

  static async postApprovedVoucherWithTx(
    tx: Tx,
    tenantId: string,
    voucherId: string,
    finalVoucherNo: string,
    postedByUserId?: string | null
  ) {
    const v = await tx.voucher.findFirst({
      where: { id: voucherId, tenantId },
      include: { journalEntries: true },
    });
    if (!v) throw new CodedError('VOUCHER_NOT_FOUND', 'Voucher not found');
    if (v.status !== 'approved') {
      throw new CodedError(
        'VOUCHER_NOT_APPROVED',
        'Only approved vouchers can be posted. Current status: ' + v.status
      );
    }
    if (v.journalEntries.length < 2) {
      throw new CodedError('VOUCHER_LINES', 'Voucher has no valid journal lines.');
    }

    const markPosted = await tx.voucher.updateMany({
      where: { id: voucherId, tenantId, status: 'approved', postedAt: null },
      data: {
        voucherNo: finalVoucherNo,
        status: 'posted',
        postedAt: new Date(),
        ...(postedByUserId !== undefined && { postedByUserId: postedByUserId || null }),
      },
    });
    if (markPosted.count !== 1) {
      throw new CodedError('VOUCHER_POST_RACE', 'Voucher could not be posted safely due to concurrent update.');
    }

    await this.applyLinesToBalance(
      tx,
      tenantId,
      v.journalEntries.map((e) => ({
        accountId: e.accountId,
        debit: e.debit,
        credit: e.credit,
      }))
    );

    const posted = await tx.voucher.findFirst({
      where: { id: voucherId, tenantId },
      include: { journalEntries: { include: { account: true } }, attachments: true },
    });
    if (!posted) throw new CodedError('VOUCHER_NOT_FOUND', 'Voucher not found after posting.');
    return posted;
  }

  static async postApprovedVoucher(
    tenantId: string,
    voucherId: string,
    finalVoucherNo: string,
    postedByUserId?: string | null
  ) {
    return prisma.$transaction(async (tx) =>
      this.postApprovedVoucherWithTx(tx, tenantId, voucherId, finalVoucherNo, postedByUserId)
    );
  }

  static async setVoucherApproved(
    tenantId: string,
    voucherId: string,
    approvedByUserId: string | null,
    tx: Tx | null = null
  ) {
    const db = tx ?? prisma;
    return db.voucher.updateMany({
      where: { id: voucherId, tenantId, status: 'draft' },
      data: { status: 'approved', approvedByUserId: approvedByUserId ?? null },
    });
  }

  static async setVoucherUnapproved(tenantId: string, voucherId: string, tx: Tx | null = null) {
    const db = tx ?? prisma;
    return db.voucher.updateMany({
      where: { id: voucherId, tenantId, status: 'approved' },
      data: { status: 'draft', approvedByUserId: null },
    });
  }

  /**
   * Single atomic row upsert+increment (PostgreSQL) so concurrent posts cannot get the same sequence.
   */
  static async reserveNextFySequence(tx: Tx, tenantId: string, fyStartYear: number, voucherType: string = 'Journal'): Promise<number> {
    const rows = await tx.$queryRaw<{ lastSeq: number }[]>`
      INSERT INTO "VoucherFySequence" ("id", "tenantId", "fyStartYear", "voucherType", "lastSeq", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${tenantId}, ${fyStartYear}, ${voucherType}, 1, NOW(), NOW())
      ON CONFLICT ("tenantId", "fyStartYear", "voucherType")
      DO UPDATE SET
        "lastSeq" = "VoucherFySequence"."lastSeq" + 1,
        "updatedAt" = NOW()
      RETURNING "lastSeq"
    `;
    const n = rows[0]?.lastSeq;
    if (n === undefined || n === null) {
      throw new Error('Voucher sequence reservation failed');
    }
    return Number(n);
  }

  static async getVouchers(tenantId: string, dateRange?: { gte: Date; lte: Date }, statusIn?: string[]) {
    const where: any = {
      tenantId,
      ...(dateRange && { date: { gte: dateRange.gte, lte: dateRange.lte } }),
      ...(statusIn?.length && { status: { in: statusIn } }),
    };
    return prisma.voucher.findMany({
      where,
      include: { journalEntries: { include: { account: true } } },
      orderBy: { date: 'desc' },
    });
  }

  static async getVouchersPaginated(tenantId: string, dateRange?: { gte: Date; lte: Date }, statusIn?: string[], limit = 100, offset = 0) {
    const where: any = {
      tenantId,
      ...(dateRange && { date: { gte: dateRange.gte, lte: dateRange.lte } }),
      ...(statusIn?.length && { status: { in: statusIn } }),
    };
    const [rows, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        include: { journalEntries: { include: { account: true } } },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.voucher.count({ where }),
    ]);
    return { rows, total, limit, offset };
  }

  static async createFinancialAuditLog(
    tenantId: string,
    data: {
      action: string;
      entityType: string;
      entityId: string;
      actorUserId?: string | null;
      beforeJson?: Prisma.InputJsonValue | null;
      afterJson?: Prisma.InputJsonValue | null;
      metadata?: Prisma.InputJsonValue | null;
    },
    tx: Tx | null = null
  ) {
    const db = tx ?? prisma;
    return db.financialAuditLog.create({
      data: {
        tenantId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        actorUserId: data.actorUserId ?? null,
        beforeJson: data.beforeJson ?? null,
        afterJson: data.afterJson ?? null,
        metadata: data.metadata ?? null,
      },
    });
  }

  static async getFinancialAuditLogs(
    tenantId: string,
    options?: { entityType?: string; entityId?: string; action?: string; limit?: number }
  ) {
    return prisma.financialAuditLog.findMany({
      where: {
        tenantId,
        ...(options?.entityType ? { entityType: options.entityType } : {}),
        ...(options?.entityId ? { entityId: options.entityId } : {}),
        ...(options?.action ? { action: options.action } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(options?.limit ?? 100, 1), 500),
    });
  }

  static async getLedgerRows(
    tenantId: string,
    accountId: string,
    range?: { gte: Date; lte: Date }
  ) {
    return prisma.journalEntry.findMany({
      where: {
        tenantId,
        accountId,
        voucher: {
          status: 'posted',
          ...(range && { date: { gte: range.gte, lte: range.lte } }),
        },
      },
      include: {
        voucher: { select: { id: true, date: true, voucherNo: true, description: true, type: true } },
      },
      orderBy: [{ voucher: { date: 'asc' } }, { id: 'asc' }],
    });
  }

  /** Posted lines for this account strictly before `beforeExclusive` (opening balance basis). */
  static async getLedgerRowsBefore(tenantId: string, accountId: string, beforeExclusive: Date) {
    return prisma.journalEntry.findMany({
      where: {
        tenantId,
        accountId,
        voucher: { status: 'posted', date: { lt: beforeExclusive } },
      },
      include: {
        voucher: { select: { id: true, date: true, voucherNo: true, description: true, type: true } },
      },
      orderBy: [{ voucher: { date: 'asc' } }, { id: 'asc' }],
    });
  }

  static async getTrialBalanceAccounts(tenantId: string) {
    return prisma.account.findMany({ where: { tenantId }, orderBy: { code: 'asc' } });
  }
}
