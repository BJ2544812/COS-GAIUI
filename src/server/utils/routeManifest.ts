/**
 * Authoritative V1 API route groups — used for startup logging and fail-fast verification.
 * Paths are relative to /api/v1 unless noted.
 */
export type RouteProbe = {
  /** Human label */
  label: string;
  /** Path after /api/v1 */
  path: string;
  method?: 'GET' | 'POST';
  /** If true, must return 2xx without auth */
  public?: boolean;
  /** Accept 401/403 as "mounted" (auth layer reached) */
  acceptAuthChallenge?: boolean;
};

export const V1_ROUTE_GROUPS: { group: string; mount: string; probes: RouteProbe[] }[] = [
  {
    group: 'deploy',
    mount: '/deploy',
    probes: [
      { label: 'setup-status', path: '/deploy/setup-status', public: true },
      { label: 'version', path: '/deploy/version', public: true },
      { label: 'license', path: '/deploy/license', acceptAuthChallenge: true },
      { label: 'maintenance', path: '/deploy/maintenance', acceptAuthChallenge: true },
      { label: 'backups', path: '/deploy/backups', acceptAuthChallenge: true },
    ],
  },
  {
    group: 'platform',
    mount: '/platform',
    probes: [
      { label: 'health', path: '/platform/health', acceptAuthChallenge: true },
      { label: 'incidents', path: '/platform/incidents', acceptAuthChallenge: true },
      { label: 'search', path: '/platform/search?q=test', acceptAuthChallenge: true },
      { label: 'integrations', path: '/platform/integrations', acceptAuthChallenge: true },
      { label: 'operator-diagnostics', path: '/platform/operator/diagnostics', acceptAuthChallenge: true },
    ],
  },
  {
    group: 'operations',
    mount: '/operations',
    probes: [
      { label: 'command-center', path: '/operations/command-center', acceptAuthChallenge: true },
      { label: 'operational-insights', path: '/operations/operational-insights', acceptAuthChallenge: true },
    ],
  },
  {
    group: 'communication',
    mount: '/communication',
    probes: [{ label: 'hub', path: '/communication/hub', acceptAuthChallenge: true }],
  },
  {
    group: 'outreach',
    mount: '/outreach',
    probes: [{ label: 'dashboard', path: '/outreach/dashboard', acceptAuthChallenge: true }],
  },
  {
    group: 'care',
    mount: '/care',
    probes: [{ label: 'dashboard', path: '/care/dashboard', acceptAuthChallenge: true }],
  },
  {
    group: 'member-portal',
    mount: '/member-portal',
    probes: [{ label: 'summary', path: '/member-portal/summary', acceptAuthChallenge: true }],
  },
  {
    group: 'events',
    mount: '/events',
    probes: [{ label: 'list', path: '/events', acceptAuthChallenge: true }],
  },
  {
    group: 'digests',
    mount: '/digests',
    probes: [{ label: 'mount', path: '/digests', acceptAuthChallenge: true }],
  },
];

export const MOUNTED_ROUTE_GROUPS = [
  'auth',
  'members',
  'events',
  'attendance',
  'finance',
  'discipleship',
  'giving',
  'assets',
  'outreach',
  'communication',
  'documents',
  'website',
  'settings',
  'analytics',
  'permissions',
  'notifications',
  'operations',
  'platform',
  'deploy',
  'member-portal',
  'care',
  'digests',
  'structure',
  'hr',
  'admin/events',
  'families',
] as const;

export function flattenProbes(): RouteProbe[] {
  return V1_ROUTE_GROUPS.flatMap((g) => g.probes);
}
