import { prisma } from '../src/server/utils/prisma.js';

async function main() {
  console.log('Seeding Member Profile Test Data...');

  // 1. Ensure a Tenant exists
  const tenant = await prisma.tenant.upsert({
    where: { id: 'test-tenant' },
    update: {},
    create: {
      id: 'test-tenant',
      name: 'Default Church'
    }
  });

  // 2. Create a Family
  const family = await prisma.family.create({
    data: {
      tenantId: tenant.id,
      name: 'Smith Family'
    }
  });

  // 3. Create the Main Member
  const john = await prisma.member.create({
    data: {
      tenantId: tenant.id,
      familyId: family.id,
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+1 555-0100',
      role: 'Finance Committee Lead',
      dob: new Date('1980-05-15T00:00:00Z'),
      membershipDate: new Date('2020-01-10T00:00:00Z'),
      status: 'Active',
      growthStage: 'Leader'
    }
  });

  // 4. Create Family Members
  await prisma.member.create({
    data: {
      tenantId: tenant.id,
      familyId: family.id,
      name: 'Sarah Smith',
      email: 'sarah.smith@example.com',
      phone: '+1 555-0101',
      role: 'Childrens Ministry',
      dob: new Date('1982-08-22T00:00:00Z'),
      membershipDate: new Date('2020-01-10T00:00:00Z'),
      status: 'Active',
      growthStage: 'Leader'
    }
  });

  // 5. Add Spiritual Milestones
  await prisma.spiritualMilestone.createMany({
    data: [
      {
        tenantId: tenant.id,
        memberId: john.id,
        type: 'Salvation',
        date: new Date('1995-07-10T00:00:00Z'),
        notes: 'At youth camp'
      },
      {
        tenantId: tenant.id,
        memberId: john.id,
        type: 'Baptism',
        date: new Date('1995-08-15T00:00:00Z'),
        notes: 'Baptized by Pastor Dave'
      },
      {
        tenantId: tenant.id,
        memberId: john.id,
        type: 'SmallGroupLeader',
        date: new Date('2022-03-01T00:00:00Z'),
        notes: 'Leading the downtown men\'s group'
      }
    ]
  });

  // 6. Add Documents
  await prisma.memberDocument.createMany({
    data: [
      {
        tenantId: tenant.id,
        memberId: john.id,
        type: 'Aadhaar',
        number: 'XXXX-XXXX-1234',
        verified: true,
        notes: 'Verified physically'
      },
      {
        tenantId: tenant.id,
        memberId: john.id,
        type: 'BaptismCert',
        verified: true
      }
    ]
  });

  // 7. Add Donations
  await prisma.donation.createMany({
    data: [
      {
        tenantId: tenant.id,
        donorId: john.id,
        amount: 500,
        date: new Date('2023-11-01T10:00:00Z'),
        method: 'Bank Transfer'
      },
      {
        tenantId: tenant.id,
        donorId: john.id,
        amount: 250,
        date: new Date('2023-12-05T10:00:00Z'),
        method: 'Card'
      }
    ]
  });

  // 8. Add Member Responsibilities (NEW)
  await prisma.memberResponsibility.createMany({
    data: [
      {
        tenantId: tenant.id,
        memberId: john.id,
        role: 'Event Treasurer',
        entityType: 'Event',
        entityId: 'evt_youth_retreat',
        status: 'Active',
        allocatedFunds: 5000,
        usedFunds: 3250.50,
        notes: 'Handling catering and venue payments'
      },
      {
        tenantId: tenant.id,
        memberId: john.id,
        role: 'Small Group Leader',
        entityType: 'Group',
        entityId: 'grp_downtown_mens',
        status: 'Active',
        notes: 'Meets Tuesday nights'
      }
    ]
  });

  console.log(`Successfully seeded Member Profile Test Data!`);
  console.log(`Test Member ID: ${john.id}`);
  console.log(`Go to: /members/${john.id} in your UI to test the profile.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
