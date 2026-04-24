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

// Module identifiers for navigation
export type ERPModule = 
  | 'dashboard'
  | 'members'
  | 'structure'
  | 'workforce'
  | 'attendance'
  | 'discipleship'
  | 'services'
  | 'content'
  | 'giving'
  | 'finance'
  | 'assets'
  | 'events'
  | 'outreach'
  | 'communication'
  | 'documents'
  | 'website'
  | 'mobile-app'
  | 'settings'
  | 'notifications'
  | 'profile';
