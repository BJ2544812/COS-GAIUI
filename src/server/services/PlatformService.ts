import { prisma } from '../utils/prisma.js';
import { EventBus } from '../events/eventBus.js';
import { getSocketHub } from '../realtime/socketHub.js';
import { FeatureFlagService } from './FeatureFlagService.js';
import { MinistryIntelligenceService } from './MinistryIntelligenceService.js';

type HealthProbe = { name: string; status: 'up' | 'down' | 'degraded'; detail?: string; ms?: number };

export class PlatformService {
  static async getPlatformHealth(tenantId: string) {
    const probes: HealthProbe[] = [];
    const t0 = Date.now();

    try {
      await prisma.$queryRaw`SELECT 1`;
      probes.push({ name: 'database', status: 'up', ms: Date.now() - t0 });
    } catch (e) {
      probes.push({
        name: 'database',
        status: 'down',
        detail: e instanceof Error ? e.message : 'unavailable',
      });
    }

    const redisUrl = process.env.REDIS_URL?.trim();
    probes.push({
      name: 'redis',
      status: redisUrl ? 'up' : 'degraded',
      detail: redisUrl ? 'configured' : 'not configured — sync queue mode',
    });

    const socket = getSocketHub();
    probes.push({
      name: 'socketio',
      status: socket ? 'up' : 'down',
      detail: socket ? 'listening' : 'not initialized',
    });

    let eventStats = { pending: 0, failed: 0, processed: 0 };
    try {
      eventStats = await EventBus.getEventStats(tenantId);
      probes.push({
        name: 'event_worker',
        status: eventStats.failed > 10 ? 'degraded' : 'up',
        detail: `pending ${eventStats.pending}, failed ${eventStats.failed}`,
      });
    } catch (e) {
      probes.push({
        name: 'event_worker',
        status: 'degraded',
        detail: e instanceof Error ? e.message : 'stats unavailable',
      });
    }

    const analyticsCount = await prisma.analyticsEvent.count({
      where: { tenantId, timestamp: { gte: new Date(Date.now() - 86400000) } },
    });
    probes.push({
      name: 'analytics_ingestion',
      status: 'up',
      detail: `${analyticsCount} events (24h)`,
    });

    const down = probes.filter((p) => p.status === 'down').length;
    const degraded = probes.filter((p) => p.status === 'degraded').length;

    return {
      generatedAt: new Date().toISOString(),
      overall: down > 0 ? 'down' : degraded > 0 ? 'degraded' : 'healthy',
      probes,
      eventQueue: eventStats,
    };
  }

