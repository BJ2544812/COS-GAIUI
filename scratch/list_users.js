
import { prisma } from '../src/server/utils/prisma.js';
async function run() {
  try {
    const users = await prisma.user.findMany({ include: { role: true } });
    console.log(JSON.stringify(users, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
