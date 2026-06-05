import { prisma } from '../utils/prisma.js';
import { EventBus } from '../events/eventBus.js';
import { getMessageProviders, type MessageChannel } from './messaging/MessageProvider.js';

export type AudienceFilter = {
  campusId?: string;
  volunteerRole?: string;
  growthStage?: string;
  ministryId?: string;
  minEngagementScore?: number;
  attendedWithinDays?: number;
  eventId?: string;
};

type ResolvedRecipient = {
  memberId: string;
  memberName: string;
  userId?: string;
  email?: string | null;
  phone?: string | null;
  recipientKey: string;
};

export class CommunicationHubService {
  static parseFilter(raw: string | AudienceFilter): AudienceFilter {
    if (typeof raw === 'object') return raw;
    try {
      return JSON.parse(raw || '{}') as AudienceFilter;
    } catch {
      return {};
    }
  }

  static async resolveAudience(tenantId: string, filter: AudienceFilter): Promise<ResolvedRecipient[]> {
    const where: Record<string, unknown> = { tenantId, status: 'Active' };

    if (filter.growthStage) where.growthStage = filter.growthStage;

    let memberIds: string[] | undefined;

    if (filter.campusId) {
      const sessions = await prisma.attendanceSession.findMany({
        where: { tenantId, campusId: filter.campusId },
        select: { id: true },
        take: 200,
      });
      const sessionIds = sessions.map((s) => s.id);
      if (sessionIds.length > 0) {
        const regs = await prisma.attendance.findMany({
          where: { tenantId, sessionId: { in: sessionIds }, memberId: { not: null } },
          select: { memberId: true },
          distinct: ['memberId'],
        });
        memberIds = regs.map((r) => r.memberId).filter((id): id is string => !!id);
      }
    }

    if (filter.volunteerRole) {
      const roles = await prisma.memberResponsibility.findMany({
        where: { tenantId, role: filter.volunteerRole, status: 'Active' },
        select: { memberId: true },
      });
      const roleIds = roles.map((r) => r.memberId);
      memberIds = memberIds ? memberIds.filter((id) => roleIds.includes(id)) : roleIds;
    }

    if (filter.ministryId) {
      const mins = await prisma.memberResponsibility.findMany({
        where: { tenantId, entityType: 'Ministry', entityId: filter.ministryId, status: 'Active' },
        select: { memberId: true },
      });
      const mIds = mins.map((r) => r.memberId);
      memberIds = memberIds ? memberIds.filter((id) => mIds.includes(id)) : mIds;
    }

    if (filter.attendedWithinDays) {
      const since = new Date(Date.now() - filter.attendedWithinDays * 86400000);
      const att = await prisma.attendance.findMany({
        where: { tenantId, checkInTime: { gte: since }, memberId: { not: null } },
        select: { memberId: true },
        distinct: ['memberId'],
      });
      const aIds = att.map((a) => a.memberId!).filter(Boolean);
      memberIds = memberIds ? memberIds.filter((id) => aIds.includes(id)) : aIds;
    }

    if (filter.eventId) {
      const sessions = await prisma.attendanceSession.findMany({
        where: { tenantId, eventId: filter.eventId },
        select: { id: true },
      });
      const sessionIds = sessions.map((s) => s.id);
      const att =
        sessionIds.length > 0
          ? await prisma.attendance.findMany({
              where: { tenantId, sessionId: { in: sessionIds }, memberId: { not: null } },
              select: { memberId: true },
              distinct: ['memberId'],
            })
          : [];
      const eIds = att.map((a) => a.memberId!).filter(Boolean);
      memberIds = memberIds ? memberIds.filter((id) => eIds.includes(id)) : eIds;
    }

    if (filter.minEngagementScore != null) {
      const snaps = await prisma.memberEngagementSnapshot.findMany({
        where: { tenantId, score: { gte: filter.minEngagementScore } },
        orderBy: { calculatedAt: 'desc' },
        distinct: ['memberId'],
        select: { memberId: true },
      });
      const sIds = snaps.map((s) => s.memberId);
      memberIds = memberIds ? memberIds.filter((id) => sIds.includes(id)) : sIds;
    }

    const members = await prisma.member.findMany({
      where: {
        ...where,
        ...(memberIds ? { id: { in: memberIds } } : {}),
      },
      select: { id: true, name: true, email: true, phone: true },
      take: 2000,
    });

    const users = await prisma.user.findMany({
      where: { tenantId, memberId: { in: members.map((m) => m.id) } },
      select: { id: true, memberId: true },
    });
    const userByMember = new Map(users.map((u) => [u.memberId!, u.id]));

    return members.map((m) => ({
      memberId: m.id,
      memberName: m.name,
      userId: userByMember.get(m.id),
      email: m.email,
      phone: m.phone,
      recipientKey: m.email || m.phone || m.id,
    }));
  }

