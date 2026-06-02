import * as React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  MapPin, 
  Building2,
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
  Phone,
  Edit2,
  Trash2,
  UserPlus,
  RefreshCw,
  Globe,
  Save,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { SettingsModule } from '@/modules/settings/SettingsModule';
import { PermissionsModule } from '@/modules/permissions/PermissionsModule';
import { ERPModule } from '@/types';
import { ModuleHeader, ActionButton, StatCard, SectionCard } from '@/components/modules/ModuleHeader';
import { AppAvatar } from '@/components/ui/app-avatar';
import { SERVER_ROOT } from '@/lib/apiConfig';
import { isUuid, servingTierForRole } from '@/lib/servingRoles';

interface StructureModuleProps {
  onModuleChange?: (module: ERPModule) => void;
}

export function StructureModule({ onModuleChange }: StructureModuleProps) {
  const [activeTab, setActiveTab] = React.useState<'structure' | 'settings' | 'permissions'>('structure');
  const [view, setView] = React.useState<'list' | 'campus-detail' | 'add-campus' | 'manage-hierarchy'>('list');
  const [selectedCampus, setSelectedCampus] = React.useState<any | null>(null);
  const [campuses, setCampuses] = React.useState<any[]>([]);
  const [members, setMembers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  
  // Forms
  const [campusForm, setCampusForm] = React.useState({ name: '', type: 'Sub-Campus', address: '', upiId: '', bankInfo: '', leaderId: '' });
  const [ministryForm, setMinistryForm] = React.useState({ name: '', campusId: '', leaderId: '' });
  const [showMinistryModal, setShowMinistryModal] = React.useState(false);
  const [campusMinistries, setCampusMinistries] = React.useState<any[]>([]);
  const [rosterMinistry, setRosterMinistry] = React.useState<any | null>(null);
  const [rosterRows, setRosterRows] = React.useState<any[]>([]);
  const [rosterLoading, setRosterLoading] = React.useState(false);
  const [regionName, setRegionName] = React.useState('');
  const [showRegionModal, setShowRegionModal] = React.useState(false);

  const fetchCampuses = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('structure/campuses');
      setCampuses(parseApiResponse<any[]>(res) || []);
    } catch (e) {
      console.error('Failed to fetch campuses:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await apiRequest('members?limit=200');
      setMembers(parseApiResponse<any[]>(res) || []);
    } catch (e) {
      console.error('Failed to fetch members:', e);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'structure') {
      fetchCampuses();
      fetchMembers();
    }
  }, [activeTab]);

  const handleCreateCampus = async () => {
    setLoading(true);
    try {
      await apiRequest('structure/campuses', { method: 'POST', body: campusForm });
      setView('list');
      setCampusForm({ name: '', type: 'Sub-Campus', address: '', upiId: '', bankInfo: '', leaderId: '' });
      fetchCampuses();
    } catch (e) {
      alert('Failed to create campus: ' + (e instanceof Error ? e.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCampus = async () => {
    if (!selectedCampus) return;
    setLoading(true);
    try {
      await apiRequest(`structure/campuses/${selectedCampus.id}`, { method: 'PATCH', body: campusForm });
      setView('campus-detail');
      fetchCampuses();
      // Update local selectedCampus
      const updated = await apiRequest(`structure/campuses/${selectedCampus.id}`);
      setSelectedCampus(parseApiResponse(updated));
    } catch (e) {
      alert('Failed to update campus');
    } finally {
      setLoading(false);
    }
  };

  const refreshCampusDetail = async (campusId: string) => {
    const [campusRes, ministriesRes] = await Promise.all([
      apiRequest(`structure/campuses/${campusId}`),
      apiRequest(`structure/ministries?campusId=${encodeURIComponent(campusId)}`),
    ]);
    const campus = parseApiResponse<any>(campusRes);
    setSelectedCampus(campus);
    setCampusMinistries(parseApiResponse<any[]>(ministriesRes) || campus?.ministries || []);
  };

  const handleAddMinistry = async () => {
    if (!ministryForm.name || !selectedCampus) return;
    try {
      const created = parseApiResponse<any>(
        await apiRequest('structure/ministries', {
          method: 'POST',
          body: { name: ministryForm.name, campusId: selectedCampus.id },
        }),
      );
      if (ministryForm.leaderId && created?.id) {
        await apiRequest(`members/${ministryForm.leaderId}/responsibilities`, {
          method: 'POST',
          body: {
            role: 'Ministry Leader',
            entityType: 'Ministry',
            entityId: created.id,
            status: 'Active',
          },
        });
      }
      setShowMinistryModal(false);
      setMinistryForm({ name: '', campusId: '', leaderId: '' });
      await refreshCampusDetail(selectedCampus.id);
    } catch (e) {
      alert('Failed to add ministry');
    }
  };

  const handleAddRegion = async () => {
    if (!selectedCampus || !regionName.trim()) return;
    try {
      await apiRequest('structure/regions', {
        method: 'POST',
        body: { name: regionName.trim(), campusId: selectedCampus.id },
      });
      setShowRegionModal(false);
      setRegionName('');
      await refreshCampusDetail(selectedCampus.id);
    } catch (e) {
      alert('Failed to add region');
    }
  };

  const openMinistryRoster = async (ministry: any) => {
    setRosterMinistry(ministry);
    setRosterLoading(true);
    try {
      const res = await apiRequest(`structure/ministries/${ministry.id}/roster`);
      const data = parseApiResponse<{ roster: any[] }>(res);
      setRosterRows(data?.roster || []);
    } catch {
      setRosterRows([]);
    } finally {
      setRosterLoading(false);
    }
  };

  const handleDeleteMinistry = async (id: string) => {
    if (!confirm('Delete this ministry team?')) return;
    try {
      await apiRequest(`structure/ministries/${id}`, { method: 'DELETE' });
      await refreshCampusDetail(selectedCampus.id);
    } catch (e) {
      alert('Failed to delete ministry');
    }
  };

  const openCampusDetail = async (campus: any) => {
    setSelectedCampus(campus);
    setCampusForm({
      name: campus.name,
      type: campus.type || 'Sub-Campus',
      address: campus.address || '',
      upiId: campus.upiId || '',
      bankInfo: campus.bankInfo || '',
      leaderId: campus.leaderId || (isUuid(campus.leader) ? campus.leader : ''),
    });
    setCampusMinistries(campus.ministries || []);
    setView('campus-detail');
    try {
      await refreshCampusDetail(campus.id);
    } catch {
      /* keep list payload */
    }
  };

  // --- Sub-Components ---
  
  const CampusList = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Organization Network</h2>
        <Button onClick={() => { setView('add-campus'); setCampusForm({ name: '', type: 'Sub-Campus', address: '', upiId: '', bankInfo: '', leaderId: '' }); }} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest">
          <Plus className="w-4 h-4" /> Add Campus
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campuses.map((campus) => (
          <Card key={campus.id} onClick={() => openCampusDetail(campus)} className="border-none shadow-sm rounded-[2rem] overflow-hidden group hover:ring-2 hover:ring-indigo-500/20 transition-all cursor-pointer">
            <CardContent className="p-0">
              <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{campus.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{campus.type || 'Branch'}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-all" />
              </div>
              <div className="p-6 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ministries</p>
                  <p className="text-sm font-bold text-slate-900">{campus._count?.ministries || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Regions</p>
                  <p className="text-sm font-bold text-slate-900">{campus._count?.regions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const CampusDetail = () => {
    if (!selectedCampus) return null;
    const stats = selectedCampus._count || { ministries: 0, events: 0, regions: 0 };
    const leaderId = selectedCampus.leaderId || (isUuid(selectedCampus.leader) ? selectedCampus.leader : null);
    const leader = leaderId ? members.find(m => m.id === leaderId) : null;
    const leaderDisplay = leader?.name || selectedCampus.leaderLabel || (selectedCampus.leader && !isUuid(selectedCampus.leader) ? selectedCampus.leader : null);
    const ministryList = campusMinistries.length > 0 ? campusMinistries : (selectedCampus.ministries || []);

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setView('list')} className="gap-2 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Back to Network
          </Button>
          <div className="flex gap-2">
            <Button onClick={() => setView('manage-hierarchy')} variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest border-slate-200">
              <Settings className="w-4 h-4 mr-2" /> Campus Settings
            </Button>
            <Button onClick={() => setShowMinistryModal(true)} className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-black text-[10px] uppercase tracking-widest">
              <Plus className="w-4 h-4 mr-2" /> Add Team
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8">
              <div className="w-24 h-24 rounded-[2rem] bg-indigo-600 shadow-xl shadow-indigo-100 flex items-center justify-center text-white shrink-0">
                <Building2 className="w-12 h-12" />
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase leading-none">{selectedCampus.name}</h1>
                  <Badge className="bg-indigo-50 text-indigo-700 border-none rounded-lg font-black text-[9px] uppercase tracking-widest">{selectedCampus.type}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                  <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-400" /> {selectedCampus.address || 'Global Center'}</span>
                  <span className="flex items-center gap-2 text-emerald-500"><Calendar className="w-4 h-4" /> Active Service</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Ministry Teams" value={stats.ministries} icon={LayoutGrid} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
              <StatCard label="Service Points" value={stats.events} icon={MapPin} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
              <StatCard label="Regions" value={stats.regions} icon={Network} iconColor="text-amber-600" iconBg="bg-amber-50" />
            </div>

            <SectionCard title="Campus Leadership" subtitle="Administrative and spiritual oversight">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <AppAvatar src={leader?.profileImageUrl ? `${SERVER_ROOT}${leader.profileImageUrl}` : undefined} name={leaderDisplay || 'Unassigned'} className="w-16 h-16 rounded-2xl" />
                  <div>
                    <p className="text-xl font-black text-slate-900">{leaderDisplay || 'Unassigned Leader'}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{leader?.role || leader?.growthStage || 'Campus Lead'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="rounded-xl bg-slate-50"><Mail className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="rounded-xl bg-slate-50"><Phone className="w-4 h-4" /></Button>
                </div>
              </div>
            </SectionCard>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Ministry Teams & Departments</h3>
                <Button variant="ghost" onClick={() => setShowMinistryModal(true)} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest">New Team</Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {ministryList.map((ministry: any) => (
                  <Card key={ministry.id} onClick={() => void openMinistryRoster(ministry)} className="border-none shadow-sm rounded-2xl overflow-hidden group hover:ring-2 hover:ring-indigo-500/20 transition-all cursor-pointer">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate w-full">{ministry.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          {ministry.leaderName || 'Team roster'}
                        </p>
                        {typeof ministry.activeServingCount === 'number' && (
                          <p className="text-[9px] font-black text-indigo-500 mt-0.5">{ministry.activeServingCount} serving</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteMinistry(ministry.id); }} className="w-8 h-8 rounded-lg text-slate-300 hover:text-rose-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-900 text-white p-8 space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Financial Hub</h3>
              <div className="flex flex-col items-center gap-6">
                <div className="p-4 bg-white rounded-[2rem] shadow-2xl">
                  <QRCodeSVG value={`upi://pay?pa=${selectedCampus.upiId || 'church@upi'}&pn=${selectedCampus.name}`} size={160} />
                </div>
                <div className="text-center space-y-2">
                   <p className="text-xl font-black">{selectedCampus.upiId || '—'}</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Campus UPI ID</p>
                </div>
              </div>
            </Card>

            <Card className="rounded-[2rem] border-none shadow-sm bg-white p-6 space-y-4">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Campus Regions</h3>
               <div className="space-y-3">
                  {(selectedCampus.regions || []).map((region: any) => (
                    <div key={region.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                       <span className="text-sm font-bold text-slate-700">{region.name}</span>
                       <Badge className="bg-indigo-100 text-indigo-700 border-none font-black text-[9px]">{region.zones?.length || 0} Zones</Badge>
                    </div>
                  ))}
                  <Button variant="outline" onClick={() => setShowRegionModal(true)} className="w-full border-dashed border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl font-black text-[9px] uppercase tracking-widest">
                    <Plus className="w-3 h-3 mr-2" /> Add Region
                  </Button>
               </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const ManageHierarchy = () => {
    if (!selectedCampus) return null;
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setView('campus-detail')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Edit Campus Configuration</h1>
            <p className="text-sm text-slate-500 font-medium">Update campus details, leadership, and church settings.</p>
          </div>
        </div>

        <Card className="rounded-[2.5rem] border-none shadow-sm p-8 space-y-8">
           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Campus Name</label>
                 <input 
                   className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" 
                   value={campusForm.name}
                   onChange={e => setCampusForm({ ...campusForm, name: e.target.value })}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Campus Type</label>
                 <select 
                   className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                   value={campusForm.type}
                   onChange={e => setCampusForm({ ...campusForm, type: e.target.value })}
                 >
                    <option>Main Branch</option>
                    <option>Sub-Campus</option>
                    <option>Mission Point</option>
                 </select>
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Physical Address</label>
              <input 
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" 
                value={campusForm.address}
                onChange={e => setCampusForm({ ...campusForm, address: e.target.value })}
              />
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Campus Lead / Overseer</label>
              <select 
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={campusForm.leaderId}
                onChange={e => setCampusForm({ ...campusForm, leaderId: e.target.value })}
              >
                 <option value="">Select Overseer...</option>
                 {members.filter(m => m.growthStage === 'Staff' || m.growthStage === 'Leader').map(m => (
                   <option key={m.id} value={m.id}>{m.name} ({m.role || m.growthStage})</option>
                 ))}
              </select>
           </div>

           <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">UPI ID (Giving)</label>
                 <input 
                   className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" 
                   value={campusForm.upiId}
                   onChange={e => setCampusForm({ ...campusForm, upiId: e.target.value })}
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Bank Info</label>
                 <input 
                   className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20" 
                   value={campusForm.bankInfo}
                   onChange={e => setCampusForm({ ...campusForm, bankInfo: e.target.value })}
                 />
              </div>
           </div>

           <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setView('campus-detail')} className="flex-1 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest">Cancel</Button>
              <Button onClick={handleUpdateCampus} className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest">Save Changes</Button>
           </div>
        </Card>
      </div>
    );
  };

  const AddCampusView = () => (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setView('list')} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Establish New Unit</h1>
          <p className="text-sm text-slate-500 font-medium">Define a new branch or administrative center.</p>
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-sm p-8 space-y-6">
         <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Name</label>
               <input className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold" value={campusForm.name} onChange={e => setCampusForm({...campusForm, name: e.target.value})} />
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Type</label>
               <select className="w-full h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold" value={campusForm.type} onChange={e => setCampusForm({...campusForm, type: e.target.value})}>
                  <option>Main Branch</option><option>Sub-Campus</option><option>Mission Point</option>
               </select>
            </div>
         </div>
         <Button onClick={handleCreateCampus} className="w-full bg-indigo-600 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100">Establish Church Unit</Button>
      </Card>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <ModuleHeader
        title="Church Structure"
        subtitle="Manage campuses, ministries, and organizational hierarchy."
        status="live"
        icon={GitFork}
        actions={
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {(['structure', 'settings', 'permissions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        }
      />

      {activeTab === 'settings' ? (
        <SettingsModule />
      ) : activeTab === 'permissions' ? (
        <PermissionsModule />
      ) : (
        <>
          {view === 'list' && <CampusList />}
          {view === 'campus-detail' && <CampusDetail />}
          {view === 'add-campus' && <AddCampusView />}
          {view === 'manage-hierarchy' && <ManageHierarchy />}
        </>
      )}

      {rosterMinistry && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8 space-y-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{rosterMinistry.name}</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Serving roster</p>
              </div>
              <button type="button" onClick={() => { setRosterMinistry(null); setRosterRows([]); }} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            {rosterLoading ? (
              <p className="text-sm font-bold text-slate-400 text-center py-8">Loading roster…</p>
            ) : rosterRows.length === 0 ? (
              <p className="text-sm font-bold text-slate-400 text-center py-8">No assignments linked to this team yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {rosterRows.map((row: any) => (
                  <div key={row.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <AppAvatar name={row.member?.name || '?'} src={row.member?.profileImageUrl ? `${SERVER_ROOT}${row.member.profileImageUrl}` : undefined} className="w-10 h-10 rounded-xl shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{row.member?.name}</p>
                        <p className="text-[10px] font-medium text-slate-500">{row.role} · {servingTierForRole(row.role)}</p>
                      </div>
                    </div>
                    <Badge className={cn('shrink-0 border-none font-black text-[9px] uppercase', row.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>{row.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showRegionModal && selectedCampus && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Add Region</h2>
              <button type="button" onClick={() => setShowRegionModal(false)} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Region name</label>
              <input className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold" value={regionName} onChange={e => setRegionName(e.target.value)} placeholder="e.g. North District" />
            </div>
            <Button onClick={() => void handleAddRegion()} disabled={!regionName.trim()} className="w-full bg-indigo-600 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest">Save Region</Button>
          </div>
        </div>
      )}

      {/* Ministry Modal */}
      {showMinistryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">New Ministry Team</h2>
              <button onClick={() => setShowMinistryModal(false)} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Team Name</label>
                  <input className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold" value={ministryForm.name} onChange={e => setMinistryForm({...ministryForm, name: e.target.value})} />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Team Leader</label>
                  <select className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-bold" value={ministryForm.leaderId} onChange={e => setMinistryForm({...ministryForm, leaderId: e.target.value})}>
                     <option value="">Select Leader...</option>
                     {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
               </div>
            </div>
            <Button onClick={handleAddMinistry} className="w-full bg-indigo-600 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest">Create Team</Button>
          </div>
        </div>
      )}
    </div>
  );
}
