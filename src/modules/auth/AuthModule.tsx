import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Lock, User, Church } from 'lucide-react';

interface AuthModuleProps {
  onLogin: (token: string, user: any) => void;
}

export function AuthModule({ onLogin }: AuthModuleProps) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Identity verification failed');

      onLogin(data.token, data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'System lockout');
    } finally {
      setLoading(false);
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Secure staff sign-in</p>
           </div>
        </div>

        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-white overflow-hidden p-10">
           <CardContent className="p-0 space-y-8">
              <div className="flex items-center gap-3 py-4 border-b border-slate-50">
                 <ShieldCheck className="w-5 h-5 text-indigo-500" />
                 <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Secure Access Portal</h2>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[10px] font-bold text-rose-600 uppercase tracking-tight text-center">
                   {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Identity Terminal</label>
                    <div className="relative">
                       <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                       <input 
                         type="text" 
                         value={username}
                         onChange={(e) => setUsername(e.target.value)}
                         className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-14 pr-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-300 shadow-inner" 
                         placeholder="Username"
                         required
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Secret Key</label>
                    <div className="relative">
                       <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                       <input 
                         type="password" 
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-14 pr-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-300 shadow-inner" 
                         placeholder="••••••••"
                         required
                       />
                    </div>
                 </div>

                 <Button 
                   type="submit" 
                   disabled={loading}
                   className="w-full h-16 rounded-[2rem] bg-indigo-600 hover:bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-100 transition-all active:scale-95"
                 >
                   {loading ? 'Decrypting Access...' : 'Authenticate Access'}
                 </Button>
              </form>

              <div className="pt-4 text-center">
                 <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Forgot Secret Credentials?</button>
              </div>
           </CardContent>
        </Card>

        <p className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Authorized Personnel Only &bull; All Access Logged</p>
      </div>
    </div>
  );
}
