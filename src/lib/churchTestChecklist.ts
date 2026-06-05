import type { ERPModule } from '@/types';
import { buildAdminPath } from '@/lib/adminNavigation';

/** TEST_MY_CHURCH_OS — guided evaluation checklist with local progress. */
export const TEST_CHECKLIST_STORAGE_KEY = 'church_test_my_church_os_v1';

export type TestCheckItem = {
  id: string;
  label: string;
  hint?: string;
  module?: ERPModule;
  tab?: string;
};

export type TestCheckSection = {
  id: string;
  title: string;
  items: TestCheckItem[];
};

export const TEST_MY_CHURCH_OS: TestCheckSection[] = [
  {
    id: 'members',
    title: 'Members',
    items: [
      { id: 'mem-view', label: 'View members list', module: 'members' },
      { id: 'mem-profile', label: 'Open a member profile', hint: 'Click any row in the directory', module: 'members' },
      { id: 'mem-edit', label: 'Edit member details', hint: 'Use profile edit controls', module: 'members' },
      { id: 'mem-family', label: 'View a linked family', module: 'families' },
      { id: 'mem-note', label: 'Add or view a pastoral note', module: 'discipleship' },
    ],
  },
  {
    id: 'events',
    title: 'Events',
    items: [
      { id: 'ev-create', label: 'Create or open an event', module: 'events' },
      { id: 'ev-volunteers', label: 'Add or review volunteers on an event', module: 'volunteers' },
      { id: 'ev-publish', label: 'Move event toward approved / live status', hint: 'Event workspace setup', module: 'events' },
      { id: 'ev-sunday', label: 'Open Sunday Service for a worship event', module: 'sunday-mode' },
    ],
  },
  {
    id: 'attendance',
    title: 'Attendance',
    items: [
      { id: 'att-session', label: 'Open an attendance session', module: 'attendance' },
      { id: 'att-checkin', label: 'Record a check-in', module: 'attendance' },
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    items: [
      { id: 'fin-gift', label: 'Record a gift', module: 'giving' },
      { id: 'fin-voucher', label: 'Create a voucher', module: 'finance', tab: 'vouchers' },
      { id: 'fin-approve', label: 'Approve a voucher', hint: 'Approvals tab if your role allows', module: 'finance', tab: 'approvals' },
      { id: 'fin-budget', label: 'Review a budget or fund', module: 'budgets' },
    ],
  },
  {
    id: 'communications',
    title: 'Communications',
    items: [
      { id: 'com-campaign', label: 'Review campaigns or compose a message', module: 'communication' },
      { id: 'com-prayer', label: 'View prayer requests', module: 'communication' },
    ],
  },
  {
    id: 'hr',
    title: 'HR & Staff',
    items: [
      { id: 'hr-profile', label: 'Open staff directory', module: 'hr', tab: 'directory' },
      { id: 'hr-leave', label: 'Review leave requests', module: 'hr' },
    ],
  },
  {
    id: 'website',
    title: 'Website',
    items: [
      { id: 'web-pages', label: 'Open website builder', module: 'website' },
      { id: 'web-preview', label: 'Preview public home page', hint: 'Open / in a new tab' },
    ],
  },
];

export function getTestChecklistProgress(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(TEST_CHECKLIST_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function setTestChecklistItemDone(itemId: string, done: boolean) {
  const progress = getTestChecklistProgress();
  if (done) progress[itemId] = true;
  else delete progress[itemId];
  localStorage.setItem(TEST_CHECKLIST_STORAGE_KEY, JSON.stringify(progress));
}

export function resetTestChecklistProgress() {
  localStorage.removeItem(TEST_CHECKLIST_STORAGE_KEY);
}

export function testChecklistCompletionPercent(): number {
  const progress = getTestChecklistProgress();
  const total = TEST_MY_CHURCH_OS.reduce((n, s) => n + s.items.length, 0);
  const done = TEST_MY_CHURCH_OS.reduce(
    (n, s) => n + s.items.filter((i) => progress[i.id]).length,
    0,
  );
  return total ? Math.round((done / total) * 100) : 0;
}

export function testItemHref(item: TestCheckItem): string {
  if (item.module) return buildAdminPath({ module: item.module, tab: item.tab });
  return '/admin';
}

/** Role-prioritized section order for "test next" suggestions. */
export const TEST_PRIORITY_BY_ARCHETYPE: Record<string, string[]> = {
  senior_pastor: ['members', 'attendance', 'events', 'finance', 'communications'],
  church_admin: ['events', 'attendance', 'members', 'communications', 'website'],
  finance: ['finance', 'members'],
  accountant: ['finance'],
  hr: ['hr', 'members', 'finance'],
  ministry_leader: ['events', 'attendance', 'members'],
  youth_pastor: ['events', 'attendance', 'members'],
  volunteer_coordinator: ['events', 'attendance', 'members'],
  small_group_leader: ['members', 'attendance'],
  communications: ['communications', 'website', 'members'],
  general: ['members', 'events', 'finance', 'attendance'],
};

export function getNextTestChecklistItem(archetype: string): TestCheckItem | null {
  const progress = getTestChecklistProgress();
  const order = TEST_PRIORITY_BY_ARCHETYPE[archetype] ?? TEST_PRIORITY_BY_ARCHETYPE.general;
  const sectionIds = [...order, ...TEST_MY_CHURCH_OS.map((s) => s.id).filter((id) => !order.includes(id))];

  for (const sectionId of sectionIds) {
    const section = TEST_MY_CHURCH_OS.find((s) => s.id === sectionId);
    if (!section) continue;
    for (const item of section.items) {
      if (!progress[item.id]) return item;
    }
  }
  return null;
}
