import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { ShieldCheck, Lock, Users, Fingerprint, Activity, Check } from 'lucide-react';
import { cn } from "@/src/lib/utils";

export function PermissionsModule() {
  const [roles, setRoles] = React.useState<any[]>([]);
  const [permissions, setPermissions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedRole, setSelectedRole] = React.useState<any | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/roles', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/permissions', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      const [rolesData, permsData] = await Promise.all([rolesRes.json(), permsRes.json()]);
      setRoles(rolesData);
      setPermissions(permsData);
      if (rolesData.length > 0) setSelectedRole(rolesData[0]);
    } catch (err) {
      console.error('Failed to load permissions core:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="p-20 text-center font-black uppercase text-[11px] tracking-widest text-slate-400">Locking secure layers...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Access Control Matrix</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Granular permission routing and role-based operational logic.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <Card className="lg:col-span-1 border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
               <Users className="w-5 h-5 text-indigo-500" />
               <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Operational Roles</h2>
            </div>
            <div className="space-y-3">
               {roles.map(role => (
                 <div 
                   key={role.id}
                   onClick={() => setSelectedRole(role)}
                   className={cn(
                     "w-full p-6 h-auto rounded-3xl text-left transition-all border-2 cursor-pointer active:scale-95 group",
                     selectedRole?.id === role.id 
                       ? "bg-slate-950 border-slate-950 text-white shadow-2xl shadow-slate-900/40" 
                       : "bg-slate-50 border-transparent hover:bg-white hover:border-slate-100"
                   )}
                 >
                    <div className="flex justify-between items-start">
                       <p className="text-lg font-black tracking-tight uppercase leading-none mb-2">{role.name}</p>
                       {role.is_system === 1 && <Badge className="bg-indigo-500/20 text-indigo-400 border-none text-[8px]">Core</Badge>}
                    </div>
                    <p className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      selectedRole?.id === role.id ? "text-slate-400" : "text-slate-400"
                    )}>
                      {role.permissions?.length || 0} Permissions Active
                    </p>
                 </div>
               ))}
               <Button variant="outline" className="w-full h-16 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-indigo-400 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all">Create New Archetype</Button>
            </div>
         </Card>

         <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden">
            <CardHeader className="p-10 border-b border-slate-50 flex flex-row items-center justify-between">
               <div className="space-y-1">
                 <CardTitle className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Permission Integrity</CardTitle>
                 <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Module-specific capability assignment</CardDescription>
               </div>
               <Button className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-slate-950 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 transition-all">Persist Matrix</Button>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
               {['dashboard', 'members', 'finance', 'attendance', 'permissions'].map(moduleKey => (
                 <div key={moduleKey} className="space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <Activity className="w-4 h-4" />
                       </div>
                       <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">{moduleKey} Operations</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {permissions.filter(p => p.module_key === moduleKey).map(perm => {
                         const hasPerm = selectedRole?.permissions?.some((p: any) => p.id === perm.id);
                         return (
                           <div 
                             key={perm.id}
                             className={cn(
                               "p-5 rounded-3xl border-2 transition-all cursor-pointer group flex items-center justify-between",
                               hasPerm 
                                 ? "bg-indigo-50 border-indigo-100" 
                                 : "bg-white border-slate-50 hover:border-slate-200"
                             )}
                           >
                              <div className="space-y-1">
                                 <p className={cn(
                                   "font-black text-sm uppercase tracking-tight",
                                   hasPerm ? "text-indigo-600" : "text-slate-600"
                                 )}>{perm.name}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {perm.id}</p>
                              </div>
                              <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                                hasPerm ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" : "bg-slate-50 text-slate-300"
                               )}>
                                 {hasPerm ? <Check className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                              </div>
                           </div>
                         );
                       })}
                    </div>
                 </div>
               ))}
            </CardContent>
         </Card>
      </div>

      <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-600 text-white p-8 flex items-center justify-between overflow-hidden relative">
         <div className="absolute right-0 top-0 p-10 opacity-10 rotate-12"><Fingerprint size={120} /></div>
         <div className="space-y-2 relative z-10">
            <h3 className="text-xl font-black uppercase tracking-tight leading-none">Active Security Audit</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">System is strictly enforcing 34 access nodes across 4 roles.</p>
         </div>
         <Button variant="ghost" className="relative z-10 bg-white/10 hover:bg-white/20 border-none text-white h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest">View Identity Logs</Button>
      </Card>
    </div>
  );
}
