import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { randomUUID } from 'crypto';
import 'dotenv/config';

// Import template directly from the source if possible, or just copy the keys I need
// I'll just use the logic from WebsiteService but simplified for the script.

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const tid = 'default-tenant-id';
  console.log(`Reseeding Flagship for: ${tid}`);

  // Wipe old data for both potential default tenants
  await prisma.pageData.deleteMany({ where: { tenantId: tid } });
  await prisma.pageData.deleteMany({ where: { tenantId: 'default-tenant' } });

  const flagshipPages = [
    { title: 'Home', slug: 'home' },
    { title: 'About', slug: 'about' },
    { title: 'Ministries', slug: 'ministries' },
    { title: 'Sermons', slug: 'sermons' },
    { title: 'Events', slug: 'events' },
    { title: 'Giving', slug: 'giving' },
    { title: 'Prayer', slug: 'prayer' },
    { title: 'Contact', slug: 'contact' },
    { title: 'Leadership', slug: 'leadership' },
    { title: 'Next Steps', slug: 'next-steps' }
  ];

  for (const page of flagshipPages) {
    await prisma.pageData.create({
      data: {
        tenantId: tid,
        slug: page.slug,
        title: page.title,
        isPublished: true,
        content: JSON.stringify([
          { 
            id: randomUUID(), 
            type: 'hero', 
            config: { 
              title: page.title, 
              subtitle: `Welcome to our ${page.title} page.`,
              variant: 'centered' 
            } 
          }
        ])
      }
    });
    console.log(`Created: /${page.slug}`);
  }

  console.log('--- DONE ---');
}

main().catch(console.error).finally(() => process.exit());
