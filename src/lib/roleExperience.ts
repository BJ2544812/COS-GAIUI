/**
 * Role-centric UX — maps staff roles + permissions to landing, dashboard, and navigation.
 * Permissions gate access; this layer shapes what each role sees first.
 */
import type { ERPModule } from '@/types';
import { buildAdminPath } from '@/lib/adminNavigation';
import { isStaffUser } from '@/lib/staffAccess';

export type RoleArchetype =
  | 'super_admin'
  | 'church_admin'
  | 'senior_pastor'
  | 'finance'
  | 'accountant'
  | 'hr'
  | 'ministry_leader'
  | 'counter_team'
  | 'youth_pastor'
  | 'volunteer_coordinator'
  | 'communications'
  | 'small_group_leader'
  | 'staff_desk'
  | 'member_portal'
  | 'general';

export type DashboardView = 'personal' | 'executive' | 'operations';
export type DashboardLens = 'executive' | 'finance' | 'pastoral' | 'operations';

export interface RoleExperience {
  archetype: RoleArchetype;
  title: string;
  subtitle: string;
  landingModule: ERPModule;
  landingTab?: string;
  dashboardView: DashboardView;
  dashboardLens: DashboardLens;
  visibleLenses: DashboardLens[];
  modulePriority: ERPModule[];
  navGroupOrder: string[];
  quickOps: ERPModule[];
  showQuickOps: boolean;
  dashboardShortcuts: ERPModule[];
  /** When set, only these modules appear in the sidebar (permissions still enforced). */
  sidebarAllowList?: ERPModule[];
  /** Hide Personal / Executive view toggles — show operations-focused home. */
  focusedHome?: boolean;
  preferPortal: boolean;
}

export type RoleUser = { role: string; permissions: string[] };

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

function normalizeRole(role: string): string {
  return (role || '').toUpperCase().replace(/\s/g, '_');
}

function hasStaffAccess(permissions: string[]): boolean {
  const p = new Set(permissions);
  return STAFF_PERMISSION_KEYS.some((k) => p.has(k));
}

export function resolveRoleArchetype(input: RoleUser): RoleArchetype {
  const role = normalizeRole(input.role);
  const p = new Set(input.permissions);

  if (role.includes('SUPER') || role === 'SUPER_ADMIN' || role === 'SUPERADMINISTRATOR') {
    return 'super_admin';
  }

  if ((role === 'MEMBER' || role.includes('GUEST')) && !hasStaffAccess(input.permissions)) {
    return 'member_portal';
  }

  if (role.includes('SMALL_GROUP') || role.includes('GROUP_LEADER')) {
    return 'small_group_leader';
  }

  if (role === 'ASSOCIATE_PASTOR' || role.includes('ASSOCIATE') && role.includes('PASTOR')) {
    return 'senior_pastor';
  }

  if (role === 'STAFF' || role === 'STAFF_DESK') {
    return 'staff_desk';
  }

  if (role === 'ACCOUNTANT') {
    return 'accountant';
  }

  if (role.includes('YOUTH') && role.includes('PASTOR')) {
    return 'youth_pastor';
  }

  if (
    role.includes('CAMPUS') ||
    role.includes('CHURCH_ADMIN') ||
    role.includes('ADMINISTRATOR') ||
    (p.has('manage_settings') && p.has('manage_events') && p.has('manage_members'))
  ) {
    return 'church_admin';
  }

  if (
    role.includes('SENIOR_PASTOR') ||
    role === 'PASTOR' ||
    role.includes('LEAD_PASTOR') ||
    (p.has('manage_analytics') && p.has('manage_members') && p.has('manage_discipleship') && !p.has('manage_finance'))
  ) {
    return 'senior_pastor';
  }

  if (role.includes('HR') || (p.has('manage_hr') && p.has('manage_members') && !p.has('manage_giving'))) {
    return 'hr';
  }

  if (
    p.has('manage_finance') &&
    p.has('manage_giving') &&
    !p.has('manage_events') &&
    !p.has('manage_discipleship')
  ) {
    return 'finance';
  }

  if (role.includes('FINANCE') || role.includes('ACCOUNTANT') || role.includes('TREASURER')) {
    return 'finance';
  }

  if (role.includes('VOLUNTEER') && role.includes('COORDINATOR')) {
    return 'volunteer_coordinator';
  }

  if (role.includes('SECRETARY') || role.includes('COMMUNICATION')) {
    return 'communications';
  }

  if (role.includes('COUNTER')) {
    return 'counter_team';
  }

  if (
    role.includes('WORSHIP') ||
    role.includes('YOUTH') ||
    role.includes('MINISTRY') ||
    role.includes('GROUP_LEADER') ||
    role.includes('EVENT') ||
    (p.has('manage_events') && !p.has('manage_finance') && !p.has('manage_settings'))
  ) {
    return 'ministry_leader';
  }

  if (p.has('manage_members') && p.has('manage_events') && !p.has('manage_finance')) {
    return 'volunteer_coordinator';
  }

  return 'general';
}

