import type { RunSheetSegment } from '@/lib/eventLifecycle';

export type VolunteerPresence = 'present' | 'absent' | 'late' | 'unknown' | 'confirmed' | 'pending';

export type LiveOpsIssue = {
  id: string;
  text: string;
  at: string;
  severity?: 'low' | 'medium' | 'high';
};

export type AgendaSession = {
  id: string;
  name: string;
  startTime?: string;
  duration?: string;
  sortOrder: number;
};

export type LiveOpsConfig = {
  liveActive?: boolean;
  liveStartedAt?: string | null;
  currentSegmentIndex?: number;
  segmentStartedAt?: string | null;
  issues?: LiveOpsIssue[];
  volunteerPresence?: Record<string, VolunteerPresence>;
  volunteerNotes?: Record<string, string>;
  announcements?: string[];
  mediaReady?: boolean;
  livestreamReady?: boolean;
  agendaSessions?: AgendaSession[];
};

export type LiveOpsPayload = {
  event: {
    id: string;
    name: string;
    type: string;
    date: string;
    status: string;
    location?: string | null;
  };
  runSheet: RunSheetSegment[];
  opsConfig: LiveOpsConfig;
  responsibilities: Array<{
    id: string;
    role: string;
    status: string;
    memberId: string;
    member?: { id: string; name: string };
  }>;
  metrics: {
    attendeeCount: number;
    volunteerCount: number;
    presentCount: number;
  };
};

export function defaultLiveOpsConfig(): LiveOpsConfig {
  return {
    liveActive: false,
    currentSegmentIndex: 0,
    segmentStartedAt: null,
    issues: [],
    volunteerPresence: {},
    announcements: [],
    mediaReady: false,
    livestreamReady: false,
    agendaSessions: [],
  };
}

export function mergeLiveOpsConfig(
  existing: LiveOpsConfig | null | undefined,
  patch: Partial<LiveOpsConfig>,
): LiveOpsConfig {
  return {
    ...defaultLiveOpsConfig(),
    ...existing,
    ...patch,
    issues: patch.issues ?? existing?.issues ?? [],
    volunteerPresence: {
      ...(existing?.volunteerPresence ?? {}),
      ...(patch.volunteerPresence ?? {}),
    },
    announcements: patch.announcements ?? existing?.announcements ?? [],
    agendaSessions: patch.agendaSessions ?? existing?.agendaSessions ?? [],
  };
}

export function parseDurationMinutes(duration: string): number {
  const parts = duration.split(':').map((p) => parseInt(p, 10));
  if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  const n = parseInt(duration, 10);
  return Number.isNaN(n) ? 5 : n;
}

export function segmentCountdownSeconds(
  segmentStartedAt: string | null | undefined,
  duration: string,
): number | null {
  if (!segmentStartedAt) return null;
  const start = new Date(segmentStartedAt).getTime();
  const totalSec = parseDurationMinutes(duration) * 60;
  const elapsed = Math.floor((Date.now() - start) / 1000);
  return Math.max(0, totalSec - elapsed);
}
