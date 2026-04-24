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
  const [view, setView] = React.useState<'list' | 'details' | 'create' | 'maintenance'>('list');
  const [selectedAsset, setSelectedAsset] = React.useState<typeof ASSETS[0] | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);

  const handleAssetClick = (asset: typeof ASSETS[0]) => {
    setSelectedAsset(asset);
    setView('details');
  };

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

  if (view === 'create') {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView('list')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Register New Asset</h1>
            <p className="text-sm text-slate-500 font-medium">Inventory intake for technical, facility, or transport resources.</p>
          </div>
        </div>

        <Card className="rounded-[2.5rem] border-none shadow-2xl p-8 space-y-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 -mr-16 -mt-16 rounded-full group-hover:bg-indigo-50 transition-colors"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Asset Name</label>
              <input type="text" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="e.g. Master Audio Console" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Category</label>
              <select className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 appearance-none transition-all">
                <option>Technical Equipment</option>
                <option>Facility / Infrastructure</option>
                <option>Motor Vehicles</option>
                <option>IT & Electronics</option>
                <option>Furniture & Fixtures</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Initial Value (INR)</label>
              <input type="number" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="50000" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Asset ID (System Auto)</label>
              <div className="w-full h-14 bg-slate-100/50 border-2 border-dashed border-slate-200 rounded-2xl px-6 flex items-center font-mono font-bold text-slate-400 italic">
                AST-{Math.floor(Math.random() * 9000) + 1000} (Pending)
              </div>
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Station / Location Assignment</label>
            <div className="grid grid-cols-4 gap-3">
              {['Downtown', 'Westside', 'Main Campus', 'Admin'].map(loc => (
                <button key={loc} className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 font-bold text-[10px] uppercase tracking-widest text-slate-600 border border-slate-100 transition-all active:scale-95">{loc}</button>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-4">
             <Button className="flex-1 h-16 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-200" onClick={() => setView('list')}>Confirm & Register</Button>
             <Button variant="ghost" className="px-8 h-16 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em]" onClick={() => setView('list')}>Discard</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (view === 'maintenance' && selectedAsset) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView('details')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Maintenance Schedule</h1>
            <p className="text-sm text-slate-500 font-medium">Log service activities or schedule future maintenance for {selectedAsset.name}.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="md:col-span-2 rounded-[2.5rem] border-none shadow-2xl p-8 space-y-8 text-left">
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Service Type</label>
                    <div className="flex gap-2">
                       {['Routine', 'Emergency', 'Upgrade', 'Inspection'].map(t => (
                         <button key={t} className="flex-1 py-3 px-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-tight text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all">{t}</button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Description of Work</label>
                    <textarea className="w-full min-h-32 bg-slate-50 border-none rounded-2xl p-6 font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Detail the maintenance required or performed..."></textarea>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Scheduled Date</label>
                       <input type="date" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estimate / Cost</label>
                       <input type="number" className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="INR" />
                    </div>
                 </div>

                 <Button className="w-full h-16 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-200" onClick={() => setView('details')}>Plan Maintenance</Button>
              </div>
           </Card>

           <div className="space-y-6">
              <Card className="rounded-[2.5rem] bg-slate-900 text-white p-6 space-y-4">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Wrench className="w-6 h-6" />
                 </div>
                 <h3 className="font-bold text-lg">Health Index</h3>
                 <p className="text-xs text-slate-400">Current maintenance status reflects a priority level of "Normal".</p>
                 <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                       <span>Wear Level</span>
                       <span>24%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 w-[24%]" />
                    </div>
                 </div>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-sm p-6 text-left">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Recommended Tasks</h4>
                 <div className="space-y-3">
                    {['Oil Change (Vehicle)', 'Filter Cleaning (HVAC)', 'Bulb Replacement', 'Brake Check'].map((task, i) => (
                       <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl group cursor-pointer hover:bg-slate-100 transition-all">
                          <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors"></div>
                          <span className="text-xs font-bold text-slate-600">{task}</span>
                       </div>
                    ))}
                 </div>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  if (view === 'details' && selectedAsset) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setView('list')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Registry
          </Button>
          <div className="flex gap-2">
            <Button variant="outline"><Settings className="w-4 h-4 mr-2" /> Asset Settings</Button>
            <Button className="bg-indigo-600" onClick={() => setView('maintenance')}><Wrench className="w-4 h-4 mr-2" /> Schedule Maintenance</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6 text-left">
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
              <Card className="rounded-3xl border-slate-100 shadow-sm p-6 overflow-hidden relative group cursor-pointer border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/10 transition-all text-center">
                 <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                       <QrCode className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-slate-800">Print Asset ID</h3>
                    <p className="text-xs text-slate-500">Generate a unique QR code label for this physical asset.</p>
                 </div>
              </Card>

              <Card className="rounded-3xl border-slate-100 shadow-sm bg-slate-900 text-white p-6 space-y-6 text-left">
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
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Resource Control</h1>
          <p className="text-slate-500 font-medium">Enterprise asset registry, facility bookings, and maintenance lifecycle management.</p>
        </div>
        <div className="flex gap-3 relative z-10">
          <Button 
            variant="outline"
            onClick={() => setIsScanning(true)}
            className="flex items-center gap-3 px-6 h-12 bg-white border border-slate-200 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            <QrCode className="w-4 h-4" />
            Launch Scanner
          </Button>
          <Button 
            onClick={() => setView('create')}
            className="flex items-center gap-3 px-6 h-12 bg-indigo-600 text-white rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Asset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
           { label: 'Total Asset Value', val: '$2.8M', icon: Building2, color: 'blue' },
           { label: 'Maintenance Pending', val: '4', icon: ShieldAlert, color: 'rose' },
           { label: 'Vehicle Logs', val: '12 Active', icon: Truck, color: 'amber' },
           { label: 'Room Occupancy', val: '84%', icon: MapPin, color: 'indigo' },
         ].map((stat, i) => (
           <Card key={i} className="border-none shadow-sm h-full hover:shadow-xl transition-all group cursor-pointer bg-white rounded-[2rem] p-4">
              <CardContent className="p-2 flex items-center gap-5">
                 <div className={cn(
                   "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm",
                   stat.color === 'blue' ? "bg-blue-50 text-blue-600 shadow-blue-100" :
                   stat.color === 'rose' ? "bg-rose-50 text-rose-600 shadow-rose-100" :
                   stat.color === 'amber' ? "bg-amber-50 text-amber-600 shadow-amber-100" :
                   "bg-indigo-50 text-indigo-600 shadow-indigo-100"
                 )}>
                    <stat.icon size={22} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
                    <p className="text-2xl font-black text-slate-900 leading-none">{stat.val}</p>
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden rounded-[2.5rem]">
            <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between bg-white">
               <div>
                  <CardTitle className="text-xl font-black text-slate-900 tracking-tight">Unified Asset Registry</CardTitle>
                  <CardDescription className="text-slate-500 font-medium pt-1">42 Total items across all regions</CardDescription>
               </div>
               <button className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-5 py-2.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95">Export Registry</button>
            </CardHeader>
            <CardContent className="p-0">
               <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans">
                     <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                           <th className="px-8 py-5">ID / Name</th>
                           <th className="px-6 py-5">Category</th>
                           <th className="px-6 py-5">Location</th>
                           <th className="px-6 py-5 text-right">Value</th>
                           <th className="px-8 py-5"></th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 text-sm">
                        {ASSETS.map((asset) => (
                          <tr 
                            key={asset.id} 
                            onClick={() => handleAssetClick(asset)}
                            className="hover:bg-slate-50 group cursor-pointer active:bg-slate-100 transition-all border-l-4 border-l-transparent hover:border-l-indigo-600"
                          >
                             <td className="px-8 py-5">
                                <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors text-base">{asset.name}</p>
                                <p className="text-[10px] font-mono font-bold text-slate-400 tracking-tighter uppercase">{asset.id}</p>
                             </td>
                             <td className="px-6 py-5">
                                <Badge variant="outline" className="text-[9px] font-black p-2 px-3 tracking-widest text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">{asset.cat}</Badge>
                             </td>
                             <td className="px-6 py-5 text-slate-500 font-bold text-xs">{asset.station}</td>
                             <td className="px-6 py-5 text-right font-black text-slate-900 font-mono tracking-tighter text-base">{asset.value}</td>
                             <td className="px-8 py-5 text-right">
                                <button className="p-2 rounded-xl text-slate-200 group-hover:text-indigo-400 hover:bg-slate-100 transition-all">
                                   <MoreVertical size={18} />
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
            <Card className="border-none shadow-sm flex flex-col h-[380px] rounded-[2.5rem] overflow-hidden bg-white text-left">
               <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/10">
                  <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">Facility Schedule</CardTitle>
               </CardHeader>
               <CardContent className="flex-1 p-0 overflow-y-auto">
                  <div className="divide-y divide-slate-50">
                     {[
                       { room: 'Main Sanctuary', event: 'Worship Practice', time: '14:00 - 16:30' },
                       { room: 'Conference Room B', event: 'Elders Meeting', time: '18:00 - 20:00' },
                       { room: 'Multi-purpose Hall', event: 'Youth Bible Study', time: '17:00 - 19:00' },
                     ].map((b, i) => (
                        <div key={i} className="p-6 hover:bg-slate-50 transition-all cursor-pointer group border-l-4 border-l-transparent hover:border-l-indigo-500">
                           <div className="flex justify-between items-start mb-2">
                              <p className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{b.room}</p>
                              <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">{b.time}</span>
                           </div>
                           <p className="text-[11px] font-bold text-slate-400 leading-tight uppercase tracking-widest">{b.event}</p>
                        </div>
                     ))}
                  </div>
               </CardContent>
               <div className="p-8 border-t border-slate-50 bg-slate-50/10">
                  <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all active:scale-95">Quick Reserve Room</button>
               </div>
            </Card>

            <Card className="border-none shadow-2xl bg-slate-900 text-white overflow-hidden relative rounded-[2.5rem] group cursor-pointer hover:bg-slate-950 transition-all text-left">
               <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent)]"></div>
               <CardHeader className="relative z-10 p-8 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/20">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-black tracking-tight">Depreciation Engine</CardTitle>
                  <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Fiscal integrity module active</CardDescription>
               </CardHeader>
               <CardContent className="relative z-10 text-sm space-y-6 pt-0 p-8">
                  <p className="text-[12px] leading-relaxed text-slate-300 font-medium">Automatic SLM/WDV calculation syncs with financial ledgers every 24 hours.</p>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] pt-4 border-t border-white/5">
                     <span className="text-slate-500">Last Sync</span>
                     <span className="text-indigo-400">4h ago</span>
                  </div>
                  <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 active:scale-95 transition-all hover:bg-indigo-500">Run Recalculation</button>
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}
