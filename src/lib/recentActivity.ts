import type { ERPModule } from '@/types';

const KEY = 'ucos_recent_modules';
const MAX = 8;

export type RecentEntry = { module: ERPModule; label: string; at: number };

export function recordRecentModule(module: ERPModule, label: string) {
  try {
    const raw = sessionStorage.getItem(KEY);
    const list: RecentEntry[] = raw ? (JSON.parse(raw) as RecentEntry[]) : [];
    const filtered = list.filter((e) => e.module !== module);
    filtered.unshift({ module, label, at: Date.now() });
    sessionStorage.setItem(KEY, JSON.stringify(filtered.slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

export function getRecentModules(): RecentEntry[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RecentEntry[]) : [];
  } catch {
    return [];
  }
}