  static async getCommandCenter(tenantId: string) {
    const [campaigns, deliveries, logs, notifications] = await Promise.all([
      prisma.communicationCampaign.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.communicationDelivery.groupBy({
        by: ['status'],
        where: { tenantId, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
        _count: true,
      }),
      prisma.communicationLog.count({ where: { tenantId } }),
      prisma.notification.count({
        where: { tenantId, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      }),
    ]);

    const delivered = deliveries.find((d) => d.status === 'delivered')?._count ?? 0;
    const opened = deliveries.find((d) => d.status === 'opened')?._count ?? 0;
    const pending = deliveries.find((d) => d.status === 'pending')?._count ?? 0;
    const total = delivered + opened + pending || 1;

    return {
      campaigns,
      analytics: {
        deliveries30d: delivered + opened + pending,
        delivered,
        opened,
        openRate: Math.round((opened / total) * 100),
        engagementRate: Math.round(((opened + delivered) / total) * 100),
        logCount: logs,
        notifications7d: notifications,
      },
    };
  }

  static async createCampaign(
    tenantId: string,
    data: {
      title: string;
      body: string;
      channels: MessageChannel[];
      audienceFilter: AudienceFilter;
      scheduledAt?: string | null;
      createdById?: string;
    },
  ) {
    return prisma.communicationCampaign.create({
      data: {
        tenantId,
        title: data.title,
        body: data.body,
        channels: JSON.stringify(data.channels),
        audienceFilter: JSON.stringify(data.audienceFilter),
        status: data.scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        createdById: data.createdById ?? null,
      },
    });
  }

  static async sendCampaign(tenantId: string, campaignId: string) {
    const campaign = await prisma.communicationCampaign.findFirst({
      where: { id: campaignId, tenantId },
    });
    if (!campaign) throw new Error('Campaign not found');

    const channels = JSON.parse(campaign.channels || '[]') as MessageChannel[];
    const filter = this.parseFilter(campaign.audienceFilter);
    const audience = await this.resolveAudience(tenantId, filter);

    await prisma.communicationCampaign.update({
      where: { id: campaignId },
      data: { status: 'sending' },
    });

    const providers = getMessageProviders();
    let deliveryCount = 0;

    for (const recipient of audience) {
      for (const channel of channels) {
        const provider = providers.find((p) => p.channel === channel);
        if (!provider) continue;

        const result = await provider.send({
          tenantId,
          channel,
          recipientKey: recipient.recipientKey,
          memberId: recipient.memberId,
          userId: recipient.userId,
          subject: campaign.title,
          body: campaign.body,
          campaignId,
        });

        await prisma.communicationDelivery.create({
          data: {
            tenantId,
            campaignId,
            channel,
            recipientKey: recipient.recipientKey,
            memberId: recipient.memberId,
            userId: recipient.userId ?? null,
            status: result.status === 'delivered' ? 'delivered' : 'logged',
            deliveredAt: new Date(),
            errorMessage: result.detail ?? null,
          },
        });
        deliveryCount += 1;
      }
    }

    const updated = await prisma.communicationCampaign.update({
      where: { id: campaignId },
      data: { status: 'sent', sentAt: new Date() },
    });

    await EventBus.publish({
      eventName: 'CommunicationCampaignSent',
      tenantId,
      entityId: campaignId,
      entityType: 'CommunicationCampaign',
      payload: { title: campaign.title, deliveryCount, audienceSize: audience.length },
    });

    return { campaign: updated, deliveryCount, audienceSize: audience.length };
  }

  static async previewAudience(tenantId: string, filter: AudienceFilter) {
    const audience = await this.resolveAudience(tenantId, filter);
    return { count: audience.length, sample: audience.slice(0, 10) };
  }

  static async markDeliveryOpened(tenantId: string, deliveryId: string) {
    return prisma.communicationDelivery.updateMany({
      where: { id: deliveryId, tenantId },
      data: { status: 'opened', openedAt: new Date() },
    });
  }
}
