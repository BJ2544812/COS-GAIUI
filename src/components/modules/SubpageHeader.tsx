import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ds } from '@/lib/designSystem';
import { cn } from '@/lib/utils';

interface SubpageHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export function SubpageHeader({ title, subtitle, onBack, actions, className }: SubpageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4', className)}>
      <div className="flex items-start gap-3 min-w-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          className={cn('rounded-xl shrink-0', ds.focusRing)}
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="min-w-0">
          <h1 className={ds.pageTitle}>{title}</h1>
          {subtitle ? <p className={ds.pageSubtitle}>{subtitle}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}
