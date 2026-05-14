import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const tenants = await prisma.pageData.findMany({
    select: { tenantId: true },
    distinct: ['tenantId']
  });
  console.log('--- UNIQUE TENANTS IN PAGEDATA ---');
  console.log(tenants);
  console.log('---------------------------------');
}

main().catch(console.error);
