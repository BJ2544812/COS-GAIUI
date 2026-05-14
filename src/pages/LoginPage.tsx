/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Church, Lock, User as UserIcon, ShieldCheck } from 'lucide-react';
import { getToken, setToken, getDefaultTenantId, loginWithCredentials } from '@/lib/authSession';
import { formatApiError, apiRequest } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export function LoginPage() {
  const navigate = useNavigate();
  const { refreshUser, connectivityError, clearConnectivityError } = useAuth();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [retryingSession, setRetryingSession] = React.useState(false);

  const [showForgot, setShowForgot] = React.useState(false);
  const [forgotEmail, setForgotEmail] = React.useState('');
  const [forgotLoading, setForgotLoading] = React.useState(false);
  const [forgotMsg, setForgotMsg] = React.useState('');

  React.useEffect(() => {
    const token = getToken();
    if (!token) return;

    let cancelled = false;
    void (async () => {
      const ok = await refreshUser();
      if (cancelled) return;
      if (ok) {
        navigate('/', { replace: true });
      }
    })().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [navigate, refreshUser]);

  const handleRetryConnectivity = () => {
    clearConnectivityError();
    setError(null);
    setRetryingSession(true);
    void (async () => {
      try {
        if (getToken()) {
          const ok = await refreshUser();
          if (ok) navigate('/', { replace: true });
        }
      } finally {
        setRetryingSession(false);
      }
    })();
  };

  const showBackendBanner =
    Boolean(connectivityError) ||
    Boolean(error && /cannot reach|failed to fetch|networkerror|4002|dev:server/i.test(error));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const tid = getDefaultTenantId() || 'default-tenant-id';
      console.log('[Login] Attempting auth with tenant:', tid);
      const result = await loginWithCredentials(username, password, tid);
      
      // 1. Save token
      setToken(result.token, tid);
      
      const ok = await refreshUser();
      if (!ok) {
        setError('Could not restore your session. Please sign in again.');
        return;
      }

      // 3. Navigate
      navigate('/', { replace: true });
    } catch (err) {
      setError(formatApiError(err));
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
        body: { email: forgotEmail }
      });
      setForgotMsg('If an account exists, a reset link would be sent. Email delivery is not configured in this environment — check server logs or contact an administrator.');
    } catch (e) {
      setForgotMsg(formatApiError(e));
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
            <Church className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Kingdom OS</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ministry operating system</p>
          </div>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-10">
          <CardContent className="p-0 space-y-8">
            <div className="flex items-center gap-3 py-4 border-b border-slate-50">
              <ShieldCheck className="w-5 h-5 text-indigo-500" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Sign in</h2>
            </div>

            {error && !showBackendBanner && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-sm font-bold text-rose-600 text-center">
                {error}
              </div>
            )}

            {showBackendBanner && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-3">
                <p className="text-sm font-bold text-amber-900 text-center leading-snug">
                  {connectivityError ?? error}
                </p>
                <p className="text-[10px] font-bold text-amber-800/80 text-center uppercase tracking-wide">
                  Start the API in another terminal: <span className="font-mono normal-case">npm run dev:server</span>
                  {' · '}
                  First-time DB: <span className="font-mono normal-case">npm run dev:prepare</span>
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={retryingSession}
                  onClick={handleRetryConnectivity}
                  className="w-full h-12 rounded-xl border-amber-200 font-black uppercase text-[10px] tracking-widest"
                >
                  {retryingSession ? 'Retrying…' : 'Retry connection'}
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="login-username" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-14 pr-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-300 shadow-inner"
                    placeholder="admin"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="login-password" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-14 pr-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-300 shadow-inner"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                >
                   Forgot Access Key?
                </button>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-16 rounded-[2rem] bg-indigo-600 hover:bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-100 transition-all active:scale-95"
              >
                {submitting ? 'Signing in…' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {showForgot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-6 animate-in fade-in duration-300">
             <Card className="w-full max-w-sm border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white animate-in zoom-in-95 duration-500">
                <div className="p-10 space-y-8">
                   <div className="space-y-2">
                      <h3 className="text-xl font-black uppercase tracking-tight">Recover Access</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Enter your registered email to receive a secure reset link.</p>
                   </div>
                   
                   <div className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                         <input 
                           type="email"
                           value={forgotEmail}
                           onChange={e => setForgotEmail(e.target.value)}
                           className="w-full h-12 bg-slate-50 border-none rounded-xl px-4 text-sm font-bold shadow-inner focus:ring-2 focus:ring-indigo-500"
                           placeholder="pastor@church.com"
                         />
                      </div>
                      
                      {forgotMsg && (
                        <p className={cn("text-[9px] font-black uppercase tracking-widest text-center px-4 py-2 rounded-lg", forgotMsg.includes('Sent') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                          {forgotMsg}
                        </p>
                      )}

                      <div className="flex flex-col gap-3 pt-2">
                         <Button 
                           onClick={handleForgot}
                           disabled={forgotLoading}
                           className="h-12 bg-slate-950 rounded-xl font-black uppercase text-[10px] tracking-widest"
                         >
                            {forgotLoading ? 'Processing...' : 'Send Reset Link'}
                         </Button>
                         <Button variant="ghost" onClick={() => { setShowForgot(false); setForgotMsg(''); }} className="h-10 text-slate-400 font-black uppercase text-[9px] tracking-widest">Cancel</Button>
                      </div>
                   </div>
                </div>
             </Card>
          </div>
        )}

        <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Church operations platform</p>
      </div>
    </div>
  );
}
