export type ReadinessLevel = 'READY' | 'WARNING' | 'BLOCKED';

export type ReadinessBreakdown = {
  level: ReadinessLevel;
  score: number;
  checks: Array<{ key: string; ok: boolean; label: string }>;
};

export type CommandCenterPayload = {
  lens: string;
  generatedAt: string;
  summary: {
    todayServiceCount: number;
    upcomingEventCount: number;
    volunteerGapCount: number;
    pendingApprovalCount: number;
    overdueTaskCount: number;
    openCheckInCount: number;
    unreadNotificationCount: number;
    blockedOperations: number;
    warningOperations: number;
  };
  todayServices: Array<{
    id: string;
    name: string;
    date: string;
    status: string;
    volunteerCount: number;
    readiness: ReadinessBreakdown;
  }>;
  upcomingEvents: Array<{
    id: string;
    name: string;
    type: string;
    date: string;
    status: string;
    location?: string | null;
    volunteerCount: number;
    readiness: ReadinessBreakdown;
  }>;
  volunteerGaps: Array<{ eventId: string; name: string; date: string; count: number }>;
  pendingApprovals: Array<{ id: string; name: string; status: string; date: string }>;
  myTasks: Array<Record<string, unknown>>;
  teamTasks: Array<Record<string, unknown>>;
  overdueTasks: Array<Record<string, unknown>>;
  recentActivity: Array<{
    id: string;
    eventName: string;
    entityType: string;
    entityId: string;
    status: string;
    createdAt: string;
    processedAt?: string | null;
    error?: string | null;
  }>;
  openAttendanceSessions: Array<Record<string, unknown>>;
  notifications: Array<Record<string, unknown>>;
};
