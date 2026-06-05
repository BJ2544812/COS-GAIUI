import { prisma } from '../utils/prisma.js';
import { MinistryIntelligenceService } from './MinistryIntelligenceService.js';
import { NotificationService } from './NotificationService.js';
import { OutreachOperationsService } from './OutreachOperationsService.js';

export type DigestType =
  | 'daily_ops'
  | 'sunday_readiness'
  | 'volunteer_shortage'
  | 'pastoral_followup'
  | 'executive_summary';

export class DigestService {
  static async generate(tenantId: string, digestType: DigestType) {
    let payload: Record<string, unknown> = {};

    if (digestType === 'daily_ops') {
      const [events, tasks, failures] = await Promise.all([
        prisma.event.count({ where: { tenantId, date: { gte: new Date() } } }),
        prisma.task.count({ where: { tenantId, status: 'PENDING' } }),
        prisma.eventLog.count({ where: { tenantId, status: 'FAILED' } }),
      ]);
      payload = { eventsToday: events, pendingTasks: tasks, failedEvents: failures };
    } else if (digestType === 'sunday_readiness') {
      const exec = await MinistryIntelligenceService.getExecutiveDashboard(tenantId);
      payload = {
        serviceReadiness: exec.operationalHealth.serviceReadiness,
        blockedServices: exec.operationalHealth.blockedServices,
        engagementScore: exec.ministryHealth.engagementScore,
      };
    } else if (digestType === 'volunteer_shortage') {
      const open = await prisma.memberResponsibility.count({
        where: { tenantId, status: 'Active', role: { contains: 'Volunteer' } },
      });
      const events = await prisma.event.findMany({
        where: { tenantId, date: { gte: new Date(), lte: new Date(Date.now() + 7 * 86400000) } },
        select: { id: true, name: true },
        take: 10,
      });
      payload = { activeVolunteerRoles: open, upcomingEvents: events };
    } else if (digestType === 'pastoral_followup') {
      const dash = await OutreachOperationsService.getDashboard(tenantId);
      const care = await prisma.careCase.count({
        where: { tenantId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      });
      payload = { outreach: dash.stats, openCareCases: care };
    } else if (digestType === 'executive_summary') {
      const exec = await MinistryIntelligenceService.getExecutiveDashboard(tenantId);
      payload = { executive: exec };
    }

    const row = await prisma.operationalDigest.create({
      data: {
        tenantId,
        digestType,
        payload: JSON.stringify(payload),
      },
    });

    const titleMap: Record<DigestType, string> = {
      daily_ops: 'Daily operations digest',
      sunday_readiness: 'Sunday readiness digest',
      volunteer_shortage: 'Volunteer coverage digest',
      pastoral_followup: 'Pastoral follow-up digest',
      executive_summary: 'Executive summary digest',
    };

    await NotificationService.createNotification({
      tenantId,
      targetRole: digestType === 'executive_summary' ? 'Admin' : 'Pastoral',
      type: `Digest_${digestType}`,
      title: titleMap[digestType],
      message: JSON.stringify(payload).slice(0, 500),
      priority: digestType === 'sunday_readiness' ? 'HIGH' : 'MEDIUM',
      actionType: 'VIEW_MODULE',
      actionLink: 'dashboard',
      expiresInDays: 7,
    });

    return row;
  }

  static async generateAllForTenant(tenantId: string) {
    const types: DigestType[] = [
      'daily_ops',
      'sunday_readiness',
      'volunteer_shortage',
      'pastoral_followup',
      'executive_summary',
    ];
    const results = [];
    for (const t of types) {
      results.push(await this.generate(tenantId, t));
    }
    return results;
  }

  static async listRecent(tenantId: string, limit = 20) {
    return prisma.operationalDigest.findMany({
      where: { tenantId },
      orderBy: { generatedAt: 'desc' },
      take: limit,
    });
  }
}
