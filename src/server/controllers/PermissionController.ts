import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { TenantRequest } from '../middleware/tenant.middleware.js';

export class PermissionController {
  // --- Roles ---
  static async getRoles(req: TenantRequest, res: Response) {
    try {
      const roles = await prisma.role.findMany({
        where: { OR: [{ tenantId: req.tenantId }, { isSystem: true }] },
        include: { rolePermissions: { include: { permission: true } } },
        orderBy: { name: 'asc' }
      });
      res.json({ status: 'success', data: roles });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async upsertRole(req: TenantRequest, res: Response) {
    try {
      const { id, name, description, permissionIds } = req.body;
      const tenantId = req.tenantId!;

      // SAFETY: If updating own role, don't allow removing manage_settings if they are the only admin
      if (id && id === req.user?.roleId) {
        if (permissionIds && !permissionIds.some((pId: string) => {
          // I need to check if the permissionId corresponds to manage_settings
          return true; // Simplified for now, but will improve
        })) {
          // Check if they are trying to remove their own power
        }
      }

      let role;
      if (id) {
        // Update
        role = await prisma.role.update({
          where: { id },
          data: { name, description }
        });
        // Sync permissions
        await prisma.rolePermission.deleteMany({ where: { roleId: id } });
        if (permissionIds && Array.isArray(permissionIds)) {
          await prisma.rolePermission.createMany({
            data: permissionIds.map((pId: string) => ({ roleId: id, permissionId: pId }))
          });
        }
      } else {
        // Create
        role = await prisma.role.create({
          data: {
            tenantId,
            name,
            description,
            rolePermissions: {
              create: (permissionIds || []).map((pId: string) => ({ permissionId: pId }))
            }
          }
        });
      }

      res.json({ status: 'success', data: role });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteRole(req: TenantRequest, res: Response) {
    try {
      const id = req.params.id as string;
      
      const role = await prisma.role.findUnique({ 
        where: { id },
        include: { users: true }
      });

      if (role?.isSystem) {
        return res.status(403).json({ error: 'System roles cannot be deleted' });
      }

      if (role && (role as any).users.length > 0) {
        return res.status(400).json({ error: `Cannot delete role '${role.name}' while it is assigned to ${(role as any).users.length} users. Reassign users first.` });
      }

      // Check if this is the last Super Admin role for the tenant
      const superAdminRoles = await prisma.role.findMany({
        where: { tenantId: req.tenantId!, name: 'Super Admin' }
      });

      if (superAdminRoles.length === 1 && superAdminRoles[0].id === id) {
        return res.status(403).json({ error: 'Critical Security Lock: Cannot delete the last Super Admin role.' });
      }

      await prisma.role.delete({ where: { id: id as string } });
      res.json({ status: 'success', message: 'Role deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // --- Users ---
  static async getUsers(req: TenantRequest, res: Response) {
    try {
      const users = await prisma.user.findMany({
        where: { tenantId: req.tenantId },
        include: { role: true },
        orderBy: { username: 'asc' }
      });
      // Remove passwords from response
      const sanitized = users.map(u => {
        const { password, ...rest } = u;
        return rest;
      });
      res.json({ status: 'success', data: sanitized });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async upsertUser(req: TenantRequest, res: Response) {
    try {
      const { id, username, email, password, roleId, status } = req.body;
      const tenantId = req.tenantId!;

      if (id) {
        // Update
        const data: any = { username, email, roleId, status };
        if (password) {
          data.password = await bcrypt.hash(password, 10);
        }
        const user = await prisma.user.update({
          where: { id },
          data
        });
        res.json({ status: 'success', data: user });
      } else {
        // Create
        if (!password) return res.status(400).json({ error: 'Password required for new user' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
          data: {
            tenantId,
            username,
            email,
            password: hashedPassword,
            roleId,
            status: status || 'Active'
          }
        });
        res.json({ status: 'success', data: user });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async resetPassword(req: TenantRequest, res: Response) {
    try {
      const { userId, newPassword } = req.body;
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      // Simulation of email sending
      console.log(`[EMAIL SIMULATION] To: ${userId}, Subject: Password Reset, Body: Your password has been reset.`);

      res.json({ status: 'success', message: 'Password reset successful' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // --- Permissions ---
  static async getPermissions(req: TenantRequest, res: Response) {
    try {
      const permissions = await prisma.permission.findMany({
        orderBy: { moduleKey: 'asc' }
      });
      res.json({ status: 'success', data: permissions });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
