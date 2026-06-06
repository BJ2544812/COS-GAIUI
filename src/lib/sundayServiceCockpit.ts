import type { LiveOpsPayload, VolunteerPresence } from '@/lib/liveOps';
import { EVENT_STATUS_LABELS } from '@/lib/eventLifecycle';

export const SUNDAY_COCKPIT_INTRO =
  'Your live-service control center for today’s worship — attendance, teams, flow, and alerts in one place.';

export const YOUTH_SUNDAY_COCKPIT_INTRO =
  'Your youth gathering control center — attendance, teams, flow, and alerts for the next generation.';

export function getSundayCockpitIntro(roleArchetype?: string): string {
  if (roleArchetype === 'youth_pastor') return YOUTH_SUNDAY_COCKPIT_INTRO;
  return SUNDAY_COCKPIT_INTRO;
}

export type TeamBucketId = 'worship' | 'media' | 'welcome' | 'children' | 'prayer';

export const TEAM_BUCKETS: Array<{ id: TeamBucketId; label: string; match: (role: string) => boolean }> = [
  {
    id: 'worship',
    label: 'Worship',
    match: (r) => /worship|music|choir|band|song/i.test(r),
  },
  {
    id: 'media',
    label: 'Media',
    match: (r) => /media|slide|video|stream|sound|tech|av/i.test(r),
  },
  {
    id: 'welcome',
    label: 'Welcome',
    match: (r) => /usher|greeter|welcome|host|foyer/i.test(r),
  },
  {
    id: 'children',
    label: 'Children',
    match: (r) => /child|kids|nursery|youth|grace kids/i.test(r),
  },
  {
    id: 'prayer',
    label: 'Prayer',
    match: (r) => /prayer|care|altar|counsel/i.test(r),
  },
];

export type TeamStatus = 'ready' | 'attention' | 'short' | 'empty';

export type AttentionRow = {
  id: string;
  label: string;
  detail?: string;
  tone: 'ok' | 'warn' | 'alert';
};

export function formatServiceDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return 'Today';
  }
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatServiceTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function friendlyEventStatus(status: string): string {
  const raw = EVENT_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
  if (status === 'ACTIVE') return 'In progress';
  if (status === 'APPROVED') return 'Ready to start';
  if (status === 'REGISTRATION_OPEN') return 'Registration open';
  return raw;
}

export function volunteerReadinessLabel(present: number, total: number): { label: string; tone: 'ok' | 'warn' | 'alert' } {
  if (total === 0) return { label: 'No team assigned yet', tone: 'alert' };
  if (present >= total) return { label: 'Full team checked in', tone: 'ok' };
  if (present >= Math.min(2, total)) return { label: `${present} of ${total} checked in`, tone: 'warn' };
  return { label: `${present} of ${total} checked in — needs coverage`, tone: 'alert' };
}

function presenceFor(
  responsibilityId: string,
  presence: Record<string, VolunteerPresence> | undefined,
): VolunteerPresence {
  return presence?.[responsibilityId] ?? 'pending';
}

export function teamBucketStatuses(live: LiveOpsPayload): Array<{ id: TeamBucketId; label: string; status: TeamStatus; summary: string }> {
  const presence = live.opsConfig.volunteerPresence ?? {};

  return TEAM_BUCKETS.map((bucket) => {
    const assigned = live.responsibilities.filter((r) => bucket.match(r.role));
    if (assigned.length === 0) {
      return { id: bucket.id, label: bucket.label, status: 'empty' as TeamStatus, summary: 'No one assigned' };
    }

    const states = assigned.map((r) => presenceFor(r.id, presence));
    const late = states.filter((s) => s === 'late').length;
    const absent = states.filter((s) => s === 'absent').length;
    const pending = states.filter((s) => s === 'pending' || s === 'unknown').length;
    const ready = states.filter((s) => s === 'present' || s === 'confirmed').length;

    if (absent > 0) {
      return {
        id: bucket.id,
        label: bucket.label,
        status: 'short',
        summary: `${absent} absent · ${ready} ready`,
      };
    }
    if (late > 0 || pending > 0) {
      return {
        id: bucket.id,
        label: bucket.label,
        status: 'attention',
        summary: late > 0 ? `${late} running late` : `${pending} not checked in`,
      };
    }
    return {
      id: bucket.id,
      label: bucket.label,
      status: 'ready',
      summary: `${ready} ready`,
    };
  });
}

export function buildAttentionRows(live: LiveOpsPayload): AttentionRow[] {
  const ops = live.opsConfig;
  const presence = ops.volunteerPresence ?? {};
  const rows: AttentionRow[] = [];

  const missingVolunteers =
    live.metrics.volunteerCount > 0 && live.metrics.presentCount < live.metrics.volunteerCount;
  if (missingVolunteers) {
    const gap = live.metrics.volunteerCount - live.metrics.presentCount;
    rows.push({
      id: 'volunteers',
      label: 'Missing or not checked in',
      detail: `${gap} serving role${gap === 1 ? '' : 's'} still need check-in`,
      tone: 'warn',
    });
  } else if (live.metrics.volunteerCount === 0) {
    rows.push({
      id: 'volunteers-none',
      label: 'Missing volunteers',
      detail: 'No one assigned to this service yet',
      tone: 'alert',
    });
  }

  const lateCount = live.responsibilities.filter((r) => presence[r.id] === 'late').length;
  if (lateCount > 0) {
    rows.push({
      id: 'late',
      label: 'Late check-ins',
      detail: `${lateCount} team member${lateCount === 1 ? '' : 's'} marked late`,
      tone: 'warn',
    });
  }

  for (const issue of ops.issues ?? []) {
    rows.push({
      id: issue.id,
      label: 'Open issue',
      detail: issue.text,
      tone: issue.severity === 'high' ? 'alert' : 'warn',
    });
  }

  if (!ops.mediaReady) {
    rows.push({
      id: 'media',
      label: 'Media alert',
      detail: 'Media team has not marked systems ready',
      tone: 'warn',
    });
  }

  if (!ops.livestreamReady) {
    rows.push({
      id: 'stream',
      label: 'Livestream alert',
      detail: 'Livestream has not been marked ready',
      tone: 'warn',
    });
  }

  if (live.runSheet.length === 0) {
    rows.push({
      id: 'plan',
      label: 'Service plan',
      detail: 'Order of service is not set up yet',
      tone: 'warn',
    });
  }

  if (rows.length === 0) {
    rows.push({
      id: 'clear',
      label: 'All clear',
      detail: `${live.metrics.attendeeCount} checked in · teams and flow look ready`,
      tone: 'ok',
    });
  }

  return rows;
}

export function suggestedNextStep(
  live: LiveOpsPayload,
  currentSegment: string | undefined,
  hasTimer: boolean,
): string {
  if (live.runSheet.length === 0) {
    return 'Open the service plan in Events and publish the order of service, then return here when worship begins.';
  }
  if (!hasTimer) {
    return 'When the congregation is seated, start the segment timer, then tap Advance segment as each part of worship finishes.';
  }
  if (currentSegment) {
    return `During “${currentSegment}”, keep an eye on the timer below. When it ends, tap Advance segment.`;
  }
  return 'Review teams and attention items above, then follow the service flow.';
}
