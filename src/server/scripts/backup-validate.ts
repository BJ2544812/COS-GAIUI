/**
 * Tenant backup validation — export + schema checks.
 * A backup is not "complete" until restore is tested manually (see RESTORE_RUNBOOK.md).
 *
 * Usage: npm run backup:validate
 */
import '../utils/loadEnv.ts';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DeploymentService } from '../services/DeploymentService.js';

const REPORT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../BACKUP_VALIDATION_REPORT.md',
);

const tenantId = (process.env.TENANT_ID || process.env.VITE_TENANT_ID || 'default-tenant-id').trim();

type Check = { name: string; ok: boolean; detail?: string };

async function main() {
  const checks: Check[] = [];
  console.log(`\n[backup:validate] Tenant: ${tenantId}\n`);

  let manifest: Record<string, unknown>;
  try {
    manifest = (await DeploymentService.createTenantBackup(tenantId)) as Record<string, unknown>;
    checks.push({ name: 'Export backup manifest', ok: true });
  } catch (e: any) {
    checks.push({ name: 'Export backup manifest', ok: false, detail: e.message });
    writeReport(checks, null);
    process.exit(1);
  }

  const required = ['format', 'exportedAt', 'tenantId', 'tenant', 'settings', 'members', 'events'];
  for (const key of required) {
    const ok = manifest[key] !== undefined && manifest[key] !== null;
    checks.push({ name: `Field: ${key}`, ok, detail: ok ? undefined : 'missing' });
  }

  if (manifest.format !== 'kingdom-os-backup-v1') {
    checks.push({ name: 'Format kingdom-os-backup-v1', ok: false, detail: String(manifest.format) });
  } else {
    checks.push({ name: 'Format kingdom-os-backup-v1', ok: true });
  }

  const members = manifest.members as unknown[];
  checks.push({
    name: 'Members array',
    ok: Array.isArray(members),
    detail: Array.isArray(members) ? `${members.length} rows` : 'not array',
  });

  const json = JSON.stringify(manifest, null, 2);
  const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../scratch');
  const outFile = path.join(outDir, `backup-validate-${Date.now()}.json`);
  try {
    writeFileSync(outFile, json, 'utf8');
    checks.push({ name: 'Write sample file', ok: true, detail: outFile });
  } catch (e: any) {
    checks.push({ name: 'Write sample file', ok: false, detail: e.message });
  }

  checks.push({
    name: 'Restore drill (automated)',
    ok: false,
    detail: 'Run npm run drill:restore — see RESTORE_RUNBOOK.md',
  });

  writeReport(checks, manifest);
  const failed = checks.filter((c) => !c.ok && c.name !== 'Restore drill (automated)').length;
  console.log(`[backup:validate] Report: ${REPORT}`);
  process.exit(failed > 0 ? 1 : 0);
}

function writeReport(checks: Check[], manifest: Record<string, unknown> | null) {
  const pass = checks.filter((c) => c.ok).length;
  const lines = [
    '# Backup Validation Report',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    `**Tenant:** ${tenantId}`,
    `**Command:** \`npm run backup:validate\``,
    '',
    '## Summary',
    '',
    manifest
      ? `Exported **${(manifest.members as unknown[])?.length ?? 0}** members, **${(manifest.events as unknown[])?.length ?? 0}** events.`
      : 'Export failed.',
    '',
    '| Check | Status | Detail |',
    '|-------|--------|--------|',
    ...checks.map((c) => `| ${c.name} | ${c.ok ? 'PASS' : 'FAIL/WARN'} | ${c.detail ?? ''} |`),
    '',
    '## Restore requirement',
    '',
    'Automated export validation passed does **not** replace a full restore test.',
    'Complete [RESTORE_RUNBOOK.md](./RESTORE_RUNBOOK.md) before calling backups production-ready.',
    '',
    '## PostgreSQL',
    '',
    'Schedule `pg_dump` of the tenant database in addition to JSON manifest export (`npm run backup:tenant`).',
    '',
  ];
  writeFileSync(REPORT, lines.join('\n'), 'utf8');
  for (const c of checks) {
    const icon = c.ok ? '✓' : '✗';
    console.log(`  ${icon} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`);
  }
  console.log(`\n  ${pass}/${checks.length} checks OK\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
