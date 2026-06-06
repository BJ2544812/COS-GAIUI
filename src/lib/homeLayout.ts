/**
 * Role-specific Home layout — answers "What needs my attention today?"
 */
import type { RoleArchetype } from '@/lib/roleExperience';

export type HomeLayoutMode = 'pastoral' | 'operations' | 'personal' | 'finance';

export function homeLayoutForArchetype(archetype: RoleArchetype): HomeLayoutMode {
  switch (archetype) {
    case 'senior_pastor':
    case 'small_group_leader':
      return 'pastoral';
    case 'staff_desk':
      return 'personal';
    case 'finance':
    case 'accountant':
      return 'finance';
    default:
      return 'operations';
  }
}

/** Show evaluator / onboarding widgets only in Academy, not production Home. */
export function showHomeOnboardingWidgets(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_SHOW_HOME_ONBOARDING === 'true';
}
