import * as React from 'react';
import { Shield, Flame, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import type { VolunteerHealthProfile } from '@/lib/ministryIntelligenceTypes';

type VolunteerHealthPayload = {
  summary: {
    burnoutRiskCount: number;
    overloadCount: number;
    leadershipReadyCount: number;
    avgReliability: number;
  };
  profiles: VolunteerHealthProfile[];
};

export function VolunteerHealthPanel({ compact }: { compact?: boolean }) {
  const [data, setData] = React.useState<VolunteerHealthPayload | null>(null);

  React.useEffect(() => {
    void (async () => {
      try {
        const j = await apiRequest<unknown>('operations/ministry-intelligence/volunteer-health', { method: 'GET' });
        setData(parseApiResponse<VolunteerHealthPayload>(j));
      } catch {
        setData(null);
      }
    })();
  }, []);

  if (!data) return null;

  const atRisk = data.profiles.filter((p) => p.burnoutRisk || p.noShowRisk || p.ministryOverload).slice(0, compact ? 5 : 12);

  return (
    <Card className="border-none shadow-sm rounded-3xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-black flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          Volunteer care
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-amber-100 text-amber-900 text-[9px] font-black">
            <Flame className="w-3 h-3 mr-1" /> Need rest: {data.summary.burnoutRiskCount}
          </Badge>
          <Badge className="bg-indigo-100 text-indigo-800 text-[9px] font-black">
            <Star className="w-3 h-3 mr-1" /> Leadership ready: {data.summary.leadershipReadyCount}
          </Badge>
          <Badge variant="outline" className="text-[9px] font-black">
            Typical attendance {data.summary.avgReliability}%
          </Badge>
        </div>
        <ul className="space-y-2">
          {atRisk.map((p) => (
            <li key={p.memberId} className="flex justify-between gap-2 p-3 rounded-xl bg-slate-50 text-sm">
              <span className="font-bold text-slate-900 truncate">{p.name}</span>
              <span className="text-[10px] font-black uppercase text-amber-700 shrink-0">
                {p.burnoutRisk ? 'Burnout' : p.noShowRisk ? 'No-show risk' : 'Overload'}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
