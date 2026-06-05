import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '../utils/prisma.js';
import { EventBus } from '../events/eventBus.js';
import { DeploymentService } from './DeploymentService.js';
import {
  listOperationalIncidents,
  resolveOperationalIncident,
  recordOperationalIncident,
} from '../utils/operationalIncidents.js';
import { getSocketHub } from '../realtime/socketHub.js';

const redisUrl = process.env.REDIS_URL?.trim();

export class OperationalMonitoringService {
  static async getIncidentPanel(tenantId: string) {
    const [incidents, health, eventStats, failedEvents, backupRuns, queueMetrics] =
      await Promise.all([
        listOperationalIncidents(tenantId, true),
        DeploymentService.validateInfrastructure(tenantId),
        EventBus.getEventStats(tenantId),
        prisma.eventLog.findMany({
          where: { tenantId, status: 'FAILED' },
          orderBy: { occurredAt: 'desc' },
          take: 25,
        }),
        prisma.backupRun.findMany({
          where: { tenantId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        this.getQueueMetrics(),
      ]);

    const openIncidents = incidents.filter((i) => i.status === 'open');
    const degradedProbes = health.probes.filter((p) => p.status !== 'up');

    return {
      summary: {
        overall: health.overall,
        openIncidents: openIncidents.length,
        failedWorkflows: eventStats.failed,
        pendingWorkflows: eventStats.pending,
        degradedServices: degradedProbes.length,
        realtimeUp: Boolean(getSocketHub()),
      },
      incidents: openIncidents.slice(0, 50),
      recentIncidents: incidents.slice(0, 30),
      failedEvents,
      backupRuns,
      degradedProbes,
      queueMetrics,
      workerHealth: {
        redisConfigured: Boolean(redisUrl),
        socketHub: Boolean(getSocketHub()),
        eventQueue: eventStats,
      },
    };
  }

  static async getQueueMetrics() {
    if (!redisUrl) {
      return {
        mode: 'synchronous',
        waiting: 0,
        active: 0,
        failed: 0,
        completed: 0,
        delayed: 0,
      };
    }
    try {
      const connection = new Redis(redisUrl, { maxRetriesPerRequest: 1, connectTimeout: 3000 });
      const queue = new Queue('domain_events', { connection });
      const counts = await queue.getJobCounts('waiting', 'active', 'failed', 'completed', 'delayed');
      await queue.close();
      connection.disconnect();
      return { mode: 'bullmq', ...counts };
    } catch (e) {
      return {
        mode: 'unavailable',
        error: e instanceof Error ? e.message : 'queue metrics unavailable',
      };
    }
  }

  static async replayFailedWorkflows(tenantId: string, eventIds?: string[]) {
    if (eventIds?.length) {
      let replayed = 0;
      for (const id of eventIds) {
        const event = await prisma.eventLog.findFirst({
          where: { id, tenantId, status: 'FAILED' },
        });
        if (!event) continue;
        await prisma.eventLog.update({
          where: { id },
          data: { status: 'PENDING', error: null },
        });
        replayed += 1;
      }
      const requeued = await EventBus.replayFailedEvents();
      return { replayed, requeued };
    }
    const requeued = await EventBus.replayFailedEvents();
    await recordOperationalIncident(tenantId, {
      severity: 'info',
      category: 'workflow_replay',
      title: 'Failed workflows replay initiated',
      detail: `Requeued ${requeued} domain events`,
    });
    return { requeued };
  }

  static async resolveIncident(tenantId: string, incidentId: string) {
    return resolveOperationalIncident(tenantId, incidentId);
  }

  static async evaluateAlerts(tenantId: string) {
    const stats = await EventBus.getEventStats(tenantId);
    const queue = await this.getQueueMetrics();

    if (stats.failed > 5) {
      await recordOperationalIncident(tenantId, {
        severity: 'critical',
        category: 'workflow_failure',
        title: 'Elevated workflow failures',
        detail: `${stats.failed} failed domain events`,
      });
    }

    if (typeof queue.failed === 'number' && queue.failed > 10) {
      await recordOperationalIncident(tenantId, {
        severity: 'warning',
        category: 'queue_congestion',
        title: 'Dead-letter queue backlog',
        detail: `${queue.failed} jobs in failed state`,
      });
    }

    const latestBackup = await prisma.backupRun.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    if (latestBackup?.status === 'failed') {
      await recordOperationalIncident(tenantId, {
        severity: 'critical',
        category: 'backup_failure',
        title: 'Scheduled backup failed',
        detail: latestBackup.errorDetail ?? undefined,
      });
    }

    if (!redisUrl) {
      const open = await listOperationalIncidents(tenantId, false);
      const hasRedisWarning = open.some((i) => i.category === 'redis' && i.title === 'Redis not configured');
      if (!hasRedisWarning) {
        await recordOperationalIncident(tenantId, {
          severity: 'warning',
          category: 'redis',
          title: 'Redis not configured',
          detail: 'Background queue runs synchronously — not ideal for production scale',
        });
      }
    }

    return { evaluated: true };
  }
}
