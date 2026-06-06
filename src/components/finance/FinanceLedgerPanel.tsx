import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackBanner, ResponsiveTableWrap, SectionCard } from '@/components/modules/ModuleHeader';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { formatCurrencyAmount } from '@/lib/formatCurrency';

type Account = { id: string; code?: string; name: string; type?: string };

export function FinanceLedgerPanel({
  accounts,
  currency,
}: {
  accounts: Account[];
  currency: string;
}) {
  const [accountId, setAccountId] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lines, setLines] = React.useState<any[]>([]);
  const [accountName, setAccountName] = React.useState('');

  const fmt = React.useCallback(
    (value: number) => formatCurrencyAmount(value, currency, { maximumFractionDigits: 2 }),
    [currency],
  );

  const loadLedger = async () => {
    if (!accountId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest(`finance/ledger/${accountId}`);
      const data = parseApiResponse<{ account?: { name?: string }; lines?: any[] }>(res);
      setAccountName(data.account?.name || '');
      setLines(data.lines || []);
    } catch (e) {
      setError(formatApiError(e));
      setLines([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <FeedbackBanner tone="error">{error}</FeedbackBanner>}
      <SectionCard title="Account ledger" subtitle="Drill-down from posted vouchers — registry-first, ledger on demand">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <select
            className="flex-1 h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">Select account…</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code ? `${a.code} — ` : ''}{a.name}
              </option>
            ))}
          </select>
          <Button disabled={!accountId || loading} onClick={() => void loadLedger()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'View ledger'}
          </Button>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading ledger…</p>
        ) : lines.length === 0 ? (
          <p className="text-sm text-slate-500">Select an account to view posted voucher lines and running balance.</p>
        ) : (
          <>
            <p className="text-sm font-bold text-slate-800 mb-4">{accountName}</p>
            <ResponsiveTableWrap>
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">Voucher</th>
                    <th className="py-3 pr-4 text-right">Debit</th>
                    <th className="py-3 pr-4 text-right">Credit</th>
                    <th className="py-3 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      <td className="py-3 pr-4">{l.date ? new Date(l.date).toLocaleDateString() : '—'}</td>
                      <td className="py-3 pr-4 font-mono text-xs">{l.voucherNo || '—'}</td>
                      <td className="py-3 pr-4 text-right">{fmt(Number(l.debit || 0))}</td>
                      <td className="py-3 pr-4 text-right">{fmt(Number(l.credit || 0))}</td>
                      <td className="py-3 text-right font-semibold">{fmt(Number(l.runningBalance || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTableWrap>
          </>
        )}
      </SectionCard>
    </div>
  );
}
