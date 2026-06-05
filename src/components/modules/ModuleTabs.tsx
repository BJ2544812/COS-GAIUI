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
    <div className={cn(ds.tabBar, className)} role="tablist" aria-label={ariaLabel ?? 'Module sections'}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeId === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(ds.tabItem(activeId === tab.id), ds.focusRing)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
