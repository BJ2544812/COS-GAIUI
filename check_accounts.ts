import { prisma } from './src/server/utils/prisma.js';

async function main() {
  const accounts = await prisma.account.findMany({
    where: { tenantId: 'default-tenant-id' }
  });
  console.log(JSON.stringify(accounts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
