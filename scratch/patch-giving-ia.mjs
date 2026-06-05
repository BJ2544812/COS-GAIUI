import fs from 'fs';
const p = 'src/modules/giving/GivingModule.tsx';
let s = fs.readFileSync(p, 'utf8');

s = s.replace(
  "import { FeedbackBanner, ModuleHeader, ActionButton } from '@/components/modules/ModuleHeader';",
  "import { FeedbackBanner, ModuleHeader, ActionButton } from '@/components/modules/ModuleHeader';\nimport { navigateToFinanceTab } from '@/lib/financeNavigation';",
);

s = s.replace(
  "const [workspaceTab, setWorkspaceTab] = React.useState<'operations' | 'registry' | 'donors' | 'campaigns' | 'member-crm' | 'reconciliation' | 'sessions' | 'data-quality'>('operations');",
  "const [workspaceTab, setWorkspaceTab] = React.useState<'overview' | 'registry' | 'donors' | 'campaigns' | 'sessions' | 'receipts' | 'settlements'>('overview');",
);

s = s.replace(
  `        title="Giving"
        subtitle="Donation operations center — record, track, and manage all tithes, offerings, and campaign gifts."`,
  `        title="Giving"
        subtitle="Record gifts, thank donors, print receipts, and track campaigns."`,
);

s = s.replace(
  `            <ActionButton label="Tax Reports Unavailable" icon={FileText} variant="secondary" disabled />
            <ActionButton label="Record Donation"`,
  `            <ActionButton label="Record gift"`,
);

const oldTabs = `        {[
          ['operations', 'Dashboard'],
          ['registry', 'Donation Registry'],
          ['donors', 'Donor Timeline'],
          ['campaigns', 'Campaign Finance'],
          ['member-crm', 'Member CRM'],
          ['reconciliation', 'Settlement Recon'],
          ['sessions', 'Service Collections'],
          ['data-quality', 'Data Quality'],
        ].map`;

const newTabs = `        {[
          ['overview', 'Overview'],
          ['registry', 'All gifts'],
          ['donors', 'Donors'],
          ['campaigns', 'Campaigns'],
          ['sessions', 'Sunday & services'],
          ['receipts', 'Receipts'],
          ['settlements', 'Settlement status'],
        ].map`;

s = s.replace(oldTabs, newTabs);

s = s.replace(/workspaceTab !== 'operations'/g, "workspaceTab !== 'overview'");
s = s.replace(/workspaceTab === 'operations'/g, "workspaceTab === 'overview'");

// Remove reconciliation, data-quality, member-crm blocks
s = s.replace(/\s*\{workspaceTab === 'reconciliation' && \([\s\S]*?\)\}\n/, '\n');
s = s.replace(/\s*\{workspaceTab === 'data-quality' && \([\s\S]*?\)\}\n/, '\n');
s = s.replace(/\s*\{workspaceTab === 'member-crm' && \([\s\S]*?\)\}\n/, '\n');

// Add settlements tab before sessions block - find sessions block and insert before it
const settlementsPanel = `
      {workspaceTab === 'settlements' && (
        <GivingSettlementStatusPanel onOpenFinance={() => navigateToFinanceTab(onModuleChange, 'settlements')} />
      )}

      {workspaceTab === 'receipts' && (
        <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50">
            <CardTitle className="text-xl font-bold text-slate-900">Receipts</CardTitle>
            <CardDescription className="text-sm text-slate-500">Download PDF receipts from the gift registry — use the download icon on each row.</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <Button variant="outline" onClick={() => setWorkspaceTab('registry')}>Open all gifts</Button>
            <Button variant="ghost" className="ml-2" onClick={() => navigateToFinanceTab(onModuleChange, 'receipts')}>Finance receipt archive</Button>
          </CardContent>
        </Card>
      )}

`;

if (!s.includes('GivingSettlementStatusPanel')) {
  s = s.replace(
    "{workspaceTab === 'sessions' && (",
    settlementsPanel + "      {workspaceTab === 'sessions' && (",
  );
}

