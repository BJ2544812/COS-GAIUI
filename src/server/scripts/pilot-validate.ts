/**
 * Production pilot validation bundle (no code changes).
 * Usage: npm run pilot:validate
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const reportPath = path.join(root, 'PILOT_STATUS_REPORT.md');

type Step = { name: string; cmd: string; ok: boolean; detail?: string };

const steps: Step[] = [];

function run(name: string, cmd: string, args: string[], env?: Record<string, string>) {
  console.log(`\n[pilot:validate] ▶ ${name}`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  const ok = r.status === 0;
  const detail = ok ? undefined : (r.stderr || r.stdout || `exit ${r.status}`).slice(0, 500);
  steps.push({ name, cmd: `${cmd} ${args.join(' ')}`, ok, detail });
  console.log(ok ? `  ✓ ${name}` : `  ✗ ${name}`);
  if (detail) console.log(`    ${detail}`);
  return ok;
}

async function main() {
  console.log('\n[pilot:validate] Kingdom Church OS — production pilot bundle\n');

  const healthUrl = process.env.PILOT_HEALTH_URL || 'http://127.0.0.1:4002/health';
  try {
    const h = await fetch(healthUrl);
    if (!h.ok) throw new Error(`HTTP ${h.status}`);
  } catch {
    console.error(`[pilot:validate] API not reachable at ${healthUrl} — start npm run dev:server`);
    process.exit(1);
  }

  run('stabilization:gate', 'npm', ['run', 'stabilization:gate']);
  run('test:pilot', 'npm', ['run', 'test:pilot'], {
    PLAYWRIGHT_BASE_URL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001',
  });
  run('simulate:hr', 'npm', ['run', 'simulate:hr']);

  const failed = steps.filter((s) => !s.ok).length;
  const lines = [
    '# Production Pilot Status Report',
    '',
    `**Generated:** ${new Date().toISOString()}`,
    `**Command:** \`npm run pilot:validate\``,
    '',
    '## Summary',
    '',
    `| Step | Status |`,
    `|------|--------|`,
    ...steps.map((s) => `| ${s.name} | ${s.ok ? 'PASS' : 'FAIL'} |`),
    '',
    failed === 0
      ? '**Overall: PILOT GATES PASS** — safe for continued live pilot support.'
      : `**Overall: ${failed} step(s) failed** — triage before expanding pilot churches.`,
    '',
    '## Regression commands',
    '',
    '```powershell',
    'npm run stabilization:gate',
    'npm run test:pilot',
    'PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test e2e/hr-operations.spec.ts',
    'npm run simulate:hr',
    'npm run simulate:church',
    '```',
    '',
    '## VPS checklist (production)',
    '',
    '| Item | Required |',
    '|------|----------|',
    '| HTTPS reverse proxy | Yes |',
    '| `REDIS_URL` | Strongly recommended |',
    '| MinIO or persistent uploads | Recommended |',
    '| `npm run backup:tenant` schedule | Yes |',
    '| Cashfree webhook URL (if giving live) | Yes |',
    '',
    'See [PILOT_SUPPORT.md](./PILOT_SUPPORT.md).',
    '',
  ];
  writeFileSync(reportPath, lines.join('\n'), 'utf8');
  console.log(`\n[pilot:validate] Report: ${reportPath}`);
  console.log(`[pilot:validate] ${steps.length - failed}/${steps.length} passed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
