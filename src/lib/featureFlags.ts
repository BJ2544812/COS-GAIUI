/** Tenant feature flags (mirrors server `feature_flags` setting). */

export type FeatureFlagMap = {
  sundayMode: boolean;
  ministryIntelligence: boolean;
  offlineAttendance: boolean;
  executiveDashboard: boolean;
  pastoralInsights: boolean;
  crossCampusOps: boolean;
  realtimePresence: boolean;
  experimentalWorkflows: boolean;
};

export const DEFAULT_FEATURE_FLAGS: FeatureFlagMap = {
  sundayMode: true,
  ministryIntelligence: true,
  offlineAttendance: true,
  executiveDashboard: true,
  pastoralInsights: true,
  crossCampusOps: true,
  realtimePresence: true,
  experimentalWorkflows: false,
};
