import React from 'react';
import {
  HandHeart, Search, Plus, ChevronRight, Users, Briefcase,
  Calendar, CheckCircle2, Clock, Star, ArrowLeft, Mail, Phone,
  Shield, RefreshCw, X, UserPlus, Edit2, ToggleRight, ToggleLeft
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { ERPModule } from '@/types';
import { ModuleHeader, StatCard, SectionCard, EmptyState } from '@/components/modules/ModuleHeader';
import { AppAvatar } from '@/components/ui/app-avatar';
import { SERVER_ROOT } from '@/lib/apiConfig';
import { cn } from '@/lib/utils';

interface VolunteersModuleProps {
  onModuleChange?: (module: ERPModule) => void;
}

interface Member {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  profileImageUrl?: string | null;
  growthStage?: string;
  responsibilities?: Responsibility[];
}

interface Responsibility {
  id: string;
  memberId: string;
  role: string;
  entityType: string;
  entityId?: string | null;
  status: string;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  member?: Member;
}

const ENTITY_TYPES = ['Ministry', 'Event', 'Group', 'Department', 'Campus'];
const COMMON_ROLES = [
  'Usher', 'Greeter', 'Worship Team', 'AV Tech', 'Children Ministry',
  'Youth Leader', 'Small Group Leader', 'Security', 'Hospitality', 'Funds Handler',
  'Prayer Team', 'Outreach', 'Media Team', 'Social Media', 'Admin Support'
];

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700',
  Inactive: 'bg-slate-100 text-slate-500',
  Pending: 'bg-amber-50 text-amber-700',
};

async function fetchAllData() {
  const res = await apiRequest('members');
  const members = parseApiResponse<Member[]>(res) || [];
  const responsibilities: Responsibility[] = [];
  for (const m of members) {
    if (m.responsibilities && m.responsibilities.length > 0) {
      for (const r of m.responsibilities) {
        responsibilities.push({ ...r, member: m });
      }
    }
  }
  return { responsibilities, members, memberCount: members.length };
}

