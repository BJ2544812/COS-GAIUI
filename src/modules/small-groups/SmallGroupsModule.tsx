import React from 'react';
import {
  Users, Search, Network, Plus, ChevronRight, MapPin, Calendar,
  Crown, ArrowLeft, Globe, Settings, UserPlus, X, Trash2, RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { ERPModule } from '@/types';
import { ModuleHeader, StatCard, EmptyState, SectionCard } from '@/components/modules/ModuleHeader';
import { AppAvatar } from '@/components/ui/app-avatar';
import { SERVER_ROOT } from '@/lib/apiConfig';
import { cn } from '@/lib/utils';

interface SmallGroupsModuleProps {
  onModuleChange?: (module: ERPModule) => void;
}

interface SmallGroup {
  id: string; name: string; type: string; meetingDay?: string | null;
  isActive: boolean; zoneId?: string | null;
  zone?: { id: string; name: string; region?: { id: string; name: string } } | null;
  members?: SmallGroupMember[]; _count?: { members: number };
}
interface SmallGroupMember {
  id: string; role: 'LEADER' | 'HOST' | 'PARTICIPANT'; joinedAt: string;
  memberId: string;
  member?: { id: string; name: string; email?: string | null; profileImageUrl?: string | null };
}
interface Region { id: string; name: string; zones: Zone[]; }
interface Zone { id: string; name: string; regionId: string; }
interface Member { id: string; name: string; email?: string | null; }

const ROLE_COLORS = { LEADER: 'bg-amber-50 text-amber-700', HOST: 'bg-indigo-50 text-indigo-700', PARTICIPANT: 'bg-slate-100 text-slate-600' };
const TYPE_COLORS: Record<string, string> = { Cell: 'bg-violet-50 text-violet-700', Interest: 'bg-emerald-50 text-emerald-700', Prayer: 'bg-rose-50 text-rose-700', Study: 'bg-blue-50 text-blue-700' };
const WEEK_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export function SmallGroupsModule({ onModuleChange }: SmallGroupsModuleProps) {
  const [groups, setGroups] = React.useState<SmallGroup[]>([]);
  const [regions, setRegions] = React.useState<Region[]>([]);
  const [allMembers, setAllMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [filterType, setFilterType] = React.useState<'all'|'active'|'inactive'>('active');
  const [selectedGroup, setSelectedGroup] = React.useState<SmallGroup | null>(null);
  const [groupDetail, setGroupDetail] = React.useState<SmallGroup | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [formData, setFormData] = React.useState({ name:'', type:'Cell', meetingDay:'', zoneId:'' });
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [showAddMember, setShowAddMember] = React.useState(false);
  const [addMemberForm, setAddMemberForm] = React.useState({ memberId:'', role:'PARTICIPANT' });
  const [addingMember, setAddingMember] = React.useState(false);

  const fetchGroups = React.useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [grRes, regRes, memRes] = await Promise.all([
        apiRequest('structure/small-groups'),
        apiRequest('structure/regions'),
        apiRequest('members'),
      ]);
      setGroups(parseApiResponse<SmallGroup[]>(grRes) || []);
      setRegions(parseApiResponse<Region[]>(regRes) || []);
      setAllMembers(parseApiResponse<Member[]>(memRes) || []);
    } catch (e: any) { setError(e?.message || 'Failed to load'); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { fetchGroups(); }, [fetchGroups]);

  const loadGroupDetail = async (group: SmallGroup) => {
    setSelectedGroup(group); setDetailLoading(true);
    try {
      const res = await apiRequest(`structure/small-groups/${group.id}`);
      setGroupDetail(parseApiResponse<SmallGroup>(res));
    } catch { setGroupDetail(group); }
    finally { setDetailLoading(false); }
  };

  const handleCreateGroup = async () => {
    if (!formData.name.trim()) return;
    try {
      setSaving(true); setSaveError(null);
      await apiRequest('structure/small-groups', { method:'POST', body: { name:formData.name, type:formData.type, meetingDay:formData.meetingDay||undefined, zoneId:formData.zoneId||undefined } });
      setShowAddForm(false); setFormData({ name:'',type:'Cell',meetingDay:'',zoneId:'' });
      await fetchGroups();
    } catch (e: any) { setSaveError(e?.message || 'Failed to create'); }
    finally { setSaving(false); }
  };

  const handleAddMember = async () => {
    if (!addMemberForm.memberId || !selectedGroup) return;
    try {
      setAddingMember(true);
      await apiRequest(`structure/small-groups/${selectedGroup.id}/members`, { method:'POST', body:{ memberId:addMemberForm.memberId, role:addMemberForm.role } });
      setShowAddMember(false); setAddMemberForm({ memberId:'', role:'PARTICIPANT' });
      await loadGroupDetail(selectedGroup);
    } catch (e: any) { alert(e?.message || 'Failed to add member'); }
    finally { setAddingMember(false); }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedGroup || !confirm('Remove this member from the group?')) return;
    try {
      await apiRequest(`structure/small-groups/${selectedGroup.id}/members/${memberId}`, { method:'DELETE' });
      await loadGroupDetail(selectedGroup);
    } catch (e: any) { alert(e?.message || 'Failed to remove member'); }
  };

  const allZones = regions.flatMap(r => (r.zones||[]).map(z => ({ ...z, regionName: r.name })));
  const filteredGroups = groups.filter(g => {
    const ms = g.name.toLowerCase().includes(search.toLowerCase());
    const mf = filterType==='all' || (filterType==='active'?g.isActive:!g.isActive);
    return ms && mf;
  });
  const activeCount = groups.filter(g => g.isActive).length;
  const totalMembers = groups.reduce((s,g)=>s+(g._count?.members??g.members?.length??0),0);
  const leaderCount = groups.reduce((s,g)=>s+((g.members||[]).filter(m=>m.role==='LEADER').length),0);

  // --- GROUP DETAIL ---
  if (selectedGroup) {
    const detail = groupDetail;
    const members = detail?.members || selectedGroup.members || [];
    const leader = members.find(m=>m.role==='LEADER');
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-400">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={()=>{setSelectedGroup(null);setGroupDetail(null);}} className="rounded-full w-10 h-10 bg-slate-50">
              <ArrowLeft size={18} className="text-slate-600"/>
            </Button>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Small Groups</p>
              <h2 className="text-xl font-black text-slate-900">{selectedGroup.name}</h2>
            </div>
          </div>
          <Button onClick={()=>setShowAddMember(true)} className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest gap-2">
            <UserPlus size={14}/> Add Member
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className={cn('px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest', TYPE_COLORS[selectedGroup.type]||'bg-slate-100 text-slate-600')}>{selectedGroup.type}</span>
                <span className={cn('w-2.5 h-2.5 rounded-full', selectedGroup.isActive?'bg-emerald-400':'bg-slate-300')}/>
              </div>
              {selectedGroup.meetingDay && <div className="flex items-center gap-2 text-sm text-slate-600 font-medium"><Calendar size={14} className="text-slate-400"/>{selectedGroup.meetingDay}s</div>}
              {selectedGroup.zone && <div className="flex items-center gap-2 text-sm text-slate-600 font-medium"><MapPin size={14} className="text-slate-400"/>{selectedGroup.zone.region?.name} › {selectedGroup.zone.name}</div>}
              {leader?.member && <div className="flex items-center gap-2 text-sm text-slate-600 font-medium"><Crown size={14} className="text-amber-500"/>{leader.member.name}</div>}
              <div className="pt-2 border-t border-slate-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Members</p>
                <p className="text-2xl font-black text-slate-900">{detail?._count?.members ?? members.length}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <SectionCard title="Group Members" subtitle="All assigned members and their roles">
              {detailLoading ? (
                <div className="py-8 text-center text-slate-400 text-sm font-bold">Loading members...</div>
              ) : members.length === 0 ? (
                <div className="py-8 text-center">
                  <Users size={24} className="mx-auto mb-3 text-slate-200"/>
                  <p className="text-sm font-bold text-slate-500">No members yet</p>
                  <button onClick={()=>setShowAddMember(true)} className="mt-3 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700">Add First Member</button>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center gap-4 py-3">
                      <AppAvatar src={m.member?.profileImageUrl?`${SERVER_ROOT}${m.member.profileImageUrl}`:undefined} name={m.member?.name||''} className="w-9 h-9 rounded-xl shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{m.member?.name}</p>
                        {m.member?.email && <p className="text-[10px] text-slate-400 font-medium truncate">{m.member.email}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn('px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest', ROLE_COLORS[m.role])}>{m.role}</span>
                        <button onClick={()=>handleRemoveMember(m.memberId)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        </div>

        {showAddMember && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900">Add Member to Group</h2>
                <button onClick={()=>setShowAddMember(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center"><X size={15}/></button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Member</label>
                  <select value={addMemberForm.memberId} onChange={e=>setAddMemberForm(f=>({...f,memberId:e.target.value}))} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold appearance-none">
                    <option value="">Select member...</option>
                    {allMembers.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {(['PARTICIPANT','HOST','LEADER'] as const).map(r=>(
                      <button key={r} onClick={()=>setAddMemberForm(f=>({...f,role:r}))} className={cn('flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all', addMemberForm.role===r?'bg-white text-indigo-600 shadow-sm':'text-slate-500')}>{r}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={()=>setShowAddMember(false)} className="flex-1 h-11 rounded-xl">Cancel</Button>
                <Button onClick={handleAddMember} disabled={addingMember||!addMemberForm.memberId} className="flex-1 h-11 rounded-xl bg-indigo-600 text-white font-black text-[11px] uppercase tracking-widest">
                  {addingMember?'Adding...':'Add Member'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- ADD FORM ---
  if (showAddForm) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-400">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={()=>setShowAddForm(false)} className="rounded-full w-10 h-10 bg-slate-50"><ArrowLeft size={18}/></Button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Small Groups</p>
            <h2 className="text-xl font-black text-slate-900">Create New Group</h2>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
          {saveError && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm font-medium">{saveError}</div>}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Group Name <span className="text-rose-500">*</span></label>
            <input value={formData.name} onChange={e=>setFormData(f=>({...f,name:e.target.value}))} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="e.g. North Zone Youth Cell"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Group Type</label>
              <select value={formData.type} onChange={e=>setFormData(f=>({...f,type:e.target.value}))} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold appearance-none">
                <option value="Cell">Cell Group</option><option value="Interest">Interest Group</option><option value="Prayer">Prayer Group</option><option value="Study">Bible Study</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Meeting Day</label>
              <select value={formData.meetingDay} onChange={e=>setFormData(f=>({...f,meetingDay:e.target.value}))} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold appearance-none">
                <option value="">Select day...</option>
                {WEEK_DAYS.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          {allZones.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zone Assignment</label>
              <select value={formData.zoneId} onChange={e=>setFormData(f=>({...f,zoneId:e.target.value}))} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold appearance-none">
                <option value="">Unassigned</option>
                {allZones.map(z=><option key={z.id} value={z.id}>{(z as any).regionName} › {z.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={()=>setShowAddForm(false)} className="flex-1 h-12 rounded-xl font-bold">Cancel</Button>
            <Button onClick={handleCreateGroup} disabled={saving||!formData.name.trim()} className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[11px] tracking-widest">
              {saving?'Creating...':'Create Group'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ModuleHeader title="Small Groups" subtitle="Cell groups, prayer circles, and community gatherings" status="live" icon={Network}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchGroups} className="h-9 px-4 rounded-xl border-slate-200 gap-2 font-bold text-[11px]"><RefreshCw size={13}/>Refresh</Button>
            <Button onClick={()=>setShowAddForm(true)} className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest gap-2 shadow-sm"><Plus size={14}/>New Group</Button>
          </div>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard label="Active Groups" value={loading?'—':activeCount} icon={Network} iconColor="text-indigo-600" iconBg="bg-indigo-50" loading={loading}/>
        <StatCard label="Total Members" value={loading?'—':totalMembers} icon={Users} iconColor="text-emerald-600" iconBg="bg-emerald-50" loading={loading}/>
        <StatCard label="Group Leaders" value={loading?'—':leaderCount} icon={Crown} iconColor="text-amber-600" iconBg="bg-amber-50" loading={loading}/>
      </div>
      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-5 py-4 text-sm font-medium">{error}</div>}
      {!loading && groups.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
            <input type="text" placeholder="Search groups..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-sm"/>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            {(['all','active','inactive'] as const).map(f=>(
              <button key={f} onClick={()=>setFilterType(f)} className={cn('px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all capitalize', filterType===f?'bg-white text-indigo-600 shadow-sm':'text-slate-500')}>{f}</button>
            ))}
          </div>
        </div>
      )}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_,i)=><div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse space-y-3"><div className="w-10 h-10 bg-slate-100 rounded-xl"/><div className="h-4 bg-slate-100 rounded-lg w-2/3"/><div className="h-3 bg-slate-100 rounded-lg w-1/2"/></div>)}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm">
          <EmptyState icon={Network} title={groups.length===0?"No small groups yet":"No matching groups"}
            description={groups.length===0?"Create your first small group to start organizing your congregation.":"Try adjusting your search or filter."}
            action={groups.length===0?<button onClick={()=>setShowAddForm(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">Create First Group</button>:undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map(group => {
            const mc = group._count?.members ?? group.members?.length ?? 0;
            const leader = (group.members||[]).find(m=>m.role==='LEADER');
            return (
              <button key={group.id} className="text-left bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group p-5 cursor-pointer" onClick={()=>loadGroupDetail(group)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0"><Network className="w-5 h-5 text-indigo-500"/></div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn('px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest', TYPE_COLORS[group.type]||'bg-slate-100 text-slate-600')}>{group.type}</span>
                    <span className={cn('w-2 h-2 rounded-full', group.isActive?'bg-emerald-400':'bg-slate-300')}/>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">{group.name}</h3>
                <div className="space-y-1.5 mt-3">
                  {group.meetingDay && <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium"><Calendar size={11}/>{group.meetingDay}s</div>}
                  {group.zone && <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium"><MapPin size={11}/>{group.zone.region?`${group.zone.region.name} › `:''}{group.zone.name}</div>}
                  {leader?.member && <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium"><Crown size={11} className="text-amber-500"/>{leader.member.name}</div>}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[11px] font-black text-slate-500 flex items-center gap-1"><Users size={11}/>{mc} members</span>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors"/>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {!loading && regions.length > 0 && (
        <SectionCard title="Geographic Hierarchy" subtitle="Regions and zones configured">
          <div className="space-y-3">
            {regions.map(region=>(
              <div key={region.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0"><Globe size={14} className="text-violet-500"/></div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{region.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {(region.zones||[]).map(zone=><span key={zone.id} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">{zone.name}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
