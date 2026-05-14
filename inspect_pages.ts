
import { prisma } from './src/server/utils/prisma.js';

async function main() {
  const pages = await prisma.pageData.findMany();
  console.log('TOTAL PAGES:', pages.length);
  pages.forEach(p => {
    console.log(`- [${p.isPublished ? 'PUBLISHED' : 'DRAFT'}] ${p.title} (${p.slug}) [Tenant: ${p.tenantId}]`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
