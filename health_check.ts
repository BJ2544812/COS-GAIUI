import { prisma } from './src/server/utils/prisma.js';
import { MemberRepository } from './src/server/repositories/MemberRepository.js';
import { EventRepository } from './src/server/repositories/EventRepository.js';
import { GivingService } from './src/server/services/GivingService.js';
import { AccountingRepository } from './src/server/repositories/AccountingRepository.js';
import Redis from 'ioredis';
import 'dotenv/config';

async function main() {
  console.log('--- STARTING HEALTH CHECK ---');
  
  // 1. Check DB
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ DB Connection OK');
  } catch (e) {
    console.error('❌ DB Connection FAILED', e);
  }

  // 2. Check Redis
  try {
    if (process.env.REDIS_URL) {
      const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
      await redis.ping();
      console.log('✅ Redis Connection OK');
      redis.disconnect();
    } else {
      console.log('⚠️ Redis URL not provided in .env');
    }
  } catch (e) {
    console.error('❌ Redis Connection FAILED', e);
  }

  try {
    // Setup test tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Health Check Tenant ' + Date.now() }
    });
    console.log('✅ Created test tenant:', tenant.id);

    // Flow A: Member Flow
    const member = await MemberRepository.create(tenant.id, {
      name: 'Test Member',
      status: 'Active',
      growthStage: 'Visitor'
    } as any);
    console.log('✅ Member Flow OK, Member ID:', member.id);

    // Flow B: Event Flow
    const event = await EventRepository.create(tenant.id, {
      name: 'Test Event',
      type: 'Service',
      date: new Date()
    } as any);
    console.log('✅ Event Flow OK, Event ID:', event.id);

    // Flow C: Giving Flow
    // Need Accounts first
    const debitAcc = await prisma.account.create({
      data: { tenantId: tenant.id, code: '1001', name: 'Cash', type: 'Asset' }
    });
    const creditAcc = await prisma.account.create({
      data: { tenantId: tenant.id, code: '4001', name: 'Tithes', type: 'Revenue' }
    });

    const donationResult = await GivingService.recordDonation(tenant.id, {
      amount: 100,
      method: 'Cash',
      date: new Date(),
    } as any, { debitAccountId: debitAcc.id, creditAccountId: creditAcc.id });
    
    console.log('✅ Giving Flow OK, Donation ID:', donationResult.donation?.id);
    if (donationResult.voucherId) {
      console.log('✅ Giving Flow generated Voucher:', donationResult.voucherId);
    } else {
      console.log('❌ Giving Flow failed to generate Voucher');
    }

    // Cleanup
    await prisma.tenant.delete({ where: { id: tenant.id } });
    console.log('✅ Cleanup complete');

  } catch (e) {
    console.error('❌ Flow Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
