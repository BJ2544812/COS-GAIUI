import { prisma } from './utils/prisma.js';
import bcrypt from 'bcryptjs';

/**
 * Minimal roles/permissions seed for tenant `default-tenant-id` only.
 *
 * Canonical ministry demo dataset (members, events, giving, pathways, …):
 *   npm run seed  →  src/server/scripts/seed.ts
 */

async function main() {
  console.log('Seeding database with standardized permissions and roles...');

  // 1. Create Default Tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'default-tenant-id' },
    update: {},
    create: {
      id: 'default-tenant-id',
      name: 'Default Church Organization',
    },
  });

  // 2. Standardized Permission Keys (15 Core Keys)
  const permissionKeys = [
    'manage_members',
    'manage_events',
    'manage_attendance',
    'manage_giving',
    'manage_finance',
    'manage_assets',
    'manage_outreach',
    'manage_communication',
    'manage_discipleship',
    'manage_documents',
    'manage_website',
    'manage_settings',
    'manage_analytics',
    'approve_voucher',
    'post_voucher'
  ];

  const permissionsMap = new Map();
  for (const key of permissionKeys) {
    const p = await prisma.permission.upsert({
      where: { moduleKey: key },
      update: { name: key.replace('manage_', 'Manage ').replace('_', ' ') },
      create: {
        moduleKey: key,
        name: key.replace('manage_', 'Manage ').replace('_', ' '),
        description: `Access to ${key.replace('manage_', '')} module`,
      },
    });
    permissionsMap.set(key, p.id);
  }

  // 3. Define Roles
  const roles = [
    {
      name: 'Super Admin',
      description: 'Full administrative access to all system modules and settings.',
      isSystem: true,
      perms: permissionKeys
    },
    {
      name: 'Staff',
      description: 'Access to operations: members, attendance, events, and outreach.',
      isSystem: true,
      perms: ['manage_members', 'manage_events', 'manage_attendance', 'manage_outreach', 'manage_communication', 'manage_discipleship', 'manage_documents']
    },
    {
      name: 'Finance',
      description: 'Giving, accounting, assets, and voucher workflows.',
      isSystem: true,
      perms: ['manage_giving', 'manage_finance', 'manage_assets', 'manage_analytics', 'approve_voucher', 'post_voucher']
    },
    {
      name: 'Viewer',
      description: 'Restricted read-only access to system analytics and reports.',
      isSystem: true,
      perms: ['manage_analytics']
    }
  ];

  for (const roleDef of roles) {
    const role = await prisma.role.upsert({
      where: { 
        tenantId_name: {
          tenantId: tenant.id,
          name: roleDef.name
        }
      },
      update: {
        description: roleDef.description,
        isSystem: true // All default roles are protected
      },
      create: {
        tenantId: tenant.id,
        name: roleDef.name,
        description: roleDef.description,
        isSystem: true,
      },
    });

    // Clear and re-assign permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id }
    });

    for (const permKey of roleDef.perms) {
      const permId = permissionsMap.get(permKey);
      if (permId) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permId,
          },
        });
      }
    }
  }

  // 5. Create Admin User
  const adminRole = await prisma.role.findFirst({ where: { tenantId: tenant.id, name: 'Super Admin' } });
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { 
      tenantId_username: {
        tenantId: tenant.id,
        username: 'admin'
      }
    },
    update: {
      roleId: adminRole!.id,
    },
    create: {
      tenantId: tenant.id,
      username: 'admin',
      email: 'admin@church.com',
      password: hashedPassword,
      roleId: adminRole!.id,
    },
  });

  console.log('Seeding completed. Admin: admin / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
