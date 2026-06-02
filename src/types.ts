/**
 * Core ERP Entity Types
 */

export enum MembershipStatus {
  VISITOR = 'Visitor',
  REGULAR = 'Regular Attendee',
  MEMBER = 'Member',
  LEADER = 'Leader',
  STAFF = 'Staff'
}

export interface IndividualProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: MembershipStatus;
  avatar?: string;
  joinedDate: string;
  engagementScore: number;
  lastVisit: string;
}

export interface DashboardStats {
  totalMembers: number;
  newVisitorsThisMonth: number;
  avgAttendance: number;
  totalGivingThisMonth: number;
  growthRate: number;
}

/** Nav / module honesty: use `placeholder` and `prototype` for non-production surfaces. */
export type ModuleStatus =
  | 'live'
  | 'operational'
  | 'partial'
  | 'prototype'
  | 'placeholder'
  | 'backend-ready'
  | 'planned'
  | 'experimental';

/** Navigate to an admin module (optional tab for deep links). */
export type ModuleNavigate = (module: ERPModule, tab?: string) => void;

// Module identifiers for navigation
export type ERPModule =
  // Special
  | 'dashboard'
  | 'profile'
  // IDENTITY
  | 'members'
  | 'families'
  | 'volunteers'
  | 'workforce'
  | 'hr'
  | 'small-groups'
  | 'pathways'
  | 'discipleship'
  // OPERATIONS
  | 'events'
  | 'attendance'
  | 'services'
  | 'sunday-mode'
  | 'sunday-services'
  | 'worship'
  | 'outreach'
  | 'missions'
  | 'structure'
  // FINANCE
  | 'giving'
  | 'finance'
  | 'budgets'
  | 'funds'
  | 'assets'
  | 'documents'
  | 'vendors'
  // ENGAGEMENT
  | 'sermons'
  | 'content'
  | 'communication'
  | 'notifications'
  | 'mobile'
  // WEBSITE & DIGITAL
  | 'website'
  | 'pages'
  | 'forms'
  | 'media-library'
  | 'landing-pages'
  | 'seo'
  // INTELLIGENCE
  | 'analytics'
  | 'academy'
  | 'engagement'
  | 'workflow-monitor'
  | 'event-admin'
  | 'audit-logs'
  // PLATFORM
  | 'settings'
  | 'permissions'
  | 'feature-flags'
  | 'admin-center'
  | 'tenant-settings'
  | 'integrations';
