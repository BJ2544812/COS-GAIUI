import * as React from 'react';
import { CheckCircle2, Circle, Play, ClipboardCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  TEST_MY_CHURCH_OS,
  getTestChecklistProgress,
  setTestChecklistItemDone,
  resetTestChecklistProgress,
  testChecklistCompletionPercent,
  testItemHref,
  type TestCheckItem,
} from '@/lib/churchTestChecklist';
import { useNavigate } from 'react-router-dom';

export function TestChecklistPanel() {
  const navigate = useNavigate();
  const [, tick] = React.useReducer((x) => x + 1, 0);
  const progress = getTestChecklistProgress();
  const pct = testChecklistCompletionPercent();

  const openItem = (item: TestCheckItem) => {
    navigate(testItemHref(item));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-8 h-8 text-emerald-700" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">TEST_MY_CHURCH_OS</h2>
            <p className="text-sm text-slate-600 font-medium">
              Guided checklist for evaluating the demo church — mark items as you complete them.
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-emerald-700">{pct}%</p>
          <p className="text-xs font-semibold text-slate-500">complete</p>
        </div>
      </div>

      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-600 transition-all" style={{ width: `${pct}%` }} />
      </div>

      {TEST_MY_CHURCH_OS.map((section) => (
        <section key={section.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <h3 className="px-5 py-3 bg-slate-50 border-b border-slate-100 font-bold text-slate-900">{section.title}</h3>
          <ul className="divide-y divide-slate-100">
            {section.items.map((item) => {
              const done = Boolean(progress[item.id]);
              return (
                <li key={item.id} className="flex items-start gap-3 p-4">
                  <button
                    type="button"
                    onClick={() => {
                      setTestChecklistItemDone(item.id, !done);
                      tick();
                    }}
                    className="shrink-0 mt-0.5"
                    aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-semibold text-slate-900', done && 'line-through text-slate-500')}>
                      {item.label}
                    </p>
                    {item.hint && <p className="text-xs text-slate-500 mt-0.5">{item.hint}</p>}
                  </div>
                  {item.module && (
                    <Button type="button" size="sm" variant="outline" className="shrink-0 font-semibold" onClick={() => openItem(item)}>
                      <Play className="w-3 h-3 mr-1" /> Go
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <Button
        type="button"
        variant="ghost"
        className="text-xs font-bold uppercase tracking-widest"
        onClick={() => {
          resetTestChecklistProgress();
          tick();
        }}
      >
        Reset checklist progress
      </Button>
    </div>
  );
}
