import * as React from 'react';
import { Building2 } from 'lucide-react';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import type { CampusOverviewRow } from '@/lib/ministryIntelligenceTypes';

export function CampusFilterSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (campusId: string) => void;
}) {
  const [campuses, setCampuses] = React.useState<CampusOverviewRow[]>([]);

  React.useEffect(() => {
    void (async () => {
      try {
        const j = await apiRequest<unknown>('operations/ministry-intelligence/campus-overview', { method: 'GET' });
        const data = parseApiResponse<{ campuses: CampusOverviewRow[] }>(j);
        setCampuses(data.campuses ?? []);
      } catch {
        setCampuses([]);
      }
    })();
  }, []);

  if (campuses.length === 0) return null;

  return (
    <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
      <Building2 className="w-4 h-4 text-indigo-500" />
      <span className="sr-only">Campus filter</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 min-w-[140px] rounded-xl border border-slate-200 bg-white px-3 font-bold text-slate-800"
      >
        <option value="">All campuses</option>
        {campuses.map((c) => (
          <option key={c.campusId} value={c.campusId}>
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}
