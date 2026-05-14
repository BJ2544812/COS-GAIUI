import { prisma } from './src/server/utils/prisma.js';
import { decimalToNumber } from './src/server/utils/money.js';

async function main() {
  const tenantId = 'default-tenant-id';
  console.log('--- ACCOUNTING VALIDATION ---');

  // 1. Check Accounts
  const accounts = await prisma.account.findMany({ where: { tenantId } });
  console.log(`Total Accounts: ${accounts.length}`);
  accounts.forEach(a => {
    console.log(`- ${a.code} ${a.name}: ${decimalToNumber(a.balance)}`);
  });

  // 2. Check Donations vs Vouchers
  const donations = await prisma.donation.count({ where: { tenantId } });
  const vouchers = await prisma.voucher.count({ where: { tenantId, type: 'Receipt' } });
  console.log(`\nDonations: ${donations}`);
  console.log(`Receipt Vouchers: ${vouchers}`);

  // 3. Check Trial Balance Balance
  let tDebit = 0;
  let tCredit = 0;
  for (const a of accounts) {
    const b = decimalToNumber(a.balance);
    const isD = ['Asset', 'Expense'].includes(a.type);
    if (isD) {
      if (b >= 0) tDebit += b; else tCredit += Math.abs(b);
    } else {
      if (b >= 0) tCredit += b; else tDebit += Math.abs(b);
    }
  }
  console.log(`\nTrial Balance Totals:`);
  console.log(`- Debit: ${tDebit}`);
  console.log(`- Credit: ${tCredit}`);
  console.log(`- Difference: ${tDebit - tCredit}`);

  if (Math.abs(tDebit - tCredit) < 0.01) {
    console.log('\n✅ Ledger is in balance!');
  } else {
    console.log('\n❌ LEDGER IS OUT OF BALANCE!');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
