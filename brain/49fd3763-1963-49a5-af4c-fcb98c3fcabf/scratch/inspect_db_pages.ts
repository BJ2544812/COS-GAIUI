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
    where: { slug: { contains: 'sermons' } }
  });
  console.log(JSON.stringify(pages, null, 2));
}

main().catch(console.error);
