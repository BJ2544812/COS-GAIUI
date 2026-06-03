import React from 'react';
import {
  HandHeart, Search, ChevronRight, Users, Briefcase,
  CheckCircle2, Star, Mail, RefreshCw, X, UserPlus, ToggleRight, ToggleLeft
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { ERPModule } from '@/types';
import { ModuleHeader, StatCard, EmptyState, PageLayout, ActionButton } from '@/components/modules/ModuleHeader';
import { AppAvatar } from '@/components/ui/app-avatar';
import { SERVER_ROOT } from '@/lib/apiConfig';
import { cn } from '@/lib/utils';
import {
  COMMON_SERVING_ROLES,
  ENTITY_TYPES,
  SERVING_STATUS_OPTIONS,
  servingTierForRole,
  tierSortIndex,
} from '@/lib/servingRoles';
import { VolunteerOpsBoard } from '@/components/operations/VolunteerOpsBoard';
import { useNavigate } from 'react-router-dom';
import { buildMemberProfilePath } from '@/lib/adminNavigation';

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

interface StructureEntity {
  id: string;
  name: string;
}

function dateInputValue(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

const UCOS_ASSIGN_EVENT_ID = 'ucos_assign_event_id';

const STATUS_COLORS: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-700',
  Inactive: 'bg-slate-100 text-slate-500',
  Pending: 'bg-amber-50 text-amber-700',
};

function memberResponsibilityRows(m: Member): Responsibility[] {
  const rows =
    m.responsibilities ??
    (m as Member & { memberResponsibilities?: Responsibility[] }).memberResponsibilities ??
    [];
  return rows.map((r) => ({
    ...r,
    memberId: r.memberId || m.id,
    status: r.status || 'Active',
    member: m,
  }));
}

async function fetchAllData() {
  const res = await apiRequest('members');
  const members = parseApiResponse<Member[]>(res) || [];
  const responsibilities: Responsibility[] = [];
  for (const m of members) {
    responsibilities.push(...memberResponsibilityRows(m));
  }
  return { responsibilities, members, memberCount: members.length };
}

function statusMatchesFilter(status: string, filter: 'all' | 'Active' | 'Inactive'): boolean {
  if (filter === 'all') return true;
  return (status || 'Active').toLowerCase() === filter.toLowerCase();
}

export function VolunteersModule({ onModuleChange }: VolunteersModuleProps) {
  const navigate = useNavigate();
  const openMemberProfile = React.useCallback(
    (memberId: string) => navigate(buildMemberProfilePath(memberId)),
    [navigate],
  );
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
  const [ministries, setMinistries] = React.useState<StructureEntity[]>([]);
  const [smallGroups, setSmallGroups] = React.useState<StructureEntity[]>([]);
  const [events, setEvents] = React.useState<StructureEntity[]>([]);
  const [assignForm, setAssignForm] = React.useState({
    memberId: '',
    role: '',
    entityType: 'Ministry',
    entityId: '',
    status: 'Active',
    startDate: dateInputValue(),
    notes: '',
  });
  const [assignSaving, setAssignSaving] = React.useState(false);
  const [assignError, setAssignError] = React.useState<string | null>(null);

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

  React.useEffect(() => {
    void (async () => {
      try {
        const [minRes, sgRes, evRes] = await Promise.all([
          apiRequest('structure/ministries'),
          apiRequest('structure/small-groups'),
          apiRequest('events'),
        ]);
        setMinistries(parseApiResponse<StructureEntity[]>(minRes) || []);
        setSmallGroups(parseApiResponse<StructureEntity[]>(sgRes) || []);
        const evRows = parseApiResponse<Array<{ id: string; name: string }>>(evRes) || [];
        setEvents(evRows.map((e) => ({ id: e.id, name: e.name })));
      } catch {
        /* structure optional */
      }
    })();
  }, []);

  React.useEffect(() => {
    const focusEventId = sessionStorage.getItem(UCOS_ASSIGN_EVENT_ID);
    if (!focusEventId || events.length === 0) return;
    sessionStorage.removeItem(UCOS_ASSIGN_EVENT_ID);
    setAssignForm((f) => ({
      ...f,
      entityType: 'Event',
      entityId: focusEventId,
    }));
    setShowAssignModal(true);
  }, [events]);

  const resolveEntityLabel = React.useCallback(
    (r: Responsibility) => {
      if (r.entityType === 'Ministry' && r.entityId) {
        return ministries.find((m) => m.id === r.entityId)?.name ?? 'Ministry';
      }
      if (r.entityType === 'SmallGroup' && r.entityId) {
        return smallGroups.find((g) => g.id === r.entityId)?.name ?? 'Small Group';
      }
      return r.entityType;
    },
    [ministries, smallGroups],
  );

  const openAssignModal = (memberId?: string) => {
    setAssignError(null);
    setAssignForm((f) => ({
      ...f,
      memberId: memberId ?? f.memberId,
      role: '',
      entityId: '',
      notes: '',
      entityType: 'Ministry',
      status: 'Active',
      startDate: dateInputValue(),
    }));
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!assignForm.memberId || !assignForm.role) return;
    const memberId = assignForm.memberId;
    try {
      setAssignSaving(true);
      setAssignError(null);
      const res = await apiRequest(`members/${memberId}/responsibilities`, {
        method: 'POST',
        body: {
          role: assignForm.role,
          entityType: assignForm.entityType,
          entityId: assignForm.entityId || undefined,
          status: assignForm.status || 'Active',
          startDate: assignForm.startDate ? new Date(assignForm.startDate).toISOString() : new Date().toISOString(),
          notes: assignForm.notes || undefined,
        },
      });
      const created = parseApiResponse<Responsibility>(res);
      const member = members.find((m) => m.id === memberId);
      if (created?.id && member) {
        setResponsibilities((prev) => [...prev, { ...created, member }]);
      }
      setShowAssignModal(false);
      setAssignForm({
        memberId: '',
        role: '',
        entityType: 'Ministry',
        entityId: '',
        status: 'Active',
        startDate: dateInputValue(),
        notes: '',
      });
      setFilterStatus('Active');
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
    } catch (e: any) {
      alert('Failed to update status: ' + (e?.message || 'Unknown error'));
    }
  };

  const activeCount = responsibilities.filter((r) => statusMatchesFilter(r.status, 'Active')).length;
  const roleSet = Array.from(new Set(responsibilities.map(r => r.role))).sort();

  const filteredResponsibilities = [...responsibilities]
    .sort((a, b) => tierSortIndex(servingTierForRole(a.role)) - tierSortIndex(servingTierForRole(b.role)))
    .filter((r) => {
    const matchesSearch =
      (r.member?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      r.role.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !filterRole || r.role === filterRole;
    const matchesStatus = statusMatchesFilter(r.status, filterStatus);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleGroups = roleSet.map(role => ({
    role,
    count: responsibilities.filter((r) => r.role === role && statusMatchesFilter(r.status, 'Active')).length,
  })).filter(g => g.count > 0).sort((a, b) => b.count - a.count);

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setAssignError(null);
  };

  const assignModal = showAssignModal ? (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      role="presentation"
      onClick={closeAssignModal}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-8 space-y-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-volunteer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Volunteers</p>
            <h2 id="assign-volunteer-title" className="text-xl font-black text-slate-900">Assign Ministry Role</h2>
          </div>
          <button type="button" onClick={closeAssignModal} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center"><X size={16} /></button>
        </div>
        {assignError && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">{assignError}</div>}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Member *</label>
            <select value={assignForm.memberId} onChange={e => setAssignForm(f => ({ ...f, memberId: e.target.value }))} className="w-full h-12 bg-slate-50 border rounded-xl px-4 text-sm font-bold">
              <option value="">Select member...</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role *</label>
            <select value={assignForm.role} onChange={e => setAssignForm(f => ({ ...f, role: e.target.value }))} className="w-full h-12 bg-slate-50 border rounded-xl px-4 text-sm font-bold">
              <option value="">Select role...</option>
              {COMMON_SERVING_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Serving area</label>
            <select value={assignForm.entityType} onChange={e => setAssignForm(f => ({ ...f, entityType: e.target.value, entityId: '' }))} className="w-full h-12 bg-slate-50 border rounded-xl px-4 text-sm font-bold">
              {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {(assignForm.entityType === 'Ministry' || assignForm.entityType === 'SmallGroup' || assignForm.entityType === 'Event') && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {assignForm.entityType === 'Event' ? 'Link to event' : 'Link to team'}
              </label>
              <select value={assignForm.entityId} onChange={e => setAssignForm(f => ({ ...f, entityId: e.target.value }))} className="w-full h-12 bg-slate-50 border rounded-xl px-4 text-sm font-bold">
                <option value="">{assignForm.entityType === 'Event' ? 'Select event…' : 'General (not linked)'}</option>
                {(assignForm.entityType === 'Ministry'
                  ? ministries
                  : assignForm.entityType === 'SmallGroup'
                    ? smallGroups
                    : events
                ).map((ent) => (
                  <option key={ent.id} value={ent.id}>{ent.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</label>
              <select value={assignForm.status} onChange={e => setAssignForm(f => ({ ...f, status: e.target.value }))} className="w-full h-12 bg-slate-50 border rounded-xl px-4 text-sm font-bold">
                {SERVING_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start date</label>
              <input type="date" value={assignForm.startDate} onChange={e => setAssignForm(f => ({ ...f, startDate: e.target.value }))} className="w-full h-12 bg-slate-50 border rounded-xl px-4 text-sm font-bold" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notes</label>
            <textarea value={assignForm.notes} onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full bg-slate-50 border rounded-xl p-4 text-sm" />
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={closeAssignModal} className="flex-1">Cancel</Button>
          <Button onClick={handleAssign} disabled={assignSaving || !assignForm.memberId || !assignForm.role} className="flex-1 bg-indigo-600 text-white font-black">
            {assignSaving ? 'Assigning...' : 'Assign Role'}
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
    <PageLayout>
      <ModuleHeader
        title="Volunteers"
        subtitle="Ministry teams, serving roles, and volunteer coordination"
        icon={HandHeart}
        actions={
          <>
            <ActionButton label="Refresh" icon={RefreshCw} variant="secondary" onClick={fetchData} />
            <ActionButton label="Assign volunteer" icon={UserPlus} variant="primary" onClick={() => openAssignModal()} />
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard label="Total Assignments" value={loading ? '—' : responsibilities.length} icon={HandHeart} iconColor="text-indigo-600" iconBg="bg-indigo-50" loading={loading} />
        <StatCard label="Active Volunteers" value={loading ? '—' : activeCount} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" loading={loading} />
        <StatCard label="Ministry Roles" value={loading ? '—' : roleSet.length} icon={Star} iconColor="text-amber-600" iconBg="bg-amber-50" loading={loading} />
        <StatCard label="Members Tracked" value={loading ? '—' : memberCount} icon={Users} iconColor="text-violet-600" iconBg="bg-violet-50" loading={loading} />
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-5 py-4 text-sm font-medium">{error}</div>}

      <VolunteerOpsBoard eventId={sessionStorage.getItem('ucos_assign_event_id') || undefined} />

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
              ? "Start by assigning greeters, ushers, or team leads to members — then track them here for Sunday and events. Use Assign Role to add your first volunteer."
              : "Try adjusting your search or filters."
            }
            action={
              responsibilities.length === 0 ? (
                <button
                  onClick={() => openAssignModal()}
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
                onClick={() => openMemberProfile(resp.memberId)}
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
                      <Briefcase size={9} /> {resolveEntityLabel(resp)}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-violet-600">{servingTierForRole(resp.role)}</span>
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

      {assignModal}
    </PageLayout>
    </>
  );
}
