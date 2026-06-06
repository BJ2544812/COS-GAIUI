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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { formatCurrencyAmount } from '@/lib/formatCurrency';
import { useSettings } from '@/context/SettingsContext';
import { DocumentsModule } from '../documents/DocumentsModule';
import { PageLayout, ModuleHeader, ActionButton } from '@/components/modules/ModuleHeader';
import { ModuleTabs } from '@/components/modules/ModuleTabs';

const EMPTY_FORM = { name: '', category: 'Technical Equipment', value: '', location: '', serialNumber: '', notes: '', status: 'Active' };

export function AssetsModule({ embedded = false }: { embedded?: boolean } = {}) {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = React.useState<'assets' | 'documents'>('assets');
  const [view, setView] = React.useState<'list' | 'details' | 'create' | 'maintenance'>('list');
  const [selectedAsset, setSelectedAsset] = React.useState<any | null>(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const [rows, setRows] = React.useState<any[]>([]);
  const [assetsError, setAssetsError] = React.useState<string | null>(null);
  const [stats, setStats] = React.useState({ total: 0, totalValue: 0, active: 0, maintenance: 0 });
  const [formState, setFormState] = React.useState(EMPTY_FORM);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [maintenanceForm, setMaintenanceForm] = React.useState({ serviceType: 'Routine', description: '', scheduledAt: '', cost: '', technician: '' });
  const [maintenanceLogs, setMaintenanceLogs] = React.useState<any[]>([]);
  const [maintenanceError, setMaintenanceError] = React.useState<string | null>(null);
  const [maintenanceSubmitting, setMaintenanceSubmitting] = React.useState(false);

  const fetchAssets = React.useCallback(async () => {
    try {
      setAssetsError(null);
      const json = await apiRequest<unknown>('assets', { method: 'GET' });
      const list = parseApiResponse<any[]>(json);
      setRows(list);
    } catch (e) {
      setAssetsError(formatApiError(e));
    }
  }, []);

  const fetchStats = React.useCallback(async () => {
    try {
      const json = await apiRequest<unknown>('assets/stats');
      const s = parseApiResponse<any>(json);
      setStats(s);
    } catch { /* stats are non-critical */ }
  }, []);

  React.useEffect(() => {
    if (activeTab === 'assets') {
      fetchAssets();
      fetchStats();
    }
  }, [activeTab, fetchAssets, fetchStats]);

  const handleAssetClick = async (asset: any) => {
    setSelectedAsset(asset);
    setView('details');
    try {
      const json = await apiRequest<unknown>(`assets/${asset.id}/maintenance`);
      const logs = parseApiResponse<any[]>(json);
      setMaintenanceLogs(logs);
    } catch {
      setMaintenanceLogs([]);
    }
  };

  const handleCreate = async () => {
    if (!formState.name) { setFormError('Asset name is required'); return; }
    if (!formState.value) { setFormError('Asset value is required'); return; }
    setSubmitting(true);
    setFormError(null);
    try {
      await apiRequest('assets', { method: 'POST', body: formState });
      setFormState(EMPTY_FORM);
      setView('list');
      fetchAssets();
      fetchStats();
    } catch (e) {
      setFormError(formatApiError(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMaintenanceSubmit = async () => {
    if (!maintenanceForm.description) { setMaintenanceError('Description is required'); return; }
    if (!selectedAsset) return;
    setMaintenanceSubmitting(true);
    setMaintenanceError(null);
    try {
      await apiRequest(`assets/${selectedAsset.id}/maintenance`, { method: 'POST', body: maintenanceForm });
      setView('details');
      const json = await apiRequest<unknown>(`assets/${selectedAsset.id}/maintenance`);
      setMaintenanceLogs(parseApiResponse<any[]>(json));
    } catch (e) {
      setMaintenanceError(formatApiError(e));
    } finally {
      setMaintenanceSubmitting(false);
    }
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
            <div className="absolute inset-0 bg-gradient-to-br from-[color-mix(in_oklab,var(--brand-primary)12%,transparent)] to-transparent"></div>
            <div className="relative z-10 space-y-8">
               <div className="aspect-square bg-slate-900 rounded-[2.5rem] border-2 border-slate-800 relative overflow-hidden flex items-center justify-center group shadow-inner">
                  {/* Simulated Scanner View */}
                  <div className="absolute inset-0 bg-[var(--chart-primary)]/5 animate-pulse"></div>
                  <div className="w-[80%] h-[80%] border-2 border-[color:var(--brand-primary)]/30 rounded-3xl relative">
                     <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[color:var(--brand-primary)] rounded-tl-xl"></div>
                     <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[color:var(--brand-primary)] rounded-tr-xl"></div>
                     <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[color:var(--brand-primary)] rounded-bl-xl"></div>
                     <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[color:var(--brand-primary)] rounded-br-xl"></div>
                     
                     {/* Scanning Line Animation */}
                     <div className="absolute top-0 left-0 w-full h-1 bg-[var(--chart-primary)] shadow-[0_0_20px_rgba(0,0,0,0.15)] animate-scan" />
                  </div>
                  <div className="absolute bottom-6 flex flex-col items-center gap-2">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--brand-secondary)]">Positioning QR Code...</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <Button variant="ghost" className="h-16 rounded-3xl bg-white/5 border-none text-[10px] font-black uppercase tracking-widest hover:bg-white/10">Flashlight Off</Button>
                  <Button variant="ghost" className="h-16 rounded-3xl bg-white/5 border-none text-[10px] font-black uppercase tracking-widest hover:bg-white/10">Upload Image</Button>
               </div>

               <Card className="bg-[var(--brand-primary)] border-none p-6 rounded-3xl flex items-center gap-4 animate-in slide-in-from-bottom-2 duration-700">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                     <Clock className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-xs font-bold text-white/90">Quick Logging Mode</p>
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
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 -mr-16 -mt-16 rounded-full group-hover:bg-[color-mix(in_oklab,var(--brand-primary)8%,white)] transition-colors"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Asset Name *</label>
              <input type="text" value={formState.name} onChange={e => setFormState(s => ({...s, name: e.target.value}))} className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-[color:var(--brand-primary)] transition-all" placeholder="e.g. Master Audio Console" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Category</label>
              <select value={formState.category} onChange={e => setFormState(s => ({...s, category: e.target.value}))} className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-[color:var(--brand-primary)] appearance-none transition-all">
                <option>Technical Equipment</option>
                <option>Facility / Infrastructure</option>
                <option>Motor Vehicles</option>
                <option>IT & Electronics</option>
                <option>Furniture & Fixtures</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Initial Value ({settings.financial.currency}) *</label>
              <input type="number" value={formState.value} onChange={e => setFormState(s => ({...s, value: e.target.value}))} className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-[color:var(--brand-primary)] transition-all" placeholder="50000" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Location / Station</label>
              <input type="text" value={formState.location} onChange={e => setFormState(s => ({...s, location: e.target.value}))} className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-[color:var(--brand-primary)] transition-all" placeholder="e.g. Main Hall - Rack 4" />
            </div>
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Serial Number</label>
            <input type="text" value={formState.serialNumber} onChange={e => setFormState(s => ({...s, serialNumber: e.target.value}))} className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-[color:var(--brand-primary)] transition-all" placeholder="e.g. SN-2024-001" />
          </div>

          {formError && <p className="text-sm text-rose-600 font-medium">{formError}</p>}
          <div className="pt-4 flex gap-4">
             <Button disabled={submitting} className="flex-1 h-16 rounded-[2rem] bg-[var(--brand-primary)] hover:opacity-90 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200" onClick={handleCreate}>{submitting ? 'Registering...' : 'Confirm & Register'}</Button>
             <Button variant="ghost" className="px-8 h-16 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em]" onClick={() => { setView('list'); setFormState(EMPTY_FORM); setFormError(null); }}>Discard</Button>
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
                         <button key={t} onClick={() => setMaintenanceForm(s => ({...s, serviceType: t}))} className={cn("flex-1 py-3 px-2 rounded-xl border text-[10px] font-black uppercase tracking-tight transition-all", maintenanceForm.serviceType === t ? "bg-[var(--brand-primary)] text-white border-[color:var(--brand-primary)]" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100")}>{t}</button>
                       ))}
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Description of Work *</label>
                    <textarea value={maintenanceForm.description} onChange={e => setMaintenanceForm(s => ({...s, description: e.target.value}))} className="w-full min-h-32 bg-slate-50 border-none rounded-2xl p-6 font-medium text-slate-900 focus:ring-2 focus:ring-[color:var(--brand-primary)] transition-all" placeholder="Detail the maintenance required or performed..."></textarea>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Scheduled Date</label>
                       <input type="date" value={maintenanceForm.scheduledAt} onChange={e => setMaintenanceForm(s => ({...s, scheduledAt: e.target.value}))} className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-[color:var(--brand-primary)] transition-all" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estimate / Cost</label>
                       <input type="number" value={maintenanceForm.cost} onChange={e => setMaintenanceForm(s => ({...s, cost: e.target.value}))} className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-[color:var(--brand-primary)] transition-all" placeholder="Amount" />
                    </div>
                 </div>
                 {maintenanceError && <p className="text-sm text-rose-600 font-medium">{maintenanceError}</p>}
                 <Button disabled={maintenanceSubmitting} className="w-full h-16 rounded-[2rem] bg-[var(--brand-primary)] hover:opacity-90 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200" onClick={handleMaintenanceSubmit}>{maintenanceSubmitting ? 'Saving...' : 'Plan Maintenance'}</Button>
              </div>
           </Card>

           <div className="space-y-6">
              <Card className="rounded-[2.5rem] bg-slate-900 text-white p-6 space-y-4">
                 <div className="w-12 h-12 rounded-2xl bg-[var(--chart-primary)]/20 flex items-center justify-center text-[var(--brand-secondary)]">
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
                          <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-[var(--chart-primary)] transition-colors"></div>
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
            <Button className="bg-[var(--brand-primary)]" onClick={() => setView('maintenance')}><Wrench className="w-4 h-4 mr-2" /> Schedule Maintenance</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6 text-left">
              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                 <div className="h-48 bg-gradient-to-br from-slate-800 via-slate-700 to-indigo-900 relative group overflow-hidden">
                    {selectedAsset.imageUrl ? (
                      <img
                        src={selectedAsset.imageUrl}
                        className="w-full h-full object-cover opacity-90"
                        alt=""
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                       <div className="space-y-1">
                          <p className="text-[10px] font-mono font-bold text-[color:var(--brand-primary)]/80 uppercase tracking-widest">{selectedAsset.id}</p>
                          <h2 className="text-3xl font-black text-white">{selectedAsset.name}</h2>
                       </div>
                    </div>
                 </div>
                 <CardContent className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Current Value</p>
                       <h3 className="text-2xl font-black text-slate-900 leading-none">{selectedAsset.value}</h3>
                       <p className="text-[10px] text-slate-500 font-medium">Recorded asset value</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Station/Location</p>
                       <h3 className="text-xl font-bold text-slate-800 leading-none">{selectedAsset.station || selectedAsset.location || '—'}</h3>
                       <p className="text-[10px] text-slate-400 font-bold">{selectedAsset.location || selectedAsset.serialNumber || '—'}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Service Status</p>
                       <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", selectedAsset.status === 'In Use' ? "bg-emerald-500" : "bg-rose-500")} />
                          <h3 className="text-xl font-bold text-slate-800 leading-none">{selectedAsset.status}</h3>
                       </div>
                    </div>
                 </CardContent>
                 <div className="border-t border-slate-50 grid grid-cols-1 md:grid-cols-4 gap-4 px-8 py-6 bg-slate-50/30 text-xs">
                    <p>Accum. Depreciation: <span className="font-bold">{formatCurrencyAmount(selectedAsset.accumulatedDepreciation || 0, settings.financial.currency, { maximumFractionDigits: 0 })}</span></p>
                    <p>Residual Value: <span className="font-bold">{formatCurrencyAmount(selectedAsset.residualValue || 0, settings.financial.currency, { maximumFractionDigits: 0 })}</span></p>
                    <p>Useful Life: <span className="font-bold">{selectedAsset.usefulLifeMonths || '—'} months</span></p>
                    <p>Depreciation Method: <span className="font-bold">{selectedAsset.depreciationMethod || '—'}</span></p>
                 </div>
              </Card>

              <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden">
                 <CardHeader className="py-5 border-b border-slate-50 flex flex-row items-center justify-between px-8 bg-slate-50/30">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                       <History className="w-5 h-5 text-[color:var(--brand-primary)]" />
                       Maintenance & History
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                       {maintenanceLogs.length === 0 && (
                         <div className="px-8 py-10 text-center text-sm text-slate-400 font-medium">No maintenance logs yet. Schedule the first service above.</div>
                       )}
                       {maintenanceLogs.map((log: any, i: number) => (
                         <div key={i} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                            <div className="space-y-1">
                               <p className="font-bold text-slate-800 text-sm">{log.serviceType} — {log.description.slice(0, 60)}{log.description.length > 60 ? '...' : ''}</p>
                               <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                                  {log.technician && <><span>&bull;</span><span>{log.technician}</span></>}
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="font-bold text-slate-900 text-sm">{log.cost ? formatCurrencyAmount(log.cost, settings.financial.currency, { maximumFractionDigits: 0 }) : '—'}</p>
                               <Badge variant="outline" className="text-[10px] font-bold bg-white">{log.status}</Badge>
                            </div>
                         </div>
                       ))}
                    </div>
                 </CardContent>
              </Card>
           </div>

           <div className="space-y-6">
              <Card className="rounded-3xl border-slate-100 shadow-sm p-6 overflow-hidden relative group cursor-pointer border-2 border-dashed border-slate-200 hover:border-[color:var(--brand-primary)] hover:bg-[color-mix(in_oklab,var(--brand-primary)6%,white)] transition-all text-center">
                 <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[var(--brand-primary)] group-hover:text-white transition-all shadow-sm">
                       <QrCode className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-slate-800">Print Asset ID</h3>
                    <p className="text-xs text-slate-500">Generate a unique QR code label for this physical asset.</p>
                 </div>
              </Card>

              <Card className="rounded-3xl border-slate-100 shadow-sm bg-slate-900 text-white p-6 space-y-6 text-left">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                       <Clock className="w-5 h-5 text-[var(--brand-secondary)]" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-[color:var(--brand-primary)]/80 uppercase tracking-widest">Upcoming Service</p>
                       <p className="text-sm font-bold">April 15, 2024</p>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                       <span className="text-slate-400">Component Health</span>
                       <span className="text-emerald-400">88%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-[var(--chart-primary)] w-[88%]" />
                    </div>
                 </div>
                 <Button className="w-full bg-[var(--chart-primary)] hover:opacity-90 h-11 rounded-xl uppercase tracking-widest font-black text-[10px]">Add Log Entry</Button>
              </Card>
           </div>
        </div>
      </div>
    );
  }

  return (
    <PageLayout>
      {!embedded && (
      <ModuleHeader
        title="Assets & documents"
        subtitle="Equipment registry, assignments, and linked documents."
        icon={Building2}
        actions={
          view === 'list' && activeTab === 'assets' ? (
            <ActionButton label="Add asset" icon={Plus} variant="primary" onClick={() => setView('create')} />
          ) : undefined
        }
      />
      )}
      {embedded && view === 'list' && activeTab === 'assets' && (
        <div className="flex justify-end mb-4">
          <ActionButton label="Add asset" icon={Plus} variant="primary" onClick={() => setView('create')} />
        </div>
      )}
      {assetsError && <p className="text-sm text-rose-600 font-medium">{assetsError}</p>}
      {!embedded && (
      <ModuleTabs
        tabs={[
          { id: 'assets', label: 'Physical assets' },
          { id: 'documents', label: 'Documents' },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as 'assets' | 'documents')}
        aria-label="Assets sections"
      />
      )}

      {!embedded && activeTab === 'documents' ? (
        <DocumentsModule />
      ) : (
      <>
      <div className="flex justify-between items-center mt-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Asset Dashboard</h2>
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
            className="flex items-center gap-3 px-6 h-12 bg-[var(--brand-primary)] text-white rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest hover:opacity-90 shadow-xl shadow-slate-200 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Asset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
           { label: 'Total Asset Value', val: formatCurrencyAmount(stats.totalValue, settings.financial.currency, { maximumFractionDigits: 0 }), icon: Building2, color: 'blue' },
           { label: 'Maintenance Pending', val: String(stats.maintenance), icon: ShieldAlert, color: 'rose' },
           { label: 'Total Assets', val: String(stats.total), icon: Truck, color: 'amber' },
           { label: 'Active Assets', val: String(stats.active), icon: MapPin, color: 'brand' },
         ].map((stat, i) => (
           <Card key={i} className="border-none shadow-sm h-full hover:shadow-xl transition-all group cursor-pointer bg-white rounded-[2rem] p-4">
              <CardContent className="p-2 flex items-center gap-5">
                 <div className={cn(
                   "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm",
                   stat.color === 'blue' ? "bg-blue-50 text-blue-600 shadow-blue-100" :
                   stat.color === 'rose' ? "bg-rose-50 text-rose-600 shadow-rose-100" :
                   stat.color === 'amber' ? "bg-amber-50 text-amber-600 shadow-amber-100" :
                   stat.color === 'brand' ? "bg-[color-mix(in_oklab,var(--brand-primary)12%,white)] text-[color:var(--brand-primary)] shadow-slate-100" :
                   "bg-slate-50 text-slate-600"
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
                  <CardDescription className="text-slate-500 font-medium pt-1">{stats.total} Total items registered</CardDescription>
               </div>
               <button className="text-[10px] font-black uppercase tracking-widest text-[color:var(--brand-primary)] bg-[color-mix(in_oklab,var(--brand-primary)12%,white)] px-5 py-2.5 rounded-xl hover:bg-[var(--brand-primary)] hover:text-white transition-all active:scale-95">Export Registry</button>
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
                        {rows.length === 0 && !assetsError && (
                          <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">No assets registered yet. Click "New Asset" to get started.</td></tr>
                        )}
                        {rows.map((asset: any) => (
                          <tr 
                            key={asset.id} 
                            onClick={() => handleAssetClick(asset)}
                            className="hover:bg-slate-50 group cursor-pointer active:bg-slate-100 transition-all border-l-4 border-l-transparent hover:border-l-[color:var(--brand-primary)]"
                          >
                             <td className="px-8 py-5">
                                <p className="font-bold text-slate-800 group-hover:text-[color:var(--brand-primary)] transition-colors text-base">{asset.name}</p>
                                <p className="text-[10px] font-mono font-bold text-slate-400 tracking-tighter uppercase">{asset.id.slice(0,8).toUpperCase()}</p>
                             </td>
                             <td className="px-6 py-5">
                                <Badge variant="outline" className="text-[9px] font-black p-2 px-3 tracking-widest text-slate-400 rounded-xl group-hover:bg-[var(--brand-primary)] group-hover:text-white group-hover:border-[color:var(--brand-primary)] transition-all">{asset.category || 'General'}</Badge>
                             </td>
                             <td className="px-6 py-5 text-slate-500 font-bold text-xs">{asset.location || '—'}</td>
                             <td className="px-6 py-5 text-right font-black text-slate-900 font-mono tracking-tighter text-base">{formatCurrencyAmount(asset.value, settings.financial.currency, { maximumFractionDigits: 0 })}</td>
                             <td className="px-8 py-5 text-right">
                                <button className="p-2 rounded-xl text-slate-200 group-hover:text-[var(--brand-secondary)] hover:bg-slate-100 transition-all">
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
            <Card className="border-none shadow-sm flex flex-col rounded-[2.5rem] overflow-hidden bg-white text-left">
               <CardHeader className="p-8 border-b border-slate-50 bg-slate-50/10">
                  <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">Asset Status Mix</CardTitle>
               </CardHeader>
               <CardContent className="p-6 space-y-3">
                  {['Active', 'Maintenance', 'Damaged', 'Retired', 'Disposed'].map((statusKey) => {
                    const count = rows.filter((r: any) => String(r.status || '').toLowerCase() === statusKey.toLowerCase()).length;
                    return (
                      <div key={statusKey} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{statusKey}</p>
                        <p className="text-sm font-black text-slate-900">{count}</p>
                      </div>
                    );
                  })}
               </CardContent>
            </Card>

            <Card className="border-none shadow-2xl bg-slate-900 text-white overflow-hidden relative rounded-[2.5rem] text-left">
               <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent)]"></div>
               <CardHeader className="relative z-10 p-8 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--chart-primary)] flex items-center justify-center mb-4 shadow-xl shadow-slate-300/30">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl font-black tracking-tight">Asset Accounting</CardTitle>
                  <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Capitalization · depreciation · disposal</CardDescription>
               </CardHeader>
               <CardContent className="relative z-10 text-sm space-y-4 pt-0 p-8">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Total registered value</span>
                    <span className="font-black">{formatCurrencyAmount(stats.totalValue, settings.financial.currency, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Pending maintenance</span>
                    <span className="font-black">{stats.maintenance}</span>
                  </div>
                  <Button disabled className="w-full bg-[var(--brand-primary)] hover:opacity-95 h-11 rounded-xl uppercase tracking-widest font-black text-[10px]">
                    Use Finance module for posting actions
                  </Button>
               </CardContent>
            </Card>
         </div>
      </div>
      </>
      )}
    </PageLayout>
  );
}
