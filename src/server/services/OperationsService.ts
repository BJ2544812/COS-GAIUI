import { OperationsRepository } from '../repositories/OperationsRepository.js';
import {
  resolveOperationalLens,
  scoreEventReadiness,
  scoreServiceReadiness,
} from '../utils/operationalReadiness.js';
import { EventBus } from '../events/eventBus.js';
import { VolunteerOpsService } from './VolunteerOpsService.js';

type RunSheetRow = { id?: string };

function runSheetCount(runSheet: unknown): number {
  return Array.isArray(runSheet) ? runSheet.length : 0;
}

export class OperationsService {
  static async getCommandCenter(
    tenantId: string,
    user: { id: string; role: string; permissions: string[] },
    campusId?: string,
  ) {
    const { cacheThrough } = await import('../utils/opsCache.js');
    const cacheKey = `ops:command-center:${tenantId}:${user.id}:${campusId ?? 'all'}`;
    return cacheThrough(cacheKey, 25_000, () => this.buildCommandCenter(tenantId, user, campusId));
  }

  private static async buildCommandCenter(
    tenantId: string,
    user: { id: string; role: string; permissions: string[] },
    campusId?: string,
  ) {
    const lens = resolveOperationalLens({ role: user.role, permissions: user.permissions });

    const [
      upcomingEvents,
      todayServices,
      volunteerGaps,
      myTasks,
      teamTasks,
      overdueTasks,
      recentActivity,
      openSessions,
      unreadCount,
      recentNotifications,
    ] = await Promise.all([
      OperationsRepository.getUpcomingEvents(tenantId, 12, campusId),
      OperationsRepository.getTodayServices(tenantId, campusId),
      OperationsRepository.getVolunteerGaps(tenantId, 2, campusId),
      OperationsRepository.getOperationalTasks(tenantId, user.id),
      OperationsRepository.getTeamTasks(tenantId),
      OperationsRepository.getOverdueTasks(tenantId),
      OperationsRepository.getRecentDomainActivity(tenantId),
      OperationsRepository.getOpenAttendanceSessions(tenantId),
      OperationsRepository.getUnreadNotificationCount(tenantId, user.id, user.role),
      OperationsRepository.getRecentNotifications(tenantId, user.id, user.role),
    ]);

    const eventsWithReadiness = await Promise.all(
      upcomingEvents.map(async (ev) => {
        const volunteerCount = await OperationsRepository.countEventVolunteers(tenantId, ev.id);
        const readiness =
          ev.type === 'Service'
            ? scoreServiceReadiness({
                status: ev.status,
                date: ev.date,
                volunteerCount,
                runSheetSegments: runSheetCount(ev.runSheet),
              })
            : scoreEventReadiness({
                status: ev.status,
                date: ev.date,
                registrationOpen: ev.registrationOpen,
                volunteerCount,
                runSheetSegments: runSheetCount(ev.runSheet),
                attendanceSessionCount: ev.attendanceSessions?.length ?? 0,
              });
        return {
          id: ev.id,
          name: ev.name,
          type: ev.type,
          date: ev.date,
          status: ev.status,
          location: ev.location,
          volunteerCount,
          readiness,
        };
      }),
    );

    const servicesWithReadiness = await Promise.all(
      todayServices.map(async (svc) => {
        const volunteerCount = await OperationsRepository.countEventVolunteers(tenantId, svc.id);
        return {
          id: svc.id,
          name: svc.name,
          date: svc.date,
          status: svc.status,
          volunteerCount,
          readiness: scoreServiceReadiness({
            status: svc.status,
            date: svc.date,
            volunteerCount,
            runSheetSegments: runSheetCount(svc.runSheet),
          }),
        };
      }),
    );

    const pendingApprovals = upcomingEvents.filter((e) =>
      ['DRAFT', 'REVIEW'].includes(e.status),
    );

    const blockedCount = eventsWithReadiness.filter((e) => e.readiness.level === 'BLOCKED').length;
    const warningCount = eventsWithReadiness.filter((e) => e.readiness.level === 'WARNING').length;

    return {
      lens,
      generatedAt: new Date().toISOString(),
      summary: {
        todayServiceCount: servicesWithReadiness.length,
        upcomingEventCount: eventsWithReadiness.length,
        volunteerGapCount: volunteerGaps.length,
        pendingApprovalCount: pendingApprovals.length,
        overdueTaskCount: overdueTasks.length,
        openCheckInCount: openSessions.length,
        unreadNotificationCount: unreadCount,
        blockedOperations: blockedCount,
        warningOperations: warningCount,
      },
      todayServices: servicesWithReadiness,
      upcomingEvents: eventsWithReadiness,
      volunteerGaps,
      pendingApprovals: pendingApprovals.map((e) => ({
        id: e.id,
        name: e.name,
        status: e.status,
        date: e.date,
      })),
      myTasks,
      teamTasks: lens === 'super_admin' || lens === 'operations' ? teamTasks : [],
      overdueTasks,
      recentActivity: recentActivity.map((log) => ({
        id: log.id,
        eventName: log.eventName,
        entityType: log.entityType,
        entityId: log.entityId,
        status: log.status,
        createdAt: log.occurredAt,
        processedAt: log.processedAt,
        error: log.error,
      })),
      openAttendanceSessions: openSessions,
      notifications: recentNotifications,
    };
  }

