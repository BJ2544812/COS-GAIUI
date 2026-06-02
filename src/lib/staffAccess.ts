/** Distinguish congregant accounts from church staff desks. */
const STAFF_PERMISSION_KEYS = [
  'manage_analytics',
  'manage_finance',
  'manage_giving',
  'manage_members',
  'manage_events',
  'manage_attendance',
  'manage_hr',
  'manage_settings',
  'manage_communication',
  'manage_assets',
  'manage_outreach',
  'manage_discipleship',
  'manage_documents',
  'manage_website',
  'approve_voucher',
  'post_voucher',
] as const;

export function isStaffUser(input: { role: string; permissions: string[] }): boolean {
  const role = (input.role || '').toUpperCase().replace(/\s/g, '_');
  if (role.includes('SUPER') || role === 'SUPER_ADMIN') return true;
  const p = new Set(input.permissions);
  return STAFF_PERMISSION_KEYS.some((k) => p.has(k));
}
