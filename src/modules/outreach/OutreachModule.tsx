import * as React from 'react';
import { Users, UserPlus, Clock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModuleHeader, FeedbackBanner, PageLayout, ActionButton } from '@/components/modules/ModuleHeader';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { OperationalGuidanceBanner } from '@/components/operations/OperationalGuidanceBanner';
import { OPS_EMPTY } from '@/lib/opsUi';

type Dashboard = {
  stats: { newVisitors30d: number; pending: number; overdue: number; completed30d: number };
  contacts: Array<{
    id: string;
    name: string;
    email?: string | null;
    status: string;
    visitCount: number;
    isFirstVisit: boolean;
    lastVisitAt?: string | null;
  }>;
  followUps: Array<{
    id: string;
    type: string;
    status: string;
    dueDate?: string | null;
    contact?: { name: string } | null;
  }>;
};

export function OutreachModule() {
  const [dash, setDash] = React.useState<Dashboard | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [visitorName, setVisitorName] = React.useState('');
  const [visitorEmail, setVisitorEmail] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      const j = await apiRequest<unknown>('outreach/dashboard', { method: 'GET' });
      setDash(parseApiResponse<Dashboard>(j));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const registerVisitor = async () => {
    if (!visitorName.trim()) return;
    setSaving(true);
    try {
      await apiRequest('outreach/visitors', {
        method: 'POST',
        body: { name: visitorName.trim(), email: visitorEmail.trim() || undefined, source: 'Sunday' },
      });
      setVisitorName('');
      setVisitorEmail('');
      await load();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const completeFollowUp = async (id: string) => {
    try {
      await apiRequest(`outreach/follow-ups/${id}/complete`, { method: 'POST', body: {} });
      await load();
    } catch (e) {
      setError(formatApiError(e));
    }
  };

  if (loading && !dash) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <PageLayout>
      <ModuleHeader
        title="Outreach & follow-up"
        subtitle="Visitor tracking, repeat detection, pastoral assignments, and follow-up lifecycle"
        icon={Users}
        status="live"
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
            Refresh
          </Button>
        }
      />

      {error && <FeedbackBanner tone="error">{error}</FeedbackBanner>}

      {dash && (
        <>
          <OperationalGuidanceBanner hintId="event-prep" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase text-slate-400">New visitors (30d)</p>
                <p className="text-3xl font-black">{dash.stats.newVisitors30d}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase text-slate-400">Pending follow-ups</p>
                <p className="text-3xl font-black text-amber-600">{dash.stats.pending}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase text-slate-400">Overdue</p>
                <p className="text-3xl font-black text-rose-600">{dash.stats.overdue}</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase text-slate-400">Completed (30d)</p>
                <p className="text-3xl font-black text-emerald-600">{dash.stats.completed30d}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-black">
                  <UserPlus className="w-5 h-5" /> Register visitor
                </CardTitle>
                <CardDescription>First-time and repeat guests are detected automatically.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  className="w-full h-11 rounded-xl border px-4 font-bold"
                  placeholder="Guest name"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                />
                <input
                  className="w-full h-11 rounded-xl border px-4"
                  placeholder="Email (optional)"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                />
                <Button
                  type="button"
                  className="w-full bg-indigo-600"
                  disabled={saving}
                  onClick={() => void registerVisitor()}
                >
                  {saving ? 'Saving…' : 'Register & queue follow-up'}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-black">
                  <Clock className="w-5 h-5" /> Follow-up queue
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                {dash.followUps.length === 0 ? (
                  <p className={OPS_EMPTY}>No pending follow-ups. Register a visitor to start the pastoral pipeline.</p>
                ) : (
                  dash.followUps.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div>
                        <p className="font-bold text-sm text-slate-800">
                          {f.contact?.name ?? 'Member'} · {f.type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">
                          {f.dueDate ? new Date(f.dueDate).toLocaleDateString() : 'No due date'}
                        </p>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => void completeFollowUp(f.id)}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-lg font-black">Recent contacts</CardTitle>
            </CardHeader>
            <CardContent className="divide-y p-0">
              {dash.contacts.map((c) => (
                <div key={c.id} className="px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-400">
                      Visits: {c.visitCount} · {c.isFirstVisit ? 'First visit' : 'Returning'}
                    </p>
                  </div>
                  <Badge variant="outline" className="font-black text-[9px] uppercase">
                    {c.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </PageLayout>
  );
}
