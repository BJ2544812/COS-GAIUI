import * as React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Brief success banner for operational actions (auto-dismiss). */
export function OpsFeedback({
  message,
  onDismiss,
  className,
}: {
  message: string;
  onDismiss?: () => void;
  className?: string;
}) {
  React.useEffect(() => {
    const t = window.setTimeout(() => onDismiss?.(), 5000);
    return () => window.clearTimeout(t);
  }, [message, onDismiss]);

  return (
    <div
      role="status"
      className={cn(
        'flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950',
        className,
      )}
    >
      <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden />
      <p className="text-sm font-bold flex-1">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="p-2 rounded-lg hover:bg-emerald-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
