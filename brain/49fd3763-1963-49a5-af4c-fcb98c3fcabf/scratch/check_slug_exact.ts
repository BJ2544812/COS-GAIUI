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
    where: { tenantId: 'default-tenant-id' }
  });
  console.log('--- SLUG EXACT VALUES ---');
  pages.forEach(p => {
    console.log(`'${p.slug}'`);
  });
  console.log('-------------------------');
}

main().catch(console.error);
