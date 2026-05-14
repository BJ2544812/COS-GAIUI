import { prisma } from './utils/prisma.js';

async function test() {
  try {
    const username = 'admin';
    const tenantId = 'default-tenant-id';
    console.log(`Testing findFirst for ${username} in ${tenantId}`);
    
    const user = await prisma.user.findFirst({
      where: { username: username.trim(), tenantId },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } }
    });
    
    console.log('Result:', JSON.stringify(user, null, 2));
  } catch (error: any) {
    console.error('Error during findFirst:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
