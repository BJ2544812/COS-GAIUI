import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { MemberSelect } from './MemberSelect';
import { ShieldAlert, Lock, Unlock } from 'lucide-react';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';

interface PrayerIntakeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: any[];
  onSuccess?: () => void;
}

export function PrayerIntakeSheet({ open, onOpenChange, members, onSuccess }: PrayerIntakeSheetProps) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    memberId: '',
    requestText: '',
    isConfidential: false,
    needsFollowUp: false
  });

  const handleSubmit = async () => {
    if (!formData.requestText) return alert('Prayer request text is required');
    
    try {
      setLoading(true);
      const res = await apiRequest('care/prayer', {
        method: 'POST',
        body: {
          content: formData.requestText,
          memberId: formData.memberId || undefined,
          isConfidential: formData.isConfidential,
          needsFollowUp: formData.needsFollowUp,
        },
      });
      parseApiResponse(res);

      if (onSuccess) onSuccess();
      onOpenChange(false);
      
      // Reset
      setFormData({
        memberId: '',
        requestText: '',
        isConfidential: false,
        needsFollowUp: false
      });
    } catch (e: unknown) {
      alert(`Error submitting prayer request: ${formatApiError(e)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white border-l-0 sm:border-l sm:rounded-l-3xl shadow-2xl p-8">
        <SheetHeader className="mb-8 text-left space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
             <ShieldAlert className="w-6 h-6" />
          </div>
          <SheetTitle className="text-3xl font-black uppercase tracking-tight text-slate-900">Log Prayer Request</SheetTitle>
          <SheetDescription className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            Document intercession needs. Mark confidential for sensitive pastoral matters.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Person (Optional)</label>
            <MemberSelect 
              members={members} 
              value={formData.memberId} 
              onChange={v => setFormData({ ...formData, memberId: v })} 
              className="bg-slate-50 rounded-xl"
              placeholder="Anonymous or Unlisted"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Prayer Need <span className="text-rose-500">*</span></label>
            <textarea 
              value={formData.requestText}
              onChange={e => setFormData({ ...formData, requestText: e.target.value })}
              className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-inner"
              rows={4}
              placeholder="How can we pray for them?..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div 
              onClick={() => setFormData(prev => ({ ...prev, isConfidential: !prev.isConfidential }))}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${formData.isConfidential ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
            >
              <div className="flex items-center gap-2 mb-1">
                {formData.isConfidential ? <Lock className="w-4 h-4 text-amber-600" /> : <Unlock className="w-4 h-4 text-slate-400" />}
                <p className={`text-[10px] font-black uppercase tracking-widest ${formData.isConfidential ? 'text-amber-800' : 'text-slate-500'}`}>Private</p>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Pastors only</p>
            </div>

            <div 
              onClick={() => setFormData(prev => ({ ...prev, needsFollowUp: !prev.needsFollowUp }))}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-center items-center text-center ${formData.needsFollowUp ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
            >
              <p className={`text-[10px] font-black uppercase tracking-widest ${formData.needsFollowUp ? 'text-indigo-800' : 'text-slate-500'}`}>Requires Follow-up</p>
            </div>
          </div>
        </div>

        <SheetFooter className="mt-12 sm:justify-start">
          <Button 
            disabled={loading || !formData.requestText} 
            onClick={handleSubmit} 
            className="w-full h-14 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all"
          >
            {loading ? 'Submitting...' : 'Log Prayer Request'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
