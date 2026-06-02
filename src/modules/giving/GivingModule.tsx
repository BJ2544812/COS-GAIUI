import * as React from 'react';
import { 
  HeartHandshake, 
  CircleDollarSign, 
  TrendingUp, 
  Plus, 
  Download, 
  Calendar, 
  ArrowUpRight, 
  ArrowRight,
  Filter,
  Search,
  CreditCard,
  Banknote,
  MoreVertical,
  ArrowLeft,
  ChevronRight,
  Target,
  FileText,
  PlusCircle,
  History,
  User,
  Flag,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { listMembers, type MemberDto } from '../members/memberApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ERPModule } from '@/types';
import { apiDownloadBlob, apiRequest, formatApiError, parseApiResponse, triggerBrowserDownload } from '@/lib/apiClient';
import { formatCurrencyAmount } from '@/lib/formatCurrency';
import { useSettings } from '@/context/SettingsContext';
import { FeedbackBanner, ModuleHeader, ActionButton } from '@/components/modules/ModuleHeader';
import { navigateToFinanceTab } from '@/lib/financeNavigation';

type GiveRow = {
  id: string;
  donor: string;
  type: string;
  amount: number;
  method: string;
  dateIso: string;
  date: string;
};

function coalesceAmount(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof v === 'object' && v !== null && 'toString' in v) {
    const n = Number((v as { toString: () => string }).toString());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

// Aggregation utilities moved inside component

interface GivingModuleProps {
  onModuleChange?: (module: ERPModule) => void;
}

export function GivingModule({ onModuleChange }: GivingModuleProps) {
  const { settings } = useSettings();
  const [view, setView] = React.useState<'dashboard' | 'create'>('dashboard');
  const [workspaceTab, setWorkspaceTab] = React.useState<'overview' | 'registry' | 'donors' | 'campaigns' | 'sessions' | 'receipts' | 'settlements'>('overview');
  const [selectedFund, setSelectedFund] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [donationRows, setDonationRows] = React.useState<GiveRow[]>([]);
  const [apiTotal, setApiTotal] = React.useState<number | null>(null);
  const [totalCount, setTotalCount] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(0);
  const PAGE_SIZE = 50;
  const [givingError, setGivingError] = React.useState<string | null>(null);
  const [listLoading, setListLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [members, setMembers] = React.useState<MemberDto[]>([]);
  const [campaigns, setCampaigns] = React.useState<{id: string, name: string}[]>([]);
  const [registrySearch, setRegistrySearch] = React.useState('');
  const [registryMethod, setRegistryMethod] = React.useState('');
  const [receiptBusyId, setReceiptBusyId] = React.useState<string | null>(null);

  const loadMembers = React.useCallback(async () => {
    try {
      const list = await listMembers();
      setMembers(list);
    } catch (e) {
      console.error('[GivingModule] Failed to load members', e);
    }
  }, []);

  const loadCampaigns = React.useCallback(async () => {
    try {
      const json = await apiRequest<unknown>('giving/campaigns', { method: 'GET' });
      const list = parseApiResponse<{id: string, name: string}[]>(json);
      setCampaigns(list);
    } catch (e) {
      console.error('[GivingModule] Failed to load campaigns', e);
    }
  }, []);

  const loadDonations = React.useCallback(async (page?: number, search?: string, method?: string) => {
    const p = page ?? 0;
    const s = search ?? '';
    const m = method ?? '';
    try {
      setGivingError(null);
      setListLoading(true);
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(p * PAGE_SIZE));
      if (s) params.set('search', s);
      if (m) params.set('method', m);
      const json = await apiRequest<unknown>(`giving/donations?${params.toString()}`, { method: 'GET' });
      const raw = json as any;
      const list = (raw?.data ?? []) as Array<{
        id: string;
        amount: unknown;
        method: string;
        date: string;
        donor?: { name: string } | null;
        campaign?: { name: string } | null;
        fund?: { name: string } | null;
        voucher?: { voucherNo: string; status: string } | null;
        reversalVoucher?: { voucherNo: string } | null;
        reference?: string | null;
      }>;
      const meta = raw?.meta as { total?: number } | undefined;
      setTotalCount(meta?.total ?? list.length);
      setApiTotal(list.reduce((s, d) => s + coalesceAmount(d.amount), 0));
      setDonationRows(
        list.map((d) => {
          const rawDate = d.date ? new Date(d.date) : new Date();
          const dateLabel = Number.isNaN(rawDate.getTime()) ? '—' : rawDate.toLocaleDateString();
          return {
            id: d.id,
            donor: d.donor?.name ?? 'Anonymous',
            type: d.campaign?.name ?? 'General Giving',
            amount: coalesceAmount(d.amount),
            method: d.method || '—',
            dateIso: d.date || rawDate.toISOString(),
            date: dateLabel,
          };
        }),
      );
    } catch (e) {
      console.error('[GivingModule] Failed to load donations', e);
      setGivingError(formatApiError(e));
      setDonationRows([]);
      setApiTotal(null);
    } finally {
      setListLoading(false);
    }
  }, []);

  const downloadDonationReceipt = async (donationId: string) => {
    try {
      setReceiptBusyId(donationId);
      const blob = await apiDownloadBlob(`giving/donations/${donationId}/receipt/pdf`);
      triggerBrowserDownload(blob, `receipt-${donationId.slice(0, 8)}.pdf`);
    } catch (e) {
      setGivingError(formatApiError(e));
    } finally {
      setReceiptBusyId(null);
    }
  };

  const chartData = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { month: months[d.getMonth()], total: 0 };
    });

    donationRows.forEach(d => {
      const date = new Date(d.dateIso);
      if (isNaN(date.getTime())) return;
      const monthName = months[date.getMonth()];
      const match = last6Months.find(m => m.month === monthName);
      if (match) match.total += Number(d.amount);
    });

    return last6Months;
  }, [donationRows]);

  const activeStewardsCount = React.useMemo(() => {
    const donors = new Set(donationRows.map(d => d.donor).filter(name => name !== 'Anonymous'));
    return donors.size;
  }, [donationRows]);

  const timelineEvents = React.useMemo(() => {
    return donationRows.slice(0, 3).map((d) => ({
      id: `ev-${d.id}`,
      title: 'Donation Synchronized',
      description: `₹${d.amount} from ${d.donor} via ${d.method}`,
      timestamp: d.date,
      status: 'PROCESSED' as const
    }));
  }, [donationRows]);

  React.useEffect(() => {
    void loadDonations();
    void loadMembers();
    void loadCampaigns();
  }, [loadDonations, loadMembers, loadCampaigns, settings.financial.currency]);

  React.useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') void loadDonations();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [loadDonations]);

  const uniqueDonorCount = React.useMemo(
    () => new Set(donationRows.map((r) => r.donor)).size,
    [donationRows],
  );

  const visibleDonationRows = React.useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return donationRows;
    return donationRows.filter((row) =>
      [row.donor, row.type, row.method, row.date].some((part) =>
        part.toLowerCase().includes(q),
      ),
    );
  }, [donationRows, searchTerm]);

  const donorTimeline = React.useMemo(
    () =>
      [...donationRows]
        .sort((a, b) => +new Date(b.dateIso) - +new Date(a.dateIso))
        .slice(0, 30),
    [donationRows],
  );

  const campaignRollup = React.useMemo(() => {
    const map = new Map<string, { name: string; count: number; amount: number }>();
    donationRows.forEach((r) => {
      const key = r.type || 'General Giving';
      const cur = map.get(key) || { name: key, count: 0, amount: 0 };
      cur.count += 1;
      cur.amount += r.amount;
      map.set(key, cur);
    });
    return [...map.values()].sort((a, b) => b.amount - a.amount);
  }, [donationRows]);

  const memberCrm = React.useMemo(() => {
    const totals = new Map<string, number>();
    donationRows.forEach((r) => totals.set(r.donor, (totals.get(r.donor) || 0) + r.amount));
    return members
      .map((m) => ({ id: m.id, name: m.name, email: m.email, phone: m.phone, totalGiving: totals.get(m.name) || 0 }))
      .sort((a, b) => b.totalGiving - a.totalGiving)
      .slice(0, 40);
  }, [members, donationRows]);

  const handleCreateDonation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    const formData = new FormData(e.currentTarget);
    const amount = formData.get('amount');
    const method = formData.get('method');
    const reference = formData.get('reference');
    const date = formData.get('date');
    const donorId = formData.get('donorId');
    const campaignId = formData.get('campaignId');

    try {
      setSubmitting(true);
      setGivingError(null);
      await apiRequest('giving/donations', {
        method: 'POST',
        body: JSON.stringify({ 
          amount: Number(amount), 
          method, 
          reference, 
          date,
          donorId: donorId === 'anonymous' ? null : donorId,
          campaignId: campaignId === 'general' ? null : campaignId
        }),
      });
      setView('dashboard');
      void loadDonations();
    } catch (err: any) {
      console.error('[GivingModule] RECORD_ERROR:', err);
      setGivingError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (view === 'create') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 text-left">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView('dashboard')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Record gift</h1>
            <p className="text-sm text-slate-500 font-medium tracking-tight">Enter details to log a new gift. Accounting ledgers will be updated automatically in the background.</p>
          </div>
        </div>

         <Card className="border-none shadow-2xl rounded-[4rem] bg-white p-12">
           {givingError && (
             <div className="mb-8 rounded-2xl border border-rose-200 bg-rose-50 px-6 py-4 text-sm font-bold text-rose-800 animate-in slide-in-from-top-2">
               {givingError}
             </div>
           )}
           <form onSubmit={handleCreateDonation} className="space-y-10">
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Amount ({settings.financial.currency})</label>
                  <input name="amount" type="number" step="0.01" required className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 shadow-inner" placeholder="0.00" />
               </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Date</label>
                   <input name="date" type="date" required className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 shadow-inner" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Donor (Member)</label>
                   <div className="relative">
                      <select name="donorId" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 appearance-none shadow-inner">
                         <option value="anonymous">Anonymous / Guest</option>
                         {members.map(m => (
                           <option key={m.id} value={m.id}>{m.name}</option>
                         ))}
                      </select>
                      <User className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Allocation (Fund/Campaign)</label>
                   <div className="relative">
                      <select name="campaignId" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 appearance-none shadow-inner">
                         <option value="general">General Offering</option>
                         {campaigns.map(c => (
                           <option key={c.id} value={c.id}>{c.name}</option>
                         ))}
                      </select>
                      <Flag className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
                   </div>
                </div>
             </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Payment Method</label>
                  <select name="method" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 appearance-none shadow-inner">
                     <option value="Cash">Cash</option>
                     <option value="Online">Online / Card</option>
                     <option value="Bank Transfer">Bank Transfer</option>
                     <option value="Cheque">Cheque</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Reference / Notes</label>
                  <input name="reference" type="text" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 shadow-inner" placeholder="Txn ID or check number..." />
               </div>
            </div>

            <div className="pt-4 flex gap-4">
               <Button 
                   type="submit" 
                   disabled={submitting}
                   className="flex-1 h-16 rounded-[2rem] bg-indigo-600 text-white hover:bg-indigo-700 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/20 disabled:opacity-50"
                >
                   {submitting ? 'Recording...' : 'Save Donation'}
                </Button>
               <Button type="button" variant="ghost" className="px-8 h-16 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em]" onClick={() => setView('dashboard')}>Cancel</Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  if (selectedFund) {
    const selectedRows = donationRows.filter((row) => row.type === selectedFund);
    const selectedTotal = selectedRows.reduce((sum, row) => sum + row.amount, 0);
    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-right-8 duration-500 text-left">
        <div className="flex items-center justify-between border-b border-slate-100 pb-8">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => setSelectedFund(null)} className="rounded-full h-12 w-12 bg-slate-100 hover:bg-slate-200">
               <ArrowLeft className="w-5 h-5 text-slate-900" />
            </Button>
            <div>
               <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase leading-none">{selectedFund}</h1>
               <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Fund records from saved donations</p>
            </div>
          </div>
          <Button disabled className="h-14 px-10 rounded-2xl bg-slate-950 text-white font-black uppercase text-[10px] tracking-widest shadow-xl">
            Fund Settings Unavailable
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="lg:col-span-2 space-y-10">
              <Card className="border-none shadow-2xl rounded-[4rem] bg-white overflow-hidden">
                <CardHeader className="p-12 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/20">
                   <div className="space-y-2">
                      <CardTitle className="text-2xl font-black uppercase tracking-tight">Fund Overview</CardTitle>
                      <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Derived from recorded donations only</CardDescription>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recorded Total</p>
                      <h2 className="text-5xl font-black text-emerald-600 tracking-tighter">
                        {formatCurrencyAmount(selectedTotal, settings.financial.currency, { maximumFractionDigits: 0 })}
                      </h2>
                   </div>
                </CardHeader>
                <CardContent className="p-12">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gift Count</p>
                        <p className="mt-2 text-4xl font-black text-slate-900 tracking-tight">{selectedRows.length}</p>
                      </div>
                      <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distinct Donors</p>
                        <p className="mt-2 text-4xl font-black text-slate-900 tracking-tight">
                          {new Set(selectedRows.map((r) => r.donor)).size}
                        </p>
                      </div>
                   </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-2xl rounded-[4rem] bg-white overflow-hidden">
                 <CardHeader className="p-10 border-b border-slate-50">
                    <CardTitle className="text-xl font-black uppercase tracking-tight">Recent Donations In This Fund</CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                      {selectedRows.length === 0 && (
                        <div className="px-10 py-12 text-sm text-slate-500 font-medium">
                          No donations are currently mapped to this fund.
                        </div>
                      )}
                      {selectedRows.slice(0, 8).map((row) => (
                         <div key={row.id} className="px-10 py-8 flex items-center justify-between hover:bg-slate-50/50 group transition-colors">
                            <div className="flex items-center gap-6">
                               <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 font-black group-hover:bg-indigo-600 group-hover:text-white transition-all"><FileText size={20} /></div>
                               <div>
                                  <p className="font-black text-slate-900 uppercase tracking-tight text-base group-hover:text-indigo-600 transition-colors">{row.donor}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.method} · {row.date}</p>
                               </div>
                            </div>
                            <span className="text-xl font-black text-slate-900">
                               {formatCurrencyAmount(row.amount, settings.financial.currency, { maximumFractionDigits: 0 })}
                            </span>
                         </div>
                      ))}
                    </div>
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 text-left pb-20">
      {givingError && (
        <FeedbackBanner tone="error">{givingError}</FeedbackBanner>
      )}
       {/* Simple Action-Driven Header */}
       <ModuleHeader
        title="Giving"
        subtitle="Record gifts, thank donors, print receipts, and track campaigns."
        status="live"
        icon={CircleDollarSign}
        actions={
          <>
            <ActionButton label="Record gift" icon={PlusCircle} variant="primary" onClick={() => setView('create')} className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100/50" />
          </>
        }
      />
      <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1 w-full max-w-full overflow-x-auto">
        {[
          ['overview', 'Overview'],
          ['registry', 'All gifts'],
          ['donors', 'Donors'],
          ['campaigns', 'Campaigns'],
          ['sessions', 'Sunday & services'],
          ['receipts', 'Receipts'],
          ['settlements', 'Settlement status'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setWorkspaceTab(id as any)}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${workspaceTab === id ? 'bg-white text-indigo-600' : 'text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {workspaceTab === 'registry' && (
        <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
          <CardHeader className="p-10 border-b border-slate-50">
            <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">All gifts</CardTitle>
            <CardDescription className="text-xs uppercase tracking-widest font-bold text-slate-400">Search, filter, and download receipts for every gift</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by donor name or reference..."
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setCurrentPage(0); void loadDonations(0, registrySearch, registryMethod); } }}
                  className="pl-9 h-9 text-sm"
                />
              </div>
              <select
                value={registryMethod}
                onChange={(e) => { setRegistryMethod(e.target.value); setCurrentPage(0); void loadDonations(0, registrySearch, e.target.value); }}
                className="h-9 px-3 text-xs font-bold rounded-lg border border-slate-200 bg-white"
              >
                <option value="">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="ONLINE">Online</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
              <Button variant="outline" size="sm" onClick={() => { setRegistrySearch(''); setRegistryMethod(''); setCurrentPage(0); void loadDonations(0, '', ''); }}>
                Reset
              </Button>
            </div>
            {listLoading ? (
              <div className="py-12 text-center text-sm text-slate-400 animate-pulse">Loading donations...</div>
            ) : donationRows.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">No donations match your criteria.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px] font-black uppercase">Donor</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Amount</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Method</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Fund/Campaign</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Date</TableHead>
                        <TableHead className="text-[10px] font-black uppercase">Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-right">Receipt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {donationRows.map((row) => (
                        <TableRow key={row.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-sm font-semibold text-slate-900">{row.donor}</td>
                          <td className="px-4 py-3 text-sm font-bold text-slate-900">{formatCurrencyAmount(row.amount, settings.financial.currency, { maximumFractionDigits: 0 })}</td>
                          <td className="px-4 py-3"><Badge variant="outline" className="text-[9px] font-bold uppercase">{row.method}</Badge></td>
                          <td className="px-4 py-3 text-xs text-slate-600">{row.type}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{row.date}</td>
                          <td className="px-4 py-3"><Badge className="bg-emerald-100 text-emerald-700 text-[9px] font-bold border-none">Recorded</Badge></td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="sm" disabled={receiptBusyId === row.id} onClick={() => void downloadDonationReceipt(row.id)} title="Download PDF receipt">
                              <Download className="w-4 h-4" />
                            </Button>
                          </td>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-slate-500">
                    Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, totalCount)} of {totalCount}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => { const p = currentPage - 1; setCurrentPage(p); void loadDonations(p); }}>Previous</Button>
                    <Button variant="outline" size="sm" disabled={(currentPage + 1) * PAGE_SIZE >= totalCount} onClick={() => { const p = currentPage + 1; setCurrentPage(p); void loadDonations(p); }}>Next</Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {workspaceTab === 'donors' && (
        <DonorTimelinePanel
          donationRows={donationRows}
          currency={settings.financial.currency}
          members={members}
        />
      )}

      {workspaceTab === 'campaigns' && (
        <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
          <CardHeader className="p-10 border-b border-slate-50">
            <CardTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight">Campaigns</CardTitle>
            <CardDescription className="text-xs uppercase tracking-widest font-bold text-slate-400">How much each campaign has received</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-3">
            {campaignRollup.length === 0 ? (
              <p className="text-sm text-slate-500">No campaign-linked giving data yet.</p>
            ) : (
              campaignRollup.map((c) => (
                <div key={c.name} className="rounded-xl border border-slate-100 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{c.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400">{c.count} donations</p>
                  </div>
                  <p className="font-black text-slate-900">{formatCurrencyAmount(c.amount, settings.financial.currency, { maximumFractionDigits: 0 })}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      
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

      {workspaceTab === 'sessions' && (
        <ServiceCollectionPanel />
      )}

      {workspaceTab !== 'overview' ? null : (
      <>

      {listLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-[4rem] bg-slate-100" />
            ))}
          </div>
          <div className="h-[300px] rounded-[4rem] bg-slate-100" />
        </div>
      )}

      {!listLoading && (
      <>
      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <Card onClick={() => setSelectedFund('General Giving')} className="border-none shadow-2xl rounded-[4rem] bg-white overflow-hidden group cursor-pointer hover:translate-y-[-8px] transition-all duration-500">
           <CardContent className="p-12 space-y-10">
              <div className="flex justify-between items-center">
                 <div className="w-14 h-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center transition-all group-hover:scale-110"><CircleDollarSign size={28} /></div>
                 <Badge className="bg-emerald-100 text-emerald-700 font-black uppercase tracking-widest text-[9px] px-4 py-1.5 border-none">
                   {listLoading ? '…' : donationRows.length === 0 ? 'No gifts on file' : `${donationRows.length} recorded`}
                 </Badge>
              </div>
              <div className="space-y-2">
                 <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Total giving (loaded gifts)</p>
                 <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
                    {listLoading
                      ? '…'
                      : formatCurrencyAmount(apiTotal ?? 0, settings.financial.currency, {
                          maximumFractionDigits: 0,
                        })}
                 </h2>
              </div>
              <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recorded Donations</p>
                 <ArrowUpRight className="w-6 h-6 text-emerald-500" />
              </div>
           </CardContent>
        </Card>

        <Card className="border-none shadow-2xl rounded-[4rem] bg-white overflow-hidden group hover:translate-y-[-8px] transition-all duration-500">
           <CardContent className="p-12 space-y-10">
              <div className="flex justify-between items-center">
                 <div className="w-14 h-14 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center transition-all group-hover:scale-110"><HeartHandshake size={28} /></div>
                 <Badge className="bg-amber-100 text-amber-700 font-black uppercase tracking-widest text-[9px] px-4 py-1.5 border-none">{activeStewardsCount} Active Donors</Badge>
              </div>
              <div className="space-y-2">
                 <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Unique donors (this list)</p>
                 <h2 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">
                   {listLoading ? '…' : donationRows.length === 0 ? '—' : uniqueDonorCount}
                 </h2>
              </div>
              <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
                 <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                   {donationRows.length === 0
                     ? 'Record gifts to see donor diversity here.'
                     : 'Based on gifts in your recent history below.'}
                 </p>
              </div>
           </CardContent>
        </Card>

        <Card className="border-none shadow-2xl rounded-[4rem] bg-emerald-600 text-white overflow-hidden group transition-all duration-500 relative">
           <div className="absolute top-[-40px] right-[-40px] w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
           <CardContent className="p-12 space-y-10 relative z-10">
              <div className="flex justify-between items-center">
                 <div className="w-14 h-14 rounded-3xl bg-white/20 text-white flex items-center justify-center"><TrendingUp size={28} /></div>
                 <Badge className="bg-white/20 text-white font-black uppercase tracking-widest text-[9px] px-4 py-1.5 border-none">Campaigns</Badge>
              </div>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/60">Configured Campaigns</p>
                    <h2 className="text-6xl font-black tracking-tighter leading-none">{campaigns.length}</h2>
                 </div>
                 <p className="text-[11px] font-bold text-white/80 uppercase tracking-widest">
                   Campaign data is loaded from the campaigns API.
                 </p>
              </div>
              <div className="pt-4 flex items-center justify-between">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Open Campaign Management in Giving</p>
                 <ArrowRight className="w-6 h-6 text-white" />
              </div>
           </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8">
           <Card className="border-none shadow-2xl rounded-[4rem] bg-white overflow-hidden">
              <CardHeader className="p-12 border-b border-slate-50 flex flex-row items-center justify-between">
                 <div className="space-y-2">
                    <CardTitle className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">Giving Velocity</CardTitle>
                    <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Giving totals by month (from recorded donations)</CardDescription>
                 </div>
                 <div className="w-14 h-14 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 shadow-inner">
                    <TrendingUp size={24} />
                 </div>
              </CardHeader>
              <CardContent className="p-12">
                 <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={chartData}>
                          <defs>
                             <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={settings.branding.primaryColor} stopOpacity={0.15} />
                                <stop offset="95%" stopColor={settings.branding.primaryColor} stopOpacity={0} />
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                          <Tooltip contentStyle={{ borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: 'none' }} />
                          <Area type="monotone" dataKey="total" stroke={settings.branding.primaryColor} strokeWidth={6} fill="url(#colorRevenue)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </CardContent>
           </Card>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-10">
           <Card className="border-none shadow-2xl rounded-[4rem] bg-slate-950 text-white p-12 space-y-10 flex-1 relative overflow-hidden group">
              <div className="absolute top-[-40px] right-[-40px] w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
              <div className="relative z-10 space-y-8">
                 <div className="w-16 h-16 rounded-[2rem] bg-white/10 flex items-center justify-center text-white shadow-xl shadow-slate-900"><TrendingUp size={32} /></div>
                 <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase tracking-tight leading-none">Growth Report</h3>
                    <p className="text-slate-400 font-medium leading-relaxed">
                      This panel reflects recorded donations only. Use Finance and Change history for accountant-ready reports.
                    </p>
                 </div>
                 <Button disabled className="w-full h-16 bg-white text-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-slate-100 transition-colors border-none shadow-2xl">Export for accountant</Button>
              </div>
           </Card>
           
           <Card className="border-none shadow-2xl rounded-[4rem] bg-white overflow-hidden p-8 flex-1">
             <CardHeader className="p-4 pb-8">
               <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Recent Donation Events</CardTitle>
               <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Background processing status</CardDescription>
             </CardHeader>
             <CardContent className="p-4">
                <ActivityTimeline events={timelineEvents} />
             </CardContent>
           </Card>
        </div>
      </div>

      {/* Simplified Transactions */}
      <Card className="border-none shadow-2xl rounded-[4rem] bg-white overflow-hidden">
         <CardHeader className="p-12 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/20">
            <div className="space-y-2">
               <CardTitle className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">Recent History</CardTitle>
               <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Track every gift with complete transparency</CardDescription>
            </div>
            <div className="relative w-72">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <Input
                 placeholder="Search givers..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="h-14 pl-14 pr-6 rounded-2xl bg-white border-slate-100 shadow-sm font-black uppercase text-[10px] tracking-widest"
               />
            </div>
         </CardHeader>
         <CardContent className="p-0">
            <Table>
               <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                     <TableHead className="px-12 py-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Donor</TableHead>
                     <TableHead className="py-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Allocation Fund</TableHead>
                     <TableHead className="py-8 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">Contribution</TableHead>
                     <TableHead className="py-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Method</TableHead>
                     <TableHead className="px-12 py-8 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">Timestamp</TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {listLoading ? (
                    <TableRow className="border-slate-50">
                      <td colSpan={5} className="px-12 py-16 text-center text-slate-400 font-medium">
                        Loading donations…
                      </td>
                    </TableRow>
                  ) : visibleDonationRows.length === 0 ? (
                    <TableRow className="border-slate-50">
                      <td colSpan={5} className="px-12 py-16 text-center">
                        <div className="flex flex-col items-center gap-5 max-w-md mx-auto">
                          <p className="text-slate-500 font-medium">
                            {donationRows.length === 0 ? 'No donations recorded yet.' : 'No records match this search.'}
                          </p>
                          <Button
                            type="button"
                            onClick={() => setView('create')}
                            className="h-12 px-8 rounded-2xl bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest"
                          >
                            Record donation
                          </Button>
                        </div>
                      </td>
                    </TableRow>
                  ) : (
                    visibleDonationRows.map((give) => (
                    <TableRow key={give.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                       <td className="px-12 py-8">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs uppercase shadow-inner">{give.donor[0]}</div>
                             <span className="text-base font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{give.donor}</span>
                          </div>
                       </td>
                       <td className="py-8">
                          <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5">{give.type}</Badge>
                       </td>
                       <td className="py-8 text-right font-black text-slate-900 text-xl tracking-tighter">
                         {formatCurrencyAmount(give.amount, settings.financial.currency, { maximumFractionDigits: 0 })}
                       </td>
                       <td className="py-8">
                          <div className="flex items-center gap-2 text-slate-400">
                             {give.method === 'Online' ? <CreditCard size={16} /> : <Banknote size={16} />}
                             <span className="text-[10px] font-black uppercase tracking-widest">{give.method}</span>
                          </div>
                       </td>
                       <td className="px-12 py-8 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">{give.date}</td>
                    </TableRow>
                  ))
                  )}
               </TableBody>
            </Table>
            <div className="p-12 text-center border-t border-slate-50">
               <Button disabled variant="ghost" className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400">
                  <History className="mr-2 w-4 h-4" /> Full giving history export coming soon
               </Button>
            </div>
         </CardContent>
      </Card>
      </>
      )}
      </>
      )}
    </div>
  );
}

function GivingSettlementStatusPanel({ onOpenFinance }: { onOpenFinance: () => void }) {
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
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-2xl font-bold">{dash.unmatchedDonations}</p><p className="text-xs font-semibold">Need matching</p></div>
            <div className="rounded-xl bg-indigo-50 p-4"><p className="text-2xl font-bold">{dash.recentSettlements?.length ?? 0}</p><p className="text-xs font-semibold text-indigo-800">Recent batches</p></div>
          </div>
        )}
        <Button onClick={onOpenFinance}>Manage settlements in Finance</Button>
      </CardContent>
    </Card>
  );
}

