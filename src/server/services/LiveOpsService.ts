import { EventRepository } from '../repositories/EventRepository.js';
import { NotificationService } from './NotificationService.js';
import { EventBus } from '../events/eventBus.js';
import { broadcastScoped } from '../realtime/socketHub.js';
import { RT } from '../utils/realtimeEvents.js';
import { type RunSheetSegment } from '../../lib/eventLifecycle.js';
import { Prisma } from '@prisma/client';

type LiveOpsConfig = {
  liveActive?: boolean;
  liveStartedAt?: string | null;
  currentSegmentIndex?: number;
  segmentStartedAt?: string | null;
  issues?: Array<{ id: string; text: string; at: string; severity?: string }>;
  volunteerPresence?: Record<string, string>;
  announcements?: string[];
  mediaReady?: boolean;
  livestreamReady?: boolean;
  agendaSessions?: Array<{ id: string; name: string; sortOrder: number; startTime?: string; duration?: string }>;
};

function asConfig(raw: unknown): LiveOpsConfig {
  if (raw && typeof raw === 'object') return raw as LiveOpsConfig;
  return {};
}

function asRunSheet(raw: unknown): RunSheetSegment[] {
  if (Array.isArray(raw) && raw.length > 0) return raw as RunSheetSegment[];
  return [];
}

export class LiveOpsService {
  private static emitServiceUpdate(
    tenantId: string,
    eventId: string,
    patch: Record<string, unknown>,
  ) {
    broadcastScoped(
      { tenantId, eventId, serviceId: eventId },
      RT.SERVICE_UPDATE,
      { eventId, ...patch },
    );
    broadcastScoped({ tenantId }, RT.OPS_REFRESH, { eventId, ...patch });
  }

  static async getLiveOps(tenantId: string, eventId: string) {
    const event = await EventRepository.findById(tenantId, eventId);
    if (!event) throw new Error('Event not found');

    const responsibilities = await EventRepository.findResponsibilitiesForEvent(tenantId, eventId);
    const opsConfig = asConfig(event.opsConfig);
    const runSheet = asRunSheet(event.runSheet);
    const presence = opsConfig.volunteerPresence ?? {};
    const presentCount = responsibilities.filter(
      (r) => presence[r.id] === 'present' || presence[r.id] === 'confirmed',
    ).length;

    const attendeeCount = (event.attendanceSessions ?? []).reduce(
      (s, sess) => s + (sess._count?.attendances ?? 0),
      0,
    );

    return {
      event: {
        id: event.id,
        name: event.name,
        type: event.type,
        date: event.date,
        status: event.status,
        location: event.location,
      },
      runSheet,
      opsConfig: {
        liveActive: false,
        currentSegmentIndex: 0,
        segmentStartedAt: null,
        issues: [],
        announcements: [],
        mediaReady: false,
        livestreamReady: false,
        agendaSessions: [],
        ...opsConfig,
      },
      responsibilities,
      metrics: {
        attendeeCount,
        volunteerCount: responsibilities.filter((r) => r.status === 'Active').length,
        presentCount,
      },
    };
  }

  static async updateLiveOps(
    tenantId: string,
    eventId: string,
    patch: Partial<LiveOpsConfig>,
    actorUserId?: string,
  ) {
    const event = await EventRepository.findById(tenantId, eventId);
    if (!event) throw new Error('Event not found');

    const merged = { ...asConfig(event.opsConfig), ...patch };
    const updated = await EventRepository.update(tenantId, eventId, {
      opsConfig: merged as Prisma.InputJsonValue,
    });

    this.emitServiceUpdate(tenantId, eventId, {
      opsConfig: merged,
      actorUserId: actorUserId ?? null,
    });

    return this.getLiveOps(tenantId, eventId);
  }

  static async advanceSegment(
    tenantId: string,
    eventId: string,
    action: 'complete' | 'skip' | 'goto',
    index?: number,
    actorUserId?: string,
  ) {
    const event = await EventRepository.findById(tenantId, eventId);
    if (!event) throw new Error('Event not found');

    const runSheet = asRunSheet(event.runSheet);
    if (runSheet.length === 0) {
      throw new Error('No run sheet has been created for this service.');
    }
    const ops = asConfig(event.opsConfig);
    let current = ops.currentSegmentIndex ?? 0;

    if (action === 'goto' && typeof index === 'number') {
      current = Math.max(0, Math.min(index, runSheet.length - 1));
    } else if (action === 'complete' || action === 'skip') {
      current = Math.min(current + 1, runSheet.length - 1);
    }

    const merged: LiveOpsConfig = {
      ...ops,
      liveActive: true,
      liveStartedAt: ops.liveStartedAt ?? new Date().toISOString(),
      currentSegmentIndex: current,
      segmentStartedAt: new Date().toISOString(),
    };

    await EventRepository.update(tenantId, eventId, {
      opsConfig: merged as Prisma.InputJsonValue,
    });

    if (['APPROVED', 'REGISTRATION_CLOSED', 'REGISTRATION_OPEN'].includes(event.status)) {
      const { EventService } = await import('./EventService.js');
      try {
        await EventService.transitionStatus(tenantId, eventId, 'ACTIVE', actorUserId);
      } catch {
        /* already active or invalid — continue live segment */
      }
    }

    await EventBus.publish({
      eventName: 'ServiceSegmentAdvanced',
      tenantId,
      entityId: eventId,
      entityType: 'Event',
      payload: { action, index: current, actorUserId },
    });

    this.emitServiceUpdate(tenantId, eventId, {
      action,
      currentSegmentIndex: current,
      segment: runSheet[current] ?? null,
    });

    return this.getLiveOps(tenantId, eventId);
  }

  static async reorderAgenda(
    tenantId: string,
    eventId: string,
    agendaSessions: LiveOpsConfig['agendaSessions'],
  ) {
    return this.updateLiveOps(tenantId, eventId, { agendaSessions });
  }

  static async triggerEmergency(
    tenantId: string,
    eventId: string,
    message: string,
    actorUserId?: string,
  ) {
    const event = await EventRepository.findById(tenantId, eventId);
    if (!event) throw new Error('Event not found');

    await NotificationService.createNotification({
      tenantId,
      type: 'OperationalEmergency',
      title: `Urgent: ${event.name}`,
      message,
      targetRole: 'Admin',
      priority: 'HIGH',
      actionType: 'VIEW_MODULE',
      actionLink: 'sunday-mode',
      expiresInDays: 1,
    });

    await EventBus.publish({
      eventName: 'OperationalEmergency',
      tenantId,
      entityId: eventId,
      entityType: 'Event',
      payload: { message, actorUserId },
    });

    this.emitServiceUpdate(tenantId, eventId, { emergency: message });
    return { ok: true };
  }
}
