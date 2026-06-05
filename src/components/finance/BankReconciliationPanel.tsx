import * as React from 'react';
import { CheckCircle2, CircleAlert, Loader2, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FeedbackBanner, SectionCard } from '@/components/modules/ModuleHeader';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';

type BankAccount = { id: string; name: string; code?: string; balance?: unknown; type?: string };

type StatementLineInput = {
  txnDate: string;
  amount: number;
  direction: 'Debit' | 'Credit';
  reference?: string;
  description?: string;
};

type RecoSummary = {
  session: {
    id: string;
    accountId: string;
    accountName?: string | null;
    accountCode?: string | null;
    fromDate: string;
    toDate: string;
    status: string;
  };
  totals: {
    lines: number;
    matchedLines: number;
    unmatchedLines: number;
    matchedAmount: number;
    unmatchedAmount: number;
  };
  lines: Array<{
    id: string;
    txnDate: string;
    amount: unknown;
    direction: string;
    reference?: string | null;
    description?: string | null;
    isMatched: boolean;
    matchedVoucherId?: string | null;
  }>;
};

function n(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  }
  if (typeof v === 'object' && v !== null && 'toString' in v) {
    const x = Number((v as { toString: () => string }).toString());
    return Number.isFinite(x) ? x : 0;
  }
  return 0;
}

function parseStatementPaste(text: string): StatementLineInput[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[')) {
    const arr = JSON.parse(trimmed) as unknown[];
    if (!Array.isArray(arr)) throw new Error('JSON must be an array of statement lines.');
    return arr.map((row) => {
      const r = row as Record<string, unknown>;
      const direction = String(r.direction || '').trim();
      if (!['Debit', 'Credit'].includes(direction)) {
        throw new Error('Each line needs direction Debit or Credit.');
      }
      return {
        txnDate: String(r.txnDate || r.date || new Date().toISOString()),
        amount: Number(r.amount),
        direction: direction as 'Debit' | 'Credit',
        reference: r.reference ? String(r.reference) : undefined,
        description: r.description ? String(r.description) : undefined,
      };
    });
  }
  const rows = trimmed.split(/\r?\n/).filter((l) => l.trim());
  return rows.map((line, idx) => {
    const parts = line.split(',').map((p) => p.trim());
    if (parts.length < 3) {
      throw new Error(`Line ${idx + 1}: use date, amount, direction (Credit or Debit), optional reference and description.`);
    }
    const direction = parts[2];
    if (!['Debit', 'Credit'].includes(direction)) {
      throw new Error(`Line ${idx + 1}: direction must be Debit or Credit.`);
    }
    const amount = Number(parts[1]);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(`Line ${idx + 1}: amount must be a positive number.`);
    }
    return {
      txnDate: parts[0],
      amount,
      direction: direction as 'Debit' | 'Credit',
      reference: parts[3] || undefined,
      description: parts.slice(4).join(', ') || undefined,
    };
  });
}

const SAMPLE_LINES = `2026-05-01,1500,Credit,BANK-001,Sunday offering deposit
2026-05-03,250,Debit,BANK-002,Vendor payment`;

interface BankReconciliationPanelProps {
  accounts: BankAccount[];
  fmt: (v: number) => string;
  donationReconciliation?: {
    rows?: unknown[];
    summary?: { withoutVoucher?: number; pendingSettlement?: number };
  } | null;
  onOpenSettlements?: () => void;
  onOpenVouchers?: () => void;
}

