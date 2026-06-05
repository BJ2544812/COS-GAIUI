import fs from 'node:fs';
import path from 'node:path';

const files = [
  'src/components/operations/QuickOpsBar.tsx',
  'src/components/operations/VolunteerOpsBoard.tsx',
  'src/modules/sunday/SundayModeModule.tsx',
  'src/components/events/LiveEventOpsPanel.tsx',
  'src/components/operations/OperationsCommandCenter.tsx',
  'src/components/intelligence/MinistryIntelligenceStrip.tsx',
];

const badO = '<motion.div';
const goodO = '<div';
const badC = '</motion.div>';
const goodC = '</div>';

for (const f of files) {
  const p = path.join(process.cwd(), f);
  let t = fs.readFileSync(p, 'utf8');
  const before = (t.match(/motion\.div/g) || []).length;
  t = t.split(badC).join(goodC).split(badO).join(goodO);
  fs.writeFileSync(p, t);
  console.log(f, 'fixed tags:', before);
}