const BASE_PRIORITY: ERPModule[] = [
  'dashboard',
  'members',
  'events',
  'attendance',
  'giving',
  'finance',
  'hr',
  'communication',
  'settings',
  'profile',
];

const EXPERIENCE_BY_ARCHETYPE: Record<RoleArchetype, Omit<RoleExperience, 'archetype'>> = {
  super_admin: {
    title: 'Church leadership',
    subtitle: 'Full visibility across people, ministry, and stewardship.',
    landingModule: 'dashboard',
    dashboardView: 'operations',
    dashboardLens: 'executive',
    visibleLenses: ['executive', 'finance', 'pastoral', 'operations'],
    modulePriority: BASE_PRIORITY,
    navGroupOrder: ['Insights & Audit', 'Identity', 'Operations', 'Finance', 'Engagement', 'Website', 'Platform'],
    quickOps: ['dashboard', 'sunday-mode', 'attendance', 'members', 'notifications', 'discipleship'],
    showQuickOps: true,
    dashboardShortcuts: ['members', 'events', 'giving', 'attendance'],
    preferPortal: false,
  },
  church_admin: {
    title: 'Church operations',
    subtitle: 'Your desk for events, people, volunteers, and church-wide coordination.',
    landingModule: 'dashboard',
    dashboardView: 'operations',
    dashboardLens: 'operations',
    visibleLenses: ['operations'],
    modulePriority: ['dashboard', 'events', 'attendance', 'members', 'communication', 'giving', 'settings', 'profile'],
    navGroupOrder: ['Operations', 'Identity', 'Engagement', 'Insights & Audit', 'Website', 'Platform'],
    quickOps: ['dashboard', 'sunday-mode', 'attendance', 'events', 'members', 'notifications'],
    showQuickOps: true,
    dashboardShortcuts: ['events', 'attendance', 'members', 'small-groups'],
    sidebarAllowList: [
      'dashboard',
      'events',
      'sunday-mode',
      'attendance',
      'members',
      'small-groups',
      'discipleship',
      'outreach',
      'communication',
      'notifications',
      'settings',
      'website',
      'analytics',
      'sermons',
      'admin-center',
      'permissions',
      'audit-logs',
      'workflow-monitor',
    ],
    focusedHome: true,
    preferPortal: false,
  },
  senior_pastor: {
    title: 'Pastoral leadership',
    subtitle: 'Church health, people, ministry, and stewardship at a glance.',
    landingModule: 'dashboard',
    dashboardView: 'executive',
    dashboardLens: 'pastoral',
    visibleLenses: ['pastoral', 'operations'],
    modulePriority: ['dashboard', 'members', 'discipleship', 'small-groups', 'giving', 'analytics', 'events', 'outreach', 'profile'],
    navGroupOrder: ['Identity', 'Insights & Audit', 'Operations', 'Engagement', 'Finance', 'Website', 'Platform'],
    quickOps: ['dashboard', 'discipleship', 'members', 'events', 'notifications'],
    showQuickOps: true,
    dashboardShortcuts: ['members', 'discipleship', 'giving', 'events', 'sunday-mode'],
    preferPortal: false,
  },
  finance: {
    title: 'Finance & stewardship',
    subtitle: 'Vouchers, funds, vendors, payroll, and month-end books — one workspace.',
    landingModule: 'finance',
    landingTab: 'vouchers',
    dashboardView: 'executive',
    dashboardLens: 'finance',
    visibleLenses: ['finance'],
    modulePriority: ['giving', 'finance', 'analytics', 'dashboard', 'profile'],
    navGroupOrder: ['Giving & Finance', 'Insights & Audit', 'Identity', 'Operations', 'Engagement', 'Website', 'Platform'],
    quickOps: ['giving', 'finance', 'notifications', 'dashboard'],
    showQuickOps: true,
    dashboardShortcuts: ['giving', 'finance'],
    preferPortal: false,
  },
  accountant: {
    title: 'Accounting desk',
    subtitle: 'Registry-first vouchers, reconciliation, and CA exports.',
    landingModule: 'finance',
    landingTab: 'vouchers',
    dashboardView: 'executive',
    dashboardLens: 'finance',
    visibleLenses: ['finance'],
    modulePriority: ['finance', 'giving', 'dashboard', 'profile'],
    navGroupOrder: ['Giving & Finance', 'Insights & Audit'],
    quickOps: ['finance', 'giving', 'dashboard'],
    showQuickOps: true,
    dashboardShortcuts: ['finance', 'giving'],
    sidebarAllowList: ['dashboard', 'giving', 'finance', 'analytics'],
    focusedHome: true,
    preferPortal: false,
  },
  hr: {
    title: 'HR & staffing',
    subtitle: 'Staff records, leave, payroll, and people operations.',
    landingModule: 'hr',
    dashboardView: 'personal',
    dashboardLens: 'operations',
    visibleLenses: ['operations'],
    modulePriority: ['hr', 'members', 'vendors', 'documents', 'dashboard', 'profile'],
    navGroupOrder: ['Identity', 'Finance', 'Insights & Audit', 'Operations', 'Engagement', 'Website', 'Platform'],
    quickOps: ['hr', 'members', 'notifications', 'dashboard'],
    showQuickOps: true,
    dashboardShortcuts: ['hr', 'members', 'vendors'],
    preferPortal: false,
  },
  ministry_leader: {
    title: 'Ministry operations',
    subtitle: 'Sunday services, teams, attendance, and live flow.',
    landingModule: 'sunday-mode',
    dashboardView: 'operations',
    dashboardLens: 'operations',
    visibleLenses: ['operations', 'pastoral'],
    modulePriority: ['sunday-mode', 'events', 'attendance', 'members', 'small-groups', 'sermons', 'profile'],
    navGroupOrder: ['Operations', 'Identity', 'Engagement', 'Insights & Audit', 'Finance', 'Website', 'Platform'],
    quickOps: ['sunday-mode', 'events', 'attendance', 'members', 'notifications'],
    showQuickOps: true,
    dashboardShortcuts: ['sunday-mode', 'events', 'attendance'],
    preferPortal: false,
  },
  counter_team: {
    title: 'Counter team',
    subtitle: 'Check-in sessions, headcounts, and Sunday attendance.',
    landingModule: 'attendance',
    dashboardView: 'operations',
    dashboardLens: 'operations',
    visibleLenses: ['operations'],
    modulePriority: ['attendance', 'sunday-mode', 'events', 'members', 'profile'],
    navGroupOrder: ['Operations', 'Identity', 'Engagement'],
    quickOps: ['attendance', 'sunday-mode', 'events', 'members', 'notifications'],
    showQuickOps: true,
    dashboardShortcuts: ['attendance', 'sunday-mode', 'events'],
    sidebarAllowList: ['dashboard', 'attendance', 'sunday-mode', 'events', 'members', 'notifications'],
    focusedHome: true,
    preferPortal: false,
  },
  youth_pastor: {
    title: 'Youth ministry',
    subtitle: 'Sunday flow, youth events, attendance, and worship for the next generation.',
    landingModule: 'sunday-mode',
    dashboardView: 'operations',
    dashboardLens: 'operations',
    visibleLenses: ['operations'],
    modulePriority: ['sunday-mode', 'events', 'attendance', 'members', 'discipleship', 'sermons', 'profile'],
    navGroupOrder: ['Operations', 'Identity', 'Engagement'],
    quickOps: ['sunday-mode', 'events', 'attendance', 'members', 'notifications'],
    showQuickOps: true,
    dashboardShortcuts: ['sunday-mode', 'events', 'attendance'],
    sidebarAllowList: [
      'dashboard',
      'sunday-mode',
      'events',
      'attendance',
      'members',
      'discipleship',
      'sermons',
      'notifications',
      'outreach',
    ],
    focusedHome: true,
    preferPortal: false,
  },
  volunteer_coordinator: {
    title: 'Volunteers & teams',
    subtitle: 'Rosters, Sunday teams, and check-in — your coordination desk.',
    landingModule: 'members',
    dashboardView: 'operations',
    dashboardLens: 'operations',
    visibleLenses: ['operations'],
    modulePriority: ['members', 'small-groups', 'events', 'attendance', 'sunday-mode', 'profile'],
    navGroupOrder: ['Operations', 'Identity'],
    quickOps: ['members', 'small-groups', 'sunday-mode', 'attendance', 'events', 'notifications'],
    showQuickOps: true,
    dashboardShortcuts: ['members', 'small-groups', 'events', 'attendance'],
    sidebarAllowList: [
      'dashboard',
      'members',
      'small-groups',
      'events',
      'attendance',
      'sunday-mode',
      'notifications',
    ],
    focusedHome: true,
    preferPortal: false,
  },
  small_group_leader: {
    title: 'Small group leadership',
    subtitle: 'Your group roster, weekly attendance, and care follow-ups.',
    landingModule: 'small-groups',
    dashboardView: 'operations',
    dashboardLens: 'pastoral',
    visibleLenses: ['pastoral', 'operations'],
    modulePriority: ['small-groups', 'members', 'attendance', 'discipleship', 'profile'],
    navGroupOrder: ['Identity', 'Operations'],
    quickOps: ['small-groups', 'attendance', 'members', 'discipleship', 'notifications'],
    showQuickOps: true,
    dashboardShortcuts: ['small-groups', 'members', 'attendance'],
    sidebarAllowList: ['dashboard', 'small-groups', 'members', 'attendance', 'discipleship', 'notifications'],
    focusedHome: true,
    preferPortal: false,
  },
  staff_desk: {
    title: 'Church office',
    subtitle: 'Help members, support events, and stay aligned with the team.',
    landingModule: 'dashboard',
    dashboardView: 'personal',
    dashboardLens: 'operations',
    visibleLenses: ['operations'],
    modulePriority: ['dashboard', 'members', 'events', 'notifications', 'sunday-mode', 'attendance', 'profile'],
    navGroupOrder: ['Identity', 'Operations'],
    quickOps: ['members', 'events', 'notifications', 'sunday-mode'],
    showQuickOps: true,
    dashboardShortcuts: ['members', 'events', 'sunday-mode', 'notifications'],
    sidebarAllowList: ['dashboard', 'members', 'events', 'notifications', 'sunday-mode', 'attendance', 'discipleship'],
    focusedHome: true,
    preferPortal: false,
  },
  communications: {
    title: 'Communications',
    subtitle: 'Messages, announcements, and member outreach.',
    landingModule: 'communication',
    dashboardView: 'personal',
    dashboardLens: 'operations',
    visibleLenses: ['operations'],
    modulePriority: ['communication', 'notifications', 'members', 'website', 'sermons', 'dashboard', 'profile'],
    navGroupOrder: ['Engagement', 'Identity', 'Website', 'Operations', 'Insights & Audit', 'Finance', 'Platform'],
    quickOps: ['communication', 'notifications', 'members', 'dashboard'],
    showQuickOps: true,
    dashboardShortcuts: ['communication', 'notifications', 'members', 'website'],
    preferPortal: false,
  },
  member_portal: {
    title: 'My church',
    subtitle: 'Your profile, giving, groups, and volunteer schedule.',
    landingModule: 'profile',
    dashboardView: 'personal',
    dashboardLens: 'executive',
    visibleLenses: [],
    modulePriority: ['profile'],
    navGroupOrder: [],
    quickOps: [],
    showQuickOps: false,
    dashboardShortcuts: [],
    preferPortal: true,
  },
  general: {
    title: 'Welcome',
    subtitle: 'Your church workspace — open a module from the menu to begin.',
    landingModule: 'dashboard',
    dashboardView: 'personal',
    dashboardLens: 'executive',
    visibleLenses: ['executive', 'operations'],
    modulePriority: BASE_PRIORITY,
    navGroupOrder: ['Insights & Audit', 'Identity', 'Operations', 'Finance', 'Engagement', 'Website', 'Platform'],
    quickOps: ['dashboard', 'sunday-mode', 'attendance', 'notifications'],
    showQuickOps: true,
    dashboardShortcuts: ['members', 'events', 'giving', 'attendance'],
    preferPortal: false,
  },
};

