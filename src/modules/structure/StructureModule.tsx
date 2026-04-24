import * as React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  MapPin, 
  Users, 
  LayoutGrid, 
  Network, 
  Plus, 
  MoreVertical,
  ChevronRight,
  GitFork,
  ArrowLeft,
  Calendar,
  Settings,
  Mail,
  Phone
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { cn } from '@/src/lib/utils';
import { ERPModule } from '@/src/types';

const HIERARCHY = [
  { 
    name: 'Main Network', 
    type: 'Organization', 
    children: [
      { 
        id: 'downtown',
        name: 'Downtown Campus', 
        type: 'Branch', 
        leader: 'Dr. Arthur Penhaligon',
        stats: { members: 1240, departments: 8, volunteers: 156 },
        departments: ['Worship', 'Media', 'Youth', 'Admin', 'Hospitality', 'Prayer', 'Men', 'Women'],
        address: '123 Main St, Grace City',
        phone: '+1 (555) 111-2222',
        email: 'downtown@gracecommunity.org'
      },
      { 
        id: 'westside',
        name: 'Westside Campus', 
        type: 'Branch', 
        leader: 'Rev. Sarah Jenkins',
        stats: { members: 840, departments: 6, volunteers: 92 },
        departments: ['Worship', 'Hospitality', 'Children', 'Media', 'Outreach', 'Admin'],
        address: '456 West Blvd, Grace City',
        phone: '+1 (555) 333-4444',
        email: 'westside@gracecommunity.org'
      },
      { 
        id: 'south',
        name: 'South Campus', 
        type: 'Branch', 
        leader: 'Pastor Mike Ross',
        stats: { members: 402, departments: 4, volunteers: 45 },
        departments: ['Worship', 'Outreach', 'Admin', 'Youth'],
        address: '789 South Ave, Grace City',
        phone: '+1 (555) 555-6666',
        email: 'south@gracecommunity.org'
      }
    ]
  }
];

interface StructureModuleProps {
  onModuleChange?: (module: ERPModule) => void;
}

