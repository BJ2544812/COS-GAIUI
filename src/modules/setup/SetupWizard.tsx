import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Church, ShieldCheck, ArrowRight, Wallet, Users, Globe } from 'lucide-react';
import { apiRequest, formatApiError } from '@/lib/apiClient';

interface SetupWizardProps {
  onComplete: () => void;
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [step, setStep] = React.useState(1);
  const [orgName, setOrgName] = React.useState('');
  const [adminUser, setAdminUser] = React.useState('admin');
  const [adminPassword, setAdminPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [setupError, setSetupError] = React.useState<string | null>(null);

  const handleInitialize = async () => {
    setLoading(true);
    setSetupError(null);
    try {
      const json = await apiRequest<Record<string, unknown>>('auth/setup', {
        method: 'POST',
        body: {
          tenantName: orgName,
          adminUsername: adminUser,
          adminPassword: adminPassword,
          adminEmail: `${adminUser.replace(/\s/g, '') || 'admin'}@setup.local`,
        },
      });
      if (!json || typeof json !== 'object' || (json as { status?: string }).status !== 'success') {
        throw new Error('Deployment failed');
      }
      onComplete();
    } catch (err) {
      console.error(err);
      setSetupError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-left selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(79,70,229,0.2)]">
        
        {/* Sidebar / Aesthetic Side */}
        <div className="bg-indigo-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-transparent"></div>
           <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
           
           <div className="relative z-10 space-y-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                 <Church className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                 <h1 className="text-4xl font-black tracking-tight leading-none">Kingdom OS setup</h1>
                 <p className="text-indigo-100 font-bold uppercase tracking-widest text-[10px]">New tenant &amp; admin account</p>
              </div>
           </div>

           <div className="relative z-10 space-y-8">
              <div className="flex gap-4 items-start">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><ShieldCheck className="w-5 h-5" /></div>
                 <div>
                    <h3 className="font-black uppercase text-xs tracking-wider">Atomic Security</h3>
                    <p className="text-[10px] text-indigo-100/60 leading-relaxed font-medium">Bcrypt-hashed credentials and JWT protocol enforced system-wide.</p>
                 </div>
              </div>
              <div className="flex gap-4 items-start">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><Wallet className="w-5 h-5" /></div>
                 <div>
                    <h3 className="font-black uppercase text-xs tracking-wider">Financial Precision</h3>
                    <p className="text-[10px] text-indigo-100/60 leading-relaxed font-medium">Full double-entry accounting engine ready for orchestration.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Form Side */}
        <div className="p-16 space-y-12">
           <div className="space-y-2">
              <div className="flex items-center gap-2 mb-4">
                 {[1, 2, 3].map(i => (
                   <div key={i} className={`h-1 rounded-full transition-all ${step >= i ? 'w-8 bg-indigo-600' : 'w-4 bg-slate-100'}`}></div>
                 ))}
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                 {step === 1 && "The Identity"}
                 {step === 2 && "The Bastion"}
                 {step === 3 && "Initialization"}
              </h2>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Configuring environment parameters</p>
           </div>

           {setupError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-bold text-rose-700 flex items-center justify-between animate-in slide-in-from-top-2">
                <span>{setupError}</span>
                <button onClick={() => setSetupError(null)} className="text-rose-400 hover:text-rose-600 font-black text-xs ml-2">✕</button>
              </div>
           )}

           <div className="space-y-8">
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Organization Legal Name</label>
                      <input 
                        type="text" 
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-inner text-lg outline-none" 
                        placeholder="e.g. Grace Fellowship International" 
                      />
                   </div>
                   <p className="text-[11px] text-slate-400 leading-relaxed">This name will appear on all official vouchers, receipts, and the public landing page generated by the system.</p>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">System Administrator Username</label>
                         <input 
                           type="text" 
                           value={adminUser}
                           onChange={(e) => setAdminUser(e.target.value)}
                           className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-inner outline-none" 
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Universal Master Secret Key</label>
                         <input 
                           type="password" 
                           value={adminPassword}
                           onChange={(e) => setAdminPassword(e.target.value)}
                           className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 shadow-inner outline-none" 
                           placeholder="••••••••••••"
                         />
                      </div>
                   </div>
                   <p className="text-[11px] text-slate-400 leading-relaxed italic">WARNING: This user will have absolute authority over all church records and financial archives.</p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                   <Card className="border-none bg-slate-900 text-white p-8 rounded-[2rem] space-y-6 overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-8 opacity-10"><Globe size={60} /></div>
                      <div className="space-y-2 relative z-10">
                         <h4 className="text-sm font-black uppercase tracking-tight">Final Verification</h4>
                         <div className="space-y-1">
                            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500"><span>Target:</span> <span className="text-indigo-400">{orgName}</span></div>
                            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500"><span>Identity:</span> <span className="text-indigo-400">{adminUser}</span></div>
                            <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500"><span>Protocol:</span> <span className="text-indigo-400">Secure (AES-256)</span></div>
                         </div>
                      </div>
                   </Card>
                   <p className="text-[11px] text-slate-400 font-medium">Ready to initialize local database and operational modules. This process is irreversible.</p>
                </div>
              )}
           </div>

           <div className="flex gap-4 pt-4">
              {step > 1 && (
                <Button 
                  onClick={() => setStep(step - 1)}
                  variant="outline" 
                  className="h-16 flex-1 rounded-[2rem] border-2 border-slate-100 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Rollback
                </Button>
              )}
              <Button 
                onClick={() => step < 3 ? setStep(step + 1) : handleInitialize()}
                disabled={loading || (step === 1 && !orgName) || (step === 2 && (!adminUser || !adminPassword))}
                className="h-16 flex-[2] rounded-[2rem] bg-indigo-600 hover:bg-slate-950 text-white font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-indigo-200 transition-all active:scale-95"
              >
                {loading ? 'Initializing Core...' : step === 3 ? 'Ignite System' : 'Proceed Access'} 
                <ArrowRight className="ml-3 w-4 h-4" />
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
