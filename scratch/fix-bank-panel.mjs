import fs from 'fs';
const path = 'src/components/finance/BankReconciliationPanel.tsx';
let c = fs.readFileSync(path, 'utf8');
c = c.replaceAll('motion.div', 'div');
c = c.replace('<motion className="space-y-6">', '<div className="space-y-6">');
c = c.replace(/\n\/\/ motion\.div[\s\S]*$/m, '');
fs.writeFileSync(path, c);
console.log('done');
