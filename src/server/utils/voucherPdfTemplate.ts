export type VoucherPdfLine = {
  accountCode: string;
  accountName: string;
  narration?: string | null;
  debit: string;
  credit: string;
  fundName?: string | null;
};

export function buildVoucherPdfHtml(input: {
  organizationName: string;
  organizationAddress?: string | null;
  organizationEmail?: string | null;
  organizationPhone?: string | null;
  registrationNumber?: string | null;
  taxId?: string | null;
  logoSrc?: string | null;
  voucherNo: string;
  voucherType: string;
  voucherDate: string;
  status: string;
  narration?: string | null;
  sourceType?: string | null;
  sourceRef?: string | null;
  fundSummary?: string | null;
  eventRef?: string | null;
  lines: VoucherPdfLine[];
  totalDebit: string;
  totalCredit: string;
  currency: string;
  approvedBy?: string | null;
  postedBy?: string | null;
  approvalStatus?: string | null;
  auditRef?: string | null;
  integrityChecksum?: string | null;
  generatedAt: string;
  signatoryName?: string | null;
  pastorSignatureSrc?: string | null;
  accountantSignatureSrc?: string | null;
  sealSrc?: string | null;
}) {
  const esc = (v: unknown) =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const logo = input.logoSrc ? `<img src="${input.logoSrc}" alt="Logo" style="height:52px;object-fit:contain;" />` : '';
  const pastorSig = input.pastorSignatureSrc
    ? `<img src="${input.pastorSignatureSrc}" alt="Pastor" style="max-height:42px;object-fit:contain;" />`
    : '<div style="height:42px;border-bottom:1px solid #94a3b8;"></div>';
  const acctSig = input.accountantSignatureSrc
    ? `<img src="${input.accountantSignatureSrc}" alt="Accountant" style="max-height:42px;object-fit:contain;" />`
    : '<div style="height:42px;border-bottom:1px solid #94a3b8;"></div>';
  const seal = input.sealSrc ? `<img src="${input.sealSrc}" alt="Seal" style="max-height:48px;object-fit:contain;" />` : '';

  const lineRows = input.lines
    .map(
      (l) => `<tr>
        <td class="mono">${esc(l.accountCode)}</td>
        <td>${esc(l.accountName)}</td>
        <td class="muted">${esc(l.narration || l.fundName || '—')}</td>
        <td class="num">${esc(l.debit)}</td>
        <td class="num">${esc(l.credit)}</td>
      </tr>`
    )
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 10mm; }
    body { font-family: 'Segoe UI', Inter, Arial, sans-serif; color: #0f172a; margin: 0; font-size: 12px; }
    .sheet { border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; }
    .header { display: flex; justify-content: space-between; gap: 12px; border-bottom: 2px solid #1e293b; padding-bottom: 10px; margin-bottom: 12px; }
    .org { font-size: 18px; font-weight: 800; }
    .muted { color: #64748b; font-size: 11px; }
    .title { font-size: 22px; font-weight: 800; letter-spacing: 0.02em; margin: 4px 0; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #e0e7ff; color: #3730a3; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px 12px; margin-bottom: 12px; }
    .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; }
    .value { font-weight: 700; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th { background: #f1f5f9; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 8px; border: 1px solid #e2e8f0; }
    td { padding: 6px 8px; border: 1px solid #e2e8f0; vertical-align: top; }
    .mono { font-family: ui-monospace, monospace; font-size: 11px; }
    .num { text-align: right; font-family: ui-monospace, monospace; font-weight: 600; }
    .totals { margin-top: 8px; display: flex; justify-content: flex-end; }
    .totals table { width: 280px; }
    .signatures { margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; align-items: end; }
    .sig-box { text-align: center; }
    .sig-label { font-size: 9px; text-transform: uppercase; color: #64748b; margin-top: 4px; }
    .footer { margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 8px; font-size: 10px; color: #64748b; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <div class="org">${esc(input.organizationName)}</div>
        <div class="muted">${esc(input.organizationAddress || '')}</div>
        <div class="muted">${esc(input.organizationEmail || '')}${input.organizationPhone ? ' • ' + esc(input.organizationPhone) : ''}</div>
        <div class="muted">${input.registrationNumber ? 'Reg: ' + esc(input.registrationNumber) : ''}${input.taxId ? ' • PAN/GST: ' + esc(input.taxId) : ''}</div>
      </div>
      <div>${logo}</div>
    </div>

    <div class="title">Accounting Voucher</div>
    <div><span class="badge">${esc(input.voucherType)}</span> <span class="badge" style="background:#ecfdf5;color:#047857;">${esc(input.status)}</span></div>

    <div class="meta">
      <div><div class="label">Voucher No</div><div class="value mono">${esc(input.voucherNo)}</div></div>
      <div><div class="label">Date</div><div class="value">${esc(input.voucherDate)}</div></div>
      <div><div class="label">Currency</div><div class="value">${esc(input.currency)}</div></div>
      <div><div class="label">Narration</div><div class="value">${esc(input.narration || '—')}</div></div>
      <div><div class="label">Source</div><div class="value">${esc(input.sourceType || '—')}${input.sourceRef ? ' / ' + esc(input.sourceRef) : ''}</div></div>
      <div><div class="label">Fund / Event</div><div class="value">${esc(input.fundSummary || input.eventRef || '—')}</div></div>
      <div><div class="label">Approval</div><div class="value">${esc(input.approvalStatus || '—')}</div></div>
      <div><div class="label">Approved By</div><div class="value">${esc(input.approvedBy || '—')}</div></div>
      <div><div class="label">Posted By</div><div class="value">${esc(input.postedBy || '—')}</div></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Code</th>
          <th>Account</th>
          <th>Narration / Fund</th>
          <th style="text-align:right">Debit</th>
          <th style="text-align:right">Credit</th>
        </tr>
      </thead>
      <tbody>
        ${lineRows}
      </tbody>
    </table>

    <div class="totals">
      <table>
        <tr><td class="label">Total Debit</td><td class="num">${esc(input.totalDebit)}</td></tr>
        <tr><td class="label">Total Credit</td><td class="num">${esc(input.totalCredit)}</td></tr>
      </table>
    </div>

    <div class="signatures">
      <div class="sig-box">${pastorSig}<div class="sig-label">Authorized Signatory${input.signatoryName ? ': ' + esc(input.signatoryName) : ''}</div></div>
      <div class="sig-box">${acctSig}<div class="sig-label">Finance Officer</div></div>
      <div class="sig-box">${seal}<div class="sig-label">Official Seal</div></div>
    </div>

    <div class="footer">
      Generated: ${esc(input.generatedAt)}${input.auditRef ? ' • Audit ref: ' + esc(input.auditRef) : ''}${input.integrityChecksum ? ' • Integrity SHA-256: ' + esc(input.integrityChecksum.slice(0, 16)) + '…' : ''}
      <br/>This is a system-generated accounting voucher. Posted entries are immutable; corrections require reversal vouchers.
    </div>
  </div>
</body>
</html>`;
}

