import * as React from 'react';
import { Send, Mail, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatApiError, parseApiResponse } from '@/lib/apiClient';
import { apiRequest } from '@/lib/apiClient';

type CommLog = { type: string; recipient: string; status: string; subject?: string | null };

function formatLogStatus(status: string): string {
  const s = status.trim();
  if (s === 'Sent' || s === 'Pending') return 'Logged (not delivered)';
  return s;
}

export function CommunicationModule() {
  const [view, setView] = React.useState<'feed' | 'messaging' | 'campaigns'>('feed');
  const [commLogs, setCommLogs] = React.useState<CommLog[]>([]);
  const [commError, setCommError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setCommError(null);
        const json = await apiRequest<unknown>('communication', { method: 'GET' });
        const list = parseApiResponse<CommLog[]>(json);
        if (!cancelled) setCommLogs(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!cancelled) setCommError(formatApiError(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1 text-left border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Communication</h1>
        <p className="text-slate-500">
          Logged sends and delivery status from the server. No decorative campaigns or sample social feed.
        </p>
        {commError && <p className="text-sm text-rose-600 font-medium mt-1">{commError}</p>}
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 font-medium text-left" role="status">
        <span className="font-black">Delivery reality:</span> No external email/SMS provider is wired in this build.
        Outbound requests are recorded in the log below; delivery is not performed to real recipients.
        Use the sidebar <span className="font-bold">Outreach</span> module for field projects and contacts.
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setView('feed')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            view === 'feed' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Compose (preview)
        </button>
        <button
          type="button"
          onClick={() => setView('messaging')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            view === 'messaging' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Team chat (off)
        </button>
        <button
          type="button"
          onClick={() => setView('campaigns')}
          className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            view === 'campaigns' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Activity log
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-[2rem] border-slate-100 shadow-sm p-8 space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">
              Logged sends
            </h3>
            <p className="text-3xl font-black text-slate-900">{commLogs.length}</p>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Total rows returned from <code className="text-[10px] bg-slate-100 px-1 rounded">GET /communication</code>.
            </p>
          </Card>

          <Card className="rounded-[2rem] border-none bg-slate-900 text-white p-8 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black">Member app</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Mobile shell preview lives under Platform navigation when enabled — not a live app store build.
            </p>
          </Card>
        </div>

        <div className="lg:col-span-3">
          {view === 'feed' && (
            <Card className="rounded-[2rem] border-slate-100 shadow-sm p-8 space-y-4">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-lg font-black text-slate-900">Compose (not sent)</CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Community feed and rich composer are disabled until a real messaging backend exists.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 text-sm text-slate-500 font-medium">
                Use Notifications and the communication log for operational visibility.
              </CardContent>
            </Card>
          )}

          {view === 'messaging' && (
            <Card className="rounded-[2rem] border-slate-100 shadow-sm p-10 text-left space-y-3">
              <CardTitle className="text-lg font-black text-slate-900">Internal groups</CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Group chat is not connected. There is no sample inbox or fabricated threads in this build.
              </CardDescription>
            </Card>
          )}

          {view === 'campaigns' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-3xl border-slate-100 shadow-sm p-8 bg-slate-50 flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logged rows</h3>
                    <p className="text-3xl font-black text-slate-900">{commLogs.length}</p>
                    <p className="text-xs text-slate-500 font-medium">From communication API</p>
                  </div>
                  <Mail className="w-12 h-12 text-slate-300" />
                </Card>
                <Card className="rounded-3xl border-slate-100 shadow-sm p-8 bg-slate-50 flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Broadcast opt-ins</h3>
                    <p className="text-3xl font-black text-slate-400">—</p>
                    <p className="text-xs text-slate-500 font-medium">Not tracked until SMS provider is integrated</p>
                  </div>
                  <Send className="w-12 h-12 text-slate-300" />
                </Card>
              </div>
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 uppercase tracking-tighter">Communication log</h3>
                </div>
                <div className="p-0 divide-y divide-slate-50">
                  {commLogs.length === 0 ? (
                    <p className="p-8 text-sm text-slate-500">No communication logs yet.</p>
                  ) : (
                    commLogs.map((log, idx) => (
                      <div key={idx} className="px-8 py-4 flex justify-between items-center text-sm">
                        <div>
                          <p className="font-bold text-slate-800">{log.subject || log.type}</p>
                          <p className="text-xs text-slate-400">To: {log.recipient}</p>
                        </div>
                        <span className="text-xs font-black uppercase text-indigo-600" title="Server log status — not carrier delivery">
                          {formatLogStatus(log.status)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
