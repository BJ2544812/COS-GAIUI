import { prisma } from './prisma.js';
import { getRedisOptional } from '../queue/redisConnection.js';
import { OperationalMonitoringService } from '../services/OperationalMonitoringService.js';
import { readPackageVersion } from './structuredStartup.js';

export type HealthDiagnostics = {
  timestamp: string;
  version: string;
  bootId: string | null;
  uptimeSeconds: number;
  database: 'connected' | 'disconnected';
  redis: { mode: 'connected' | 'sync_fallback' | 'unconfigured'; detail?: string };
  workers: { inProcess: true; note: string };
  queue: Record<string, unknown>;
  uploads: { localPath: string; note: string };
  minio: { configured: boolean };
};

export async function collectHealthDiagnostics(): Promise<HealthDiagnostics> {
  let database: 'connected' | 'disconnected' = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = 'connected';
  } catch {
    database = 'disconnected';
  }

  const redisUrl = process.env.REDIS_URL?.trim();
  let redis: HealthDiagnostics['redis'];
  if (!redisUrl) {
    redis = { mode: 'unconfigured', detail: 'REDIS_URL unset — sync queue fallback' };
  } else {
    const client = getRedisOptional();
    if (client) {
      try {
        await client.ping();
        redis = { mode: 'connected' };
      } catch (e) {
        redis = {
          mode: 'sync_fallback',
          detail: e instanceof Error ? e.message : 'redis ping failed',
        };
      }
    } else {
      redis = { mode: 'sync_fallback', detail: 'client not initialized' };
    }
  }

  let queue: Record<string, unknown> = { mode: 'unknown' };
  try {
    queue = await OperationalMonitoringService.getQueueMetrics();
  } catch (e) {
    queue = { error: e instanceof Error ? e.message : 'unavailable' };
  }

  return {
    timestamp: new Date().toISOString(),
    version: readPackageVersion(),
    bootId: process.env.BOOT_ID ?? null,
    uptimeSeconds: Math.floor(process.uptime()),
    database,
    redis,
    workers: {
      inProcess: true,
      note: 'BullMQ workers run inside API process (domain events, Razorpay webhooks)',
    },
    queue,
    uploads: {
      localPath: 'uploads/',
      note: 'Served at /uploads; MinIO optional when MINIO_* configured',
    },
    minio: { configured: Boolean(process.env.MINIO_ENDPOINT?.trim()) },
  };
}
