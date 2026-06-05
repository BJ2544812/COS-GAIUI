import { type Account, Prisma } from '@prisma/client';
import { toDecimal2, decimalToNumber, MONEY_PLACES } from './money.js';
import { CodedError } from './apiErrors.js';

const EPS = 0.01 / Math.pow(10, MONEY_PLACES + 1);

export type JournalLine = {
  accountId: string;
  debit: number;
  credit: number;
  narration?: string;
  fundId?: string;
  costCenterId?: string;
};

/**
 * Enforces: ≥2 lines, each line is debit>0 xor credit>0, Σdebit=Σcredit, each amount matches `totalAmount` within ε.
 */
export function assertValidDoubleEntry(lines: JournalLine[], amount: number | { toString: () => string }): void {
  if (!lines || lines.length < 2) {
    throw new CodedError('DOUBLE_ENTRY_LINE_COUNT', 'A voucher must have at least two journal lines (double entry).');
  }
  const amountN = toDecimal2(amount);
  for (const line of lines) {
    const d = decimalToNumber(toDecimal2(line.debit || 0));
    const c = decimalToNumber(toDecimal2(line.credit || 0));
    if (d < 0 || c < 0) {
      throw new CodedError('DOUBLE_ENTRY_SIGN', 'Debit and credit amounts must be non-negative.');
    }
    if ((d > EPS && c > EPS) || (d < EPS && c < EPS)) {
      throw new CodedError('DOUBLE_ENTRY_LINE', 'Each line must have either debit or credit, not both and not neither.');
    }
  }
  const totalDebit = lines.reduce((s, e) => s + decimalToNumber(toDecimal2(e.debit || 0)), 0);
  const totalCredit = lines.reduce((s, e) => s + decimalToNumber(toDecimal2(e.credit || 0)), 0);
  if (Math.abs(totalDebit - totalCredit) > EPS) {
    throw new CodedError(
      'DOUBLE_ENTRY_BALANCE',
      `Double-entry validation failed: total debits (${totalDebit.toFixed(2)}) must equal total credits (${totalCredit.toFixed(2)}).`
    );
  }
  const amt = decimalToNumber(amountN);
  if (Math.abs(totalDebit - amt) > EPS) {
    throw new CodedError(
      'DOUBLE_ENTRY_AMOUNT',
      `Voucher amount (${amt.toFixed(2)}) does not match total debits / credits (${totalDebit.toFixed(2)}).`
    );
  }
}

/** Map numberingFormat from settings (e.g. 00000) to digit count for the sequence. */
export function getSequenceWidth(numberingFormat: string): number {
  const s = (numberingFormat || '00000').replace(/\D/g, '');
  return Math.max(5, s.length > 0 ? s.length : 5);
}

export function formatVoucherNoForPost(
  voucherPrefix: string,
  fyStartYear: number,
  sequence: number,
  numberingFormat: string,
  voucherType: string = 'JOURNAL'
): string {
  const width = getSequenceWidth(numberingFormat);
  const num = String(sequence).padStart(width, '0');
  const typeStr = voucherType.toUpperCase();
  return `${typeStr}-${fyStartYear}-${num}`;
}

const DEFAULT_ACCOUNT_TYPE: Record<
  'cash' | 'bank' | 'gatewayClearing' | 'gatewayRecoveryIncome' | 'gatewayChargesExpense' | 'tithes' | 'offerings',
  string
> = {
  cash: 'Asset',
  bank: 'Asset',
  gatewayClearing: 'Asset',
  gatewayRecoveryIncome: 'Revenue',
  gatewayChargesExpense: 'Expense',
  tithes: 'Revenue',
  offerings: 'Revenue',
};

/**
 * Verifies each non-empty default account id exists, belongs to tenant, and has expected type.
 */
export function assertDefaultAccounts(
  accountsByKey: {
    cash: string;
    bank: string;
    gatewayClearing: string;
    gatewayRecoveryIncome: string;
    gatewayChargesExpense: string;
    tithes: string;
    offerings: string;
  },
  loaded: Map<string, Account>
): void {
  for (const key of Object.keys(accountsByKey) as (keyof typeof accountsByKey)[]) {
    const id = (accountsByKey[key] || '').trim();
    if (!id) continue;
    const acc = loaded.get(id);
    if (!acc) {
      throw new CodedError(
        'DEFAULT_ACCOUNT_MISSING',
        `Default account "${key}": no account with id ${id} for this organization.`
      );
    }
    const expect = DEFAULT_ACCOUNT_TYPE[key];
    if (acc.type !== expect) {
      throw new CodedError(
        'DEFAULT_ACCOUNT_TYPE',
        `Default account "${key}" must be of type ${expect}. Account "${acc.name}" is ${acc.type}.`
      );
    }
  }
}

export function accountBalanceChange(
  account: { type: string },
  line: { debit: number | { toString: () => string }; credit: number | { toString: () => string } }
): Prisma.Decimal {
  const d = decimalToNumber(toDecimal2(line.debit));
  const c = decimalToNumber(toDecimal2(line.credit));
  const isDebitNormal = ['Asset', 'Expense'].includes(account.type);
  const n = isDebitNormal ? d - c : c - d;
  return toDecimal2(n);
}
