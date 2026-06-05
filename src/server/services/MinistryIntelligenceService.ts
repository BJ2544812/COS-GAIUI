import { TaskTargetType } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { MinistryIntelligenceRepository } from '../repositories/MinistryIntelligenceRepository.js';
import { OperationsRepository } from '../repositories/OperationsRepository.js';
import {
  scoreEventReadiness,
  scoreServiceReadiness,
} from '../utils/operationalReadiness.js';
import { VolunteerOpsService } from './VolunteerOpsService.js';
import { EventBus } from '../events/eventBus.js';

const MS_DAY = 86_400_000;

type LiveOpsConfig = {
  volunteerPresence?: Record<string, string>;
  issues?: Array<{ id: string; text: string; severity?: string }>;
  mediaReady?: boolean;
  livestreamReady?: boolean;
  currentSegmentIndex?: number;
};

function runSheetLen(runSheet: unknown): number {
  return Array.isArray(runSheet) ? runSheet.length : 0;
}

function asOpsConfig(raw: unknown): LiveOpsConfig {
  return raw && typeof raw === 'object' ? (raw as LiveOpsConfig) : {};
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export class MinistryIntelligenceService {
  static async getVolunteerHealth(tenantId: string, campusId?: string) {
    const since90 = new Date(Date.now() - 90 * MS_DAY);
    const [assignments, attendanceGroups, volunteerInsights] = await Promise.all([
      MinistryIntelligenceRepository.getVolunteerAssignments(tenantId),
      MinistryIntelligenceRepository.getAttendanceByMember(tenantId, since90),
      VolunteerOpsService.getVolunteerInsights(tenantId),
    ]);

    const attendanceMap = new Map(attendanceGroups.map((a) => [a.memberId!, a._count.id]));
    const byMember = new Map<
      string,
      {
        memberId: string;
        name: string;
        growthStage: string | null;
        active: number;
        inactive: number;
        replacements: number;
        roles: Set<string>;
      }
    >();

    for (const a of assignments) {
      if (!a.member) continue;
      const cur = byMember.get(a.memberId) ?? {
        memberId: a.memberId,
        name: a.member.name,
        growthStage: a.member.growthStage,
        active: 0,
        inactive: 0,
        replacements: 0,
        roles: new Set<string>(),
      };
      if (a.status === 'Active') cur.active += 1;
      else cur.inactive += 1;
      if ((a.notes ?? '').toLowerCase().includes('replacement')) cur.replacements += 1;
      cur.roles.add(a.role);
      byMember.set(a.memberId, cur);
    }

    const profiles = [...byMember.values()].map((m) => {
      const attendance = attendanceMap.get(m.memberId) ?? 0;
      const totalRoles = m.active + m.inactive;
      const reliability = clampScore(
        totalRoles > 0 ? (m.active / totalRoles) * 60 + Math.min(attendance, 12) * 3.33 : attendance * 5,
      );
      const burnoutRisk =
        m.active >= 4 || (m.active >= 3 && attendance < 2);
      const excessiveServing = m.active >= 5;
      const leadershipReadiness =
        (m.growthStage === 'Leader' || m.growthStage === 'Staff') && m.active >= 2 && reliability >= 70;
      const ministryOverload = m.active >= 4 || m.roles.size >= 4;

      return {
        memberId: m.memberId,
        name: m.name,
        growthStage: m.growthStage,
        activeAssignments: m.active,
        reliabilityScore: reliability,
        attendance90d: attendance,
        replacementCount: m.replacements,
        burnoutRisk,
        excessiveServing,
        leadershipReadiness,
        ministryOverload,
        noShowRisk: m.active >= 2 && attendance === 0,
      };
    });

    profiles.sort(
      (a, b) =>
        Number(b.burnoutRisk) - Number(a.burnoutRisk) || b.activeAssignments - a.activeAssignments,
    );

    return {
      generatedAt: new Date().toISOString(),
      campusId: campusId ?? null,
      summary: {
        trackedVolunteers: profiles.length,
        burnoutRiskCount: profiles.filter((p) => p.burnoutRisk).length,
        overloadCount: profiles.filter((p) => p.ministryOverload).length,
        leadershipReadyCount: profiles.filter((p) => p.leadershipReadiness).length,
        avgReliability:
          profiles.length > 0
            ? Math.round(profiles.reduce((s, p) => s + p.reliabilityScore, 0) / profiles.length)
            : 0,
        shortageRoles: volunteerInsights.shortageRoles,
      },
      profiles: profiles.slice(0, 50),
      roleDistribution: volunteerInsights.roleDistribution,
      shortageRoles: volunteerInsights.shortageRoles,
    };
  }

  static async getServiceHealth(tenantId: string, campusId?: string) {
    const services = await MinistryIntelligenceRepository.getRecentServices(tenantId, 90, campusId);
    const failed = await MinistryIntelligenceRepository.getFailedDomainEvents(tenantId, 20);

    const items = await Promise.all(
      services.slice(0, 20).map(async (svc) => {
        const volunteerCount = await OperationsRepository.countEventVolunteers(tenantId, svc.id);
        const readiness = scoreServiceReadiness({
          status: svc.status,
          date: svc.date,
          volunteerCount,
          runSheetSegments: runSheetLen(svc.runSheet),
        });
        const ops = asOpsConfig(svc.opsConfig);
        const issues = ops.issues ?? [];
        const mediaIssues = issues.some((i) => /media|video|audio|stream/i.test(i.text));
        const delayRisk = readiness.level !== 'READY' && new Date(svc.date) > new Date(Date.now() - MS_DAY * 7);

        return {
          id: svc.id,
          name: svc.name,
          date: svc.date,
          status: svc.status,
          campusId: svc.campusId,
          readiness,
          volunteerCount,
          mediaReady: ops.mediaReady ?? false,
          livestreamReady: ops.livestreamReady ?? false,
          issueCount: issues.length,
          mediaIssues,
          delayRisk,
        };
      }),
    );

    const recurringFailures = failed.filter(
      (f) => f.entityType === 'Event' || /Service|Segment/i.test(f.eventName),
    ).length;

    return {
      generatedAt: new Date().toISOString(),
      campusId: campusId ?? null,
      trend: {
        avgReadinessScore:
          items.length > 0
            ? Math.round(items.reduce((s, i) => s + i.readiness.score, 0) / items.length)
            : 100,
        blockedCount: items.filter((i) => i.readiness.level === 'BLOCKED').length,
        mediaIssueCount: items.filter((i) => i.mediaIssues).length,
        volunteerShortageCount: items.filter((i) => i.volunteerCount < 2).length,
        recurringFailures,
      },
      services: items,
      alerts: items
        .filter((i) => i.readiness.level !== 'READY' || i.mediaIssues || i.delayRisk)
        .slice(0, 8)
        .map((i) => ({
          serviceId: i.id,
          name: i.name,
          level: i.readiness.level,
          message:
            i.volunteerCount < 2
              ? 'Volunteer shortage'
              : i.mediaIssues
                ? 'Media preparation issue'
                : 'Readiness attention needed',
        })),
    };
  }

  static async getEventHealth(tenantId: string, campusId?: string) {
    const since = new Date(Date.now() - 120 * MS_DAY);
    const events = await MinistryIntelligenceRepository.getRecentEvents(tenantId, 120, campusId);
    const eventIds = events.map((e) => e.id);
    const [volCounts, sessions, donations] = await Promise.all([
      MinistryIntelligenceRepository.getEventVolunteerCounts(tenantId, eventIds),
      MinistryIntelligenceRepository.getSessionAttendanceTotals(tenantId, since, campusId),
      MinistryIntelligenceRepository.getDonationsForEvents(tenantId, since),
    ]);

    const volMap = new Map(volCounts.map((v) => [v.entityId!, v._count.id]));
    const sessionByEvent = new Map<string, number>();
    for (const s of sessions) {
      if (s.eventId) {
        sessionByEvent.set(s.eventId, (sessionByEvent.get(s.eventId) ?? 0) + s._count.attendances);
      }
    }
    const donationMap = new Map(donations.map((d) => [d.eventId!, { total: Number(d._sum.amount ?? 0), count: d._count.id }]));

    const items = events.map((ev) => {
      const volunteers = volMap.get(ev.id) ?? 0;
      const attendance = sessionByEvent.get(ev.id) ?? 0;
      const donation = donationMap.get(ev.id);
      const readiness = scoreEventReadiness({
        status: ev.status,
        date: ev.date,
        registrationOpen: ev.registrationOpen,
        volunteerCount: volunteers,
        runSheetSegments: 0,
        attendanceSessionCount: sessions.filter((s) => s.eventId === ev.id).length,
      });
      const registrationConversion =
        ev.registrationOpen && ev.status === 'COMPLETED' ? (attendance > 0 ? 'converted' : 'low') : 'n/a';

      return {
        id: ev.id,
        name: ev.name,
        date: ev.date,
        status: ev.status,
        campusId: ev.campusId,
        volunteerUtilization: volunteers,
        attendance,
        donationTotal: donation?.total ?? 0,
        donationCount: donation?.count ?? 0,
        readiness,
        registrationConversion,
        engagementQuality: attendance >= 10 ? 'strong' : attendance >= 3 ? 'moderate' : 'low',
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      campusId: campusId ?? null,
      events: items.slice(0, 25),
      summary: {
        eventCount: items.length,
        strongEngagement: items.filter((i) => i.engagementQuality === 'strong').length,
        totalAttendance: items.reduce((s, i) => s + i.attendance, 0),
        totalDonations: items.reduce((s, i) => s + i.donationTotal, 0),
      },
    };
  }

  static async getPredictiveSignals(tenantId: string, campusId?: string) {
    const [volunteerHealth, serviceHealth, gaps, overdue] = await Promise.all([
      this.getVolunteerHealth(tenantId, campusId),
      this.getServiceHealth(tenantId, campusId),
      OperationsRepository.getVolunteerGaps(tenantId),
      OperationsRepository.getOverdueTasks(tenantId),
    ]);

    const since30 = new Date(Date.now() - 30 * MS_DAY);
    const lowAttendance = await MinistryIntelligenceRepository.getMembersWithLowAttendance(tenantId, since30, 0);

    return {
      generatedAt: new Date().toISOString(),
      campusId: campusId ?? null,
      staffingShortage: {
        risk: gaps.length >= 2 || volunteerHealth.summary.shortageRoles.length > 0,
        gapCount: gaps.length,
        roles: volunteerHealth.summary.shortageRoles ?? [],
      },
      burnout: {
        risk: volunteerHealth.summary.burnoutRiskCount >= 3,
        affectedCount: volunteerHealth.summary.burnoutRiskCount,
      },
      serviceRisk: {
        risk: serviceHealth.trend.blockedCount > 0 || serviceHealth.trend.recurringFailures > 0,
        blockedServices: serviceHealth.trend.blockedCount,
        failures: serviceHealth.trend.recurringFailures,
      },
      workflowBottleneck: {
        risk: overdue.length >= 5,
        overdueCount: overdue.length,
      },
      attendanceDrop: {
        risk: lowAttendance.length >= 10,
        inactiveMemberCount: lowAttendance.length,
      },
    };
  }

  static async getEngagementSignals(tenantId: string) {
    const since90 = new Date(Date.now() - 90 * MS_DAY);
    const [snapshots, attendanceGroups, assignments] = await Promise.all([
      MinistryIntelligenceRepository.getEngagementSnapshots(tenantId),
      MinistryIntelligenceRepository.getAttendanceByMember(tenantId, since90),
      MinistryIntelligenceRepository.getVolunteerAssignments(tenantId),
    ]);

    const attendanceMap = new Map(attendanceGroups.map((a) => [a.memberId!, a._count.id]));
    const volunteerMembers = new Set(
      assignments.filter((a) => a.status === 'Active').map((a) => a.memberId),
    );

    const scored = snapshots.map((s) => ({
      memberId: s.memberId,
      name: s.member.name,
      growthStage: s.member.growthStage,
      score: s.score,
      attendance90d: attendanceMap.get(s.memberId) ?? 0,
      serves: volunteerMembers.has(s.memberId),
      trend: s.score >= 70 ? 'engaged' : s.score >= 40 ? 'moderate' : 'at_risk',
    }));

    const inactive = scored.filter((m) => m.trend === 'at_risk' || m.attendance90d === 0);

    return {
      generatedAt: new Date().toISOString(),
      averageScore:
        scored.length > 0 ? Math.round(scored.reduce((s, m) => s + m.score, 0) / scored.length) : 0,
      engagedCount: scored.filter((m) => m.trend === 'engaged').length,
      atRiskCount: scored.filter((m) => m.trend === 'at_risk').length,
      inactiveMembers: inactive.slice(0, 30),
      participationScores: scored.slice(0, 40),
    };
  }

  static async getFollowUpPriority(tenantId: string) {
    const since21 = new Date(Date.now() - 21 * MS_DAY);
    const [lowAttendance, openTasks, visitors] = await Promise.all([
      MinistryIntelligenceRepository.getMembersWithLowAttendance(tenantId, since21, 0),
      MinistryIntelligenceRepository.getOpenFollowUpTasks(tenantId),
      prismaVisitorGuests(tenantId, since21),
    ]);

    const recommendations = [
      ...lowAttendance.slice(0, 15).map((m) => ({
        type: 'missed_attendance' as const,
        memberId: m.id,
        name: m.name,
        priority: 'high' as const,
        reason: `No attendance in 21 days (${m.attendanceCount} check-ins)`,
      })),
      ...visitors.slice(0, 10).map((v) => ({
        type: 'first_time_guest' as const,
        memberId: v.memberId,
        name: v.name,
        priority: 'high' as const,
        reason: 'First-time guest without follow-up task',
      })),
    ];

    return {
      generatedAt: new Date().toISOString(),
      recommendations: recommendations.slice(0, 25),
      openFollowUpTasks: openTasks.slice(0, 15),
    };
  }

  static async getMinistryJourney(tenantId: string, memberId: string) {
    const [attendance, responsibilities, tasks] = await Promise.all([
      MinistryIntelligenceRepository.getMemberAttendanceTimeline(tenantId, memberId),
      MinistryIntelligenceRepository.getMemberResponsibilities(tenantId, memberId),
      MinistryIntelligenceRepository.getMemberTasks(tenantId, memberId),
    ]);

    const timeline: Array<{
      at: string;
      kind: string;
      label: string;
      meta?: Record<string, unknown>;
    }> = [];

    for (const a of attendance) {
      timeline.push({
        at: a.checkInTime.toISOString(),
        kind: 'attendance',
        label: a.session?.name ?? 'Check-in',
        meta: { method: a.method, sessionId: a.session?.id },
      });
    }
    for (const r of responsibilities) {
      timeline.push({
        at: r.startDate.toISOString(),
        kind: 'volunteer',
        label: `${r.role} (${r.status})`,
        meta: { entityType: r.entityType, entityId: r.entityId },
      });
    }
    for (const t of tasks) {
      timeline.push({
        at: t.createdAt.toISOString(),
        kind: 'task',
        label: t.title,
        meta: { status: t.status, priority: t.priority },
      });
    }

    timeline.sort((a, b) => +new Date(b.at) - +new Date(a.at));

    return {
      memberId,
      generatedAt: new Date().toISOString(),
      timeline: timeline.slice(0, 60),
      summary: {
        attendanceCount: attendance.length,
        volunteerRoles: responsibilities.filter((r) => r.status === 'Active').length,
        openTasks: tasks.filter((t) => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length,
      },
    };
  }

  static async getCampusOverview(tenantId: string) {
    const campuses = await MinistryIntelligenceRepository.listCampuses(tenantId);
    const rows = await Promise.all(
      campuses.map(async (c) => {
        const [svc, ev] = await Promise.all([
          this.getServiceHealth(tenantId, c.id),
          this.getEventHealth(tenantId, c.id),
        ]);
        const campusEvents = await prisma.event.findMany({
          where: { tenantId, campusId: c.id, date: { gte: new Date() } },
          select: { id: true },
          take: 15,
        });
        let volunteerGaps = 0;
        for (const ev of campusEvents) {
          const count = await OperationsRepository.countEventVolunteers(tenantId, ev.id);
          if (count < 2) volunteerGaps += 1;
        }
        return {
          campusId: c.id,
          name: c.name,
          type: c.type,
          serviceReadiness: svc.trend.avgReadinessScore,
          upcomingEventCount: ev.summary.eventCount,
          volunteerGaps,
          alertCount: svc.alerts.length,
        };
      }),
    );

    return { generatedAt: new Date().toISOString(), campuses: rows };
  }

  static async getExecutiveDashboard(tenantId: string, campusId?: string) {
    const { cacheThrough } = await import('../utils/opsCache.js');
    const cacheKey = `intel:exec:${tenantId}:${campusId ?? 'all'}`;
    return cacheThrough(cacheKey, 45_000, () => this.computeExecutiveDashboard(tenantId, campusId));
  }

  private static async computeExecutiveDashboard(tenantId: string, campusId?: string) {
    const [volunteer, service, events, engagement, predictive] = await Promise.all([
      this.getVolunteerHealth(tenantId, campusId),
      this.getServiceHealth(tenantId, campusId),
      this.getEventHealth(tenantId, campusId),
      this.getEngagementSignals(tenantId),
      this.getPredictiveSignals(tenantId, campusId),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      campusId: campusId ?? null,
      ministryHealth: {
        engagementScore: engagement.averageScore,
        engagedMembers: engagement.engagedCount,
        atRiskMembers: engagement.atRiskCount,
      },
      operationalHealth: {
        serviceReadiness: service.trend.avgReadinessScore,
        blockedServices: service.trend.blockedCount,
        operationalAlerts: service.alerts.length,
      },
      volunteerEngagement: volunteer.summary,
      attendanceTrend: {
        eventAttendanceTotal: events.summary.totalAttendance,
      },
      eventImpact: {
        totalDonations: events.summary.totalDonations,
        strongEvents: events.summary.strongEngagement,
      },
      predictive,
    };
  }

  static async getPastoralInsights(tenantId: string) {
    const [engagement, followUp, volunteer] = await Promise.all([
      this.getEngagementSignals(tenantId),
      this.getFollowUpPriority(tenantId),
      this.getVolunteerHealth(tenantId),
    ]);

    const stressedVolunteers = volunteer.profiles.filter((p) => p.burnoutRisk || p.ministryOverload).slice(0, 12);
    const absentVolunteers = volunteer.profiles.filter((p) => p.noShowRisk).slice(0, 12);

    return {
      generatedAt: new Date().toISOString(),
      disengagedMembers: engagement.inactiveMembers.slice(0, 20),
      followUpPriority: followUp.recommendations.slice(0, 20),
      absentVolunteers,
      ministryStress: stressedVolunteers,
      momentum: {
        volunteerMomentum: volunteer.summary.leadershipReadyCount,
        engagementGrowth: engagement.engagedCount - engagement.atRiskCount,
      },
    };
  }

  static async getFullIntelligence(tenantId: string, campusId?: string) {
    const data = await this.getExecutiveDashboard(tenantId, campusId);
    await EventBus.publish({
      eventName: 'MinistryIntelligenceViewed',
      tenantId,
      entityId: tenantId,
      entityType: 'Tenant',
      payload: { campusId: campusId ?? null },
    });
    return data;
  }
}

async function prismaVisitorGuests(tenantId: string, since: Date) {
  const visitors = await prisma.member.findMany({
    where: {
      tenantId,
      growthStage: 'Visitor',
      status: 'Active',
      createdAt: { gte: since },
    },
    select: { id: true, name: true },
    take: 20,
  });
  const withTasks = await prisma.task.findMany({
    where: {
      tenantId,
      targetType: TaskTargetType.MEMBER,
      targetId: { in: visitors.map((v) => v.id) },
    },
    select: { targetId: true },
  });
  const hasTask = new Set(withTasks.map((t) => t.targetId));
  return visitors
    .filter((v) => !hasTask.has(v.id))
    .map((v) => ({ memberId: v.id, name: v.name }));
}
