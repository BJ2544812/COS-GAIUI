import * as React from 'react';
import { io, type Socket } from 'socket.io-client';
import { VITE_TENANT_DEFAULT } from '@/lib/apiConfig';

const API_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:3001';

export function useOperationalSocket(onRefresh: () => void) {
  const socketRef = React.useRef<Socket | null>(null);

  React.useEffect(() => {
    const tenantId = VITE_TENANT_DEFAULT;
    const socket = io(API_ORIGIN, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      query: { tenantId },
    });
    socketRef.current = socket;
    socket.on('notification:new', () => onRefresh());
    socket.on('event:status', () => onRefresh());
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [onRefresh]);
}
