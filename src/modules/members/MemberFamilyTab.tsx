import * as React from 'react';
import {
  Users, Camera, DollarSign, Clock, MessageSquare, Award, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AppAvatar } from '@/components/ui/app-avatar';
import { SERVER_ROOT } from '@/lib/apiConfig';
import { formatAddressLine, googleMapsUrl } from '@/lib/memberAddress';
import { ResponsiveTableWrap } from '@/components/modules/ModuleHeader';
import { getMember, type MemberDto } from './memberApi';

export interface MemberFamilyTabProps {
  member: MemberDto;
  memberId: string;
  familyMembers: MemberDto[];
  onViewMember: (id: string) => void;
  onLinkFamily: () => void;
  onUnlinkFamily: () => void;
  onFamilyPhotoClick: () => void;
  familyPhotoInput: React.RefObject<HTMLInputElement | null>;
  onFamilyPhotoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

type TimelineItem = {
  id: string;
  at: string;
  label: string;
  detail: string;
  kind: 'note' | 'milestone' | 'giving';
  memberName: string;
};

export function MemberFamilyTab({
  member,
  memberId,
  familyMembers,
  onViewMember,
  onLinkFamily,
  onUnlinkFamily,
  onFamilyPhotoClick,
  familyPhotoInput,
  onFamilyPhotoSelect,
}: MemberFamilyTabProps) {
  const [householdDetails, setHouseholdDetails] = React.useState<MemberDto[]>([]);
  const [loadingHousehold, setLoadingHousehold] = React.useState(false);

  React.useEffect(() => {
    if (!member.familyId || familyMembers.length === 0) {
      setHouseholdDetails([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoadingHousehold(true);
      try {
        const full = await Promise.all(familyMembers.map((m) => getMember(m.id)));
        if (!cancelled) setHouseholdDetails(full);
      } catch {
        if (!cancelled) setHouseholdDetails(familyMembers);
      } finally {
        if (!cancelled) setLoadingHousehold(false);
      }
    })();
    return () => { cancelled = true; };
  }, [member.familyId, familyMembers]);

  const sharedGiving = React.useMemo(() => {
    const rows: { id: string; memberName: string; amount: number; date: string; method?: string; campaign?: string }[] = [];
    for (const m of householdDetails) {
      for (const d of m.donations ?? []) {
        rows.push({
          id: d.id,
          memberName: m.name,
          amount: Number(d.amount) || 0,
          date: d.date,
          method: d.method,
          campaign: d.campaign?.name,
        });
      }
    }
    return rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [householdDetails]);

  const givingTotal = sharedGiving.reduce((s, r) => s + r.amount, 0);

  const householdTimeline = React.useMemo((): TimelineItem[] => {
    const items: TimelineItem[] = [];
    for (const m of householdDetails) {
      for (const n of m.careNotes ?? []) {
        items.push({
          id: `note-${n.id}`,
          at: n.date || n.createdAt,
          label: 'Pastoral note',
          detail: n.note,
          kind: 'note',
          memberName: m.name,
        });
      }
      for (const ms of m.milestones ?? []) {
        items.push({
          id: `ms-${ms.id}`,
          at: ms.date,
          label: ms.type,
          detail: ms.notes || 'Milestone recorded',
          kind: 'milestone',
          memberName: m.name,
        });
      }
      for (const d of m.donations ?? []) {
        items.push({
          id: `gift-${d.id}`,
          at: d.date,
          label: 'Giving',
          detail: `₹${Number(d.amount).toLocaleString()}${d.campaign?.name ? ` · ${d.campaign.name}` : ''}`,
          kind: 'giving',
          memberName: m.name,
        });
      }
    }
    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 25);
  }, [householdDetails]);

  const addressLine = member.family ? formatAddressLine(member.family as MemberDto) : '';
  const mapUrl = member.family ? googleMapsUrl(member.family as MemberDto) : null;

  return (
    <div className="space-y-6">
      {/* Household overview */}
      <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <input type="file" ref={familyPhotoInput} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={onFamilyPhotoSelect} />
            <div
              className={cn('relative group', member.familyId && 'cursor-pointer')}
              onClick={() => member.familyId && onFamilyPhotoClick()}
            >
              <div className={cn('w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-md transition-all', member.familyId && 'group-hover:scale-105')}>
                <AppAvatar
                  src={member.family?.imageUrl ? `${SERVER_ROOT}${member.family.imageUrl}` : undefined}
                  name={member.family?.name || '?'}
                  className="w-full h-full rounded-none"
                />
                {member.familyId && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={16} className="text-white" />
                  </div>
                )}
              </div>
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Household overview</CardTitle>
              <CardDescription className="text-xs font-bold mt-1 uppercase tracking-widest text-indigo-600">
                {member.family?.name || 'No household linked'}
              </CardDescription>
              {addressLine && <p className="text-xs text-slate-500 font-medium mt-1">{addressLine}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-white shadow-sm font-bold h-9 rounded-xl border-slate-200" onClick={onLinkFamily}>
              {member.familyId ? 'Change household' : 'Link household'}
            </Button>
            {member.familyId && (
              <Button variant="ghost" size="sm" className="text-rose-500 hover:bg-rose-50 font-bold h-9 rounded-xl" onClick={onUnlinkFamily}>
                Unlink
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Members</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{familyMembers.length || (member.familyId ? 1 : 0)}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Household giving</p>
              <p className="text-2xl font-black text-emerald-800 mt-1">{loadingHousehold ? '…' : `₹${givingTotal.toLocaleString()}`}</p>
            </div>
            <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-violet-600">Timeline events</p>
              <p className="text-2xl font-black text-violet-800 mt-1">{loadingHousehold ? '…' : householdTimeline.length}</p>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Status</p>
              <p className="text-sm font-black text-indigo-800 mt-2">{member.familyId ? 'Linked' : 'Independent'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Family members */}
      <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-base font-bold text-slate-900">Family members</CardTitle>
          <CardDescription className="text-xs font-medium">Click any person to open their profile — no separate Families module needed.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {!member.familyId || familyMembers.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-400 text-center">
              <Users size={32} className="mb-4 opacity-20" />
              <p className="font-bold text-slate-900 mb-1">Independent profile</p>
              <p className="text-sm font-medium max-w-sm">Link this person to a household to see shared members, giving, and timeline.</p>
              <Button variant="ghost" size="sm" onClick={onLinkFamily} className="mt-4 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                Link household
              </Button>
            </div>
          ) : (
            <ResponsiveTableWrap className="border-0 rounded-none">
              <table className="w-full min-w-[480px] text-sm text-left">
                <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-100 text-xs uppercase tracking-widest font-black">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Relationship</th>
                    <th className="px-6 py-4">Stage</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {familyMembers.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <AppAvatar src={f.profileImageUrl ? `${SERVER_ROOT}${f.profileImageUrl}` : undefined} name={f.name} className="w-8 h-8 rounded-full shadow-sm" />
                          <span className="font-bold text-slate-900">{f.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 shadow-none border-none uppercase tracking-widest text-[10px] font-black">
                          {f.id === memberId ? 'Self' : 'Household'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">{f.growthStage || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 gap-1"
                          onClick={() => onViewMember(f.id)}
                          disabled={f.id === memberId}
                        >
                          {f.id === memberId ? 'Current' : <>View profile <ChevronRight size={12} /></>}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTableWrap>
          )}
        </CardContent>
      </Card>

      {/* Shared giving */}
      {member.familyId && (
        <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" /> Shared giving view
            </CardTitle>
            <CardDescription className="text-xs font-medium">Combined contributions from all household members.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingHousehold ? (
              <p className="p-8 text-center text-sm text-slate-400 font-bold">Loading household giving…</p>
            ) : sharedGiving.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500 font-medium">No household contributions recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {sharedGiving.map((g) => (
                  <div key={g.id} className="flex items-center justify-between p-5 hover:bg-slate-50">
                    <div>
                      <p className="text-sm font-bold text-slate-900">₹{g.amount.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{g.memberName} · {g.campaign || 'General'} · {new Date(g.date).toLocaleDateString()}</p>
                    </div>
                    {g.method && <Badge variant="outline" className="text-[10px] font-black uppercase">{g.method}</Badge>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Household timeline */}
      {member.familyId && householdTimeline.length > 0 && (
        <Card className="rounded-2xl shadow-sm border-slate-200 bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-violet-500" /> Household timeline
            </CardTitle>
            <CardDescription className="text-xs font-medium">Notes, milestones, and giving across the household.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative pl-8 space-y-8 before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-slate-100">
              {householdTimeline.map((item) => {
                const Icon = item.kind === 'note' ? MessageSquare : item.kind === 'milestone' ? Award : DollarSign;
                const color = item.kind === 'note' ? 'bg-violet-500' : item.kind === 'milestone' ? 'bg-amber-500' : 'bg-emerald-500';
                return (
                  <div key={item.id} className="relative">
                    <div className={cn('absolute -left-8 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 text-white', color)}>
                      <Icon size={12} />
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 ml-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {item.label} · {item.memberName} · {new Date(item.at).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-medium text-slate-700 mt-1">{item.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
