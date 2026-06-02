import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RealtimeConnectionState } from '@/hooks/useRealtimeOps';

export function RealtimeStatusBar({
  state,
  operatorCount,
  className,
}: {
  state: RealtimeConnectionState;
  operatorCount?: number;
  className?: string;
}) {
  const connected = state === 'connected';
  const reconnecting = state === 'reconnecting' || state === 'connecting';

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest',
        connected && 'bg-emerald-50 text-emerald-800',
        reconnecting && 'bg-amber-50 text-amber-900',
        state === 'disconnected' && 'bg-rose-50 text-rose-800',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {reconnecting ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : connected ? (
        <Wifi className="w-3.5 h-3.5" />
      ) : (
        <WifiOff className="w-3.5 h-3.5" />
      )}
      {connected ? 'Live sync' : reconnecting ? 'Reconnecting…' : 'Offline — retry refresh'}
      {connected && operatorCount != null && operatorCount > 0 && (
        <span className="opacity-80">· {operatorCount} online</span>
      )}
    </div>
  );
}
