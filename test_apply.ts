import { WebsiteService } from './src/server/services/WebsiteService.js';
import { prisma } from './src/server/utils/prisma.js';

async function main() {
  try {
    const res = await WebsiteService.applyTemplate('default-tenant', 'flagship-1');
    console.log('Success!', res.length);
  } catch (e) {
    console.error('Failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
