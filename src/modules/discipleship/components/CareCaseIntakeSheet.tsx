import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MemberSelect } from './MemberSelect';
import { Lock, AlertCircle, Save } from 'lucide-react';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';

interface CareCaseIntakeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: any[];
  users: any[];
  onSuccess: (newCase: any) => void;
}

export function CareCaseIntakeSheet({ open, onOpenChange, members, users, onSuccess }: CareCaseIntakeSheetProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    memberId: '',
    category: 'General Pastoral Care',
    urgency: 'MEDIUM',
    confidentialityLevel: 'PASTORAL',
    assignedUserId: '',
    initialNote: ''
  });
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!formData.memberId) {
      setError('Member is required');
      return;
    }
    
    try {
      setLoading(true);
      const res = await apiRequest<{ status: string; data: any }>('discipleship/v2/care-cases', {
        method: 'POST',
        body: {
          memberId: formData.memberId,
          category: formData.category,
          urgency: formData.urgency,
          confidentialityLevel: formData.confidentialityLevel,
          assignedUserId: formData.assignedUserId || undefined,
        },
      });

      const newCase: any = parseApiResponse(res);

      // Automatically add the initial note if provided
      if (formData.initialNote.trim()) {
        const logRes = await apiRequest<{ status: string; data: any }>(
          `discipleship/v2/care-cases/${newCase.id}/logs`,
          {
            method: 'POST',
            body: { interactionType: 'Initial Intake', content: formData.initialNote },
          },
        );
        newCase.logs = [parseApiResponse(logRes)];
      } else {
        newCase.logs = [];
      }

      onSuccess(newCase);
      onOpenChange(false);
      
      // Reset
      setFormData({
        memberId: '',
        category: 'General Pastoral Care',
        urgency: 'MEDIUM',
        confidentialityLevel: 'PASTORAL',
        assignedUserId: '',
        initialNote: ''
      });
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to create care case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl h-full flex flex-col bg-white border-l-0 sm:border-l sm:rounded-l-3xl shadow-2xl p-0">
        <div className="flex-1 overflow-y-auto p-8 pb-32">
        <SheetHeader className="mb-8 text-left space-y-2">
          <SheetTitle className="text-3xl font-black uppercase tracking-tight text-slate-900">Open Care Case</SheetTitle>
          <SheetDescription className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Initialize a pastoral care workflow. Notes will be restricted based on the selected confidentiality level.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8">
          {/* Error Display */}
          {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-[11px] font-bold uppercase tracking-widest">{error}</p>
            </div>
          )}

          {/* Member Selection */}
          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Person Seeking Care <span className="text-rose-500">*</span></label>
            <MemberSelect 
              members={members} 
              value={formData.memberId} 
              onChange={v => setFormData({ ...formData, memberId: v })} 
              placeholder="Search congregation..."
            />
          </div>

          {/* Categorization Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Ministry Category</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-xl h-12 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none shadow-inner"
              >
                <option value="General Pastoral Care">General Care</option>
                <option value="Pre-Marital">Pre-Marital</option>
                <option value="Bereavement">Bereavement</option>
                <option value="Crisis Intervention">Crisis Intervention</option>
                <option value="Financial Hardship">Financial Hardship</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Urgency Level</label>
              <select 
                value={formData.urgency}
                onChange={e => setFormData({ ...formData, urgency: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-xl h-12 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none shadow-inner"
              >
                <option value="LOW">Low - Routine</option>
                <option value="MEDIUM">Medium - Important</option>
                <option value="HIGH">High - Urgent</option>
                <option value="CRITICAL">Critical - Emergency</option>
              </select>
            </div>
          </div>

          {/* Confidentiality */}
          <div className="space-y-3 bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <label className="text-[10px] font-black uppercase tracking-widest text-amber-800">Confidentiality Tier</label>
            </div>
            <select 
              value={formData.confidentialityLevel}
              onChange={e => setFormData({ ...formData, confidentialityLevel: e.target.value })}
              className="w-full bg-white border border-amber-200 rounded-xl h-12 px-4 text-sm font-bold text-amber-950 focus:ring-2 focus:ring-amber-500 outline-none appearance-none shadow-sm"
            >
              <option value="PUBLIC">Public (All Staff & Volunteers)</option>
              <option value="GROUP">Group (Small Group Leaders)</option>
              <option value="PASTORAL">Pastoral (Pastors & Counselors)</option>
              <option value="SENIOR_PASTORAL">Senior Pastoral (Campus Lead Only)</option>
              <option value="RESTRICTED">Restricted (System Admin / Head Pastor)</option>
            </select>
            <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest pt-1 leading-relaxed">
              Restricted records are cryptographically masked from standard reporting.
            </p>
          </div>

          {/* Shepherd Assignment */}
          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Assign Shepherd (Optional)</label>
            <select 
              value={formData.assignedUserId}
              onChange={e => setFormData({ ...formData, assignedUserId: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-xl h-12 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none shadow-inner"
            >
              <option value="">Unassigned - Group Pool</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.username} ({u.role?.name})</option>
              ))}
            </select>
          </div>

          {/* Initial Note */}
          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Initial Care Note</label>
            <textarea 
              value={formData.initialNote}
              onChange={e => setFormData({ ...formData, initialNote: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-inner"
              rows={4}
              placeholder="Provide background context, prayer points, or next steps..."
            />
          </div>
        </div>

        </div>
        <div className="sticky bottom-0 bg-white p-6 pt-4 border-t border-slate-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] mt-auto w-full z-10">
          <SheetFooter className="sm:justify-start w-full">
            <Button 
              disabled={loading || !formData.memberId} 
              onClick={handleSubmit} 
              className="w-full h-14 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 transition-all"
            >
              {loading ? 'Initializing Protocol...' : 'Open Care Case'}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
