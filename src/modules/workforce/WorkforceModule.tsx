import * as React from 'react';
import {
  Briefcase, Search, Users, CheckCircle, Plus, ChevronRight,
  Mail, Phone, Building2, Star, UserCheck, RefreshCw, ArrowLeft,
  Shield, Edit3, X, Save
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ERPModule } from '@/types';
import { ModuleHeader, StatCard, SectionCard, EmptyState } from '@/components/modules/ModuleHeader';
import { AppAvatar } from '@/components/ui/app-avatar';
import { SERVER_ROOT } from '@/lib/apiConfig';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

interface WorkforceModuleProps {
  onModuleChange?: (module: ERPModule) => void;
}

interface StaffMember {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  status?: string;
  growthStage?: string;
  profileImageUrl?: string | null;
  responsibilities?: Responsibility[];
}

interface Responsibility {
  id: string;
  role: string;
  entityType: string;
  status: string;
  startDate?: string;
}

const STAFF_ROLES = [
  'Senior Pastor', 'Executive Pastor', 'Associate Pastor', 'Youth Pastor',
  'Children\'s Pastor', 'Worship Director', 'Youth Director', 'Children Ministry Director',
  'Admin Director', 'Finance Officer', 'Media Director', 'Outreach Coordinator',
  'Small Groups Pastor', 'Care Pastor', 'Discipleship Director'
];

const DEPT_MAP: Record<string, string> = {
  'Senior Pastor': 'Leadership', 'Executive Pastor': 'Leadership', 'Associate Pastor': 'Pastoral',
  'Youth Pastor': 'Youth', 'Children\'s Pastor': 'Children', 'Worship Director': 'Worship',
  'Youth Director': 'Youth', 'Children Ministry Director': 'Children', 'Admin Director': 'Administration',
  'Finance Officer': 'Finance', 'Media Director': 'Media', 'Outreach Coordinator': 'Outreach',
  'Small Groups Pastor': 'Pastoral', 'Care Pastor': 'Pastoral', 'Discipleship Director': 'Pastoral',
};

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Intern', 'Contractor', 'Volunteer'];

const STATUS_COLOR: Record<string, string> = {
  'Full-time': 'bg-emerald-50 text-emerald-700',
  'Part-time': 'bg-blue-50 text-blue-700',
  'Intern': 'bg-amber-50 text-amber-700',
  'Contractor': 'bg-violet-50 text-violet-700',
  'Active': 'bg-emerald-50 text-emerald-700',
  'Leader': 'bg-violet-50 text-violet-700',
  'Staff': 'bg-indigo-50 text-indigo-700',
};

function getDept(member: StaffMember): string {
  return DEPT_MAP[member.role || ''] || 'Ministry';
}

