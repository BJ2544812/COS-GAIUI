/** Contextual event RBAC — evaluated in services; controllers pass actor context only. */

export const EVENT_ROLES = [
  'Event Admin',
  'Event Coordinator',
  'Volunteer Lead',
  'Finance Lead',
  'Media Lead',
  'Check-in Lead',
  'Campus Admin',
  'Pastoral Oversight',
] as const;

export type EventPermission =
  | 'view'
  | 'edit'
  | 'approve'
  | 'manage_volunteers'
  | 'manage_finance'
  | 'manage_communication'
  | 'manage_attendance'
  | 'publish_reports';

const ROLE_PERMISSIONS: Record<string, EventPermission[]> = {
  'Event Admin': [
    'view',
    'edit',
    'approve',
    'manage_volunteers',
    'manage_finance',
    'manage_communication',
    'manage_attendance',
    'publish_reports',
  ],
  'Event Coordinator': ['view', 'edit', 'manage_volunteers', 'manage_communication', 'manage_attendance'],
  'Volunteer Lead': ['view', 'manage_volunteers', 'manage_attendance'],
  'Finance Lead': ['view', 'manage_finance', 'publish_reports'],
  'Media Lead': ['view', 'edit', 'manage_communication'],
  'Check-in Lead': ['view', 'manage_attendance'],
  'Campus Admin': ['view', 'edit', 'approve', 'manage_attendance'],
  'Pastoral Oversight': ['view', 'approve', 'publish_reports'],
};

/** Map serving / responsibility role labels to contextual event roles. */
export function mapServingRoleToEventRole(role: string): string | null {
  const r = role.toLowerCase();
  if (r.includes('finance') || r.includes('treasurer')) return 'Finance Lead';
  if (r.includes('media') || r.includes('av') || r.includes('livestream')) return 'Media Lead';
  if (r.includes('usher') || r.includes('check-in') || r.includes('check in')) return 'Check-in Lead';
  if (r.includes('coordinator') || r.includes('team lead')) return 'Event Coordinator';
  if (r.includes('volunteer') || r.includes('hospitality') || r.includes('security')) return 'Volunteer Lead';
  if (r.includes('pastor') || r.includes('oversight')) return 'Pastoral Oversight';
  if (r.includes('campus')) return 'Campus Admin';
  return null;
}

/** Global ERP permission grants full event access. */
export function eventPermissionsForActor(input: {
  hasManageEvents: boolean;
  responsibilityRoles?: string[];
}): EventPermission[] {
  if (input.hasManageEvents) {
    return ROLE_PERMISSIONS['Event Admin'];
  }
  const set = new Set<EventPermission>();
  for (const role of input.responsibilityRoles ?? []) {
    const mapped = mapServingRoleToEventRole(role) ?? role;
    for (const p of ROLE_PERMISSIONS[mapped] ?? []) set.add(p);
  }
  if (set.size === 0 && (input.responsibilityRoles?.length ?? 0) > 0) {
    set.add('view');
  }
  return [...set];
}

export function actorCanEvent(
  permissions: EventPermission[],
  required: EventPermission,
): boolean {
  return permissions.includes(required);
}