// Remove GatewayReconciliationPanel, DataQualityPanel, SETTLEMENT_SAMPLE - from const SETTLEMENT to end of DataQualityPanel before ServiceCollectionPanel
const cutStart = s.indexOf('const SETTLEMENT_SAMPLE');
const cutEnd = s.indexOf('function ServiceCollectionPanel()');
if (cutStart > 0 && cutEnd > cutStart) {
  const replacement = `function GivingSettlementStatusPanel({ onOpenFinance }: { onOpenFinance: () => void }) {
  const [dash, setDash] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await apiRequest('giving/gateway/reconciliation');
        setDash(parseApiResponse(res));
      } catch {
        setDash(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
      <CardHeader className="p-8 border-b border-slate-50">
        <CardTitle className="text-xl font-bold text-slate-900">Online gift settlement status</CardTitle>
        <CardDescription className="text-sm text-slate-500">When donors pay online, payouts are recorded in Finance after the provider sends settlement.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-4">
        {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}
        {dash && (
          <motion.div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <motion.div className="rounded-xl bg-amber-50 p-4"><p className="text-2xl font-bold">{dash.pendingSettlement}</p><p className="text-xs font-semibold text-amber-800">Waiting for payout</p></motion.div>
            <motion.div className="rounded-xl bg-slate-50 p-4"><p className="text-2xl font-bold">{dash.unmatchedDonations}</p><p className="text-xs font-semibold">Need matching</p></motion.div>
            <motion.div className="rounded-xl bg-indigo-50 p-4"><p className="text-2xl font-bold">{dash.recentSettlements?.length ?? 0}</p><p className="text-xs font-semibold text-indigo-800">Recent batches</p></motion.div>
          </motion.div>
        )}
        <Button onClick={onOpenFinance}>Manage settlements in Finance</Button>
      </CardContent>
    </Card>
  );
}

`.replace(/motion\.div/g, 'motion.div').replace(/<\/?motion\.div/g, (x) => x.replace('motion.', ''));

  s = s.slice(0, cutStart) + replacement.replace(/motion\.motion.div/g, 'div').replace(/motion\.motion.div/g, 'div') + s.slice(cutEnd);
  // fix div
  const bad = s.slice(cutStart, cutStart + replacement.length + 500);
}

// simpler replacement for settlement panel without motion
const simpleReplacement = `function GivingSettlementStatusPanel({ onOpenFinance }: { onOpenFinance: () => void }) {
  const [dash, setDash] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    void (async () => {
      try {
        const res = await apiRequest('giving/gateway/reconciliation');
        setDash(parseApiResponse(res));
      } catch { setDash(null); } finally { setLoading(false); }
    })();
  }, []);
  return (
    <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
      <CardHeader className="p-8 border-b border-slate-50">
        <CardTitle className="text-xl font-bold text-slate-900">Online gift settlement status</CardTitle>
        <CardDescription className="text-sm text-slate-500">Import payouts and record bank deposits in Finance.</CardDescription>
      </CardHeader>
      <CardContent className="p-8 space-y-4">
        {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}
        {dash && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-amber-50 p-4"><p className="text-2xl font-bold">{dash.pendingSettlement}</p><p className="text-xs font-semibold text-amber-800">Waiting for payout</p></div>
            <motion.div className="rounded-xl bg-slate-50 p-4"><p className="text-2xl font-bold">{dash.unmatchedDonations}</p><p className="text-xs font-semibold">Need matching</p></motion.div>
            <motion.div className="rounded-xl bg-indigo-50 p-4"><p className="text-2xl font-bold">{dash.recentSettlements?.length ?? 0}</p><p className="text-xs font-semibold text-indigo-800">Recent batches</p></motion.div>
          </motion.div>
        )}
        <Button onClick={onOpenFinance}>Manage settlements in Finance</Button>
      </CardContent>
    </Card>
  );
}

`;
// fix motion in simpleReplacement
const fixedSimple = simpleReplacement.replace(/<\/?motion\.div/g, (m) => m.replace('motion.', ''));

if (cutStart > 0 && cutEnd > cutStart) {
  s = s.slice(0, cutStart) + fixedSimple + s.slice(cutEnd);
}

fs.writeFileSync(p, s);
console.log('patched giving');
