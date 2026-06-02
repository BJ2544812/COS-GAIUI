import * as React from 'react';
import { Heart, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import type { ExecutiveDashboard } from '@/lib/ministryIntelligenceTypes';

export function MinistryIntelligenceStrip({ campusId }: { campusId?: string }) {
  const [data, setData] = React.useState<ExecutiveDashboard | null>(null);

  React.useEffect(() => {
    const q = campusId ? `?campusId=${encodeURIComponent(campusId)}` : '';
    void (async () => {
      try {
        const j = await apiRequest<unknown>(`operations/ministry-intelligence/executive${q}`, { method: 'GET' });
        setData(parseApiResponse<ExecutiveDashboard>(j));
      } catch {
        setData(null);
      }
    })();
  }, [campusId]);

  if (!data) return null;

  const p = data.predictive;
  const signals = [
    { on: p.staffingShortage.risk, label: 'Staffing', icon: Users },
    { on: p.burnout.risk, label: 'Burnout', icon: AlertTriangle },
    { on: p.serviceRisk.risk, label: 'Service', icon: TrendingUp },
    { on: p.attendanceDrop.risk, label: 'Attendance', icon: Heart },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-900/5 border border-slate-100">
      <Heart className="w-4 h-4 text-indigo-600 shrink-0" />
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-1">Church snapshot</span>
      <Badge variant="outline" className="text-[9px] font-black">
        People {data.ministryHealth.engagementScore}
      </Badge>
      <Badge variant="outline" className="text-[9px] font-black">
        Sunday prep {data.operationalHealth.serviceReadiness}%
      </Badge>
      {signals.map((s) => (
        <Badge
          key={s.label}
          className={cn(
            'text-[9px] font-black uppercase gap-1',
            s.on ? 'bg-amber-100 text-amber-900' : 'bg-emerald-50 text-emerald-800',
          )}
        >
          <s.icon className="w-3 h-3" />
          {s.label}: {s.on ? 'Watch' : 'Good'}
        </Badge>
      ))}
    </div>
  );
}
