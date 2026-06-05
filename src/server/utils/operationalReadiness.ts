/** Operational readiness scoring — used by OperationsService only. */

export type ReadinessLevel = 'READY' | 'WARNING' | 'BLOCKED';

export type ReadinessBreakdown = {
  level: ReadinessLevel;
  score: number;
  checks: Array<{ key: string; ok: boolean; label: string }>;
};

const MS_DAY = 86_400_000;

function levelFromChecks(
  checks: Array<{ key: string; ok: boolean; label: string; critical?: boolean }>,
): ReadinessBreakdown {
  const criticalFail = checks.some((c) => !c.ok && c.critical);
  const anyFail = checks.some((c) => !c.ok);
  let totalWeight = 0;
  let okWeight = 0;
  for (const c of checks) {
    const w = c.critical ? 2.5 : 1;
    totalWeight += w;
    if (c.ok) okWeight += w;
  }
  const score = totalWeight ? Math.round((okWeight / totalWeight) * 100) : 100;
  let level: ReadinessLevel = 'READY';
  if (criticalFail || score < 50) level = 'BLOCKED';
  else if (anyFail || score < 85) level = 'WARNING';
  return {
    level,
    score,
    checks: checks.map(({ key, ok, label }) => ({ key, ok, label })),
  };
}

export function scoreEventReadiness(input: {
  status: string;
  date: Date;
  registrationOpen?: boolean;
  volunteerCount: number;
  runSheetSegments: number;
  attendanceSessionCount: number;
}): ReadinessBreakdown {
  const now = Date.now();
  const eventMs = new Date(input.date).getTime();
  const imminent = eventMs - now < MS_DAY * 3 && eventMs > now - MS_DAY;
  const past = eventMs < now - MS_DAY;

  const checks = [
    {
      key: 'approval',
      ok: !['DRAFT', 'REVIEW', 'CANCELLED'].includes(input.status),
      label: 'Approved for operations',
      critical: imminent,
    },
    {
      key: 'volunteers',
      ok: input.volunteerCount >= 2,
      label: 'Volunteers assigned (2+)',
      critical: imminent,
    },
    {
      key: 'runsheet',
      ok: input.runSheetSegments >= 3,
      label: 'Run sheet / agenda prepared',
    },
    {
      key: 'checkin',
      ok: input.attendanceSessionCount > 0 || !imminent,
      label: 'Check-in session ready',
      critical: imminent,
    },
    {
      key: 'lifecycle',
      ok: !past || ['COMPLETED', 'ARCHIVED'].includes(input.status),
      label: 'Lifecycle current',
      critical: past,
    },
  ];

  return levelFromChecks(checks);
}

export function scoreServiceReadiness(input: {
  status: string;
  date: Date;
  volunteerCount: number;
  runSheetSegments: number;
}): ReadinessBreakdown {
  const now = Date.now();
  const serviceMs = new Date(input.date).getTime();
  const imminent = serviceMs - now < MS_DAY * 2 && serviceMs > now - MS_DAY * 0.5;

  const checks = [
    {
      key: 'runsheet',
      ok: input.runSheetSegments >= 3,
      label: 'Run sheet complete',
      critical: imminent,
    },
    {
      key: 'volunteers',
      ok: input.volunteerCount >= 2,
      label: 'Team confirmed',
      critical: imminent,
    },
    {
      key: 'status',
      ok: !['DRAFT', 'CANCELLED'].includes(input.status),
      label: 'Service approved',
      critical: imminent,
    },
  ];

  return levelFromChecks(checks);
}

export function resolveOperationalLens(input: {
  role: string;
  permissions: string[];
}): string {
  const role = (input.role || '').toUpperCase().replace(/\s/g, '_');
  const p = new Set(input.permissions);

  if (role.includes('SUPER') || role === 'ADMIN' || role === 'SYSTEM_ADMIN') return 'super_admin';
  if (p.has('manage_finance') && !p.has('manage_events')) return 'finance';
  if (role.includes('PASTOR') || role.includes('SHEPHERD')) return 'pastoral';
  if (p.has('manage_events')) return 'operations';
  if (p.has('manage_members')) return 'volunteer_coordinator';
  return 'general';
}
