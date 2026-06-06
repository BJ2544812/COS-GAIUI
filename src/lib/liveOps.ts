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

/** Parse run-sheet duration strings. `MM:SS` → minutes:seconds (e.g. `05:00` = 5 min). Plain numbers = minutes. */
export function parseDurationSeconds(duration: string): number {
  const trimmed = (duration || '').trim();
  if (!trimmed) return 5 * 60;

  const parts = trimmed.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 3 && parts.every((p) => !Number.isNaN(p))) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  const n = parseInt(trimmed, 10);
  return Number.isNaN(n) ? 5 * 60 : n * 60;
}

export function parseDurationMinutes(duration: string): number {
  return parseDurationSeconds(duration) / 60;
}

export function segmentCountdownSeconds(
  segmentStartedAt: string | null | undefined,
  duration: string,
): number | null {
  if (!segmentStartedAt) return null;
  const start = new Date(segmentStartedAt).getTime();
  const totalSec = parseDurationSeconds(duration);
  const elapsed = Math.floor((Date.now() - start) / 1000);
  return Math.max(0, totalSec - elapsed);
}
