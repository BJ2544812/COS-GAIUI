import * as React from 'react';
import { 
  HeartHandshake, 
  CircleDollarSign, 
  TrendingUp, 
  Plus, 
  Download, 
  Calendar, 
  ArrowUpRight, 
  Filter,
  Search,
  CreditCard,
  Banknote,
  MoreVertical,
  ArrowLeft,
  ChevronRight,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { ERPModule } from '@/src/types';

const GIVING_HISTORY = [
  { id: '1', donor: 'James Wilson', type: 'Tithe', amount: '$250.00', method: 'Online', date: 'Mar 26, 2024' },
  { id: '2', donor: 'The Miller Family', type: 'Missions', amount: '$1,200.00', method: 'Bank Transfer', date: 'Mar 25, 2024' },
  { id: '3', donor: 'Sarah Jenkins', type: 'Tithe', amount: '$500.00', method: 'Automatic', date: 'Mar 24, 2024' },
  { id: '4', donor: 'Anonymous', type: 'Offering', amount: '$50.00', method: 'Cash', date: 'Mar 24, 2024' },
  { id: '5', donor: 'David Smith', type: 'Building Fund', amount: '$2,500.00', method: 'Cheque', date: 'Mar 22, 2024' },
];

const REVENUE_DATA = [
  { month: 'Oct', total: 32000 },
  { month: 'Nov', total: 38000 },
  { month: 'Dec', total: 54000 },
  { month: 'Jan', total: 35000 },
  { month: 'Feb', total: 42000 },
  { month: 'Mar', total: 48500 },
];

interface GivingModuleProps {
  onModuleChange?: (module: ERPModule) => void;
}

export function GivingModule({ onModuleChange }: GivingModuleProps) {
  const [selectedFund, setSelectedFund] = React.useState<string | null>(null);

  if (selectedFund) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedFund(null)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Stewardship
          </Button>
          <Button className="bg-indigo-600">Fund Settings</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-900 text-white p-8 border-none">
                   <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Badge className="bg-white/10 text-white border-white/20 mb-2">Fund Detail</Badge>
                        <CardTitle className="text-4xl font-black">{selectedFund}</CardTitle>
                        <p className="text-indigo-300 font-medium tracking-tight">Active Capital Campaign & Projects</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Balance</p>
                         <h2 className="text-4xl font-black text-indigo-400">$840,250</h2>
                      </div>
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <h3 className="font-bold text-slate-800">Allocation Breakdown</h3>
                         <div className="space-y-6">
                            {[
                              { label: 'Campus Construction', val: 450000, color: 'indigo' },
                              { label: 'Media Equipment', val: 240000, color: 'emerald' },
                              { label: 'Unallocated', val: 150250, color: 'slate' },
                            ].map((item, i) => (
                              <div key={i} className="space-y-2">
                                 <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                                    <span>{item.label}</span>
                                    <span>${item.val.toLocaleString()}</span>
                                 </div>
                                 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div className={cn("h-full rounded-full", `bg-${item.color}-500`)} style={{ width: `${(item.val / 840250) * 100}%` }} />
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                      <div className="bg-slate-50 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                         <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                            <Target className="w-6 h-6" />
                         </div>
                         <h4 className="font-bold text-slate-800 text-lg">Goal Progression</h4>
                         <p className="text-sm text-slate-500">You are at 84% of the $1M goal for this fiscal year.</p>
                         <Button variant="outline" className="rounded-xl w-full">Adjust Targets</Button>
                      </div>
                   </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                 <CardHeader className="py-5 border-b border-slate-50">
                    <CardTitle className="text-lg font-bold">Allocated Invoices</CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                       {['Supplier: Apex Builders', 'MediaHub Pro Gear', 'Grace Architect Fees'].map((inv, i) => (
                         <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 cursor-pointer group">
                            <div>
                               <p className="font-bold text-slate-800 group-hover:text-indigo-600">{inv}</p>
                               <p className="text-xs text-slate-400">Payment approved on Mar {20 - i}, 2024</p>
                            </div>
                            <span className="text-sm font-black text-slate-900">$12,400.00</span>
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
    <div className="space-y-8 animate-in fade-in duration-700">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Giving & Stewardship</h1>
          <p className="text-slate-500">Manage tithes, offerings, pledges, and financial communication.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            <Download className="w-4 h-4" />
            Tax Statements
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all active:scale-95">
            <Plus className="w-4 h-4" />
            Record Giving
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card onClick={() => setSelectedFund('General Fund')} className="border-none shadow-sm overflow-hidden relative group cursor-pointer hover:ring-2 hover:ring-indigo-500/20 transition-all">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><CircleDollarSign size={80} /></div>
           <CardContent className="p-6 pt-8">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-1.5">Total Month-to-Date</p>
              <div className="flex items-baseline gap-3">
                 <h3 className="text-4xl font-black text-slate-900">$48,520</h3>
                 <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+12.4%</span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-4 group-hover:text-indigo-600 transition-colors">Compared to $41,200 last month &rarr;</p>
           </CardContent>
        </Card>
        <Card className="border-none shadow-sm overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-4 opacity-10"><HeartHandshake size={80} /></div>
           <CardContent className="p-6 pt-8">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-1.5">Active Donors</p>
              <div className="flex items-baseline gap-3">
                 <h3 className="text-4xl font-black text-slate-900">412</h3>
                 <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">+8</span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-4">24 new first-time givers this year</p>
           </CardContent>
        </Card>
        <Card onClick={() => setSelectedFund('Building Fund')} className="border-none shadow-sm overflow-hidden relative bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700 transition-all">
           <div className="absolute top-0 right-0 p-4 opacity-10 text-white"><TrendingUp size={80} /></div>
           <CardContent className="p-6 pt-8">
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-[0.2em] mb-1.5">Pledge Fulfillment</p>
              <div className="flex items-baseline gap-3">
                 <h3 className="text-4xl font-black">84%</h3>
                 <div className="w-12 h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full" style={{ width: '84%' }}></div>
                 </div>
              </div>
              <p className="text-xs text-indigo-100/70 font-medium mt-4 uppercase tracking-widest text-[10px] font-black">View Campaign &rarr;</p>
           </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 py-5">
                 <div>
                    <CardTitle className="text-lg font-bold text-slate-800">Giving Velocity</CardTitle>
                    <CardDescription>6-month revenue trend analysis</CardDescription>
                 </div>
                 <div className="flex gap-2">
                    <button className="text-xs font-bold text-indigo-600 uppercase">Weekly</button>
                    <span className="text-slate-200">|</span>
                    <button className="text-xs font-bold text-slate-400 uppercase">Monthly</button>
                 </div>
              </CardHeader>
              <CardContent className="p-6 pt-8">
                 <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={REVENUE_DATA}>
                          <defs>
                             <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={4} fill="url(#colorRevenue)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="py-5 border-b border-slate-50 flex flex-row items-center justify-between">
                 <CardTitle className="text-lg font-bold text-slate-800">Recent Transactions</CardTitle>
                 <div className="relative group">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input type="text" placeholder="Search donors..." className="pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs" />
                 </div>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left font-sans">
                       <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <tr>
                             <th className="px-6 py-3">Donor</th>
                             <th className="px-6 py-3">Fund</th>
                             <th className="px-6 py-3 text-right">Amount</th>
                             <th className="px-6 py-3">Method</th>
                             <th className="px-6 py-3">Date</th>
                             <th className="px-6 py-3"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50 text-sm">
                          {GIVING_HISTORY.map((give) => (
                            <tr key={give.id} className="hover:bg-slate-50/50 transition-colors group">
                               <td className="px-6 py-4">
                                  <span 
                                    onClick={() => onModuleChange?.('profile')}
                                    className="font-bold text-slate-700 hover:text-indigo-600 cursor-pointer transition-colors"
                                  >
                                    {give.donor}
                                  </span>
                               </td>
                               <td className="px-6 py-4 font-medium text-slate-500 whitespace-nowrap">{give.type}</td>
                               <td className="px-6 py-4 text-right font-black text-slate-900">{give.amount}</td>
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-1.5 text-slate-400">
                                     {give.method === 'Online' ? <CreditCard size={14} /> : <Banknote size={14} />}
                                     <span className="text-xs font-bold uppercase tracking-tight">{give.method}</span>
                                  </div>
                               </td>
                               <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap">{give.date}</td>
                               <td className="px-6 py-4 text-right">
                                  <button className="p-1.5 rounded-lg text-slate-300 group-hover:text-indigo-400 transition-colors">
                                     <MoreVertical size={16} />
                                  </button>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </CardContent>
           </Card>
        </div>

        <div className="space-y-6">
           <Card className="border-none shadow-sm">
              <CardHeader className="py-5 border-b border-slate-50">
                 <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-widest">Fund Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                 {[
                   { label: 'General Fund', percentage: 65, color: 'bg-indigo-500' },
                   { label: 'Missions', percentage: 20, color: 'bg-emerald-500' },
                   { label: 'Building Fund', percentage: 10, color: 'bg-amber-500' },
                   { label: 'Benevolence', percentage: 5, color: 'bg-rose-500' },
                 ].map((fund, i) => (
                    <div key={i} className="space-y-2 group cursor-pointer" onClick={() => setSelectedFund(fund.label)}>
                       <div className="flex justify-between text-xs font-bold text-slate-500 uppercase group-hover:text-indigo-600 transition-colors">
                          <span>{fund.label}</span>
                          <span>{fund.percentage}%</span>
                       </div>
                       <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full", fund.color)} style={{ width: `${fund.percentage}%` }}></div>
                       </div>
                    </div>
                 ))}
              </CardContent>
           </Card>

           <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative rounded-3xl">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
              <CardHeader className="relative z-10">
                 <CardTitle className="text-base font-bold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    Giving Health Report
                 </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 space-y-5 pt-0">
                 <p className="text-xs text-slate-400 leading-relaxed">System analysis shows a <span className="text-emerald-400 font-bold">14.2% increase</span> in recurring giving conversion after the new mobile app launch.</p>
                 <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[10px] font-bold text-indigo-300 uppercase mb-1">New Opportunity</p>
                    <p className="text-[11px] font-medium leading-tight text-slate-300">82 donors have increased their frequency by 50% in the last 90 days. High potential for capital campaign involvement.</p>
                 </div>
                 <button className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-lg shadow-indigo-500/20">Download Audit Pack</button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
