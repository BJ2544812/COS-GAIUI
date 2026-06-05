import * as React from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { getQuickTestSuggestion } from '@/lib/guidedLearning';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function QuickTestNextCard({ className }: { className?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const suggestion = React.useMemo(
    () => (user ? getQuickTestSuggestion(user) : null),
    [user],
  );

  if (!suggestion) return null;

  const isComplete = suggestion.kind === 'complete';

  return (
    <Card
      className={cn(
        'rounded-2xl shadow-sm',
        isComplete
          ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50'
          : 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50',
        className,
      )}
    >
      <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          )}
          <div>
            <p
              className={cn(
                'text-xs font-bold uppercase tracking-wide',
                isComplete ? 'text-emerald-700' : 'text-indigo-700',
              )}
            >
              {isComplete ? 'Role tour complete' : 'Show me what to test next'}
            </p>
            <p className="font-bold text-slate-900">{suggestion.title}</p>
            <p className="text-sm text-slate-600 font-medium line-clamp-2">{suggestion.description}</p>
          </div>
        </div>
        <Button
          type="button"
          variant={isComplete ? 'outline' : 'default'}
          className={cn('shrink-0 font-bold min-h-[44px]', !isComplete && 'bg-indigo-600')}
          onClick={() => navigate(suggestion.href)}
        >
          {isComplete ? 'Open checklist' : 'Go now'}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
