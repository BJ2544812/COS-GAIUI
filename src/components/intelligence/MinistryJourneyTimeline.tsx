import * as React from 'react';
import { Route, CalendarCheck, HandHeart, ListTodo } from 'lucide-react';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import type { MinistryJourneyPayload } from '@/lib/ministryIntelligenceTypes';

const KIND_ICON: Record<string, React.ElementType> = {
  attendance: CalendarCheck,
  volunteer: HandHeart,
  task: ListTodo,
};

export function MinistryJourneyTimeline({ memberId }: { memberId: string }) {
  const [data, setData] = React.useState<MinistryJourneyPayload | null>(null);

  React.useEffect(() => {
    if (!memberId) return;
    void (async () => {
      try {
        const j = await apiRequest<unknown>(`operations/members/${memberId}/ministry-journey`, { method: 'GET' });
        setData(parseApiResponse<MinistryJourneyPayload>(j));
      } catch {
        setData(null);
      }
    })();
  }, [memberId]);

  if (!data) {
    return <p className="text-sm text-slate-500 py-4">Ministry journey loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Route className="w-5 h-5 text-indigo-500" />
        <h4 className="text-sm font-black uppercase tracking-widest text-slate-700">Ministry journey</h4>
      </div>
      <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase">
        <span className="px-2 py-1 rounded-lg bg-slate-100">{data.summary.attendanceCount} check-ins</span>
        <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-800">{data.summary.volunteerRoles} serving roles</span>
        <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800">{data.summary.openTasks} open tasks</span>
      </div>
      <ul className="space-y-2 max-h-72 overflow-y-auto border-l-2 border-indigo-100 pl-4">
        {data.timeline.map((item, i) => {
          const Icon = KIND_ICON[item.kind] ?? ListTodo;
          return (
            <li key={`${item.at}-${i}`} className="relative">
              <span className="absolute -left-[21px] top-2 w-2 h-2 rounded-full bg-indigo-400" />
              <div className="flex gap-3 p-2 rounded-xl hover:bg-slate-50">
                <Icon className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.label}</p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {new Date(item.at).toLocaleString()} · {item.kind}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
