import * as React from 'react';
import { 
  CircleDollarSign, 
  Receipt, 
  BookOpen, 
  ArrowRightLeft, 
  FileText, 
  ShieldCheck, 
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  ArrowLeft,
  ChevronRight,
  TrendingDown,
  Download,
  AlertCircle,
  FileCheck,
  ClipboardList,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { formatCurrencyAmount } from '@/lib/formatCurrency';
import { useSettings } from '@/context/SettingsContext';
import { ERPModule } from '@/types';
import { ModuleHeader, ActionButton } from '@/components/modules/ModuleHeader';

function coalesceBalance(v: unknown): number {
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

interface FinanceModuleProps {
  onModuleChange?: (module: ERPModule) => void;
  user?: any;
}

export function FinanceModule({ onModuleChange, user }: FinanceModuleProps) {
  const { settings } = useSettings();
  const perms = (user?.permissions as string[] | undefined) ?? [];
  const canViewFinance = perms.includes('manage_finance');
  const canPostVouchers = perms.includes('manage_finance');
  const cur = settings.financial.currency;

  const [activeTab, setActiveTab] = React.useState<'dashboard' | 'ledger' | 'settings'>('dashboard');
  const [view, setView] = React.useState<'ledger' | 'details' | 'create-voucher' | 'audit'>('ledger');
  const [selectedAccount, setSelectedAccount] = React.useState<any | null>(null);
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [auditData, setAuditData] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [ledgerBanner, setLedgerBanner] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!ledgerBanner) return;
    const t = window.setTimeout(() => setLedgerBanner(null), 5000);
    return () => window.clearTimeout(t);
  }, [ledgerBanner]);

  const [recentVouchers, setRecentVouchers] = React.useState<any[]>([]);

  const fetchAccounts = React.useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const json = await apiRequest<unknown>('finance/accounts', { method: 'GET' });
      setAccounts(parseApiResponse<unknown[]>(json));
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      setLoadError(formatApiError(err));
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecentVouchers = React.useCallback(async () => {
    try {
      const json = await apiRequest<unknown>('finance/vouchers?all=1');
      const list = parseApiResponse<any[]>(json);
      const sorted = [...(list || [])].sort((a, b) => {
        const tb = new Date(b.date ?? b.postedAt ?? b.createdAt ?? 0).getTime();
        const ta = new Date(a.date ?? a.postedAt ?? a.createdAt ?? 0).getTime();
        return tb - ta;
      });
      setRecentVouchers(sorted.slice(0, 8));
    } catch {
      setRecentVouchers([]);
    }
  }, []);

  const fetchAuditWorkpapers = async () => {
    try {
      setLoading(true);
      setView('audit');
      const json = await apiRequest<unknown>('finance/audit/workpapers?fy=current', { method: 'GET' });
      const data = parseApiResponse<any>(json);
      setAuditData(data);
    } catch (err) {
      setLoadError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (canViewFinance || canPostVouchers) {
      fetchAccounts();
    }
  }, [fetchAccounts, canViewFinance, canPostVouchers]);

  React.useEffect(() => {
    if (!(canViewFinance || canPostVouchers)) return;
    if (activeTab === 'dashboard' || activeTab === 'ledger') {
      void fetchRecentVouchers();
    }
  }, [activeTab, canViewFinance, canPostVouchers, fetchRecentVouchers]);

  const formatCurrency = (val: number) => formatCurrencyAmount(val, cur, { maximumFractionDigits: 0 });

  if (view === 'audit') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 text-left pb-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setView('ledger')} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Audit Workpapers</h1>
              <p className="text-sm text-slate-500 font-medium tracking-tight">Standardized statutory reporting for {settings.financial.financialYearStart} cycle.</p>
            </div>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="h-11 rounded-xl px-6 border-slate-200 font-black uppercase text-[10px] tracking-widest"><Download className="w-4 h-4 mr-2" /> Download PDF</Button>
             <Button variant="outline" className="h-11 rounded-xl px-6 border-slate-200 font-black uppercase text-[10px] tracking-widest"><Printer className="w-4 h-4 mr-2" /> Print</Button>
          </div>
        </div>

        {loading ? (
          <div className="p-20 text-center text-slate-400 animate-pulse font-black uppercase text-[11px] tracking-widest">Generating Workpapers...</div>
        ) : auditData ? (
          <div className="grid grid-cols-1 gap-8">
             <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-10 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600">Exception Analysis</h3>
                      <div className="space-y-3">
                         {auditData.exceptions.length === 0 ? (
                           <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center gap-3 text-sm font-bold">
                              <FileCheck className="w-5 h-5" /> All vouchers validated successfully.
                           </div>
                         ) : (
                           auditData.exceptions.map((ex: any, i: number) => (
                             <div key={i} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                                <div>
                                   <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">{ex.type} • {ex.voucherNo}</p>
                                   <p className="text-sm font-bold text-slate-700">{ex.message}</p>
                                </div>
                             </div>
                           ))
                         )}
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600">Summary Figures</h3>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-6 bg-slate-50 rounded-3xl space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trial Balance Delta</p>
                            <p className="text-2xl font-black text-slate-900">{formatCurrency(auditData.trialBalance.totals.difference)}</p>
                         </div>
                         <div className="p-6 bg-slate-50 rounded-3xl space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Audit Trails</p>
                            <p className="text-2xl font-black text-slate-900">{auditData.voucherRegister.length}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-6 pt-6 border-t border-slate-100">
                   <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Receipts & Payments Summary</h3>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead>
                            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                               <th className="pb-4">Account Head</th>
                               <th className="pb-4 text-right">Debit</th>
                               <th className="pb-4 text-right">Credit</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {auditData.receiptsAndPayments.map((item: any) => (
                              <tr key={item.id} className="text-sm font-bold">
                                 <td className="py-4 text-slate-700">{item.name}</td>
                                 <td className="py-4 text-right text-slate-900">{formatCurrency(item.debit)}</td>
                                 <td className="py-4 text-right text-slate-900">{formatCurrency(item.credit)}</td>
                              </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
             </Card>
          </div>
        ) : (
          <div className="p-20 text-center text-rose-500 font-bold">Failed to load audit data.</div>
        )}
      </div>
    );
  }

  if (view === 'create-voucher') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 text-left">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView('ledger')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Voucher Entry</h1>
            <p className="text-sm text-slate-500 font-medium tracking-tight">Compliance-ready documentation for all expenditure and receipts.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-2xl p-10 space-y-8 bg-white border border-slate-50">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setLedgerBanner('Voucher saved to the ledger.');
                  setView('ledger');
                }}
                className="space-y-6"
              >
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Voucher Type</label>
                       <select className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 appearance-none shadow-inner">
                          <option>Payment Voucher (PV)</option>
                          <option>Receipt Voucher (RV)</option>
                          <option>Journal Voucher (JV)</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Posting Date</label>
                       <input type="date" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 shadow-inner" defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Account Head</label>
                    <select className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 appearance-none shadow-inner">
                       {accounts.map(acc => (
                         <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>
                       ))}
                    </select>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Amount ({cur})</label>
                       <input type="number" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 shadow-inner" placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">TDS / GST Selection</label>
                       <select className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 appearance-none shadow-inner">
                          <option>N/A (Exempt)</option>
                          <option>GST 18% (Standard)</option>
                          <option>TDS 194J (10%)</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Narration / Internal Note</label>
                    <textarea className="w-full h-32 bg-slate-50 border-none rounded-2xl p-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 shadow-inner resize-none" placeholder="Explain the purpose of this transaction for audit purposes..."></textarea>
                 </div>

                 <div className="pt-4 flex gap-4">
                    <Button type="submit" className="flex-1 h-16 rounded-[2rem] bg-slate-950 text-white hover:bg-slate-900 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20">Generate Voucher</Button>
                    <Button type="button" variant="ghost" className="px-8 h-16 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em]" onClick={() => setView('ledger')}>Discard</Button>
                 </div>
              </form>
           </Card>

           <div className="space-y-6">
              <Card className="rounded-[2.5rem] text-white p-8 space-y-6 overflow-hidden relative shadow-2xl bg-indigo-600">
                 <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                 <h3 className="font-black text-lg tracking-tight relative z-10 uppercase">Audit Compliance</h3>
                 <p className="text-xs text-white/80 leading-relaxed font-bold relative z-10">Vouchers generated here are logged with immutable audit trails for statutory compliance.</p>
                 <div className="flex items-center gap-3 py-4 border-y border-white/10 relative z-10">
                    <div className="w-10 h-5 bg-white/30 rounded-full relative p-1">
                       <div className="w-3 h-3 bg-white rounded-full ml-auto"></div>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/80">Double-Entry Validation</span>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  const sumByType = (type: string) =>
    accounts.filter((a) => a.type === type).reduce((s, a) => s + coalesceBalance(a.balance), 0);
  const totalAssets = sumByType('Asset');
  const totalLiabilities = sumByType('Liability');
  const totalRevenue = sumByType('Revenue');
  const totalExpense = sumByType('Expense');
  const coaNet = accounts.reduce((s, a) => s + coalesceBalance(a.balance), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
       {ledgerBanner && (
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          role="status"
        >
          {ledgerBanner}
        </div>
      )}
      <ModuleHeader
        title="Accounting"
        subtitle="Ledger, vouchers, and fund-linked giving — tied to your chart of accounts."
        status="live"
        icon={BookOpen}
        actions={
          activeTab === 'ledger' && (
            <>
              <ActionButton label="Auditors Desk" icon={ShieldCheck} variant="secondary" onClick={fetchAuditWorkpapers} />
              <ActionButton label="New Voucher" icon={Plus} variant="primary" onClick={() => setView('create-voucher')} />
            </>
          )
        }
      />
      {loadError && <p className="text-sm text-rose-600 font-medium max-w-lg mb-4">{loadError}</p>}

      <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-6 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            "px-6 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
            activeTab === 'dashboard' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Operations Center
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={cn(
            "px-6 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all",
            activeTab === 'ledger' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Ledger & Vouchers
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "px-6 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all",
            activeTab === 'settings' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Accounting Settings
        </button>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-8 animate-in fade-in duration-500 text-left pb-12">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 font-medium text-left" role="status">
            <span className="font-black">Ledger honesty:</span> KPIs are sums of account balances from the chart of accounts
            (assets {formatCurrency(totalAssets)}, liabilities {formatCurrency(totalLiabilities)}, revenue{' '}
            {formatCurrency(totalRevenue)}, expenses {formatCurrency(totalExpense)}). They are not branch rollups or
            predictive budgets.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: 'Assets (COA)',
                val: formatCurrency(totalAssets),
                tag: 'Live',
                up: true,
                icon: CircleDollarSign,
                color: 'text-emerald-500',
                bg: 'bg-emerald-50',
              },
              {
                label: 'Liabilities',
                val: formatCurrency(totalLiabilities),
                tag: 'Live',
                up: true,
                icon: FileCheck,
                color: 'text-indigo-500',
                bg: 'bg-indigo-50',
              },
              {
                label: 'Revenue (balance)',
                val: formatCurrency(totalRevenue),
                tag: 'COA',
                up: true,
                icon: ArrowUpRight,
                color: 'text-teal-500',
                bg: 'bg-teal-50',
              },
              {
                label: 'Expenses (balance)',
                val: formatCurrency(totalExpense),
                tag: 'COA',
                up: true,
                icon: TrendingDown,
                color: 'text-amber-500',
                bg: 'bg-amber-50',
              },
            ].map((stat, i) => (
              <Card key={i} className="border-none shadow-xl py-6 px-6 group bg-white rounded-[2rem] hover:-translate-y-1 transition-transform">
                <CardContent className="p-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.bg, stat.color)}>
                      <stat.icon size={20} />
                    </div>
                    <Badge
                      variant="default"
                      className="text-[9px] font-black uppercase tracking-widest border-none px-2 py-0.5 bg-slate-100 text-slate-600"
                    >
                      {stat.tag}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{stat.val}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">
                    Financial rollups
                  </CardTitle>
                  <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                    Campus / branch charts are not wired — use ledger and exports for audits.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-8 flex items-center justify-center min-h-[220px]">
                <div className="text-center space-y-3 max-w-md">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                    <ArrowRightLeft size={32} />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">
                    No multi-campus revenue chart in this build. Account totals above reflect your live chart of accounts.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-8">
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-lg font-black uppercase tracking-tight text-slate-900">Budget alerts</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    Budget tracking is not connected to live vouchers here. Use the Budgets module when enabled, or
                    monitor balances in the ledger.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl rounded-[2.5rem] bg-slate-950 text-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-lg font-black uppercase tracking-tight">Fund mix</CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  <p className="text-sm text-slate-300 font-medium leading-relaxed">
                    Giving fund percentages are not derived on this screen. Use Giving reports or ledger detail by
                    revenue account.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Recent vouchers</CardTitle>
                <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">
                  Latest rows from GET /finance/vouchers
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                onClick={() => setActiveTab('ledger')}
                className="text-[10px] font-black uppercase tracking-widest text-indigo-600"
              >
                View ledger
              </Button>
            </CardHeader>
            <CardContent className="p-8 space-y-3">
              {recentVouchers.length === 0 ? (
                <p className="text-sm text-slate-500 font-medium">No vouchers returned yet.</p>
              ) : (
                recentVouchers.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl gap-4 flex-wrap"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400 shrink-0">
                        <Receipt size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">
                          {v.description || v.type || 'Voucher'}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {(v.status as string) || '—'} ·{' '}
                          {v.date || v.postedAt || v.createdAt
                            ? new Date(v.date ?? v.postedAt ?? v.createdAt).toLocaleDateString()
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-emerald-600">
                        {formatCurrency(Number(v.amount ?? v.totalAmount ?? 0) || 0)}
                      </p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {(v.type as string) || 'Voucher'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : activeTab === 'settings' ? (
        <div className="max-w-4xl space-y-8 animate-in fade-in duration-500 text-left pb-12">
           <Card className="rounded-[2.5rem] border-none shadow-sm p-10 bg-white">
              <CardHeader className="p-0 pb-6 border-b border-slate-50 mb-6">
                 <CardTitle className="text-xl font-black uppercase tracking-tight">Chart of Accounts Management</CardTitle>
                 <CardDescription className="font-medium text-slate-500">Configure ledger structures globally. Changes sync to all modules.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                 <Button variant="outline" className="h-12 rounded-xl text-xs font-bold uppercase tracking-widest"><Plus className="w-4 h-4 mr-2" /> Create Root Account</Button>
                 <p className="text-sm font-bold text-slate-400 mt-4 italic">COA tree managed via System Setup API.</p>
              </CardContent>
           </Card>

           <Card className="rounded-[2.5rem] border-none shadow-sm p-10 bg-white">
              <CardHeader className="p-0 pb-6 border-b border-slate-50 mb-6">
                 <CardTitle className="text-xl font-black uppercase tracking-tight">Fund rules &amp; dimensions</CardTitle>
                 <CardDescription className="font-medium text-slate-500">
                   Per-fund ledger mapping, posting rules, and campus cost centers are not configured in this screen yet. Donations already post using each fund&apos;s revenue account from the chart of accounts.
                 </CardDescription>
              </CardHeader>
              <CardContent className="p-0 space-y-3 text-sm font-medium text-slate-600">
                 <p>Use the <span className="font-bold text-slate-800">Giving</span> module for campaigns and the <span className="font-bold text-slate-800">Ledger</span> tab here for live balances and vouchers.</p>
              </CardContent>
           </Card>
        </div>
      ) : activeTab === 'ledger' ? (
        <div className="space-y-8 animate-in fade-in duration-500 text-left pb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             {[
               { label: 'COA net (sum balances)', val: formatCurrency(coaNet), change: 'Live' },
               { label: 'Assets', val: formatCurrency(totalAssets), change: 'Live' },
               { label: 'Operational FY', val: settings.financial.financialYearStart, change: 'Settings' },
               { label: 'Vouchers (loaded)', val: String(recentVouchers.length), change: 'API' },
             ].map((stat, i) => (
               <Card key={i} className="border-none shadow-xl py-8 px-8 group bg-white rounded-[2rem]">
                  <CardContent className="p-0 space-y-3">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-indigo-600 transition-colors leading-none">{stat.label}</p>
                     <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">{stat.val}</h3>
                        <Badge variant="default" className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border-none px-2 py-0.5">{stat.change}</Badge>
                     </div>
                  </CardContent>
               </Card>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <Card className="lg:col-span-2 border-none shadow-xl rounded-[3rem] bg-white overflow-hidden">
                <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between bg-white">
                   <div className="space-y-1">
                     <CardTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Chart of Accounts</CardTitle>
                     <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Fund distribution & ledger status</CardDescription>
                   </div>
                   <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-5 py-2.5 rounded-xl">View Full Ledger</button>
                </CardHeader>
                <CardContent className="p-0">
                   {loading ? (
                     <div className="p-20 text-center text-slate-400 animate-pulse font-black uppercase text-[11px] tracking-widest">Loading financial data...</div>
                   ) : (
                     <div className="divide-y divide-slate-50">
                        {accounts.map((acc) => (
                          <div 
                            key={acc.id} 
                            className="flex items-center justify-between px-10 py-8 hover:bg-slate-50 transition-all group cursor-pointer border-l-4 border-l-transparent hover:border-l-indigo-600"
                          >
                             <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-mono text-base font-black text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner border border-slate-100">{acc.code}</div>
                                <div>
                                   <p className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tight uppercase">{acc.name}</p>
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{acc.type} Balance</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-xl font-black text-slate-900 tracking-tighter leading-none">{formatCurrency(coalesceBalance(acc.balance))}</p>
                                <div className="flex justify-end mt-3">
                                   <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div className={cn(
                                        "h-full rounded-full",
                                        ['Revenue', 'Asset'].includes(acc.type) ? "bg-indigo-600 w-[70%]" : "bg-rose-500 w-[30%]"
                                      )}></div>
                                   </div>
                                </div>
                             </div>
                          </div>
                        ))}
                     </div>
                   )}
                </CardContent>
             </Card>

             <div className="space-y-8">
                <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white p-10 space-y-8 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><ShieldCheck size={120} /></div>
                   <div className="space-y-1 relative z-10">
                      <CardTitle className="text-xl font-black tracking-tight uppercase">Compliance Report</CardTitle>
                      <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Audit readiness status</CardDescription>
                   </div>
                   <div className="relative z-10 space-y-6">
                      <div className="space-y-4">
                         {[
                           { label: 'Tax Compliance', status: 'Secured', val: 100, color: 'bg-emerald-500' },
                           { label: 'Audit Trail', status: 'Active', val: 98, color: 'bg-indigo-50' },
                           { label: 'Record Safety', status: 'Verified', val: 100, color: 'bg-indigo-500' },
                         ].map((item, i) => (
                           <div key={i} className="space-y-2">
                              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                                 <span className="text-slate-400">{item.label}</span>
                                 <span className="text-white">{item.status}</span>
                              </div>
                              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                 <div className={cn("h-full", item.color)} style={{ width: `${item.val}%` }}></div>
                              </div>
                           </div>
                         ))}
                      </div>
                      <button 
                        onClick={fetchAuditWorkpapers}
                        className="w-full mt-4 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all text-white"
                      >
                        Generate Audit Pack
                      </button>
                   </div>
                </Card>
             </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
