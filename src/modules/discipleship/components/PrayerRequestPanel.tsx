import * as React from 'react';
import { Clock, User, MessageSquare, CheckCircle2, Archive, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { cn } from '@/lib/utils';

type PrayerRow = {
  id: string;
  title?: string | null;
  content: string;
  status: string;
  urgency: string;
  category?: string;
  testimony?: string | null;
  followUpNotes?: string | null;
  assignedUserId?: string | null;
  createdAt: string;
  requester?: { id: string; name: string } | null;
  createdBy?: { id: string; username: string } | null;
  activities?: {
    id: string;
    actionType: string;
    message: string;
    createdAt: string;
    actor?: { username: string } | null;
  }[];
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-50 text-blue-700',
  IN_PRAYER: 'bg-violet-50 text-violet-700',
  FOLLOW_UP: 'bg-amber-50 text-amber-800',
  ANSWERED: 'bg-emerald-50 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-600',
  ARCHIVED: 'bg-slate-50 text-slate-400',
};

interface PrayerRequestPanelProps {
  prayers: PrayerRow[];
  users: { id: string; username: string }[];
  onRefresh: () => void | Promise<void>;
  onCreate: () => void;
}

export function PrayerRequestPanel({ prayers, users, onRefresh, onCreate }: PrayerRequestPanelProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<PrayerRow | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [followUpNote, setFollowUpNote] = React.useState('');
  const [testimony, setTestimony] = React.useState('');
  const [assignUserId, setAssignUserId] = React.useState('');
  const [editOpen, setEditOpen] = React.useState(false);
  const [editForm, setEditForm] = React.useState({ title: '', content: '', urgency: 'MEDIUM', status: 'OPEN' });

  const loadDetail = React.useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<unknown>(`care/prayer/${encodeURIComponent(id)}`, { method: 'GET' });
      setDetail(parseApiResponse<PrayerRow>(res));
      setSelectedId(id);
    } catch (e: unknown) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const runAction = async (path: string, body?: Record<string, unknown>) => {
    if (!selectedId) return;
    setError(null);
    try {
      await apiRequest(`care/prayer/${encodeURIComponent(selectedId)}/${path}`, {
        method: 'POST',
        body: body ?? {},
      });
      await loadDetail(selectedId);
      await onRefresh();
    } catch (e: unknown) {
      setError(formatApiError(e));
    }
  };

  const saveEdit = async () => {
    if (!selectedId) return;
    try {
      await apiRequest(`care/prayer/${encodeURIComponent(selectedId)}`, {
        method: 'PATCH',
        body: editForm,
      });
      setEditOpen(false);
      await loadDetail(selectedId);
      await onRefresh();
    } catch (e: unknown) {
      setError(formatApiError(e));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <Card className="lg:col-span-2 rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">Prayer Queue</CardTitle>
          <Button type="button" onClick={onCreate} className="rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-950">
            New request
          </Button>
        </CardHeader>
        <CardContent className="p-0 max-h-[32rem] overflow-y-auto">
          {prayers.length === 0 ? (
            <p className="p-12 text-center text-sm text-slate-400 font-medium">No active prayer requests.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {prayers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => void loadDetail(p.id)}
                  className={cn(
                    'w-full text-left p-5 hover:bg-slate-50 transition-colors',
                    selectedId === p.id && 'bg-indigo-50/60',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 line-clamp-1">{p.title || p.content.slice(0, 60)}</p>
                    <Badge className={cn('shrink-0 border-none text-[8px] font-black uppercase', STATUS_COLORS[p.status] || 'bg-slate-100')}>
                      {p.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{p.requester?.name || 'Anonymous'} • {p.urgency}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-3 rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-50">
          <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">Request Detail</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          {error && <p className="text-sm font-bold text-rose-600">{error}</p>}
          {!detail && !loading && <p className="text-sm text-slate-400">Select a prayer request to manage workflow.</p>}
          {loading && <p className="text-sm text-slate-400">Loading…</p>}
          {detail && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn('border-none text-[9px] font-black uppercase', STATUS_COLORS[detail.status])}>{detail.status}</Badge>
                <Badge variant="outline" className="text-[9px] font-black uppercase">{detail.urgency}</Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12} />{new Date(detail.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">{detail.title || 'Prayer request'}</h3>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">{detail.content}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1"><User size={12} />{detail.requester?.name || 'Anonymous'}</span>
                {detail.createdBy?.username && <span>Logged by {detail.createdBy.username}</span>}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="font-bold text-[10px] uppercase" onClick={() => {
                  setEditForm({
                    title: detail.title || '',
                    content: detail.content,
                    urgency: detail.urgency,
                    status: detail.status,
                  });
                  setEditOpen(true);
                }}>Edit</Button>
                <select
                  className="h-9 rounded-lg border border-slate-200 px-2 text-xs font-bold"
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                >
                  <option value="">Assign to…</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
                </select>
                <Button size="sm" disabled={!assignUserId} className="font-bold text-[10px] uppercase" onClick={() => void runAction('assign', { assignedUserId: assignUserId })}>
                  Assign
                </Button>
                <Button size="sm" variant="outline" className="font-bold text-[10px] uppercase" onClick={() => void runAction('close')}>
                  <XCircle size={14} className="mr-1" /> Close
                </Button>
                <Button size="sm" variant="ghost" className="font-bold text-[10px] uppercase" onClick={() => void runAction('archive')}>
                  <Archive size={14} className="mr-1" /> Archive
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Follow-up note</label>
                <div className="flex gap-2">
                  <Input value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} placeholder="Add pastoral follow-up…" className="h-10" />
                  <Button size="sm" className="font-bold shrink-0" onClick={() => {
                    void runAction('follow-up', { note: followUpNote }).then(() => setFollowUpNote(''));
                  }}>Add</Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Answered testimony</label>
                <Textarea value={testimony} onChange={(e) => setTestimony(e.target.value)} placeholder="Record how God answered…" className="min-h-[80px]" />
                <Button size="sm" className="font-bold bg-emerald-600 hover:bg-emerald-700" onClick={() => void runAction('answered', { testimony }).then(() => setTestimony(''))}>
                  <CheckCircle2 size={14} className="mr-1" /> Mark answered
                </Button>
              </div>

              {detail.testimony && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-1">Testimony</p>
                  <p className="text-sm text-emerald-900">{detail.testimony}</p>
                </div>
              )}

              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1">
                  <MessageSquare size={12} /> Timeline
                </p>
                <div className="space-y-3 pl-3 border-l-2 border-slate-100">
                  {(detail.activities || []).map((a) => (
                    <div key={a.id} className="relative">
                      <p className="text-xs font-bold text-slate-800">{a.actionType.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-slate-600">{a.message}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(a.createdAt).toLocaleString()}
                        {a.actor?.username ? ` • ${a.actor.username}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit prayer request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title" />
            <Textarea value={editForm.content} onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))} className="min-h-[120px]" />
            <select className="w-full h-10 rounded-lg border px-2 text-sm font-bold" value={editForm.urgency} onChange={(e) => setEditForm((f) => ({ ...f, urgency: e.target.value }))}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <select className="w-full h-10 rounded-lg border px-2 text-sm font-bold" value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>
              {['OPEN', 'IN_PRAYER', 'FOLLOW_UP', 'ANSWERED', 'CLOSED', 'ARCHIVED'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button onClick={() => void saveEdit()} className="font-black">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
