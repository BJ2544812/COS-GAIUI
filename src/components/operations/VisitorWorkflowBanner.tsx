import * as React from 'react';
import { Info, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VISITOR_WORKFLOW } from '@/lib/visitorWorkflow';
import type { ERPModule } from '@/types';

type Variant = 'outreach' | 'attendance' | 'intake';

const COPY: Record<
  Variant,
  { title: string; body: string; primary?: { label: string; module: ERPModule } }
> = {
  outreach: {
    title: 'Canonical visitor register',
    body: 'Register Sunday guests here first. Follow-ups queue automatically. Attendance check-ins also sync to this pipeline.',
  },
  attendance: {
    title: 'Visitor check-in + follow-up',
    body: 'Guest check-ins record headcount and register the visitor in Visitors & Outreach for pastoral follow-up.',
    primary: { label: 'Open follow-up queue', module: 'outreach' },
  },
  intake: {
    title: 'Membership intake (not Sunday guest register)',
    body: 'Use this when a guest is ready to join as a Member. For first-time Sunday guests, register in Visitors & Outreach first.',
    primary: { label: 'Register a guest', module: 'outreach' },
  },
};

export function VisitorWorkflowBanner({
  variant,
  onModuleChange,
}: {
  variant: Variant;
  onModuleChange?: (m: ERPModule) => void;
}) {
  const c = COPY[variant];
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-5 py-4 flex flex-wrap items-start justify-between gap-3">
      <div className="flex gap-3 min-w-0">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-indigo-950">{c.title}</p>
          <p className="text-xs text-indigo-900/80 mt-1 leading-relaxed">{c.body}</p>
        </div>
      </div>
      {c.primary && onModuleChange && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0 border-indigo-200 bg-white"
          onClick={() => onModuleChange(c.primary!.module)}
        >
          {c.primary.label}
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      )}
    </div>
  );
}

export { VISITOR_WORKFLOW };
