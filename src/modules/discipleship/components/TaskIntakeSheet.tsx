import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MemberSelect } from './MemberSelect';
import { apiRequest } from '@/lib/apiClient';

interface TaskIntakeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: any[];
  users: any[];
  careCases: any[];
  onSuccess: (newTask: any) => void;
}

export function TaskIntakeSheet({ open, onOpenChange, members, users, careCases, onSuccess }: TaskIntakeSheetProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    targetType: 'MEMBER',
    targetId: '',
    priority: 'MEDIUM',
    assignedUserId: '',
    dueDate: ''
  });
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!formData.title) {
      setError('Task title is required');
      return;
    }
    if (!formData.targetId) {
      setError('Task target is required');
      return;
    }
    
    try {
      setLoading(true);
      const res = await apiRequest('discipleship/v2/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          targetType: formData.targetType,
          targetId: formData.targetId,
          priority: formData.priority,
          assignedUserId: formData.assignedUserId || undefined,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined
        })
      });

      onSuccess((res as any).data);
      onOpenChange(false);
      
      // Reset
      setFormData({
        title: '',
        description: '',
        targetType: 'MEMBER',
        targetId: '',
        priority: 'MEDIUM',
        assignedUserId: '',
        dueDate: ''
      });
    } catch (e: any) {
      setError(e.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md h-full flex flex-col bg-white border-l-0 sm:border-l sm:rounded-l-3xl shadow-2xl p-0">
        <div className="flex-1 overflow-y-auto p-8 pb-32">
        <SheetHeader className="mb-8 text-left space-y-2">
          <SheetTitle className="text-3xl font-black uppercase tracking-tight text-slate-900">Delegate Task</SheetTitle>
          <SheetDescription className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Assign follow-ups and operational ministry tasks to staff and volunteer teams.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
              <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
            </div>
          )}
          {/* Title */}
          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Task Title <span className="text-rose-500">*</span></label>
            <input 
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-xl h-12 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner"
              placeholder="e.g. Call for hospital visit follow-up"
            />
          </div>

          {/* Target Resolution */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Relates To</label>
              <select 
                value={formData.targetType}
                onChange={e => setFormData({ ...formData, targetType: e.target.value, targetId: '' })}
                className="w-full bg-white border border-slate-200 rounded-xl h-12 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
              >
                <option value="MEMBER">Member (General Follow-up)</option>
                <option value="CARE_CASE">Care Case (Specific Workflow)</option>
                <option value="SMALL_GROUP">Small Group</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Select Target <span className="text-rose-500">*</span></label>
              {formData.targetType === 'MEMBER' && (
                <MemberSelect 
                  members={members} 
                  value={formData.targetId} 
                  onChange={v => setFormData({ ...formData, targetId: v })} 
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                />
              )}
              {formData.targetType === 'CARE_CASE' && (
                <select 
                  value={formData.targetId}
                  onChange={e => setFormData({ ...formData, targetId: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl h-12 px-4 text-sm font-bold text-slate-900 outline-none appearance-none"
                >
                  <option value="">Select an active care case...</option>
                  {careCases.map(c => (
                    <option key={c.id} value={c.id}>{c.member?.name} - {c.category}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Assignment & Due */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Assign To</label>
              <select 
                value={formData.assignedUserId}
                onChange={e => setFormData({ ...formData, assignedUserId: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-xl h-12 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none shadow-inner"
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Due Date</label>
              <input 
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-xl h-12 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Task Context / Notes</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-inner"
              rows={3}
              placeholder="Add instructions or details..."
            />
          </div>
        </div>

        </div>
        <div className="sticky bottom-0 bg-white p-6 pt-4 border-t border-slate-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] mt-auto w-full z-10">
          <SheetFooter className="sm:justify-start w-full">
            <Button 
              disabled={loading || !formData.title || !formData.targetId} 
              onClick={handleSubmit} 
              className="w-full h-14 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all"
            >
              {loading ? 'Creating...' : 'Issue Task'}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
