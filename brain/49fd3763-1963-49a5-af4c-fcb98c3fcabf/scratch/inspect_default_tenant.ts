import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const pages = await prisma.pageData.findMany({
    where: { tenantId: 'default-tenant' },
    orderBy: { slug: 'asc' }
  });
  console.log('--- PAGES FOR default-tenant ---');
  pages.forEach(p => {
    console.log(`[${p.isPublished ? 'PUB' : 'DRF'}] /${p.slug.padEnd(20)} | ${p.title.padEnd(20)} | Created: ${p.createdAt.toISOString()}`);
  });
  console.log('-----------------------------------');
}

main().catch(console.error);
