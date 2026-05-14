
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const stats = {
    campuses: await prisma.campus.count(),
    ministries: await prisma.ministry.count(),
    regions: await prisma.region.count(),
    zones: await prisma.zone.count(),
    groups: await prisma.smallGroup.count()
  };
  console.log('DB_STATS:', JSON.stringify(stats));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
