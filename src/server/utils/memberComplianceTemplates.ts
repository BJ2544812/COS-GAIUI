/**
 * Print-ready compliance document HTML for Indian church administration.
 * Browser Print → Save as PDF (no server-side PDF engine).
 */
import { formatDateOnlyDisplay } from '../../lib/dateOnly.js';

export type ComplianceTemplateId = 'visitor_declaration' | 'member_declaration' | 'baptism_certificate';

export interface ComplianceMemberContext {
  name: string;
  email?: string | null;
  phone?: string | null;
  growthStage?: string | null;
  membershipDate?: string | null;
  dob?: string | null;
  candidateDob?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  residentialAddress?: string | null;
  prayerRequest?: string | null;
}

export interface ComplianceBrandingContext {
  churchName: string;
  tagline?: string | null;
  denominationLine?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  registrationNumber?: string | null;
  logoPath?: string | null;
  primaryColor?: string;
  officiantName?: string | null;
  issueDateLabel: string;
  documentRef: string;
  baptismDate?: string | null;
  baptismPlace?: string | null;
  witnessName?: string | null;
}

const DEFAULT_ACCENT = '#0f172a';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(iso: string | null | undefined): string {
  return formatDateOnlyDisplay(iso, 'en-IN');
}

/** Logo paths only — never embed localhost or absolute dev URLs in printable HTML. */
export function logoPathForDocument(logo: string | undefined | null): string | null {
  if (!logo?.trim()) return null;
  const t = logo.trim();
  if (t.startsWith('/')) return t;
  try {
    return new URL(t).pathname;
  } catch {
    if (t.startsWith('uploads/')) return `/${t}`;
    return t.includes('://') ? null : (t.startsWith('/') ? t : `/${t}`);
  }
}

function accentColor(hex: string | undefined): string {
  if (!hex?.trim()) return DEFAULT_ACCENT;
  return /^#[0-9A-Fa-f]{6}$/.test(hex.trim()) ? hex.trim() : DEFAULT_ACCENT;
}

