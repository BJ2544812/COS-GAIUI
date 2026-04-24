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
}

export function FinanceModule({ onModuleChange }: FinanceModuleProps) {
  const [view, setView] = React.useState<'ledger' | 'details' | 'create-voucher'>('ledger');
  const [selectedAccount, setSelectedAccount] = React.useState<{ code: string, name: string, balance: string, type: string } | null>(null);

  const handleAccountClick = (acc: typeof selectedAccount) => {
    setSelectedAccount(acc);
    setView('details');
  };

  if (view === 'create-voucher') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500 text-left">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView('ledger')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
                 <h1 className="text-4xl font-black text-slate-900 tracking-tight">Financial Voucher Entry</h1>
            <p className="text-sm text-slate-500 font-medium tracking-tight">Compliance-ready documentation for all expenditure and receipts.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-2xl p-10 space-y-8 bg-white border border-slate-50">
              <div className="space-y-6">
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
                       <input type="date" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-inner" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Account Head (Dr/Cr)</label>
                    <input type="text" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-inner" placeholder="Search chart of accounts..." />
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
              </div>

              <div className="pt-4 flex gap-4">
                 <Button className="flex-1 h-16 rounded-[2rem] bg-slate-950 text-white hover:bg-slate-900 text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-900/20" onClick={() => setView('ledger')}>Generate Voucher</Button>
                 <Button variant="ghost" className="px-8 h-16 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em]" onClick={() => setView('ledger')}>Discard</Button>
              </div>
           </Card>

           <div className="space-y-6">
              <Card className="rounded-[2.5rem] bg-indigo-600 text-white p-8 space-y-6 overflow-hidden relative shadow-2xl">
                 <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                 <h3 className="font-black text-lg tracking-tight relative z-10">Audit Compliance</h3>
                 <p className="text-xs text-indigo-100/80 leading-relaxed font-bold relative z-10">"Every voucher generated here is cryptographically signed and prepares your Form 10/12A filings automatically."</p>
                 <div className="flex items-center gap-3 py-4 border-y border-white/10 relative z-10">
                    <div className="w-10 h-5 bg-indigo-400 rounded-full relative p-1">
                       <div className="w-3 h-3 bg-white rounded-full ml-auto"></div>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200">AI Double-Entry Check</span>
                 </div>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-sm p-8 text-left space-y-6 bg-slate-50">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sequence Integrity</h4>
                 <div className="space-y-1">
                    <p className="text-xl font-black text-slate-900 tracking-tighter">Voucher #PV-2024-0042</p>
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
            <ArrowLeft className="w-5 h-5" /> <span className="font-black uppercase text-[10px] tracking-widest">Back to Ledger</span>
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" className="h-11 rounded-xl px-6 border-slate-200 font-black uppercase text-[10px] tracking-widest"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
            <Button className="h-11 rounded-xl px-6 bg-slate-950 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-900/10">New Journal Entry</Button>
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
                             <Badge variant="outline" className="text-[9px] uppercase tracking-[0.2em] font-black border-slate-200 px-3 py-1 bg-white shadow-sm">{selectedAccount.type} Account</Badge>
                          </div>
                          <CardTitle className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{selectedAccount.name}</CardTitle>
                       </div>
                       <div className="text-right space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Position</p>
                          <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{selectedAccount.balance}</h2>
                       </div>
                    </div>
                 </CardHeader>
                 <CardContent className="p-0">
                    <div className="px-10 py-6 border-y border-slate-50 flex items-center justify-between bg-slate-50/10">
                       <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-[10px]">Transaction Stream</h3>
                       <div className="flex gap-3">
                          <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white shadow-sm"><Filter className="w-3.5 h-3.5 mr-2 text-indigo-500" /> Filter</Button>
                          <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white shadow-sm"><Search className="w-3.5 h-3.5 mr-2 text-indigo-500" /> Search</Button>
                       </div>
                    </div>
                    <div className="divide-y divide-slate-50">
                       {[
                         { desc: 'Main Service Tithe Collection (Mar 24)', date: 'Mar 24, 2024', amount: '+$48,520.00', type: 'Credit' },
                         { desc: 'Grace Architect Fees - Milestone 2', date: 'Mar 22, 2024', amount: '-$12,400.00', type: 'Debit' },
                         { desc: 'Downtown Campus Electric Bill', date: 'Mar 20, 2024', amount: '-$1,250.00', type: 'Debit' },
                         { desc: 'Monthly Bank Interest', date: 'Mar 15, 2024', amount: '+$142.50', type: 'Credit' },
                       ].map((tx, i) => (
                         <div key={i} className="px-10 py-7 flex items-center justify-between hover:bg-slate-50/50 transition-all cursor-pointer group active:bg-slate-100 border-l-4 border-l-transparent hover:border-l-indigo-600">
                            <div className="space-y-1.5">
                               <p className="font-black text-slate-800 text-lg tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{tx.desc}</p>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{tx.date}</p>
                            </div>
                            <div className="text-right">
                               <p className={cn(
                                 "text-xl font-black tracking-tighter",
                                 tx.type === 'Credit' ? "text-emerald-500" : "text-rose-500"
                               )}>{tx.amount}</p>
                               <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mt-1">Ref: BTX-492-{i}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                    <div className="p-8 bg-slate-50/30 text-center">
                       <Button variant="ghost" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:bg-transparent hover:text-indigo-600">Load full archival ledger</Button>
                    </div>
                 </CardContent>
              </Card>
           </div>

           <div className="space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden border-l-[10px] border-l-indigo-600 p-8 space-y-4 bg-white">
                 <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Reconciliation Logic</h3>
                 </div>
                 <p className="text-sm text-slate-500 leading-relaxed font-bold">There are <span className="text-indigo-600">3 transactions</span> in this account that haven't been matched with a valid voucher or receipt.</p>
                 <Button className="w-full text-[10px] font-black uppercase tracking-widest h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 text-white">Auto-Match (AI Scout)</Button>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-2xl bg-slate-950 text-white p-8 space-y-8 relative overflow-hidden group cursor-pointer active:scale-95 transition-all">
                 <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent group-hover:scale-110 transition-transform"></div>
                 <div className="space-y-2 relative z-10">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Projected Year-End</p>
                    <h3 className="text-5xl font-black tracking-tighter leading-none">$3.4M</h3>
                    <div className="flex items-center gap-2 text-emerald-400 pt-1">
                       <TrendingDown className="w-3 h-3 rotate-180" />
                       <span className="text-[11px] font-black">4.2% Growth Velocity</span>
                    </div>
                 </div>
                 <div className="space-y-4 pt-6 border-t border-white/5 relative z-10">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                       <span className="text-slate-500">Ministry Reserve Target</span>
                       <span className="text-indigo-400">92%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden shadow-inner">
                       <div className="h-full bg-indigo-500 w-[92%] shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Financial Intelligence</h1>
          <p className="text-slate-500 font-medium tracking-tight leading-relaxed">Ministry-first fund accounting, automated compliance models, and audit-ready reporting suites.</p>
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
           { label: 'Total Equity', val: '₹32.4M', change: '+2.4%', up: true },
           { label: 'Operating Cash', val: '₹4.2M', change: '-1.8%', up: false },
           { label: 'Unrestricted Funds', val: '₹14.5k', change: '+12%', up: true },
           { label: 'Compliance Status', val: '98%', change: 'SECURED', up: true },
         ].map((stat, i) => (
           <Card key={i} className="border-none shadow-xl h-full flex flex-col justify-center py-8 px-8 hover:shadow-2xl transition-all group bg-white rounded-[2rem] active:scale-[0.98] cursor-pointer">
              <CardContent className="p-0 space-y-3">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-indigo-600 transition-colors leading-none">{stat.label}</p>
                 <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">{stat.val}</h3>
                    <Badge variant={stat.up ? "default" : "outline"} className={cn(
                      "text-[9px] font-black uppercase tracking-widest border-none px-2 py-0.5",
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
               <div className="space-y-1">
                 <CardTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase">Chart of Accounts</CardTitle>
                 <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Global fund distribution & ledger status</CardDescription>
               </div>
               <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-5 py-2.5 rounded-xl active:scale-95 transition-all shadow-sm">View Audited Ledger</button>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-slate-50">
                  {[
                    { code: '1000', name: 'Assets Distribution', balance: '₹2,84,00,000', type: 'Credit' },
                    { code: '2000', name: 'Current Liabilities', balance: '₹12,05,500', type: 'Debit' },
                    { code: '3000', name: 'Recurring Revenue', balance: '₹4,85,200', type: 'Credit' },
                    { code: '4000', name: 'Ministry Expenditure', balance: '₹3,21,100', type: 'Debit' },
                  ].map((acc, i) => (
                    <div 
                      key={i} 
                      onClick={() => handleAccountClick(acc)}
                      className="flex items-center justify-between px-10 py-8 hover:bg-slate-50/50 transition-all group cursor-pointer active:bg-slate-100 border-l-4 border-l-transparent hover:border-l-indigo-600"
                    >
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center font-mono text-base font-black text-slate-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all shadow-inner border border-slate-100 leading-none">{acc.code}</div>
                          <div>
                             <p className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors tracking-tight uppercase">{acc.name}</p>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{acc.type} Balance Control</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xl font-black text-slate-900 tracking-tighter leading-none">{acc.balance}</p>
                          <div className="flex justify-end mt-3">
                             <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div className={cn(
                                  "h-full rounded-full transition-all duration-1000",
                                  i === 0 ? "bg-indigo-500 w-full" : i === 1 ? "bg-amber-400 w-1/3" : i === 2 ? "bg-emerald-500 w-2/3" : "bg-rose-500 w-1/2"
                                )}></div>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </CardContent>
         </Card>

         <div className="space-y-8">
            <Card className="border-none shadow-2xl bg-slate-900 text-white overflow-hidden p-10 space-y-8 relative rounded-[3rem] group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><ShieldCheck size={120} /></div>
               <div className="space-y-1 relative z-10 text-left">
                  <CardTitle className="text-xl font-black tracking-tight uppercase">Compliance Vault</CardTitle>
                  <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">FCRA & Local Statutory Monitoring</CardDescription>
               </div>
               <div className="relative z-10 space-y-6 text-left">
                  <div className="space-y-4">
                     {[
                       { label: 'Section 12A Validation', status: 'Secured', val: 100, color: 'bg-emerald-500' },
                       { label: 'GST Input Credit Lock', status: '98%', val: 98, color: 'bg-indigo-500' },
                       { label: 'Sequential Voucher Audit', status: 'Pending Review', val: 75, color: 'bg-amber-500' },
                     ].map((item, i) => (
                       <div key={i} className="space-y-2">
                          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                             <span className="text-slate-400">{item.label}</span>
                             <span className="text-white">{item.status}</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <div className={cn("h-full transition-all duration-1000", item.color)} style={{ width: `${item.val}%` }}></div>
                          </div>
                       </div>
                     ))}
                  </div>
                  <button className="w-full mt-4 py-4 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 text-white">Generate Audit Workpapers</button>
               </div>
            </Card>

            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden p-8 space-y-6 text-left border-t-[8px] border-t-indigo-600">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Budget Velocity Monitor</h3>
               <div className="space-y-6">
                  {[
                    { label: 'Worship/Media', budget: 12000, actual: 11400 },
                    { label: 'Community Outreach', budget: 8500, actual: 9200 },
                    { label: 'Ministry Payroll', budget: 45000, actual: 44800 },
                  ].map((b, i) => (
                    <div key={i} className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">
                          <span>{b.label}</span>
                          <span className={cn("font-black tracking-tighter", b.actual > b.budget ? "text-rose-500" : "text-emerald-500")}>{( (b.actual/b.budget) * 100 ).toFixed(1)}%</span>
                       </div>
                       <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div className={cn("h-full rounded-full transition-all duration-1000", b.actual > b.budget ? "bg-rose-500" : "bg-indigo-500")} style={{ width: `${Math.min((b.actual/b.budget) * 100, 100)}%` }}></div>
                       </div>
                    </div>
                  ))}
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}