export function VolunteersModule({ onModuleChange }: VolunteersModuleProps) {
  const [responsibilities, setResponsibilities] = React.useState<Responsibility[]>([]);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [filterRole, setFilterRole] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'Active' | 'Inactive'>('Active');
  const [memberCount, setMemberCount] = React.useState(0);

  // Assignment modal
  const [showAssignModal, setShowAssignModal] = React.useState(false);
  const [assignForm, setAssignForm] = React.useState({ memberId: '', role: '', entityType: 'Ministry', notes: '' });
  const [assignSaving, setAssignSaving] = React.useState(false);
  const [assignError, setAssignError] = React.useState<string | null>(null);

  // Detail view
  const [selectedResp, setSelectedResp] = React.useState<Responsibility | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { responsibilities: resp, members: mems, memberCount: mc } = await fetchAllData();
      setResponsibilities(resp);
      setMembers(mems);
      setMemberCount(mc);
    } catch (e: any) {
      setError(e?.message || 'Failed to load volunteer data');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchData(); }, [fetchData]);

  const handleAssign = async () => {
    if (!assignForm.memberId || !assignForm.role) return;
    try {
      setAssignSaving(true);
      setAssignError(null);
      await apiRequest(`members/${assignForm.memberId}/responsibilities`, {
        method: 'POST',
        body: {
          role: assignForm.role,
          entityType: assignForm.entityType,
          status: 'Active',
          startDate: new Date().toISOString(),
          notes: assignForm.notes || undefined,
        },
      });
      setShowAssignModal(false);
      setAssignForm({ memberId: '', role: '', entityType: 'Ministry', notes: '' });
      await fetchData();
    } catch (e: any) {
      setAssignError(e?.message || 'Failed to assign role');
    } finally {
      setAssignSaving(false);
    }
  };

  const handleToggleStatus = async (resp: Responsibility) => {
    const newStatus = resp.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await apiRequest(`members/${resp.memberId}/responsibilities/${resp.id}`, {
        method: 'PATCH',
        body: { status: newStatus },
      });
      setResponsibilities(prev => prev.map(r => r.id === resp.id ? { ...r, status: newStatus } : r));
      if (selectedResp?.id === resp.id) setSelectedResp({ ...selectedResp, status: newStatus });
    } catch (e: any) {
      alert('Failed to update status: ' + (e?.message || 'Unknown error'));
    }
  };

  const activeCount = responsibilities.filter(r => r.status === 'Active').length;
  const roleSet = Array.from(new Set(responsibilities.map(r => r.role))).sort();

  const filteredResponsibilities = responsibilities.filter(r => {
    const matchesSearch =
      (r.member?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      r.role.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !filterRole || r.role === filterRole;
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleGroups = roleSet.map(role => ({
    role,
    count: responsibilities.filter(r => r.role === role && r.status === 'Active').length,
  })).filter(g => g.count > 0).sort((a, b) => b.count - a.count);

  // ---- DETAIL PANEL ----
  if (selectedResp) {
    const member = selectedResp.member;
    const memberAssignments = responsibilities.filter(r => r.memberId === selectedResp.memberId);
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-400">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedResp(null)} className="rounded-full w-10 h-10 bg-slate-50">
            <ArrowLeft size={18} className="text-slate-600" />
          </Button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Volunteer Profile</p>
            <h2 className="text-xl font-black text-slate-900">{member?.name}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center text-center gap-4">
              <AppAvatar
                src={member?.profileImageUrl ? `${SERVER_ROOT}${member.profileImageUrl}` : undefined}
                name={member?.name || ''}
                className="w-20 h-20 rounded-2xl"
              />
              <div>
                <h3 className="text-lg font-black text-slate-900">{member?.name}</h3>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{member?.growthStage || 'Member'}</p>
              </div>
              {member?.email && (
                <div className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-700 truncate text-xs">{member.email}</span>
                </div>
              )}
              {member?.phone && (
                <div className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-700 text-xs">{member.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <SectionCard title="All Ministry Assignments" subtitle={`${memberAssignments.length} role(s) assigned`}>
              <div className="divide-y divide-slate-50">
                {memberAssignments.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{r.role}</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">{r.entityType}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest', STATUS_COLORS[r.status] || 'bg-slate-100 text-slate-600')}>
                        {r.status}
                      </span>
                      <button
                        onClick={() => handleToggleStatus(r)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        title={r.status === 'Active' ? 'Deactivate' : 'Activate'}
                      >
                        {r.status === 'Active'
                          ? <ToggleRight size={16} className="text-emerald-500" />
                          : <ToggleLeft size={16} className="text-slate-300" />
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <Button
              onClick={() => {
                setAssignForm(f => ({ ...f, memberId: selectedResp.memberId }));
                setShowAssignModal(true);
              }}
              className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest gap-2"
            >
              <Plus size={14} /> Add Another Role
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ModuleHeader
        title="Volunteers"
        subtitle="Ministry teams, serving roles, and volunteer coordination"
        status="live"
        icon={HandHeart}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              className="h-9 px-4 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 font-bold text-[11px]"
            >
              <RefreshCw size={13} /> Refresh
            </Button>
            <Button
              onClick={() => setShowAssignModal(true)}
              className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest gap-2 shadow-sm"
            >
              <UserPlus size={14} /> Assign Role
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard label="Total Assignments" value={loading ? '—' : responsibilities.length} icon={HandHeart} iconColor="text-indigo-600" iconBg="bg-indigo-50" loading={loading} />
        <StatCard label="Active Volunteers" value={loading ? '—' : activeCount} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" loading={loading} />
        <StatCard label="Ministry Roles" value={loading ? '—' : roleSet.length} icon={Star} iconColor="text-amber-600" iconBg="bg-amber-50" loading={loading} />
        <StatCard label="Members Tracked" value={loading ? '—' : memberCount} icon={Users} iconColor="text-violet-600" iconBg="bg-violet-50" loading={loading} />
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-5 py-4 text-sm font-medium">{error}</div>}

      {/* Role Summary */}
      {!loading && roleGroups.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {roleGroups.slice(0, 10).map(group => (
            <button
              key={group.role}
              onClick={() => setFilterRole(filterRole === group.role ? '' : group.role)}
              className={cn(
                'text-left bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition-all',
                filterRole === group.role ? 'border-indigo-300 bg-indigo-50' : 'border-slate-100'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <HandHeart size={12} className="text-indigo-500" />
                </div>
                <span className="text-lg font-black text-slate-900">{group.count}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-700 truncate">{group.role}</p>
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      {!loading && responsibilities.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all placeholder:font-medium placeholder:text-slate-400 shadow-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="h-12 bg-white border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none min-w-[140px]"
            >
              <option value="">All Roles</option>
              {roleSet.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {(['all', 'Active', 'Inactive'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                    filterStatus === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-100 rounded-lg w-1/3" />
                <div className="h-2.5 bg-slate-100 rounded-lg w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredResponsibilities.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm">
          <EmptyState
            icon={HandHeart}
            title={responsibilities.length === 0 ? "No volunteer assignments yet" : "No matching assignments"}
            description={responsibilities.length === 0
              ? "Assign ministry roles to members using the 'Assign Role' button. Roles appear here once members are assigned."
              : "Try adjusting your search or filters."
            }
            action={
              responsibilities.length === 0 ? (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                >
                  Assign First Role
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-800">Volunteer Assignments</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Click any row to view volunteer profile</p>
            </div>
            <Badge className="bg-indigo-50 text-indigo-700 border-none font-black text-[10px] uppercase tracking-widest">
              {filteredResponsibilities.length} records
            </Badge>
          </div>
          <div className="divide-y divide-slate-50">
            {filteredResponsibilities.map(resp => (
              <div
                key={resp.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                onClick={() => setSelectedResp(resp)}
              >
                <AppAvatar
                  src={resp.member?.profileImageUrl ? `${SERVER_ROOT}${resp.member.profileImageUrl}` : undefined}
                  name={resp.member?.name || 'Unknown'}
                  className="w-10 h-10 rounded-xl shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{resp.member?.name || 'Unknown'}</p>
                    <span className={cn('px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shrink-0', STATUS_COLORS[resp.status] || 'bg-slate-100 text-slate-600')}>
                      {resp.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-[11px] text-indigo-600 font-bold">{resp.role}</span>
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Briefcase size={9} /> {resp.entityType}
                    </span>
                    {resp.member?.email && (
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 hidden sm:flex">
                        <Mail size={9} /> {resp.member.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); handleToggleStatus(resp); }}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    title={resp.status === 'Active' ? 'Deactivate' : 'Activate'}
                  >
                    {resp.status === 'Active'
                      ? <ToggleRight size={16} className="text-emerald-500" />
                      : <ToggleLeft size={16} className="text-slate-300" />
                    }
                  </button>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Role Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Volunteers</p>
                <h2 className="text-xl font-black text-slate-900">Assign Ministry Role</h2>
              </div>
              <button onClick={() => { setShowAssignModal(false); setAssignError(null); }} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors">
                <X size={16} className="text-slate-600" />
              </button>
            </div>

            {assignError && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm font-medium">{assignError}</div>}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Member <span className="text-rose-500">*</span></label>
                <select
                  value={assignForm.memberId}
                  onChange={e => setAssignForm(f => ({ ...f, memberId: e.target.value }))}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                >
                  <option value="">Select member...</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role <span className="text-rose-500">*</span></label>
                <select
                  value={assignForm.role}
                  onChange={e => setAssignForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                >
                  <option value="">Select role...</option>
                  {COMMON_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ministry Area</label>
                <select
                  value={assignForm.entityType}
                  onChange={e => setAssignForm(f => ({ ...f, entityType: e.target.value }))}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                >
                  {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes (Optional)</label>
                <textarea
                  value={assignForm.notes}
                  onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Any specific notes about this assignment..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setShowAssignModal(false); setAssignError(null); }} className="flex-1 h-12 rounded-xl font-bold">Cancel</Button>
              <Button
                onClick={handleAssign}
                disabled={assignSaving || !assignForm.memberId || !assignForm.role}
                className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[11px]"
              >
                {assignSaving ? 'Assigning...' : 'Assign Role'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
