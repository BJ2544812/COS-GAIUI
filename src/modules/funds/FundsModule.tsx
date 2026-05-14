import React from 'react';
import { Wallet, Lock, Unlock, Plus, Search, ArrowRightLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModuleHeader, ActionButton } from '@/components/modules/ModuleHeader';
import { ERPModule } from '@/types';
import { useSettings } from '@/context/SettingsContext';
import { formatCurrencyAmount } from '@/lib/formatCurrency';
import { cn } from '@/lib/utils';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';

type Campaign = { id: string; name: string; goal: unknown; startDate?: string | null; endDate?: string | null };

function numGoal(goal: unknown): number | null {
  if (goal == null) return null;
  if (typeof goal === 'number' && goal > 0) return goal;
  if (typeof goal === 'object' && goal !== null && 'toNumber' in goal && typeof (goal as { toNumber: () => number }).toNumber === 'function') {
    try {
      const n = (goal as { toNumber: () => number }).toNumber();
      return n > 0 ? n : null;
    } catch {
      return null;
    }
  }
  const n = Number(goal);
  return Number.isFinite(n) && n > 0 ? n : null;
}
type Donation = { id: string; campaignId?: string | null; amount: unknown };

function donationAmount(d: Donation): number {
  const a = d.amount as unknown;
  if (a == null) return 0;
  if (typeof a === 'number' && Number.isFinite(a)) return a;
  if (typeof a === 'object' && a !== null && 'toNumber' in a && typeof (a as { toNumber: () => number }).toNumber === 'function') {
    try {
      return (a as { toNumber: () => number }).toNumber();
    } catch {
      return 0;
    }
  }
  const n = Number(a);
  return Number.isFinite(n) ? n : 0;
}

