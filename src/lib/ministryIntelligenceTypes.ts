export type VolunteerHealthProfile = {
  memberId: string;
  name: string;
  growthStage: string | null;
  activeAssignments: number;
  reliabilityScore: number;
  attendance90d: number;
  replacementCount: number;
  burnoutRisk: boolean;
  excessiveServing: boolean;
  leadershipReadiness: boolean;
  ministryOverload: boolean;
  noShowRisk: boolean;
};

export type ExecutiveDashboard = {
  generatedAt: string;
  campusId: string | null;
  ministryHealth: { engagementScore: number; engagedMembers: number; atRiskMembers: number };
  operationalHealth: { serviceReadiness: number; blockedServices: number; operationalAlerts: number };
  volunteerEngagement: {
    trackedVolunteers: number;
    burnoutRiskCount: number;
    overloadCount: number;
    leadershipReadyCount: number;
    avgReliability: number;
  };
  attendanceTrend: { eventAttendanceTotal: number };
  eventImpact: { totalDonations: number; strongEvents: number };
  predictive: {
    staffingShortage: { risk: boolean; gapCount: number };
    burnout: { risk: boolean; affectedCount: number };
    serviceRisk: { risk: boolean };
    workflowBottleneck: { risk: boolean; overdueCount: number };
    attendanceDrop: { risk: boolean; inactiveMemberCount: number };
  };
};

export type PastoralInsights = {
  disengagedMembers: Array<{ memberId: string; name: string; trend: string; attendance90d: number }>;
  followUpPriority: Array<{ type: string; memberId: string; name: string; priority: string; reason: string }>;
  absentVolunteers: VolunteerHealthProfile[];
  ministryStress: VolunteerHealthProfile[];
  momentum: { volunteerMomentum: number; engagementGrowth: number };
};

export type CampusOverviewRow = {
  campusId: string;
  name: string;
  type: string | null;
  serviceReadiness: number;
  upcomingEventCount: number;
  volunteerGaps: number;
  alertCount: number;
};

export type MinistryJourneyPayload = {
  memberId: string;
  timeline: Array<{ at: string; kind: string; label: string; meta?: Record<string, unknown> }>;
  summary: { attendanceCount: number; volunteerRoles: number; openTasks: number };
};
