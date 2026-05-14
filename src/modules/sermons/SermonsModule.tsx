import React from 'react';
import { Mic2, Play, Video, Calendar, BookOpen, Radio, Headphones, Trash2, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { ERPModule } from '@/types';
import { ModuleHeader, ActionButton } from '@/components/modules/ModuleHeader';
import { cn } from '@/lib/utils';

interface SermonsModuleProps {
  onModuleChange?: (module: ERPModule) => void;
}

type SermonRow = {
  id: string;
  title: string;
  speaker?: string | null;
  date: string;
  videoUrl?: string | null;
  audioUrl?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  scripture?: string | null;
  isPublished?: boolean;
};

const emptyForm = {
  title: '',
  speaker: '',
  date: new Date().toISOString().split('T')[0],
  videoUrl: '',
  audioUrl: '',
  description: '',
  scripture: '',
  isPublished: false,
};

export function SermonsModule({ onModuleChange }: SermonsModuleProps) {
  const [sermons, setSermons] = React.useState<SermonRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(emptyForm);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      const res = await apiRequest<unknown>('website/sermons', { method: 'GET' });
      const data = parseApiResponse<SermonRow[]>(res);
      setSermons(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setError(formatApiError(e));
      setSermons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (s: SermonRow) => {
    setEditingId(s.id);
    setForm({
      title: s.title,
      speaker: s.speaker ?? '',
      date: s.date.slice(0, 10),
      videoUrl: s.videoUrl ?? '',
      audioUrl: s.audioUrl ?? '',
      description: s.description ?? '',
      scripture: s.scripture ?? '',
      isPublished: !!s.isPublished,
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        title: form.title.trim(),
        speaker: form.speaker.trim() || null,
        date: form.date,
        videoUrl: form.videoUrl.trim() || null,
        audioUrl: form.audioUrl.trim() || null,
        description: form.description.trim() || null,
        scripture: form.scripture.trim() || null,
        isPublished: form.isPublished,
      };
      if (editingId) {
        await apiRequest(`website/sermons/${editingId}`, { method: 'PUT', body });
      } else {
        await apiRequest('website/sermons', { method: 'POST', body });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this sermon?')) return;
    setError(null);
    try {
      await apiRequest(`website/sermons/${id}`, { method: 'DELETE' });
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const featuredSermon = sermons.length > 0 ? sermons[0] : null;
  const librarySermons = sermons.slice(1);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      <ModuleHeader
        title="Sermons"
        subtitle="Create messages with video links, notes, scripture, and speaker — published items can surface on the public site when your website uses sermon sections."
        status="live"
        icon={Mic2}
        actions={
          <ActionButton
            label="Website sermon pages"
            icon={Video}
            variant="secondary"
            onClick={() => onModuleChange?.('website')}
          />
        }
      />

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-[2rem] px-8 py-5 text-sm font-medium shadow-sm">{error}</div>
      )}

      <Card className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-50 bg-slate-50/30">
          <CardTitle className="text-lg font-black">{editingId ? 'Edit sermon' : 'Add sermon'}</CardTitle>
          <CardDescription>Uses the same sermon API as the website module; manage_events is sufficient for staff.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={submit}>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sermon-title">Title</Label>
              <Input id="sermon-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sermon-speaker">Speaker</Label>
              <Input id="sermon-speaker" value={form.speaker} onChange={(e) => setForm((f) => ({ ...f, speaker: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sermon-date">Date</Label>
              <Input id="sermon-date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sermon-scripture">Scripture</Label>
              <Input id="sermon-scripture" value={form.scripture} onChange={(e) => setForm((f) => ({ ...f, scripture: e.target.value }))} placeholder="John 3:16" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sermon-video">Video URL</Label>
              <Input id="sermon-video" value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} placeholder="https://…" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sermon-audio">Audio URL</Label>
              <Input id="sermon-audio" value={form.audioUrl} onChange={(e) => setForm((f) => ({ ...f, audioUrl: e.target.value }))} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="sermon-notes">Sermon notes</Label>
              <Textarea id="sermon-notes" rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <Switch id="sermon-pub" checked={form.isPublished} onCheckedChange={(v) => setForm((f) => ({ ...f, isPublished: v }))} />
              <Label htmlFor="sermon-pub" className="font-bold text-slate-700 cursor-pointer">
                Published (visible to public sermon API when enabled on the site)
              </Label>
            </div>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                {saving ? 'Saving…' : editingId ? 'Update sermon' : 'Create sermon'}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" onClick={resetForm}>
                  Cancel edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-none shadow-xl rounded-[2.5rem] bg-white animate-pulse">
              <div className="aspect-video bg-slate-100 rounded-t-[2.5rem]" />
              <CardContent className="p-8 space-y-4">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sermons.length === 0 ? (
        <Card className="border-none shadow-xl rounded-[3rem] bg-white">
          <CardContent className="p-24 text-center">
            <Radio className="w-20 h-20 text-slate-200 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight">No messages yet</h3>
            <p className="text-slate-500 font-medium mb-8">Add a sermon above, or open the website module to manage pages.</p>
            <Button type="button" onClick={() => onModuleChange?.('website')} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] uppercase tracking-widest font-black shadow-xl hover:bg-indigo-700 transition-all">
              Open website
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {featuredSermon && (
            <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-slate-950 text-white group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-transparent z-10" />
              {featuredSermon.thumbnail && (
                <img
                  src={featuredSermon.thumbnail}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-700 group-hover:scale-105"
                />
              )}
              <div className="relative z-20 flex flex-col md:flex-row p-12 md:p-16 gap-12 items-center">
                <div className="flex-1 space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="bg-rose-500 text-white border-none px-4 py-1.5 uppercase tracking-widest font-black text-[10px] shadow-lg">Latest</Badge>
                    <Badge
                      className={cn(
                        'border-none px-3 py-1.5 uppercase tracking-widest font-black text-[10px]',
                        featuredSermon.isPublished ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/30 text-slate-300',
                      )}
                    >
                      {featuredSermon.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none group-hover:text-indigo-400 transition-colors">{featuredSermon.title}</h2>
                  <div className="flex flex-wrap items-center gap-6 text-slate-300 font-bold text-sm">
                    <div className="flex items-center gap-2">
                      <Mic2 size={16} className="text-indigo-400" /> {featuredSermon.speaker || 'Speaker TBA'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-indigo-400" />{' '}
                      {new Date(featuredSermon.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen size={16} className="text-indigo-400" /> {featuredSermon.scripture || 'Scripture TBA'}
                    </div>
                  </div>
                  <p className="text-slate-400 font-medium max-w-2xl leading-relaxed text-lg">{featuredSermon.description || 'No notes yet.'}</p>
                  <div className="flex flex-wrap gap-3">
                    {featuredSermon.videoUrl && (
                      <a
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-indigo-500 transition-colors"
                        href={featuredSermon.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Play size={16} /> Watch
                      </a>
                    )}
                    {featuredSermon.audioUrl && (
                      <a
                        className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-colors"
                        href={featuredSermon.audioUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Headphones size={16} /> Listen
                      </a>
                    )}
                    <Button type="button" variant="secondary" className="font-black uppercase text-[10px]" onClick={() => startEdit(featuredSermon)}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </Button>
                    <Button type="button" variant="ghost" className="text-rose-300 font-black uppercase text-[10px]" onClick={() => void remove(featuredSermon.id)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {librarySermons.length > 0 && (
            <div className="pt-8">
              <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-8 flex items-center gap-3">
                <Video className="text-indigo-500" /> Archive
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {librarySermons.map((s) => (
                  <Card key={s.id} className="border-none shadow-xl rounded-[2.5rem] bg-white hover:shadow-2xl transition-all group overflow-hidden">
                    <div className="aspect-video bg-slate-900 relative overflow-hidden">
                      {s.thumbnail ? (
                        <img src={s.thumbnail} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-slate-900">
                          <Mic2 className="w-12 h-12 text-indigo-300/30" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4 flex gap-2">
                        {s.videoUrl && (
                          <Badge className="bg-slate-900/60 backdrop-blur-md text-white border-none font-bold uppercase text-[9px] tracking-widest">Video</Badge>
                        )}
                        {s.audioUrl && (
                          <Badge className="bg-slate-900/60 backdrop-blur-md text-white border-none font-bold uppercase text-[9px] tracking-widest">Audio</Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-8 space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-black text-xl text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{s.title}</h3>
                        <Badge className={cn('border-none px-2 py-0.5 text-[8px] font-black uppercase tracking-widest', s.isPublished ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500')}>
                          {s.isPublished ? 'Live' : 'Draft'}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        <p className="flex items-center gap-2">
                          <Mic2 size={12} /> {s.speaker || '—'}
                        </p>
                        <p className="flex items-center gap-2">
                          <BookOpen size={12} /> {s.scripture || 'Scripture TBA'}
                        </p>
                        <p className="flex items-center gap-2">
                          <Calendar size={12} /> {new Date(s.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button type="button" size="sm" variant="outline" className="font-black uppercase text-[9px]" onClick={() => startEdit(s)}>
                          <Pencil className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="text-rose-600 font-black uppercase text-[9px]" onClick={() => void remove(s.id)}>
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
