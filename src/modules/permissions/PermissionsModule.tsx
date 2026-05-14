import * as React from 'react';
import { 
  Lock, 
  Users, 
  Shield, 
  UserPlus, 
  Check, 
  X, 
  Trash2, 
  Plus,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Search,
  Key,
  Layout,
  CheckCircle2,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { apiRequest, parseApiResponse, formatApiError } from '@/lib/apiClient';
import { usePermissions } from '@/context/AuthContext';
import { ModuleHeader } from '@/components/modules/ModuleHeader';

// Types
type Role = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  rolePermissions: { permission: Permission }[];
};

type User = {
  id: string;
  username: string;
  email: string;
  roleId: string;
  status: string;
  role: { name: string; rolePermissions: { permission: Permission }[] };
};

type Permission = {
  id: string;
  name: string;
  moduleKey: string;
  description: string | null;
};

export function PermissionsModule() {
  const { has } = usePermissions();
  const [activeTab, setActiveTab] = React.useState('roles');
  
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [users, setUsers] = React.useState<User[]>([]);
  const [permissions, setPermissions] = React.useState<Permission[]>([]);
  
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, uRes, pRes] = await Promise.all([
        apiRequest('permissions/roles'),
        apiRequest('permissions/users'),
        apiRequest('permissions/list')
      ]);
      setRoles(parseApiResponse<Role[]>(rRes));
      setUsers(parseApiResponse<User[]>(uRes));
      setPermissions(parseApiResponse<Permission[]>(pRes));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!has('manage_settings')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Shield className="w-16 h-16 text-rose-500 opacity-20" />
        <h2 className="text-xl font-black uppercase tracking-tight">Access Restricted</h2>
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest text-center max-w-sm">You need administrative permissions to manage user access.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 text-left pb-20">
      {/* Header */}
      <ModuleHeader
        title="Access Control"
        subtitle="Define roles and manage team access to system modules."
        status="live"
        icon={Shield}
        actions={
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
             <Badge className="bg-indigo-50 text-indigo-600 border-none px-4 py-2 font-black uppercase tracking-widest text-[9px]">
               {roles.length} System Roles
             </Badge>
             <div className="w-px h-6 bg-slate-100" />
             <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-2 font-black uppercase tracking-widest text-[9px]">
               {users.length} Active Users
             </Badge>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="bg-slate-100/50 p-1 rounded-2xl h-auto">
           <TabsTrigger 
             value="roles" 
             className="rounded-xl px-10 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all"
           >
             User Roles
           </TabsTrigger>
           <TabsTrigger 
             value="users" 
             className="rounded-xl px-10 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm transition-all"
           >
             Manage Access
           </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-8">
          <RoleManager roles={roles} permissions={permissions} onUpdate={fetchData} />
        </TabsContent>

        <TabsContent value="users" className="space-y-8">
          <UserManager users={users} roles={roles} onUpdate={fetchData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Role Management Sub-module ---
function RoleManager({ roles, permissions, onUpdate }: { roles: Role[], permissions: Permission[], onUpdate: () => void }) {
  const [editingRole, setEditingRole] = React.useState<Role | null>(null);
  const [isNew, setIsNew] = React.useState(false);
  const [formData, setFormData] = React.useState({ name: '', description: '', permissionIds: [] as string[] });
  const [roleSaveError, setRoleSaveError] = React.useState<string | null>(null);

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setIsNew(false);
    setFormData({ 
      name: role.name, 
      description: role.description || '', 
      permissionIds: role.rolePermissions.map(rp => rp.permission.id) 
    });
  };

  const openNew = () => {
    setEditingRole(null);
    setIsNew(true);
    setFormData({ name: '', description: '', permissionIds: [] });
  };

  const handleTogglePerm = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId) 
        ? prev.permissionIds.filter(id => id !== permId)
        : [...prev.permissionIds, permId]
    }));
  };

  const handleSave = async () => {
    try {
      setRoleSaveError(null);
      await apiRequest('permissions/roles', {
        method: 'POST',
        body: JSON.stringify({ ...formData, id: editingRole?.id })
      });
      setEditingRole(null);
      setIsNew(false);
      onUpdate();
    } catch (e) {
      setRoleSaveError(formatApiError(e));
    }
  };

  const getModuleLabel = (key: string) => {
    return key.replace('manage_', '').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
      <div className="xl:col-span-4 space-y-6">
        <div className="flex items-center justify-between">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Available Roles</h3>
           {!isNew && <Button onClick={openNew} size="sm" className="h-8 rounded-xl bg-indigo-600 text-white font-black uppercase text-[9px] tracking-widest px-4 hover:bg-slate-950 transition-all border-none">
             <Plus className="w-3 h-3 mr-2" /> New Role
           </Button>}
        </div>
        
        <div className="space-y-4">
           {roles.map(role => (
             <Card 
               key={role.id} 
               onClick={() => openEdit(role)}
               className={cn(
                 "border-none shadow-lg rounded-[2.5rem] cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]",
                 editingRole?.id === role.id ? "bg-slate-950 text-white ring-4 ring-indigo-500/20" : "bg-white text-slate-950"
               )}
             >
                <CardContent className="p-8 flex items-center justify-between">
                   <div className="space-y-2">
                      <div className="flex items-center gap-2">
                         <span className="text-base font-black uppercase tracking-tight">{role.name}</span>
                         {role.isSystem && <Badge className="bg-indigo-500/20 text-indigo-400 border-none text-[8px] font-black uppercase tracking-widest">SYSTEM</Badge>}
                      </div>
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest", editingRole?.id === role.id ? "text-slate-400" : "text-slate-400")}>
                        {role.rolePermissions.length} Modules Authorized
                      </p>
                   </div>
                   <ChevronRight className={cn("w-5 h-5", editingRole?.id === role.id ? "text-indigo-400" : "text-slate-200")} />
                </CardContent>
             </Card>
           ))}
        </div>
      </div>

      <div className="xl:col-span-8">
         {(editingRole || isNew) ? (
            <Card className="border-none shadow-2xl rounded-[4rem] bg-white overflow-hidden animate-in slide-in-from-right-10 duration-500">
               <CardHeader className="p-12 border-b border-slate-50 flex flex-row items-center justify-between bg-slate-50/20">
                  <div className="space-y-2">
                     <CardTitle className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">
                       {isNew ? 'New Role' : `Role: ${editingRole?.name}`}
                     </CardTitle>
                     <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Grant module-level access for this role</CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                     <Button onClick={handleSave} className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-slate-950 text-white font-black uppercase text-[10px] tracking-widest shadow-xl transition-all border-none">
                       Save Permissions
                     </Button>
                  </div>
               </CardHeader>
                <CardContent className="p-12 space-y-12 text-left">
                   {roleSaveError && (
                     <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm font-bold text-rose-700 flex items-center justify-between animate-in slide-in-from-top-2">
                       <span>{roleSaveError}</span>
                       <button onClick={() => setRoleSaveError(null)} className="text-rose-400 hover:text-rose-600 font-black text-xs ml-2">✕</button>
                     </div>
                   )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Role Name</Label>
                        <Input 
                          value={formData.name} 
                          onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                          readOnly={editingRole?.isSystem}
                          className="h-16 rounded-2xl bg-slate-50 border-none px-6 font-black uppercase text-sm tracking-tight focus:ring-2 focus:ring-indigo-500"
                        />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Purpose</Label>
                        <Input 
                          value={formData.description} 
                          onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                          className="h-16 rounded-2xl bg-slate-50 border-none px-6 font-black uppercase text-sm tracking-tight focus:ring-2 focus:ring-indigo-500"
                        />
                     </div>
                  </div>

                  <div className="space-y-8">
                     <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Authorized Modules</h4>
                        <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[9px] uppercase tracking-widest px-4 py-1.5">
                           {formData.permissionIds.length} ACTIVE
                        </Badge>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {permissions.map(perm => {
                          const isActive = formData.permissionIds.includes(perm.id);
                          return (
                            <div 
                              key={perm.id} 
                              onClick={() => handleTogglePerm(perm.id)}
                              className={cn(
                                "p-8 rounded-[2.5rem] border-4 cursor-pointer transition-all flex flex-col gap-4 group",
                                isActive ? "bg-indigo-50 border-indigo-200" : "bg-white border-slate-50 hover:border-slate-200 shadow-sm"
                              )}
                            >
                               <div className="flex items-center justify-between">
                                  <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                    isActive ? "bg-indigo-600 text-white shadow-lg" : "bg-slate-100 text-slate-400"
                                  )}>
                                     {isActive ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
                                  </div>
                                  <div className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                    isActive ? "bg-indigo-600 border-indigo-600" : "border-slate-200"
                                  )}>
                                    {isActive && <Check className="w-3 h-3 text-white" />}
                                  </div>
                               </div>
                               <div className="space-y-1">
                                  <p className={cn("text-xs font-black uppercase tracking-tight", isActive ? "text-indigo-900" : "text-slate-900")}>{getModuleLabel(perm.moduleKey)}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Can access {getModuleLabel(perm.moduleKey)} tools</p>
                               </div>
                            </div>
                          );
                        })}
                     </div>
                  </div>
               </CardContent>
            </Card>
         ) : (
            <div className="h-full min-h-[500px] rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center p-20 text-center space-y-6">
               <div className="w-24 h-24 rounded-[3rem] bg-slate-50 flex items-center justify-center text-slate-200">
                  <Shield size={48} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase tracking-tight text-slate-300">Select Role</h3>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-300">Choose a role from the list to modify authorized modules.</p>
               </div>
            </div>
         )}
      </div>
    </div>
  );
}

