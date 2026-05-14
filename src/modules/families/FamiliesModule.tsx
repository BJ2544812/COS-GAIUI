import React from 'react';
import {
  Home, Users, Search, Plus, ChevronRight, Mail, Phone,
  UserCircle, Image as ImageIcon, Link2, ArrowLeft
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import { ERPModule } from '@/types';
import { ModuleHeader, StatCard, EmptyState } from '@/components/modules/ModuleHeader';
import { AppAvatar } from '@/components/ui/app-avatar';
import { SERVER_ROOT } from '@/lib/apiConfig';
import { cn } from '@/lib/utils';

interface FamiliesModuleProps {
  onModuleChange?: (module: ERPModule) => void;
}

interface FamilyMember {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status?: string;
  growthStage?: string;
  profileImageUrl?: string | null;
}

interface Family {
  id: string;
  name: string;
  imageUrl?: string | null;
  members?: FamilyMember[];
  _count?: { members: number };
}

export function FamiliesModule({ onModuleChange }: FamiliesModuleProps) {
  const [families, setFamilies] = React.useState<Family[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [selectedFamily, setSelectedFamily] = React.useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = React.useState<FamilyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = React.useState(false);

  const refreshFamilies = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiRequest('families');
      const data = parseApiResponse<Family[]>(res);
      if (data) setFamilies(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load families');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshFamilies();
  }, [refreshFamilies]);

  React.useEffect(() => {
    const onRefresh = () => {
      void refreshFamilies();
    };
    window.addEventListener('kos:families-refresh', onRefresh);
    return () => window.removeEventListener('kos:families-refresh', onRefresh);
  }, [refreshFamilies]);

  const fetchFamilyMembers = async (familyId: string) => {
    try {
      setLoadingMembers(true);
      const res = await apiRequest(`members?familyId=${encodeURIComponent(familyId)}`);
      const data = parseApiResponse<FamilyMember[]>(res);
      if (data) setFamilyMembers(data);
    } catch {
      setFamilyMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSelectFamily = (family: Family) => {
    setSelectedFamily(family);
    setFamilyMembers([]);
    fetchFamilyMembers(family.id);
  };

  const handleBack = () => {
    setSelectedFamily(null);
    setFamilyMembers([]);
  };

  const filteredFamilies = families.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalMembers = families.reduce((sum, f) => sum + (f._count?.members ?? f.members?.length ?? 0), 0);

  // --- FAMILY DETAIL VIEW ---
  if (selectedFamily) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-400">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full w-10 h-10 bg-slate-50 hover:bg-slate-100 shrink-0">
            <ArrowLeft size={18} className="text-slate-600" />
          </Button>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Families</p>
            <h2 className="text-xl font-black text-slate-900">{selectedFamily.name}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Family Card */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-36 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
                {selectedFamily.imageUrl ? (
                  <img src={`${SERVER_ROOT}${selectedFamily.imageUrl}`} alt={selectedFamily.name} className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                    <Home className="w-14 h-14 text-white/60" />
                  </>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-black text-slate-900">{selectedFamily.name}</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">{familyMembers.length} household members</p>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Actions</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => onModuleChange?.('members')}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-indigo-50 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-700 transition-colors"
                    >
                      <span className="flex items-center gap-2"><UserCircle size={14} /> Add Member</span>
                      <ChevronRight size={14} />
                    </button>
                    <button className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-indigo-50 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-700 transition-colors">
                      <span className="flex items-center gap-2"><ImageIcon size={14} /> Update Photo</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Member Roster */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-800">Household Members</h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">All linked members in this household</p>
                </div>
                <Badge className="bg-indigo-50 text-indigo-700 border-none font-black text-[10px] uppercase tracking-widest">
                  {familyMembers.length} members
                </Badge>
              </div>
              {loadingMembers ? (
                <div className="p-8 space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-slate-100 rounded-lg w-1/3" />
                        <div className="h-2.5 bg-slate-100 rounded-lg w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : familyMembers.length === 0 ? (
                <div className="p-12 text-center">
                  <Users size={28} className="mx-auto mb-3 text-slate-200" />
                  <p className="text-sm font-bold text-slate-500">No members linked yet</p>
                  <p className="text-xs text-slate-400 mt-1">Link members via their profile page</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {familyMembers.map((member) => (
                    <div key={member.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group">
                      <AppAvatar
                        src={member.profileImageUrl ? `${SERVER_ROOT}${member.profileImageUrl}` : undefined}
                        name={member.name}
                        className="w-10 h-10 rounded-xl shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{member.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {member.email && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                              <Mail size={10} />{member.email}
                            </span>
                          )}
                          {member.phone && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                              <Phone size={10} />{member.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={cn(
                          'border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5',
                          member.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        )}>
                          {member.status || 'Active'}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.growthStage || 'Visitor'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- DIRECTORY VIEW ---
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ModuleHeader
        title="Families"
        subtitle="Household groups, family units, and relationship hierarchy"
        status="partial"
        icon={Home}
        actions={
          <Button className="h-10 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest gap-2 shadow-sm" onClick={() => onModuleChange?.('members')}>
            <Link2 size={14} /> Manage Members
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard label="Total Families" value={loading ? '—' : families.length} icon={Home} iconColor="text-indigo-600" iconBg="bg-indigo-50" loading={loading} />
        <StatCard label="Total Members Linked" value={loading ? '—' : totalMembers} icon={Users} iconColor="text-emerald-600" iconBg="bg-emerald-50" loading={loading} />
        <StatCard label="Avg. Household Size" value={loading || families.length === 0 ? '—' : (totalMembers / families.length).toFixed(1)} icon={UserCircle} iconColor="text-violet-600" iconBg="bg-violet-50" loading={loading} />
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-5 py-4 text-sm font-medium">{error}</div>
      )}

      {/* Search */}
      {!loading && families.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search families by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all placeholder:font-medium placeholder:text-slate-400 shadow-sm"
          />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-slate-100 shadow-sm animate-pulse">
              <CardContent className="p-6 space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl" />
                <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
                <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredFamilies.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm">
          <EmptyState
            icon={Home}
            title={families.length === 0 ? "No families yet" : "No matching families"}
            description={families.length === 0
              ? "Families are created when members are linked together. Start by adding members."
              : "Try adjusting your search query."
            }
            action={
              families.length === 0 ? (
                <button
                  onClick={() => onModuleChange?.('members')}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
                >
                  Go to Members
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFamilies.map((family) => {
            const memberCount = family._count?.members ?? family.members?.length ?? 0;
            return (
              <button
                key={family.id}
                onClick={() => handleSelectFamily(family)}
                className="text-left bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group p-5 cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 border border-indigo-100 flex items-center justify-center overflow-hidden shrink-0">
                    {family.imageUrl ? (
                      <img
                        src={family.imageUrl.startsWith('http') ? family.imageUrl : `${SERVER_ROOT}${family.imageUrl}`}
                        alt={family.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Home className="w-6 h-6 text-indigo-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                      {family.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {memberCount} {memberCount === 1 ? 'member' : 'members'}
                    </p>
                    <div className="mt-3 flex items-center gap-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 group-hover:text-indigo-700 flex items-center gap-1">
                        View Household <ChevronRight size={10} />
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Info banner */}
      {!loading && (
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <Link2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-indigo-900 mb-1">Managing Families</p>
            <p className="text-xs text-indigo-600 font-medium leading-relaxed">
              Families are created and managed via Member profiles. Open any member's profile, go to the Family tab, and use "Link Family" to assign them to a household. Family images can be uploaded per household.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
