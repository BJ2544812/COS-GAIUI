import * as React from 'react';
import { ListTodo, Clock, GitBranch, CheckCircle2, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ERPModule } from '@/types';
import { apiRequest } from '@/lib/apiClient';

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority?: string;
  dueDate?: string | null;
  targetType?: string;
  targetId?: string;
};

type ActivityRow = {
  id: string;
  eventName: string;
  entityType: string;
  status: string;
  createdAt: string;
  processedAt?: string | null;
  error?: string | null;
};

export function WorkflowCommandPanel({
  myTasks,
  teamTasks,
  overdueTasks,
  recentActivity,
  pendingApprovals,
  onModuleChange,
  onRefresh,
}: {
  myTasks: Array<Record<string, unknown>>;
  teamTasks: Array<Record<string, unknown>>;
  overdueTasks: Array<Record<string, unknown>>;
  recentActivity: ActivityRow[];
  pendingApprovals: Array<{ id: string; name: string; status: string }>;
  onModuleChange?: (m: ERPModule) => void;
  onRefresh: () => void;
}) {
  const [tab, setTab] = React.useState<'mine' | 'team' | 'timeline'>('mine');

  const asTasks = (rows: Array<Record<string, unknown>>) =>
    rows as unknown as TaskRow[];

  const completeTask = async (id: string) => {
    await apiRequest(`discipleship/v2/tasks/${id}/complete`, { method: 'POST' });
    onRefresh();
  };

  const renderTaskList = (tasks: TaskRow[], empty: string) => {
    if (tasks.length === 0) {
      return <p className="text-sm text-slate-500 font-medium py-6 text-center">{empty}</p>;
    }
    return (
      <ul className="divide-y divide-slate-50">
        {tasks.map((t) => {
          const overdue = t.dueDate && new Date(t.dueDate) < new Date();
          return (
            <li key={t.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-sm">{t.title}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {t.targetType ?? 'Task'} · {t.status}
                  {t.dueDate ? ` · due ${new Date(t.dueDate).toLocaleDateString()}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {overdue && (
                  <Badge className="bg-rose-100 text-rose-800 border-none text-[9px] font-black">OVERDUE</Badge>
                )}
                {t.status === 'PENDING' && (
                  <Button type="button" size="sm" variant="outline" onClick={() => void completeTask(t.id)}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Done
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-none shadow-sm rounded-3xl lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg font-black flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-indigo-500" />
            Workflow command
          </CardTitle>
          <CardDescription>Tasks, approvals, and ownership</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-4">
            {(['mine', 'team', 'timeline'] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  'flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all',
                  tab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500',
                )}
              >
                {id === 'mine' ? 'My tasks' : id === 'team' ? 'Team' : 'Timeline'}
              </button>
            ))}
          </div>

          {tab === 'mine' && renderTaskList(asTasks(myTasks), 'No tasks assigned to you.')}
          {tab === 'team' && renderTaskList(asTasks(teamTasks), 'No team tasks in queue.')}
          {tab === 'timeline' && (
            <ul className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No recent workflow activity.</p>
              ) : (
                recentActivity.map((log) => (
                  <li key={log.id} className="flex gap-3 text-sm">
                    <GitBranch className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-800">{log.eventName}</p>
                      <p className="text-xs text-slate-500">
                        {log.entityType} · {log.status} · {new Date(log.createdAt).toLocaleString()}
                      </p>
                      {log.error && <p className="text-xs text-rose-600 mt-1">{log.error}</p>}
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}

          {overdueTasks.length > 0 && tab !== 'timeline' && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-100">
              <p className="text-[10px] font-black uppercase text-rose-700 tracking-widest mb-2 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {overdueTasks.length} overdue
              </p>
              {renderTaskList(asTasks(overdueTasks).slice(0, 3), '')}
            </div>
          )}

          {pendingApprovals.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-black uppercase text-amber-700 tracking-widest">Pending event approvals</p>
              {pendingApprovals.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem('ucos_open_event_id', a.id);
                    onModuleChange?.('events');
                  }}
                  className="w-full flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 text-left text-sm font-bold"
                >
                  {a.name}
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
              ))}
            </div>
          )}

          <Button type="button" variant="ghost" className="w-full mt-4 text-indigo-600 font-bold" onClick={() => onModuleChange?.('discipleship')}>
            Open full task workspace
          </Button>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl">
        <CardHeader>
          <CardTitle className="text-lg font-black">Open check-in</CardTitle>
          <CardDescription>Attendance sessions ready for live operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button type="button" className="w-full bg-indigo-600" onClick={() => onModuleChange?.('attendance')}>
            Go to attendance
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => onModuleChange?.('workflow-monitor')}>
            System workflow queue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
