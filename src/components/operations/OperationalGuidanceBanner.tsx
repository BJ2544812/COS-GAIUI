import * as React from 'react';
import { Lightbulb, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ERPModule } from '@/types';

const HINTS: Record<string, { title: string; body: string; cta?: { label: string; module: ERPModule } }> = {
  'sunday-prep': {
    title: 'Sunday preparation',
    body: 'Open Sunday Service for live timing and teams, then Attendance for check-in. Use Home for cross-team visibility.',
    cta: { label: 'Open Sunday Service', module: 'sunday-mode' },
  },
  'event-prep': {
    title: 'Event coordination',
    body: 'Approve the event, assign volunteers, open registration when ready, and send a communication campaign from the hub.',
    cta: { label: 'View events', module: 'events' },
  },
  'volunteer-gap': {
    title: 'Volunteer coverage',
    body: 'Events with fewer than two volunteers show as shortages. Assign roles from Volunteers or update teams in Sunday Service.',
    cta: { label: 'Volunteers', module: 'volunteers' },
  },
  'incident-recovery': {
    title: 'Something failed?',
    body: 'Church Admin → Issues shows backup or task failures. Retry from Activity log after your administrator fixes the cause.',
    cta: { label: 'Church Admin', module: 'admin-center' },
  },
};

export function OperationalGuidanceBanner({
  hintId,
  onModuleChange,
  className,
}: {
  hintId: keyof typeof HINTS;
  onModuleChange?: (m: ERPModule) => void;
  className?: string;
}) {
  const storageKey = `ucos_hint_dismiss_${hintId}`;
  const [dismissed, setDismissed] = React.useState(() => {
    try {
      return sessionStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });

  const hint = HINTS[hintId];
  if (!hint || dismissed) return null;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-start gap-3 p-4 rounded-2xl bg-indigo-50 border border-indigo-100',
        className,
      )}
    >
      <Lightbulb className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-sm font-black text-indigo-950">{hint.title}</p>
        <p className="text-sm text-indigo-900/80 font-medium">{hint.body}</p>
        {hint.cta && onModuleChange && (
          <button
            type="button"
            onClick={() => onModuleChange(hint.cta!.module)}
            className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:underline mt-2"
          >
            {hint.cta.label} →
          </button>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss hint"
        className="p-2 rounded-lg hover:bg-indigo-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
        onClick={() => {
          sessionStorage.setItem(storageKey, '1');
          setDismissed(true);
        }}
      >
        <X className="w-4 h-4 text-indigo-400" />
      </button>
    </div>
  );
}
