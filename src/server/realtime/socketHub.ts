import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { RT, type RealtimeScope } from '../utils/realtimeEvents.js';
import { verifySocketToken, type SocketUser } from '../utils/socketAuth.js';
import { logStructured } from '../utils/structuredLog.js';

let io: Server | null = null;

type PresenceEntry = { socketId: string; displayName: string; role?: string; context?: string; at: number };
const presenceByRoom = new Map<string, Map<string, PresenceEntry>>();

function presenceRoomKey(tenantId: string, context: string) {
  return `presence|${tenantId}|${context}`;
}

function parsePresenceRoomKey(roomKey: string): { tenantId: string; context: string } | null {
  const parts = roomKey.split('|');
  if (parts.length !== 3 || parts[0] !== 'presence') return null;
  return { tenantId: parts[1], context: parts[2] };
}

function emitPresence(roomKey: string, tenantId: string, context: string) {
  const map = presenceByRoom.get(roomKey);
  const operators = map ? [...map.values()].map(({ displayName, role, context: ctx, at }) => ({ displayName, role, context: ctx, at })) : [];
  broadcastScoped({ tenantId }, RT.PRESENCE_UPDATE, { context, operators, count: operators.length });
}

function roomTenant(tenantId: string) {
  return `tenant:${tenantId}`;
}
function roomEvent(tenantId: string, eventId: string) {
  return `tenant:${tenantId}:event:${eventId}`;
}
function roomService(tenantId: string, serviceId: string) {
  return `tenant:${tenantId}:service:${serviceId}`;
}
function roomRole(tenantId: string, role: string) {
  return `tenant:${tenantId}:role:${role.toLowerCase().replace(/\s+/g, '_')}`;
}

export function initSocketHub(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/socket.io',
  });

  io.use(async (socket, next) => {
    const auth = socket.handshake.auth as { token?: string } | undefined;
    const qToken = socket.handshake.query.token;
    const token =
      auth?.token ?? (typeof qToken === 'string' ? qToken : undefined);
    const user = await verifySocketToken(token);
    if (!user) {
      logStructured('warn', 'realtime_auth_rejected', {
        error: 'Socket authentication required',
      });
      next(new Error('Socket authentication required'));
      return;
    }
    (socket.data as { user: SocketUser }).user = user;
    next();
  });

  io.on('connection', (socket) => {
    const user = (socket.data as { user: SocketUser }).user;
    const tenantId = user.tenantId;
    const q = socket.handshake.query;
    const eventId = typeof q.eventId === 'string' ? q.eventId : null;
    const serviceId = typeof q.serviceId === 'string' ? q.serviceId : null;
    const role = user.role;

    socket.join(roomTenant(tenantId));
    if (tenantId && eventId) socket.join(roomEvent(tenantId, eventId));
    if (tenantId && serviceId) socket.join(roomService(tenantId, serviceId));
    if (tenantId && role) socket.join(roomRole(tenantId, role));

    socket.on('join-rooms', (payload: unknown) => {
      if (!payload || typeof payload !== 'object') return;
      const p = payload as Record<string, string>;
      if (p.tenantId && p.tenantId !== tenantId) return;
      socket.join(roomTenant(tenantId));
      if (p.eventId) socket.join(roomEvent(tenantId, p.eventId));
      if (p.serviceId) socket.join(roomService(tenantId, p.serviceId));
      socket.join(roomRole(tenantId, role));
    });

    socket.on('leave-rooms', (payload: unknown) => {
      if (!payload || typeof payload !== 'object') return;
      const p = payload as Record<string, string>;
      if (p.tenantId) socket.leave(roomTenant(p.tenantId));
      if (p.tenantId && p.eventId) socket.leave(roomEvent(p.tenantId, p.eventId));
      if (p.tenantId && p.serviceId) socket.leave(roomService(p.tenantId, p.serviceId));
      if (p.tenantId && p.role) socket.leave(roomRole(p.tenantId, p.role));
    });

    socket.on('presence-join', (payload: unknown) => {
      if (!tenantId || !payload || typeof payload !== 'object') return;
      const p = payload as { displayName?: string; role?: string; context?: string };
      const context = p.context || serviceId || eventId || 'tenant';
      const roomKey = presenceRoomKey(tenantId, context);
      const map = presenceByRoom.get(roomKey) ?? new Map<string, PresenceEntry>();
      map.set(socket.id, {
        socketId: socket.id,
        displayName: p.displayName || 'Operator',
        role: p.role || role || undefined,
        context,
        at: Date.now(),
      });
      presenceByRoom.set(roomKey, map);
      emitPresence(roomKey, tenantId, context);
    });

    socket.on('disconnect', (reason) => {
      logStructured('info', 'realtime_disconnect', {
        tenantId,
        detail: reason,
      });
      for (const [roomKey, map] of presenceByRoom.entries()) {
        if (map.delete(socket.id)) {
          const parsed = parsePresenceRoomKey(roomKey);
          if (parsed) emitPresence(roomKey, parsed.tenantId, parsed.context);
          if (map.size === 0) presenceByRoom.delete(roomKey);
        }
      }
    });
  });

  return io;
}

/** Broadcast to tenant + optional scoped rooms (never cross-tenant). */
export function broadcastScoped(
  scope: RealtimeScope,
  event: string,
  payload: unknown,
  options?: { includeTenant?: boolean },
) {
  if (!io) return;
  const rooms: string[] = [];
  if (options?.includeTenant !== false) rooms.push(roomTenant(scope.tenantId));
  if (scope.eventId) rooms.push(roomEvent(scope.tenantId, scope.eventId));
  if (scope.serviceId) rooms.push(roomService(scope.tenantId, scope.serviceId));
  if (scope.role) rooms.push(roomRole(scope.tenantId, scope.role));

  const envelope = { ...((payload as object) ?? {}), _ts: Date.now(), _event: event };
  for (const room of rooms) {
    io.to(room).emit(event, envelope);
  }
}

export function broadcastToTenant(tenantId: string, event: string, payload: unknown) {
  broadcastScoped({ tenantId }, event, payload);
}

export function getSocketHub() {
  return io;
}

export { RT };
