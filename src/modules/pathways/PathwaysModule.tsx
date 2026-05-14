import React from 'react';
import {
  Route, ChevronRight, Users, BookOpen,
  ArrowRight, Award, Target, UserCheck, Plus, Star,
  Flag, Layers, Circle, ChevronDown, X, RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ERPModule } from '@/types';
import { ModuleHeader, StatCard, SectionCard } from '@/components/modules/ModuleHeader';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

interface PathwaysModuleProps {
  onModuleChange?: (module: ERPModule) => void;
}

interface Member {
  id: string; name: string; email?: string | null;
  growthStage?: string | null;
}

type PathwayRow = {
  id: string;
  name: string;
  description?: string | null;
  steps: { id: string; name: string; sequence: number }[];
  _count?: { progress: number };
};

const GROWTH_STAGES = [
  { id:'Visitor', label:'Visitor', icon:Circle, color:'bg-slate-100 text-slate-600 border-slate-200', iconColor:'text-slate-400', iconBg:'bg-slate-50', description:'First-time and returning guests.', next:'New Believer' },
  { id:'NewBeliever', label:'New Believer', icon:Star, color:'bg-amber-50 text-amber-700 border-amber-200', iconColor:'text-amber-600', iconBg:'bg-amber-50', description:'Recently saved or baptized. In foundational classes.', next:'Member' },
  { id:'Member', label:'Member', icon:UserCheck, color:'bg-emerald-50 text-emerald-700 border-emerald-200', iconColor:'text-emerald-600', iconBg:'bg-emerald-50', description:'Completed membership class. Committed to the congregation.', next:'Leader' },
  { id:'Leader', label:'Leader', icon:Award, color:'bg-violet-50 text-violet-700 border-violet-200', iconColor:'text-violet-600', iconBg:'bg-violet-50', description:'Mentoring others. Leading a group, ministry, or team.', next:'Staff' },
  { id:'Staff', label:'Staff', icon:Target, color:'bg-indigo-50 text-indigo-700 border-indigo-200', iconColor:'text-indigo-600', iconBg:'bg-indigo-50', description:'Full-time or part-time ministry staff member.', next:null },
];

const PATHWAY_CARD_GRADIENTS = [
  'from-indigo-400 to-blue-600',
  'from-emerald-400 to-teal-500',
  'from-violet-400 to-purple-600',
  'from-amber-400 to-orange-500',
];

