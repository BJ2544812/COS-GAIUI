import * as React from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MODULE_EXPLAINERS, getModuleExplainer } from '@/lib/moduleExplainers';
import type { ERPModule } from '@/types';
import { cn } from '@/lib/utils';

export function ModuleExplainerPanel({
  onOpenModule,
}: {
  onOpenModule?: (module: ERPModule) => void;
}) {
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState<ERPModule>('sunday-mode');

  const filtered = MODULE_EXPLAINERS.filter(
    (m) =>
      !query.trim() ||
      m.title.toLowerCase().includes(query.toLowerCase()) ||
      m.whatIsThis.toLowerCase().includes(query.toLowerCase()),
  );

  const detail = getModuleExplainer(selected) ?? filtered[0];

  React.useEffect(() => {
    if (filtered.length && !filtered.some((m) => m.moduleId === selected)) {
      setSelected(filtered[0].moduleId);
    }
  }, [query, filtered, selected]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-3">
        <Input
          placeholder="Search modules…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-xl"
        />
        <ul className="rounded-2xl border border-slate-200 divide-y divide-slate-100 max-h-[480px] overflow-y-auto bg-white">
          {filtered.map((m) => (
            <li key={m.moduleId}>
              <button
                type="button"
                onClick={() => setSelected(m.moduleId)}
                className={cn(
                  'w-full text-left px-4 py-3 text-sm font-semibold flex items-center justify-between',
                  selected === m.moduleId ? 'bg-indigo-50 text-indigo-800' : 'text-slate-700 hover:bg-slate-50',
                )}
              >
                {m.title}
                <ChevronRight className="w-4 h-4 opacity-40" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {detail && (
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
          <div className="flex items-center gap-2 text-indigo-600">
            <BookOpen className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wide">Module guide</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{detail.title}</h2>

          <div className="space-y-4 text-sm">
            <div>
              <p className="font-bold text-slate-800 mb-1">What is this?</p>
              <p className="text-slate-600 font-medium leading-relaxed">{detail.whatIsThis}</p>
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-1">Why would I use it?</p>
              <p className="text-slate-600 font-medium leading-relaxed">{detail.whyUseIt}</p>
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-1">When would I use it?</p>
              <p className="text-slate-600 font-medium leading-relaxed">{detail.whenUseIt}</p>
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-1">Who uses it?</p>
              <p className="text-slate-600 font-medium">{detail.whoUsesIt.join(' · ')}</p>
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-1">Examples</p>
              <ul className="list-disc list-inside text-slate-600 font-medium space-y-1">
                {detail.examples.map((ex) => (
                  <li key={ex}>{ex}</li>
                ))}
              </ul>
            </div>
          </div>

          {onOpenModule && (
            <button
              type="button"
              onClick={() => onOpenModule(detail.moduleId)}
              className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800"
            >
              Open {detail.title} in church office
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
