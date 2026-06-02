import { cn } from '@/lib/utils';
import type { ReadinessLevel } from '@/lib/operationsTypes';
import { OpsStatusBadge } from '@/components/operations/OpsStatusBadge';

export function ReadinessBadge({
  level,
  score,
  className,
}: {
  level: ReadinessLevel;
  score?: number;
  className?: string;
}) {
  return (
    <OpsStatusBadge
      status={level}
      suffix={typeof score === 'number' ? `${score}%` : undefined}
      className={cn(className)}
    />
  );
}
