import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { StartupVerificationReport } from './startupVerification.js';
import { MOUNTED_ROUTE_GROUPS, V1_ROUTE_GROUPS } from './routeManifest.js';

export function readPackageVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as { version?: string };
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

export function logBootEnvironment(opts: {
  port: number;
  databaseReady: boolean;
  redisConfigured: boolean;
  socketEnabled: boolean;
}) {
  const version = readPackageVersion();
  const bootId = process.env.BOOT_ID ?? `${version}-${Date.now()}`;
  process.env.BOOT_ID = bootId;

  console.log('[boot] ─────────────────────────────────────────');
  console.log(`[boot] Kingdom Church OS API v${version}`);
  console.log(`[boot] Boot ID: ${bootId}`);
  console.log(`[boot] NODE_ENV: ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`[boot] Port: ${opts.port}`);
  console.log(`[boot] Database: ${opts.databaseReady ? 'connected' : 'DISCONNECTED'}`);
  console.log(`[boot] Redis: ${opts.redisConfigured ? 'configured' : 'not set (sync fallback)'}`);
  console.log(`[boot] Socket.IO: ${opts.socketEnabled ? 'enabled (/socket.io)' : 'disabled'}`);
  console.log(`[boot] JWT: ${process.env.JWT_SECRET?.trim() ? 'configured' : 'dev default'}`);
}

export function logMountedRouteGroups() {
  console.log('[boot] Mounted /api/v1 route groups:');
  for (const g of MOUNTED_ROUTE_GROUPS) {
    console.log(`[boot]   • ${g}`);
  }
  console.log('[boot] V1 critical groups:');
  for (const g of V1_ROUTE_GROUPS) {
    console.log(`[boot]   • ${g.group} → ${g.mount} (${g.probes.length} probes)`);
  }
}

export function logOptionalIntegrations() {
  const optional: { name: string; configured: boolean }[] = [
    { name: 'SMTP', configured: Boolean(process.env.SMTP_HOST?.trim()) },
    { name: 'SMS', configured: Boolean(process.env.SMS_PROVIDER?.trim()) },
    { name: 'WhatsApp', configured: Boolean(process.env.WHATSAPP_PROVIDER?.trim()) },
    { name: 'Analytics adapter', configured: Boolean(process.env.ANALYTICS_ADAPTER?.trim()) },
    { name: 'SSO', configured: Boolean(process.env.SSO_PROVIDER?.trim()) },
    { name: 'MinIO', configured: Boolean(process.env.MINIO_ENDPOINT?.trim()) },
  ];
  for (const o of optional) {
    if (!o.configured) {
      console.warn(`[boot] Optional integration not configured: ${o.name}`);
    } else {
      console.log(`[boot] Optional integration: ${o.name} ✓`);
    }
  }
}

export function logRouteVerificationSummary(report: StartupVerificationReport) {
  console.log(`[boot] Route verification: ${report.probes.filter((p) => p.ok).length}/${report.probes.length} probes OK`);
  if (!report.passed) return;
  console.log('[boot] V1 route table: ACTIVE');
}
