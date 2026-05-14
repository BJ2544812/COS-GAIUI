import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, MessageSquare, CheckCircle, ArrowRight, User, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

export interface PastoralEvent {
  id: string;
  type: 'CARE_LOG' | 'TASK_COMPLETION' | 'MENTORSHIP' | 'SYSTEM' | 'PRAYER';
  title: string;
  description?: string;
  timestamp: string | Date;
  actorName?: string;
  icon?: React.ReactNode;
  colorClass?: string;
}

interface PastoralTimelineProps {
  events: PastoralEvent[];
  className?: string;
}

export function PastoralTimeline({ events, className }: PastoralTimelineProps) {
  if (!events || events.length === 0) {
    return <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-10">No chronological history available.</p>;
  }

  // Group by day (optional, but requested implicitly via chronological/pastoral feel)
  const sortedEvents = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className={cn("space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent", className)}>
      {sortedEvents.map((event, i) => {
        let defaultIcon = <CheckCircle className="w-4 h-4" />;
        let iconBg = "bg-slate-100 text-slate-500";

        if (event.type === 'CARE_LOG') {
          defaultIcon = <MessageSquare className="w-4 h-4" />;
          iconBg = "bg-indigo-100 text-indigo-600";
        } else if (event.type === 'TASK_COMPLETION') {
          defaultIcon = <CheckCircle className="w-4 h-4" />;
          iconBg = "bg-emerald-100 text-emerald-600";
        } else if (event.type === 'PRAYER') {
          defaultIcon = <ShieldAlert className="w-4 h-4" />;
          iconBg = "bg-amber-100 text-amber-600";
        }

        const resolvedIcon = event.icon || defaultIcon;
        const resolvedColor = event.colorClass || iconBg;

        return (
          <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Icon */}
            <div className={cn("flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10", resolvedColor)}>
              {resolvedIcon}
            </div>
            
            {/* Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(event.timestamp), 'MMM d, h:mm a')}
                </span>
                {event.actorName && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1">
                    <User className="w-3 h-3" /> {event.actorName}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-900">{event.title}</h4>
              {event.description && (
                <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">{event.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
