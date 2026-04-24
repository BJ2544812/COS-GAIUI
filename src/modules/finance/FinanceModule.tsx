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
  const [selectedAccount, setSelectedAccount] = React.useState<{ code: string, name: string, balance: string, type: string } | null>(null);

  if (selectedAccount) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedAccount(null)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Ledger
          </Button>
          <div className="flex gap-2">
            <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
            <Button className="bg-slate-900">New Journal Entry</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                 <CardHeader className="p-8 pb-4">
                    <div className="flex justify-between items-start">
                       <div className="space-y-1">
                          <div className="flex items-center gap-2">
                             <div className="px-2 py-1 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-500 border border-slate-200">{selectedAccount.code}</div>
                             <Badge variant="outline" className="text-[10px] uppercase tracking-widest">{selectedAccount.type} Account</Badge>
                          </div>
                          <CardTitle className="text-3xl font-black text-slate-900">{selectedAccount.name}</CardTitle>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Closing Balance</p>
                          <h2 className="text-4xl font-black text-slate-900 font-mono tracking-tighter">{selectedAccount.balance}</h2>
                       </div>
                    </div>
                 </CardHeader>
                 <CardContent className="p-0">
                    <div className="px-8 py-4 border-b border-slate-50 flex items-center justify-between">
                       <h3 className="font-bold text-slate-800">Transaction History</h3>
                       <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="h-8 text-xs"><Filter className="w-3 h-3 mr-2" /> Filter</Button>
                          <Button variant="ghost" size="sm" className="h-8 text-xs"><Search className="w-3 h-3 mr-2" /> Search</Button>
                       </div>
                    </div>
                    <div className="divide-y divide-slate-50">
                       {[
                         { desc: 'Main Service Tithe Collection (Mar 24)', date: 'Mar 24, 2024', amount: '+$48,520.00', type: 'Credit' },
                         { desc: 'Grace Architect Fees - Milestone 2', date: 'Mar 22, 2024', amount: '-$12,400.00', type: 'Debit' },
                         { desc: 'Downtown Campus Electric Bill', date: 'Mar 20, 2024', amount: '-$1,250.00', type: 'Debit' },
                         { desc: 'Monthly Bank Interest', date: 'Mar 15, 2024', amount: '+$142.50', type: 'Credit' },
                       ].map((tx, i) => (
                         <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer group">
                            <div className="space-y-1">
                               <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{tx.desc}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tx.date}</p>
                            </div>
                            <div className="text-right">
                               <p className={cn(
                                 "text-sm font-black font-mono",
                                 tx.type === 'Credit' ? "text-emerald-500" : "text-rose-500"
                               )}>{tx.amount}</p>
                               <p className="text-[10px] text-slate-400 font-medium">Ref: BTX-492-{i}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                    <div className="p-4 bg-slate-50 text-center">
                       <Button variant="ghost" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Load older transactions</Button>
                    </div>
                 </CardContent>
              </Card>
           </div>

           <div className="space-y-6">
              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden border-l-4 border-l-indigo-600">
                 <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                       <AlertCircle className="w-4 h-4 text-indigo-400" />
                       Reconciliation Needed
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="space-y-4">
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">There are 3 transactions in this account that haven't been matched with a voucher.</p>
                    <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-widest h-11 rounded-xl">Auto-Match (AI)</Button>
                 </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-100 shadow-sm bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 space-y-6">
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Projected Year-End</p>
                    <h3 className="text-3xl font-black font-mono">$3.4M</h3>
                    <p className="text-xs text-indigo-400">+4.2% Growth</p>
                 </div>
                 <div className="space-y-2 pt-4 border-t border-white/10">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                       <span className="text-slate-400">Reserve Target</span>
                       <span className="text-emerald-400">92%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 w-[92%]" />
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Accounting & Compliance</h1>
          <p className="text-slate-500">Fund-based accounting, ministry budgets, and audit-ready reporting.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest leading-none text-[10px]">
            Working Papers
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 shadow-md transition-all active:scale-95">
            <Plus className="w-4 h-4" />
            New Voucher
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
           { label: 'Total Equity', val: '$3.2M', change: '+2.4%', up: true },
           { label: 'Operating Cash', val: '$420k', change: '-1.8%', up: false },
           { label: 'Unrestricted Funds', val: '$145k', change: '+12%', up: true },
           { label: 'Grant Liabilities', val: '$85k', change: '-5.0%', up: true },
         ].map((stat, i) => (
           <Card key={i} className="border-none shadow-sm h-full flex flex-col justify-center py-4 hover:shadow-md transition-shadow group">
              <CardContent className="p-4 px-6 space-y-1">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">{stat.label}</p>
                 <div className="flex items-baseline justify-between">
                    <h3 className="text-xl font-black text-slate-900">{stat.val}</h3>
                    <span className={cn("text-[10px] font-bold", stat.up ? "text-emerald-500" : "text-rose-500")}>{stat.change}</span>
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader className="py-5 border-b border-slate-50 flex flex-row items-center justify-between">
               <CardTitle className="text-lg font-bold">Chart of Accounts</CardTitle>
               <button className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all">View Full Ledger</button>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-slate-50">
                  {[
                    { code: '1000', name: 'Assets', balance: '$2,840,000.00', type: 'Credit' },
                    { code: '2000', name: 'Liabilities', balance: '$120,500.00', type: 'Debit' },
                    { code: '3000', name: 'Revenue', balance: '$48,520.00', type: 'Credit' },
                    { code: '4000', name: 'Expenditure', balance: '$32,100.00', type: 'Debit' },
                  ].map((acc, i) => (
                    <div 
                      key={i} 
                      onClick={() => setSelectedAccount(acc)}
                      className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group cursor-pointer active:bg-slate-100"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center font-mono text-xs font-bold text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">{acc.code}</div>
                          <div>
                             <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{acc.name}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{acc.type} Balance</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="font-black text-slate-900 font-mono tracking-tight">{acc.balance}</p>
                          <div className="flex justify-end mt-1">
                             <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
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

         <div className="space-y-6">
            <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative rounded-3xl">
               <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldCheck size={100} /></div>
               <CardHeader className="relative z-10">
                  <CardTitle className="text-base font-bold">Audit & Compliance</CardTitle>
                  <CardDescription className="text-slate-500 font-medium">Auto-pre-audit validation active</CardDescription>
               </CardHeader>
               <CardContent className="relative z-10 space-y-4 pt-0 text-sm">
                  <div className="space-y-3">
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-xs font-medium text-slate-300">GST/TDS Readiness (98%)</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="text-xs font-medium text-slate-300">Sequential Receipt Matching</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                        <span className="text-xs font-medium text-slate-300">Missing Vouchers (2 Pending)</span>
                     </div>
                  </div>
                  <button className="w-full mt-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95">Generate Form 16 Datasets</button>
               </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl">
               <CardHeader className="py-4 border-b border-slate-50">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Budget vs Actual</CardTitle>
               </CardHeader>
               <CardContent className="p-4 space-y-4 pb-6">
                  {[
                    { label: 'Worship/Media', budget: 12000, actual: 11400 },
                    { label: 'Outreach', budget: 8500, actual: 9200 },
                    { label: 'Staff Payroll', budget: 45000, actual: 44800 },
                  ].map((b, i) => (
                    <div key={i} className="space-y-1.5">
                       <div className="flex justify-between text-[11px] font-bold text-slate-600 uppercase">
                          <span>{b.label}</span>
                          <span className={cn(b.actual > b.budget ? "text-rose-500" : "text-emerald-500")}>{( (b.actual/b.budget) * 100 ).toFixed(1)}%</span>
                       </div>
                       <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-1000", b.actual > b.budget ? "bg-rose-500" : "bg-emerald-500")} style={{ width: `${Math.min((b.actual/b.budget) * 100, 100)}%` }}></div>
                       </div>
                    </div>
                  ))}
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
