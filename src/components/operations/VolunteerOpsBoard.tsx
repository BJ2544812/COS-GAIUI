import * as React from 'react';
import { Users, RefreshCw, UserPlus, ArrowRightLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import type { VolunteerPresence } from '@/lib/liveOps';
import { VolunteerHealthPanel } from '@/components/intelligence/VolunteerHealthPanel';

type Row = {
  id: string;
  memberId: string;
  role: string;
  status: string;
  member?: { id: string; name: string };
};

const PRESENCE_OPTIONS: { id: VolunteerPresence; label: string; color: string }[] = [
  { id: 'confirmed', label: 'Confirmed', color: 'bg-emerald-100 text-emerald-800' },
  { id: 'present', label: 'Present', color: 'bg-indigo-100 text-indigo-800' },
  { id: 'late', label: 'Late', color: 'bg-amber-100 text-amber-900' },
  { id: 'absent', label: 'Absent', color: 'bg-rose-100 text-rose-800' },
  { id: 'pending', label: 'Pending', color: 'bg-slate-100 text-slate-600' },
];

export function VolunteerOpsBoard({
  eventId,
  livePresence,
  onPresenceChange,
}: {
  eventId?: string;
  livePresence?: Record<string, VolunteerPresence>;
  onPresenceChange?: (presence: Record<string, VolunteerPresence>) => void;
}) {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [substitutes, setSubstitutes] = React.useState<Array<{ id: string; name: string }>>([]);
  const [swapTarget, setSwapTarget] = React.useState<Row | null>(null);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const q = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
      const j = await apiRequest<unknown>(`operations/volunteer-board${q}`, { method: 'GET' });
      const data = parseApiResponse<{ rows: Row[] }>(j);
      setRows(data.rows ?? []);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const setPresence = (responsibilityId: string, status: VolunteerPresence) => {
    if (!onPresenceChange || !livePresence) return;
    onPresenceChange({ ...livePresence, [responsibilityId]: status });
  };

  const loadSubstitutes = async (role: string, excludeMemberId: string) => {
    const j = await apiRequest<unknown>(
      `operations/volunteer-substitutes?role=${encodeURIComponent(role)}&excludeMemberId=${encodeURIComponent(excludeMemberId)}`,
    );
    setSubstitutes(parseApiResponse<Array<{ id: string; name: string }>>(j) || []);
  };

  const reassignToMember = async (from: Row, toMemberId: string, toMemberName: string) => {
    try {
      await apiRequest('operations/volunteer-reassign', {
        method: 'POST',
        body: {
          memberId: from.memberId,
          responsibilityId: from.id,
          status: 'Inactive',
        },
      });
      await apiRequest(`members/${toMemberId}/responsibilities`, {
        method: 'POST',
        body: {
          role: from.role,
          entityType: 'Event',
          entityId: eventId,
          status: 'Active',
          notes: `Replacement for ${from.member?.name ?? 'volunteer'}`,
        },
      });
      setSwapTarget(null);
      setSubstitutes([]);
      await load();
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  const buckets = {
    active: rows.filter((r) => r.status === 'Active'),
    pending: rows.filter((r) => r.status === 'Pending'),
    inactive: rows.filter((r) => r.status === 'Inactive'),
  };

  return (
    <Card className="border-none shadow-sm rounded-3xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-black flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-500" />
          Volunteer operations board
        </CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <VolunteerHealthPanel compact />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {loading ? (
          <p className="text-sm text-slate-500 py-8 text-center">Loading team…</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Active', count: buckets.active.length },
                { label: 'Pending', count: buckets.pending.length },
                { label: 'Inactive', count: buckets.inactive.length },
              ].map((b) => (
                <div key={b.label} className="p-3 rounded-xl bg-slate-50">
                  <p className="text-2xl font-black text-slate-900">{b.count}</p>
                  <p className="text-[10px] font-bold uppercase text-slate-400">{b.label}</p>
                </div>
              ))}
            </div>

            {rows.length === 0 ? (
              <div className="py-10 text-center space-y-3 rounded-2xl bg-slate-50 border border-dashed border-slate-200">
                <p className="text-sm font-bold text-slate-700">No volunteers assigned for this event</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Assign team members from the Volunteers module, then mark presence here during live service.
                </p>
              </div>
            ) : (
            <ul className="space-y-3">
              {rows.map((r) => {
                const presence = livePresence?.[r.id] ?? (r.status === 'Active' ? 'confirmed' : 'pending');
                return (
                  <li
                    key={r.id}
                    className="p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900">{r.member?.name ?? 'Member'}</p>
                      <p className="text-xs text-slate-500 font-medium">{r.role}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {PRESENCE_OPTIONS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          disabled={!onPresenceChange}
                          onClick={() => setPresence(r.id, p.id)}
                          className={cn(
                            'px-2 py-2 rounded-lg text-[9px] font-black uppercase min-h-[36px] min-w-[44px]',
                            presence === p.id ? p.color : 'bg-slate-50 text-slate-400',
                          )}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-[44px]"
                      onClick={() => {
                        setSwapTarget(r);
                        void loadSubstitutes(r.role, r.memberId);
                      }}
                    >
                      <ArrowRightLeft className="w-4 h-4 mr-1" /> Replace
                    </Button>
                  </li>
                );
              })}
            </ul>
            )}

            {swapTarget && (
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-3">
                <p className="text-sm font-bold text-indigo-900">
                  Replace {swapTarget.member?.name} ({swapTarget.role})
                </p>
                {substitutes.length === 0 ? (
                  <p className="text-xs text-slate-500">No suggestions — add members from Volunteers module.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {substitutes.map((s) => (
                      <Button
                        key={s.id}
                        type="button"
                        className="min-h-[44px] bg-indigo-600"
                        onClick={() => void reassignToMember(swapTarget, s.id, s.name)}
                      >
                        <UserPlus className="w-4 h-4 mr-1" /> {s.name}
                      </Button>
                    ))}
                  </div>
                )}
                <Button type="button" variant="ghost" size="sm" onClick={() => setSwapTarget(null)}>
                  Cancel
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
