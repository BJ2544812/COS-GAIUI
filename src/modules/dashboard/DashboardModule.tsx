import * as React from 'react';
import { 
  Users, 
  UserPlus, 
  ArrowUpRight, 
  TrendingUp, 
  Heart, 
  Calendar,
  Activity,
  ArrowDownRight,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { cn } from '@/src/lib/utils';
import { ERPModule } from '@/src/types';

const MOCK_STATS = [
  { id: 'members', label: 'Total Members', value: '2,482', change: '+12%', positive: true, icon: Users, color: 'indigo' },
  { id: 'members', label: 'New Visitors', value: '124', change: '+18%', positive: true, icon: UserPlus, color: 'emerald' },
  { id: 'attendance', label: 'Avg. Attendance', value: '1,840', change: '-2%', positive: false, icon: Calendar, color: 'amber' },
  { id: 'giving', label: 'Monthly Giving', value: '$42.5k', change: '+5%', positive: true, icon: Heart, color: 'rose' },
];

const MINISTRY_DATA = [
  { name: 'Worship', value: 45, color: '#6366f1' },
  { name: 'Youth', value: 30, color: '#10b981' },
  { name: 'Media', value: 15, color: '#f59e0b' },
  { name: 'Admin', value: 10, color: '#f43f5e' },
];

const ATTENDANCE_DATA = [
  { name: 'Week 1', value: 1650 },
  { name: 'Week 2', value: 1840 },
  { name: 'Week 3', value: 1720 },
  { name: 'Week 4', value: 2100 },
  { name: 'Week 5', value: 1950 },
  { name: 'Week 6', value: 1840 },
];

const GIVING_DATA = [
  { month: 'Jan', amount: 35000 },
  { month: 'Feb', amount: 38000 },
  { month: 'Mar', amount: 42500 },
  { month: 'Apr', amount: 32000 },
  { month: 'May', amount: 45000 },
  { month: 'Jun', amount: 48000 },
];

const RECENT_ACTIVITY = [
  { user: 'Sarah Jenkins', action: 'completed membership class', time: '12 mins ago', icon: Activity },
  { user: 'The Miller Family', action: 'checked in to 9:00 AM service', time: '45 mins ago', icon: Calendar },
  { user: 'Robert Chen', action: 'submitted a prayer request', time: '2 hours ago', icon: Heart },
  { user: 'Youth Ministry', action: 'created "Camp Fire 2024" event', time: '5 hours ago', icon: TrendingUp },
];

interface DashboardModuleProps {
  onModuleChange?: (module: ERPModule) => void;
}

export function DashboardModule({ onModuleChange }: DashboardModuleProps) {
  const [testResult, setTestResult] = React.useState<string | null>(null);
  const [showAIInsights, setShowAIInsights] = React.useState(false);

  const executeApiTest = async () => {
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
      const data = await response.json();
      setTestResult(`Success: ${data.title.substring(0, 20)}...`);
    } catch (err) {
      setTestResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (showAIInsights) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setShowAIInsights(false)} className="rounded-full">
                <ArrowUpRight className="w-5 h-5 rotate-[225deg]" />
              </Button>
              <h1 className="text-2xl font-black text-slate-900">AI Impact Strategy</h1>
           </div>
           <Button onClick={() => setShowAIInsights(false)} className="bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100">Save Strategy</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <Card className="rounded-3xl border-slate-100 shadow-xl p-8 space-y-6">
              <h3 className="text-indigo-600 font-black uppercase text-xs tracking-widest text-left">Growth Forecast</h3>
              <div className="space-y-4">
                 {[
                   { label: 'Campus Expansion', probability: '82%', rec: 'Focus on South District' },
                   { label: 'Volunteer Capacity', probability: '64%', rec: 'Recruit 12 new leaders' },
                   { label: 'Member Retention', probability: '91%', rec: 'Engage visitors within 24h' },
                 ].map((insight, i) => (
                   <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                         <span className="font-bold text-slate-800">{insight.label}</span>
                         <Badge className="bg-indigo-100 text-indigo-700 border-none font-bold">{insight.probability}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Recommendation: {insight.rec}</p>
                   </div>
                 ))}
              </div>
           </Card>

           <Card className="rounded-3xl border-slate-100 shadow-xl p-8 bg-indigo-900 text-white border-none">
              <h3 className="text-indigo-200 font-black uppercase text-xs tracking-widest mb-6 text-left">AI Optimization Steps</h3>
              <div className="space-y-6">
                 <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 font-black text-lg">1</div>
                    <p className="text-sm font-medium leading-relaxed">Automate "First-Time Visitor" follow-up emails via the Communication Hub.</p>
                 </div>
                 <div className="flex gap-4 text-left">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 font-black text-lg">2</div>
                    <p className="text-sm font-medium leading-relaxed">Adjust seating capacity for the 11AM service by approximately 15% based on previous 6 weeks.</p>
                 </div>
                 <div className="flex gap-4 text-left">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 font-black text-lg">3</div>
                    <p className="text-sm font-medium leading-relaxed">Allocate $2,500 from the marketing budget to targeted social ads in the Downtown area.</p>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1 text-left">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Executive Overview</h1>
          <p className="text-slate-500">Real-time indicators of your church's health and ministry impact.</p>
        </div>
        <div className="flex items-center gap-3">
          {testResult && (
            <Badge variant="outline" className={cn(
              "px-3 py-1 font-mono text-[10px]",
              testResult.startsWith('Success') ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
            )}>
              {testResult}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={executeApiTest} className="text-[10px] font-bold uppercase tracking-widest h-9">
            Verify API Bridge
          </Button>
          <Button onClick={() => onModuleChange?.('notifications')} variant="ghost" size="icon" className="relative h-9 w-9">
             <Activity className="w-5 h-5 text-slate-400" />
             <div className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_STATS.map((stat, i) => (
          <Card 
            key={i} 
            onClick={() => onModuleChange?.(stat.id as ERPModule)}
            className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden cursor-pointer active:scale-[0.98]"
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  "p-3 rounded-xl transition-colors",
                  stat.color === 'indigo' && "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
                  stat.color === 'emerald' && "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
                  stat.color === 'amber' && "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
                  stat.color === 'rose' && "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white",
                )}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                  stat.positive ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                )}>
                  {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 leading-none">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 py-5">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">Attendance Trends</CardTitle>
              <CardDescription>Weekly participation across all services</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-xs font-medium text-slate-500">Combined</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 pb-4 pl-4 pr-8">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ATTENDANCE_DATA}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#94a3b8'}}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#94a3b8'}}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#6366f1" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm h-full">
          <CardHeader className="border-b border-slate-50 py-5">
            <CardTitle className="text-lg font-bold text-slate-800">Recent Activity</CardTitle>
            <CardDescription>Latest events across the platform</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50">
              {RECENT_ACTIVITY.map((activity, i) => (
                <div key={i} className="flex items-start gap-4 p-5 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                    <activity.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-slate-900 leading-tight">
                      {activity.user}
                    </p>
                    <p className="text-xs text-slate-500 leading-normal">
                      {activity.action}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest pt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
         <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="py-5 border-b border-slate-50">
            <CardTitle className="text-lg font-bold text-slate-800">Giving Distribution</CardTitle>
            <CardDescription>Financial contributions by month</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 pb-4 pl-4 pr-8">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={GIVING_DATA}>
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#94a3b8'}}
                    dy={10}
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={24}>
                    {GIVING_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 5 ? '#f43f5e' : '#cbd5e1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="py-5 border-b border-slate-50">
            <CardTitle className="text-lg font-bold text-slate-800">Ministry Distribution</CardTitle>
            <CardDescription>Volunteer involvement across departments</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={MINISTRY_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {MINISTRY_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <div className="px-6 pb-6 grid grid-cols-2 gap-4">
            {MINISTRY_DATA.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.name}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative">
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-indigo-200" />
              Impact Intelligence
            </CardTitle>
            <CardDescription className="text-indigo-100/70">Predictive insights based on engagement patterns</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-6 pt-4">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-2">Retention Alert</p>
                <p className="text-sm">Attendance patterns suggest a potential <span className="font-bold text-white">15% drop</span> in volunteer redundancy next month.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-2">Growth Opportunity</p>
                <p className="text-sm">Visitors from South Campus are <span className="font-bold text-white">4x more likely</span> to join a small group if invited within 48 hours.</p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowAIInsights(true)}
              className="w-full bg-white text-indigo-600 font-bold py-3 rounded-xl text-sm shadow-xl hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              Generate Detailed AI Strategy
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Removing local helper as we use global one
