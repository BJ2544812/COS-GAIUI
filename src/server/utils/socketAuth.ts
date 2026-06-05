import jwt from 'jsonwebtoken';
import { prisma } from './prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'church-erp-super-secret-key-2026';

export type SocketUser = {
  id: string;
  tenantId: string;
  role: string;
  permissions: string[];
};

export async function verifySocketToken(token: string | undefined): Promise<SocketUser | null> {
  if (!token || typeof token !== 'string') return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id?: string; tenantId?: string };
    if (!decoded.id || !decoded.tenantId) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
      },
    });
    if (!user || user.status !== 'Active' || user.tenantId !== decoded.tenantId) return null;

    const permissions =
      user.role?.rolePermissions
        ?.map((rp) => rp.permission?.moduleKey)
        .filter((k): k is string => typeof k === 'string' && k.length > 0) ?? [];

    return {
      id: user.id,
      tenantId: user.tenantId,
      role: user.role?.name ?? 'User',
      permissions,
    };
  } catch {
    return null;
  }
}
