import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const users = await prisma.user.findMany({
    where: { username: 'admin' }
  });
  console.log('--- ADMIN USERS ---');
  users.forEach(u => {
    console.log(`User: ${u.username} | Tenant: ${u.tenantId}`);
  });
  console.log('-------------------');
}

main().catch(console.error);