export function BankReconciliationPanel({
  accounts,
  fmt,
  donationReconciliation,
  onOpenSettlements,
  onOpenVouchers,
}: BankReconciliationPanelProps) {
  const bankAccounts = React.useMemo(
    () => accounts.filter((a) => a.type === 'Asset' && /bank|current|savings|cash at bank/i.test(String(a.name))),
    [accounts],
  );

  const [accountId, setAccountId] = React.useState('');
  const [fromDate, setFromDate] = React.useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [pasteText, setPasteText] = React.useState('');
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<RecoSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!accountId && bankAccounts[0]?.id) setAccountId(bankAccounts[0].id);
  }, [bankAccounts, accountId]);

  const loadSummary = React.useCallback(async (id: string) => {
    const res = await apiRequest(`finance/bank-reconciliation/sessions/${id}`);
    setSummary(parseApiResponse<RecoSummary>(res));
  }, []);

  const startSession = async () => {
    if (!accountId) {
      setError('Choose a bank account first.');
      return;
    }
    try {
      setBusy('start');
      setError(null);
      const res = await apiRequest('finance/bank-reconciliation/sessions', {
        method: 'POST',
        body: { accountId, fromDate: new Date(fromDate).toISOString(), toDate: new Date(toDate).toISOString() },
      });
      const session = parseApiResponse<{ id: string }>(res);
      setSessionId(session.id);
      await loadSummary(session.id);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };

  const importLines = async () => {
    if (!sessionId) {
      setError('Start a reconciliation session first.');
      return;
    }
    try {
      setBusy('import');
      setError(null);
      const lines = parseStatementPaste(pasteText);
      if (!lines.length) {
        setError('Add at least one statement line.');
        return;
      }
      await apiRequest(`finance/bank-reconciliation/sessions/${sessionId}/lines`, {
        method: 'POST',
        body: { lines },
      });
      setPasteText('');
      await loadSummary(sessionId);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };

  const autoMatch = async () => {
    if (!sessionId) return;
    try {
      setBusy('match');
      setError(null);
      const res = await apiRequest(`finance/bank-reconciliation/sessions/${sessionId}/auto-match`, { method: 'POST' });
      setSummary(parseApiResponse<RecoSummary>(res));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusy(null);
    }
  };

  const confidencePct = summary
    ? summary.totals.lines === 0
      ? 0
      : Math.round((summary.totals.matchedLines / summary.totals.lines) * 100)
    : null;

  const unmatched = summary?.lines.filter((l) => !l.isMatched) ?? [];
  const matched = summary?.lines.filter((l) => l.isMatched) ?? [];

  return (
    <div className="space-y-6">
      {error && <FeedbackBanner tone="error">{error}</FeedbackBanner>}

      <SectionCard title="Bank statement reconciliation" subtitle="Import your bank statement and match lines to posted vouchers">
        <ol className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm text-slate-600 mb-6">
          <li className="rounded-lg bg-slate-50 px-3 py-2"><span className="font-bold text-indigo-600">1.</span> Pick account & dates</li>
          <li className="rounded-lg bg-slate-50 px-3 py-2"><span className="font-bold text-indigo-600">2.</span> Paste statement lines</li>
          <li className="rounded-lg bg-slate-50 px-3 py-2"><span className="font-bold text-indigo-600">3.</span> Auto-match vouchers</li>
          <li className="rounded-lg bg-slate-50 px-3 py-2"><span className="font-bold text-indigo-600">4.</span> Review unmatched items</li>
        </ol>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-slate-500">Bank account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
            >
              {bankAccounts.length === 0 ? (
                <option value="">No bank accounts in chart</option>
              ) : (
                bankAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code ? `${a.code} · ` : ''}{a.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">From</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500">To</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={() => void startSession()} disabled={busy === 'start' || !accountId}>
              {busy === 'start' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {sessionId ? 'New session' : 'Start session'}
            </Button>
          </div>
        </div>

        {sessionId && (
          <p className="text-xs text-slate-500 mb-4">
            Active session · {summary?.session.accountName || 'Bank'} · {summary?.session.status || 'Open'}
          </p>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Statement lines</label>
          <p className="text-xs text-slate-500">
            One line per row: <code className="text-indigo-600">date, amount, Credit or Debit, reference, description</code> — or paste JSON array.
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            className="w-full h-32 text-xs font-mono border border-slate-200 rounded-lg p-3"
            placeholder={SAMPLE_LINES}
            disabled={!sessionId}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setPasteText(SAMPLE_LINES)} disabled={!sessionId}>
              Sample format
            </Button>
            <Button size="sm" onClick={() => void importLines()} disabled={!sessionId || busy === 'import' || !pasteText.trim()}>
              {busy === 'import' ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
              Import lines
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void autoMatch()} disabled={!sessionId || busy === 'match'}>
              {busy === 'match' ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              Match to vouchers
            </Button>
          </div>
        </div>
      </SectionCard>

      {summary && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-xl bg-indigo-50 p-4">
              <p className="text-2xl font-black text-indigo-900">{confidencePct}%</p>
              <p className="text-xs font-semibold text-indigo-700">Matched</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-2xl font-black text-emerald-900">{summary.totals.matchedLines}</p>
              <p className="text-xs font-semibold text-emerald-700">Lines matched</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-2xl font-black text-amber-900">{summary.totals.unmatchedLines}</p>
              <p className="text-xs font-semibold text-amber-800">Still unmatched</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-lg font-black text-slate-900">{fmt(summary.totals.matchedAmount)}</p>
              <p className="text-xs font-semibold text-slate-600">Matched amount</p>
            </div>
            <div className="rounded-xl bg-rose-50 p-4">
              <p className="text-lg font-black text-rose-900">{fmt(summary.totals.unmatchedAmount)}</p>
              <p className="text-xs font-semibold text-rose-800">Unmatched amount</p>
            </div>
          </div>

          {summary.totals.unmatchedLines > 0 && (
            <SectionCard title="Unmatched bank lines" subtitle="Post missing vouchers or check amounts and dates">
              <div className="overflow-x-auto rounded-lg border border-amber-100">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-amber-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-amber-800">Date</th>
                      <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-amber-800">Direction</th>
                      <th className="px-3 py-2 text-right text-[10px] font-black uppercase text-amber-800">Amount</th>
                      <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-amber-800">Reference</th>
                      <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-amber-800">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unmatched.map((l) => (
                      <tr key={l.id} className="border-t border-amber-50">
                        <td className="px-3 py-2">{new Date(l.txnDate).toLocaleDateString()}</td>
                        <td className="px-3 py-2">{l.direction}</td>
                        <td className="px-3 py-2 text-right font-bold">{fmt(n(l.amount))}</td>
                        <td className="px-3 py-2 text-slate-600">{l.reference || '—'}</td>
                        <td className="px-3 py-2 text-slate-600">{l.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {onOpenVouchers && (
                <Button variant="outline" size="sm" className="mt-3" onClick={onOpenVouchers}>
                  Open voucher registry
                </Button>
              )}
            </SectionCard>
          )}

          {matched.length > 0 && (
            <SectionCard title="Matched lines" subtitle="Bank lines linked to posted vouchers">
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-500">Date</th>
                      <th className="px-3 py-2 text-right text-[10px] font-black uppercase text-slate-500">Amount</th>
                      <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-500">Voucher</th>
                      <th className="px-3 py-2 text-left text-[10px] font-black uppercase text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matched.map((l) => (
                      <tr key={l.id} className="border-t border-slate-50">
                        <td className="px-3 py-2">{new Date(l.txnDate).toLocaleDateString()}</td>
                        <td className="px-3 py-2 text-right font-bold">{fmt(n(l.amount))}</td>
                        <td className="px-3 py-2 font-mono text-xs">{l.matchedVoucherId?.slice(0, 8) ?? '—'}…</td>
                        <td className="px-3 py-2">
                          <Badge className="bg-emerald-100 text-emerald-800 border-none text-[9px]">
                            <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                            Matched
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {summary.totals.lines > 0 && summary.totals.unmatchedLines === 0 && (
            <FeedbackBanner tone="success">
              All statement lines are matched for this session. Your bank activity aligns with posted vouchers for the selected period.
            </FeedbackBanner>
          )}
        </>
      )}

      <SectionCard title="Gifts vs books (this month)" subtitle="Quick check before you close the month">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Gifts recorded</p>
            <p className="font-bold text-lg">{(donationReconciliation?.rows || []).length}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Missing voucher</p>
            <p className="font-bold text-lg text-amber-700">{donationReconciliation?.summary?.withoutVoucher ?? 0}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Online awaiting payout</p>
            <p className="font-bold text-lg">{donationReconciliation?.summary?.pendingSettlement ?? '—'}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 flex flex-col gap-2">
            {onOpenSettlements && (
              <Button variant="outline" size="sm" onClick={onOpenSettlements}>Online settlements</Button>
            )}
          </div>
        </div>
        {(donationReconciliation?.summary?.withoutVoucher ?? 0) > 0 && (
          <p className="mt-3 text-sm text-amber-800 flex items-start gap-2">
            <CircleAlert className="h-4 w-4 shrink-0 mt-0.5" />
            Some gifts do not have a voucher yet. Record or post them in Giving before you sign off reconciliation.
          </p>
        )}
      </SectionCard>
    </div>
  );
}
