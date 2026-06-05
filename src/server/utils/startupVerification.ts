import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { flattenProbes, MOUNTED_ROUTE_GROUPS, V1_ROUTE_GROUPS } from './routeManifest.js';

export type StartupProbeResult = {
  label: string;
  path: string;
  status: number;
  ok: boolean;
  detail?: string;
};

export type StartupVerificationReport = {
  buildVersion: string;
  bootId: string;
  baseUrl: string;
  groups: typeof V1_ROUTE_GROUPS;
  mountedGroups: readonly string[];
  probes: StartupProbeResult[];
  passed: boolean;
  failures: string[];
};

function normalizeBase(port: number): string {
  const host = process.env.STARTUP_VERIFY_HOST || '127.0.0.1';
  return `http://${host}:${port}/api/v1`;
}

function isProbeOk(
  status: number,
  probe: { public?: boolean; acceptAuthChallenge?: boolean },
  hasTenantHeader: boolean,
): boolean {
  if (status >= 200 && status < 300) return true;
  if (status === 404) return false;
  if (probe.acceptAuthChallenge && hasTenantHeader && (status === 401 || status === 403)) return true;
  if (probe.public && status >= 200 && status < 500) return true;
  return false;
}

export async function runStartupRouteVerification(
  port: number,
  tenantId?: string,
): Promise<StartupVerificationReport> {
  const base = normalizeBase(port);
  let buildVersion = 'unknown';
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as { version?: string };
    buildVersion = pkg.version ?? 'unknown';
  } catch {
    /* ignore */
  }
  const bootId = process.env.BOOT_ID ?? `${buildVersion}-${Date.now()}`;

  const probes: StartupProbeResult[] = [];
  const failures: string[] = [];

  const tenantHeader = tenantId?.trim() ?? '';
  const fetchHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (tenantHeader) fetchHeaders['x-tenant-id'] = tenantHeader;

  for (const probe of flattenProbes()) {
    const url = `${base}${probe.path}`;
    let status = 0;
    try {
      const res = await fetch(url, {
        method: probe.method ?? 'GET',
        headers: fetchHeaders,
        signal: AbortSignal.timeout(8_000),
      });
      status = res.status;
    } catch (e) {
      failures.push(`${probe.label}: unreachable (${e instanceof Error ? e.message : String(e)})`);
      probes.push({ label: probe.label, path: probe.path, status: 0, ok: false, detail: 'unreachable' });
      continue;
    }

    const ok = isProbeOk(status, probe, Boolean(tenantHeader));
    probes.push({ label: probe.label, path: probe.path, status, ok });
    if (!ok) {
      failures.push(`${probe.label} ${probe.path} → HTTP ${status} (expected mounted route)`);
    }
  }

  return {
    buildVersion,
    bootId,
    baseUrl: base,
    groups: V1_ROUTE_GROUPS,
    mountedGroups: MOUNTED_ROUTE_GROUPS,
    probes,
    passed: failures.length === 0,
    failures,
  };
}

export async function assertStartupRoutesOrExit(
  port: number,
  tenantId?: string,
): Promise<StartupVerificationReport> {
  const report = await runStartupRouteVerification(port, tenantId);
  if (!report.passed) {
    console.error('[boot] CRITICAL: V1 route verification failed — partial API startup detected.');
    for (const f of report.failures) {
      console.error(`  ✗ ${f}`);
    }
    console.error(
      '[boot] Stop stale processes (npm run runtime:clean) and restart: npm run dev:server:fresh',
    );
    process.exit(1);
  }
  return report;
}
