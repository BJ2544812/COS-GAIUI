import fs from 'fs';
const path = 'src/modules/finance/FinanceModule.tsx';
let c = fs.readFileSync(path, 'utf8');
const start = c.indexOf("{!loading && tab === 'reconciliation' && (");
const end = c.indexOf("{!loading && tab === 'reports' && (");
if (start < 0 || end < 0) {
  console.error('markers not found', start, end);
  process.exit(1);
}
const replacement = `{!loading && tab === 'reconciliation' && (
        <BankReconciliationPanel
          accounts={accounts}
          fmt={fmt}
          donationReconciliation={donationReconciliation}
          onOpenSettlements={() => setTab('settlements')}
          onOpenVouchers={() => setTab('vouchers')}
        />
      )}

      `;
c = c.slice(0, start) + replacement + c.slice(end);
fs.writeFileSync(path, c);
console.log('patched');