export function WorkforceModule({ onModuleChange }: WorkforceModuleProps) {
  const [members, setMembers] = React.useState<StaffMember[]>([]);
  const [allMembers, setAllMembers] = React.useState<StaffMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [filterGrowth, setFilterGrowth] = React.useState<'all' | 'Staff' | 'Leader'>('all');
  const [selectedMember, setSelectedMember] = React.useState<StaffMember | null>(null);

  // Add Staff form
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [addForm, setAddForm] = React.useState({
    name: '', email: '', phone: '', role: '', growthStage: 'Staff', employmentType: 'Full-time'
  });
  const [addSaving, setAddSaving] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);

  const fetchStaff = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest('members?limit=200');
      const data = parseApiResponse<StaffMember[]>(res) || [];
      setAllMembers(data);
      const staffAndLeaders = data.filter(m =>
        m.growthStage === 'Leader' || m.growthStage === 'Staff' || STAFF_ROLES.includes(m.role || '')
      );
      setMembers(staffAndLeaders.length > 0 ? staffAndLeaders : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load workforce data');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const handleAddStaff = async () => {
    if (!addForm.name.trim()) return;
    try {
      setAddSaving(true);
      setAddError(null);
      await apiRequest('members', {
        method: 'POST',
        body: {
          name: addForm.name,
          email: addForm.email || undefined,
          phone: addForm.phone || undefined,
          role: addForm.role || undefined,
          growthStage: addForm.growthStage,
          status: 'Active',
        },
      });
      setShowAddForm(false);
      setAddForm({ name: '', email: '', phone: '', role: '', growthStage: 'Staff', employmentType: 'Full-time' });
      await fetchStaff();
    } catch (e: any) {
      setAddError(e?.message || 'Failed to add staff member');
    } finally {
      setAddSaving(false);
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.role || '').toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterGrowth === 'all' || m.growthStage === filterGrowth;
    return matchesSearch && matchesFilter;
  });

  const leaderCount = members.filter(m => m.growthStage === 'Leader').length;
  const staffCount = members.filter(m => m.growthStage === 'Staff').length;
  const deptSet = Array.from(new Set(members.map(m => getDept(m)))).sort();

  // ---- ADD FORM ----
  if (showAddForm) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-400">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)} className="rounded-full w-10 h-10 bg-slate-50">
            <ArrowLeft size={18} className="text-slate-600" />
          </Button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Workforce</p>
            <h2 className="text-xl font-black text-slate-900">Add Staff Member</h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6">
          {addError && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm font-medium">{addError}</div>}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name <span className="text-rose-500">*</span></label>
            <input
              value={addForm.name}
              onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
              className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              placeholder="e.g. Pastor John Smith"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
              <input
                type="email"
                value={addForm.email}
                onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="email@church.org"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</label>
              <input
                value={addForm.phone}
                onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ministry Role</label>
              <select
                value={addForm.role}
                onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
              >
                <option value="">Select role...</option>
                {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employment Type</label>
              <select
                value={addForm.employmentType}
                onChange={e => setAddForm(f => ({ ...f, employmentType: e.target.value }))}
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
              >
                {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Classification</label>
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
              {(['Staff', 'Leader'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setAddForm(f => ({ ...f, growthStage: g }))}
                  className={cn(
                    'px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all',
                    addForm.growthStage === g ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Staff = paid employee / ministry staff. Leader = volunteer leader or elder.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1 h-12 rounded-xl font-bold">Cancel</Button>
            <Button
              onClick={handleAddStaff}
              disabled={addSaving || !addForm.name.trim()}
              className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[11px]"
            >
              {addSaving ? 'Adding...' : 'Add Staff Member'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---- DETAIL VIEW ----
  if (selectedMember) {
    const dept = getDept(selectedMember);
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-400">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedMember(null)} className="rounded-full w-10 h-10 bg-slate-50">
            <ArrowLeft size={18} className="text-slate-600" />
          </Button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Workforce</p>
            <h2 className="text-xl font-black text-slate-900">{selectedMember.name}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center text-center gap-4">
              <AppAvatar
                src={selectedMember.profileImageUrl ? `${SERVER_ROOT}${selectedMember.profileImageUrl}` : undefined}
                name={selectedMember.name}
                className="w-20 h-20 rounded-2xl"
              />
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedMember.name}</h3>
                <p className="text-sm text-slate-500 font-medium mt-0.5">{selectedMember.role || 'Ministry Staff'}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge className={cn('border-none font-black text-[9px] uppercase tracking-widest', STATUS_COLOR[selectedMember.growthStage || 'Active'] || 'bg-slate-100 text-slate-600')}>
                  {selectedMember.growthStage || 'Active'}
                </Badge>
                <Badge className="bg-indigo-50 text-indigo-700 border-none font-black text-[9px] uppercase tracking-widest">
                  {dept}
                </Badge>
              </div>
              {selectedMember.email && (
                <div className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                  <Mail size={14} className="text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-700 truncate text-xs">{selectedMember.email}</span>
                </div>
              )}
              {selectedMember.phone && (
                <div className="w-full flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                  <Phone size={14} className="text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-700 text-xs">{selectedMember.phone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <SectionCard title="Ministry Responsibilities" subtitle="Active roles and assignments">
              {(!selectedMember.responsibilities || selectedMember.responsibilities.length === 0) ? (
                <div className="py-8 text-center">
                  <Briefcase size={24} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-sm font-bold text-slate-500">No responsibilities recorded</p>
                  <p className="text-xs text-slate-400 mt-1">Assign roles from the Volunteers module</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {selectedMember.responsibilities.map(r => (
                    <div key={r.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{r.role}</p>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{r.entityType}</p>
                      </div>
                      <Badge className={cn('border-none text-[9px] font-black uppercase tracking-widest', r.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                        {r.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Access & Permissions" subtitle="System access and role assignment">
              <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <Shield size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-700 font-medium leading-relaxed">
                  System access and permissions are managed via the <span className="font-black">Permissions & Access</span> module.
                  Staff classification as Leader or Staff determines their organizational role.
                </p>
              </div>
              <button
                onClick={() => onModuleChange?.('permissions')}
                className="mt-3 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
              >
                Manage Permissions <ChevronRight size={10} />
              </button>
            </SectionCard>

            <SectionCard title="Volunteers & Roles" subtitle="Ministry team assignments">
              <button
                onClick={() => onModuleChange?.('volunteers')}
                className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
              >
                Manage Volunteer Roles <ChevronRight size={10} />
              </button>
            </SectionCard>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <ModuleHeader
        title="Workforce & Staff"
        subtitle="Pastors, directors, staff, and ministry leaders across your organization"
        status="live"
        icon={Briefcase}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchStaff} className="h-9 px-4 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 gap-2 font-bold text-[11px]">
              <RefreshCw size={13} /> Refresh
            </Button>
            <Button
              onClick={() => setShowAddForm(true)}
              className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest gap-2 shadow-sm"
            >
              <Plus size={14} /> Add Staff
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard label="Total Staff & Leaders" value={loading ? '—' : members.length} icon={Users} iconColor="text-indigo-600" iconBg="bg-indigo-50" loading={loading} />
        <StatCard label="Leaders" value={loading ? '—' : leaderCount} icon={Star} iconColor="text-amber-600" iconBg="bg-amber-50" loading={loading} />
        <StatCard label="Staff" value={loading ? '—' : staffCount} icon={UserCheck} iconColor="text-emerald-600" iconBg="bg-emerald-50" loading={loading} />
        <StatCard label="Departments" value={loading ? '—' : deptSet.length} icon={Building2} iconColor="text-violet-600" iconBg="bg-violet-50" loading={loading} />
      </div>

      {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-5 py-4 text-sm font-medium">{error}</div>}

      {!loading && (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, role, or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all placeholder:font-medium placeholder:text-slate-400 shadow-sm"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            {(['all', 'Leader', 'Staff'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterGrowth(f)}
                className={cn('px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all', filterGrowth === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-slate-100 rounded-lg w-2/3" />
                <div className="h-2.5 bg-slate-100 rounded-lg w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm">
          <EmptyState
            icon={Briefcase}
            title={members.length === 0 ? "No staff or leaders found" : "No matching staff members"}
            description={members.length === 0
              ? "Members with growthStage 'Leader' or 'Staff' appear here. Click 'Add Staff' to onboard your first staff member."
              : "Try adjusting your search or filter."
            }
            action={
              members.length === 0 ? (
                <button onClick={() => setShowAddForm(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
                  Add First Staff Member
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          {deptSet.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {deptSet.map(dept => {
                const count = members.filter(m => getDept(m) === dept).length;
                return (
                  <div key={dept} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    {dept}
                    <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md text-[10px] font-black">{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMembers.map(member => {
              const dept = getDept(member);
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className="text-left bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group p-5 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <AppAvatar
                      src={member.profileImageUrl ? `${SERVER_ROOT}${member.profileImageUrl}` : undefined}
                      name={member.name}
                      className="w-12 h-12 rounded-xl shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{member.name}</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{member.role || member.growthStage || 'Ministry Leader'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn('px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest', STATUS_COLOR[member.growthStage || 'Active'] || 'bg-slate-100 text-slate-600')}>
                          {member.growthStage || 'Active'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">{dept}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-4">
                    {member.email && (
                      <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 truncate">
                        <Mail size={10} /> {member.email}
                      </span>
                    )}
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-400 transition-colors ml-auto shrink-0" />
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
