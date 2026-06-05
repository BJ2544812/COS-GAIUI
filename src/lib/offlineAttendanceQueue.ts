/** Buffered attendance check-ins when connectivity is lost (per device, tenant-scoped key). */

const STORAGE_KEY = 'ucos_offline_attendance_queue';

export type OfflineCheckIn = {
  id: string;
  sessionId: string;
  memberId: string | null;
  visitor?: { visitorName?: string; visitorPhone?: string };
  method: string;
  queuedAt: string;
};

function readQueue(): OfflineCheckIn[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OfflineCheckIn[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: OfflineCheckIn[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function enqueueOfflineCheckIn(
  item: Omit<OfflineCheckIn, 'id' | 'queuedAt'>,
): OfflineCheckIn[] {
  const entry: OfflineCheckIn = {
    ...item,
    id: `off-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    queuedAt: new Date().toISOString(),
  };
  const next = [...readQueue(), entry];
  writeQueue(next);
  return next;
}

export function getOfflineQueue(): OfflineCheckIn[] {
  return readQueue();
}

export function clearOfflineQueue() {
  writeQueue([]);
}

export function removeOfflineIds(ids: Set<string>) {
  writeQueue(readQueue().filter((i) => !ids.has(i.id)));
}