export function getRoleExperience(input: RoleUser): RoleExperience {
  const archetype = resolveRoleArchetype(input);
  return { archetype, ...EXPERIENCE_BY_ARCHETYPE[archetype] };
}

export function resolvePostLoginPath(user: RoleUser): string {
  if (!isStaffUser(user)) return '/portal';
  const exp = getRoleExperience(user);
  if (exp.preferPortal) return '/portal';
  return buildAdminPath({ module: exp.landingModule, tab: exp.landingTab });
}

export function sortNavGroups<T extends { label: string }>(groups: T[], order: string[]): T[] {
  const rank = new Map(order.map((l, i) => [l, i]));
  return [...groups].sort((a, b) => {
    const ra = rank.get(a.label) ?? 999;
    const rb = rank.get(b.label) ?? 999;
    return ra - rb;
  });
}

export function shouldShowInSidebar(exp: RoleExperience | null, moduleId: ERPModule): boolean {
  const mergedIntoFinance: ERPModule[] = ['budgets', 'vendors', 'assets', 'funds'];
  if (mergedIntoFinance.includes(moduleId)) {
    return exp?.sidebarAllowList?.includes(moduleId) ?? false;
  }
  if (!exp?.sidebarAllowList?.length) return true;
  return exp.sidebarAllowList.includes(moduleId);
}

export function labelForQuickOp(module: ERPModule): string {
  const labels: Partial<Record<ERPModule, string>> = {
    dashboard: 'Home',
    'sunday-mode': 'Sunday',
    attendance: 'Check-in',
    volunteers: 'Team',
    notifications: 'Alerts',
    discipleship: 'Care',
    giving: 'Giving',
    finance: 'Finance',
    budgets: 'Budgets',
    vendors: 'Payroll',
    events: 'Events',
    worship: 'Worship',
    'sunday-services': 'Worship',
    members: 'People',
    'small-groups': 'Groups',
    communication: 'Comms',
    hr: 'HR',
  };
  return labels[module] ?? module.replace(/-/g, ' ');
}
