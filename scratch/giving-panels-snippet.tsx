const SETTLEMENT_SAMPLE = {
  gateway: 'cashfree',
  externalSettlementId: 'CF-SETTLE-EXAMPLE-001',
  settlementDate: new Date().toISOString().slice(0, 10),
  grossAmount: 1000,
  feeAmount: 18,
  netAmount: 982,
  lines: [{ externalPaymentId: 'PASTE_GATEWAY_PAYMENT_ID', amount: 1000, feeAmount: 18 }],
};

function GatewayReconciliationPanel() {
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
    <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
      <CardHeader className="p-8 border-b border-slate-50">
        <CardTitle className="text-xl font-black uppercase tracking-tight">Gateway Settlement Reconciliation</CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Every online gift sits in Gateway Clearing until Cashfree pays out. Import the settlement file, confirm matches, then post vouchers so bank and clearing agree.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1 rounded-xl bg-slate-50 p-4">
          <li>Gifts complete → voucher Dr Clearing / Cr income (and fee recovery if donor covered charges).</li>
          <li>Import Cashfree settlement JSON when payout hits your dashboard.</li>
          <li>Review matched lines; fix mismatches before posting.</li>
          <li>Post settlement → Dr Bank / Cr Clearing (+ fee expense voucher if applicable).</li>
        </ol>

        {error && (
          <FeedbackBanner tone="error">
            {error}
            <button type="button" className="ml-3 underline text-xs font-bold" onClick={() => void load()}>Retry</button>
          </FeedbackBanner>
        )}

        {loading && !dash ? (
          <p className="text-sm text-slate-500">Loading reconciliation summary…</p>
        ) : null}

        {dash && (
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.div className="rounded-xl bg-amber-50 p-4"><p className="text-2xl font-black">{dash.pendingSettlement}</p><p className="text-[10px] font-bold uppercase text-amber-700">Pending settlement</p></motion.div>
            <motion.div className="rounded-xl bg-slate-50 p-4"><p className="text-2xl font-black">{dash.unmatchedDonations}</p><p className="text-[10px] font-bold uppercase text-slate-600">Unmatched</p></motion.div>
            <motion.div className="rounded-xl bg-rose-50 p-4"><p className="text-2xl font-black">{dash.mismatchLines}</p><p className="text-[10px] font-bold uppercase text-rose-700">Mismatches</p></motion.div>
            <motion.div className="rounded-xl bg-indigo-50 p-4"><p className="text-2xl font-black">{dash.recentSettlements?.length ?? 0}</p><p className="text-[10px] font-bold uppercase text-indigo-700">Recent batches</p></motion.div>
          </motion.div>
        )}

        <motion.div className="space-y-2">
          <p className="text-xs font-bold uppercase text-slate-500">Import settlement JSON</p>
          <textarea value={importJson} onChange={(e) => setImportJson(e.target.value)} className="w-full h-32 text-xs font-mono border rounded-lg p-3" placeholder='{"gateway":"cashfree","externalSettlementId":"..."}' />
          <motion.div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void runImport()} disabled={!importJson.trim()}>Import batch</Button>
            <Button variant="ghost" size="sm" onClick={() => setImportJson(JSON.stringify(SETTLEMENT_SAMPLE, null, 2))}>Load sample template</Button>
          </motion.div>
        </motion.div>

        {(dash?.recentSettlements?.length ?? 0) > 0 && (
          <motion.div>
            <p className="text-xs font-bold uppercase text-slate-500 mb-2">Recent settlement batches</p>
            <motion.div className="space-y-2">
              {(dash.recentSettlements as any[]).map((s) => (
                <motion.div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 px-4 py-3 text-xs">
                  <motion.div>
                    <p className="font-bold text-slate-900">{s.externalSettlementId}</p>
                    <p className="text-slate-500">{new Date(s.settlementDate).toLocaleDateString()} · Net ₹{Number(s.netAmount).toFixed(2)}</p>
                  </motion.div>
                  {s.settlementVoucherId ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-none">Posted</Badge>
                  ) : (
                    <Button size="sm" disabled={busyId === s.id} onClick={() => void postSettlement(s.id)}>
                      {busyId === s.id ? 'Posting…' : 'Post to bank'}
                    </Button>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        <motion.div>
          <p className="text-xs font-bold uppercase text-slate-500 mb-2">Awaiting Cashfree settlement</p>
          <motion.div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-slate-400"><th className="py-2">Donor</th><th>Amount</th><th>Gateway ID</th><th>Status</th></tr></thead>
              <tbody>
                {pending.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-slate-400">No gifts waiting for settlement.</td></tr>
                ) : (
                  pending.map((r: any) => (
                    <tr key={r.id} className="border-t border-slate-50">
                      <td className="py-2">{r.donor?.name || 'Anonymous'}</td>
                      <td>{Number(r.grossAmount ?? r.amount).toFixed(2)}</td>
                      <td className="font-mono">{r.gatewayPaymentId?.slice(0, 16)}…</td>
                      <td>{r.settlementStatus}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        </motion.div>
        <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className="w-3 h-3 mr-1" /> Refresh
        </Button>
      </CardContent>
    </Card>
  );
}

function DataQualityPanel({ onOpenReconciliation }: { onOpenReconciliation: () => void }) {
  const [report, setReport] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest('giving/data-quality');
      setReport(parseApiResponse(res));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  return (
    <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
      <CardHeader className="p-8 border-b border-slate-50">
        <CardTitle className="text-xl font-black uppercase tracking-tight">Operational Data Quality</CardTitle>
        <CardDescription className="text-xs text-slate-500">Duplicate contacts, orphan checkouts, and settlement gaps — fix before month-end close.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {error && (
          <FeedbackBanner tone="error">
            {error}
            <button type="button" className="ml-2 underline text-xs" onClick={() => void load()}>Retry</button>
          </FeedbackBanner>
        )}
        {loading ? <p className="text-sm text-slate-500">Scanning records…</p> : null}
        {report?.warnings?.map((w: { level: string; message: string; code: string }) => (
          <FeedbackBanner key={w.code} tone={w.level === 'warn' ? 'warning' : 'info'}>
            {w.message}
            {w.code === 'PENDING_SETTLEMENT' || w.code === 'UNMATCHED_GATEWAY' ? (
              <button type="button" className="ml-2 underline text-xs font-bold" onClick={onOpenReconciliation}>Open settlement recon</button>
            ) : null}
          </FeedbackBanner>
        ))}
        {!loading && (!report?.warnings?.length) && (
          <FeedbackBanner tone="success">No data-quality warnings right now.</FeedbackBanner>
        )}
        {(report?.duplicateMemberPhones?.length > 0 || report?.duplicateMemberEmails?.length > 0) && (
          <motion.div className="space-y-4">
            <p className="text-xs font-bold uppercase text-slate-500 flex items-center gap-2"><ShieldAlert size={14} /> Possible duplicate members</p>
            {report.duplicateMemberPhones?.slice(0, 5).map((b: any) => (
              <motion.div key={b.phone} className="rounded-lg border border-amber-100 bg-amber-50/50 p-3 text-xs">
                <p className="font-bold">Phone …{b.phone}</p>
                <p className="text-slate-600">{b.members.map((m: any) => m.name).join(' · ')}</p>
              </motion.div>
            ))}
            {report.duplicateMemberEmails?.slice(0, 5).map((b: any) => (
              <motion.div key={b.email} className="rounded-lg border border-amber-100 bg-amber-50/50 p-3 text-xs">
                <p className="font-bold">{b.email}</p>
                <p className="text-slate-600">{b.members.map((m: any) => m.name).join(' · ')}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
        <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}><RefreshCw className="w-3 h-3 mr-1" /> Rescan</Button>
      </CardContent>
    </Card>
  );
}

