import * as React from 'react';

/** Shown when a module has no matching backend API yet (demo UI only). */
export function FeatureNotAvailableBar({ context }: { context?: string }) {
  return (
    <div
      className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-950"
      role="status"
    >
      <span className="font-semibold">Feature not yet available: </span>
      {context ?? 'This screen is demo UI only. There is no API wired for it yet.'}
    </div>
  );
}