  static async getOperationalInsights(tenantId: string, campusId?: string) {
    const [volunteerInsights, upcomingEvents, volunteerGaps, overdueTasks, recentActivity] =
      await Promise.all([
        VolunteerOpsService.getVolunteerInsights(tenantId),
        OperationsRepository.getUpcomingEvents(tenantId, 12, campusId),
        OperationsRepository.getVolunteerGaps(tenantId, 2, campusId),
        OperationsRepository.getOverdueTasks(tenantId),
        OperationsRepository.getRecentDomainActivity(tenantId),
      ]);

    const readinessSamples = await Promise.all(
      upcomingEvents.slice(0, 8).map(async (ev) => {
        const volunteerCount = await OperationsRepository.countEventVolunteers(tenantId, ev.id);
        const readiness =
          ev.type === 'Service'
            ? scoreServiceReadiness({
                status: ev.status,
                date: ev.date,
                volunteerCount,
                runSheetSegments: runSheetCount(ev.runSheet),
              })
            : scoreEventReadiness({
                status: ev.status,
                date: ev.date,
                registrationOpen: ev.registrationOpen,
                volunteerCount,
                runSheetSegments: runSheetCount(ev.runSheet),
                attendanceSessionCount: ev.attendanceSessions?.length ?? 0,
              });
        return { id: ev.id, name: ev.name, type: ev.type, readiness };
      }),
    );

    const blocked = readinessSamples.filter((r) => r.readiness.level === 'BLOCKED');
    const warning = readinessSamples.filter((r) => r.readiness.level === 'WARNING');
    const workflowFailures = recentActivity.filter((l) => l.status === 'FAILED').length;

    return {
      generatedAt: new Date().toISOString(),
      volunteer: volunteerInsights,
      readinessTrend: {
        blockedCount: blocked.length,
        warningCount: warning.length,
        averageScore:
          readinessSamples.length > 0
            ? Math.round(
                readinessSamples.reduce((s, r) => s + r.readiness.score, 0) / readinessSamples.length,
              )
            : 100,
        samples: readinessSamples,
      },
      predictive: {
        volunteerShortageRisk: volunteerGaps.length >= 2 || volunteerInsights.shortageRoles.length > 0,
        burnoutRisk: volunteerInsights.overloadedMembers.length >= 3,
        serviceRisk: blocked.some((b) => b.type === 'Service'),
        operationalDelayRisk: overdueTasks.length > 0 || workflowFailures > 0,
      },
      bottlenecks: {
        volunteerGaps: volunteerGaps.slice(0, 8),
        overdueTasks: overdueTasks.length,
        workflowFailures,
        blockedOperations: blocked.map((b) => ({ id: b.id, name: b.name, score: b.readiness.score })),
      },
    };
  }

  static async publishOperationalRefresh(tenantId: string, reason: string) {
    await EventBus.publish({
      eventName: 'OperationalRefresh',
      tenantId,
      entityId: tenantId,
      entityType: 'Tenant',
      payload: { reason },
    });
  }
}
