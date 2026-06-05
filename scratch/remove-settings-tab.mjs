import fs from 'fs';
const p = 'src/modules/finance/FinanceModule.tsx';
let s = fs.readFileSync(p, 'utf8');
const marker = "{!loading && tab === 'settings' && (";
const start = s.indexOf(marker);
const end = s.indexOf('type RegistryDoc', start);
if (start < 0 || end < 0) throw new Error('markers not found');
// also remove closing part before type RegistryDoc - find last `    </motion.div>\n  );\n}\n\n` before RegistryDoc
const sliceEnd = s.lastIndexOf('  );\n}\n\n', end);
const before = s.slice(0, start);
const after = s.slice(end);
fs.writeFileSync(p, before + after);
console.log('done');
