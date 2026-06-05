/**
 * CLI tenant backup — writes kingdom-os-backup-v1 JSON to stdout or file.
 * Usage: TENANT_ID=default-tenant-id npx tsx src/server/scripts/backup-tenant.ts [out.json]
 */
import { writeFileSync } from 'node:fs';
import { DeploymentService } from '../services/DeploymentService.js';

const tenantId = (process.env.VITE_TENANT_ID || process.env.TENANT_ID || 'default-tenant-id').trim();
const outPath = process.argv[2];

async function main() {
  const data = await DeploymentService.createTenantBackup(tenantId);
  const json = JSON.stringify(data, null, 2);
  if (outPath) {
    writeFileSync(outPath, json, 'utf8');
    console.log(`[backup] Wrote ${outPath} (${json.length} bytes)`);
  } else {
    process.stdout.write(json);
  }
}

main().catch((e) => {
  console.error('[backup] failed:', e);
  process.exit(1);
});
