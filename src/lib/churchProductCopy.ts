import type { ERPModule } from '@/types';

/**
 * Church-facing labels — avoid engineering terms (Beta, tenant, command center, operational).
 * Internal status badges are disabled for end users; this map is the nav source of truth.
 */
export const NAV_LABELS: Record<ERPModule, string> = {
  dashboard: 'Home',
  profile: 'My Profile',
  members: 'Members',
  families: 'Families',
  volunteers: 'Volunteers',
  workforce: 'Staff Directory',
  hr: 'HR & Staff',
  'small-groups': 'Small Groups',
  pathways: 'Growth Pathways',
  discipleship: 'Pastoral Care',
  events: 'Events',
  attendance: 'Attendance',
  services: 'Services',
  'sunday-mode': 'Sunday Service',
  worship: 'Worship Planning',
  outreach: 'Visitors & Outreach',
  missions: 'Missions',
  structure: 'Church Structure',
  giving: 'Giving',
  finance: 'Finance',
  budgets: 'Budgets',
  funds: 'Funds',
  assets: 'Church Assets',
  documents: 'Church Documents',
  vendors: 'Vendors & Payroll',
  sermons: 'Sermons',
  content: 'Sermons',
  communication: 'Communications',
  notifications: 'Notifications',
  mobile: 'Mobile',
  website: 'Website',
  pages: 'Pages',
  forms: 'Forms',
  'media-library': 'Media',
  'landing-pages': 'Landing Pages',
  seo: 'SEO',
  analytics: 'Reports',
  academy: 'Training',
  engagement: 'Engagement',
  'workflow-monitor': 'Activity Log',
  'event-admin': 'Activity Log',
  'audit-logs': 'Change History',
  settings: 'Settings',
  permissions: 'Roles & Access',
  'feature-flags': 'Church Admin',
  'admin-center': 'Church Admin',
  'tenant-settings': 'Settings',
  integrations: 'Church Admin',
};

export function navLabel(module: ERPModule, fallback?: string): string {
  return NAV_LABELS[module] ?? fallback ?? module.replace(/-/g, ' ');
}

/** Sidebar section headers — internal keys stay stable for role sorting. */
export const NAV_GROUP_LABELS: Record<string, string> = {
  Identity: 'People & Care',
  Operations: 'Sunday & Events',
  Finance: 'Giving & Finance',
  Engagement: 'Messages & Media',
  Website: 'Website',
  'Insights & Audit': 'Home & Reports',
  Platform: 'Church Settings',
};

export function navGroupLabel(internal: string): string {
  return NAV_GROUP_LABELS[internal] ?? internal;
}

export const DASHBOARD_LENS_LABELS: Record<string, string> = {
  executive: 'Church overview',
  finance: 'Giving & finance',
  pastoral: 'People & care',
  operations: 'This week',
};

export function dashboardLensLabel(id: string): string {
  return DASHBOARD_LENS_LABELS[id] ?? id.replace(/-/g, ' ');
}

/** User-safe API error hint (no “restart API” in production UI). */
export function apiErrorHintForUsers(base: string): string {
  if (import.meta.env.DEV) {
    return `${base} If this continues, restart the church office app and refresh your browser.`;
  }
  return `${base} Please try again in a moment. If it continues, contact your church administrator.`;
}