export function PathwaysModule({ onModuleChange }: PathwaysModuleProps) {
  const [activeTab, setActiveTab] = React.useState<'overview'|'stages'|'blueprints'>('overview');
  const [pathways, setPathways] = React.useState<PathwayRow[]>([]);
  const [pathwaysLoading, setPathwaysLoading] = React.useState(false);
  const [pathwaysError, setPathwaysError] = React.useState<string | null>(null);
  const [expandedBlueprint, setExpandedBlueprint] = React.useState<string | null>(null);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showAssignModal, setShowAssignModal] = React.useState(false);
  const [assignForm, setAssignForm] = React.useState({ memberId:'', stage:'' });
  const [assignSaving, setAssignSaving] = React.useState(false);
  const [assignError, setAssignError] = React.useState<string|null>(null);
  const [selectedStageFilter, setSelectedStageFilter] = React.useState<string|null>(null);

  const fetchMembers = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiRequest('members');
      setMembers(parseApiResponse<Member[]>(res) || []);
    } catch { setMembers([]); }
    finally { setLoading(false); }
  }, []);

  const fetchPathways = React.useCallback(async () => {
    try {
      setPathwaysLoading(true);
      setPathwaysError(null);
      const res = await apiRequest('structure/pathways');
      const data = parseApiResponse<PathwayRow[]>(res);
      setPathways(Array.isArray(data) ? data : []);
    } catch {
      setPathways([]);
      setPathwaysError('Could not load pathways from the server.');
    } finally {
      setPathwaysLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchPathways();
  }, [fetchPathways]);

  React.useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  const handleAssignStage = async () => {
    if (!assignForm.memberId || !assignForm.stage) return;
    try {
      setAssignSaving(true); setAssignError(null);
      await apiRequest(`members/${assignForm.memberId}`, { method:'PUT', body:{ growthStage: assignForm.stage } });
      setShowAssignModal(false);
      setAssignForm({ memberId:'', stage:'' });
      await fetchMembers();
    } catch (e: any) { setAssignError(e?.message || 'Failed to update stage'); }
    finally { setAssignSaving(false); }
  };

  const stageStats = GROWTH_STAGES.map(s => ({
    ...s,
    count: members.filter(m => (m.growthStage || 'Visitor') === s.id).length,
    memberList: members.filter(m => (m.growthStage || 'Visitor') === s.id),
  }));

  const filteredMembers = selectedStageFilter
    ? members.filter(m => (m.growthStage || 'Visitor') === selectedStageFilter)
    : members;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ModuleHeader
        title="Discipleship Pathways"
        subtitle="Growth stages from member records; pathway definitions load from your tenant data."
        status="live"
        icon={Route}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { void fetchMembers(); void fetchPathways(); }} className="h-9 px-4 rounded-xl border-slate-200 gap-2 font-bold text-[11px]"><RefreshCw size={13}/>Refresh</Button>
            <Button onClick={()=>setShowAssignModal(true)} className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest gap-2 shadow-sm">
              <Plus size={14}/> Assign Stage
            </Button>
          </div>
        }
      />

      {/* Stage Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stageStats.map(s => (
          <button
            key={s.id}
            onClick={() => setSelectedStageFilter(selectedStageFilter === s.id ? null : s.id)}
            className={cn('text-left bg-white rounded-2xl border shadow-sm p-4 hover:shadow-md transition-all', selectedStageFilter===s.id?'border-indigo-300 bg-indigo-50':'border-slate-100')}
          >
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', s.iconBg)}>
              <s.icon size={15} className={s.iconColor}/>
            </div>
            <p className="text-xl font-black text-slate-900">{loading?'—':s.count}</p>
            <p className="text-[10px] font-bold text-slate-600 truncate">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Tab Nav */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        {([{id:'overview',label:'Member List'},{id:'stages',label:'Growth Stages'},{id:'blueprints',label:'Pathways'}] as const).map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={cn('px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all', activeTab===tab.id?'bg-white text-indigo-600 shadow-sm':'text-slate-500 hover:text-slate-700')}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW — member list by stage */}
      {activeTab==='overview' && (
        <div className="space-y-4">
          {selectedStageFilter && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Showing:</span>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedStageFilter}</span>
              <button onClick={()=>setSelectedStageFilter(null)} className="text-[10px] text-slate-400 hover:text-slate-600 font-bold">Clear</button>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800">Member Journey Overview</h3>
              <Badge className="bg-indigo-50 text-indigo-700 border-none font-black text-[10px]">{filteredMembers.length} members</Badge>
            </div>
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm font-bold">Loading members...</div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-12 text-center">
                <Users size={24} className="mx-auto mb-3 text-slate-200"/>
                <p className="text-sm font-bold text-slate-500">No members found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                {filteredMembers.map(m => {
                  const stage = GROWTH_STAGES.find(s=>s.id===(m.growthStage||'Visitor'));
                  return (
                    <div key={m.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 transition-colors">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', stage?.iconBg||'bg-slate-50')}>
                        {stage ? <stage.icon size={14} className={stage.iconColor}/> : <Circle size={14} className="text-slate-400"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{m.name}</p>
                        {m.email && <p className="text-[10px] text-slate-400 font-medium truncate">{m.email}</p>}
                      </div>
                      <span className={cn('px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shrink-0 border', stage?.color||'bg-slate-100 text-slate-600 border-slate-200')}>
                        {m.growthStage||'Visitor'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cross-module links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon:BookOpen, iconColor:'text-indigo-600', iconBg:'bg-indigo-50', label:'Shepherd Workspace', desc:'Manage care cases and discipleship tasks.', module:'discipleship' as ERPModule },
              { icon:Users, iconColor:'text-violet-600', iconBg:'bg-violet-50', label:'Small Groups', desc:'Assign members to cell groups and community circles.', module:'small-groups' as ERPModule },
              { icon:UserCheck, iconColor:'text-amber-600', iconBg:'bg-amber-50', label:'Volunteers', desc:'Track ministry assignments and serving roles.', module:'volunteers' as ERPModule },
            ].map(item=>(
              <button key={item.label} onClick={()=>onModuleChange?.(item.module)} className="text-left bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group p-5">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', item.iconBg)}>
                  <item.icon className={cn('w-5 h-5', item.iconColor)}/>
                </div>
                <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">{item.label}</h3>
                <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-[10px] font-black text-indigo-400 group-hover:text-indigo-600 uppercase tracking-widest">Open <ArrowRight size={10}/></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STAGES TAB */}
      {activeTab==='stages' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Discipleship Pipeline</p>
            <div className="flex flex-col md:flex-row items-start md:items-stretch gap-3">
              {GROWTH_STAGES.map((stage,i)=>(
                <React.Fragment key={stage.id}>
                  <div className="flex-1 min-w-0">
                    <div className={cn('rounded-2xl border p-5 h-full', stage.color.replace('text-','border-').replace('-700','-200').replace('-600','-100'))}>
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', stage.iconBg)}>
                          <stage.icon size={18} className={stage.iconColor}/>
                        </div>
                        <div>
                          <span className={cn('text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', stage.color)}>{stage.label}</span>
                          <p className="text-lg font-black text-slate-900 mt-1">{stageStats.find(s=>s.id===stage.id)?.count??0}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{stage.description}</p>
                      {stage.next && <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Next → {stage.next}</p>}
                    </div>
                  </div>
                  {i < GROWTH_STAGES.length-1 && <ArrowRight size={18} className="text-slate-300 shrink-0 hidden md:block self-center"/>}
                </React.Fragment>
              ))}
            </div>
          </div>

          <SectionCard title="Update Member Stage" subtitle="Change a member's growth stage to advance their discipleship journey"
            actions={<button onClick={()=>setShowAssignModal(true)} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 flex items-center gap-1">Assign Stage <ChevronRight size={11}/></button>}
          >
            <p className="text-xs text-slate-500 font-medium">Growth stages are stored on each Member record. Use "Assign Stage" to advance a member through their discipleship journey.</p>
          </SectionCard>
        </div>
      )}

      {/* PATHWAYS TAB — DB-backed pathway + steps */}
      {activeTab==='blueprints' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 flex items-start gap-3">
            <Flag size={16} className="text-slate-500 shrink-0 mt-0.5"/>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              These rows are pathways stored for your tenant (usually created by seed or future admin tools). Member progress is tracked separately in Shepherd Workspace when those APIs are enabled.
            </p>
          </div>
          {pathwaysLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm font-bold">Loading pathways…</div>
          ) : pathwaysError ? (
            <div className="p-6 rounded-2xl border border-amber-200 bg-amber-50 text-sm text-amber-900 font-medium">{pathwaysError}</div>
          ) : pathways.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 shadow-sm">
              <Layers size={24} className="mx-auto mb-3 text-slate-200"/>
              <p className="text-sm font-bold text-slate-600">No pathways defined yet</p>
              <p className="text-xs text-slate-400 font-medium mt-2 max-w-md mx-auto">Run a fresh seed or add pathways via database tools. Growth stages on the other tabs still work from member records.</p>
            </div>
          ) : (
            pathways.map((bp, ix) => {
              const grad = PATHWAY_CARD_GRADIENTS[ix % PATHWAY_CARD_GRADIENTS.length]!;
              return (
            <div key={bp.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button type="button" className="w-full text-left p-6 flex items-center justify-between group" onClick={()=>setExpandedBlueprint(expandedBlueprint===bp.id?null:bp.id)}>
                <div className="flex items-center gap-4">
                  <div className={cn('w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-black text-lg shrink-0', grad)}>
                    {bp.name.slice(0, 1)}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{bp.name}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {bp.steps.length} step{bp.steps.length === 1 ? '' : 's'}
                      {typeof bp._count?.progress === 'number' ? ` · ${bp._count.progress} progress record(s)` : ''}
                    </p>
                  </div>
                </div>
                <div className={cn('w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center transition-transform', expandedBlueprint===bp.id&&'rotate-180')}>
                  <ChevronDown size={14} className="text-slate-400"/>
                </div>
              </button>
              {expandedBlueprint===bp.id && (
                <div className="px-6 pb-6 border-t border-slate-50 pt-4">
                  {bp.description && (
                    <p className="text-xs text-slate-600 font-medium mb-4">{bp.description}</p>
                  )}
                  <div className="flex flex-col gap-2">
                    {bp.steps.map((step) => (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black shrink-0">{step.sequence}</div>
                        <div className="flex-1 min-h-10 bg-slate-50 rounded-xl flex items-center px-4 py-2">
                          <span className="text-xs font-bold text-slate-700">{step.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={()=>onModuleChange?.('discipleship')} className="mt-4 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 flex items-center gap-1">
                    Open Shepherd Workspace <ArrowRight size={10}/>
                  </button>
                </div>
              )}
            </div>
              );
            })
          )}
        </div>
      )}

      {/* Assign Stage Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Assign Growth Stage</h2>
              <button onClick={()=>{setShowAssignModal(false);setAssignError(null);}} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center"><X size={15}/></button>
            </div>
            {assignError && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm font-medium">{assignError}</div>}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Member <span className="text-rose-500">*</span></label>
                <select value={assignForm.memberId} onChange={e=>setAssignForm(f=>({...f,memberId:e.target.value}))} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold appearance-none">
                  <option value="">Select member...</option>
                  {members.map(m=><option key={m.id} value={m.id}>{m.name} ({m.growthStage||'Visitor'})</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">New Stage <span className="text-rose-500">*</span></label>
                <div className="grid grid-cols-1 gap-2">
                  {GROWTH_STAGES.map(s=>(
                    <button key={s.id} onClick={()=>setAssignForm(f=>({...f,stage:s.id}))} className={cn('flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left', assignForm.stage===s.id?'border-indigo-400 bg-indigo-50':'border-slate-100 hover:border-slate-200')}>
                      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', s.iconBg)}><s.icon size={13} className={s.iconColor}/></div>
                      <div><p className="text-sm font-bold text-slate-900">{s.label}</p><p className="text-[10px] text-slate-400 font-medium">{s.description}</p></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={()=>{setShowAssignModal(false);setAssignError(null);}} className="flex-1 h-11 rounded-xl">Cancel</Button>
              <Button onClick={handleAssignStage} disabled={assignSaving||!assignForm.memberId||!assignForm.stage} className="flex-1 h-11 rounded-xl bg-indigo-600 text-white font-black text-[11px] uppercase tracking-widest">
                {assignSaving?'Saving...':'Assign Stage'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