function ServiceCollectionPanel() {
  const [sessions, setSessions] = React.useState<any[]>([]);
  const [name, setName] = React.useState('Sunday 9AM Service');
  const load = React.useCallback(async () => {
    const res = await apiRequest('giving/service-sessions');
    setSessions(parseApiResponse<any[]>(res) || []);
  }, []);
  React.useEffect(() => { void load(); }, [load]);
  const create = async () => {
    await apiRequest('giving/service-sessions', { method: 'POST', body: { name, serviceDate: new Date().toISOString() } });
    void load();
  };
  return (
    <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
      <CardHeader className="p-8"><CardTitle className="text-xl font-bold">Sunday & service collections</CardTitle></CardHeader>
      <CardContent className="p-8 space-y-4">
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} className="flex-1" />
          <Button onClick={() => void create()}>Open session</Button>
        </div>
        {sessions.map((s) => (
          <div key={s.id} className="rounded-xl border p-4 flex justify-between items-center">
            <div><p className="font-bold">{s.name}</p><p className="text-xs text-slate-500">{new Date(s.serviceDate).toLocaleString()}</p></div>
            <p className="text-sm font-bold">{s.donations?.length ?? 0} gifts</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DonorTimelinePanel({ donationRows, currency, members }: { donationRows: GiveRow[]; currency: string; members: MemberDto[] }) {
  const [selectedDonor, setSelectedDonor] = React.useState<string | null>(null);
  const donorSummaries = React.useMemo(() => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    donationRows.forEach((r) => {
      const cur = map.get(r.donor) || { name: r.donor, total: 0, count: 0 };
      cur.total += r.amount;
      cur.count += 1;
      map.set(r.donor, cur);
    });
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [donationRows]);

  if (selectedDonor) {
    const gifts = donationRows.filter((r) => r.donor === selectedDonor);
    const member = members.find((m) => m.name === selectedDonor);
    return (
      <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
        <CardHeader className="p-8">
          <button type="button" onClick={() => setSelectedDonor(null)} className="text-sm text-indigo-600 font-semibold mb-2">← All donors</button>
          <CardTitle className="text-xl font-bold">{selectedDonor}</CardTitle>
          <CardDescription>{member?.email || member?.phone || 'Donor profile'}</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-2">
          {gifts.map((g) => (
            <div key={g.id} className="flex justify-between border-b border-slate-50 py-2 text-sm">
              <span>{g.type} · {g.date}</span>
              <span className="font-bold">{formatCurrencyAmount(g.amount, currency, { maximumFractionDigits: 0 })}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
      <CardHeader className="p-8"><CardTitle className="text-xl font-bold">Donors</CardTitle></CardHeader>
      <CardContent className="p-8 space-y-2">
        {donorSummaries.length === 0 ? (
          <p className="text-sm text-slate-500">No donors yet.</p>
        ) : (
          donorSummaries.map((d) => (
            <button key={d.name} type="button" onClick={() => setSelectedDonor(d.name)} className="w-full rounded-xl border border-slate-100 px-4 py-3 flex justify-between hover:bg-slate-50 text-left">
              <span className="font-semibold">{d.name}</span>
              <span className="font-bold">{formatCurrencyAmount(d.total, currency, { maximumFractionDigits: 0 })}</span>
            </button>
          ))
        )}
      </CardContent>
    </Card>
  );
}

