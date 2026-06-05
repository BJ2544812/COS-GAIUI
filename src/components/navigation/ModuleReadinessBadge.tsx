import { cn } from '@/lib/utils';
import { getModuleReadiness, type ModuleReadinessLabel } from '@/lib/moduleRegistry';
import type { ERPModule } from '@/types';

const STYLES: Record<ModuleReadinessLabel, string> = {
  'Production Ready': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'In Progress': 'bg-amber-50 text-amber-900 border-amber-200',
  'Coming Soon': 'bg-slate-100 text-slate-600 border-slate-200',
};

export function ModuleReadinessBadge({
  module,
  className,
  compact = true,
}: {
  module: ERPModule;
  className?: string;
  compact?: boolean;
}) {
  const label = getModuleReadiness(module);
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-md border font-bold uppercase tracking-wider',
        compact ? 'px-1.5 py-0.5 text-[8px]' : 'px-2 py-0.5 text-[9px]',
        STYLES[label],
        className,
      )}
      title={label}
    >
      {compact
        ? label === 'Production Ready'
          ? 'Ready'
          : label === 'In Progress'
            ? 'Beta'
            : 'Soon'
        : label}
    </span>
  );
}
