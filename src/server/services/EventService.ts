import { EventRepository } from '../repositories/EventRepository.js';
import { Prisma, TaskPriority, TaskStatus, TaskTargetType } from '@prisma/client';
import { EventBus } from '../events/eventBus.js';
import {
  canTransitionEvent,
  domainEventForTransition,
  type EventStatus,
} from '../utils/eventLifecycle.js';
import { DiscipleshipV2Repository } from '../repositories/DiscipleshipV2Repository.js';
import { AccountingService } from './AccountingService.js';
import { broadcastScoped } from '../realtime/socketHub.js';
import { RT } from '../utils/realtimeEvents.js';
import { eventPermissionsForActor } from '../utils/eventPermissions.js';
import { mergeEventPublicProfile, type EventPublicProfile } from '../../lib/eventPublicProfile.js';

function applyPublicProfileToCreate(
  data: Omit<Prisma.EventCreateInput, 'tenant'> & { publicProfile?: EventPublicProfile },
): Omit<Prisma.EventCreateInput, 'tenant'> {
  const { publicProfile, ...rest } = data;
  if (!publicProfile || Object.keys(publicProfile).length === 0) return rest;
  const opsConfig = mergeEventPublicProfile(rest.opsConfig, publicProfile);
  const out: Omit<Prisma.EventCreateInput, 'tenant'> = {
    ...rest,
    opsConfig: opsConfig as Prisma.InputJsonValue,
  };
  if (publicProfile.acceptsRegistration) {
    out.registrationOpen = true;
  }
  return out;
}

function applyPublicProfileToUpdate(
  data: Prisma.EventUpdateInput & { publicProfile?: EventPublicProfile },
): Prisma.EventUpdateInput {
  const { publicProfile, ...rest } = data;
  if (!publicProfile) return rest;
  const opsConfig = mergeEventPublicProfile(
    (rest.opsConfig as Prisma.InputJsonValue | undefined) ?? undefined,
    publicProfile,
  );
  const out: Prisma.EventUpdateInput = {
    ...rest,
    opsConfig: opsConfig as Prisma.InputJsonValue,
  };
  if (publicProfile.acceptsRegistration === true) out.registrationOpen = true;
  if (publicProfile.acceptsRegistration === false) out.registrationOpen = false;
  return out;
}

export class EventService {
  private static async publishEvent(
    eventName: string,
    tenantId: string,
    entityId: string,
    payload: Record<string, unknown>,
  ) {
    await EventBus.publish({
      eventName,
      tenantId,
      entityId,
      entityType: 'Event',
      payload,
    });
  }

  static async createEvent(
    tenantId: string,
    data: Omit<Prisma.EventCreateInput, 'tenant'> & { publicProfile?: EventPublicProfile },
  ) {
    const prepared = applyPublicProfileToCreate(data);
    const event = await EventRepository.create(tenantId, {
      ...prepared,
      status: (prepared as { status?: string }).status ?? 'DRAFT',
    } as Prisma.EventCreateInput);

    await this.publishEvent('EventCreated', tenantId, event.id, {
      name: event.name,
      date: event.date,
      type: event.type,
      status: event.status,
    });

    return event;
  }

  static async getEvents(tenantId: string) {
    return EventRepository.findAll(tenantId);
  }

  static async getEventById(tenantId: string, id: string) {
    return EventRepository.findById(tenantId, id);
  }

  static async updateEvent(
    tenantId: string,
    id: string,
    data: Prisma.EventUpdateInput & { publicProfile?: EventPublicProfile },
  ) {
    const existing = await EventRepository.findById(tenantId, id);
    if (!existing) throw new Error('Event not found');

    const event = await EventRepository.update(tenantId, id, applyPublicProfileToUpdate(data));

    await this.publishEvent('EventUpdated', tenantId, event.id, {
      name: event.name,
      status: event.status,
    });

    return event;
  }

