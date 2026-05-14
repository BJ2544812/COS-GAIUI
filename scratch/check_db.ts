import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true }
  });
  const tenants = await prisma.tenant.findMany();
  console.log('Tenants:', JSON.stringify(tenants, null, 2));
  console.log('Users:', JSON.stringify(users.map(u => ({ username: u.username, tenantId: u.tenantId, role: u.role.name })), null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
