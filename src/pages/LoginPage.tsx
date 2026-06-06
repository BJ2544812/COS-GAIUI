/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Church, Lock, User as UserIcon } from 'lucide-react';
import { getToken, setToken, getDefaultTenantId, loginWithCredentials } from '@/lib/authSession';
import { formatApiError, apiRequest } from '@/lib/apiClient';
import { normalizeSessionUser, useAuth } from '@/context/AuthContext';
import { getSessionUserFromApi } from '@/lib/sessionApi';
import { resolvePostLoginPath } from '@/lib/roleExperience';
import {
  checkApiAvailability,
  connectivityDetailLabels,
  EXPECTED_API_ROOT,
  isConnectivityLikeMessage,
  isLoginTransportFailure,
  type ApiAvailability,
  type ApiAvailabilityReason,
} from '@/lib/apiHealth';

function LoginServerOfflinePanel({
  reason,
  retrying,
  onRetry,
}: {
  reason: ApiAvailabilityReason;
  retrying: boolean;
  onRetry: () => void;
}) {
  const details = connectivityDetailLabels(reason);

  return (
    <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl space-y-5">
      <div className="space-y-2 text-center">
        <p className="text-[11px] font-black uppercase tracking-widest text-amber-950">Server Offline</p>
        <p className="text-[10px] font-semibold text-amber-900/90 leading-relaxed normal-case tracking-normal">
          The Church Office server is not available.
        </p>
      </div>

      <ul className="space-y-1.5">
        {details.map((line) => (
          <li
            key={line}
            className="text-[9px] font-bold uppercase tracking-widest text-amber-800/80 text-center before:content-['•'] before:mr-1.5"
          >
            {line}
          </li>
        ))}
      </ul>

      <div className="rounded-2xl bg-white/80 border border-amber-100 px-4 py-3 space-y-2 text-center">
        <p className="text-[9px] font-black uppercase tracking-widest text-amber-900/70">Expected API</p>
        <p className="text-[10px] font-mono font-semibold text-amber-950 break-all">{EXPECTED_API_ROOT}</p>
        <p className="text-[9px] font-black uppercase tracking-widest text-amber-900/70 pt-1">Please start</p>
        <p className="text-[10px] font-mono font-semibold text-amber-950">npm run dev:server</p>
        <p className="text-[9px] font-semibold text-amber-800/80 normal-case tracking-normal">and try again.</p>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={retrying}
        onClick={onRetry}
        className="w-full h-12 rounded-xl border-amber-200 font-black uppercase text-[9px] tracking-widest bg-white"
      >
        {retrying ? 'Checking server...' : 'Retry Connection'}
      </Button>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { refreshUser, connectivityError, clearConnectivityError } = useAuth();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [retryingSession, setRetryingSession] = React.useState(false);
  const [checkingApi, setCheckingApi] = React.useState(true);
  const [apiStatus, setApiStatus] = React.useState<ApiAvailability | null>(null);

  const [showForgot, setShowForgot] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [forgotLoading, setForgotLoading] = React.useState(false);
  const [forgotMsg, setForgotMsg] = React.useState('');

  const runHealthCheck = React.useCallback(async (): Promise<boolean> => {
    const result = await checkApiAvailability();
    setApiStatus(result);
    return result.ok;
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      setCheckingApi(true);
      const ok = await runHealthCheck();
      if (!cancelled && ok) {
        const token = getToken();
        if (!token) return;
        const sessionOk = await refreshUser();
        if (cancelled || !sessionOk) return;
        try {
          const raw = await getSessionUserFromApi();
          const sessionUser = normalizeSessionUser(raw);
          navigate(sessionUser ? resolvePostLoginPath(sessionUser) : '/admin', { replace: true });
        } catch {
          navigate('/admin', { replace: true });
        }
      }
    })().finally(() => {
      if (!cancelled) setCheckingApi(false);
    });

    return () => {
      cancelled = true;
    };
  }, [navigate, refreshUser, runHealthCheck]);

  const offlineReason: ApiAvailabilityReason =
    apiStatus && !apiStatus.ok
      ? apiStatus.reason
      : connectivityError
        ? 'connection_refused'
        : 'api_unavailable';

  const showOfflineState =
    !checkingApi &&
    ((apiStatus !== null && !apiStatus.ok) ||
      Boolean(connectivityError) ||
      Boolean(error && isLoginTransportFailure({ message: error } as Error)));

  const handleRetryConnectivity = () => {
    clearConnectivityError();
    setError(null);
    setRetryingSession(true);
    void (async () => {
      try {
        setCheckingApi(true);
        const healthy = await runHealthCheck();
        if (!healthy) return;

        if (getToken()) {
          const ok = await refreshUser();
          if (ok) {
            try {
              const raw = await getSessionUserFromApi();
              const sessionUser = normalizeSessionUser(raw);
              navigate(sessionUser ? resolvePostLoginPath(sessionUser) : '/admin', { replace: true });
            } catch {
              navigate('/admin', { replace: true });
            }
          }
        }
      } finally {
        setCheckingApi(false);
        setRetryingSession(false);
      }
    })();
  };

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
      navigate(sessionUser ? resolvePostLoginPath(sessionUser) : '/admin', { replace: true });
    } catch (err) {
      if (isLoginTransportFailure(err)) {
        setApiStatus({ ok: false, reason: 'connection_refused' });
        setError(null);
      } else {
        setError(formatApiError(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgot = async () => {
    if (!forgotEmail) return setForgotMsg('Email required');
    setForgotLoading(true);
    setForgotMsg('');
    try {
      await apiRequest('auth/forgot-password', {
        method: 'POST',
        body: { email: forgotEmail },
      });
      setForgotMsg('Instructions sent if account exists.');
    } catch (e) {
      if (isLoginTransportFailure(e) || isConnectivityLikeMessage(formatApiError(e))) {
        setApiStatus({ ok: false, reason: 'connection_refused' });
        setForgotMsg('');
        setShowForgot(false);
      } else {
        setForgotMsg(formatApiError(e));
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-6 overflow-hidden">
       {/* Background Layer */}
       <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover scale-110 blur-[2px] opacity-40" 
            alt="Background" 
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/90 to-indigo-950/80" />
       </div>

       <div className="relative z-10 w-full max-w-md space-y-12 animate-in fade-in zoom-in duration-1000">
          <div className="text-center space-y-6">
             <div 
               onClick={() => navigate('/')}
               className="w-20 h-20 bg-white rounded-[2rem] mx-auto flex items-center justify-center text-slate-950 shadow-2xl cursor-pointer hover:scale-110 transition-transform active:scale-95"
             >
                <Church className="w-10 h-10" />
             </div>
             <div className="space-y-2">
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Grace Community</h1>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em] opacity-80">Church management</p>
             </div>
          </div>

          <Card className="border-none shadow-2xl rounded-[3.5rem] bg-white/5 backdrop-blur-3xl border border-white/10 overflow-hidden p-12">

             <CardContent className="p-0 space-y-10">
                <div className="text-center space-y-2">
                   <h2 className="text-2xl font-black text-white uppercase tracking-tight">Staff Access</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Church staff sign-in</p>
                </div>

                {checkingApi && (
                  <div className="py-6 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">
                      Checking Church Office server...
                    </p>
                  </div>
                )}

                {!checkingApi && showOfflineState && (
                  <LoginServerOfflinePanel
                    reason={offlineReason}
                    retrying={retryingSession}
                    onRetry={handleRetryConnectivity}
                  />
                )}

                {!checkingApi && !showOfflineState && error && (
                  <div role="alert" className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-rose-600 text-center">
                    {error}
                  </div>
                )}

                {!checkingApi && !showOfflineState && (
                <form onSubmit={handleSubmit} className="space-y-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Username</label>
                      <div className="relative">
                         <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                         <input
                           id="login-username"
                           type="text"
                           value={username}
                           onChange={(e) => setUsername(e.target.value)}
                           className="w-full h-16 bg-white/5 border border-white/10 rounded-[1.5rem] pl-16 pr-6 font-bold text-white focus:border-indigo-600 transition-all outline-none"
                           placeholder="Username"
                           autoComplete="username"
                           required
                         />
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Security Key</label>
                      <div className="relative">
                         <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                         <input
                           id="login-password"
                           type="password"
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           className="w-full h-16 bg-white/5 border border-white/10 rounded-[1.5rem] pl-16 pr-6 font-bold text-white focus:border-indigo-600 transition-all outline-none"
                           placeholder="••••••••"
                           autoComplete="current-password"
                           required
                         />
                      </div>
                   </div>

                   <Button
                     type="submit"
                     disabled={submitting}
                     aria-label="Login"
                     className="w-full h-16 rounded-[2rem] bg-indigo-600 hover:bg-slate-950 text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-100 transition-all active:scale-95"
                   >
                      {submitting ? 'Authenticating...' : 'Enter Dashboard'}
                   </Button>
                </form>
                )}

                {!checkingApi && !showOfflineState && (
                <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                   <button 
                     onClick={() => setShowForgot(true)}
                     className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                   >
                      Forgotten Key?
                   </button>
                   <button 
                     onClick={() => navigate('/')}
                     className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                   >
                      Back to Website
                   </button>
                </div>
                )}
                {!checkingApi && !showOfflineState && (
                <p className="text-center text-[10px] font-bold text-white/50 mt-4">
                  Member?{' '}
                  <Link to="/member-login" className="text-rose-300 hover:text-rose-200 underline-offset-2 hover:underline">
                    Sign in to My Church
                  </Link>
                </p>
                )}
             </CardContent>
          </Card>

          <div className="text-center space-y-2">
             <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">Proprietary Ministry Technology</p>
          </div>
       </div>

       {showForgot && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-6 animate-in fade-in duration-300">
             <Card className="w-full max-w-sm border-none shadow-2xl rounded-[3.5rem] overflow-hidden bg-slate-900 border border-white/10 animate-in zoom-in-95 duration-500">
                <div className="p-12 space-y-8">
                   <div className="space-y-2 text-center">
                      <h3 className="text-xl font-black uppercase tracking-tight">Recovery</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enter email for secure access reset</p>
                   </div>
                   <div className="space-y-4">
                      <input 
                        type="email"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold"
                        placeholder="email@church.com"
                      />
                      {forgotMsg && <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest text-center">{forgotMsg}</p>}
                      <div className="flex flex-col gap-3">
                         <Button onClick={handleForgot} className="h-14 bg-slate-950 rounded-2xl font-black uppercase text-[10px] tracking-widest">Send Link</Button>
                         <Button variant="ghost" onClick={() => setShowForgot(false)} className="h-10 text-slate-400 font-black uppercase text-[9px] tracking-widest">Cancel</Button>
                      </div>
                   </div>
                </div>
             </Card>
          </div>
       )}
    </div>
  );
}