// --- User Management Sub-module ---
function UserManager({ users, roles, onUpdate }: { users: User[], roles: Role[], onUpdate: () => void }) {
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [isNew, setIsNew] = React.useState(false);
  const [formData, setFormData] = React.useState({ username: '', email: '', password: '', roleId: '', status: 'Active' });
  const [search, setSearch] = React.useState('');
  const [userSaveError, setUserSaveError] = React.useState<string | null>(null);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setIsNew(true);
    setEditingUser(null);
    setFormData({ username: '', email: '', password: '', roleId: roles[0]?.id || '', status: 'Active' });
  };

  const openEdit = (user: User) => {
    setIsNew(false);
    setEditingUser(user);
    setFormData({ username: user.username, email: user.email, password: '', roleId: user.roleId, status: user.status });
  };

  const handleSave = async () => {
    try {
      setUserSaveError(null);
      await apiRequest('permissions/users', {
        method: 'POST',
        body: JSON.stringify({ ...formData, id: editingUser?.id })
      });
      setIsNew(false);
      setEditingUser(null);
      onUpdate();
    } catch (e) {
      setUserSaveError(formatApiError(e));
    }
  };

  const getModuleLabel = (key: string) => {
    return key.replace('manage_', '').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 text-left">
       <div className="xl:col-span-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
             <div className="relative w-full md:w-[450px]">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name..."
                  className="h-16 pl-16 pr-8 rounded-2xl bg-white border-slate-100 shadow-xl font-black uppercase text-[11px] tracking-widest focus:ring-2 focus:ring-indigo-500"
                />
             </div>
             <Button onClick={openNew} className="h-16 px-12 rounded-2xl bg-indigo-600 hover:bg-slate-950 text-white font-black uppercase text-[11px] tracking-widest shadow-2xl transition-all border-none">
                <UserPlus className="w-5 h-5 mr-3" /> Create User
             </Button>
          </div>

          <Card className="border-none shadow-2xl rounded-[4rem] bg-white overflow-hidden">
             <Table>
                <TableHeader className="bg-slate-50/50">
                   <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="px-10 py-8 text-[11px] font-black uppercase tracking-widest text-slate-400">User</TableHead>
                      <TableHead className="py-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Authorized Modules</TableHead>
                      <TableHead className="py-8 text-[11px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                      <TableHead className="px-10 py-8 text-right text-[11px] font-black uppercase tracking-widest text-slate-400">Control</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {filteredUsers.map(user => (
                     <TableRow key={user.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                        <TableCell className="px-10 py-8">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm uppercase shadow-inner">
                                 {user.username[0]}
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-base font-black text-slate-900 uppercase tracking-tight">{user.username}</span>
                                 <Badge className="w-fit mt-1 bg-slate-100 text-slate-500 border-none font-black text-[8px] uppercase tracking-widest">{user.role?.name}</Badge>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell className="py-8">
                           <div className="flex flex-wrap gap-1 max-w-[300px]">
                              {user.role?.rolePermissions?.slice(0, 4).map(rp => (
                                <Badge key={rp.permission.id} variant="outline" className="bg-white text-slate-400 border-slate-100 text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                                   {getModuleLabel(rp.permission.moduleKey)}
                                </Badge>
                              ))}
                              {user.role?.rolePermissions?.length > 4 && (
                                <span className="text-[9px] font-black text-indigo-400">+{user.role.rolePermissions.length - 4} more</span>
                              )}
                           </div>
                        </TableCell>
                        <TableCell className="py-8">
                           <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300')} />
                              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">{user.status}</span>
                           </div>
                        </TableCell>
                        <TableCell className="px-10 py-8 text-right">
                           <Button onClick={() => openEdit(user)} variant="ghost" className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-colors">Manage Access</Button>
                        </TableCell>
                     </TableRow>
                   ))}
                </TableBody>
             </Table>
          </Card>
       </div>

       <div className="xl:col-span-4">
          {(editingUser || isNew) ? (
            <Card className="border-none shadow-2xl rounded-[4rem] bg-slate-950 text-white overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
               <CardHeader className="p-12 border-b border-white/5">
                  <div className="flex justify-between items-start">
                     <div className="space-y-2">
                        <CardTitle className="text-3xl font-black tracking-tight uppercase leading-none">
                          {isNew ? 'New User' : 'Edit User'}
                        </CardTitle>
                        <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Assign role and login credentials</CardDescription>
                     </div>
                     <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl">
                        {isNew ? <UserPlus className="w-8 h-8" /> : <UserCheck className="w-8 h-8" />}
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="p-12 space-y-10">
                  {userSaveError && (
                     <div className="rounded-xl bg-rose-900/30 border border-rose-500/30 px-4 py-3 text-sm font-bold text-rose-300 flex items-center justify-between animate-in slide-in-from-top-2">
                       <span>{userSaveError}</span>
                       <button onClick={() => setUserSaveError(null)} className="text-rose-400 hover:text-rose-200 font-black text-xs ml-2">✕</button>
                     </div>
                   )}
                  <div className="space-y-8">
                     <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Full Name</Label>
                        <Input 
                          value={formData.username} 
                          onChange={e => setFormData(f => ({ ...f, username: e.target.value }))}
                          className="h-16 rounded-2xl bg-white/5 border-white/10 px-8 font-black uppercase text-sm tracking-tight focus:ring-2 focus:ring-indigo-500"
                        />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Email</Label>
                        <Input 
                          value={formData.email} 
                          onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                          className="h-16 rounded-2xl bg-white/5 border-white/10 px-8 font-black uppercase text-sm tracking-tight focus:ring-2 focus:ring-indigo-500"
                        />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500">Assigned Role</Label>
                        <Select value={formData.roleId} onValueChange={v => setFormData(f => ({ ...f, roleId: v }))}>
                           <SelectTrigger className="h-16 rounded-2xl bg-white/5 border-white/10 px-8 font-black uppercase text-sm tracking-tight text-left">
                              <SelectValue placeholder="Select role..." />
                           </SelectTrigger>
                           <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                              {roles.map(r => (
                                <SelectItem key={r.id} value={r.id} className="font-black uppercase text-[11px] tracking-widest hover:bg-white/10 transition-colors py-3">{r.name}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>

                  <div className="space-y-4 pt-10 border-t border-white/5">
                     <Button onClick={handleSave} className="w-full h-16 bg-white text-slate-950 hover:bg-slate-100 rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-2xl border-none">
                        Save Access Settings
                     </Button>
                     <Button variant="ghost" onClick={() => { setEditingUser(null); setIsNew(false); }} className="w-full h-14 text-slate-500 font-black uppercase text-[10px] tracking-widest">Cancel</Button>
                  </div>
               </CardContent>
            </Card>
          ) : (
            <Card className="h-full min-h-[500px] border-4 border-dashed border-slate-100 rounded-[4rem] bg-slate-50/50 flex flex-col items-center justify-center p-16 text-center space-y-6">
               <div className="w-24 h-24 rounded-[3rem] bg-white shadow-xl flex items-center justify-center text-slate-200">
                  <UserCheck size={48} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-400">User Setup</h3>
                  <p className="text-[11px] font-black uppercase tracking-widest text-slate-300">Select a team member to manage their authorized modules.</p>
               </div>
            </Card>
          )}
       </div>
    </div>
  );
}
