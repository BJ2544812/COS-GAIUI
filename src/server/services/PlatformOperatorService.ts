import { prisma } from '../utils/prisma.js';
import { cacheInvalidatePrefix } from '../utils/opsCache.js';
import { EventBus } from '../events/eventBus.js';
import { OperationalMonitoringService } from './OperationalMonitoringService.js';
import { DeploymentService } from './DeploymentService.js';
import { getSocketHub } from '../realtime/socketHub.js';
import { listOperationalIncidents } from '../utils/operationalIncidents.js';

export class PlatformOperatorService {
  static flushTenantCache(tenantId: string) {
    cacheInvalidatePrefix(`ops:`);
    cacheInvalidatePrefix(`intel:`);
    return { flushed: true, tenantId, at: new Date().toISOString() };
  }

  static async replayFailedWorkflows(tenantId: string) {
    return OperationalMonitoringService.replayFailedWorkflows(tenantId);
  }

  static async getDiagnostics(tenantId: string) {
    const [health, queue, incidents, eventStats, maintenance] = await Promise.all([
      DeploymentService.validateInfrastructure(tenantId),
      OperationalMonitoringService.getQueueMetrics(),
      listOperationalIncidents(tenantId, true),
      EventBus.getEventStats(tenantId),
      prisma.setting.findUnique({
        where: { tenantId_key: { tenantId, key: 'tenant_maintenance_mode' } },
      }),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      infrastructure: health,
      queue,
      eventQueue: eventStats,
      socketHub: Boolean(getSocketHub()),
      openIncidents: incidents.filter((i) => i.status === 'open').length,
      maintenance: maintenance?.value ? JSON.parse(maintenance.value) : { enabled: false },
    };
  }

  static async exportDiagnosticsJson(tenantId: string) {
    const diagnostics = await this.getDiagnostics(tenantId);
    const incidents = await listOperationalIncidents(tenantId, true);
    return {
      ...diagnostics,
      incidents: incidents.slice(0, 100),
    };
  }
}
