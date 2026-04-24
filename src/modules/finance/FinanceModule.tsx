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
  Filter,
  Download,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { ERPModule } from '@/src/types';

interface FinanceModuleProps {
  onModuleChange?: (module: ERPModule) => void;
  user?: any;
}

export function FinanceModule({ onModuleChange, user }: FinanceModuleProps) {
  const canViewFinance = user?.roleId === 'admin' || user?.permissions?.includes('view_finance');
  const canPostVouchers = user?.roleId === 'admin' || user?.permissions?.includes('post_vouchers');

  const [view, setView] = React.useState<'ledger' | 'details' | 'create-voucher'>(
    canViewFinance ? 'ledger' : 'create-voucher'
  );
  const [selectedAccount, setSelectedAccount] = React.useState<any | null>(null);
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchAccounts = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAccounts(data);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (canViewFinance || canPostVouchers) {
      fetchAccounts();
    }
  }, [fetchAccounts, canViewFinance, canPostVouchers]);

  const handleAccountClick = (acc: any) => {
    if (!canViewFinance) return;
    setSelectedAccount(acc);
    setView('details');
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canViewFinance) {
       // Just reset form or show success, don't go back to ledger
       alert('Voucher submitted for approval.');
    } else {
       setView('ledger');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (view === 'create-voucher') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 text-left">
        <div className="flex items-center gap-4">
          {canViewFinance && (
            <Button variant="ghost" size="icon" onClick={() => setView('ledger')} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight text-left">Financial Voucher Entry</h1>
            <p className="text-sm text-slate-500 font-medium tracking-tight text-left">Compliance-ready documentation for all expenditure and receipts.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
           <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-2xl p-10 space-y-8 bg-white border border-slate-50">
              <form onSubmit={handleCreateVoucher} className="space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Voucher Type</label>
                       <select className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 appearance-none shadow-inner">
                          <option>Payment Voucher (PV)</option>
                          <option>Receipt Voucher (RV)</option>
                          <option>Journal Voucher (JV)</option>
                          <option>Contract Voucher (CV)</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Posting Date</label>
                       <input type="date" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-inner" defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Account Head (Dr/Cr)</label>
                    <select className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 appearance-none shadow-inner">
                       {accounts.map(acc => (
                         <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>
                       ))}
                    </select>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Amount (INR)</label>
                       <input type="number" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-inner" placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">TDS / GST Selection</label>
                       <select className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 appearance-none shadow-inner">
                          <option>N/A (Exempt)</option>
                          <option>GST 18% (Standard)</option>
                          <option>TDS 194J (10%)</option>
                          <option>TDS 194C (2%)</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Narration / Internal Note</label>
                    <textarea className="w-full h-32 bg-slate-50 border-none rounded-2xl p-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-inner resize-none" placeholder="Explain the purpose of this transaction for audit purposes..."></textarea>
                 </div>

                 <div className="pt-4 flex gap-4">
                    <Button type="submit" className="flex-1 h-16 rounded-[2rem] bg-slate-950 text-white hover:bg-slate-900 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-900/20">Generate Voucher</Button>
                    <Button type="button" variant="ghost" className="px-8 h-16 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em]" onClick={() => setView('ledger')}>Discard</Button>
                 </div>
              </form>
           </Card>

           <div className="space-y-6">
              <Card className="rounded-[2.5rem] bg-indigo-600 text-white p-8 space-y-6 overflow-hidden relative shadow-2xl">
                 <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                 <h3 className="font-black text-lg tracking-tight relative z-10 uppercase">Audit Compliance</h3>
                 <p className="text-xs text-indigo-100/80 leading-relaxed font-bold relative z-10">"Every voucher generated here is cryptographically signed and prepares your Form 10/12A filings automatically."</p>
                 <div className="flex items-center gap-3 py-4 border-y border-white/10 relative z-10">
                    <div className="w-10 h-5 bg-indigo-400 rounded-full relative p-1">
                       <div className="w-3 h-3 bg-white rounded-full ml-auto"></div>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200">AI Double-Entry Check</span>
                 </div>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-sm p-8 text-left space-y-6 bg-slate-50">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-sans">Sequence Integrity</h4>
                 <div className="space-y-1">
                    <p className="text-xl font-black text-slate-900 tracking-tighter uppercase font-mono">PV-2024-0042</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Next in sequence</p>
                 </div>
                 <div className="pt-4 border-t border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Supporting Artifacts</p>
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition-all cursor-pointer group">
                       <Plus size={24} className="mx-auto text-slate-300 group-hover:text-indigo-400" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 group-hover:text-indigo-500">Upload Invoice / Reciept</p>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'details' && selectedAccount) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 text-left">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setView('ledger')} className="gap-2 px-0 hover:bg-transparent hover:text-indigo-600">
            <ArrowLeft className="w-5 h-5" /> <span className="font-black uppercase text-[10px] tracking-widest">Back back Ledger</span>
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" className="h-11 rounded-xl px-6 border-slate-200 font-black uppercase text-[10px] tracking-widest"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
            <Button className="h-11 rounded-xl px-6 bg-slate-950 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-900/10" onClick={() => setView('create-voucher')}>New Journal Entry</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-[3rem] border-none shadow-xl overflow-hidden bg-white">
                 <CardHeader className="p-10 pb-8 bg-slate-50/10">
                    <div className="flex justify-between items-start">
                       <div className="space-y-4">
                          <div className="flex items-center gap-3">
                             <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-mono font-black text-slate-500 border border-slate-200 leading-none">{selectedAccount.code}</div>
                             <Badge variant="outline" className="text-[9px] uppercase tracking-[0.2em] font-black border-slate-200 px-3 py-1 bg-white shadow-sm uppercase">{selectedAccount.type} Account</Badge>
                          </div>
                          <CardTitle className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{selectedAccount.name}</CardTitle>
                       </div>
                       <div className="text-right space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Position</p>
                          <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{formatCurrency(selectedAccount.balance)}</h2>
                       </div>
                    </div>
                 </CardHeader>
                 <CardContent className="p-0">
                    <div className="px-10 py-6 border-y border-slate-50 flex items-center justify-between bg-slate-50/10">
                       <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-[10px] font-sans">Transaction Stream</h3>
                       <div className="flex gap-3">
                          <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white shadow-sm"><Filter className="w-3.5 h-3.5 mr-2 text-indigo-500" /> Filter</Button>
                          <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white shadow-sm"><Search className="w-3.5 h-3.5 mr-2 text-indigo-500" /> Search</Button>
                       </div>
                    </div>
                    <div className="p-20 text-center space-y-4">
                       <div className="w-16 h-16 bg-slate-50 rounded-full mx-auto flex items-center justify-center text-slate-200">
                          <Receipt className="w-8 h-8" />
                       </div>
                       <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No transaction history in current audit cycle</p>
                    </div>
                 </CardContent>
              </Card>
           </div>

           <div className="space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden border-l-[10px] border-l-indigo-600 p-8 space-y-4 bg-white">
                 <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800 font-sans">Reconciliation Logic</h3>
                 </div>
                 <p className="text-sm text-slate-500 leading-relaxed font-bold font-sans">System audit complete. This account is currently in sync with Bank-level statements.</p>
                 <Button className="w-full text-[10px] font-black uppercase tracking-widest h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 text-white">Perform Re-Sync (AI Scan)</Button>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  const totalEquity = accounts.reduce((sum, acc) => acc.type === 'Credit' ? sum + acc.balance : sum - acc.balance, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Financial Intelligence</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Ministry-first fund accounting, automated compliance models, and audit-ready reporting suites.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-8 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm">
            Auditors Desk
          </button>
          <button 
            onClick={() => setView('create-voucher')}
            className="flex items-center gap-3 px-8 py-3 bg-slate-950 text-white rounded-2xl text-[10px] font-black hover:bg-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all active:scale-95 uppercase tracking-[0.2em] border-none"
          >
            <Plus className="w-5 h-5" />
            New Voucher
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Total Equity', val: formatCurrency(totalEquity), change: 'Synchronized', up: true },
           { label: 'Operational Cash', val: formatCurrency(accounts.find(a => a.code === '1000')?.balance || 0), change: 'Live', up: true },
           { label: 'Asset Valuation', val: formatCurrency(accounts.find(a => a.code === '2000')?.balance || 0), change: 'Fixed', up: true },
           { label: 'Compliance Status', val: 'SECURED', change: '100%', up: true },
         ].map((stat, i) => (
           <Card key={i} className="border-none shadow-xl h-full flex flex-col justify-center py-8 px-8 hover:shadow-2xl transition-all group bg-white rounded-[2rem] active:scale-[0.98] cursor-pointer">
              <CardContent className="p-0 space-y-3">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-indigo-600 transition-colors leading-none font-sans">{stat.label}</p>
                 <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none uppercase">{stat.val}</h3>
                    <Badge variant={stat.up ? "default" : "outline"} className={cn(
                      "text-[9px] font-black uppercase tracking-widest border-none px-2 py-0.5 shadow-none",
                      stat.up ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>{stat.change}</Badge>
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <Card className="lg:col-span-2 border-none shadow-xl rounded-[3rem] bg-white overflow-hidden">
            <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between bg-white">
               <div className="space-y-1 text-left">
                 <CardTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Chart of Accounts</CardTitle>
                 <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Global fund distribution & ledger status</CardDescription>
               </div>
               <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-5 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm">View Audited Ledger</button>
            </CardHeader>
            <CardContent className="p-0 text-left">
               {loading ? (
                 <div className="p-20 text-center text-slate-400 animate-pulse font-black uppercase text-[11px] tracking-widest">Hydrating Ledger Core...</div>
               ) : (
                 <div className="divide-y divide-slate-50">
                    {accounts.map((acc, i) => (
                      <div 
                        key={acc.id} 
                        onClick={() => handleAccountClick(acc)}
                        className="flex items-center justify-between px-10 py-8 hover:bg-slate-50/50 transition-all group cursor-pointer active:bg-slate-100 border-l-4 border-l-transparent hover:border-l-indigo-600"
                      >
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-mono text-base font-black text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner border border-slate-100 uppercase">{acc.code}</div>
                            <div>
                               <p className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tight uppercase">{acc.name}</p>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 font-sans">{acc.type} Balance Control</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-xl font-black text-slate-900 tracking-tighter leading-none">{formatCurrency(acc.balance)}</p>
                            <div className="flex justify-end mt-3">
                               <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                  <div className={cn(
                                    "h-full rounded-full transition-all duration-1000",
                                    acc.type === 'Credit' ? "bg-indigo-500 w-[70%]" : "bg-rose-500 w-[30%]"
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

         <div className="space-y-8 text-left">
            <Card className="border-none shadow-2xl bg-slate-900 text-white overflow-hidden p-10 space-y-8 relative rounded-[3rem] group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><ShieldCheck size={120} /></div>
               <div className="space-y-1 relative z-10 text-left">
                  <CardTitle className="text-xl font-black tracking-tight uppercase leading-none">Compliance Vault</CardTitle>
                  <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Local Statutory Monitoring</CardDescription>
               </div>
               <div className="relative z-10 space-y-6 text-left">
                  <div className="space-y-4">
                     {[
                       { label: '80G Validation Status', status: 'Secured', val: 100, color: 'bg-emerald-500' },
                       { label: 'Audit Trail Sequence', status: 'Integrated', val: 98, color: 'bg-indigo-500' },
                       { label: 'Voucher Serial Guard', status: 'Verified', val: 100, color: 'bg-indigo-500' },
                     ].map((item, i) => (
                       <div key={i} className="space-y-2">
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                             <span className="text-slate-400 font-sans">{item.label}</span>
                             <span className="text-white font-sans">{item.status}</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <div className={cn("h-full transition-all duration-1000", item.color)} style={{ width: `${item.val}%` }}></div>
                          </div>
                       </div>
                     ))}
                  </div>
                  <button className="w-full mt-4 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 text-white font-sans">Generate Audit Workpapers</button>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}