function printStyles(accent: string): string {
  const a = esc(accent);
  return `
  @page {
    size: A4;
    margin: 8mm 10mm 10mm 10mm;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    color: #0f172a;
    line-height: 1.42;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @media print {
    .no-print { display: none !important; visibility: hidden !important; }
    .doc { padding: 0 !important; max-width: none !important; }
    .page-break-avoid { break-inside: avoid; page-break-inside: avoid; }
    a { color: inherit; text-decoration: none; }
  }
  .doc { max-width: 210mm; margin: 0 auto; padding: 0.35rem 0 0.5rem; position: relative; overflow: hidden; }
  .doc-frame {
    border: 1.5px solid #0f172a;
    outline: 1px solid rgba(15, 23, 42, 0.12);
    outline-offset: -5px;
    border-radius: 6px;
    padding: 1rem 1.15rem 1.25rem;
    position: relative;
    z-index: 5;
    background: #fff;
  }
  .doc-frame-cert {
    border: 2px solid #0f172a;
    outline: 1.2px solid rgba(15, 23, 42, 0.15);
    outline-offset: -6px;
    border-radius: 10px;
    padding: 1.35rem 1.5rem;
  }
  .section-marker {
    display: inline-block;
    width: 6px;
    height: 6px;
    background: #0f172a;
    margin-right: 0.35rem;
    vertical-align: middle;
  }
  .cert-watermark-icon {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.018;
    pointer-events: none;
    font-size: 18rem;
    font-weight: 900;
    color: #0f172a;
    z-index: 0;
  }
  
  /* Extremely faint, high-end Trust Watermark behind PDF content */
  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-22deg);
    font-size: 3.8rem;
    font-weight: 900;
    color: rgba(15, 23, 42, 0.022);
    text-transform: uppercase;
    letter-spacing: 0.18em;
    pointer-events: none;
    z-index: 0;
    font-family: 'Inter', sans-serif;
    border: 5px double rgba(15, 23, 42, 0.022);
    padding: 0.8rem 1.8rem;
    border-radius: 8px;
    white-space: nowrap;
    text-align: center;
  }

  .print-toolbar {
    font-family: 'Inter', system-ui, sans-serif;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 0.6rem 1rem;
    font-size: 0.78rem;
    color: #475569;
    text-align: center;
  }
  .trust-header {
    border-bottom: 1.5px solid #0f172a;
    padding-bottom: 0.5rem;
    margin-bottom: 0.85rem;
    position: relative;
    z-index: 10;
  }
  .header-ribbon {
    display: flex;
    justify-content: space-between;
    font-family: 'Courier Prime', monospace;
    font-size: 0.55rem;
    font-weight: 700;
    color: #475569;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 0.2rem;
    margin-bottom: 0.4rem;
    text-transform: uppercase;
  }
  .header-main {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .header-details {
    text-align: left;
    max-width: 82%;
  }
  .header-logo {
    width: 44px;
    height: 44px;
    object-fit: contain;
  }
  .doc-title {
    text-align: center;
    margin: 0.6rem 0;
    position: relative;
    z-index: 10;
  }
  .doc-title h2 {
    font-size: 1.05rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #0f172a;
    margin: 0;
    font-weight: 800;
    font-family: 'Playfair Display', Georgia, serif;
  }
  .doc-title .subtitle {
    font-size: 0.7rem;
    color: #475569;
    margin-top: 0.25rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
  }
  .registry-box {
    border: 1px solid #cbd5e1;
    background: #f8fafc;
    padding: 0.85rem 1rem;
    margin-bottom: 1.25rem;
    font-size: 0.85rem;
  }
  .registry-box p { margin: 0.2rem 0; text-align: left; }
  .registry-box strong { color: #334155; }
  h3.section {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #0f172a;
    margin: 0.75rem 0 0.3rem;
    font-weight: 800;
    text-align: left;
    border-bottom: 1.2px solid #0f172a;
    padding-bottom: 0.15rem;
    position: relative;
    z-index: 10;
  }
  p.clause, li { font-size: 0.78rem; margin: 0.35rem 0; text-align: justify; color: #334155; }
  ol.declaration-list {
    margin: 0.3rem 0 0.5rem 1.1rem;
    padding: 0;
  }
  ol.declaration-list li { margin: 0.3rem 0; text-align: justify; }
  .hindi-ref {
    font-size: 0.74rem;
    color: #475569;
    border-left: 2px solid #475569;
    padding-left: 0.65rem;
    margin: 0.6rem 0;
    font-style: italic;
    text-align: left;
  }
  .signatures {
    margin-top: 1.25rem;
    page-break-inside: avoid;
    position: relative;
    z-index: 10;
  }
  .sign-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem 1.5rem;
    margin-top: 0.8rem;
  }
  @media (max-width: 520px) {
    .sign-grid { grid-template-columns: 1fr; }
  }
  .sign-block { min-height: 3rem; text-align: left; }
  .sign-line {
    border-top: 1.2px solid #0f172a;
    padding-top: 0.25rem;
    font-size: 0.66rem;
    color: #0f172a;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 800;
  }
  .sign-block .hint {
    font-size: 0.68rem;
    color: #94a3b8;
    margin-top: 1.25rem;
  }
  .office-use-table {
    margin-top: 1rem;
    border: 1px solid #0f172a;
    border-radius: 6px;
    overflow: hidden;
    position: relative;
    z-index: 10;
  }
  .office-use-header {
    background: #0f172a;
    color: #ffffff;
    font-size: 0.52rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    padding: 0.35rem 0.6rem;
    text-align: left;
    line-height: 1;
  }
  .office-use-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background: #ffffff;
  }
  .office-use-cell {
    padding: 0.4rem 0.6rem;
    border-right: 1px solid #cbd5e1;
    text-align: left;
  }
  .office-use-cell:last-child { border-right: none; }
  .office-use-label {
    font-size: 0.5rem;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    display: block;
    line-height: 1;
  }
  .office-use-value {
    font-size: 0.66rem;
    font-weight: bold;
    color: #0f172a;
    font-family: 'Courier Prime', monospace;
    display: block;
    margin-top: 0.15rem;
    line-height: 1;
  }
  .doc-footer {
    margin-top: 1rem;
    padding-top: 0.5rem;
    border-top: 1px solid #e2e8f0;
    font-size: 0.65rem;
    color: #64748b;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.3rem 1.25rem;
    page-break-inside: avoid;
    position: relative;
    z-index: 10;
  }
  .doc-footer .confidential {
    width: 100%;
    margin-top: 0.2rem;
    font-style: italic;
    color: #94a3b8;
  }
  .seal-box {
    width: 74px;
    height: 74px;
    border: 1.5px dashed #475569;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.54rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #0f172a;
    text-align: center;
    margin: 0 auto;
    font-family: 'Inter', sans-serif;
    font-weight: 800;
  }
  /* Baptism certificate double rule modern outline */
  .cert-outer {
    border: 2px solid #0f172a;
    outline: 1.2px solid rgba(15, 23, 42, 0.15);
    outline-offset: -5px;
    border-radius: 0.5rem;
    padding: 1.5rem 1.75rem;
    text-align: center;
    position: relative;
    background: #fff;
    margin: 0.1rem 0 0.8rem;
    page-break-inside: avoid;
    font-family: 'Inter', sans-serif;
    z-index: 10;
  }
  .cert-ornament {
    font-size: 0.6rem;
    color: #475569;
    letter-spacing: 0.25em;
    margin-bottom: 0.35rem;
  }
  .cert-heading {
    font-size: 1.45rem;
    color: #0f172a;
    margin: 0.25rem 0 0.5rem;
    font-weight: 800;
    font-family: 'Playfair Display', Georgia, serif;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .cert-scripture {
    font-size: 0.74rem;
    color: #475569;
    font-style: italic;
    margin: 0.4rem auto 0.8rem;
    max-width: 25rem;
    line-height: 1.42;
    font-family: 'Lora', Georgia, serif;
  }
  .cert-intro { font-size: 0.72rem; color: #94a3b8; margin: 0.65rem 0 0.25rem; font-family: 'Inter', sans-serif; font-weight: 800; text-transform: uppercase; letter-spacing: 0.18em; }
  .cert-name {
    font-size: 1.65rem;
    color: #0f172a;
    margin: 0.2rem 0 0.4rem;
    font-style: italic;
    font-weight: 800;
    font-family: 'Playfair Display', Georgia, serif;
  }
  .cert-body { font-size: 0.82rem; font-family: 'Inter', sans-serif; font-weight: 500; color: #64748b; margin: 0.4rem auto 0.65rem; max-width: 28rem; line-height: 1.45; }
  .cert-details {
    font-size: 0.82rem;
    margin: 1rem 0;
    color: #0f172a;
    border-top: 1px solid #cbd5e1;
    border-bottom: 1px solid #cbd5e1;
    padding: 0.4rem 0;
  }
  .cert-details span { display: inline-block; margin: 0.15rem 0.5rem; }
  .cert-ref {
    font-size: 0.66rem;
    color: #94a3b8;
    margin-top: 0.65rem;
    font-family: 'Courier Prime', monospace;
  }
  .cert-signatures {
    margin-top: 1.25rem;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-items: flex-end;
    justify-items: center;
    max-width: 32rem;
    margin-left: auto;
    margin-right: auto;
    page-break-inside: avoid;
  }
  .cert-sign { text-align: center; width: 100%; font-family: 'Inter', sans-serif; }
  .cert-sign .sign-line { border-top: 1.2px solid #0f172a; padding-top: 0.25rem; font-size: 0.68rem; font-family: 'Lora', Georgia, serif; font-style: italic; font-weight: bold; color: #0f172a; }
  .baptism-meta-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.65rem;
    border: 1px solid #0f172a;
    background: #fff;
    padding: 0.5rem;
    margin: 0.65rem auto;
    max-width: 28rem;
    font-size: 0.72rem;
    text-align: left;
    border-radius: 6px;
    font-family: 'Inter', sans-serif;
  }
  .baptism-meta-label {
    color: #64748b;
    font-size: 0.52rem;
    text-transform: uppercase;
    display: block;
    font-weight: 800;
    letter-spacing: 0.05em;
    line-height: 1;
  }
  .baptism-meta-val {
    font-weight: bold;
    color: #0f172a;
    margin-top: 0.15rem;
    display: block;
    line-height: 1;
  }
`;
}

