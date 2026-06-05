import * as React from 'react';
import {
  Award, Plus, CheckCircle2, Briefcase, Trash2, Check, BookOpen,
  Users, Network, FileText, Route, GraduationCap, HandHeart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GROWTH_PIPELINE, growthStageLabel, pipelineIndex, type GrowthStageKey } from '@/lib/memberGrowthStages';
import { MinistryJourneyTimeline } from '@/components/intelligence/MinistryJourneyTimeline';
import { servingTierForRole } from '@/lib/servingRoles';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { SERVER_ROOT } from '@/lib/apiConfig';
import type { MemberDto } from './memberApi';
import type { ERPModule } from '@/types';

const CERT_DOC_TYPES = new Set([
  'BaptismCert',
  'DeclarationForm',
  'Generated',
  'baptism_certificate',
  'member_declaration',
  'visitor_declaration',
]);

type SmallGroupMemberRow = {
  id: string;
  role: string;
  joinedAt?: string;
  group?: { id: string; name: string; type?: string; meetingDay?: string | null; isActive?: boolean };
};

type PathwayRow = { id: string; name: string; description?: string | null; steps?: { id: string; name: string; sequence: number }[] };

export interface MemberSpiritualJourneyTabProps {
  member: MemberDto;
  memberId: string;
  growthStageSaving: boolean;
  saveGrowthStage: (stage: GrowthStageKey) => void | Promise<void>;
  onAddMilestone: () => void;
  onDeleteMilestone: (id: string) => void | Promise<void>;
  onAssignRole: () => void;
  onRemoveResponsibility: (id: string) => void | Promise<void>;
  resolveResponsibilityLabel: (r: { entityType: string; entityId?: string | null }) => string;
  onModuleChange?: (module: ERPModule, tab?: string) => void;
}

