import React from 'react';
import { 
  Building2, 
  MapPin, 
  Truck, 
  HardDrive, 
  ShieldAlert, 
  Calendar, 
  Plus, 
  QrCode, 
  ChevronRight,
  MoreVertical,
  ArrowLeft,
  Settings,
  History,
  Wrench,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/src/components/ui/card';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

const ASSETS = [
  { id: 'AST-1042', name: 'South Hall Audio Console', cat: 'Technical', station: 'Downtown', status: 'In Use', value: '$8,400' },
  { id: 'AST-2081', name: 'Church Passenger Van (MH01)', cat: 'Vehicle', station: 'Westside', status: 'Maintenance', value: '$45,000' },
  { id: 'AST-3012', name: 'Main Campus AC Unit 4', cat: 'Facility', station: 'Downtown', status: 'In Use', value: '$12,000' },
  { id: 'AST-4055', name: 'Leadership Laptops (Batch A)', cat: 'IT Assets', station: 'Admin', status: 'Deployed', value: '$18,500' },
];

export function AssetsModule() {
  const [selectedAsset, setSelectedAsset] = React.useState<typeof ASSETS[0] | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);

  if (isScanning) {
    return (
      <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
         <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsScanning(false)} className="rounded-full">
               <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
               <h1 className="text-2xl font-black text-slate-900 tracking-tight">Asset QR Scanner</h1>
               <p className="text-sm text-slate-500 font-medium">Scan an asset label to view details or log maintenance.</p>
            </div>
         </div>

         <Card className="rounded-[3rem] border-none bg-slate-950 text-white p-8 overflow-hidden relative shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
            <div className="relative z-10 space-y-8">
               <div className="aspect-square bg-slate-900 rounded-[2.5rem] border-2 border-slate-800 relative overflow-hidden flex items-center justify-center group shadow-inner">
                  {/* Simulated Scanner View */}
                  <div className="absolute inset-0 bg-indigo-500/5 animate-pulse"></div>
                  <div className="w-[80%] h-[80%] border-2 border-indigo-500/30 rounded-3xl relative">
                     <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-500 rounded-tl-xl"></div>
                     <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-500 rounded-tr-xl"></div>
                     <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-500 rounded-bl-xl"></div>
                     <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-500 rounded-br-xl"></div>
                     
                     {/* Scanning Line Animation */}
                     <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.5)] animate-scan"></div>
                  </div>
                  <div className="absolute bottom-6 flex flex-col items-center gap-2">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Positioning QR Code...</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <Button variant="ghost" className="h-16 rounded-3xl bg-white/5 border-none text-[10px] font-black uppercase tracking-widest hover:bg-white/10">Flashlight Off</Button>
                  <Button variant="ghost" className="h-16 rounded-3xl bg-white/5 border-none text-[10px] font-black uppercase tracking-widest hover:bg-white/10">Upload Image</Button>
               </div>

               <Card className="bg-indigo-600 border-none p-6 rounded-3xl flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-700">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                     <Clock className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-xs font-bold text-indigo-100">Quick Logging Mode</p>
                     <p className="text-sm font-medium">Auto-check out assets upon scanning.</p>
                  </div>
                  <div className="ml-auto w-10 h-5 bg-white/20 rounded-full relative p-1 shadow-inner">
                     <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
               </Card>
            </div>
         </Card>
      </div>
    );
  }

  if (selectedAsset) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedAsset(null)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Registry
          </Button>
          <div className="flex gap-2">
            <Button variant="outline"><Settings className="w-4 h-4 mr-2" /> Asset Settings</Button>
            <Button className="bg-indigo-600"><Wrench className="w-4 h-4 mr-2" /> Schedule Maintenance</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                 <div className="h-48 bg-slate-100 relative group overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=60" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60" 
                      alt="Asset" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                       <div className="space-y-1">
                          <p className="text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-widest">{selectedAsset.id}</p>
                          <h2 className="text-3xl font-black text-white">{selectedAsset.name}</h2>
                       </div>
                    </div>
                 </div>
                 <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Current Value</p>
                       <h3 className="text-2xl font-black text-slate-900 leading-none">{selectedAsset.value}</h3>
                       <p className="text-[10px] text-rose-500 font-bold">-12% depreciation YOY</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Station/Location</p>
                       <h3 className="text-xl font-bold text-slate-800 leading-none">{selectedAsset.station}</h3>
                       <p className="text-[10px] text-slate-400 font-bold">Main Hall &bull; Rack 4</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Service Status</p>
                       <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", selectedAsset.status === 'In Use' ? "bg-emerald-500" : "bg-rose-500")} />
                          <h3 className="text-xl font-bold text-slate-800 leading-none">{selectedAsset.status}</h3>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                 <CardHeader className="py-5 border-b border-slate-50 flex flex-row items-center justify-between px-8 bg-slate-50/30">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                       <History className="w-5 h-5 text-indigo-500" />
                       Maintenance & History
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                       {[
                         { title: 'Bi-annual Performance Calibration', date: 'Mar 12, 2024', tech: 'John Tech', cost: '$150.00', status: 'Completed' },
                         { title: 'Firmware Update v2.1.4', date: 'Jan 28, 2024', tech: 'Remote System', cost: '--', status: 'Automated' },
                         { title: 'Emergency Capacitor Replacement', date: 'Dec 04, 2023', tech: 'Apex Electronics', cost: '$420.00', status: 'Completed' },
                       ].map((log, i) => (
                         <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                            <div className="space-y-1">
                               <p className="font-bold text-slate-800 text-sm">{log.title}</p>
                               <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  <span>{log.date}</span>
                                  <span>&bull;</span>
                                  <span>{log.tech}</span>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="font-bold text-slate-900 text-sm">{log.cost}</p>
                               <Badge variant="outline" className="text-[10px] font-bold bg-white">{log.status}</Badge>
                            </div>
                         </div>
                       ))}
                    </div>
                 </CardContent>
              </Card>
           </div>

           <div className="space-y-6">
              <Card className="rounded-3xl border-slate-100 shadow-sm p-6 overflow-hidden relative group cursor-pointer border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/10 transition-all">
                 <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                       <QrCode className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-slate-800">Print Asset ID</h3>
                    <p className="text-xs text-slate-500">Generate a unique QR code label for this physical asset.</p>
                 </div>
              </Card>

              <Card className="rounded-3xl border-slate-100 shadow-sm bg-slate-900 text-white p-6 space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                       <Clock className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Upcoming Service</p>
                       <p className="text-sm font-bold">April 15, 2024</p>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                       <span className="text-slate-400">Component Health</span>
                       <span className="text-emerald-400">88%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 w-[88%]" />
                    </div>
                 </div>
                 <Button className="w-full bg-indigo-500 hover:bg-indigo-400 h-11 rounded-xl uppercase tracking-widest font-black text-[10px]">Add Log Entry</Button>
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Asset & Facility Management</h1>
          <p className="text-slate-500">Registry, room booking, depreciation tracking, and maintenance workflows.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsScanning(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 leading-none shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            Scanner
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md transition-all active:scale-95 leading-none">
            <Plus className="w-4 h-4" />
            New Asset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
           { label: 'Total Asset Value', val: '$2.8M', icon: Building2, color: 'blue' },
           { label: 'Maintenance Pending', val: '4', icon: ShieldAlert, color: 'rose' },
           { label: 'Vehicle Logs', val: '12 Active', icon: Truck, color: 'amber' },
           { label: 'Room Occupancy', val: '84%', icon: MapPin, color: 'indigo' },
         ].map((stat, i) => (
           <Card key={i} className="border-none shadow-sm h-full hover:shadow-md transition-shadow group cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                 <div className={cn(
                   "w-10 h-10 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm",
                   stat.color === 'blue' ? "bg-blue-50 text-blue-600" :
                   stat.color === 'rose' ? "bg-rose-50 text-rose-600" :
                   stat.color === 'amber' ? "bg-amber-50 text-amber-600" :
                   "bg-indigo-50 text-indigo-600"
                 )}>
                    <stat.icon size={20} />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                    <p className="text-lg font-bold text-slate-800 leading-none">{stat.val}</p>
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
            <CardHeader className="py-5 border-b border-slate-50 flex flex-row items-center justify-between">
               <CardTitle className="text-lg font-bold">Unified Asset Registry</CardTitle>
               <button className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all">Export Registry</button>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans">
                     <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                           <th className="px-6 py-3">ID / Name</th>
                           <th className="px-6 py-3">Category</th>
                           <th className="px-6 py-3">Location</th>
                           <th className="px-6 py-3">Status</th>
                           <th className="px-6 py-3 text-right">Value</th>
                           <th className="px-6 py-3"></th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 text-sm">
                        {ASSETS.map((asset) => (
                          <tr 
                            key={asset.id} 
                            onClick={() => setSelectedAsset(asset)}
                            className="hover:bg-slate-50/50 transition-colors group cursor-pointer active:bg-slate-100"
                          >
                             <td className="px-6 py-4">
                                <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{asset.name}</p>
                                <p className="text-[10px] font-mono text-slate-400 tracking-tighter">{asset.id}</p>
                             </td>
                             <td className="px-6 py-4">
                                <Badge variant="outline" className="text-[10px] font-bold text-slate-400 rounded-lg group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">{asset.cat}</Badge>
                             </td>
                             <td className="px-6 py-4 text-slate-500 font-medium">{asset.station}</td>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5">
                                   <div className={cn("w-2 h-2 rounded-full shadow-sm", asset.status === 'In Use' ? "bg-emerald-500" : asset.status === 'Maintenance' ? "bg-rose-500" : "bg-blue-500")}></div>
                                   <span className="text-xs font-semibold text-slate-600">{asset.status}</span>
                                </div>
                             </td>
                             <td className="px-6 py-4 text-right font-black text-slate-900 font-mono tracking-tight">{asset.value}</td>
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

         <div className="space-y-6">
            <Card className="border-none shadow-sm flex flex-col h-[330px] rounded-3xl overflow-hidden">
               <CardHeader className="py-5 border-b border-slate-50 bg-slate-50/30">
                  <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-widest">Upcoming Bookings</CardTitle>
               </CardHeader>
               <CardContent className="flex-1 p-0 overflow-y-auto">
                  <div className="divide-y divide-slate-50">
                     {[
                       { room: 'Main Sanctuary', event: 'Worship Practice', time: '14:00 - 16:30' },
                       { room: 'Conference Room B', event: 'Elders Meeting', time: '18:00 - 20:00' },
                       { room: 'Multi-purpose Hall', event: 'Youth Bible Study', time: '17:00 - 19:00' },
                     ].map((b, i) => (
                        <div key={i} className="p-5 hover:bg-slate-50 transition-all cursor-pointer group border-l-2 border-transparent hover:border-indigo-500">
                           <div className="flex justify-between items-start mb-1">
                              <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{b.room}</p>
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{b.time}</span>
                           </div>
                           <p className="text-[11px] font-medium text-slate-500 leading-tight">{b.event}</p>
                        </div>
                     ))}
                  </div>
               </CardContent>
               <div className="p-4 border-t border-slate-50 bg-slate-50/30">
                  <button className="w-full py-3 border border-dashed border-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all active:scale-95">Quick Reserve</button>
               </div>
            </Card>

            <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative rounded-3xl group cursor-pointer hover:bg-indigo-700 transition-colors">
               <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)]"></div>
               <CardHeader className="relative z-10">
                  <CardTitle className="text-sm font-bold">Depreciation Engine</CardTitle>
                  <CardDescription className="text-indigo-100/70 font-medium">Fiscal integrity monitoring active</CardDescription>
               </CardHeader>
               <CardContent className="relative z-10 text-sm space-y-4 pt-0">
                  <p className="text-[11px] leading-relaxed text-indigo-100">Automatic SLM/WDV calculation syncs with financial ledgers every 24 hours.</p>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] pt-2 border-t border-white/10 mt-4">
                     <span className="text-indigo-200">Next Run</span>
                     <span className="text-white">04:00 AM</span>
                  </div>
                  <button className="w-full py-3 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-900/40 active:scale-95 transition-all">Recalculate Now</button>
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