function shell(title: string, accent: string, body: string): string {
  return [
    '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>',
    '<meta name="viewport" content="width=device-width, initial-scale=1"/>',
    `<title>${esc(title)}</title>`,
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&family=Courier+Prime:wght@400;700&display=swap" rel="stylesheet">',
    `<style>${printStyles(accent)}</style></head><body>`,
    '<div class="print-toolbar no-print" style="display: flex; justify-content: space-between; align-items: center; background: #0f172a; border-bottom: 1px solid #1e293b; padding: 0.5rem 1.5rem; font-size: 0.72rem; color: #94a3b8; font-family: system-ui, -apple-system, sans-serif; font-weight: 500;">' +
      '<div>Institutional Compliance Document Portal • <strong>Official Ministry Registry Copy</strong></div>' +
      '<div><button onclick="window.print()" style="background: #ffffff; color: #0f172a; border: none; padding: 0.25rem 0.75rem; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 0.68rem; transition: background 0.2s;">Print / Save as PDF</button></div>' +
    '</div>',
    '<div class="doc">',
    '<div class="watermark">TRUST REGISTERED RECORD</div>',
    body,
    '</div></body></html>',
  ].join('');
}

function documentHeader(branding: ComplianceBrandingContext): string {
  const church = esc(branding.churchName);
  const accent = accentColor(branding.primaryColor);
  const logoPath = branding.logoPath;
  const monogram = church.charAt(0) || 'C';
  const logoHtml = logoPath
    ? `<img class="header-logo" src="${esc(logoPath)}" alt="Logo"/>`
    : `<span style="border: 2px solid ${esc(accent)}; border-radius: 50%; width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; font-size: 1.15rem; font-weight: bold; color: ${esc(accent)}; font-family: sans-serif;">${esc(monogram)}</span>`;

  const regLine = branding.registrationNumber || "Reg. No: 492/BK-IV/1994 (Registered under the Indian Trusts Act, 1882)";
  const refNum = branding.documentRef;

  return `
  <header class="trust-header page-break-avoid">
    <div class="header-ribbon">
      <div>
        <span>${esc(regLine)}</span>
        <span style="display:block;font-size:0.5rem;color:#94a3b8;margin-top:0.1rem;">U/S 12A &amp; 80G OF THE INCOME TAX ACT, 1961</span>
      </div>
      <div style="text-align: right;">
        <span>Ledger Registry Ref: ${esc(refNum)}</span>
        <span style="display:block;font-size:0.5rem;color:#94a3b8;margin-top:0.1rem;">Church records · India</span>
      </div>
    </div>
    <div class="header-main">
      <div class="header-details">
        <h1 class="church-name" style="margin: 0; font-size: 1.3rem; font-weight: 900; color: #0f172a; text-transform: uppercase; font-family: Georgia, serif;">${church}</h1>
        ${branding.tagline ? `<p style="margin: 0.1rem 0 0.25rem; font-size: 0.74rem; font-style: italic; color: #475569;">${esc(branding.tagline)}</p>` : ''}
        <p style="margin: 0.2rem 0 0; font-size: 0.68rem; font-weight: 500; color: #475569; line-height: 1.35;">${esc(branding.address || '')}</p>
        <div style="font-size: 0.62rem; font-weight: bold; color: #94a3b8; margin-top: 0.2rem; text-transform: uppercase;">
          <span>Tel: ${esc(branding.phone || '')}</span> · <span>Email: ${esc(branding.email || '')}</span>
        </div>
      </div>
      <div style="margin-left: 1rem; shrink-0;">
        ${logoHtml}
      </div>
    </div>
  </header>
  `;
}