export function FundsModule({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  const { settings } = useSettings();
  const cur = settings.financial.currency;
  const formatCurrency = (val: number) => formatCurrencyAmount(val, cur, { maximumFractionDigits: 0 });

  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [donations, setDonations] = React.useState<Donation[]>([]);
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [cRes, dRes] = await Promise.allSettled([
          apiRequest<unknown>('giving/campaigns', { method: 'GET' }),
          apiRequest<unknown>('giving/donations', { method: 'GET' }),
        ]);
        if (cancelled) return;
        const cJson = cRes.status === 'fulfilled' ? cRes.value : null;
        const dJson = dRes.status === 'fulfilled' ? dRes.value : null;
        try {
          setCampaigns(cJson ? parseApiResponse<Campaign[]>(cJson) : []);
        } catch {
          setCampaigns([]);
        }
        try {
          setDonations(dJson ? parseApiResponse<Donation[]>(dJson) : []);
        } catch {
          setDonations([]);
        }
        if (cRes.status === 'rejected' && dRes.status === 'rejected') {
          setError('Could not load giving data. Check permissions (manage_giving) and API availability.');
        }
      } catch (e) {
        if (!cancelled) {
          setError(formatApiError(e));
          setCampaigns([]);
          setDonations([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const raisedByCampaign = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const d of donations) {
      const cid = d.campaignId;
      if (!cid) continue;
      m.set(cid, (m.get(cid) ?? 0) + donationAmount(d));
    }
    return m;
  }, [donations]);

  const unassignedTotal = React.useMemo(
    () => donations.filter((d) => !d.campaignId).reduce((s, d) => s + donationAmount(d), 0),
    [donations],
  );

  const totalRaised = React.useMemo(() => donations.reduce((s, d) => s + donationAmount(d), 0), [donations]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter((c) => c.name.toLowerCase().includes(q));
  }, [campaigns, search]);

  const withGoal = campaigns.filter((c) => numGoal(c.goal) != null).length;

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-left pb-20">
      <ModuleHeader
        title="Fund management"
        subtitle="Giving campaigns with totals summed from recorded donations in this tenant."
        status="partial"
        icon={Wallet}
        actions={
          <>
            <ActionButton label="Open giving" icon={ArrowRightLeft} variant="secondary" onClick={() => onModuleChange?.('giving')} />
            <ActionButton label="New campaign" icon={Plus} variant="primary" onClick={() => onModuleChange?.('giving')} />
          </>
        }
      />

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 font-medium" role="status">
        <span className="font-black">Data source:</span> GET <code className="text-xs bg-white px-1 rounded">/giving/campaigns</code> and{' '}
        <code className="text-xs bg-white px-1 rounded">/giving/donations</code>. No illustrative balances — empty lists mean no rows in the database.
      </div>

      {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="border-none shadow-2xl rounded-[3rem] bg-indigo-600 text-white overflow-hidden relative group">
          <div className="absolute top-[-20px] right-[-20px] w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-1000" />
          <CardContent className="p-10 space-y-4 relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Wallet size={24} />
            </div>
            <h3 className="text-4xl font-black tracking-tighter leading-none">{loading ? '…' : formatCurrency(totalRaised)}</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Total recorded giving</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden group">
          <CardContent className="p-10 space-y-4">
            <div className="w-12 h-12 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Lock size={24} />
            </div>
            <h3 className="text-4xl font-black tracking-tighter leading-none text-slate-900">{loading ? '…' : campaigns.length}</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Campaigns</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-2xl rounded-[3rem] bg-emerald-50 border border-emerald-100 overflow-hidden">
          <CardContent className="p-10 space-y-4">
            <div className="w-12 h-12 bg-white text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Unlock size={24} />
            </div>
            <h3 className="text-4xl font-black tracking-tighter leading-none text-emerald-800">{loading ? '…' : donations.length}</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Donation rows loaded</p>
            <p className="text-xs text-emerald-900/80 font-medium">{withGoal} campaign(s) have a numeric goal set.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
        <CardHeader className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Campaigns</CardTitle>
            <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2">
              Raised = sum of donations linked to each campaign id
            </CardDescription>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name…"
              className="h-12 pl-12 pr-6 rounded-xl bg-slate-50 border-none font-bold text-sm focus:ring-2 focus:ring-indigo-600"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-sm font-medium">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm font-medium">No campaigns match this filter.</div>
            ) : (
              filtered.map((c) => {
                const raised = raisedByCampaign.get(c.id) ?? 0;
                const goal = numGoal(c.goal);
                const pct = goal ? Math.min(100, (raised / goal) * 100) : null;
                return (
                  <div
                    key={c.id}
                    className="p-10 hover:bg-slate-50/50 transition-colors border-l-4 border-transparent hover:border-indigo-500 flex flex-col md:flex-row md:items-center justify-between gap-8"
                  >
                    <div className="flex items-center gap-6">
                      <div
                        className={cn(
                          'w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border',
                          goal ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-slate-50 border-slate-100 text-slate-500',
                        )}
                      >
                        {goal ? <Lock size={20} /> : <Unlock size={20} />}
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{c.name}</h4>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge className="bg-slate-100 text-slate-600 border-none px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">
                            {c.id.slice(0, 8)}…
                          </Badge>
                          {goal != null && (
                            <Badge className="bg-indigo-100 text-indigo-700 border-none px-2 py-0.5 text-[8px] font-black uppercase tracking-widest">
                              Goal set
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 md:max-w-md w-full">
                      {goal != null && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Progress vs goal</span>
                            <span>{pct!.toFixed(0)}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-left md:text-right min-w-[150px]">
                      <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none">{formatCurrency(raised)}</p>
                      {goal != null && (
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">of {formatCurrency(goal)}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {!loading && unassignedTotal > 0 && (
              <div className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-amber-50/40 border-t border-amber-100">
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Donations without campaign</p>
                  <p className="text-xs text-slate-600 font-medium mt-1">These gifts are real but not linked to a campaign id.</p>
                </div>
                <p className="text-2xl font-black text-amber-800">{formatCurrency(unassignedTotal)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
