import * as React from 'react';
import { Heart, UserX, ListTodo } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { apiRequest, parseApiResponse } from '@/lib/apiClient';
import type { PastoralInsights } from '@/lib/ministryIntelligenceTypes';
import type { ERPModule } from '@/types';

export function PastoralInsightPanel({ onModuleChange }: { onModuleChange?: (m: ERPModule) => void }) {
  const [data, setData] = React.useState<PastoralInsights | null>(null);

  React.useEffect(() => {
    void (async () => {
      try {
        const j = await apiRequest<unknown>('operations/ministry-intelligence/pastoral', { method: 'GET' });
        setData(parseApiResponse<PastoralInsights>(j));
      } catch {
        setData(null);
      }
    })();
  }, []);

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="rounded-3xl border-rose-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            People who need follow-up
          </CardTitle>
          <CardDescription>From attendance patterns and guest visits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 max-h-64 overflow-y-auto">
          {data.followUpPriority.length === 0 ? (
            <p className="text-sm text-slate-500">No urgent follow-ups detected.</p>
          ) : (
            data.followUpPriority.map((r, i) => (
              <button
                key={`${r.memberId}-${i}`}
                type="button"
                onClick={() => onModuleChange?.('members')}
                className="w-full text-left p-3 rounded-xl bg-rose-50/80 hover:bg-rose-100 min-h-[48px] touch-manipulation"
              >
                <p className="font-bold text-slate-900 text-sm">{r.name}</p>
                <p className="text-xs text-slate-600 mt-0.5">{r.reason}</p>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-slate-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <UserX className="w-5 h-5 text-amber-500" />
            Volunteers serving heavily
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.ministryStress.slice(0, 8).map((v) => (
            <div key={v.memberId} className="flex justify-between p-3 rounded-xl bg-slate-50 text-sm">
              <span className="font-bold">{v.name}</span>
              <span className="text-xs font-medium text-amber-700">{v.activeAssignments} roles</span>
            </div>
          ))}
          <button
            type="button"
            className="w-full mt-2 py-3 text-indigo-600 font-bold text-sm"
            onClick={() => onModuleChange?.('discipleship')}
          >
            <ListTodo className="w-4 h-4 inline mr-1" />
            Open Pastoral Care
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
