import * as React from 'react';
import { CheckCircle2, Circle, Rocket, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest, formatApiError, parseApiResponse } from '@/lib/apiClient';
import { cn } from '@/lib/utils';
import type { ERPModule } from '@/types';

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  module?: string;
};

type OnboardingPayload = {
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  percentComplete: number;
  demoMode: boolean;
};

function SetupProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden" role="progressbar" aria-valuenow={value}>
      <div
        className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function OnboardingChecklist({
  onModuleChange,
  compact = false,
}: {
  onModuleChange?: (m: ERPModule) => void;
  compact?: boolean;
}) {
  const [data, setData] = React.useState<OnboardingPayload | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activatingDemo, setActivatingDemo] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      setError(null);
      const j = await apiRequest<unknown>('deploy/onboarding', { method: 'GET' });
      setData(parseApiResponse<OnboardingPayload>(j));
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const activateDemo = async () => {
    setActivatingDemo(true);
    try {
      await apiRequest('deploy/demo/activate', { method: 'POST' });
      await load();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setActivatingDemo(false);
    }
  };

  if (loading) return null;
  if (!data || data.percentComplete >= 100) return null;

  const nextStep = data.steps.find((s) => !s.completed);

  if (compact) {
    return (
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Rocket className="w-5 h-5 text-indigo-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Setup progress</p>
            <p className="text-sm font-bold text-slate-800 truncate">
              {data.completedCount}/{data.totalCount} complete — {nextStep?.title ?? 'Almost there'}
            </p>
          </div>
        </div>
        <div className="w-32">
          <SetupProgressBar value={data.percentComplete} />
        </div>
        {nextStep?.module && onModuleChange && (
          <Button
            type="button"
            size="sm"
            className="bg-indigo-600"
            onClick={() => onModuleChange(nextStep.module as ERPModule)}
          >
            Continue setup
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="rounded-3xl border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-900">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Ministry onboarding
            </CardTitle>
            <CardDescription className="font-medium">
              Production checklist — complete these steps to go live with confidence.
            </CardDescription>
          </div>
          <span className="text-2xl font-black text-indigo-600">{data.percentComplete}%</span>
        </div>
        <div className="mt-4">
          <SetupProgressBar value={data.percentComplete} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && <p className="text-sm text-rose-600">{error}</p>}
        {data.steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-2xl border transition-colors',
              step.completed ? 'bg-emerald-50/80 border-emerald-100' : 'bg-white border-slate-100',
            )}
          >
            {step.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm">{step.title}</p>
              <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
            </div>
            {!step.completed && step.module && onModuleChange && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => onModuleChange(step.module as ERPModule)}
              >
                Open
              </Button>
            )}
          </div>
        ))}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => void load()}>
            Refresh
          </Button>
          {!data.demoMode && (
            <Button
              type="button"
              variant="secondary"
              disabled={activatingDemo}
              onClick={() => void activateDemo()}
            >
              {activatingDemo ? 'Enabling…' : 'Enable demo walkthrough'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
