import * as React from 'react';
import {
  Radio,
  Video,
  Mic2,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Save,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import type { AgendaSession, LiveOpsConfig, LiveOpsPayload } from '@/lib/liveOps';
import { mergeLiveOpsConfig } from '@/lib/liveOps';
import type { ERPModule } from '@/types';
import { useRealtimeOps } from '@/hooks/useRealtimeOps';
import { ReadinessBadge } from '@/components/operations/ReadinessBadge';
import { VolunteerOpsBoard } from '@/components/operations/VolunteerOpsBoard';
import { SortableAgendaSessions } from '@/components/operations/SortableAgendaSessions';

const UCOS_LIVE_SERVICE_ID = 'ucos_live_service_id';

export function LiveEventOpsPanel({
  eventId,
  onModuleChange,
}: {
  eventId: string;
  onModuleChange?: (m: ERPModule) => void;
}) {
  const [live, setLive] = React.useState<LiveOpsPayload | null>(null);
  const [agenda, setAgenda] = React.useState<AgendaSession[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      const j = await apiRequest<unknown>(`events/${eventId}/live-ops`, { method: 'GET' });
      const payload = parseApiResponse<LiveOpsPayload>(j);
      setLive(payload);
      setAgenda(payload.opsConfig.agendaSessions ?? []);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  useRealtimeOps(
    (event) => {
      if (['service:update', 'ops:refresh', 'volunteer:update', 'attendance:update', 'event:status'].includes(event)) {
        void load();
      }
    },
    { eventId, serviceId: eventId },
  );

  const saveAgenda = async () => {
    setSaving(true);
    try {
      const j = await apiRequest<unknown>(`events/${eventId}/live-ops`, {
        method: 'PUT',
        body: { agendaSessions: agenda },
      });
      setLive(parseApiResponse<LiveOpsPayload>(j));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const patchOps = async (patch: Partial<LiveOpsConfig>) => {
    const j = await apiRequest<unknown>(`events/${eventId}/live-ops`, {
      method: 'PUT',
      body: patch,
    });
    setLive(parseApiResponse<LiveOpsPayload>(j));
  };

  const addSession = () => {
    const id = `sess-${Date.now()}`;
    setAgenda((prev) => [...prev, { id, name: 'New session', sortOrder: prev.length, startTime: '', duration: '30m' }]);
  };

  const openSundayMode = () => {
    sessionStorage.setItem(UCOS_LIVE_SERVICE_ID, eventId);
    onModuleChange?.('sunday-mode');
  };

  if (loading && !live) {
    return <p className="text-sm text-slate-500 py-8 text-center">Loading live operations…</p>;
  }

  if (!live) {
    return <p className="text-sm text-rose-600">{error ?? 'Live ops unavailable'}</p>;
  }

  const ops = live.opsConfig;
  const presence = ops.volunteerPresence ?? {};

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <Button type="button" className="min-h-[48px] bg-violet-600" onClick={openSundayMode}>
          <Radio className="w-4 h-4 mr-2" /> Open Sunday Service
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-[48px]"
          onClick={() => {
            sessionStorage.setItem('ucos_open_attendance_session_id', '');
            onModuleChange?.('attendance');
          }}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" /> Check-in
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-4 flex items-center gap-3">
            <Video className={cn('w-8 h-8', ops.mediaReady ? 'text-emerald-500' : 'text-amber-500')} />
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Media</p>
              <p className="font-bold">{ops.mediaReady ? 'Ready' : 'Not ready'}</p>
              <Button type="button" size="sm" variant="ghost" className="h-8 mt-1" onClick={() => void patchOps({ mediaReady: !ops.mediaReady })}>
                Toggle
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-4 flex items-center gap-3">
            <Mic2 className={cn('w-8 h-8', ops.livestreamReady ? 'text-emerald-500' : 'text-amber-500')} />
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Livestream</p>
              <p className="font-bold">{ops.livestreamReady ? 'Ready' : 'Not ready'}</p>
              <Button type="button" size="sm" variant="ghost" className="h-8 mt-1" onClick={() => void patchOps({ livestreamReady: !ops.livestreamReady })}>
                Toggle
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-slate-100">
          <CardContent className="p-4">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Readiness</p>
            <ReadinessBadge
              level={
                ops.mediaReady && ops.livestreamReady && live.metrics.volunteerCount >= 2
                  ? 'READY'
                  : ops.mediaReady || ops.livestreamReady
                    ? 'WARNING'
                    : 'BLOCKED'
              }
              score={Math.round(
                ((ops.mediaReady ? 1 : 0) + (ops.livestreamReady ? 1 : 0) + (live.metrics.volunteerCount >= 2 ? 1 : 0)) /
                  3 *
                  100,
              )}
            />
            <p className="text-xs text-slate-500 mt-2">{live.responsibilities.length} team assignments</p>
          </CardContent>
        </Card>
      </div>

      {(ops.issues?.length ?? 0) > 0 && (
        <Card className="border-rose-200 bg-rose-50/80 rounded-2xl">
          <CardContent className="p-4 space-y-2">
            {ops.issues!.map((i) => (
              <p key={i.id} className="text-sm font-medium text-rose-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {i.text}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm rounded-3xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black">Event agenda</CardTitle>
            <CardDescription>Drag to reorder sessions · timing adjusts live</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="min-h-[44px]" onClick={addSession}>
              <Plus className="w-4 h-4" />
            </Button>
            <Button type="button" size="sm" className="min-h-[44px] bg-indigo-600" disabled={saving} onClick={() => void saveAgenda()}>
              <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {agenda.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">No sessions — add agenda blocks for multi-session events.</p>
          ) : (
            <SortableAgendaSessions rows={agenda} onChange={setAgenda} />
          )}
        </CardContent>
      </Card>

      <VolunteerOpsBoard
        eventId={eventId}
        livePresence={presence}
        onPresenceChange={(p) => {
          setLive((prev) =>
            prev
              ? {
                  ...prev,
                  opsConfig: mergeLiveOpsConfig(prev.opsConfig, { volunteerPresence: p }),
                }
              : prev,
          );
          void patchOps({ volunteerPresence: p });
        }}
      />
    </div>
  );
}
