/**
 * Dev-only: wipe all tables by recreating public schema.
 * Usage: npx tsx src/server/scripts/drop-public-schema.ts
 */
import '../utils/loadEnv.ts';
import { prisma } from '../utils/prisma.js';

async function main() {
  await prisma.$executeRawUnsafe(
    'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;',
  );
  console.log('[drop-public-schema] public schema recreated (empty).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
