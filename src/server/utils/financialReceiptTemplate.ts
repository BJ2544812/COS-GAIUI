export function buildFinancialReceiptHtml(input: {
  organizationName: string;
  organizationAddress?: string | null;
  organizationEmail?: string | null;
  organizationPhone?: string | null;
  registrationNumber?: string | null;
  taxId?: string | null;
  logoPath?: string | null;
  receiptNo: string;
  issueDate: string;
  donorName: string;
  donorEmail?: string | null;
  donorPhone?: string | null;
  amountDisplay: string;
  amountWords?: string | null;
  fundName?: string | null;
  campaignName?: string | null;
  transactionRef?: string | null;
  voucherNo?: string | null;
  note?: string | null;
  signatoryName?: string | null;
  pastorSignatureSrc?: string | null;
  accountantSignatureSrc?: string | null;
  sealSrc?: string | null;
  generatedAt?: string | null;
  integrityChecksum?: string | null;
}) {
  const esc = (v: unknown) =>
    String(v ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  const logo = input.logoPath?.trim() ? `<img src="${esc(input.logoPath)}" alt="Logo" style="height:56px;object-fit:contain;" />` : '';
  const pastorSig = input.pastorSignatureSrc
    ? `<img src="${input.pastorSignatureSrc}" alt="Signature" style="max-height:40px;object-fit:contain;" />`
    : '<div style="height:40px;border-bottom:1px solid #94a3b8;"></div>';
  const seal = input.sealSrc ? `<img src="${input.sealSrc}" alt="Seal" style="max-height:44px;object-fit:contain;" />` : '';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4; margin: 12mm; }
    body { font-family: 'Segoe UI', Inter, Arial, sans-serif; color: #0f172a; margin: 0; }
    .box { border: 2px solid #1e293b; border-radius: 10px; padding: 18px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 2px solid #1e293b; padding-bottom: 12px; }
    .muted { color: #64748b; font-size: 11px; line-height: 1.5; }
    .title { font-size: 26px; font-weight: 800; margin: 12px 0 4px; letter-spacing: 0.02em; }
    .receipt-meta { font-size: 12px; color: #475569; margin-bottom: 12px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; margin-top: 14px; font-size: 13px; }
    .label { color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
    .value { font-weight: 700; margin-top: 2px; }
    .amount { margin-top: 18px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; }
    .amount strong { font-size: 28px; display: block; margin-top: 4px; }
    .signatures { margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: end; }
    .sig-label { font-size: 9px; text-transform: uppercase; color: #64748b; margin-top: 6px; }
    .footer { margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #64748b; line-height: 1.5; }
    .eighty-g { margin-top: 10px; font-size: 11px; font-weight: 600; color: #047857; }
  </style>
</head>
<body>
  <div class="box">
    <div class="header">
      <div>
        <div style="font-size:20px;font-weight:800">${esc(input.organizationName)}</div>
        <div class="muted">${esc(input.organizationAddress || '')}</div>
        <div class="muted">${esc(input.organizationEmail || '')} ${input.organizationPhone ? '• ' + esc(input.organizationPhone) : ''}</div>
        <div class="muted">${input.registrationNumber ? 'Reg. No: ' + esc(input.registrationNumber) : ''}${input.taxId ? ' • PAN: ' + esc(input.taxId) : ''}</div>
      </div>
      <div>${logo}</div>
    </div>
    <div class="title">Official Donation Receipt</div>
    <div class="receipt-meta">
      Receipt No: <strong>${esc(input.receiptNo)}</strong> &nbsp;|&nbsp; Date: <strong>${esc(input.issueDate)}</strong>
      ${input.voucherNo ? ` &nbsp;|&nbsp; Voucher: <strong>${esc(input.voucherNo)}</strong>` : ''}
    </div>

    <div class="meta">
      <div><div class="label">Donor Name</div><div class="value">${esc(input.donorName)}</div></div>
      <div><div class="label">Email</div><div class="value">${esc(input.donorEmail || '—')}</div></div>
      <div><div class="label">Phone</div><div class="value">${esc(input.donorPhone || '—')}</div></div>
      <div><div class="label">Transaction Ref</div><div class="value">${esc(input.transactionRef || '—')}</div></div>
      <div><div class="label">Fund / Designation</div><div class="value">${esc(input.fundName || 'General')}</div></div>
      <div><div class="label">Campaign</div><div class="value">${esc(input.campaignName || 'General Giving')}</div></div>
    </div>

    <div class="amount">
      <div class="label">Amount Received (in figures)</div>
      <strong>${esc(input.amountDisplay)}</strong>
      ${input.amountWords ? `<div class="muted" style="margin-top:6px;">${esc(input.amountWords)}</div>` : ''}
    </div>

    <div style="margin-top: 14px; font-size: 12px; line-height: 1.6;">${esc(input.note || 'Received with thanks for ministry and charitable purposes. This receipt is issued for church/trust records and donor accountability.')}</div>
    <div class="eighty-g">Exemption under Section 80G may apply as per applicable trust registration. Please retain for income-tax records.</div>

    <div class="signatures">
      <div style="text-align:center;">${pastorSig}<div class="sig-label">${esc(input.signatoryName || 'Authorized Signatory')}</div></div>
      <div style="text-align:center;">${seal}<div class="sig-label">Official Seal</div></div>
    </div>

    <div class="footer">
      ${input.generatedAt ? `Generated: ${esc(input.generatedAt)}. ` : ''}
      ${input.integrityChecksum ? `Document integrity (SHA-256): ${esc(input.integrityChecksum.slice(0, 24))}… ` : ''}
      This is a computer-generated receipt. Alterations invalidate this document.
    </div>
  </div>
</body>
</html>`;
}