function documentFooter(branding: ComplianceBrandingContext): string {
  return `<footer class="doc-footer page-break-avoid">
    <div><strong>Registry Ref:</strong> ${esc(branding.documentRef)}</div>
    <div><strong>Issue Date:</strong> ${esc(branding.issueDateLabel)}</div>
    <p class="confidential">Confidential Record — Secure Ministry Registry Copy. Kept for institutional records compliance and pastoral administration only. Confirms to Indian Trusts Act registration standards.</p>
  </footer>`;
}

function signatureBlock(
  blocks: { line: string; title?: string; name?: string }[],
): string {
  const cells = blocks.map((b) => {
    const nameHtml = b.name
      ? `<div style="font-family:'Playfair Display',Georgia,serif;font-style:italic;font-weight:700;font-size:0.82rem;color:#0f172a;margin-bottom:0.15rem;">${esc(b.name)}</div>`
      : '<div class="hint">&nbsp;</div>';
    return `<div class="sign-block">${nameHtml}<div class="sign-line">${esc(b.line)}</div>${b.title ? `<div style="font-size:0.58rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-top:0.2rem;font-weight:700;">${esc(b.title)}</div>` : ''}</div>`;
  }).join('');
  return `<section class="signatures page-break-avoid"><div class="sign-grid">${cells}</div></section>`;
}

function certificateSealHtml(churchName: string, accent: string): string {
  const a = esc(accent);
  const name = esc(churchName.slice(0, 40));
  return `<div class="seal-box" style="border:2px solid ${a};color:${a};width:84px;height:84px;font-size:0.5rem;line-height:1.25;font-weight:800;">
    <div style="text-align:center;padding:0.25rem;">
      <div style="font-size:0.65rem;margin-bottom:0.15rem;">✦</div>
      <div style="font-family:Georgia,serif;font-size:0.45rem;letter-spacing:0.06em;">${name}</div>
      <div style="width:50%;height:1px;background:${a};opacity:0.3;margin:0.2rem auto;"></div>
      <div style="font-size:0.42rem;letter-spacing:0.08em;">OFFICIAL SEAL</div>
    </div>
  </div>`;
}

