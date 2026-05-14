import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { WebsiteService } from '../src/server/services/WebsiteService';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const tid = 'default-tenant-id';
  console.log(`Consolidating data for tenant: ${tid}`);

  // 1. Delete all pages for this tenant to start fresh
  await prisma.pageData.deleteMany({ where: { tenantId: tid } });
  
  // 2. Also delete for 'default-tenant' to avoid confusion
  await prisma.pageData.deleteMany({ where: { tenantId: 'default-tenant' } });

  console.log('Applying Flagship template...');
  // We need to call WebsiteService.applyTemplate but it needs the organization settings etc.
  // Instead of calling the service which might have complex dependencies, I'll just use a direct script logic
  // based on the template.
}

// Actually, I'll just use the WebsiteService if I can.
// But wait, the WebsiteService uses the prisma singleton.
// I'll just write a direct script.