export function StructureModule({ onModuleChange }: StructureModuleProps) {
  const [selectedCampus, setSelectedCampus] = React.useState<typeof HIERARCHY[0]['children'][0] | any | null>(null);
  const [isAddingUnit, setIsAddingUnit] = React.useState(false);

  if (isAddingUnit) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsAddingUnit(false)} className="rounded-full">
            <Plus className="w-5 h-5 rotate-45" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Add New Church Unit</h1>
            <p className="text-sm text-slate-500 font-medium">Define a new branch, campus, or specialized organizational unit.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="md:col-span-2 space-y-6">
              <Card className="rounded-3xl border-slate-100 shadow-sm p-8 space-y-6">
                 <div className="space-y-4">
                    <h3 className="text-sm font-black border-b border-slate-50 pb-2 text-slate-800">Basic Configuration</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Unit Name</label>
                          <input className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. North Point Campus" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Unit Type</label>
                          <select className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20">
                             <option>Main Branch</option>
                             <option>Sub-Campus</option>
                             <option>Specialized Mission</option>
                             <option>Administrative Center</option>
                          </select>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-sm font-black border-b border-slate-50 pb-2 text-slate-800">Financial Setup (India)</h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">UPI ID for Giving</label>
                          <input className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="churchunit@upi" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Bank Account Info</label>
                          <input className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="IFSC / ACC NO" />
                       </div>
                    </div>
                 </div>

                 <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-2xl font-bold mt-4 shadow-xl shadow-indigo-100">Establish Church Unit</Button>
              </Card>
           </div>

           <div className="space-y-6">
              <Card className="rounded-3xl border-none bg-slate-900 text-white p-6 space-y-4">
                 <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Unit Localization</h3>
                 <p className="text-xs text-slate-400 leading-relaxed font-medium">Establishing a unit in India requires a valid trust registration number and separate financial accounting under the main organization.</p>
                 <div className="pt-4 space-y-2">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                       <span className="text-[10px] uppercase font-bold text-indigo-200">Centralized Audit Ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                       <span className="text-[10px] uppercase font-bold text-indigo-200">Legal Compliance Active</span>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  if (selectedCampus) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedCampus(null)}
            className="gap-2 hover:bg-slate-100/50"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Network
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Settings className="w-4 h-4" /> Campus Settings
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700">Manage Units</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-start gap-6 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
                <Building2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">{selectedCampus.name}</h1>
                <div className="flex items-center gap-4 text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {selectedCampus.address}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                  <span className="flex items-center gap-1.5 text-indigo-600"><Calendar className="w-4 h-4" /> Services: Sun 9AM, 11AM</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { label: 'Total Members', value: selectedCampus.stats.members, icon: Users, color: 'indigo' },
                { label: 'Ministry Teams', value: selectedCampus.stats.departments, icon: LayoutGrid, color: 'emerald' },
                { label: 'Active Volunteers', value: selectedCampus.stats.volunteers, icon: Network, color: 'orange' },
              ].map((stat, i) => (
                <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-6 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                    <div className="flex items-center gap-2">
                       <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                       <div className={`w-1.5 h-1.5 rounded-full bg-${stat.color}-500`}></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
               <CardHeader className="border-b border-slate-50 bg-slate-50/50">
                  <CardTitle className="text-lg font-bold">Campus Leadership</CardTitle>
               </CardHeader>
               <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-slate-400 border border-slate-200">
                           {selectedCampus.leader.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                           <p className="text-xl font-bold text-slate-900">{selectedCampus.leader}</p>
                           <p className="text-sm text-slate-500 font-medium tracking-tight">Main Campus Oversight & Spiritual Lead</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="rounded-xl"><Mail className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon" className="rounded-xl"><Phone className="w-4 h-4" /></Button>
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden p-8">
               <div className="flex flex-col md:flex-row gap-8 items-center">
                  <div className="space-y-4 flex-1">
                     <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest">Giving & Donations (UPI)</h3>
                     <p className="text-sm font-medium text-slate-600 leading-relaxed">Dedicated QR code for {selectedCampus.name}. Scan to give tithes, offerings, and donations directly to this unit's account.</p>
                     <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                        <span className="text-xs font-bold text-slate-400">UPI ID:</span>
                        <span className="text-sm font-black text-indigo-600">campus.{selectedCampus.id}@upi</span>
                     </div>
                  </div>
                  <div className="p-4 bg-white rounded-3xl shadow-xl border border-slate-50 flex items-center justify-center">
                     <div className="relative group p-2">
                        <QRCodeSVG value={`upi://pay?pa=campus.${selectedCampus.id}@upi&pn=${selectedCampus.name}`} size={160} />
                        <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl cursor-pointer">
                           <Button size="sm" variant="outline" className="text-[10px] uppercase font-black tracking-widest rounded-xl">Download QR</Button>
                        </div>
                     </div>
                  </div>
               </div>
            </Card>

            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">Departments & Teams</h3>
                  <Button variant="ghost" size="sm" className="text-indigo-600 font-bold">Edit Hierarchy</Button>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {selectedCampus.departments.map((dept, i) => (
                    <Card 
                      key={i} 
                      onClick={() => onModuleChange?.('workforce')}
                      className="border border-slate-100 shadow-none hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                    >
                      <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <LayoutGrid className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{dept}</span>
                      </CardContent>
                    </Card>
                  ))}
                  <Card className="border border-dashed border-slate-300 shadow-none hover:border-indigo-400 transition-all cursor-pointer group">
                     <CardContent className="p-4 flex flex-col items-center text-center gap-2 h-full justify-center">
                        <Plus className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" />
                        <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600">New Team</span>
                     </CardContent>
                  </Card>
               </div>
            </div>
          </div>

          <div className="space-y-6">
             <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden border-l-4 border-l-indigo-600">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">Campus Documents</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="divide-y divide-slate-50">
                      {['Operations Manual.pdf', 'Service Checklists.xlsx', 'Volunteer Schedule.xlsx'].map((doc, i) => (
                        <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer group">
                           <span className="text-sm font-medium text-slate-600 group-hover:text-indigo-600">{doc}</span>
                           <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                      ))}
                   </div>
                </CardContent>
             </Card>

             <Card className="rounded-3xl border-slate-100 shadow-sm bg-gradient-to-br from-indigo-50 to-white">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">Weekly Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                         <span>Visitor Retention</span>
                         <span>72%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-indigo-500 w-[72%]" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                         <span>Giving Trends</span>
                         <span className="text-emerald-600">+12.5%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-emerald-500 w-[85%]" />
                      </div>
                   </div>
                   <Button variant="outline" className="w-full text-xs font-bold tracking-widest h-10 uppercase transition-all rounded-xl">Generate Full Report</Button>
                </CardContent>
             </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Church Structure</h1>
          <p className="text-slate-500">Manage campuses, departments, ministries, and leadership hierarchy.</p>
        </div>
        <button 
          onClick={() => setIsAddingUnit(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Unit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {HIERARCHY[0].children.map((campus, idx) => (
            <Card 
              key={idx} 
              onClick={() => setSelectedCampus(campus)}
              className="border-none shadow-sm overflow-hidden group hover:ring-2 hover:ring-indigo-500/20 transition-all cursor-pointer active:scale-[0.99]"
            >
              <div className="bg-slate-50/50 px-6 py-4 flex justify-between items-center border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{campus.name}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{campus.type}</p>
                  </div>
                </div>
                <MoreVertical className="w-4 h-4 text-slate-400" />
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Campus Leader</p>
                    <p className="text-sm font-semibold text-slate-700">{campus.leader}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Total Members</p>
                    <p className="text-sm font-semibold text-slate-700">{campus.stats.members}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Departments</p>
                    <p className="text-sm font-semibold text-slate-700">{campus.stats.departments}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {campus.departments.slice(0, 5).map((dept, di) => (
                    <div key={di} className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xs font-bold text-slate-600 flex items-center gap-2">
                      <LayoutGrid className="w-3 h-3 text-slate-400" />
                      {dept}
                    </div>
                  ))}
                  {campus.departments.length > 5 && (
                    <div className="px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-600">
                      +{campus.departments.length - 5} More
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden bg-indigo-900 text-white rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-3">
                <GitFork className="w-5 h-5 text-indigo-300" />
                Structure Explorer
              </CardTitle>
              <CardDescription className="text-indigo-200/60">Hierarchical view of organizational units.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="relative pl-8 border-l border-indigo-500/30 space-y-8 py-2">
                <div className="relative">
                   <div className="absolute -left-[37px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.5)]"></div>
                   <p className="text-sm font-bold">Global Executive Board</p>
                   <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Master Governance</p>
                </div>
                
                <div className="space-y-8">
                   {HIERARCHY[0].children.map((c, i) => (
                     <div key={i} className="relative">
                        <div className="absolute -left-[37px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-indigo-600 border border-indigo-400"></div>
                        <p 
                          onClick={(e) => { e.stopPropagation(); setSelectedCampus(c); }}
                          className="text-sm font-semibold text-indigo-100 hover:text-white cursor-pointer transition-colors"
                        >
                          {c.name}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {c.departments.slice(0, 2).map((d, di) => (
                            <span key={di} className="text-[9px] px-1.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-indigo-200">{d}</span>
                          ))}
                        </div>
                     </div>
                   ))}
                </div>
              </div>
              
              <Button variant="outline" className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl h-12 font-bold tracking-widest text-[10px] uppercase">
                Export Global Map
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm rounded-3xl">
             <CardHeader className="py-5 border-b border-slate-50">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Network className="w-4 h-4 text-indigo-600" />
                  Key Metrics
                </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <div className="divide-y divide-slate-50 px-2 pb-2">
                   {[
                     { label: 'Active Branches', value: '3', trend: '+0' },
                     { label: 'Ministry Teams', value: '18', trend: '+2' },
                     { label: 'Leader Count', value: '24', trend: '+1' },
                     { label: 'Group Cells', value: '42', trend: '+5' },
                   ].map((s, i) => (
                     <div key={i} className="flex justify-between items-center px-4 py-3 hover:bg-slate-50 transition-colors rounded-xl">
                        <span className="text-xs font-medium text-slate-500">{s.label}</span>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800 leading-none">{s.value}</p>
                          <p className="text-[10px] font-bold text-emerald-500">{s.trend}</p>
                        </div>
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
