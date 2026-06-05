import * as React from 'react';
import { X, CheckCircle2, Circle, Play, Clock, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  WALKTHROUGH_TRACKS,
  getWalkthroughProgress,
  setWalkthroughStepDone,
  resetWalkthroughProgress,
  stopTargetHref,
  trackCompletionPercent,
  type WalkthroughTrack,
  type WalkthroughTrackId,
  type WalkthroughStop,
} from '@/lib/walkthroughs';
import { useNavigate } from 'react-router-dom';
import { navLabel } from '@/lib/churchProductCopy';

export function WalkthroughPanel({ onClose, initialTrackId }: { onClose: () => void; initialTrackId?: WalkthroughTrackId }) {
  const navigate = useNavigate();
  const [trackId, setTrackId] = React.useState<WalkthroughTrackId>(() => initialTrackId ?? WALKTHROUGH_TRACKS[0].id);
  const [, tick] = React.useReducer((x) => x + 1, 0);

  const track = WALKTHROUGH_TRACKS.find((t) => t.id === trackId) ?? WALKTHROUGH_TRACKS[0];
  const progress = getWalkthroughProgress();
  const pct = trackCompletionPercent(track);

  const goToStop = (stop: WalkthroughStop) => {
    const href = stopTargetHref(stop);
    if (href.startsWith('/admin')) {
      navigate(href);
      onClose();
    } else {
      window.location.href = href;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-900/50"
      role="dialog"
      aria-label="Explore Ultimate Church OS"
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Explore Ultimate Church OS</h2>
              <p className="text-xs text-slate-600 font-medium">Choose a role · learn by doing · ~5–10 min each</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-50">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Choose role</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {WALKTHROUGH_TRACKS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTrackId(t.id)}
                className={cn(
                  'shrink-0 px-3 py-2 rounded-xl text-xs font-bold',
                  trackId === t.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                )}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 space-y-2">
          <p className="text-sm font-semibold text-slate-900">
            <span className="text-indigo-600">Step 1 — What this role does:</span> {track.whatThisRoleDoes}
          </p>
          <p className="text-xs text-slate-600 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Estimated time: {track.estimatedMinutes} minutes
          </p>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{pct}% of role tour complete</p>
        </div>

        <ul className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {track.stops.map((stop, index) => {
            const done = Boolean(progress[stop.id]);
            return (
              <li
                key={stop.id}
                className={cn(
                  'rounded-2xl border p-4 space-y-3',
                  done ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white',
                )}
              >
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setWalkthroughStepDone(stop.id, !done);
                      tick();
                    }}
                    className="shrink-0 mt-1"
                    aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                  >
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Stop {index + 1}</p>
                    <p className="font-bold text-slate-900">{stop.title}</p>
                  </div>
                </div>
                <div className="ml-8 space-y-2 text-sm">
                  <p>
                    <span className="font-semibold text-slate-700">Step 2 — Open:</span>{' '}
                    <span className="text-slate-600">
                      {stop.module ? navLabel(stop.module) : stop.portalPath ? 'Member portal' : 'Module'}
                    </span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Step 3 — Task:</span>{' '}
                    <span className="text-slate-600">{stop.taskInstruction}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-slate-700">Step 4 — Why it matters:</span>{' '}
                    <span className="text-slate-600">{stop.whyItMatters}</span>
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="ml-8 rounded-xl font-bold bg-indigo-600"
                  onClick={() => goToStop(stop)}
                >
                  <Play className="w-3 h-3 mr-1" /> Open this step
                </Button>
              </li>
            );
          })}
        </ul>

        <div className="px-6 py-4 border-t border-slate-100 flex flex-wrap justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            className="text-xs font-bold uppercase tracking-widest"
            onClick={() => {
              resetWalkthroughProgress();
              tick();
            }}
          >
            Reset tour progress
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/admin?module=academy&tab=test')}>
              Full test checklist
            </Button>
            <Button type="button" onClick={onClose} className="rounded-xl bg-indigo-600">
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
