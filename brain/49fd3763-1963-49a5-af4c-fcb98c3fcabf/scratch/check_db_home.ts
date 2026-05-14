import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const page = await prisma.pageData.findFirst({
    where: { tenantId: 'default-tenant-id', slug: 'home' }
  });
  console.log('--- DB CHECK FOR HOME ---');
  console.log(JSON.stringify(page, null, 2));
  console.log('-------------------------');
}

main().catch(console.error);
