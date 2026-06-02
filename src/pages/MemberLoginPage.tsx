/**
 * Congregant sign-in — lands on member portal, not church office.
 */
import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Lock, User as UserIcon } from 'lucide-react';
import { getToken, setToken, getDefaultTenantId, loginWithCredentials } from '@/lib/authSession';
import { formatApiError } from '@/lib/apiClient';
import { normalizeSessionUser, useAuth } from '@/context/AuthContext';
import { getSessionUserFromApi } from '@/lib/sessionApi';
import { isStaffUser } from '@/lib/staffAccess';

export function MemberLoginPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    const token = getToken();
    if (!token) return;
    void (async () => {
      const ok = await refreshUser();
      if (!ok) return;
      try {
        const raw = await getSessionUserFromApi();
        const sessionUser = normalizeSessionUser(raw);
        if (!sessionUser) return;
        if (isStaffUser(sessionUser)) {
          navigate('/admin', { replace: true });
        } else {
          navigate('/portal', { replace: true });
        }
      } catch {
        navigate('/portal', { replace: true });
      }
    })();
  }, [navigate, refreshUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const tid = getDefaultTenantId() || 'default-tenant-id';
      const result = await loginWithCredentials(username, password, tid);
      setToken(result.token, result.tenantId);
      const ok = await refreshUser();
      if (!ok) {
        setError('Could not restore your session. Please sign in again.');
        return;
      }
      const raw = await getSessionUserFromApi();
      const sessionUser = normalizeSessionUser(raw);
      if (sessionUser && isStaffUser(sessionUser)) {
        navigate('/admin', { replace: true });
        return;
      }
      navigate('/portal', { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-6 bg-gradient-to-br from-rose-50 via-white to-indigo-50">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2rem] overflow-hidden">
        <CardContent className="p-8 sm:p-10">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
              <Heart className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Church</h1>
            <p className="text-sm text-slate-500 font-medium mt-2">
              Sign in to view your giving, events, and volunteer schedule.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="member-login-username" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Email or username
              </label>
              <div className="relative mt-1.5">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="member-login-username"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 font-medium"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="member-login-password" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="member-login-password"
                  type="password"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-rose-600 font-medium bg-rose-50 rounded-xl px-3 py-2">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-700 font-black uppercase text-[10px] tracking-widest">
              {submitting ? 'Signing in…' : 'Sign in to my portal'}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-6 font-medium">
            Church staff?{' '}
            <Link to="/login" className="text-indigo-600 font-bold hover:underline">
              Sign in to church office
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