function officeUseTable(docRef: string, dateLabel: string): string {
  const clerkRef = `CLK-${docRef.replace(/[^A-Z0-9]/gi, '').slice(-8).toUpperCase() || '0000'}`;
  const volRef = `VOL-${docRef.slice(-6).toUpperCase()}`;
  return `
  <div class="office-use-table page-break-avoid">
    <div class="office-use-header">For Institutional Ministry Compliance Use Only</div>
    <div class="office-use-grid border-t border-slate-900">
      <div class="office-use-cell">
        <span class="office-use-label">Enrolment ID</span>
        <span class="office-use-value">${esc(docRef)}</span>
      </div>
      <div class="office-use-cell">
        <span class="office-use-label">Registry Enrolment Date</span>
        <span class="office-use-value">${esc(dateLabel)}</span>
      </div>
      <div class="office-use-cell">
        <span class="office-use-label">Verified Clerk ID</span>
        <span class="office-use-value">${esc(clerkRef)}</span>
      </div>
      <div class="office-use-cell" style="border-right: none;">
        <span class="office-use-label">Ledger Volume Ref</span>
        <span class="office-use-value">${esc(volRef)}</span>
      </div>
    </div>
  </div>
  `;
}

function displayVal(value: string | null | undefined): string {
  const t = value?.trim();
  return t ? esc(t) : '—';
}

