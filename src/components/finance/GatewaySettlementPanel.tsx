import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeedbackBanner } from '@/components/modules/ModuleHeader';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';

const SETTLEMENT_SAMPLE = {
  gateway: 'cashfree',
  externalSettlementId: 'CF-SETTLE-EXAMPLE-001',
  settlementDate: new Date().toISOString().slice(0, 10),
  grossAmount: 1000,
  feeAmount: 18,
  netAmount: 982,
  lines: [{ externalPaymentId: 'PASTE_GATEWAY_PAYMENT_ID', amount: 1000, feeAmount: 18 }],
};

/** Online gift settlements (Cashfree payout batches). */
export function GatewaySettlementPanel() {
  const [dash, setDash] = React.useState<any>(null);
  const [pending, setPending] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [importJson, setImportJson] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [dRes, pRes] = await Promise.all([
        apiRequest('giving/gateway/reconciliation'),
        apiRequest('giving/gateway/pending-settlements?limit=30'),
      ]);
      setDash(parseApiResponse(dRes));
      setPending(parseApiResponse<any[]>(pRes) || []);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  const runImport = async () => {
    try {
      setError(null);
      const body = JSON.parse(importJson);
      await apiRequest('giving/gateway/settlements/import', { method: 'POST', body });
      setImportJson('');
      void load();
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  const postSettlement = async (settlementId: string) => {
    try {
      setBusyId(settlementId);
      setError(null);
      await apiRequest(`giving/gateway/settlements/${settlementId}/post`, { method: 'POST' });
      void load();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="border border-slate-200 shadow-sm rounded-2xl bg-white overflow-hidden">
      <CardHeader className="p-6 border-b border-slate-100">
        <CardTitle className="text-lg font-bold text-slate-900">Online gift settlements</CardTitle>
        <CardDescription className="text-sm text-slate-600">
          Import payout files from your payment provider, match gifts, then record the bank deposit.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-sm text-slate-600">
          <p>1. Gifts are recorded when donors pay online.</p>
          <p>2. Import the settlement file when the provider pays out.</p>
          <p>3. Review matched gifts.</p>
          <p>4. Post to record money in the bank.</p>
        </div>

        {error && (
          <FeedbackBanner tone="error">
            {error}
            <button type="button" className="ml-3 underline text-xs font-semibold" onClick={() => void load()}>Try again</button>
          </FeedbackBanner>
        )}

        {loading && !dash ? <p className="text-sm text-slate-500">Loading…</p> : null}

        {dash && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl bg-amber-50 p-4"><p className="text-2xl font-bold">{dash.pendingSettlement}</p><p className="text-xs font-semibold text-amber-800">Waiting for payout</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-2xl font-bold">{dash.unmatchedDonations}</p><p className="text-xs font-semibold text-slate-600">Need matching</p></div>
            <div className="rounded-xl bg-rose-50 p-4"><p className="text-2xl font-bold">{dash.mismatchLines}</p><p className="text-xs font-semibold text-rose-800">Amount mismatches</p></div>
            <div className="rounded-xl bg-indigo-50 p-4"><p className="text-2xl font-bold">{dash.recentSettlements?.length ?? 0}</p><p className="text-xs font-semibold text-indigo-800">Recent batches</p></div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-700">Import settlement file</p>
          <textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            className="w-full h-28 text-xs font-mono border rounded-lg p-3"
            placeholder="Paste settlement JSON from Cashfree export…"
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void runImport()} disabled={!importJson.trim()}>Import</Button>
            <Button variant="ghost" size="sm" onClick={() => setImportJson(JSON.stringify(SETTLEMENT_SAMPLE, null, 2))}>Sample format</Button>
          </div>
        </div>

        {(dash?.recentSettlements?.length ?? 0) > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Settlement batches</p>
            <div className="space-y-2">
              {(dash.recentSettlements as any[]).map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{s.externalSettlementId}</p>
                    <p className="text-slate-500">{new Date(s.settlementDate).toLocaleDateString()} · Net ₹{Number(s.netAmount).toFixed(2)}</p>
                  </div>
                  {s.settlementVoucherId ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-none">Deposited</Badge>
                  ) : (
                    <Button size="sm" disabled={busyId === s.id} onClick={() => void postSettlement(s.id)}>
                      {busyId === s.id ? 'Recording…' : 'Record bank deposit'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Gifts waiting for payout</p>
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 bg-slate-50">
                  <th className="px-3 py-2">Donor</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Reference</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {pending.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-4 text-slate-400">All online gifts are matched or settled.</td></tr>
                ) : (
                  pending.map((r: any) => (
                    <tr key={r.id} className="border-t border-slate-50">
                      <td className="px-3 py-2">{r.donor?.name || 'Anonymous'}</td>
                      <td className="px-3 py-2">₹{Number(r.grossAmount ?? r.amount).toFixed(2)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.gatewayPaymentId?.slice(0, 14)}…</td>
                      <td className="px-3 py-2">{r.settlementStatus}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="w-3 h-3 mr-1" /> Refresh
        </Button>
      </CardContent>
    </Card>
  );
}
