import { prisma } from '../utils/prisma.js';
import { broadcastToTenant } from '../realtime/socketHub.js';

export class NotificationService {
  /**
   * Generates a notification for a specific user or a broadcast to a target role.
   * If userId is omitted, it relies on targetRole (e.g. 'Admin', 'Finance', 'Pastoral').
   */
  static async createNotification(data: {
    tenantId: string;
    type: string;
    title: string;
    message: string;
    userId?: string;
    targetRole?: string;
    priority?: string;
    actionType?: string;
    actionLink?: string;
    expiresInDays?: number;
  }) {
    const expiresAt = data.expiresInDays 
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000) 
      : null;

    const notification = await prisma.notification.create({
      data: {
        tenantId: data.tenantId,
        type: data.type,
        title: data.title,
        message: data.message,
        userId: data.userId || null,
        targetRole: data.targetRole || null,
        priority: data.priority || 'MEDIUM',
        actionType: data.actionType || null,
        actionLink: data.actionLink || null,
        expiresAt,
      },
    });

    broadcastToTenant(data.tenantId, 'notification:new', {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      actionType: notification.actionType,
      actionLink: notification.actionLink,
      status: notification.status,
      createdAt: notification.createdAt,
    });

    return notification;
  }

  static async getNotificationsForUser(tenantId: string, userId: string, userRole: string) {
    return prisma.notification.findMany({
      where: {
        tenantId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ],
        AND: [
          {
            OR: [
              { userId },
              { targetRole: { equals: userRole, mode: 'insensitive' } },
              { targetRole: { contains: 'Admin', mode: 'insensitive' }, userId: null }, // Admins see admin notices
              { targetRole: 'All' }
            ]
          }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  static async markAsRead(tenantId: string, notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { tenantId, id: notificationId },
      data: { status: 'read', readAt: new Date() }
    });
  }

  static async markAllAsRead(tenantId: string, userId: string, userRole: string) {
    const unread = await prisma.notification.findMany({
      where: {
        tenantId,
        status: 'unread',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ],
        AND: [
          {
            OR: [
              { userId },
              { targetRole: { equals: userRole, mode: 'insensitive' } },
              { targetRole: { contains: 'Admin', mode: 'insensitive' } },
              { targetRole: 'All' }
            ]
          }
        ]
      },
      select: { id: true }
    });

    if (unread.length > 0) {
      return prisma.notification.updateMany({
        where: { id: { in: unread.map(n => n.id) } },
        data: { status: 'read', readAt: new Date() }
      });
    }
    return { count: 0 };
  }
}
