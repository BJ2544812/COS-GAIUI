import * as React from 'react';
import { 
  User, 
  Users, 
  Heart, 
  MapPin, 
  Calendar, 
  Mail, 
  Phone, 
  Shield, 
  Edit3, 
  History, 
  ChevronLeft,
  Activity,
  Award,
  Link as LinkIcon,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Separator } from '@/src/components/ui/separator';
import { cn } from '@/src/lib/utils';

interface MemberProfileDetailProps {
  memberId: string;
  onBack: () => void;
}

export function MemberProfileDetail({ memberId, onBack }: MemberProfileDetailProps) {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'family' | 'spiritual' | 'activity'>('overview');
  const familyPhotoRef = React.useRef<HTMLInputElement>(null);
  const [familyPhoto, setFamilyPhoto] = React.useState<string | null>(null);

  // Mock data for the specific member
  const member = {
    name: 'James Wilson',
    role: 'Member',
    joined: 'Oct 12, 2021',
    campus: 'Downtown',
    email: 'james.w@example.com',
    phone: '+1 555 0101',
    address: '123 Grace Way, Springfield, IL',
    status: 'Active',
    family: [
      { name: 'Sarah Wilson', relation: 'Spouse', id: 'f1', status: 'Member' },
      { name: 'Chloe Wilson', relation: 'Daughter', id: 'f2', status: 'Youth' },
      { name: 'Jack Wilson', relation: 'Son', id: 'f3', status: 'Child' },
    ],
    growth: [
      { step: 'Baptism', date: 'Jan 2022', completed: true },
      { step: 'Membership Class', date: 'Mar 2022', completed: true },
      { step: 'Volunteer Training', date: 'Aug 2022', completed: true },
      { step: 'Small Group Leader', date: 'Ongoing', completed: false },
    ]
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2 text-slate-500 font-bold" onClick={onBack}>
          <ChevronLeft className="w-5 h-5" /> Back to Directory
        </Button>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" className="rounded-xl border-slate-200">
             <Edit3 className="w-4 h-4 mr-2" /> Edit Profile
           </Button>
           <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200">
             Manage Household
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
             <div className="h-24 bg-gradient-to-br from-indigo-500 to-indigo-700" title="Profile Banner" />
             <div className="px-6 pb-6 -mt-12 text-center">
                <div className="inline-block p-1.5 rounded-3xl bg-white shadow-xl mb-4">
                   <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-2xl border border-slate-200">
                      {member.name.charAt(0)}
                   </div>
                </div>
                <h2 className="text-xl font-black text-slate-900 leading-tight">{member.name}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 mb-3">{member.role}</p>
                <div className="flex flex-wrap justify-center gap-2">
                   <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold px-2 py-0.5 text-[10px] uppercase">{member.status}</Badge>
                   <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400">{member.campus}</Badge>
                </div>
             </div>
             <Separator className="bg-slate-50" />
             <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 text-slate-600">
                   <Mail className="w-4 h-4 text-slate-400" />
                   <span className="text-sm font-medium">{member.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                   <Phone className="w-4 h-4 text-slate-400" />
                   <span className="text-sm font-medium">{member.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                   <MapPin className="w-4 h-4 text-slate-400" />
                   <span className="text-sm font-medium leading-tight">{member.address}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                   <Calendar className="w-4 h-4 text-slate-400" />
                   <span className="text-sm font-medium">Joined {member.joined}</span>
                </div>
             </div>
          </Card>

          <Card className="rounded-3xl border-slate-100 shadow-sm p-6 bg-slate-50 border-dashed">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Family Information</p>
             <div className="space-y-4">
                <input 
                  type="file" 
                  ref={familyPhotoRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const url = URL.createObjectURL(e.target.files[0]);
                      setFamilyPhoto(url);
                    }
                  }}
                />
                <div 
                  onClick={() => familyPhotoRef.current?.click()}
                  className="w-full aspect-[4/3] rounded-2xl bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-400 overflow-hidden relative group cursor-pointer"
                >
                   {familyPhoto ? (
                     <img src={familyPhoto} alt="Family" className="w-full h-full object-cover" />
                   ) : (
                     <Users size={32} className="opacity-20" />
                   )}
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Plus className="text-white w-6 h-6" />
                   </div>
                </div>
                <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">Update Family Photo</p>
             </div>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
           <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'family', label: 'Family & Household', icon: Users },
                { id: 'spiritual', label: 'Development', icon: Heart },
                { id: 'activity', label: 'Activity Logs', icon: History },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                    activeTab === tab.id 
                      ? "bg-white text-indigo-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
           </div>

           {activeTab === 'overview' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <Card className="rounded-3xl border-slate-100 shadow-sm p-8 space-y-4">
                   <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Quick Stats</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-emerald-50 rounded-2xl">
                         <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Attendance</p>
                         <p className="text-xl font-black text-emerald-900">92%</p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-2xl">
                         <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Serving</p>
                         <p className="text-xl font-black text-blue-900">2 Teams</p>
                      </div>
                   </div>
                </Card>
                <Card className="rounded-3xl border-slate-100 shadow-sm p-8 flex items-center justify-between">
                   <div className="space-y-1">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Engagement Score</h3>
                      <p className="text-4xl font-black text-slate-900">85</p>
                      <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">+5 this month</p>
                   </div>
                   <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                      <Activity size={32} className="animate-pulse" />
                   </div>
                </Card>
             </div>
           )}

           {activeTab === 'family' && (
             <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-400">
                <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/30">
                   <div className="flex justify-between items-center">
                      <div>
                         <CardTitle className="text-xl font-bold">The Wilson Family</CardTitle>
                         <CardDescription>Household ID: #H4492-W</CardDescription>
                      </div>
                      <Button variant="outline" className="rounded-xl border-slate-200">
                        <Plus className="w-4 h-4 mr-2" /> Add Member
                      </Button>
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="divide-y divide-slate-50">
                      {member.family.map((f, i) => (
                        <div key={f.id} className="p-6 flex items-center justify-between group hover:bg-slate-50/50 transition-colors">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                                {f.name.charAt(0)}
                              </div>
                              <div>
                                 <p className="font-bold text-slate-800">{f.name}</p>
                                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{f.relation}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <Badge variant="outline" className="rounded-full text-[10px] uppercase font-bold text-slate-500">{f.status}</Badge>
                              <Button variant="ghost" size="sm" className="text-indigo-600 font-black uppercase text-[10px] tracking-widest rounded-lg">View Profile</Button>
                           </div>
                        </div>
                      ))}
                   </div>
                </CardContent>
             </Card>
           )}

           {activeTab === 'spiritual' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <Card className="rounded-3xl border-slate-100 shadow-sm p-8 space-y-6">
                   <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Growth Path</h3>
                   <div className="space-y-6">
                      {member.growth.map((g, i) => (
                        <div key={i} className="flex items-start gap-4">
                           <div className={cn(
                             "w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                             g.completed ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 border border-slate-200 shadow-inner"
                           )}>
                              {g.completed && <Award size={14} />}
                           </div>
                           <div className="flex-1">
                              <p className={cn("text-sm font-bold", g.completed ? "text-slate-800" : "text-slate-400")}>{g.step}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{g.date}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </Card>
                <div className="space-y-6">
                   <Card className="rounded-3xl border-slate-100 shadow-sm p-8 space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Primary Serving</h3>
                      <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl">
                         <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                            <Shield size={20} />
                         </div>
                         <div>
                            <p className="font-bold text-slate-800">Ushing Team</p>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Sunday Morning</p>
                         </div>
                      </div>
                   </Card>
                   <Card className="rounded-3xl border-slate-100 shadow-sm p-8 space-y-4 bg-indigo-600 text-white border-none">
                       <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Next Action</h3>
                       <p className="font-bold leading-tight">James is eligible for <span className="text-indigo-200">Leadership Orientation</span></p>
                       <Button className="w-full bg-white text-indigo-600 hover:bg-slate-100 font-black uppercase text-[10px] tracking-widest rounded-xl h-10 border-none">Send Invitation</Button>
                   </Card>

                   <Card className="rounded-3xl border-slate-100 shadow-sm p-8 space-y-4 bg-amber-50 border-amber-100">
                       <h3 className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Indian Act Documents</h3>
                       <div className="space-y-3">
                          {[
                            { name: 'Baptism Certificate', status: 'Verified' },
                            { name: 'Declaration Form', status: 'Pending' },
                            { name: 'Identity Proof', status: 'Verified' },
                          ].map((doc, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                               <span className="font-bold text-slate-700">{doc.name}</span>
                               <Badge className={cn(
                                 "text-[9px] uppercase font-black",
                                 doc.status === 'Verified' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                               )} variant="outline">{doc.status}</Badge>
                            </div>
                          ))}
                       </div>
                       <Button variant="outline" className="w-full rounded-xl border-amber-200 text-amber-700 hover:bg-amber-100 h-9 font-bold text-[10px] uppercase tracking-widest">Manage Documents</Button>
                   </Card>
                </div>
             </div>
           )}

           {activeTab === 'activity' && (
             <Card className="rounded-3xl border-slate-100 shadow-sm p-4 animate-in fade-in slide-in-from-bottom-2 duration-400">
                <CardHeader>
                   <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Latest Interactions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   {[
                     { log: 'Checked into Sunday Service', date: 'Yesterday' },
                     { log: 'Attended Small Group', date: '3 days ago' },
                     { log: 'Updated Contact Information', date: '1 week ago' },
                     { log: 'Registered for Easter Event', date: 'Mar 15, 2024' },
                   ].map((log, i) => (
                     <div key={i} className="p-4 rounded-2xl bg-slate-50 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-700">{log.log}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{log.date}</span>
                     </div>
                   ))}
                </CardContent>
             </Card>
           )}
        </div>
      </div>
    </div>
  );
}