  static async deleteEvent(tenantId: string, id: string) {
    const existing = await EventRepository.findById(tenantId, id);
    if (!existing) throw new Error('Event not found');
    await EventRepository.delete(tenantId, id);
    await this.publishEvent('EventUpdated', tenantId, id, { deleted: true });
  }

  static async transitionStatus(tenantId: string, id: string, toStatus: string, actorUserId?: string) {
    const event = await EventRepository.findById(tenantId, id);
    if (!event) throw new Error('Event not found');

    const from = event.status;
    const to = toStatus as EventStatus;
    if (!canTransitionEvent(from, to)) {
      throw new Error(`Invalid lifecycle transition: ${from} → ${to}`);
    }

    const patch: Prisma.EventUpdateInput = { status: to };
    if (to === 'REGISTRATION_OPEN') patch.registrationOpen = true;
    if (to === 'REGISTRATION_CLOSED') patch.registrationOpen = false;
    if (to === 'CANCELLED') patch.cancelledAt = new Date();
    if (to === 'COMPLETED') patch.completedAt = new Date();
    if (to === 'ARCHIVED') patch.archivedAt = new Date();

    const updated = await EventRepository.update(tenantId, id, patch);

    const domainName = domainEventForTransition(to);
    if (domainName) {
      await this.publishEvent(domainName, tenantId, id, {
        from,
        to,
        actorUserId: actorUserId ?? null,
        name: updated.name,
      });
    }

    broadcastScoped({ tenantId, eventId: id }, RT.EVENT_STATUS, {
      eventId: id,
      from,
      to,
      name: updated.name,
    });

    if (to === 'APPROVED' && actorUserId) {
      await DiscipleshipV2Repository.createTask(tenantId, {
        tenantId,
        title: `Event prep: ${updated.name}`,
        description: 'Review volunteers, facilities, and communication for this event.',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        targetType: TaskTargetType.EVENT,
        targetId: id,
        createdById: actorUserId,
      });
    }

    return updated;
  }

  static async updateRunSheet(tenantId: string, id: string, runSheet: unknown) {
    const event = await EventRepository.findById(tenantId, id);
    if (!event) throw new Error('Event not found');
    const updated = await EventRepository.update(tenantId, id, { runSheet: runSheet as Prisma.InputJsonValue });
    broadcastScoped({ tenantId, eventId: id, serviceId: id }, RT.SERVICE_UPDATE, { runSheet });
    return updated;
  }

  static async updateOpsConfig(tenantId: string, id: string, opsConfig: unknown) {
    const event = await EventRepository.findById(tenantId, id);
    if (!event) throw new Error('Event not found');
    return EventRepository.update(tenantId, id, { opsConfig: opsConfig as Prisma.InputJsonValue });
  }

  static async getWorkspace(
    tenantId: string,
    id: string,
    actor?: { userId?: string; hasManageEvents?: boolean },
  ) {
    const event = await EventRepository.findById(tenantId, id);
    if (!event) throw new Error('Event not found');

    const responsibilities = await EventRepository.findResponsibilitiesForEvent(tenantId, id);
    const responsibilityRoles = responsibilities
      .filter((r) => r.status === 'Active')
      .map((r) => r.role);
    const permissions = eventPermissionsForActor({
      hasManageEvents: actor?.hasManageEvents ?? false,
      responsibilityRoles: actor?.hasManageEvents ? undefined : responsibilityRoles,
    });
    const attendeeCount = (event.attendanceSessions ?? []).reduce(
      (s, sess) => s + (sess._count?.attendances ?? 0),
      0,
    );

    let finance = null;
    try {
      finance = await AccountingService.getEventAccountingStatement(tenantId, id);
    } catch {
      finance = null;
    }

    return {
      event,
      metrics: {
        attendeeCount,
        sessionCount: event.attendanceSessions?.length ?? 0,
        volunteerCount: responsibilities.filter((r) => r.status === 'Active').length,
      },
      responsibilities,
      finance,
      permissions,
    };
  }

  static async listEventResponsibilities(tenantId: string, eventId: string) {
    return EventRepository.findResponsibilitiesForEvent(tenantId, eventId);
  }
}
