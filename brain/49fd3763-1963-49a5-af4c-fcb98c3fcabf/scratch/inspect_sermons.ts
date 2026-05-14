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
    where: { slug: 'sermons' }
  });
  console.log('--- SERMONS PAGES ---');
  pages.forEach(p => {
    console.log(`[${p.isPublished ? 'PUB' : 'DRF'}] Tenant: ${p.tenantId} | Slug: /${p.slug} | Title: ${p.title}`);
  });
  console.log('---------------------');
}

main().catch(console.error);
