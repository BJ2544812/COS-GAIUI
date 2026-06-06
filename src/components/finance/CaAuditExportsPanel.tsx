import * as React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackBanner, SectionCard } from '@/components/modules/ModuleHeader';
import { apiRequest, formatApiError, parseApiResponse, triggerBrowserDownload } from '@/lib/apiClient';

const CA_REPORTS: Array<{ type: string; title: string; description: string; group: string }> = [
  { group: 'Books of Account', type: 'trial_balance', title: 'Trial Balance', description: 'Account-wise debit/credit columns for period-end review.' },
  { group: 'Books of Account', type: 'ledger', title: 'Ledger', description: 'Running balance by account — pick an account under Ledgers for filtered export.' },
  { group: 'Books of Account', type: 'day_book', title: 'Day Book', description: 'Chronological posted vouchers with amounts and narration.' },
  { group: 'Books of Account', type: 'cash_bank_book', title: 'Cash & Bank Book', description: 'Asset account movements across posted vouchers.' },
  { group: 'Fund & Ministry', type: 'fund_statements', title: 'Fund Reports', description: 'Opening, receipts, outflows and closing per designated fund.' },
  { group: 'Fund & Ministry', type: 'event_pnl', title: 'Event P&L', description: 'Income, expenses and net position per event.' },
  { group: 'Donor records', type: 'donor_statements', title: 'Donation Register', description: 'Donor-wise gift listing for reconciliation and 80G support.' },
  { group: 'CA Handoff', type: 'tally_foundation', title: 'Tally Export', description: 'Voucher lines with account codes for external CA/Tally workflows.' },
];

export function CaAuditExportsPanel() {
  const [exporting, setExporting] = React.useState<string | null>(null);
  const [exportMsg, setExportMsg] = React.useState<string | null>(null);
  const [accounts, setAccounts] = React.useState<Array<{ id: string; code?: string; name: string }>>([]);
  const [ledgerAccountId, setLedgerAccountId] = React.useState('');

  React.useEffect(() => {
    void apiRequest<unknown>('finance/accounts')
      .then((res) => {
        const list = parseApiResponse<Array<{ id: string; code?: string; name: string }>>(res) || [];
        setAccounts(list);
        if (list[0]?.id) setLedgerAccountId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const runExport = async (type: string, title: string) => {
    try {
      setExporting(type);
      setExportMsg(null);
      const body: Record<string, unknown> = { type };
      if (type === 'ledger') {
        if (!ledgerAccountId) {
          setExportMsg('Select an account for the ledger export.');
          return;
        }
        body.accountId = ledgerAccountId;
      }
      const res = await apiRequest('finance/ca-exports', { method: 'POST', body });
      const data = parseApiResponse<{ csv: string; rowCount: number; checksumSha256: string }>(res);
      if (data.csv) {
        const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8' });
        triggerBrowserDownload(blob, `${type}-${new Date().toISOString().slice(0, 10)}.csv`);
        setExportMsg(`${title}: ${data.rowCount} rows exported (SHA-256 logged).`);
      }
    } catch (e) {
      setExportMsg(formatApiError(e));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {exportMsg && <FeedbackBanner tone={exportMsg.includes('rows exported') ? 'success' : 'error'}>{exportMsg}</FeedbackBanner>}
      <SectionCard title="Month-end pack" subtitle="Statutory exports with verification checksum — share with your chartered accountant">
        {accounts.length > 0 && (
          <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
            <p className="text-xs font-bold text-slate-700 mb-2">Ledger export account</p>
            <select
              className="h-11 w-full max-w-md rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium"
              value={ledgerAccountId}
              onChange={(e) => setLedgerAccountId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.code ? `${a.code} · ` : ''}{a.name}</option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-slate-500">Used when you download the Ledger CSV.</p>
          </div>
        )}
        <div className="space-y-8">
          {['Books of Account', 'Fund & Ministry', 'Donor records', 'CA Handoff'].map((group) => (
            <div key={group} className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{group}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CA_REPORTS.filter((r) => r.group === group).map((r) => (
                  <div key={r.type} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">{r.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{r.description}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-fit text-[10px] font-black uppercase tracking-widest"
                      disabled={exporting !== null}
                      onClick={() => void runExport(r.type, r.title)}
                    >
                      <Download className="w-3.5 h-3.5 mr-2" />
                      {exporting === r.type ? 'Exporting…' : 'Download CSV'}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
