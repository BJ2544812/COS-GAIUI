import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string | Date;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function ActivityTimeline({ events, className }: ActivityTimelineProps) {
  if (!events || events.length === 0) {
    return <p className="text-sm text-slate-500 italic">No recent activity.</p>;
  }

  return (
    <div className={cn("space-y-6 border-l-2 border-slate-100 ml-3", className)}>
      {events.map((event, i) => {
        const isPending = event.status === 'PENDING';
        const isFailed = event.status === 'FAILED';
        const isProcessed = event.status === 'PROCESSED';

        return (
          <div key={event.id} className="relative pl-6">
            <div className={cn(
              "absolute -left-[11px] top-1 rounded-full bg-white flex items-center justify-center",
              isPending && "text-amber-500",
              isProcessed && "text-emerald-500",
              isFailed && "text-rose-500"
            )}>
              {isPending && <Loader2 className="w-5 h-5 animate-spin" />}
              {isProcessed && <CheckCircle2 className="w-5 h-5 bg-white" />}
              {isFailed && <AlertCircle className="w-5 h-5 bg-white" />}
            </div>
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{event.title}</span>
                <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(event.timestamp).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </span>
              </div>
              {event.description && (
                <p className="text-sm text-slate-500">{event.description}</p>
              )}
              {isPending && (
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-flex w-max mt-1">
                  Processing...
                </span>
              )}
              {isProcessed && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-flex w-max mt-1">
                  Completed via background processing
                </span>
              )}
              {isFailed && (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full inline-flex w-max mt-1">
                  Processing Failed
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