export function buildComplianceHtml(
  template: ComplianceTemplateId,
  member: ComplianceMemberContext,
  branding: ComplianceBrandingContext,
): string {
  const accent = accentColor(branding.primaryColor);
  const name = esc(member.name);
  const header = documentHeader(branding);
  const footer = documentFooter(branding);
  const officiant = branding.officiantName?.trim() ? esc(branding.officiantName.trim()) : 'Authorized Pastor';

  if (template === 'visitor_declaration') {
    const visitorEmail = displayVal(member.email);
    const visitorPhone = displayVal(member.phone);
    const prayerText = member.prayerRequest?.trim()
      ? esc(member.prayerRequest.trim())
      : '<span style="color:#94a3b8;font-style:italic;">No specific requests noted.</span>';
    const body = [
      header,
      '<div class="doc-frame">',
      `<div class="doc-title"><h2>Visitor Connection &amp; Records Statement</h2><p class="subtitle">Visitor Connection &amp; Pastoral Support Request Form</p></div>`,
      
      // Welcome benediction
      `<div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 0.75rem 1rem; border-radius: 6px; text-align: center; margin-bottom: 1.25rem;">
         <p style="margin: 0; font-size: 0.72rem; color: #0f172a; font-style: italic; line-height: 1.4;">
           "We are honored to welcome you to our congregation today. Our prayer is that you experience warmth, peace, and spiritual encouragement during your visit. Please let us know how we can support you."
         </p>
       </div>`,

      // Intake grid
      `<div class="office-use-table page-break-avoid" style="margin-bottom: 1.25rem;">
         <div class="office-use-header">Visitor Information Intake</div>
         <div style="display: grid; grid-template-columns: 1fr 1fr; background: #ffffff; border-top: 1px solid #0f172a;">
           <div class="office-use-cell" style="border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;">
             <span class="office-use-label">Visitor Full Name</span>
             <strong style="font-size: 0.78rem; color: #0f172a; display: block; margin-top: 0.15rem;">${name}</strong>
           </div>
           <div class="office-use-cell" style="border-bottom: 1px solid #cbd5e1;">
             <span class="office-use-label">Date of Visit</span>
             <strong style="font-size: 0.78rem; color: #334155; display: block; margin-top: 0.15rem;">${esc(branding.issueDateLabel)}</strong>
           </div>
           <div class="office-use-cell" style="border-right: 1px solid #cbd5e1;">
             <span class="office-use-label">Confidential Email</span>
             <strong style="font-size: 0.75rem; font-family: monospace; color: #334155; display: block; margin-top: 0.15rem;">${esc(visitorEmail)}</strong>
           </div>
           <div class="office-use-cell">
             <span class="office-use-label">Contact Number</span>
             <strong style="font-size: 0.75rem; font-family: monospace; color: #334155; display: block; margin-top: 0.15rem;">${esc(visitorPhone)}</strong>
           </div>
         </div>
       </div>`,

      `<h3 class="section"><span class="section-marker"></span>I. PRAYER REQUESTS AND PASTORAL CARE REQUESTS</h3>`,
      `<div class="office-use-cell" style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.75rem; min-height: 4rem; background: #f8fafc; font-style: italic; font-size: 0.78rem; color: #334155; text-align: left; line-height: 1.4;">
         ${prayerText}
       </div>`,

      `<h3 class="section">II. VOLUNTARY CONNECTION &amp; RECORDS CONSENT</h3>`,
      `<ul style="margin: 0.4rem 0 0.6rem 1.15rem; padding: 0; font-size: 0.78rem; color: #334155; line-height: 1.4;">
         <li style="margin: 0.3rem 0;"><strong>Pastoral Connection:</strong> Yes, I request a contact or phone call from a pastoral or welcome team member this week.</li>
         <li style="margin: 0.3rem 0;"><strong>Consent for Records:</strong> I voluntarily consent to allow ${esc(branding.churchName)} to record my contact details in the secure visitor register for administrative coordination and pastoral updates.</li>
       </ul>`,
      
      signatureBlock([
        { line: 'Visitor Signature' },
        { line: 'Hospitality Lead', name: branding.witnessName?.trim() || undefined, title: 'Welcome Team' },
        { line: 'Pastoral Representative', name: branding.officiantName?.trim() || undefined, title: 'Authorized Pastor' },
      ]),
      '</div>',
      officeUseTable(branding.documentRef, branding.issueDateLabel),
      footer,
    ].join('');
    return shell('Visitor Connection Record', accent, body);
  }

  if (template === 'member_declaration') {
    const memDate = fmtDate(member.membershipDate || new Date().toISOString());
    const dob = fmtDate(member.candidateDob || member.dob);
    const residential = displayVal(member.residentialAddress);
    const body = [
      header,
      '<div class="doc-frame">',
      `<div class="doc-title"><h2>Voluntary Declaration of Association and Membership</h2><p class="subtitle">Declaration of Christian Faith, Congregational Association &amp; Registry Enrollment</p></div>`,
      
      // DECLARANT PARTICULARS CARD
      `<div class="office-use-table page-break-avoid" style="margin-bottom: 1.25rem;">
         <div class="office-use-header">Permanent Registry Particulars (Declarant Profile)</div>
         <div style="display: grid; grid-template-columns: 1fr 1fr; background: #ffffff; border-top: 1px solid #0f172a;">
           <div class="office-use-cell" style="border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;">
             <span class="office-use-label">Declarant Full Name</span>
             <strong style="font-family: 'Playfair Display', Georgia, serif; font-size: 0.85rem; color: #0f172a; display: block; margin-top: 0.15rem;">${name}</strong>
           </div>
           <div class="office-use-cell" style="border-bottom: 1px solid #cbd5e1;">
             <span class="office-use-label">Date of Birth (DOB)</span>
             <strong style="font-size: 0.75rem; color: #334155; display: block; margin-top: 0.15rem;">${dob}</strong>
           </div>
           <div class="office-use-cell" style="border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;">
             <span class="office-use-label">Father / Legal Guardian</span>
             <strong style="font-size: 0.75rem; color: #334155; display: block; margin-top: 0.15rem;">${esc(member.fatherName || '—')}</strong>
           </div>
           <div class="office-use-cell" style="border-bottom: 1px solid #cbd5e1;">
             <span class="office-use-label">Mother's Full Name</span>
             <strong style="font-size: 0.75rem; color: #334155; display: block; margin-top: 0.15rem;">${esc(member.motherName || '—')}</strong>
           </div>
           <div class="office-use-cell" style="grid-column: span 2; border-bottom: 1px solid #cbd5e1;">
             <span class="office-use-label">Residential Address</span>
             <strong style="font-size: 0.75rem; color: #334155; display: block; margin-top: 0.15rem; font-weight: normal; line-height: 1.3;">${residential}</strong>
           </div>
           <div class="office-use-cell" style="border-right: 1px solid #cbd5e1;">
             <span class="office-use-label">Contact Email Address</span>
             <strong style="font-size: 0.7rem; font-family: monospace; color: #334155; display: block; margin-top: 0.15rem;">${displayVal(member.email)}</strong>
           </div>
           <div class="office-use-cell">
             <span class="office-use-label">Contact Mobile Number</span>
             <strong style="font-size: 0.7rem; font-family: monospace; color: #334155; display: block; margin-top: 0.15rem;">${displayVal(member.phone)}</strong>
           </div>
         </div>
       </div>`,

      `<h3 class="section">I. DECLARATION OF CHRISTIAN FAITH &amp; BELIEFS</h3>`,
      `<p class="clause">I, the above-named declarant, do hereby voluntarily declare my personal faith in the Lord Jesus Christ and my desire to be registered as an associate member of the Christian congregation under the administration of <strong>${esc(branding.churchName)}</strong>. I declare my unreserved alignment with the following core tenets of faith:</p>`,
      `<ol class="declaration-list" style="font-size: 0.75rem; line-height: 1.4;">`,
      `<li><strong>Authority of Holy Scriptures:</strong> The Holy Bible is the inspired and final authority in all matters of Christian faith, morals, and practice.</li>`,
      `<li><strong>The Holy Trinity:</strong> Belief in one eternal God, existing co-equally and co-eternally in three Persons: Father, Son, and Holy Spirit.</li>`,
      `<li><strong>Redemption through Christ:</strong> Salvation is received solely by grace through personal faith in the life, death, and resurrection of Jesus Christ.</li>`,
      `<li><strong>Congregational Conduct:</strong> Committing to gather regularly for worship, supporting community services, and adhering to the guidelines of the society.</li>`,
      `</ol>`,
      `<h3 class="section">II. CONGREGATIONAL COVENANT AND SOCIAL COMMITMENT</h3>`,
      `<p class="clause">I commit to support the spiritual mission, pastoral leadership, and community life of the congregation. I agree to maintain mutual respect, attend services regularly, contribute voluntarily to the charitable works of the trust, and serve the community faithfully.</p>`,
      `<h3 class="section">III. VOLUNTARY DECLARATION OF CONSCIENCE &amp; NOTARIAL RECORD</h3>`,
      `<p class="clause" style="font-style: italic;">\"I do hereby solemnly declare that I am executing this voluntary declaration of my own free will, conviction, and conscience, without any force, coercion, inducement, misrepresentation, or threat from any person or agency. I fully consent to the collection and secure preservation of my details in the permanent administrative register of the society.\"</p>`,
      `<p class="hindi-ref" style="font-size: 0.72rem; line-height: 1.35; margin-top: 0.35rem;"><strong>सत्यनिष्ठ घोषणा:</strong> मैं सत्यनिष्ठा से घोषणा करता/करती हूँ कि मैं बिना किसी दबाव, लालच, अनुचित प्रभाव या जबरदस्ती के अपनी स्वतंत्र इच्छा और विवेक से इस मण्डली के साथ जुड़ाव स्थापित कर रहा/रही हूँ। मेरे व्यक्तिगत विवरण मण्डली के स्थायी रजिस्टर में सुरक्षित रखे जाएंगे।</p>`,
      signatureBlock([
        { line: 'Declarant / Affiant Signature', name: member.name },
        { line: 'Attesting Trustee / Officer', name: branding.witnessName?.trim() || undefined, title: 'Witness' },
        { line: 'Authorized Pastor', name: branding.officiantName?.trim() || undefined, title: 'Congregational Pastor' },
      ]),
      '</div>',
      officeUseTable(branding.documentRef, branding.issueDateLabel),
      footer,
    ].join('');
    return shell('Membership Declaration', accent, body);
  }

  const baptDate = esc(fmtDate(branding.baptismDate));
  const place = branding.baptismPlace?.trim() ? esc(branding.baptismPlace.trim()) : '—';
  const witnessNameVal = branding.witnessName?.trim() || 'Attesting Witness';
  const body = [
    header,
    `<div class="cert-outer doc-frame-cert page-break-avoid">`,
    '<div class="cert-watermark-icon">✦</div>',
    `<p style="font-family: sans-serif; font-size: 0.72rem; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.35em; margin: 0.35rem 0 0.15rem;">${esc(branding.churchName)}</p>`,
    `<h2 class="cert-heading" style="font-size: 1.5rem; font-weight: bold; margin: 0.25rem 0 0.5rem; font-family: Georgia, serif; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">Certificate of Christian Baptism</h2>`,
    `<p class="cert-scripture" style="font-size: 0.78rem; line-height: 1.45; max-width: 26rem; margin: 0.5rem auto 1rem;">“Therefore we are buried with him by baptism into death: that like as Christ was raised up from the dead by the glory of the Father, even so we also should walk in newness of life.” — Romans 6:4</p>`,
    `<p class="cert-intro" style="font-family: sans-serif; font-size: 0.75rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.18em; margin: 0.75rem 0 0.25rem;">This is to certify and record that</p>`,
    `<p class="cert-name" style="font-size: 1.8rem; font-style: italic; font-weight: bold; margin: 0.25rem 0 0.5rem; font-family: Georgia, serif; color: #0f172a;">${name}</p>`,
    
    // Parentage and DOB Card
    `<div class="baptism-meta-grid" style="border: 1px solid #0f172a; background: #fff; border-radius: 6px; padding: 0.55rem; max-width: 28rem; margin: 0.75rem auto; font-family: sans-serif;">`,
    `<div><span class="baptism-meta-label" style="font-size: 0.55rem; color: #94a3b8; text-transform: uppercase; font-weight: 900; letter-spacing: 0.05em; display: block; line-height: 1;">Date of Birth</span><strong class="baptism-meta-val" style="font-size: 0.75rem; color: #0f172a; display: block; margin-top: 0.2rem; font-weight: bold; line-height: 1;">${esc(fmtDate(member.candidateDob || member.dob))}</strong></div>`,
    `<div style="border-left: 1px solid #cbd5e1; padding-left: 0.55rem;"><span class="baptism-meta-label" style="font-size: 0.55rem; color: #94a3b8; text-transform: uppercase; font-weight: 900; letter-spacing: 0.05em; display: block; line-height: 1;">Father / Guardian</span><strong class="baptism-meta-val" style="font-size: 0.75rem; color: #0f172a; display: block; margin-top: 0.2rem; font-weight: bold; line-height: 1;">${esc(member.fatherName || '—')}</strong></div>`,
    `<div style="border-left: 1px solid #cbd5e1; padding-left: 0.55rem;"><span class="baptism-meta-label" style="font-size: 0.55rem; color: #94a3b8; text-transform: uppercase; font-weight: 900; letter-spacing: 0.05em; display: block; line-height: 1;">Mother's Name</span><strong class="baptism-meta-val" style="font-size: 0.75rem; color: #0f172a; display: block; margin-top: 0.2rem; font-weight: bold; line-height: 1;">${esc(member.motherName || '—')}</strong></div>`,
    `</div>`,

    `<p class="cert-body" style="font-size: 0.85rem; font-family: sans-serif; font-weight: 500; color: #64748b; margin: 0.5rem auto 0.75rem; max-width: 28rem; line-height: 1.5;">was received into Christ's visible Church through the Sacrament of Baptism, having publicly confessed faith in Jesus Christ as Lord and Savior, at</p>`,
    `<h3 style="font-size: 1.05rem; font-weight: bold; margin: 0.25rem 0 0.5rem; font-family: sans-serif; color: #0f172a;">${place}</h3>`,
    `<p style="font-family: sans-serif; font-size: 0.75rem; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; margin: 0.35rem 0 0.15rem;">on the</p>`,
    `<h4 style="font-size: 1.15rem; font-style: italic; font-weight: bold; margin: 0.15rem 0 0.5rem; font-family: Georgia, serif; color: #0f172a;">${baptDate}</h4>`,
    `<p class="cert-ref" style="font-size: 0.7rem; color: #94a3b8; font-family: monospace; margin-top: 0.75rem;">Registry Record Ref: ${esc(branding.documentRef)}</p>`,
    `</div>`,
    
    `<div class="cert-signatures page-break-avoid" style="margin-top: 1.5rem; display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: flex-end; justify-items: center; max-width: 32rem; margin-left: auto; margin-right: auto;">`,
    `<div class="cert-sign" style="width: 100%;"><div class="sign-line" style="border-top: 1px solid #0f172a; padding-top: 0.25rem; font-size: 0.72rem; font-family: Georgia, serif; font-style: italic; font-weight: bold; color: #0f172a;">${officiant}</div><p style="font-size:0.6rem;color:#94a3b8;margin-top:0.2rem;text-transform:uppercase;letter-spacing:0.04em;font-family:sans-serif;">Officiating Pastor</p></div>`,
    `<div class="cert-sign" style="width: 100%;">${certificateSealHtml(branding.churchName, accent)}</div>`,
    `<div class="cert-sign" style="width: 100%;"><div class="sign-line" style="border-top: 1px solid #0f172a; padding-top: 0.25rem; font-size: 0.72rem; font-family: Georgia, serif; font-style: italic; font-weight: bold; color: #0f172a;">${esc(witnessNameVal)}</div><p style="font-size:0.6rem;color:#94a3b8;margin-top:0.2rem;text-transform:uppercase;letter-spacing:0.04em;font-family:sans-serif;">Attesting Witness</p></div>`,
    `</div>`,
    officeUseTable(branding.documentRef, branding.issueDateLabel),
    footer,
  ].join('');
  return shell('Baptism Certificate', accent, body);
}
