import { prisma } from '../src/server/utils/prisma.js';
import bcrypt from 'bcryptjs';

async function main() {
  const TENANT_ID = '00000000-0000-0000-0000-000000000000';
  const ADMIN_EMAIL = 'admin@church.com';
  const ADMIN_PASSWORD = 'password123';
  const ADMIN_USERNAME = 'admin';

  console.log('Ensuring Default Tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: { name: 'Default Church' },
    create: {
      id: TENANT_ID,
      name: 'Default Church',
    },
  });

  console.log('Ensuring Super Admin Role...');
  const role = await prisma.role.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: 'Super Admin',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Super Admin',
      isSystem: true,
    },
  });

  console.log('Ensuring Admin User...');
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: ADMIN_EMAIL,
      },
    },
    update: {
      password: hashedPassword,
      roleId: role.id,
    },
    create: {
      tenantId: tenant.id,
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      password: hashedPassword,
      roleId: role.id,
    },
  });

  console.log('Auth Fix Complete!');
  console.log('Tenant ID:', tenant.id);
  console.log('Admin Email:', user.email);
  console.log('Admin Password:', ADMIN_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
