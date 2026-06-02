/**
 * Member-facing portal — attendance, giving, volunteer assignments, and reminders.
 */
import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Heart,
  Users,
  Bell,
  ClipboardList,
  ArrowLeft,
  User,
  BookOpen,
  FileText,
  Church,
  HandHeart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { isStaffUser } from '@/lib/staffAccess';

type PortalSummary = {
  linked: boolean;
  message?: string;
  member?: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    growthStage?: string | null;
    city?: string | null;
  };
  user?: { username: string; email: string; role: string };
  churchInfo?: {
    name: string;
    tagline?: string;
    address?: string;
    phone?: string;
    email?: string;
  } | null;
  attendance?: { count90Days: number; recent: Array<{ id: string; at: string; session: string; method: string }> };
  giving?: { totalRecent: number; recent: Array<{ id: string; amount: number; date: string; fund: string }> };
  volunteer?: Array<{ id: string; role: string; entityType: string; startDate: string }>;
  upcomingEvents?: Array<{ id: string; name: string; date: string; location?: string | null; type: string }>;
  tasks?: Array<{ id: string; title: string; status: string; dueDate: string | null; priority: string }>;
  notifications?: Array<{ id: string; title: string; message: string; status: string; createdAt: string }>;
  smallGroups?: Array<{ id: string; name: string; role: string; meetingDay?: string | null; type: string; joinedAt: string }>;
  sermons?: Array<{ id: string; title: string; speaker?: string | null; date: string; watchUrl?: string | null }>;
  documents?: Array<{ id: string; type: string; verified: boolean; uploadedAt: string }>;
  prayerRequests?: Array<{ id: string; content: string; status: string; submittedAt: string }>;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function MemberPortalPage() {
  const { user, logout } = useAuth();
  const isStaffDesk = user ? isStaffUser(user) : false;
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<PortalSummary | null>(null);
  const [prayerText, setPrayerText] = React.useState('');
  const [prayerBusy, setPrayerBusy] = React.useState(false);
  const [prayerMsg, setPrayerMsg] = React.useState<string | null>(null);

  const reloadSummary = React.useCallback(async () => {
    const j = await apiRequest<unknown>('member-portal/summary', { method: 'GET' });
    setSummary(parseApiResponse<PortalSummary>(j));
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        if (!cancelled) await reloadSummary();
      } catch (e) {
        if (!cancelled) setError(formatApiError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadSummary]);

  const submitPrayer = async () => {
    setPrayerBusy(true);
    setPrayerMsg(null);
    try {
      await apiRequest('member-portal/prayer-requests', {
        method: 'POST',
        body: JSON.stringify({ content: prayerText }),
      });
      setPrayerText('');
      setPrayerMsg('Your prayer request was submitted to the pastoral team.');
      await reloadSummary();
    } catch (e) {
      setPrayerMsg(formatApiError(e));
    } finally {
      setPrayerBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Loading your portal…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          {isStaffDesk ? (
            <Link to="/admin" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-bold">
              <ArrowLeft className="w-4 h-4" /> Church office
            </Link>
          ) : (
            <span className="flex items-center gap-2 text-slate-700 text-sm font-black uppercase tracking-tight">
              <User className="w-4 h-4 text-indigo-600" /> My church
            </span>
          )}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-black text-[9px] uppercase tracking-widest">
              My Church
            </Badge>
            <Button type="button" variant="ghost" size="sm" className="text-xs font-bold" onClick={() => logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        {error && (
          <p className="text-sm text-rose-600 font-medium bg-rose-50 rounded-xl px-4 py-3">{error}</p>
        )}

        {!summary?.linked ? (
          <Card className="rounded-3xl border-none shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Welcome, {user?.username ?? 'friend'}
              </CardTitle>
              <CardDescription>{summary?.message ?? 'Link your login to your member profile to see attendance, giving, groups, and more.'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-600">
                Ask your church office to link your login to your member profile.
              </p>
              {isStaffDesk ? (
                <Link to="/admin" className="inline-flex items-center justify-center h-12 px-6 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest">
                  Open church office
                </Link>
              ) : (
                <Link to="/member-login" className="inline-flex items-center justify-center h-12 px-6 rounded-2xl border-2 border-slate-200 font-black uppercase text-[10px] tracking-widest text-slate-600">
                  Sign in again
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {summary.churchInfo && (
              <Card className="rounded-3xl border-indigo-100 bg-indigo-50/40">
                <CardContent className="p-6 flex gap-4 items-start">
                  <Church className="w-8 h-8 text-indigo-600 shrink-0" />
                  <div>
                    <p className="font-black text-slate-900 text-lg">{summary.churchInfo.name}</p>
                    {summary.churchInfo.tagline && (
                      <p className="text-sm text-slate-600 mt-1">{summary.churchInfo.tagline}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-2 space-y-0.5">
                      {summary.churchInfo.address && <span className="block">{summary.churchInfo.address}</span>}
                      {summary.churchInfo.phone && <span className="block">{summary.churchInfo.phone}</span>}
                      {summary.churchInfo.email && <span className="block">{summary.churchInfo.email}</span>}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{summary.member?.name}</h1>
              <p className="text-slate-500 font-medium">
                {summary.member?.city ? `${summary.member.city} · ` : ''}
                {summary.member?.growthStage ?? 'Member'}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <a href="/donate" className="text-[10px] font-black uppercase tracking-widest text-rose-600 hover:underline">
                  Give online
                </a>
                <span className="text-slate-300">·</span>
                <a href="/" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline">
                  Church website
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="rounded-2xl border-none shadow-md">
                <CardContent className="p-6">
                  <Calendar className="w-8 h-8 text-indigo-600 mb-3" />
                  <p className="text-3xl font-black text-slate-900">{summary.attendance?.count90Days ?? 0}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Check-ins (90 days)</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-none shadow-md">
                <CardContent className="p-6">
                  <Heart className="w-8 h-8 text-rose-500 mb-3" />
                  <p className="text-3xl font-black text-slate-900">
                    {summary.giving?.totalRecent?.toLocaleString() ?? 0}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent giving total</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-none shadow-md">
                <CardContent className="p-6">
                  <Users className="w-8 h-8 text-emerald-600 mb-3" />
                  <p className="text-3xl font-black text-slate-900">{summary.volunteer?.length ?? 0}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active roles</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Calendar className="w-5 h-5" /> Recent attendance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(summary.attendance?.recent?.length ?? 0) === 0 ? (
                    <p className="text-sm text-slate-500">No recent check-ins yet.</p>
                  ) : (
                    summary.attendance!.recent.map((a) => (
                      <div key={a.id} className="flex justify-between text-sm border-b border-slate-50 pb-2">
                        <span className="font-bold text-slate-800">{a.session}</span>
                        <span className="text-slate-400">{formatDate(a.at)}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Heart className="w-5 h-5" /> Giving history
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(summary.giving?.recent?.length ?? 0) === 0 ? (
                    <p className="text-sm text-slate-500">No recorded gifts yet.</p>
                  ) : (
                    summary.giving!.recent.map((g) => (
                      <div key={g.id} className="flex justify-between text-sm border-b border-slate-50 pb-2">
                        <span className="font-bold text-slate-800">{g.fund}</span>
                        <span className="text-indigo-600 font-black">
                          {g.amount.toLocaleString()} · {formatDate(g.date)}
                        </span>
                      </div>
                    ))
                  )}
                  <a href="/donate" className="flex items-center justify-center w-full mt-2 h-12 rounded-2xl border-2 border-slate-200 font-black uppercase text-[10px] tracking-widest text-slate-600 hover:bg-slate-50">
                    Give online
                  </a>
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Users className="w-5 h-5" /> Volunteer schedules
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(summary.volunteer?.length ?? 0) === 0 ? (
                    <p className="text-sm text-slate-500">No active volunteer assignments.</p>
                  ) : (
                    summary.volunteer!.map((v) => (
                      <div key={v.id} className="text-sm">
                        <p className="font-bold text-slate-800">{v.role}</p>
                        <p className="text-slate-400 text-xs">Since {formatDate(v.startDate)}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Bell className="w-5 h-5" /> Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(summary.notifications?.length ?? 0) === 0 ? (
                    <p className="text-sm text-slate-500">You are all caught up.</p>
                  ) : (
                    summary.notifications!.map((n) => (
                      <div key={n.id} className="text-sm border-b border-slate-50 pb-2">
                        <p className="font-bold text-slate-800">{n.title}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{n.message}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Users className="w-5 h-5" /> My groups
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(summary.smallGroups?.length ?? 0) === 0 ? (
                    <p className="text-sm text-slate-500">You are not in a small group yet.</p>
                  ) : (
                    summary.smallGroups!.map((g) => (
                      <div key={g.id} className="text-sm border-b border-slate-50 pb-2">
                        <p className="font-bold text-slate-800">{g.name}</p>
                        <p className="text-slate-400 text-xs">
                          {g.role} · {g.type}
                          {g.meetingDay ? ` · ${g.meetingDay}` : ''}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <BookOpen className="w-5 h-5" /> Recent sermons
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(summary.sermons?.length ?? 0) === 0 ? (
                    <p className="text-sm text-slate-500">No published sermons yet.</p>
                  ) : (
                    summary.sermons!.map((s) => (
                      <div key={s.id} className="text-sm border-b border-slate-50 pb-2 flex justify-between gap-2">
                        <div>
                          <p className="font-bold text-slate-800">{s.title}</p>
                          <p className="text-slate-400 text-xs">
                            {s.speaker ?? 'Speaker'} · {formatDate(s.date)}
                          </p>
                        </div>
                        {s.watchUrl && (
                          <a href={s.watchUrl} className="text-[10px] font-black uppercase text-indigo-600 shrink-0">
                            Watch
                          </a>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <FileText className="w-5 h-5" /> My documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(summary.documents?.length ?? 0) === 0 ? (
                    <p className="text-sm text-slate-500">No documents on file. Contact the church office to upload records.</p>
                  ) : (
                    summary.documents!.map((d) => (
                      <div key={d.id} className="flex justify-between text-sm border-b border-slate-50 pb-2">
                        <span className="font-bold text-slate-800">{d.type}</span>
                        <span className="text-slate-400 text-xs">
                          {d.verified ? 'Verified' : 'Pending'} · {formatDate(d.uploadedAt)}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <HandHeart className="w-5 h-5" /> Prayer requests
                  </CardTitle>
                  <CardDescription>Share a request with the pastoral team (private).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <textarea
                    className="w-full min-h-[100px] rounded-2xl border border-slate-200 p-4 text-sm"
                    placeholder="How can we pray for you?"
                    value={prayerText}
                    onChange={(e) => setPrayerText(e.target.value)}
                  />
                  <Button
                    type="button"
                    disabled={prayerBusy || !prayerText.trim()}
                    className="rounded-2xl font-black uppercase text-[10px] tracking-widest"
                    onClick={() => void submitPrayer()}
                  >
                    {prayerBusy ? 'Submitting…' : 'Submit prayer request'}
                  </Button>
                  {prayerMsg && <p className="text-sm text-slate-600">{prayerMsg}</p>}
                  {(summary.prayerRequests?.length ?? 0) > 0 && (
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Your recent requests</p>
                      {summary.prayerRequests!.map((p) => (
                        <div key={p.id} className="text-sm bg-slate-50 rounded-xl p-3">
                          <p className="text-slate-700">{p.content}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {formatDate(p.submittedAt)} · {p.status}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="rounded-3xl">
              <CardHeader>
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" /> Upcoming & tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Events</p>
                  {(summary.upcomingEvents?.length ?? 0) === 0 ? (
                    <p className="text-sm text-slate-500">No upcoming events scheduled.</p>
                  ) : (
                    summary.upcomingEvents!.map((e) => (
                      <div key={e.id} className="mb-3 text-sm">
                        <p className="font-bold text-slate-800">{e.name}</p>
                        <p className="text-slate-400 text-xs">
                          {formatDate(e.date)} {e.location ? `· ${e.location}` : ''}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Your tasks</p>
                  {(summary.tasks?.length ?? 0) === 0 ? (
                    <p className="text-sm text-slate-500">No open follow-ups.</p>
                  ) : (
                    summary.tasks!.map((t) => (
                      <div key={t.id} className="mb-3 text-sm flex justify-between gap-2">
                        <span className="font-bold text-slate-800">{t.title}</span>
                        <Badge variant="outline" className="text-[9px] shrink-0">
                          {t.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
