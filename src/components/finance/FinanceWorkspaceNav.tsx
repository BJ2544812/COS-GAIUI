import * as React from 'react';
import { cn } from '@/lib/utils';
import type { FinanceWorkspaceTab } from '@/lib/financeNavigation';
import {
  FINANCE_SECTIONS,
  sectionForFinanceTab,
  type FinanceSectionId,
} from '@/lib/financeWorkspaceSections';

export function FinanceWorkspaceNav({
  activeTab,
  onTabChange,
}: {
  activeTab: FinanceWorkspaceTab;
  onTabChange: (tab: FinanceWorkspaceTab) => void;
}) {
  const activeSection = sectionForFinanceTab(activeTab);
  const [expandedSection, setExpandedSection] = React.useState<FinanceSectionId>(activeSection);

  React.useEffect(() => {
    setExpandedSection(sectionForFinanceTab(activeTab));
  }, [activeTab]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {FINANCE_SECTIONS.map((section) => {
          const isActiveSection = activeSection === section.id;
          const SectionIcon = section.icon;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => {
                setExpandedSection(section.id);
                const first = section.tabs[0]?.id;
                if (first && !isActiveSection) onTabChange(first);
              }}
              className={cn(
                'rounded-2xl border p-4 text-left transition-all',
                isActiveSection
                  ? 'border-indigo-200 bg-indigo-50/80 shadow-sm ring-1 ring-indigo-100'
                  : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50',
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                    isActiveSection ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  <SectionIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900">{section.title}</p>
                  <p className="mt-0.5 text-xs font-medium leading-snug text-slate-500">{section.subtitle}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {FINANCE_SECTIONS.filter((s) => s.id === expandedSection).map((section) => (
        <div
          key={section.id}
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
          role="tablist"
          aria-label={`${section.title} sections`}
        >
          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{section.title}</p>
          <div className="flex flex-wrap gap-2">
            {section.tabs.map((tab) => {
              const TabIcon = tab.icon;
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  title={tab.description}
                  onClick={() => onTabChange(tab.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors',
                    selected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  <TabIcon className="h-4 w-4 shrink-0 opacity-80" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
