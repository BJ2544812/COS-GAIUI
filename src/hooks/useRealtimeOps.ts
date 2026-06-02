import * as React from 'react';
import { io, type Socket } from 'socket.io-client';
import { VITE_TENANT_DEFAULT } from '@/lib/apiConfig';
import { getToken } from '@/lib/authSession';
import { useAuth } from '@/context/AuthContext';

const API_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:3001';

export type RealtimeHandler = (event: string, payload: unknown) => void;

export type RealtimeConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export type PresenceOperator = { displayName: string; role?: string; context?: string; at: number };

export function useRealtimeOps(
  handlers: RealtimeHandler,
  scope?: { eventId?: string; serviceId?: string },
  options?: {
    displayName?: string;
    presenceContext?: string;
    onConnectionChange?: (state: RealtimeConnectionState) => void;
    onPresenceChange?: (operators: PresenceOperator[]) => void;
  },
) {
  const { user } = useAuth();
  const handlersRef = React.useRef(handlers);
  handlersRef.current = handlers;
  const optionsRef = React.useRef(options);
  optionsRef.current = options;
  const lastTsRef = React.useRef<Record<string, number>>({});
  const [connectionState, setConnectionState] = React.useState<RealtimeConnectionState>('connecting');

  React.useEffect(() => {
    const tenantId = VITE_TENANT_DEFAULT;
    const token = getToken();
    const socket: Socket = io(API_ORIGIN, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 12,
      auth: { token: token ?? '' },
      query: {
        tenantId,
        eventId: scope?.eventId ?? '',
        serviceId: scope?.serviceId ?? scope?.eventId ?? '',
        token: token ?? '',
      },
    });

    const setConn = (s: RealtimeConnectionState) => {
      setConnectionState(s);
      optionsRef.current?.onConnectionChange?.(s);
    };

    const onAny = (event: string, payload: unknown) => {
      const ts = (payload as { _ts?: number })?._ts;
      if (typeof ts === 'number') {
        const prev = lastTsRef.current[event] ?? 0;
        if (ts <= prev) return;
        lastTsRef.current[event] = ts;
      }
      if (event === 'presence:update') {
        const ops = (payload as { operators?: PresenceOperator[] })?.operators ?? [];
        optionsRef.current?.onPresenceChange?.(ops);
      }
      handlersRef.current(event, payload);
    };

    const events = [
      'notification:new',
      'event:status',
      'service:update',
      'workflow:update',
      'volunteer:update',
      'attendance:update',
      'ops:refresh',
      'presence:update',
      'ops:lock',
    ];
    for (const ev of events) socket.on(ev, (p) => onAny(ev, p));

    const joinAll = () => {
      socket.emit('join-rooms', {
        tenantId,
        eventId: scope?.eventId,
        serviceId: scope?.serviceId ?? scope?.eventId,
        role: user?.role,
      });
      const ctx = optionsRef.current?.presenceContext ?? scope?.serviceId ?? scope?.eventId ?? 'tenant';
      socket.emit('presence-join', {
        displayName: optionsRef.current?.displayName ?? user?.username ?? user?.email ?? 'Operator',
        role: user?.role,
        context: ctx,
      });
    };

    socket.on('connect', () => {
      setConn('connected');
      joinAll();
    });
    socket.on('disconnect', () => setConn('disconnected'));
    socket.io.on('reconnect_attempt', () => setConn('reconnecting'));
    socket.io.on('reconnect', () => {
      setConn('connected');
      joinAll();
    });

    return () => {
      for (const ev of events) {
        socket.off(ev);
      }
      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
      lastTsRef.current = {};
      setConn('disconnected');
    };
  }, [scope?.eventId, scope?.serviceId, user?.role, user?.username, user?.email]);

  return { connectionState };
}
