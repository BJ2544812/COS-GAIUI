import { resolveRoleArchetype, type RoleArchetype, type RoleUser } from '@/lib/roleExperience';
import {
  getNextTestChecklistItem,
  testItemHref,
  testChecklistCompletionPercent,
  type TestCheckItem,
} from '@/lib/churchTestChecklist';
import {
  WALKTHROUGH_TRACKS,
  getNextWalkthroughStop,
  stopTargetHref,
  trackCompletionPercent,
  type WalkthroughTrack,
  type WalkthroughTrackId,
} from '@/lib/walkthroughs';

export type QuickTestSuggestion = {
  kind: 'walkthrough' | 'checklist' | 'complete';
  title: string;
  description: string;
  href: string;
  moduleLabel?: string;
};

const TRACK_BY_ARCHETYPE: Partial<Record<RoleArchetype, WalkthroughTrackId>> = {
  senior_pastor: 'senior_pastor',
  church_admin: 'church_admin',
  finance: 'finance',
  accountant: 'finance',
  hr: 'hr',
  volunteer_coordinator: 'volunteer_coordinator',
  small_group_leader: 'small_group_leader',
  ministry_leader: 'volunteer_coordinator',
  youth_pastor: 'church_admin',
  communications: 'church_admin',
  staff_desk: 'church_admin',
  member_portal: 'member',
  general: 'church_admin',
  super_admin: 'church_admin',
};

export function walkthroughTrackForUser(user: { role?: string; permissions?: string[] }): WalkthroughTrack {
  const roleUser: RoleUser = {
    role: user.role ?? 'general',
    permissions: user.permissions ?? [],
  };
  const archetype = resolveRoleArchetype(roleUser);
  const trackId = TRACK_BY_ARCHETYPE[archetype] ?? 'church_admin';
  return WALKTHROUGH_TRACKS.find((t) => t.id === trackId) ?? WALKTHROUGH_TRACKS[1];
}

export function getQuickTestSuggestion(user: {
  role?: string;
  permissions?: string[];
}): QuickTestSuggestion {
  const roleUser: RoleUser = {
    role: user.role ?? 'general',
    permissions: user.permissions ?? [],
  };
  const archetype = resolveRoleArchetype(roleUser);
  const track = walkthroughTrackForUser(user);
  const nextStop = getNextWalkthroughStop(track);

  if (nextStop) {
    return {
      kind: 'walkthrough',
      title: nextStop.title,
      description: nextStop.taskInstruction,
      href: stopTargetHref(nextStop),
      moduleLabel: track.title,
    };
  }

  const checklistItem: TestCheckItem | null = getNextTestChecklistItem(archetype);
  if (checklistItem) {
    return {
      kind: 'checklist',
      title: checklistItem.label,
      description: checklistItem.hint ?? 'Mark complete in Academy when finished.',
      href: testItemHref(checklistItem),
      moduleLabel: 'TEST_MY_CHURCH_OS',
    };
  }

  const pct = testChecklistCompletionPercent();
  return {
    kind: 'complete',
    title: 'Guided evaluation complete',
    description:
      pct >= 80
        ? 'You have finished the role tour and core checklist. Explore any module from the menu.'
        : 'Role tour complete. Finish remaining checklist items in Academy anytime.',
    href: '/admin?module=academy&tab=test',
  };
}

export function learningProgressSummary(user: { role?: string; permissions?: string[] }): {
  walkthroughPct: number;
  checklistPct: number;
} {
  const track = walkthroughTrackForUser(user);
  return {
    walkthroughPct: trackCompletionPercent(track),
    checklistPct: testChecklistCompletionPercent(),
  };
}
