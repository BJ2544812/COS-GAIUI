import { cn } from '@/lib/utils';
import { ds } from '@/lib/designSystem';

export interface ModuleTabItem {
  id: string;
  label: string;
}

interface ModuleTabsProps {
  tabs: ModuleTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  'aria-label'?: string;
}

export function ModuleTabs({ tabs, activeId, onChange, className, 'aria-label': ariaLabel }: ModuleTabsProps) {
  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(ds.tabBar, 'flex-nowrap snap-x snap-mandatory scroll-smooth scrollbar-thin')}
        role="tablist"
        aria-label={ariaLabel ?? 'Module sections'}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeId === tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(ds.tabItem(activeId === tab.id), ds.focusRing, 'shrink-0 snap-start')}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-[10px] font-medium text-slate-400 md:hidden">Swipe for more sections →</p>
    </div>
  );
}
