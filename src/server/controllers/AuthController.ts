import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import { TenantRequest } from '../middleware/tenant.middleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'church-erp-super-secret-key-2026';

export class AuthController {
  static async login(req: TenantRequest, res: Response) {
    try {
      const { username, password } = req.body;
      if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
        return res.status(400).json({ error: 'username and password are required' });
      }
      const tenantId = req.tenantId!;

      const user = await prisma.user.findFirst({
        where: { username: username.trim(), tenantId },
        include: { role: { include: { rolePermissions: { include: { permission: true } } } } }
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const permissions = user.role.rolePermissions.map(rp => rp.permission.moduleKey);

      const token = jwt.sign(
        { id: user.id, username: user.username, roleId: user.roleId, tenantId, permissions },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(200).json({
        status: 'success',
        token,
        tenantId,
        user: {
          id: user.id,
          username: user.username,
          role: user.role.name,
          permissions,
          tenantId,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async me(req: TenantRequest, res: Response) {
    res.status(200).json({ status: 'success', user: req.user });
  }

  static async forgotPassword(req: TenantRequest, res: Response) {
    try {
      const { email } = req.body;
      const tenantId = req.tenantId!;

      const user = await prisma.user.findFirst({
        where: { email: email.trim(), tenantId }
      });

      if (!user) {
        // Return 200 anyway for security to prevent email enumeration
        return res.status(200).json({ status: 'success', message: 'If an account exists, a reset link has been sent.' });
      }

      // Generate 32 char hex token
      const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const expiry = new Date(Date.now() + 3600000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpiry: expiry }
      });

      const { emailService } = await import('../services/EmailService.js');
      await emailService.sendPasswordReset(user.email, token);

      res.status(200).json({ status: 'success', message: 'Reset link sent.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async resetPassword(req: TenantRequest, res: Response) {
    try {
      const { token, newPassword } = req.body;
      const tenantId = req.tenantId!;

      const user = await prisma.user.findFirst({
        where: { 
          resetToken: token, 
          resetTokenExpiry: { gt: new Date() },
          tenantId
        }
      });

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: { 
          password: hashedPassword, 
          resetToken: null, 
          resetTokenExpiry: null 
        }
      });

      res.status(200).json({ status: 'success', message: 'Password updated successfully.' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async setupTenant(req: TenantRequest, res: Response) {
    try {
      const existing = await prisma.tenant.count();
      if (existing > 0) {
        return res.status(409).json({
          error: 'A tenant already exists. Use the login screen or run migrations on an existing deployment.',
        });
      }

      const { tenantName, adminUsername, adminPassword, adminEmail } = req.body;

      const tenant = await prisma.tenant.create({
        data: { name: tenantName }
      });

      const adminRole = await prisma.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Super Admin',
          isSystem: true,
        }
      });

      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          username: adminUsername,
          email: adminEmail,
          password: hashedPassword,
          roleId: adminRole.id
        }
      });

      res.status(201).json({
        status: 'success',
        message: 'Tenant and Admin created successfully',
        tenantId: tenant.id,
      });

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
