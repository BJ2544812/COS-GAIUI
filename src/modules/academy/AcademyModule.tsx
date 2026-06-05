import * as React from 'react';
import { GraduationCap, Compass, ClipboardCheck, Sparkles } from 'lucide-react';
import { ModuleHeader, PageLayout } from '@/components/modules/ModuleHeader';
import { ModuleTabs } from '@/components/modules/ModuleTabs';
import { TestChecklistPanel } from '@/components/guided-learning/TestChecklistPanel';
import { ModuleExplainerPanel } from '@/components/guided-learning/ModuleExplainerPanel';
import { QuickTestNextCard } from '@/components/guided-learning/QuickTestNextCard';
import { WalkthroughPanel } from '@/components/walkthrough/WalkthroughPanel';
import type { ModuleNavigate, ERPModule } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { walkthroughTrackForUser, learningProgressSummary } from '@/lib/guidedLearning';
import { WALKTHROUGH_TRACKS, type WalkthroughTrackId } from '@/lib/walkthroughs';

const UCOS_ACADEMY_TAB = 'ucos_academy_tab';

type AcademyView = 'home' | 'explore' | 'test' | 'modules';

function parseInitialView(tab?: string): AcademyView {
  if (tab === 'explore' || tab === 'test' || tab === 'modules' || tab === 'home') return tab;
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem(UCOS_ACADEMY_TAB);
    if (stored === 'explore' || stored === 'test' || stored === 'modules' || stored === 'home') return stored;
  }
  return 'home';
}

export function AcademyModule({
  onModuleChange,
  initialTab,
}: {
  onModuleChange?: ModuleNavigate;
  initialTab?: string;
}) {
  const { user } = useAuth();
  const [view, setView] = React.useState<AcademyView>(() => parseInitialView(initialTab));
  const [showExplore, setShowExplore] = React.useState(false);
  const [selectedTrackId, setSelectedTrackId] = React.useState<WalkthroughTrackId>(WALKTHROUGH_TRACKS[0].id);

  React.useEffect(() => {
    if (initialTab) {
      const v = parseInitialView(initialTab);
      setView(v);
      sessionStorage.setItem(UCOS_ACADEMY_TAB, v);
    }
  }, [initialTab]);

  const setTab = (v: AcademyView) => {
    setView(v);
    sessionStorage.setItem(UCOS_ACADEMY_TAB, v);
  };

  const progress = user ? learningProgressSummary(user) : { walkthroughPct: 0, checklistPct: 0 };
  const suggestedTrack = user ? walkthroughTrackForUser(user) : WALKTHROUGH_TRACKS[0];

  return (
    <PageLayout className="max-w-5xl">
      <ModuleHeader
        title="Academy"
        subtitle="Learn Ultimate Church OS without a manual — role tours, evaluation checklists, and module guides."
        icon={GraduationCap}
      />

      <QuickTestNextCard className="mb-4" />

      <ModuleTabs
        tabs={[
          { id: 'home', label: 'Start here' },
          { id: 'explore', label: 'Explore by role' },
          { id: 'test', label: 'TEST_MY_CHURCH_OS' },
          { id: 'modules', label: 'Module guide' },
        ]}
        activeId={view}
        onChange={(id) => setTab(id as AcademyView)}
        aria-label="Academy sections"
      />

      {view === 'home' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Evaluate in under 30 minutes</h2>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              Use Grace Community Church demo data. Pick your role, follow the tour, then complete the checklist. Progress
              saves on this device.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-white p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase">Your role tour</p>
                <p className="text-2xl font-black text-indigo-600">{progress.walkthroughPct}%</p>
                <p className="text-sm font-semibold text-slate-800">{suggestedTrack.title}</p>
              </div>
              <div className="rounded-xl bg-white p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase">TEST_MY_CHURCH_OS</p>
                <p className="text-2xl font-black text-emerald-600">{progress.checklistPct}%</p>
                <p className="text-sm font-semibold text-slate-800">Core modules checklist</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowExplore(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm min-h-[48px]"
              >
                <Compass className="w-4 h-4" />
                Explore Ultimate Church OS
              </button>
              <button
                type="button"
                onClick={() => setTab('test')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200 bg-white font-bold text-sm min-h-[48px]"
              >
                <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                Open test checklist
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5 space-y-2">
            <p className="font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> Demo logins
            </p>
            <p className="text-sm text-slate-600 font-medium">
              Try <code className="text-xs bg-slate-100 px-1 rounded">pastor</code> /{' '}
              <code className="text-xs bg-slate-100 px-1 rounded">finance</code> /{' '}
              <code className="text-xs bg-slate-100 px-1 rounded">churchadmin</code> with password{' '}
              <code className="text-xs bg-slate-100 px-1 rounded">demo123</code>. See{' '}
              <code className="text-xs">LOGIN_MATRIX.md</code> in the repo for the full list.
            </p>
          </div>
        </div>
      )}

      {view === 'explore' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 font-medium">
            Choose a role below or open the full-screen tour. Each stop: what to open, what to do, and why it matters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedTrackId(WALKTHROUGH_TRACKS[0].id);
              setShowExplore(true);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 min-h-[48px]"
          >
            <Compass className="w-5 h-5" />
            Open Explore Ultimate Church OS
          </button>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {WALKTHROUGH_TRACKS.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTrackId(t.id);
                    setShowExplore(true);
                  }}
                  className="w-full rounded-xl border border-slate-200 p-4 bg-white text-left hover:bg-slate-50 transition-colors"
                >
                  <p className="font-bold text-slate-900">{t.title}</p>
                  <p className="text-xs text-slate-500 mt-1">~{t.estimatedMinutes} min · {t.stops.length} stops</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {view === 'test' && <TestChecklistPanel />}

      {view === 'modules' && (
        <ModuleExplainerPanel onOpenModule={(m) => onModuleChange?.(m)} />
      )}

      {showExplore && (
        <WalkthroughPanel onClose={() => setShowExplore(false)} initialTrackId={selectedTrackId} />
      )}
    </PageLayout>
  );
}