export function MemberSpiritualJourneyTab({
  member,
  memberId,
  growthStageSaving,
  saveGrowthStage,
  onAddMilestone,
  onDeleteMilestone,
  onAssignRole,
  onRemoveResponsibility,
  resolveResponsibilityLabel,
  onModuleChange,
}: MemberSpiritualJourneyTabProps) {
  const [pathways, setPathways] = React.useState<PathwayRow[]>([]);
  const [pathwaysLoading, setPathwaysLoading] = React.useState(true);

  const smallGroupMembers = ((member as MemberDto & { smallGroupMembers?: SmallGroupMemberRow[] }).smallGroupMembers ?? []) as SmallGroupMemberRow[];
  const milestones = member.milestones ?? [];
  const responsibilities = member.responsibilities ?? [];
  const documents = member.documents ?? [];

  const volunteerRoles = responsibilities.filter((r) => r.entityType === 'Event' || String(r.role).toLowerCase().includes('volunteer'));
  const ministryRoles = responsibilities.filter((r) => r.entityType === 'Ministry');
  const leadershipRoles = responsibilities.filter((r) => servingTierForRole(r.role) === 'Leadership' || r.entityType === 'SmallGroup');
  const classified = new Set([...volunteerRoles, ...ministryRoles, ...leadershipRoles].map((r) => r.id));
  const serviceRoles = responsibilities.filter((r) => !classified.has(r.id));

  const certificateDocs = documents.filter(
    (d) => CERT_DOC_TYPES.has(d.type) || String(d.type).startsWith('Generated') || String(d.type).toLowerCase().includes('baptism'),
  );

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setPathwaysLoading(true);
      try {
        const res = await apiRequest('structure/pathways');
        if (!cancelled) setPathways(parseApiResponse<PathwayRow[]>(res) ?? []);
      } catch {
        if (!cancelled) setPathways([]);
      } finally {
        if (!cancelled) setPathwaysLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-8">
      {/* Growth pipeline */}
      <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Route className="w-4 h-4 text-indigo-500" /> Discipleship progress
          </CardTitle>
          <CardDescription className="text-xs font-medium">
            Growth stage for this person — update here instead of a separate pathways module.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            <div className="absolute left-0 right-0 h-1 bg-slate-100 top-1/2 -translate-y-1/2" />
            {GROWTH_PIPELINE.map((stage, i) => {
              const currentIdx = pipelineIndex(member.growthStage);
              const isCompleted = i < currentIdx;
              const isActive = i === currentIdx;
              return (
                <button
                  key={stage.key}
                  type="button"
                  disabled={growthStageSaving}
                  onClick={() => void saveGrowthStage(stage.key)}
                  className="relative z-10 flex flex-col items-center gap-2 min-w-[70px]"
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full border-4 border-white shadow-md flex items-center justify-center transition-all',
                      isCompleted ? 'bg-emerald-500 text-white' : isActive ? 'bg-indigo-600 text-white scale-110' : 'bg-white text-slate-300',
                    )}
                  >
                    {isCompleted ? <Check size={16} /> : <span className="text-[10px] font-black">{i + 1}</span>}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-black uppercase tracking-widest',
                      isActive ? 'text-indigo-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400',
                    )}
                  >
                    {stage.label}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs font-bold text-slate-500 mt-4">
            Current stage: {growthStageLabel(member.growthStage)}
            {' · '}
            <select
              className="ml-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-black uppercase"
              value={member.growthStage === 'Staff' ? 'CoreTeam' : (member.growthStage || 'Visitor')}
              disabled={growthStageSaving}
              onChange={(e) => void saveGrowthStage(e.target.value as GrowthStageKey)}
            >
              {GROWTH_PIPELINE.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </p>
        </CardContent>
      </Card>

      {/* Church pathways catalog + member stage */}
      <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-violet-500" /> Training &amp; pathways
          </CardTitle>
          <CardDescription className="text-xs font-medium">
            Church-defined pathways; member progress is tracked via growth stage and milestones on this profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          {pathwaysLoading ? (
            <p className="text-sm text-slate-500 py-4">Loading pathways…</p>
          ) : pathways.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No church pathways configured yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {pathways.map((p) => (
                <div key={p.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                  <p className="text-sm font-bold text-slate-900">{p.name}</p>
                  {p.description && <p className="text-xs text-slate-500 mt-1">{p.description}</p>}
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-2">
                    {(p.steps?.length ?? 0)} steps · Stage: {growthStageLabel(member.growthStage)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden p-6">
        <MinistryJourneyTimeline memberId={memberId} />
      </Card>

      {/* Faith milestones */}
      <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-violet-500" /> Faith milestones
            </CardTitle>
            <CardDescription className="text-xs font-medium">Salvation, baptism, membership, ministry onboarding, and leadership markers.</CardDescription>
          </div>
          <Button onClick={onAddMilestone} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black h-9 rounded-xl px-4 gap-2">
            <Plus size={16} /> Add milestone
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {milestones.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Award size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">No milestones recorded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
                      <CheckCircle2 size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{m.type}</p>
                      <p className="text-xs font-medium text-slate-500">
                        {new Date(m.date).toLocaleDateString()}
                        {m.notes ? ` · ${m.notes}` : ''}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-rose-400 hover:text-rose-600" onClick={() => void onDeleteMilestone(m.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles & responsibilities */}
      <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-amber-500" /> Roles &amp; responsibilities
            </CardTitle>
            <CardDescription className="text-xs font-medium">Volunteer assignments, ministry roles, leadership, and service — formerly split across Volunteers module.</CardDescription>
          </div>
          <Button onClick={onAssignRole} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black h-9 rounded-xl px-4 gap-2">
            <Plus size={16} /> Assign role
          </Button>
        </CardHeader>
        <CardContent className="p-5 space-y-6">
          {responsibilities.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              <HandHeart size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">No active assignments.</p>
            </div>
          ) : (
            <>
              {[
                { title: 'Volunteer assignments', icon: HandHeart, items: volunteerRoles },
                { title: 'Ministry roles', icon: BookOpen, items: ministryRoles },
                { title: 'Leadership roles', icon: Users, items: leadershipRoles },
                { title: 'Service responsibilities', icon: Briefcase, items: serviceRoles },
              ]
                .filter((s) => s.items.length > 0)
                .map((section) => (
                  <div key={section.title}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                      <section.icon className="w-3.5 h-3.5" /> {section.title}
                    </p>
                    <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                      {section.items.map((r: { id: string; role: string; status: string; entityType: string; entityId?: string | null }) => (
                        <div key={r.id} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50">
                          <div>
                            <p className="text-sm font-bold text-slate-900">{r.role}</p>
                            <p className="text-xs font-medium text-slate-500">
                              {r.status} · {resolveResponsibilityLabel(r)} · {servingTierForRole(r.role)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-slate-100 text-slate-600 border-none uppercase tracking-widest text-[10px] font-black">{r.status}</Badge>
                            <Button variant="ghost" size="icon" className="text-rose-400" onClick={() => void onRemoveResponsibility(r.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </>
          )}
        </CardContent>
      </Card>

      {/* Small group assignment */}
      <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-500" /> Group assignment
            </CardTitle>
            <CardDescription className="text-xs font-medium">Small group membership and leader roles — manage groups in Small Groups workspace.</CardDescription>
          </div>
          {onModuleChange && (
            <Button
              variant="outline"
              size="sm"
              className="font-black text-[10px] uppercase tracking-widest"
              onClick={() => onModuleChange('small-groups')}
            >
              Open groups
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {smallGroupMembers.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <Users size={28} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm font-bold">Not assigned to a small group.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {smallGroupMembers.map((sg) => (
                <div key={sg.id} className="flex items-center justify-between p-5 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{sg.group?.name ?? 'Group'}</p>
                    <p className="text-xs text-slate-500 font-medium">
                      {sg.role}
                      {sg.group?.meetingDay ? ` · ${sg.group.meetingDay}s` : ''}
                      {sg.group?.type ? ` · ${sg.group.type}` : ''}
                      {sg.joinedAt ? ` · Since ${new Date(sg.joinedAt).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <Badge className={cn('border-none text-[10px] font-black uppercase', sg.role === 'LEADER' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700')}>
                    {sg.role}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificates */}
      <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" /> Certificates &amp; completion records
          </CardTitle>
          <CardDescription className="text-xs font-medium">Baptism certificates, declarations, and generated completion documents.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {certificateDocs.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <FileText size={28} className="mx-auto mb-2 opacity-20" />
              <p className="text-sm font-bold">No certificates on file.</p>
              <p className="text-xs mt-1">Generate from the Records tab or upload a document.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {certificateDocs.map((d) => (
                <div key={d.id} className="flex items-center justify-between p-5 hover:bg-slate-50">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{d.type}</p>
                    <p className="text-xs text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</p>
                  </div>
                  {d.fileUrl && (
                    <Button variant="ghost" size="sm" className="text-indigo-600 font-bold" onClick={() => window.open(`${SERVER_ROOT}${d.fileUrl}`, '_blank')}>
                      View
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
