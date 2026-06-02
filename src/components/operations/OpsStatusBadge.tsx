import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { normalizeOpsStatus, OPS_STATUS_LABELS, OPS_STATUS_STYLES, type OpsStatusKind } from '@/lib/operationalStatus';

export function OpsStatusBadge({
  status,
  suffix,
  className,
}: {
  status: string | OpsStatusKind;
  suffix?: string;
  className?: string;
}) {
  const kind = typeof status === 'string' && status in OPS_STATUS_STYLES
    ? (status as OpsStatusKind)
    : normalizeOpsStatus(typeof status === 'string' ? status : status);
  return (
    <Badge
      variant="outline"
      className={cn('text-[9px] font-black uppercase tracking-widest', OPS_STATUS_STYLES[kind], className)}
    >
      {OPS_STATUS_LABELS[kind]}
      {suffix ? ` · ${suffix}` : ''}
    </Badge>
  );
}