  static async globalSearch(tenantId: string, query: string, limit = 8) {
    const q = query.trim();
    if (q.length < 2) {
      return {
        members: [],
        events: [],
        tasks: [],
        notifications: [],
        volunteers: [],
        prayers: [],
        outreach: [],
        workflows: [],
      };
    }

    const contains = { contains: q, mode: 'insensitive' as const };

    const [members, events, tasks, notifications, volunteers, prayers, outreach, workflows] =
      await Promise.all([
      prisma.member.findMany({
        where: { tenantId, status: 'Active', OR: [{ name: contains }, { email: contains }, { phone: contains }] },
        select: { id: true, name: true, email: true, growthStage: true },
        take: limit,
      }),
      prisma.event.findMany({
        where: { tenantId, OR: [{ name: contains }, { location: contains }, { type: contains }] },
        select: { id: true, name: true, type: true, date: true, status: true },
        orderBy: { date: 'desc' },
        take: limit,
      }),
      prisma.task.findMany({
        where: { tenantId, OR: [{ title: contains }, { description: contains }] },
        select: { id: true, title: true, status: true, dueDate: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.findMany({
        where: { tenantId, OR: [{ title: contains }, { message: contains }] },
        select: { id: true, title: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.memberResponsibility.findMany({
        where: {
          tenantId,
          status: 'Active',
          OR: [{ role: contains }, { member: { name: contains } }],
        },
        select: {
          id: true,
          role: true,
          entityType: true,
          entityId: true,
          member: { select: { id: true, name: true } },
        },
        take: limit,
      }),
      prisma.prayerRequest.findMany({
        where: {
          tenantId,
          OR: [{ content: contains }, { requester: { name: contains } }],
        },
        select: { id: true, content: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.outreachFollowUp.findMany({
        where: {
          tenantId,
          OR: [{ notes: contains }, { contact: { name: contains } }],
        },
        select: {
          id: true,
          status: true,
          contact: { select: { id: true, name: true } },
        },
        take: limit,
      }),
      prisma.eventLog.findMany({
        where: {
          tenantId,
          OR: [{ eventName: contains }, { entityType: contains }, { error: contains }],
        },
        select: {
          id: true,
          eventName: true,
          status: true,
          occurredAt: true,
          error: true,
        },
        orderBy: { occurredAt: 'desc' },
        take: limit,
      }),
    ]);

    return {
      members,
      events,
      tasks,
      notifications,
      volunteers,
      prayers,
      outreach,
      workflows,
      query: q,
    };
  }

  static async getAdminOverview(tenantId: string) {
    const [health, flags, campuses, users, eventStats, recentFailures] = await Promise.all([
      this.getPlatformHealth(tenantId),
      FeatureFlagService.getFlags(tenantId),
      prisma.campus.findMany({ where: { tenantId }, select: { id: true, name: true, type: true } }),
      prisma.user.findMany({
        where: { tenantId },
        select: { id: true, email: true, username: true, status: true, role: { select: { name: true } } },
        take: 50,
      }),
      EventBus.getEventStats(tenantId),
      prisma.eventLog.findMany({
        where: { tenantId, status: 'FAILED' },
        orderBy: { occurredAt: 'desc' },
        take: 15,
      }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      health,
      featureFlags: flags,
      campuses,
      users,
      eventQueue: eventStats,
      recentFailures,
    };
  }

  static async getComplianceAudit(tenantId: string, limit = 100) {
    const [domainEvents, financialLogs] = await Promise.all([
      prisma.eventLog.findMany({
        where: { tenantId },
        orderBy: { occurredAt: 'desc' },
        take: limit,
      }),
      prisma.financialAuditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);
    return { domainEvents, financialLogs };
  }

  static async exportCsvReport(
    tenantId: string,
    kind: 'attendance' | 'volunteer' | 'operational' | 'readiness',
  ): Promise<{ filename: string; csv: string }> {
    const esc = (v: unknown) => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    if (kind === 'attendance') {
      const since = new Date(Date.now() - 30 * 86400000);
      const rows = await prisma.attendance.findMany({
        where: { tenantId, checkInTime: { gte: since } },
        include: { member: { select: { name: true } }, session: { select: { name: true } } },
        orderBy: { checkInTime: 'desc' },
        take: 5000,
      });
      const header = 'checkInTime,member,visitor,session,method';
      const lines = rows.map(
        (r) =>
          `${esc(r.checkInTime.toISOString())},${esc(r.member?.name)},${esc(r.visitorName)},${esc(r.session?.name)},${esc(r.method)}`,
      );
      return { filename: `attendance-${Date.now()}.csv`, csv: [header, ...lines].join('\n') };
    }

    if (kind === 'volunteer') {
      const rows = await prisma.memberResponsibility.findMany({
        where: { tenantId },
        include: { member: { select: { name: true } } },
        take: 2000,
      });
      const header = 'member,role,status,entityType,entityId,startDate';
      const lines = rows.map(
        (r) =>
          `${esc(r.member?.name)},${esc(r.role)},${esc(r.status)},${esc(r.entityType)},${esc(r.entityId)},${esc(r.startDate.toISOString())}`,
      );
      return { filename: `volunteers-${Date.now()}.csv`, csv: [header, ...lines].join('\n') };
    }

    if (kind === 'readiness') {
      const exec = await MinistryIntelligenceService.getExecutiveDashboard(tenantId);
      const header = 'metric,value';
      const lines = [
        `engagementScore,${exec.ministryHealth.engagementScore}`,
        `serviceReadiness,${exec.operationalHealth.serviceReadiness}`,
        `blockedServices,${exec.operationalHealth.blockedServices}`,
        `trackedVolunteers,${exec.volunteerEngagement.trackedVolunteers}`,
        `eventAttendance,${exec.attendanceTrend.eventAttendanceTotal}`,
      ];
      return { filename: `readiness-${Date.now()}.csv`, csv: [header, ...lines].join('\n') };
    }

    const health = await this.getPlatformHealth(tenantId);
    const header = 'probe,status,detail';
    const lines = health.probes.map((p) => `${esc(p.name)},${esc(p.status)},${esc(p.detail)}`);
    return { filename: `operational-health-${Date.now()}.csv`, csv: [header, ...lines].join('\n') };
  }

  static async logClientError(
    tenantId: string,
    payload: { message: string; stack?: string; module?: string; userId?: string },
  ) {
    await EventBus.publish({
      eventName: 'ClientOperationalError',
      tenantId,
      entityId: tenantId,
      entityType: 'Tenant',
      payload: { ...payload, at: new Date().toISOString() },
    });
    return { logged: true };
  }
}
