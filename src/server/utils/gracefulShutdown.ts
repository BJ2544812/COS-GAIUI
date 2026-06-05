import type { Server } from 'node:http';
import { prisma } from './prisma.js';
import { closeAllWorkers } from './workerRegistry.js';
import { getRedisOptional } from '../queue/redisConnection.js';

let shuttingDown = false;

export function isShuttingDown(): boolean {
  return shuttingDown;
}

export function registerGracefulShutdown(httpServer: Server): void {
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[shutdown] ${signal} received — graceful shutdown starting`);

    const forceTimer = setTimeout(() => {
      console.error('[shutdown] timeout — forcing exit');
      process.exit(1);
    }, Number(process.env.SHUTDOWN_TIMEOUT_MS) || 25_000);
    forceTimer.unref();

    try {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      });
      console.log('[shutdown] HTTP server closed');

      await closeAllWorkers();
      console.log('[shutdown] BullMQ workers closed');

      const redis = getRedisOptional();
      if (redis) {
        try {
          redis.disconnect();
          console.log('[shutdown] Redis disconnected');
        } catch (e) {
          console.warn('[shutdown] Redis disconnect warning:', e);
        }
      }

      await prisma.$disconnect();
      console.log('[shutdown] Prisma disconnected');
    } catch (e) {
      console.error('[shutdown] error during teardown:', e);
      process.exit(1);
    }

    clearTimeout(forceTimer);
    console.log('[shutdown] complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}
