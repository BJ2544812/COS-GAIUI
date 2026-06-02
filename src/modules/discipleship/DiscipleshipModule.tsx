import * as React from 'react';
import { 
  Heart, 
  ListTodo, 
  Users, 
  Calendar,
  Lock,
  ArrowLeft,
  ArrowRight,
  Plus,
  Send,
  CheckCircle,
  Clock,
  ShieldAlert,
  MessageSquare,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ERPModule } from '@/types';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { format } from 'date-fns';
import { PastoralTimeline, PastoralEvent } from '@/components/ui/PastoralTimeline';
import { CareCaseIntakeSheet } from './components/CareCaseIntakeSheet';
import { TaskIntakeSheet } from './components/TaskIntakeSheet';
import { ModuleHeader, ActionButton } from '@/components/modules/ModuleHeader';

interface DiscipleshipModuleProps {
  onModuleChange?: (module: ERPModule) => void;
}

export function DiscipleshipModule({ onModuleChange }: DiscipleshipModuleProps) {
  const [view, setView] = React.useState<'workspace' | 'care-detail' | 'task-detail'>('workspace');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const [tasks, setTasks] = React.useState<any[]>([]);
  const [careCases, setCareCases] = React.useState<any[]>([]);
  const [prayerRequests, setPrayerRequests] = React.useState<any[]>([]);
  const [members, setMembers] = React.useState<any[]>([]);
  const [users, setUsers] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Intake Sheet states
  const [isCareSheetOpen, setIsCareSheetOpen] = React.useState(false);
  const [isTaskSheetOpen, setIsTaskSheetOpen] = React.useState(false);

  // Detail states
  const [activeCareCase, setActiveCareCase] = React.useState<any>(null);
  const [newLogContent, setNewLogContent] = React.useState('');

  React.useEffect(() => {
    async function fetchData() {
      const safetyTimeout = setTimeout(() => {
        console.warn("[Discipleship] Initial data fetch taking > 5s. Forcing loader hide.");
        setLoading(false);
      }, 5000);

      try {
        console.log("[Discipleship] Initializing data...");
        setLoading(true);
        const [tasksRes, careRes, memRes, userRes] = await Promise.all([
          apiRequest<unknown>('discipleship/v2/tasks/my-tasks', { method: 'GET' }).catch(e => { console.error("Tasks fetch fail:", e); return { status: 'success', data: [] }; }),
          apiRequest<unknown>('discipleship/v2/care-cases', { method: 'GET' }).catch(e => { console.error("Care cases fetch fail:", e); return { status: 'success', data: [] }; }),
          apiRequest<unknown>('members', { method: 'GET' }).catch(e => { console.error("Members fetch fail:", e); return { status: 'success', data: [] }; }),
          apiRequest<unknown>('auth/me', { method: 'GET' }).catch(e => { console.error("User fetch fail:", e); return { status: 'success', data: [] }; })
        ]);
        
        console.log("[Discipleship] Data received. Parsing...");
        setTasks(parseApiResponse(tasksRes) || []);
        setCareCases(parseApiResponse(careRes) || []);
        setMembers(parseApiResponse(memRes) || []);
        
        // auth/me returns the signed-in user — use as a single assignee option where staff pickers need "self".
        const userData = parseApiResponse(userRes);
        setUsers(userData ? [userData] : []);
      } catch (e) {
        console.error("Discipleship data fetch error:", e);
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
        console.log("[Discipleship] Initialization complete.");
      }
    }
    if (view === 'workspace') fetchData();
  }, [view]);

  // Hydrate care detail from API (logs + member) without depending on careCases (avoids update loops).
  React.useEffect(() => {
    if (view !== 'care-detail' || !selectedId) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiRequest<unknown>(`discipleship/v2/care-cases/${selectedId}`, { method: 'GET' });
        const hydrated = parseApiResponse<any>(res);
        if (cancelled) return;
        setActiveCareCase({ ...hydrated, logs: hydrated.logs || [] });
        setCareCases((prev) => prev.map((c) => (c.id === selectedId ? { ...c, ...hydrated } : c)));
      } catch (e) {
        console.error('[Discipleship] care case hydrate failed', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [view, selectedId]);

  const openCareDetail = (id: string, row?: any) => {
    setSelectedId(id);
    setView('care-detail');
    if (row) setActiveCareCase({ ...row, logs: row.logs || [] });
  };

  const completeTask = async (taskId: string) => {
    try {
      await apiRequest(`discipleship/v2/tasks/${taskId}/complete`, { method: 'POST' });
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (e) {
      console.error(e);
      alert('Failed to complete task');
    }
  };

  const closeCareCase = async (caseId: string) => {
    try {
      await apiRequest(`discipleship/v2/care-cases/${caseId}/close`, { method: 'POST' });
      if (activeCareCase?.id === caseId) {
        setActiveCareCase({ ...activeCareCase, status: 'CLOSED' });
      }
      setCareCases(careCases.map(c => c.id === caseId ? { ...c, status: 'CLOSED' } : c));
    } catch (e) {
      console.error(e);
      alert('Failed to close care case');
    }
  };

  const addCareLog = async () => {
    if (!newLogContent.trim() || !activeCareCase) return;
    try {
      const res = await apiRequest(`discipleship/v2/care-cases/${activeCareCase.id}/logs`, {
        method: 'POST',
        body: { interactionType: 'Note', content: newLogContent },
      });
      const log = parseApiResponse(res);
      setActiveCareCase({
        ...activeCareCase,
        logs: [log, ...(activeCareCase.logs || [])],
      });
      setCareCases((prev) =>
        prev.map((c) =>
          c.id === activeCareCase.id ? { ...c, logs: [log, ...(c.logs || [])] } : c,
        ),
      );
      setNewLogContent('');
    } catch (e) {
      console.error(e);
      alert('Failed to add care log');
    }
  };

  if (loading && view === 'workspace') {
    return <div className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Workspace...</div>;
  }

  // -------------------------------------------------------------
  // VIEW: CARE DETAIL
  // -------------------------------------------------------------
  if (view === 'care-detail' && activeCareCase) {
    const isRestricted = activeCareCase.confidentialityLevel !== 'PUBLIC';
    
    // Transform logs to timeline events
    const timelineEvents: PastoralEvent[] = (activeCareCase.logs || []).map((log: any) => ({
      id: log.id,
      type: 'CARE_LOG',
      title: `${log.interactionType} added`,
      description: log.content,
      timestamp: log.date || log.createdAt,
      actorName: 'Pastoral Staff' // Would normally map to log.author.username
    }));

    // Add creation event
    timelineEvents.push({
      id: 'creation',
      type: 'SYSTEM',
      title: 'Care Case Opened',
      description: `Category: ${activeCareCase.category}`,
      timestamp: activeCareCase.createdAt,
    });

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => setView('workspace')} className="gap-2 px-0 text-slate-400 hover:text-slate-900 hover:bg-transparent">
          <ArrowLeft className="w-5 h-5" /> <span className="font-black text-[10px] tracking-widest uppercase">Back to Workspace</span>
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase leading-none">{activeCareCase.member?.name || 'Unknown Member'}</h1>
              {isRestricted && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-3 py-1 rounded-full"><Lock className="w-3 h-3 mr-1" /> Confidential</Badge>}
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] pl-1">{activeCareCase.category} • {activeCareCase.status}</p>
          </div>
          {activeCareCase.status !== 'CLOSED' && (
            <Button onClick={() => closeCareCase(activeCareCase.id)} variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-black text-[10px] uppercase tracking-widest">Close Case</Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Timeline Column */}
          <div className="lg:col-span-2 space-y-8">
            {activeCareCase.status !== 'CLOSED' && (
              <Card className="rounded-[2rem] border-none shadow-lg bg-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <textarea 
                        value={newLogContent}
                        onChange={(e) => setNewLogContent(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium text-slate-900 resize-none focus:ring-2 focus:ring-indigo-500 outline-none" 
                        placeholder="Add a pastoral note, counseling summary, or prayer update..."
                        rows={3}
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Notes are visible per confidentiality rules.</span>
                        <Button onClick={addCareLog} disabled={!newLogContent.trim()} className="rounded-xl px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest">
                          <Send className="w-3 h-3 mr-2" /> Save Log
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="pt-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 pl-4">Pastoral Timeline</h3>
              <PastoralTimeline events={timelineEvents} />
            </div>
          </div>

          {/* Context Sidebar */}
          <div className="space-y-6">
            <Card className="rounded-[2rem] border-none shadow-md bg-slate-50">
              <CardContent className="p-6 space-y-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Growth Stage</p>
                  <Badge className="bg-indigo-50 text-indigo-700 border-none rounded-lg font-black text-[9px] uppercase tracking-widest">
                    {activeCareCase.member?.growthStage || 'Visitor'}
                  </Badge>
                </div>
                {activeCareCase.member?.smallGroupMembers?.length > 0 && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Small Group</p>
                    <p className="text-sm font-bold text-slate-900">{activeCareCase.member.smallGroupMembers[0].group?.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Assigned Shepherd</p>
                  <p className="text-sm font-bold text-slate-900">{activeCareCase.assignedUser?.username || 'Unassigned'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Priority</p>
                  <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-300">{activeCareCase.urgency}</Badge>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Opened On</p>
                  <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    {activeCareCase.createdAt ? format(new Date(activeCareCase.createdAt), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Quick Actions</p>
                  <button onClick={() => onModuleChange?.('pathways')} className="w-full text-left text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 uppercase tracking-widest">Update Pathway Stage <ArrowRight size={10} /></button>
                  <button onClick={() => onModuleChange?.('small-groups')} className="w-full text-left text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 uppercase tracking-widest">View Small Group <ArrowRight size={10} /></button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: WORKSPACE (Main)
  // -------------------------------------------------------------
  const openTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
  const activeCases = careCases.filter(c => c.status !== 'CLOSED');

  return (
    <div className="space-y-10 animate-in fade-in duration-700 text-left">
      <ModuleHeader
        title="Pastoral Care"
        subtitle="Follow-ups, care cases, and discipleship tasks for your pastoral team."
        status="live"
        icon={Users}
        actions={
          <>
            <ActionButton label="New Task" icon={Plus} variant="secondary" onClick={() => setIsTaskSheetOpen(true)} />
            <ActionButton label="Open Care Case" icon={Plus} variant="primary" onClick={() => setIsCareSheetOpen(true)} className="bg-slate-950 hover:bg-slate-900 text-white" />
          </>
        }
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-2xl h-14 mb-8">
          <TabsTrigger value="overview" className="rounded-xl px-8 text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="care" className="rounded-xl px-8 text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Care Cases</TabsTrigger>
          <TabsTrigger value="prayer" className="rounded-xl px-8 text-[11px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Prayer Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8 outline-none">
          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-[2rem] border-none shadow-sm bg-indigo-50/50 hover:bg-indigo-50 transition-colors">
              <CardContent className="p-8 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600/80 mb-2">Open Tasks</p>
                  <h3 className="text-4xl font-black text-indigo-950 leading-none">{openTasks.length}</h3>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <ListTodo className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-none shadow-sm bg-rose-50/50 hover:bg-rose-50 transition-colors">
              <CardContent className="p-8 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-600/80 mb-2">Active Care Cases</p>
                  <h3 className="text-4xl font-black text-rose-950 leading-none">{activeCases.length}</h3>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-none shadow-sm bg-amber-50/50 hover:bg-amber-50 transition-colors">
              <CardContent className="p-8 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/80 mb-2">My Mentees</p>
                  <h3 className="text-4xl font-black text-amber-950 leading-none">0</h3>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Priority Tasks */}
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
              <CardHeader className="p-8 pb-4 border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">Priority Tasks</CardTitle>
                  <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Requires immediate attention</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {openTasks.length === 0 ? (
                     <div className="p-10 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">No pending tasks. You're all caught up!</div>
                  ) : openTasks.slice(0, 5).map(task => (
                    <div key={task.id} className="p-6 flex items-start justify-between hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => console.log('Task clicked')}>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900">{task.title}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="text-[8px] uppercase tracking-widest font-black rounded-lg bg-white">{task.targetType}</Badge>
                          {task.dueDate && <span className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(task.dueDate), 'MMM d')}</span>}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); completeTask(task.id); }} className="h-8 w-8 p-0 rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 shrink-0">
                        <CheckCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Active Care Cases */}
            <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden">
              <CardHeader className="p-8 pb-4 border-b border-slate-50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">Active Care Cases</CardTitle>
                  <CardDescription className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Cases you have visibility into</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {activeCases.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">No active care cases found.</div>
                  ) : activeCases.slice(0, 5).map(c => (
                    <div key={c.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => openCareDetail(c.id, c)}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-sm group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                           {c.member?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{c.member?.name || 'Unknown'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{c.category}</span>
                            {c.confidentialityLevel !== 'PUBLIC' && (
                              <Lock className="w-3 h-3 text-amber-500 ml-1" />
                            )}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="care" className="outline-none">
           <Card className="rounded-[2.5rem] border-none shadow-xl bg-white">
              <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-black text-slate-900 uppercase tracking-tight">Care Cases Directory</CardTitle>
                <Button onClick={() => setIsCareSheetOpen(true)} className="rounded-xl px-6 bg-slate-950 hover:bg-slate-900 text-[10px] font-black uppercase tracking-widest">Open New Case</Button>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="divide-y divide-slate-50">
                    {careCases.map(c => (
                      <div key={c.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer group transition-colors" onClick={() => openCareDetail(c.id, c)}>
                         <div className="flex flex-col gap-1">
                            <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{c.member?.name}</p>
                            <div className="flex items-center gap-2">
                               <Badge variant="outline" className="text-[8px] uppercase tracking-widest bg-white">{c.status}</Badge>
                               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{c.category}</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-4">
                            {c.confidentialityLevel === 'RESTRICTED' && <Badge className="bg-rose-50 text-rose-600 border-none text-[8px] font-black">Restricted</Badge>}
                            {c.confidentialityLevel === 'PASTORAL' && <Badge className="bg-amber-50 text-amber-600 border-none text-[8px] font-black">Pastoral</Badge>}
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                         </div>
                      </div>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="prayer" className="outline-none">
           <Card className="rounded-[2.5rem] border-none shadow-xl bg-white flex items-center justify-center p-20 text-center">
              <div className="space-y-4">
                 <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
                    <ShieldAlert className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Prayer Request Center</h3>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest max-w-sm mx-auto">No prayer requests requiring active pastoral administration.</p>
              </div>
           </Card>
        </TabsContent>

      </Tabs>

      <CareCaseIntakeSheet 
        open={isCareSheetOpen} 
        onOpenChange={setIsCareSheetOpen} 
        members={members} 
        users={users} 
        onSuccess={(newCase) => {
          const member = members.find(m => m.id === newCase.memberId);
          const fullCase = { ...newCase, member };
          setCareCases((prev) => [fullCase, ...prev]);
          setSelectedId(fullCase.id);
          setView('care-detail');
          setActiveCareCase({ ...fullCase, logs: fullCase.logs || [] });
        }} 
      />

      <TaskIntakeSheet 
        open={isTaskSheetOpen} 
        onOpenChange={setIsTaskSheetOpen} 
        members={members} 
        users={users} 
        careCases={careCases}
        onSuccess={(newTask) => setTasks([newTask, ...tasks])} 
      />
    </div>
  );
}
