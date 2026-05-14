import { PrismaClient } from '@prisma/client';
import { EventBus } from '../src/server/events/eventBus.js';
import { AccountingService } from '../src/server/services/AccountingService.js';
import { NotificationService } from '../src/server/services/NotificationService.js';
import { processDomainEvent } from '../src/server/events/eventWorker.js';
import crypto from 'crypto';
import { prisma } from '../src/server/utils/prisma.js';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('--- STARTING E2E VALIDATION ---');
  
  // 1. Setup Tenant & Super Admin
  console.log('1. Seeding Base Data...');
  const tenant = await prisma.tenant.create({ data: { name: 'E2E Test Church', domain: `e2e-${Date.now()}.church` } });
  
  const role = await prisma.role.create({
    data: { name: 'Super Admin', tenantId: tenant.id, isSystem: true }
  });
  
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: `admin-${Date.now()}@test.com`,
      username: `admin_${Date.now()}`,
      password: 'password123',
      roleId: role.id
    }
  });

  // Branches
  const mainBranch = await prisma.campus.create({ data: { tenantId: tenant.id, name: 'Main Campus' } });
  const youthBranch = await prisma.campus.create({ data: { tenantId: tenant.id, name: 'Youth Campus' } });

  // 20 Members
  console.log('2. Creating Members...');
  for(let i=0; i<20; i++) {
    await prisma.member.create({
      data: {
        tenantId: tenant.id,
        name: `Member${i} Test`,
        status: 'Active',
      }
    });
  }
  
  // Financial Year
  const fy = await prisma.financialYear.create({
    data: {
      tenantId: tenant.id,
      name: 'FY2026',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isActive: true,
      isClosed: false
    }
  });

  const period = await prisma.financialPeriod.create({
    data: {
      financialYearId: fy.id,
      name: 'April 2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-30'),
      isOpen: true
    }
  });

  // Funds
  const generalFund = await prisma.fund.create({ data: { tenantId: tenant.id, name: 'General Fund', type: 'Unrestricted' } });
  const missionsFund = await prisma.fund.create({ data: { tenantId: tenant.id, name: 'Missions Fund', type: 'Restricted' } });
  const buildingFund = await prisma.fund.create({ data: { tenantId: tenant.id, name: 'Building Fund', type: 'Restricted' } });

  // Cost Centers
  const mainCC = await prisma.costCenter.create({ data: { tenantId: tenant.id, name: 'Main Church', code: 'CC01' } });
  const youthCC = await prisma.costCenter.create({ data: { tenantId: tenant.id, name: 'Youth Ministry', code: 'CC02' } });

  // Accounts
  const assetGroup = await prisma.account.create({ data: { tenantId: tenant.id, name: 'Assets', type: 'Asset', code: '1000' } });
  const bankAcc = await prisma.account.create({ data: { tenantId: tenant.id, name: 'Main Bank', type: 'Asset', parentId: assetGroup.id, code: '1100' } });
  const cashAcc = await prisma.account.create({ data: { tenantId: tenant.id, name: 'Petty Cash', type: 'Asset', parentId: assetGroup.id, code: '1200' } });
  
  const incomeGroup = await prisma.account.create({ data: { tenantId: tenant.id, name: 'Income', type: 'Income', code: '4000' } });
  const donationAcc = await prisma.account.create({ data: { tenantId: tenant.id, name: 'Donations', type: 'Income', parentId: incomeGroup.id, code: '4100' } });
  
  const expGroup = await prisma.account.create({ data: { tenantId: tenant.id, name: 'Expenses', type: 'Expense', code: '5000' } });
  const opsExpAcc = await prisma.account.create({ data: { tenantId: tenant.id, name: 'Operations', type: 'Expense', parentId: expGroup.id, code: '5100' } });

  // Event Emission Test (Member Created)
  console.log('3. Testing Event Emission & Worker...');
  const memberEvent = await EventBus.publish({
    tenantId: tenant.id,
    eventName: 'MemberCreated',
    entityId: 'member-123',
    entityType: 'Member',
    payload: { name: 'John Doe' }
  });
  
  await delay(1000); // Wait for async fallback
  
  const processedLog = await prisma.eventLog.findFirst({ where: { entityId: 'member-123', eventName: 'MemberCreated' } });
  if (processedLog?.status === 'PROCESSED') console.log('✅ MemberCreated Event Processed');
  else console.error('❌ MemberCreated Event Failed to Process', processedLog?.error);

  // Giving Flow
  console.log('4. Testing Giving Flow & Accounting Integration...');
  for(let i=0; i<3; i++) {
    await EventBus.publish({
      tenantId: tenant.id,
      eventName: 'DonationReceived',
      entityId: `don-${i}`,
      entityType: 'Donation',
      payload: { 
        amount: 500, 
        method: i===0?'CASH':'BANK', 
        date: new Date('2026-04-15').toISOString(),
        debitAccountId: i===0?cashAcc.id:bankAcc.id,
        creditAccountId: donationAcc.id,
        auditUserId: user.id
      }
    });
  }
  
  await delay(2000);
  
  // Check Vouchers created
  const vouchers = await prisma.voucher.findMany({ where: { tenantId: tenant.id, source: 'donation' } });
  if(vouchers.length === 3 && vouchers.every(v => v.status === 'posted')) {
    console.log(`✅ 3 Donation Vouchers Created and Posted (Total Amount: ${vouchers.reduce((sum, v) => sum + Number(v.amount), 0)})`);
  } else {
    console.error('❌ Donation Vouchers failed to post');
  }

  // Budget Enforcement Test
  console.log('5. Testing Budget Enforcement...');
  const budget = await prisma.budget.create({
    data: {
      tenantId: tenant.id,
      financialYearId: fy.id,
      fundId: missionsFund.id,
      costCenterId: youthCC.id,
      amount: 1000,
      trackingMode: 'STRICT'
    }
  });

  try {
    const vStrict = await AccountingService.createApproveAndPostVoucher(
      tenant.id,
      {
        type: 'Payment',
        date: new Date('2026-04-16'),
        amount: 1500,
        description: 'Over budget expense',
        entries: [
          { accountId: opsExpAcc.id, debit: 1500, credit: 0, fundId: missionsFund.id, costCenterId: youthCC.id },
          { accountId: bankAcc.id, debit: 0, credit: 1500 }
        ]
      },
      { approvedByUserId: user.id, postedByUserId: user.id }
    );
    console.error('❌ STRICT budget did not block overspend!');
  } catch(e: any) {
    if(e.code === 'BUDGET_EXCEEDED') console.log('✅ STRICT budget correctly blocked overspend');
    else console.error('❌ Unexpected error on budget overspend:', e);
  }

  // Period Lock Test
  console.log('6. Testing Period Lock Enforcement...');
  await prisma.financialPeriod.update({ where: { id: period.id }, data: { isLocked: true } });
  try {
    await AccountingService.createApproveAndPostVoucher(
      tenant.id,
      {
        type: 'Payment',
        date: new Date('2026-04-20'),
        amount: 100,
        description: 'Locked period expense',
        entries: [
          { accountId: opsExpAcc.id, debit: 100, credit: 0 },
          { accountId: bankAcc.id, debit: 0, credit: 100 }
        ]
      },
      { approvedByUserId: user.id, postedByUserId: user.id }
    );
    console.error('❌ Locked period did not block posting!');
  } catch(e: any) {
    if(e.code === 'PERIOD_LOCKED') console.log('✅ Period Lock correctly blocked posting');
    else console.error('❌ Unexpected error on locked period:', e);
  }

  // Force Failed Event Test
  console.log('7. Testing Failed Event Logging & Recovery...');
  const badEvent = await prisma.eventLog.create({
    data: {
      id: crypto.randomUUID(),
      tenantId: tenant.id,
      eventName: 'DonationReceived',
      entityId: 'fail-1',
      entityType: 'Donation',
      payload: { amount: null }, // Invalid payload to cause crash
      status: 'PENDING'
    }
  });
  
  try {
    // Process domain event that doesn't exist or we can inject an error
    await processDomainEvent(badEvent as any);
  } catch (e) {
    // Expected to fail silently or log
  }
  const failedLog = await prisma.eventLog.findUnique({ where: { id: badEvent.id } });
  if (failedLog?.status === 'FAILED') console.log('✅ Event correctly marked as FAILED in EventLog');
  else console.error('❌ Event was not marked as FAILED');

  // Notifications Check
  console.log('8. Testing Notification Generation...');
  const notifs = await prisma.notification.findMany({ where: { tenantId: tenant.id } });
  console.log(`✅ Generated ${notifs.length} notifications`);
  const hasFailedNotif = notifs.some(n => n.type === 'FailedEvent');
  const hasVoucherNotif = notifs.some(n => n.type === 'DonationReceived');
  if (hasFailedNotif) console.log('✅ FailedEvent notification generated');
  if (hasVoucherNotif) console.log('✅ DonationReceived notification generated');

  console.log('--- E2E VALIDATION COMPLETE ---');
}

run().catch(e => console.error('FATAL ERROR:', e)).finally(() => prisma.$disconnect());
