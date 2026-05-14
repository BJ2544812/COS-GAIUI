import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const results = await prisma.$queryRaw`
    SELECT "tenantId", slug, COUNT(*) 
    FROM "PageData" 
    GROUP BY "tenantId", slug 
    HAVING COUNT(*) > 1
  `;
  console.log('--- DUPLICATE SLUGS ---');
  console.log(results);
  console.log('-----------------------');
}

main().catch(console.error);
