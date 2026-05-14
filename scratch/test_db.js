
import { prisma } from '../src/server/utils/prisma.js';

async function test() {
  console.log('Testing DB...');
  try {
    const tenants = await prisma.tenant.findMany();
    console.log('Tenants:', tenants.length);
    const cases = await prisma.careCase.findMany({ take: 1 });
    console.log('CareCases:', cases.length);
  } catch (e) {
    console.error('DB Error:', e);
  } finally {
    process.exit(0);
  }
}

test();
