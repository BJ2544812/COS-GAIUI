import * as React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { apiRequest, formatApiError } from '@/lib/apiClient';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setError('Invalid reset token');
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (password.length < 8) return setError('Password must be at least 8 characters');

    setLoading(true);
    setError(null);
    try {
      await apiRequest('auth/reset-password', {
        method: 'POST',
        body: { token, newPassword: password }
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-left">
        <Card className="max-w-md w-full border-none shadow-2xl rounded-[3rem] p-12 text-center space-y-8">
           <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto">
              <Key size={40} />
           </div>
           <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase tracking-tight">Invalid Link</h2>
              <p className="text-slate-500 font-medium">This password reset link is malformed or missing a security token.</p>
           </div>
           <Button variant="ghost" onClick={() => navigate('/login')} className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400">
              <ArrowLeft className="mr-2 w-4 h-4" /> Return to Login
           </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-left">
      <Card className="max-w-md w-full border-none shadow-2xl rounded-[4rem] bg-white overflow-hidden">
        <div className="h-4 bg-indigo-600" />
        <CardHeader className="p-12 space-y-4">
           <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              <ShieldCheck size={32} />
           </div>
           <div className="space-y-1">
              <CardTitle className="text-3xl font-black uppercase tracking-tight leading-none">Reset Access Key</CardTitle>
              <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Establish a new security credential for your identity.</CardDescription>
           </div>
        </CardHeader>
        <CardContent className="p-12 pt-0">
           {success ? (
             <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 space-y-4 text-center animate-in zoom-in-95 duration-500">
                <p className="text-emerald-700 font-bold text-sm">Access key updated successfully. Redirecting to login...</p>
             </div>
           ) : (
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</Label>
                   <Input 
                     type="password"
                     value={password}
                     onChange={e => setPassword(e.target.value)}
                     className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-black text-slate-900 focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner"
                     placeholder="••••••••"
                     required
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password</Label>
                   <Input 
                     type="password"
                     value={confirmPassword}
                     onChange={e => setConfirmPassword(e.target.value)}
                     className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-black text-slate-900 focus:ring-4 focus:ring-indigo-100 transition-all shadow-inner"
                     placeholder="••••••••"
                     required
                   />
                </div>

                {error && (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 text-rose-600 animate-in fade-in duration-300">
                     <div className="w-2 h-2 rounded-full bg-rose-500" />
                     <p className="text-[10px] font-black uppercase tracking-widest leading-none">{error}</p>
                  </div>
                )}

                <Button 
                  disabled={loading}
                  className="w-full h-16 rounded-[2rem] bg-slate-950 hover:bg-indigo-600 text-white font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-indigo-100 transition-all mt-4"
                >
                   {loading ? <RefreshCw className="animate-spin" /> : 'Commit New Key'}
                </Button>
             </form>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
