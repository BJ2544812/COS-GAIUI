import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  Upload,
  Heart,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ERPModule } from '@/types';
import { cn } from '@/lib/utils';
import { MemberIntake } from './MemberIntake';
import { MemberProfileDetail } from './MemberProfile';
import { createMember, listMembers, importMembers, type MemberDto, getMember, linkMemberFamily, uploadProfileImage, uploadFamilyImage, createMemberMilestone, createMemberDocument } from './memberApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ApiError, formatApiError } from '@/lib/apiClient';
import {
  buildCreatePayloadFromIntake,
  INTAKE_SPIRITUAL_TRACK_LABELS,
  milestoneSpecFromTrackLabel,
  type IntakeFormData,
} from './buildMemberPayload';
import { AppAvatar } from '@/components/ui/app-avatar';
import { SERVER_ROOT } from '@/lib/apiConfig';
import { ModuleHeader, StatCard, ActionButton, PageLayout, FeedbackBanner } from '@/components/modules/ModuleHeader';

interface MembersModuleProps {
  onModuleChange?: (module: ERPModule) => void;
  user?: any;
}

type ViewState = 'directory' | 'intake' | 'profile';

export function MembersModule({ onModuleChange, user: _user }: MembersModuleProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedMemberId = searchParams.get('memberId');
  const viewParam = searchParams.get('view');
  const view: ViewState = selectedMemberId
    ? 'profile'
    : viewParam === 'intake'
      ? 'intake'
      : 'directory';

  /** Single URL update — avoids batched setSearchParams dropping memberId. */
  const patchMemberRoute = React.useCallback(
    (patch: { memberId?: string | null; view?: ViewState | null }) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (!next.get('module')) next.set('module', 'members');

        if (patch.memberId) {
          next.set('memberId', patch.memberId);
          next.set('view', 'profile');
        } else if (patch.memberId === null) {
          next.delete('memberId');
        }

        if (patch.view === 'directory' || patch.view === null) {
          next.delete('view');
          next.delete('memberId');
        } else if (patch.view === 'intake') {
          next.set('view', 'intake');
          next.delete('memberId');
        } else if (patch.view === 'profile' && patch.memberId) {
          next.set('view', 'profile');
        }

        return next;
      });
    },
    [setSearchParams],
  );

  React.useEffect(() => {
    if (viewParam === 'profile' && !selectedMemberId) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('view');
          return next;
        },
        { replace: true },
      );
    }
  }, [viewParam, selectedMemberId, setSearchParams]);
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterMode, setFilterMode] = React.useState<'all' | 'active' | 'new'>('all');
  const [filterStage, setFilterStage] = React.useState<'' | 'Visitor' | 'Member' | 'Leader' | 'Staff'>('');
  const [sortBy, setSortBy] = React.useState<'name' | 'joined' | 'status'>('name');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');
  const [memberPage, setMemberPage] = React.useState(0);
  const MEMBER_PAGE_SIZE = 50;
  
  const [members, setMembers] = React.useState<MemberDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [listError, setListError] = React.useState<string | null>(null);
  const [listErrorStatus, setListErrorStatus] = React.useState<number | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [importResult, setImportResult] = React.useState<string | null>(null);

  const fetchMembers = React.useCallback(async () => {
    setListError(null);
    setListErrorStatus(null);
    setLoading(true);
    try {
      const list = await listMembers();
      console.log('[MembersModule] API returned', list.length, 'members');
      setMembers(list);
    } catch (err) {
      const status = err instanceof ApiError ? err.status : null;
      console.error('[MembersModule] API error. Status:', status, 'Message:', err);
      setListError(formatApiError(err));
      setListErrorStatus(status);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  React.useEffect(() => {
    if (!successMessage) return;
    const t = window.setTimeout(() => setSuccessMessage(null), 4000);
    return () => window.clearTimeout(t);
  }, [successMessage]);

  const runCsvImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await importFile.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        setImportResult('CSV must include a header row and at least one data row (name required).');
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const nameIdx = headers.indexOf('name');
      if (nameIdx < 0) {
        setImportResult('CSV must include a "name" column.');
        return;
      }
      const emailIdx = headers.indexOf('email');
      const phoneIdx = headers.indexOf('phone');
      const stageIdx = headers.indexOf('growthstage');
      const dobIdx = headers.indexOf('dob');
      const rows = lines.slice(1).map((line) => {
        const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const row: { name: string; email?: string; phone?: string; growthStage?: string; dob?: string } = {
          name: cols[nameIdx] || '',
          email: emailIdx >= 0 ? cols[emailIdx] : undefined,
          phone: phoneIdx >= 0 ? cols[phoneIdx] : undefined,
          growthStage: stageIdx >= 0 ? cols[stageIdx] : 'Visitor',
        };
        if (dobIdx >= 0 && cols[dobIdx]) row.dob = cols[dobIdx];
        return row;
      }).filter((r) => r.name);
      const result = await importMembers(rows);
      setImportResult(`Imported ${result.created} member(s).${result.errors.length ? ` ${result.errors.length} row(s) failed.` : ''}`);
      await fetchMembers();
    } catch (e: any) {
      setImportResult(e?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleAddMember = () => patchMemberRoute({ view: 'intake' });
  const handleViewProfile = (id: string) => patchMemberRoute({ memberId: id, view: 'profile' });
  const handleBackToDirectory = () => patchMemberRoute({ view: 'directory' });

  const handleSaveMember = async (
    formData: IntakeFormData & Record<string, unknown>,
    files: { profile?: File | null; family?: File | null } = {},
  ) => {
    const payload = buildCreatePayloadFromIntake(formData);
    const created = await createMember(payload);
    const memberId = created.id;
    let member = created;

    if (formData.familyName?.trim()) {
      await linkMemberFamily(memberId, { familyName: formData.familyName.trim() });
      member = await getMember(memberId);
      window.dispatchEvent(new Event('kos:families-refresh'));
    }

    if (files.profile) {
      await uploadProfileImage(memberId, files.profile);
    }
    if (files.family && member.familyId) {
      await uploadFamilyImage(member.familyId, files.family);
    }

    const track = formData.spiritualTrack || {};
    for (const label of INTAKE_SPIRITUAL_TRACK_LABELS) {
      if (!track[label]) continue;
      const spec = milestoneSpecFromTrackLabel(label);
      const d = new Date().toISOString().slice(0, 10);
      await createMemberMilestone(memberId, {
        type: spec.type,
        date: `${d}T12:00:00.000Z`,
        notes: spec.notes ?? 'Recorded at member intake.',
      });
    }

    if (formData.declarationAccepted) {
      await createMemberDocument(memberId, {
        type: 'DeclarationForm',
        notes: 'Declaration policy accepted at intake (staff-attested).',
      });
    }

    setSuccessMessage('Member saved successfully.');
    await fetchMembers();
    handleBackToDirectory();
  };

  if (view === 'intake') {
    return <MemberIntake onCancel={handleBackToDirectory} onSave={handleSaveMember} />;
  }

  if (view === 'profile' && selectedMemberId) {
    return (
      <MemberProfileDetail
        memberId={selectedMemberId}
        onBack={handleBackToDirectory}
        onMemberUpdated={fetchMembers}
        onModuleChange={onModuleChange}
        onViewMember={handleViewProfile}
      />
    );
  }

  // Permission / Critical Error Handling
  // RULE: Only show AccessRestricted if the API actually returned a 403.
  // NEVER infer permission errors from error message text.
  if (listErrorStatus === 403) {
     return (
       <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-3xl border border-rose-100 shadow-sm animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-6 shadow-inner">
             <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Access Restricted</h2>
          <p className="text-slate-500 font-medium mt-2 max-w-sm text-center">
            Your role does not have access to the member directory. Contact your administrator.
          </p>
       </div>
     );
  }

  // Filter Logic
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const filteredMembers = members
    .filter((m) => {
      const matchesSearch =
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.phone ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (filterMode === 'active') return (m.status || 'Active') === 'Active';
      if (filterMode === 'new') return m.membershipDate && new Date(m.membershipDate) >= thirtyDaysAgo;

      if (filterStage) return m.growthStage === filterStage;

      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortBy === 'joined') cmp = new Date(a.membershipDate || 0).getTime() - new Date(b.membershipDate || 0).getTime();
      else if (sortBy === 'status') cmp = (a.status || '').localeCompare(b.status || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const activeCount = members.filter((m) => (m.status || 'Active') === 'Active').length;
  const visitorCount = members.filter((m) => (m.growthStage || 'Visitor') === 'Visitor').length;

  return (
    <PageLayout>
      {successMessage && <FeedbackBanner tone="success">{successMessage}</FeedbackBanner>}
      {listError && listErrorStatus !== 403 && <FeedbackBanner tone="error">{listError}</FeedbackBanner>}

      {/* Header & Quick Actions */}
      <ModuleHeader
        title="Members"
        subtitle="People directory — open any profile for family, journey, giving, and records"
        status="live"
        icon={Users}
        actions={
          <>
            <ActionButton label="Import" icon={Upload} variant="secondary" onClick={() => { setImportResult(null); setImportFile(null); setImportOpen(true); }} />
            <ActionButton label="Pastoral Care" icon={Heart} variant="secondary" onClick={() => onModuleChange?.('discipleship')} />
            <ActionButton label="Add Member" icon={Plus} variant="primary" onClick={handleAddMember} />
          </>
        }
      />

      <>
      
      {/* Smart Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard label="Total Directory" value={members.length} icon={Users} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
        <StatCard label="Active Status" value={activeCount} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard label="Growth Stage (Visitors)" value={visitorCount} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="h-[400px] flex flex-col items-center justify-center space-y-4 bg-white rounded-3xl border border-slate-100 shadow-sm">
           <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Directory...</p>
        </div>
      ) : members.length === 0 ? (
        
        /* EMPTY STATE / ONBOARDING */
        <div className="h-[550px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 shadow-sm text-center px-4 animate-in zoom-in-95 duration-700">
           <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner relative">
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm">
                 <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              <Users size={40} />
           </div>
           <h3 className="text-lg font-black text-slate-900 mb-3">Build your directory</h3>
           <p className="text-slate-500 font-medium max-w-md mb-10 leading-relaxed text-lg">Start organizing your church family. Add individuals, group them into families, and begin tracking their discipleship journey seamlessly.</p>
           
           <div className="flex flex-col md:flex-row gap-6 mb-12 text-left bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white shadow-sm flex-1">
                 <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-black">1</div>
                 <div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Add Member</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">Create individual profiles with contact details.</p>
                 </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white shadow-sm flex-1 opacity-60">
                 <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-sm font-black">2</div>
                 <div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Create Household</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">Group members logically by household.</p>
                 </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white shadow-sm flex-1 opacity-60">
                 <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-sm font-black">3</div>
                 <div>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Track Journey</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">Directory and status from your member records.</p>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-4">
              <Button onClick={handleAddMember} className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[11px] tracking-widest shadow-xl shadow-indigo-600/20 hover:-translate-y-0.5 transition-all">
                 Add First Member
              </Button>
              <Button variant="outline" onClick={() => setImportOpen(true)} className="h-14 px-8 rounded-2xl border-slate-200 text-slate-600 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 shadow-sm">
                 <Upload size={16} className="mr-2 text-slate-400" /> Import List
              </Button>
           </div>
        </div>

      ) : (

        /* DATA TABLE STATE */
        <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden bg-white">
          <div className="p-6 border-b border-slate-50 flex flex-col gap-4 bg-white">
            {/* Row 1: Search + Sort */}
            <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
              <div className="relative w-full xl:w-[420px] group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setMemberPage(0); }}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all placeholder:font-medium placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="h-10 bg-white border border-slate-200 rounded-xl px-3 text-[11px] font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer"
                >
                  <option value="name">Sort: Name</option>
                  <option value="joined">Sort: Joined</option>
                  <option value="status">Sort: Status</option>
                </select>
                <button
                  onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                  className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors font-black text-sm"
                  title={sortDir === 'asc' ? 'Sort ascending' : 'Sort descending'}
                >
                  {sortDir === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            {/* Row 2: Status + Growth Stage filters */}
            <div className="flex flex-wrap gap-2">
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto custom-scrollbar shrink-0">
                <button onClick={() => { setFilterMode('all'); setFilterStage(''); }} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all", filterMode === 'all' && !filterStage ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>All</button>
                <button onClick={() => { setFilterMode('active'); setFilterStage(''); }} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all", filterMode === 'active' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>Active</button>
                <button onClick={() => { setFilterMode('new'); setFilterStage(''); }} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all", filterMode === 'new' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>New (30d)</button>
              </div>
              <div className="w-px bg-slate-200 self-stretch hidden sm:block" />
              <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto custom-scrollbar shrink-0">
                {(['Visitor', 'Member', 'Leader', 'Staff'] as const).map(stage => (
                  <button
                    key={stage}
                    onClick={() => { setFilterStage(filterStage === stage ? '' : stage); setFilterMode('all'); }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all',
                      filterStage === stage
                        ? stage === 'Visitor' ? 'bg-white text-amber-600 shadow-sm'
                          : stage === 'Member' ? 'bg-white text-emerald-600 shadow-sm'
                          : 'bg-white text-violet-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {stage}
                  </button>
                ))}
              </div>
              {(filterStage || filterMode !== 'all' || searchTerm) && (
                <button
                  onClick={() => { setFilterStage(''); setFilterMode('all'); setSearchTerm(''); }}
                  className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-colors border border-rose-100"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
             <Table>
               <TableHeader className="bg-slate-50/50">
                 <TableRow className="hover:bg-transparent border-slate-100">
                   <TableHead className="w-[300px] font-black uppercase tracking-widest text-[10px] text-slate-400 h-14 px-6">Member Profile</TableHead>
                   <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 h-14">Status</TableHead>
                   <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 h-14">Family / Role</TableHead>
                   <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 h-14">Joined Date</TableHead>
                   <TableHead className="font-black uppercase tracking-widest text-[10px] text-slate-400 h-14">Engagement</TableHead>
                   <TableHead className="w-[80px]"></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {filteredMembers.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={6} className="h-64 text-center">
                       <div className="flex flex-col items-center justify-center space-y-4">
                         <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-300">
                           <Search size={32} />
                         </div>
                         <div className="space-y-1">
                           <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">
                             No matching members
                           </h3>
                           <p className="text-xs font-medium text-slate-500">
                             Try adjusting your search query or removing filters.
                           </p>
                         </div>
                         <Button onClick={() => {setSearchTerm(''); setFilterMode('all');}} variant="outline" className="h-10 px-6 rounded-xl text-xs font-bold shadow-sm">
                           Clear Filters
                         </Button>
                       </div>
                     </TableCell>
                   </TableRow>
                 ) : (
                   filteredMembers.slice(memberPage * MEMBER_PAGE_SIZE, (memberPage + 1) * MEMBER_PAGE_SIZE).map((member) => (
                     <TableRow key={member.id} className="group border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => handleViewProfile(member.id)}>
                       <TableCell className="py-4 px-6">
                         <div className="flex items-center gap-4">
                           <AppAvatar 
                             src={member.profileImageUrl ? `${SERVER_ROOT}${member.profileImageUrl}?t=${Date.now()}` : undefined} 
                             name={member.name} 
                             className="w-10 h-10 rounded-xl"
                           />
                           <div className="flex flex-col">
                             <span className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap">
                               {member.name}
                             </span>
                             <div className="flex items-center gap-2 mt-0.5">
                               <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                 <Mail className="w-3 h-3" /> {member.email || 'No email registered'}
                               </span>
                             </div>
                           </div>
                         </div>
                       </TableCell>
                       <TableCell>
                         <Badge
                           className={cn(
                             'font-black rounded-lg px-3 py-1 border-none shadow-sm uppercase tracking-widest text-[9px]',
                             (member.status || 'Active') === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600',
                           )}
                         >
                           {member.status || 'Active'}
                         </Badge>
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                           <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                           {member.family?.name ?? (member.role ? String(member.role).slice(0, 40) : 'Individual')}
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="flex flex-col">
                           <span className="text-sm font-bold text-slate-700">
                             {member.membershipDate ? new Date(member.membershipDate).toLocaleDateString() : 'Pending'}
                           </span>
                           <span className="text-[9px] text-slate-400 uppercase tracking-widest font-black">Registration</span>
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="flex flex-col gap-1.5 w-32">
                           <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none">
                             <span>Progress</span>
                             <span className="text-indigo-500">{member.growthStage || 'Visitor'}</span>
                           </div>
                           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-500 w-[40%] rounded-full" />
                           </div>
                         </div>
                       </TableCell>
                       <TableCell className="pr-6">
                         <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-sm group-hover:text-indigo-600 transition-all ml-auto">
                           <ChevronRight className="w-4 h-4" />
                         </div>
                       </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
          </div>
          
          {filteredMembers.length > 0 && (
             <div className="p-4 border-t border-slate-50 flex justify-between items-center bg-slate-50/50">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Showing {memberPage * MEMBER_PAGE_SIZE + 1}–{Math.min((memberPage + 1) * MEMBER_PAGE_SIZE, filteredMembers.length)} of {filteredMembers.length}</p>
               <div className="flex gap-2">
                 <Button variant="outline" disabled={memberPage === 0} onClick={() => setMemberPage(memberPage - 1)} className="h-8 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-white shadow-sm hover:bg-slate-50">Previous</Button>
                 <Button variant="outline" disabled={(memberPage + 1) * MEMBER_PAGE_SIZE >= filteredMembers.length} onClick={() => setMemberPage(memberPage + 1)} className="h-8 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-white shadow-sm hover:bg-slate-50 border-slate-200">Next</Button>
               </div>
             </div>
          )}
        </Card>
      )}
      </>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-black">Import members (CSV)</DialogTitle>
            <DialogDescription className="text-xs font-medium">
              Columns: name (required), email, phone, growthStage, dob (YYYY-MM-DD). Max 100 rows per import.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <input type="file" accept=".csv,text/csv" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} className="text-sm w-full" />
            {importResult && <p className="text-sm font-bold text-slate-700">{importResult}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportOpen(false)}>Close</Button>
            <Button onClick={() => void runCsvImport()} disabled={!importFile || importing} className="bg-indigo-600 text-white font-black">
              {importing ? 'Importing…' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

// Ensure custom-scrollbar CSS exists
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar { height: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
`;
if (typeof document !== 'undefined') {
  const existing = document.getElementById('members-module-scrollbar-style');
  if (!existing) {
    const style = document.createElement('style');
    style.id = 'members-module-scrollbar-style';
    style.innerHTML = scrollbarStyles;
    document.head.appendChild(style);
  }
}
