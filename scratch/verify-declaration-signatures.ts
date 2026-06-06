/**
 * Verify declaration templates never pre-fill signer names in signature sections.
 * Run: npx tsx scratch/verify-declaration-signatures.ts
 */
import { buildComplianceHtml, type ComplianceTemplateId } from '../src/server/utils/memberComplianceTemplates.js';

const TEST_NAME = 'Amara Lewis';
const WITNESS = 'Elder John Sterling';
const PASTOR = 'Pastor David Chen';

const member = {
  name: TEST_NAME,
  email: 'amara@example.com',
  phone: '+91 90000 00000',
  fatherName: 'James Lewis',
  motherName: 'Mary Lewis',
  residentialAddress: '12 Residency Road, Bangalore',
  prayerRequest: 'Prayer for healing',
};

const branding = {
  churchName: 'Grace Community Trust',
  tagline: 'A place to belong',
  address: 'Bangalore, Karnataka',
  phone: '+91 80 0000 0000',
  email: 'office@church.in',
  registrationNumber: 'Reg. No: 492/BK-IV/1994',
  logoPath: null,
  primaryColor: '#0f172a',
  officiantName: PASTOR,
  witnessName: WITNESS,
  issueDateLabel: '05/06/2026',
  documentRef: 'REG-TEST-001',
  baptismDate: '2026-01-15',
  baptismPlace: 'Main Sanctuary',
};

function signatureSlice(html: string): string {
  const bodyIdx = html.indexOf('<body>');
  const body = bodyIdx >= 0 ? html.slice(bodyIdx) : html;

  const sectionIdx = body.indexOf('<section class="signatures');
  if (sectionIdx >= 0) {
    const end = body.indexOf('</section>', sectionIdx);
    if (end >= 0) return body.slice(sectionIdx, end + '</section>'.length);
  }

  const certIdx = body.indexOf('<div class="cert-signatures');
  if (certIdx >= 0) {
    let depth = 0;
    let i = certIdx;
    while (i < body.length) {
      if (body.startsWith('<div', i)) depth++;
      if (body.startsWith('</div>', i)) {
        depth--;
        if (depth === 0) return body.slice(certIdx, i + '</div>'.length);
      }
      i++;
    }
  }
  return '';
}

const forbiddenInSignatures = [TEST_NAME, WITNESS, PASTOR, 'Elder David Sterling', 'Sarah Jenkins'];

let pass = 0;
let fail = 0;

for (const template of ['visitor_declaration', 'member_declaration', 'baptism_certificate'] as ComplianceTemplateId[]) {
  const html = buildComplianceHtml(template, member, branding);
  const sig = signatureSlice(html);
  if (!sig) {
    console.log(`FAIL ${template}: no signature section found`);
    fail++;
    continue;
  }
  const hits = forbiddenInSignatures.filter((s) => sig.includes(s));
  if (hits.length) {
    console.log(`FAIL ${template}: signature section contains: ${hits.join(', ')}`);
    fail++;
  } else if (!sig.includes('Name:') && !sig.includes('Witness Name:') && !sig.includes('Pastor Name:')) {
    console.log(`FAIL ${template}: signature section missing blank name lines`);
    fail++;
  } else {
    console.log(`PASS ${template}: signature section is blank (no signer names)`);
    pass++;
  }
  if (!html.includes(TEST_NAME)) {
    console.log(`WARN ${template}: declarant name missing from document body`);
  }
}

console.log(`\n${pass}/${pass + fail} templates passed signature audit`);
process.exit(fail > 0 ? 1 : 0);
