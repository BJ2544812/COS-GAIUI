import { prisma } from '../utils/prisma.js';
import { DigestService } from '../services/DigestService.js';
import { DeploymentService } from '../services/DeploymentService.js';
import { EventBus } from '../events/eventBus.js';
import { OperationalMonitoringService } from '../services/OperationalMonitoringService.js';

const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const DIGEST_INTERVAL_MS = 12 * 60 * 60 * 1000;

export function startScheduledOpsJobs() {
  const runDigests = async () => {
    try {
      const tenants = await prisma.tenant.findMany({ select: { id: true }, take: 50 });
      for (const t of tenants) {
        await DigestService.generate(t.id, 'daily_ops').catch((e) =>
          console.error('[scheduled] digest failed', t.id, e),
        );
        await OperationalMonitoringService.evaluateAlerts(t.id).catch(() => undefined);
      }
    } catch (e) {
      console.error('[scheduled] digest job error', e);
    }
  };

  const runBackups = async () => {
    try {
      const tenants = await prisma.tenant.findMany({ select: { id: true }, take: 20 });
      for (const t of tenants) {
        await DeploymentService.runScheduledBackup(t.id).catch((e) =>
          console.error('[scheduled] backup failed', t.id, e),
        );
      }
    } catch (e) {
      console.error('[scheduled] backup job error', e);
    }
  };

  const replayFailed = async () => {
    try {
      const n = await EventBus.replayFailedEvents();
      if (n > 0) console.log(`[scheduled] requeued ${n} failed domain events`);
    } catch (e) {
      console.error('[scheduled] replay failed events error', e);
    }
  };

  setTimeout(() => void runDigests(), 120_000);
  setInterval(() => void runDigests(), DIGEST_INTERVAL_MS);

  setTimeout(() => void runBackups(), 300_000);
  setInterval(() => void runBackups(), BACKUP_INTERVAL_MS);

  setInterval(() => void replayFailed(), 15 * 60 * 1000);

  console.log('[scheduled] Operational digests, backups, and event replay schedules active');
}
