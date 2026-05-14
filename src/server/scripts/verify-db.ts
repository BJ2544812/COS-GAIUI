/**
 * Verify Prisma can reach PostgreSQL using DATABASE_URL (after loadEnv rules).
 * Run: npm run db:check
 */
import '../utils/loadEnv.ts';
import { prisma } from '../utils/prisma.js';

function summarizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const db = u.pathname.replace(/^\//, '').split('?')[0] || '(default)';
    return `${u.protocol}//${u.hostname}:${u.port || '5432'}/${db}`;
  } catch {
    return '(unparseable DATABASE_URL)';
  }
}

async function main() {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    console.error('[db:check] DATABASE_URL is empty. Set it in `.env` (see .env.example).');
    process.exit(1);
  }
  console.log('[db:check] Using', summarizeUrl(raw));
  await prisma.$queryRaw`SELECT 1 AS ok`;
  console.log('[db:check] Prisma → PostgreSQL: OK');
}

main()
  .catch((e: unknown) => {
    console.error('[db:check] FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {});
  });
