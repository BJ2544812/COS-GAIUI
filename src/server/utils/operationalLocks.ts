/** Short-lived in-memory locks to reduce double-assignment during live ops (per process). */

const locks = new Map<string, { owner: string; until: number }>();

export function tryAcquireOperationalLock(key: string, owner: string, ttlMs = 12_000): boolean {
  const now = Date.now();
  const existing = locks.get(key);
  if (existing && existing.until > now && existing.owner !== owner) {
    return false;
  }
  locks.set(key, { owner, until: now + ttlMs });
  return true;
}

export function releaseOperationalLock(key: string, owner: string) {
  const existing = locks.get(key);
  if (existing?.owner === owner) locks.delete(key);
}

export function operationalLockKey(tenantId: string, resource: string, id: string) {
  return `${tenantId}:${resource}:${id}`;
}
