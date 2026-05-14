import { prisma } from './utils/prisma.js';
import bcrypt from 'bcryptjs';
import { GivingService } from './services/GivingService.js';
import { WebsiteService } from './services/WebsiteService.js';
import { AccountingRepository } from './repositories/AccountingRepository.js';

async function main() {
  const tenantId = 'default-tenant-id';
  console.log('--- STARTING FULL SYSTEM SEED ---');

  // 1. Ensure Tenant
  await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {},
    create: { id: tenantId, name: 'Grace Community Church' }
  });

  // 2. Roles & Permissions (Standardized)
  const permissionKeys = [
    'manage_members', 'manage_events', 'manage_attendance', 'manage_giving',
    'manage_finance', 'manage_assets', 'manage_outreach', 'manage_communication',
    'manage_discipleship', 'manage_documents', 'manage_website', 'manage_settings',
    'manage_analytics', 'approve_voucher', 'post_voucher'
  ];

  for (const key of permissionKeys) {
    await prisma.permission.upsert({
      where: { moduleKey: key },
      update: {},
      create: {
        moduleKey: key,
        name: key.replace('manage_', 'Manage ').replace('_', ' '),
        description: `Access to ${key.replace('manage_', '')} module`
      }
    });
  }

  const superAdminRole = await prisma.role.upsert({
    where: { tenantId_name: { tenantId, name: 'Super Admin' } },
    update: { isSystem: true },
    create: {
      tenantId,
      name: 'Super Admin',
      description: 'Full administrative access.',
      isSystem: true
    }
  });

  const perms = await prisma.permission.findMany();
  await prisma.rolePermission.deleteMany({ where: { roleId: superAdminRole.id } });
  await prisma.rolePermission.createMany({
    data: perms.map(p => ({ roleId: superAdminRole.id, permissionId: p.id }))
  });

  // 2b. Seed Organization Settings
  console.log('Seeding Organization Settings...');
  await prisma.setting.upsert({
    where: { tenantId_key: { tenantId, key: 'organization' } },
    update: {
      value: JSON.stringify({
        name: 'Grace Community Church',
        tagline: 'Growing in faith, serving with compassion.',
        logo: '',
        address: '42 Church Lane, Anna Nagar, Chennai 600040',
        phone: '+91 44 2616 7890',
        email: 'office@gracecommunity.in',
        registrationNumber: 'TN/REG/2018/0421',
        taxId: 'AABCG1234F',
      })
    },
    create: {
      tenantId,
      key: 'organization',
      value: JSON.stringify({
        name: 'Grace Community Church',
        tagline: 'Growing in faith, serving with compassion.',
        logo: '',
        address: '42 Church Lane, Anna Nagar, Chennai 600040',
        phone: '+91 44 2616 7890',
        email: 'office@gracecommunity.in',
        registrationNumber: 'TN/REG/2018/0421',
        taxId: 'AABCG1234F',
      })
    }
  });

  // 3. Chart of Accounts (Indian Church Standard)
  console.log('Seeding Chart of Accounts...');
  const accountsData = [
    // Assets
    { code: '1010', name: 'Cash in Hand', type: 'Asset' },
    { code: '1020', name: 'HDFC Bank Account', type: 'Asset' },
    // Revenue (Income)
    { code: '3010', name: 'General Tithes', type: 'Revenue' },
    { code: '3020', name: 'Building Fund', type: 'Revenue' },
    { code: '3030', name: 'Special Offerings', type: 'Revenue' },
    { code: '3040', name: 'Missions Income', type: 'Revenue' },
    // Expenses
    { code: '4010', name: 'Pastor & Staff Salary', type: 'Expense' },
    { code: '4020', name: 'Church Rent', type: 'Expense' },
    { code: '4030', name: 'Electricity & Utilities', type: 'Expense' },
    { code: '4040', name: 'Outreach & Evangelism', type: 'Expense' },
    { code: '4050', name: 'Ministry Supplies', type: 'Expense' },
  ];

  const accounts: Record<string, any> = {};
  for (const acc of accountsData) {
    const created = await prisma.account.upsert({
      where: { tenantId_code: { tenantId, code: acc.code } },
      update: { name: acc.name, type: acc.type },
      create: { tenantId, ...acc, balance: 0 }
    });
    accounts[acc.code] = created;
  }

  // 4. Update Financial Settings Defaults
  await prisma.setting.upsert({
    where: { tenantId_key: { tenantId, key: 'financial' } },
    update: {
      value: JSON.stringify({
        currency: 'INR',
        financialYearStart: 'April',
        defaultAccounts: {
          cash: accounts['1010'].id,
          bank: accounts['1020'].id,
          tithes: accounts['3010'].id,
          offerings: accounts['3030'].id,
        },
        voucherPrefix: 'GZ-',
        numberingFormat: '00000'
      })
    },
    create: {
      tenantId,
      key: 'financial',
      value: JSON.stringify({
        currency: 'INR',
        financialYearStart: 'April',
        defaultAccounts: {
          cash: accounts['1010'].id,
          bank: accounts['1020'].id,
          tithes: accounts['3010'].id,
          offerings: accounts['3030'].id,
        },
        voucherPrefix: 'GZ-',
        numberingFormat: '00000'
      })
    }
  });

  // 5. Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { tenantId_username: { tenantId, username: 'admin' } },
    update: { roleId: superAdminRole.id },
    create: {
      tenantId,
      username: 'admin',
      email: 'admin@gracechurch.com',
      password: hashedPassword,
      roleId: superAdminRole.id
    }
  });

  // 6. Members (50)
  console.log('Seeding 50 Members...');
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

  const members = [];
  for (let i = 0; i < 50; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[Math.floor(i / 2.5) % lastNames.length];
    const m = await prisma.member.create({
      data: {
        tenantId,
        name: `${fn} ${ln}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}.${i}@example.com`,
        phone: `98765432${i.toString().padStart(2, '0')}`,
        status: 'Active',
        membershipDate: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 365)
      }
    });
    members.push(m);
  }

  // 7. Giving (50 Donations)
  console.log('Seeding 50 Donations + Vouchers...');
  await prisma.campaign.createMany({
    data: [
      { tenantId, name: 'Annual Harvest', goal: 500000 },
      { tenantId, name: 'Youth Camp 2026', goal: 100000 }
    ]
  });
  const campaignList = await prisma.campaign.findMany({ where: { tenantId } });

  for (let i = 0; i < 50; i++) {
    const member = members[i % members.length];
    const amount = Math.floor(Math.random() * 10000) + 500;
    const isBank = Math.random() > 0.5;
    const isTithes = Math.random() > 0.3;

    await GivingService.recordDonation(
      tenantId,
      {
        amount,
        donor: { connect: { id: member.id } },
        date: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 90),
        method: isBank ? 'Bank Transfer' : 'Cash',
        reference: `SEED-${i}`,
        campaign: { connect: { id: campaignList[i % campaignList.length].id } },
      } as any,
      {
        debitAccountId: isBank ? accounts['1020'].id : accounts['1010'].id,
        creditAccountId: isTithes ? accounts['3010'].id : accounts['3020'].id
      },
      { userId: adminUser.id }
    );
  }

  // 8. Website Content (7 Events, 10 Sermons)
  console.log('Seeding Website Content...');
  const eventTypes = ['Worship', 'Youth', 'Community', 'Prayer'];
  for (let i = 0; i < 7; i++) {
    await prisma.event.create({
      data: {
        tenantId,
        name: `${eventTypes[i % eventTypes.length]} Gathering #${i + 1}`,
        date: new Date(Date.now() + Math.random() * 1000 * 60 * 60 * 24 * 30),
        type: eventTypes[i % eventTypes.length]
      }
    });
  }

  for (let i = 0; i < 10; i++) {
    await prisma.sermon.create({
      data: {
        tenantId,
        title: `The Power of Grace - Part ${i + 1}`,
        speaker: i % 2 === 0 ? 'Pastor John Smith' : 'Pastor Mary Johnson',
        date: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 60),
        videoUrl: 'https://youtube.com/watch?v=example'
      }
    });
  }

  // 9. Apply Website Template
  console.log('Applying Website Template...');
  await WebsiteService.applyTemplate(tenantId, 'modern');

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
  console.log('Admin: admin / admin123');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect());
