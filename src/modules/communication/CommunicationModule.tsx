import * as React from 'react';
import {
  Send,
  Mail,
  Smartphone,
  Bell,
  BarChart3,
  Users,
  Megaphone,
  Heart,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModuleHeader, FeedbackBanner } from '@/components/modules/ModuleHeader';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { OperationalGuidanceBanner } from '@/components/operations/OperationalGuidanceBanner';
import { OpsFeedback } from '@/components/operations/OpsFeedback';
import { OPS_EMPTY } from '@/lib/opsUi';

type CommLog = { type: string; recipient: string; status: string; subject?: string | null };
type HubData = {
  campaigns: Array<{ id: string; title: string; status: string; sentAt?: string | null }>;
  analytics: {
    deliveries30d: number;
    openRate: number;
    engagementRate: number;
    logCount: number;
    notifications7d: number;
  };
};
type PrayerRow = {
  id: string;
  content: string;
  status: string;
  urgency: string;
  visibility: string;
  assignedUserId?: string | null;
  createdAt: string;
};

const CHANNELS = [
  { id: 'in_app', label: 'In-app', icon: Bell },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'sms', label: 'SMS', icon: Smartphone },
  { id: 'whatsapp', label: 'WhatsApp', icon: Send },
] as const;

export function CommunicationModule() {
  const [tab, setTab] = React.useState<'command' | 'compose' | 'prayer' | 'log'>('command');
  const [hub, setHub] = React.useState<HubData | null>(null);
  const [logs, setLogs] = React.useState<CommLog[]>([]);
  const [prayers, setPrayers] = React.useState<PrayerRow[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [confirmSend, setConfirmSend] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [selectedChannels, setSelectedChannels] = React.useState<string[]>(['in_app']);
  const [growthStage, setGrowthStage] = React.useState('');
  const [audiencePreview, setAudiencePreview] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const [hubRes, logRes, prayerRes] = await Promise.all([
        apiRequest<unknown>('communication/hub', { method: 'GET' }),
        apiRequest<unknown>('communication', { method: 'GET' }),
        apiRequest<unknown>('care/prayer', { method: 'GET' }),
      ]);
      setHub(parseApiResponse<HubData>(hubRes));
      setLogs(parseApiResponse<CommLog[]>(logRes) ?? []);
      setPrayers(parseApiResponse<PrayerRow[]>(prayerRes) ?? []);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const previewAudience = async () => {
    try {
      const j = await apiRequest<unknown>('communication/hub/audience/preview', {
        method: 'POST',
        body: { audienceFilter: growthStage ? { growthStage } : {} },
      });
      const data = parseApiResponse<{ count: number }>(j);
      setAudiencePreview(data?.count ?? 0);
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  const sendCampaign = async () => {
    if (!title.trim() || !body.trim()) {
      setError('Title and message are required');
      return;
    }
    setSending(true);
    try {
      const created = await apiRequest<unknown>('communication/hub/campaigns', {
        method: 'POST',
        body: {
          title: title.trim(),
          body: body.trim(),
          channels: selectedChannels,
          audienceFilter: growthStage ? { growthStage } : {},
        },
      });
      const campaign = parseApiResponse<{ id: string }>(created);
      if (campaign?.id) {
        await apiRequest(`communication/hub/campaigns/${campaign.id}/send`, { method: 'POST' });
      }
      setTitle('');
      setBody('');
      setSuccessMsg('Campaign sent successfully. Delivery is logged for audit.');
      await load();
      setTab('command');
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSending(false);
    }
  };

  if (loading && !hub) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ModuleHeader
        title="Communications"
        subtitle="Announcements, email and SMS campaigns, and prayer request coordination"
        icon={Megaphone}
        status="live"
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
            Refresh
          </Button>
        }
      />

      {error && <FeedbackBanner tone="error">{error}</FeedbackBanner>}
      {successMsg && <OpsFeedback message={successMsg} onDismiss={() => setSuccessMsg(null)} />}

      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {(
          [
            ['command', 'Overview', BarChart3],
            ['compose', 'Compose campaign', Send],
            ['prayer', 'Prayer & care', Heart],
            ['log', 'Delivery log', Mail],
          ] as const
        ).map(([id, label, Icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest',
              tab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'command' && hub && (
        <>
        <OperationalGuidanceBanner hintId="event-prep" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-none shadow-md">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase text-slate-400">30d deliveries</p>
              <p className="text-3xl font-black text-slate-900">{hub.analytics.deliveries30d}</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none shadow-md">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase text-slate-400">Open rate</p>
              <p className="text-3xl font-black text-indigo-600">{hub.analytics.openRate}%</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none shadow-md">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase text-slate-400">Engagement</p>
              <p className="text-3xl font-black text-emerald-600">{hub.analytics.engagementRate}%</p>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none shadow-md">
            <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase text-slate-400">In-app (7d)</p>
              <p className="text-3xl font-black text-slate-900">{hub.analytics.notifications7d}</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2 rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg font-black">Recent campaigns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {hub.campaigns.length === 0 ? (
                <p className={OPS_EMPTY}>No campaigns yet. Open Compose to send your first announcement to members.</p>
              ) : (
                hub.campaigns.map((c) => (
                  <div key={c.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50">
                    <span className="font-bold text-slate-800">{c.title}</span>
                    <Badge variant="outline" className="uppercase text-[9px] font-black">
                      {c.status}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="md:col-span-2 rounded-3xl bg-indigo-950 text-white">
            <CardContent className="p-8 space-y-4">
              <Users className="w-10 h-10 text-indigo-400" />
              <h3 className="text-xl font-black">Audience targeting</h3>
              <p className="text-sm text-indigo-200/80">
                Filter by campus, volunteer role, growth stage, ministry involvement, attendance patterns, and engagement scores.
              </p>
              <Button type="button" className="bg-white text-indigo-950" onClick={() => setTab('compose')}>
                New campaign
              </Button>
            </CardContent>
          </Card>
        </div>
        </>
      )}

      {tab === 'compose' && (
        <Card className="rounded-3xl max-w-3xl">
          <CardHeader>
            <CardTitle className="text-lg font-black">Compose campaign</CardTitle>
            <CardDescription>In-app delivers immediately; email/SMS/WhatsApp log to transport queue when providers are configured.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <input
              className="w-full h-12 rounded-xl border border-slate-200 px-4 font-bold"
              placeholder="Campaign title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full h-32 rounded-xl border border-slate-200 p-4 font-medium resize-none"
              placeholder="Message body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() =>
                    setSelectedChannels((prev) =>
                      prev.includes(ch.id) ? prev.filter((x) => x !== ch.id) : [...prev, ch.id],
                    )
                  }
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase border',
                    selectedChannels.includes(ch.id)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-500',
                  )}
                >
                  <ch.icon className="w-4 h-4" />
                  {ch.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Growth stage filter</label>
                <select
                  className="h-11 rounded-xl border px-3 text-sm font-bold"
                  value={growthStage}
                  onChange={(e) => setGrowthStage(e.target.value)}
                >
                  <option value="">All active members</option>
                  <option value="Visitor">Visitor</option>
                  <option value="Member">Member</option>
                  <option value="Leader">Leader</option>
                </select>
              </div>
              <Button type="button" variant="outline" onClick={() => void previewAudience()}>
                Preview audience
              </Button>
              {audiencePreview != null && (
                <span className="text-sm font-bold text-indigo-600">{audiencePreview} recipients</span>
              )}
            </div>
            <Button
              type="button"
              className="w-full bg-indigo-600 h-12 font-black uppercase text-[10px] tracking-widest"
              disabled={sending}
              onClick={() => setConfirmSend(true)}
            >
              {sending ? 'Sending…' : 'Send campaign'}
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmSend}
        title="Send communication campaign?"
        description={`This will deliver to ${audiencePreview ?? 'selected'} recipients across ${selectedChannels.join(', ')}. This action is logged for audit.`}
        confirmLabel="Send now"
        variant="destructive"
        busy={sending}
        onCancel={() => setConfirmSend(false)}
        onConfirm={async () => {
          await sendCampaign();
          setConfirmSend(false);
        }}
      />

      {tab === 'prayer' && (
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-lg font-black">Prayer requests</CardTitle>
            <CardDescription>Pastoral visibility respects confidentiality and each person&apos;s access role.</CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {prayers.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">No active prayer requests.</p>
            ) : (
              prayers.map((p) => (
                <div key={p.id} className="p-4 space-y-1">
                  <div className="flex justify-between gap-2">
                    <Badge className="text-[9px] font-black uppercase">{p.urgency}</Badge>
                    <Badge variant="outline">{p.visibility}</Badge>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.content}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{p.status}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'log' && (
        <Card className="rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-black">Channel delivery log</CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {logs.length === 0 ? (
              <p className="p-8 text-sm text-slate-500">No log entries.</p>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="px-6 py-4 flex justify-between text-sm">
                  <div>
                    <p className="font-bold">{log.subject || log.type}</p>
                    <p className="text-xs text-slate-400">To: {log.recipient}</p>
                  </div>
                  <span className="text-xs font-black uppercase text-indigo-600">{log.status}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
