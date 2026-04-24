import * as React from 'react';
import { 
  Briefcase, 
  Search, 
  Filter, 
  Grid, 
  List as ListIcon, 
  CheckCircle, 
  AlertCircle,
  Clock,
  MoreVertical,
  Plus,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { ERPModule } from '@/src/types';

const STAFF = [
  { name: 'Arthur Penhaligon', role: 'Senior Pastor', status: 'Full-time', dept: 'Leadership', avatar: 'AP' },
  { name: 'Sarah Jenkins', role: 'Executive Pastor', status: 'Full-time', dept: 'Admin', avatar: 'SJ' },
  { name: 'David Miller', role: 'Worship Director', status: 'Part-time', dept: 'Worship', avatar: 'DM' },
  { name: 'Rachel Green', role: 'Youth Coordinator', status: 'Intern', dept: 'Youth', avatar: 'RG' },
];

const VOLUNTEER_KPI = [
  { label: 'Active Volunteers', value: '412', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Average Reliability', value: '94%', icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Background Clearances', value: '98%', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'Total Serving Hours', value: '1.2k', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' },
];

interface WorkforceModuleProps {
  onModuleChange?: (module: ERPModule) => void;
}

export function WorkforceModule({ onModuleChange }: WorkforceModuleProps) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [editingStaff, setEditingStaff] = React.useState<any>(null);

  if (isAdding) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsAdding(false)} className="rounded-full">
            <Plus className="w-5 h-5 rotate-45" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Add Staff or Volunteer</h1>
            <p className="text-sm text-slate-500 font-medium">Create a new organizational role for a member or non-member.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="md:col-span-2 space-y-6">
              <Card className="rounded-3xl border-slate-100 shadow-sm p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                       <input className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. John Doe" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                       <input className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="john@church.org" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Role/Designation</label>
                       <input className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. Youth Leader" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Department</label>
                       <select className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20">
                          <option>Leadership</option>
                          <option>Worship</option>
                          <option>Media</option>
                          <option>Hospitality</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Association Type</p>
                    <div className="flex gap-4">
                       <button className="flex-1 p-4 rounded-2xl border-2 border-indigo-600 bg-indigo-50 text-indigo-700 font-bold text-sm text-center">Existing Member</button>
                       <button className="flex-1 p-4 rounded-2xl border-2 border-slate-100 bg-white text-slate-400 font-bold text-sm text-center">Non-Member / Guest</button>
                    </div>
                 </div>
                 <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl font-bold">Confirm & Add to Workforce</Button>
              </Card>
           </div>
           
           <div className="space-y-6">
              <Card className="rounded-3xl border-slate-100 shadow-sm p-6 bg-slate-50 border-none">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Onboarding Checklist</h3>
                 <div className="space-y-3">
                    {['Background Check', 'Digital Handbook Sign-off', 'System Access Grant', 'Initial Training Decor'].map((task, i) => (
                      <div key={i} className="flex items-center gap-3">
                         <div className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center">
                            <div className="w-2 h-2 rounded bg-slate-200" />
                         </div>
                         <span className="text-xs font-medium text-slate-600">{task}</span>
                      </div>
                    ))}
                 </div>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  if (editingStaff) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setEditingStaff(null)} className="rounded-full">
                <Plus className="w-5 h-5 rotate-45" />
              </Button>
              <div>
                <h1 className="text-2xl font-black text-slate-900">Manage: {editingStaff.name}</h1>
                <p className="text-sm text-slate-500 font-medium">Update account settings and role permissions.</p>
              </div>
           </div>
           <Button className="bg-rose-50 text-rose-600 hover:bg-rose-100 border-none rounded-xl font-bold h-9 text-xs uppercase px-4 shadow-none">Deactivate Account</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="md:col-span-2 space-y-6">
              <Card className="rounded-3xl border-slate-100 shadow-sm p-8 space-y-8">
                 <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-800 border-b border-slate-50 pb-2">Profile Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Role Title</label>
                          <input className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" defaultValue={editingStaff.role} />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Employment Status</label>
                          <select className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" defaultValue={editingStaff.status}>
                             <option>Full-time</option>
                             <option>Part-time</option>
                             <option>Contractor</option>
                             <option>Volunteer</option>
                          </select>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-black text-slate-800 border-b border-slate-50 pb-2">Account Settings</h3>
                    <div className="space-y-4">
                       <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div>
                             <p className="text-sm font-bold text-slate-800">Two-Factor Authentication</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase">Required for all staff accounts</p>
                          </div>
                          <div className="w-10 h-5 bg-indigo-600 rounded-full relative p-0.5 shadow-inner">
                             <div className="w-4 h-4 rounded-full bg-white ml-auto" />
                          </div>
                       </div>
                       <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div>
                             <p className="text-sm font-bold text-slate-800">Admin Panel Access</p>
                             <p className="text-[10px] text-slate-400 font-bold uppercase">Full system configuration rights</p>
                          </div>
                          <div className="w-10 h-5 bg-slate-200 rounded-full relative p-0.5 shadow-inner">
                             <div className="w-4 h-4 rounded-full bg-white" />
                          </div>
                       </div>
                    </div>
                 </div>

                 <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 rounded-xl font-bold mt-4 shadow-lg shadow-emerald-50">Save Changes</Button>
              </Card>
           </div>

           <div className="space-y-6">
              <Card className="rounded-3xl border-slate-100 shadow-sm p-8 bg-slate-900 text-white space-y-4 border-none">
                 <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Login Activity</h3>
                 <div className="space-y-4">
                    {[
                      { device: 'iPhone 15 - Springfield', time: '2 hours ago' },
                      { device: 'Chrome on MacOS - Springfield', time: 'Yesterday' },
                    ].map((session, i) => (
                      <div key={i} className="text-xs">
                         <p className="font-bold text-slate-200">{session.device}</p>
                         <p className="text-slate-500 font-medium">{session.time}</p>
                      </div>
                    ))}
                 </div>
                 <Button variant="ghost" className="text-indigo-400 hover:text-white p-0 h-auto font-bold text-[10px] uppercase">Revoke All Sessions</Button>
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Workforce & Staff</h1>
          <p className="text-slate-500">Manage payroll, recruitment, volunteer scheduling, and training records.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all">
            Training Records
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Staff / Volunteer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {VOLUNTEER_KPI.map((api, i) => (
          <Card key={i} className="border-none shadow-sm h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${api.bg} flex items-center justify-center ${api.color}`}>
                <api.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-0.5">{api.label}</p>
                <p className="text-2xl font-bold text-slate-900 leading-none">{api.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="py-5 border-b border-slate-50 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-800">Staff Registry</CardTitle>
              <div className="flex gap-2">
                <button className="p-1.5 rounded bg-slate-100 text-slate-600 shadow-inner"><Grid className="w-4 h-4" /></button>
                <button className="p-1.5 rounded text-slate-400 hover:bg-slate-50"><ListIcon className="w-4 h-4" /></button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-slate-50">
                  {STAFF.map((person, i) => (
                    <div key={i} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 border border-slate-200 shadow-sm overflow-hidden group-hover:border-indigo-200 transition-colors">
                          {person.avatar}
                        </div>
                        <div>
                          <p 
                            onClick={() => setEditingStaff(person)}
                            className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer hover:underline"
                          >
                            {person.name}
                          </p>
                          <p className="text-xs text-slate-500 font-medium">{person.role} • {person.dept}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                         <Badge className="bg-slate-100/80 text-slate-600 border-none shadow-none rounded-full px-3 py-1 font-bold text-[10px] uppercase tracking-wider">{person.status}</Badge>
                         <button className="p-2 rounded-lg text-slate-400 hover:bg-white hover:shadow-sm transition-all opacity-0 group-hover:opacity-100">
                            <MoreVertical className="w-4 h-4" />
                         </button>
                      </div>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader className="py-5 border-b border-slate-50">
               <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-widest">Recruitment Funnel</CardTitle>
            </CardHeader>
            <CardContent className="p-6 px-4 space-y-6">
               {[
                 { label: 'New Applications', count: 12, color: 'bg-blue-500' },
                 { label: 'Interviews Scheduled', count: 4, color: 'bg-indigo-500' },
                 { label: 'Onboarding', count: 8, color: 'bg-emerald-500' },
               ].map((item, i) => (
                 <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <span>{item.label}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                       <div className={`h-full ${item.color} rounded-full`} style={{ width: `${(item.count / 20) * 100}%` }}></div>
                    </div>
                 </div>
               ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-rose-50 border border-rose-100 overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4">
                <AlertCircle className="w-5 h-5 text-rose-500 animate-pulse" />
             </div>
             <CardHeader>
                <CardTitle className="text-sm font-bold text-rose-800">Safeguarding Action Required</CardTitle>
             </CardHeader>
             <CardContent className="space-y-3">
                <p className="text-xs text-rose-700 leading-relaxed font-medium">8 volunteer background checks are expiring within the next 30 days. Action is required to maintain compliance.</p>
                <button className="text-xs font-bold text-rose-600 underline underline-offset-4 decoration-rose-300 hover:text-rose-800 transition-colors">
                  Send mass renewal reminders
                </button>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
