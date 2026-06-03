import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { registerWorker } from '../utils/workerRegistry.js';
import { DomainEventPayload } from './eventBus.js';
import { prisma } from '../utils/prisma.js';
import { AccountingService } from '../services/AccountingService.js';
import { IdempotencyRepository } from '../repositories/IdempotencyRepository.js';
import { NotificationService } from '../services/NotificationService.js';
import { recordOperationalIncident } from '../utils/operationalIncidents.js';
import { logStructured } from '../utils/structuredLog.js';

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
      await NotificationService.createNotification({
        tenantId,
        type: 'EventCreated',
        title: 'New event drafted',
        message: `“${(payload as { name?: string }).name ?? 'Event'}” was created. Open Events to coordinate volunteers and logistics.`,
        targetRole: 'Admin',
        priority: 'LOW',
        actionType: 'VIEW_MODULE',
        actionLink: 'events',
        expiresInDays: 14,
      });
    } else if (
      [
        'EventUpdated',
        'EventApproved',
        'RegistrationOpened',
        'RegistrationClosed',
        'EventActivated',
        'EventCompleted',
        'EventArchived',
        'EventCancelled',
      ].includes(eventName)
    ) {
      const titleMap: Record<string, string> = {
        EventApproved: 'Event approved',
        RegistrationOpened: 'Registration opened',
        RegistrationClosed: 'Registration closed',
        EventActivated: 'Event is live',
        EventCompleted: 'Event completed',
        EventArchived: 'Event archived',
        EventCancelled: 'Event cancelled',
        EventUpdated: 'Event updated',
      };
      await NotificationService.createNotification({
        tenantId,
        type: eventName,
        title: titleMap[eventName] ?? 'Event update',
        message: `Event “${(payload as { name?: string }).name ?? entityId}” — ${(payload as { to?: string }).to ?? 'status changed'}.`,
        targetRole: 'Admin',
        priority: eventName === 'EventCancelled' ? 'HIGH' : 'MEDIUM',
        actionType: 'VIEW_MODULE',
        actionLink: 'events',
        expiresInDays: 21,
      });
    } else if (eventName === 'EventRegistrationCompleted') {
      const payload = event.payload as { eventName?: string; registrantName?: string };
      await NotificationService.createNotification({
        tenantId,
        type: 'EventRegistration',
        title: 'Event registration',
        message: `${payload.registrantName ?? 'Someone'} registered for “${payload.eventName ?? 'an event'}”.`,
        targetRole: 'Admin',
        priority: 'MEDIUM',
        actionType: 'VIEW_MODULE',
        actionLink: 'events',
        expiresInDays: 30,
      });
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
    } else if (eventName === 'VisitorRegistered') {
      await NotificationService.createNotification({
        tenantId,
        type: 'VisitorRegistered',
        title: 'New visitor registered',
        message: `Guest “${(payload as { name?: string }).name ?? 'Visitor'}” — assign follow-up in Outreach.`,
        targetRole: 'Pastoral',
        priority: 'MEDIUM',
        actionType: 'VIEW_MODULE',
        actionLink: 'outreach',
        expiresInDays: 14,
      });
    } else if (eventName === 'PrayerRequestAssigned') {
      const assignee = (payload as { assignedUserId?: string }).assignedUserId;
      if (assignee) {
        await NotificationService.createNotification({
          tenantId,
          userId: assignee,
          type: 'PrayerRequestAssigned',
          title: 'Prayer request assigned',
          message: 'You have been assigned a prayer request. Open Pastoral Care to respond.',
          priority: 'MEDIUM',
          actionType: 'VIEW_MODULE',
          actionLink: 'discipleship',
          expiresInDays: 14,
        });
      }
      console.log(`[Worker] Prayer request ${entityId} assigned`);
    } else if (eventName === 'CommunicationCampaignSent') {
      await NotificationService.createNotification({
        tenantId,
        type: 'CampaignSent',
        title: 'Campaign delivered',
        message: `“${(payload as { title?: string }).title ?? 'Campaign'}” sent to ${(payload as { audienceSize?: number }).audienceSize ?? 0} recipients.`,
        targetRole: 'Admin',
        priority: 'LOW',
        actionType: 'VIEW_MODULE',
        actionLink: 'communication',
        expiresInDays: 7,
      });
    } else if (eventName === 'FollowUpCompleted') {
      console.log(`[Worker] Follow-up ${entityId} completed`);
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
    const errMsg = error.message || 'Unknown error processing event';
    logStructured('error', 'workflow_processing_failed', {
      tenantId,
      workflowId: id,
      eventId: id,
      error: errMsg,
      module: eventName,
    });

    await recordOperationalIncident(tenantId, {
      severity: attemptsMade >= 2 ? 'critical' : 'warning',
      category: 'workflow_failure',
      title: `Workflow failed: ${eventName}`,
      detail: errMsg,
      workflowId: id,
      eventId: id,
    }).catch(() => undefined);

    await prisma.eventLog.update({
      where: { id },
      data: {
        status: 'FAILED',
        error: `[Attempt ${attemptsMade + 1}] ${errMsg}`,
      },
    }).catch((e) => console.error('[Worker] Failed to update eventLog status', e));

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
    const connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy: (times) => Math.min(times * 200, 5000),
    });
    const concurrency = Math.min(
      20,
      Math.max(1, Number(process.env.EVENT_WORKER_CONCURRENCY) || 5),
    );
    const worker = new Worker(
      'domain_events',
      async (job: Job) => {
        await processDomainEvent(job.data as DomainEventPayload, job.attemptsMade);
      },
      { connection, concurrency },
    );

    registerWorker(worker);

    worker.on('failed', async (job, err) => {
      const data = job?.data as DomainEventPayload | undefined;
      logStructured('error', 'worker_job_failed', {
        tenantId: data?.tenantId,
        workflowId: job?.id,
        eventId: data?.id,
        error: err instanceof Error ? err.message : String(err),
      });
      if (data?.tenantId) {
        await recordOperationalIncident(data.tenantId, {
          severity: 'critical',
          category: 'worker_failure',
          title: 'Background worker job failed',
          detail: err instanceof Error ? err.message : String(err),
          workflowId: job?.id,
          eventId: data.id,
        }).catch(() => undefined);
      }
    });
    
    console.log('[Worker] Domain event worker started.');
  } catch (e) {
    console.error('[Worker] Failed to initialize Redis worker', e);
  }
}
