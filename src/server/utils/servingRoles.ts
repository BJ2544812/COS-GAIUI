/** Shared serving / leadership role helpers (server). */

export const ENTITY_TYPES = ['Ministry', 'SmallGroup', 'Campus', 'Department', 'Event', 'Group'] as const;

export const LEADERSHIP_GROWTH_STAGES = ['Leader', 'Staff', 'CoreTeam', 'Volunteer'] as const;

export function isUuid(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

export function servingTierForRole(role: string): string {
  const r = role.toLowerCase();
  if (r.includes('campus pastor')) return 'Campus Pastor';
  if (r.includes('senior pastor') || (r.includes('pastor') && !r.includes('youth'))) return 'Pastor';
  if (r.includes('coordinator')) return 'Coordinator';
  if (r.includes('ministry leader') || r.includes('department head')) return 'Ministry Leader';
  if (r.includes('team lead') || r.includes(' small group leader') || r === 'leader') return 'Team Lead';
  if (r.includes('assistant') || r.includes('associate')) return 'Assistant';
  return 'Volunteer';
}

export function isLeadershipRole(role: string): boolean {
  const tier = servingTierForRole(role);
  return tier !== 'Volunteer';
}

export const TIER_ORDER = ['Campus Pastor', 'Pastor', 'Coordinator', 'Ministry Leader', 'Team Lead', 'Assistant', 'Volunteer'];

export function tierSortIndex(tier: string): number {
  const i = TIER_ORDER.indexOf(tier);
  return i >= 0 ? i : TIER_ORDER.length;
}
