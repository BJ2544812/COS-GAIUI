import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MemberSelect } from './MemberSelect';
import { apiRequest } from '@/lib/apiClient';
import { Users } from 'lucide-react';

interface MentorshipIntakeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: any[];
  users: any[];
  onSuccess?: () => void;
}

export function MentorshipIntakeSheet({ open, onOpenChange, members, users, onSuccess }: MentorshipIntakeSheetProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    discipleId: '',
    mentorId: '',
    focus: 'Spiritual Foundations',
    startDate: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!formData.discipleId || !formData.mentorId) {
      setError('Disciple and Mentor are required');
      return;
    }
    
    try {
      setLoading(true);
      await apiRequest('discipleship/v2/mentorships/assign', {
        method: 'POST',
        body: JSON.stringify({
          discipleId: formData.discipleId,
          mentorId: formData.mentorId
        })
      });

      if (onSuccess) onSuccess();
      onOpenChange(false);
      
      // Reset
      setFormData({
        discipleId: '',
        mentorId: '',
        focus: 'Spiritual Foundations',
        startDate: new Date().toISOString().split('T')[0]
      });
    } catch (e: any) {
      setError(e.message || 'Failed to assign mentorship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md h-full flex flex-col bg-white border-l-0 sm:border-l sm:rounded-l-3xl shadow-2xl p-0">
        <div className="flex-1 overflow-y-auto p-8 pb-32">
        <SheetHeader className="mb-8 text-left space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
             <Users className="w-6 h-6" />
          </div>
          <SheetTitle className="text-3xl font-black uppercase tracking-tight text-slate-900">Assign Mentorship</SheetTitle>
          <SheetDescription className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Establish a formal discipleship relationship between a mature leader and a congregation member.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
              <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
            </div>
          )}
          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Disciple (Seeking Growth) <span className="text-rose-500">*</span></label>
            <MemberSelect 
              members={members} 
              value={formData.discipleId} 
              onChange={v => setFormData({ ...formData, discipleId: v })} 
              className="bg-slate-50 rounded-xl"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Mentor (Leader) <span className="text-rose-500">*</span></label>
            <select 
              value={formData.mentorId}
              onChange={e => setFormData({ ...formData, mentorId: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-xl h-12 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none shadow-inner"
            >
              <option value="">Select a pastor or leader...</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.username} ({u.role?.name})</option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Ministry Focus</label>
            <select 
              value={formData.focus}
              onChange={e => setFormData({ ...formData, focus: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl h-12 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
            >
              <option value="Spiritual Foundations">Spiritual Foundations</option>
              <option value="Leadership Training">Leadership Training</option>
              <option value="Marriage Guidance">Marriage Guidance</option>
              <option value="Life Transition">Life Transition</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Target Start Date</label>
            <input 
              type="date"
              value={formData.startDate}
              onChange={e => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-xl h-12 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner"
            />
          </div>
        </div>

        </div>
        <div className="sticky bottom-0 bg-white p-6 pt-4 border-t border-slate-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] mt-auto w-full z-10">
          <SheetFooter className="sm:justify-start w-full">
            <Button 
              disabled={loading || !formData.discipleId || !formData.mentorId} 
              onClick={handleSubmit} 
              className="w-full h-14 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all"
            >
              {loading ? 'Assigning...' : 'Establish Mentorship'}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
