import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { DomainEventPayload } from './eventBus.js';
import { prisma } from '../utils/prisma.js';
import { AccountingService } from '../services/AccountingService.js';
import { IdempotencyRepository } from '../repositories/IdempotencyRepository.js';
import { NotificationService } from '../services/NotificationService.js';

const redisUrl = process.env.REDIS_URL;

export async function processDomainEvent(event: DomainEventPayload, attemptsMade: number = 0) {
  const { id, eventName, tenantId, entityId, payload } = event;
  
  // Minimal workflow hook / logging
  console.log(`[Workflow Engine] Processing event ${eventName} for tenant ${tenantId} (Attempt: ${attemptsMade + 1})`);

  // 1. Idempotency check via EventLog
  const eventLog = await prisma.eventLog.findUnique({ where: { id } });
  if (!eventLog) {
    throw new Error(`EventLog not found for id: ${id}`);
  }

  if (eventLog.status === 'PROCESSED') {
    console.log(`[Worker] Event ${id} already processed. Skipping.`);
    return;
  }

  try {
    if (eventName === 'MemberCreated') {
      console.log(`[Worker] Handled MemberCreated for ${entityId}`);
      
    } else if (eventName === 'EventCreated') {
      console.log(`[Worker] Handled EventCreated for ${entityId}`);
      
    } else if (eventName === 'DonationReceived') {
      const { amount, method, reference, date, debitAccountId, creditAccountId, auditUserId } = payload;
      
      if (!debitAccountId || !creditAccountId) {
        console.log('[Worker] No accounting config provided for donation. Skipping accounting step.');
      } else {
        const idemKey = `donation_accounting_${id}`; // Use the permanent EventLog id!
        
        await prisma.$transaction(async (tx) => {
          // Double Idempotency hook for Accounting service specifically
          const existing = await IdempotencyRepository.findValidByKey(tx, tenantId, idemKey, 'accounting_event');
          if (existing) {
            console.log(`[Worker] Idempotency hit for ${idemKey}. Skipping.`);
            return;
          }
          
          // Call Accounting logic
          const voucher = await AccountingService.createApproveAndPostVoucher(
            tenantId,
            {
              type: 'Receipt',
              date: new Date(date || Date.now()),
              amount: Number(amount),
              description: `Donation via ${method} - Ref: ${reference || 'N/A'}`,
              entries: [
                { accountId: debitAccountId, debit: Number(amount), credit: 0 },
                { accountId: creditAccountId, debit: 0, credit: Number(amount) },
              ],
              source: 'donation',
              sourceRefId: entityId,
            },
            { approvedByUserId: auditUserId, postedByUserId: auditUserId },
            tx
          );
  
          await IdempotencyRepository.create(tx, tenantId, idemKey, 'accounting_event', voucher.id);
          console.log(`[Worker] Generated Voucher ${voucher.id} for Donation ${entityId}`);
        });
        
        await NotificationService.createNotification({
          tenantId,
          type: 'DonationReceived',
          title: 'New Donation Received',
          message: `A donation of ${amount} was received via ${method}.`,
          targetRole: 'Finance',
          priority: 'LOW',
          actionType: 'VIEW_MODULE',
          actionLink: 'giving',
          expiresInDays: 30
        });
      }
    } else if (eventName === 'BudgetExceeded') {
      const { exceededBy } = payload;
      await NotificationService.createNotification({
        tenantId,
        type: 'BudgetExceeded',
        title: 'Budget Alert: Overdraft Detected',
        message: `A transaction has exceeded the active budget by ${exceededBy}. Please review.`,
        targetRole: 'Finance',
        priority: 'HIGH',
        actionType: 'VIEW_MODULE',
        actionLink: 'finance'
      });
    } else if (eventName === 'TransactionPosted') {
      const { voucherNo, type } = payload;
      await NotificationService.createNotification({
        tenantId,
        type: 'VoucherPosted',
        title: 'Voucher Posted to Ledger',
        message: `${type} Voucher ${voucherNo} has been successfully posted.`,
        targetRole: 'Finance',
        priority: 'LOW',
        actionType: 'VIEW_MODULE',
        actionLink: 'finance',
        expiresInDays: 7
      });
    } else if (['TaskCreated', 'TaskReassigned'].includes(eventName)) {
      const { assignedUserId, newAssignedUserId, targetType } = payload;
      const recipient = assignedUserId || newAssignedUserId;
      
      if (recipient) {
        // Idempotent Notification Strategy
        const idemKey = `notify_${eventName}_${id}`;
        await prisma.$transaction(async (tx) => {
          const existing = await IdempotencyRepository.findValidByKey(tx, tenantId, idemKey, 'notification');
          if (existing) return;

          await NotificationService.createNotification({
            tenantId,
            userId: recipient,
            type: 'TaskAssigned',
            title: 'New Task Assignment',
            message: `You have been assigned a new task related to ${targetType}.`,
            priority: 'MEDIUM',
            actionType: 'VIEW_MODULE',
            actionLink: 'discipleship'
          });
          await IdempotencyRepository.create(tx, tenantId, idemKey, 'notification', id);
        });
        console.log(`[Worker] Handled ${eventName} - Notification sent to ${recipient}`);
      }
    } else if (eventName.startsWith('Care') || eventName.startsWith('Mentorship') || eventName.startsWith('Task')) {
      // Safe default handler for Discipleship events: Just log them for the audit timeline.
      console.log(`[Worker] Safe generic processing for ${eventName} (${entityId})`);
    }

    // 2. Mark as processed and create Analytics record atomically
    await prisma.$transaction(async (tx) => {
      await tx.eventLog.update({
        where: { id },
        data: {
          status: 'PROCESSED',
          processedAt: new Date(),
          error: null
        }
      });

      await tx.analyticsEvent.create({
        data: {
          eventId: id,
          tenantId,
          type: eventName,
          payload,
          timestamp: new Date()
        }
      });
    });

  } catch (error: any) {
    console.error(`[Worker] Failed to process event ${eventName} for ${entityId}:`, error);
    
    // Mark as FAILED (will be retried by BullMQ)
    await prisma.eventLog.update({
      where: { id },
      data: {
        status: 'FAILED',
        error: `[Attempt ${attemptsMade + 1}] ${error.message || 'Unknown error processing event'}`
      }
    }).catch(e => console.error('[Worker] Failed to update eventLog status', e));

    // Emit Notification
    await NotificationService.createNotification({
      tenantId,
      type: 'FailedEvent',
      title: 'Background Process Failed',
      message: `Event ${eventName} failed to process. Requires administrative review.`,
      targetRole: 'Admin',
      priority: 'HIGH',
      actionType: 'VIEW_EVENTS',
      actionLink: 'dashboard?modal=failed'
    }).catch(e => console.error('[Worker] Failed to create notification', e));

    throw error;
  }
}

export function startEventWorker() {
  if (!redisUrl) {
    console.log('[Worker] No REDIS_URL provided. Event worker will not start in background mode (will use sync fallback).');
    return;
  }
  
  try {
    const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
    const worker = new Worker('domain_events', async (job: Job) => {
      await processDomainEvent(job.data as DomainEventPayload, job.attemptsMade);
    }, { connection });

    worker.on('failed', (job, err) => {
      console.error(`[Worker] Job ${job?.id} failed:`, err);
    });
    
    console.log('[Worker] Domain event worker started.');
  } catch (e) {
    console.error('[Worker] Failed to initialize Redis worker', e);
  }
}
