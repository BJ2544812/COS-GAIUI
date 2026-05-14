import { prisma } from './src/server/utils/prisma.js';

async function main() {
  const pages = await prisma.pageData.findMany();
  console.log('Total pages:', pages.length);
  for (const page of pages) {
    console.log(`- ${page.slug} (Tenant: ${page.tenantId}) (Published: ${page.isPublished})`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
