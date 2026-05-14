import { Queue } from 'bullmq';
import Redis from 'ioredis';
import 'dotenv/config';

import { prisma } from '../utils/prisma.js';

const redisUrl = process.env.REDIS_URL;
let connection: Redis | null = null;
let eventQueue: Queue | null = null;

if (redisUrl) {
  try {
    connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
    eventQueue = new Queue('domain_events', { connection });
  } catch (e) {
    console.error('[EventBus] Failed to initialize Redis', e);
  }
}

export type DomainEventPayload = {
  id: string;
  eventName: string;
  tenantId: string;
  entityId: string;
  entityType: string;
  payload: any;
  version: number;
  occurredAt: string;
};

export class EventBus {
  static async publish(eventInput: Omit<DomainEventPayload, 'id' | 'occurredAt' | 'version'>) {
    const occurredAt = new Date().toISOString();
    const version = 1;

    // 1. Persist EventLog (CRITICAL)
    const eventLog = await prisma.eventLog.create({
      data: {
        eventName: eventInput.eventName,
        tenantId: eventInput.tenantId,
        entityId: eventInput.entityId,
        entityType: eventInput.entityType,
        payload: eventInput.payload,
        version,
        occurredAt,
        status: 'PENDING'
      }
    });

    const fullEvent: DomainEventPayload = {
      ...eventInput,
      id: eventLog.id,
      version,
      occurredAt
    };

    // 2. Publish to Queue
    let queued = false;
    if (eventQueue) {
      try {
        await Promise.race([
          eventQueue.add(fullEvent.eventName, fullEvent, {
            jobId: eventLog.id,
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 }
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 1000))
        ]);
        queued = true;
        console.log(`[EventBus] Published async event: ${fullEvent.eventName} for entity ${fullEvent.entityId}`);
      } catch (err: any) {
        console.warn(`[EventBus] Redis queue unavailable (${err.message}). Falling back to sync.`);
      }
    }
    
    if (!queued) {
      // Synchronous fallback ONLY for local dev
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[EventBus] Sync fallback for event: ${fullEvent.eventName} for entity ${fullEvent.entityId}`);
        const { processDomainEvent } = await import('./eventWorker.js');
        await processDomainEvent(fullEvent).catch(e => console.error('[EventBus] Sync execution error:', e));
      } else {
         console.warn(`[EventBus] Production missing redis. EventLog ${eventLog.id} saved but not queued.`);
      }
    }
  }
  static async replayFailedEvents() {
    const failedEvents = await prisma.eventLog.findMany({
      where: { status: 'FAILED' }
    });
    
    let requeued = 0;
    for (const event of failedEvents) {
      const fullEvent: DomainEventPayload = {
        id: event.id,
        eventName: event.eventName,
        tenantId: event.tenantId,
        entityId: event.entityId,
        entityType: event.entityType,
        payload: event.payload,
        version: event.version,
        occurredAt: event.occurredAt.toISOString()
      };
      
      if (eventQueue) {
        await eventQueue.add(fullEvent.eventName, fullEvent, {
          jobId: event.id,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 }
        });
        requeued++;
      }
    }
    
    // Update status to PENDING again
    if (requeued > 0) {
      await prisma.eventLog.updateMany({
        where: { id: { in: failedEvents.slice(0, requeued).map(e => e.id) } },
        data: { status: 'PENDING', error: null }
      });
    }
    
    return requeued;
  }
  
  static async getEventStats(tenantId?: string) {
    const whereClause = tenantId ? { tenantId } : {};
    const [pending, processed, failed] = await Promise.all([
      prisma.eventLog.count({ where: { ...whereClause, status: 'PENDING' } }),
      prisma.eventLog.count({ where: { ...whereClause, status: 'PROCESSED' } }),
      prisma.eventLog.count({ where: { ...whereClause, status: 'FAILED' } })
    ]);
    
    return { pending, processed, failed };
  }
}
