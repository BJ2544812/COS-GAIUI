import crypto from 'crypto';
import { EventRepository } from '../repositories/EventRepository.js';
import { EventBus } from '../events/eventBus.js';
import { NotificationService } from './NotificationService.js';
import {
  getEventPublicProfile,
  isPublishedToWebsite,
  mergeEventPublicProfile,
  publicRegistrationCount,
  registrationOpenForPublic,
  type EventPublicProfile,
  type EventPublicRegistration,
} from '../../lib/eventPublicProfile.js';
import type { Prisma } from '@prisma/client';

export type PublicEventDto = {
  id: string;
  name: string;
  type: string;
  date: string;
  location?: string;
  campusName?: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  speaker?: string;
  category?: string;
  registrationOpen: boolean;
  registrationCount?: number;
  capacity?: number;
  spotsRemaining?: number;
};

function toPublicDto(
  event: {
    id: string;
    name: string;
    type: string;
    date: Date;
    location: string | null;
    registrationOpen: boolean;
    status: string;
    opsConfig: unknown;
    campus?: { name: string } | null;
  },
): PublicEventDto {
  const pub = getEventPublicProfile(event.opsConfig);
  const count = publicRegistrationCount(event.opsConfig);
  const cap = typeof pub.capacity === 'number' && pub.capacity > 0 ? pub.capacity : undefined;
  const open = registrationOpenForPublic(event);
  return {
    id: event.id,
    name: event.name,
    type: event.type,
    date: event.date.toISOString(),
    location: event.location ?? undefined,
    campusName: event.campus?.name,
    description: pub.publicDescription,
    imageUrl: pub.bannerImageUrl ?? pub.thumbnailImageUrl,
    thumbnailUrl: pub.thumbnailImageUrl ?? pub.bannerImageUrl,
    speaker: pub.speaker,
    category: pub.category,
    registrationOpen: open,
    registrationCount: count,
    capacity: cap,
    spotsRemaining: cap !== undefined ? Math.max(0, cap - count) : undefined,
  };
}

export class EventPublicService {
  static async mergePublicProfile(
    tenantId: string,
    eventId: string,
    patch: Partial<EventPublicProfile>,
  ) {
    const event = await EventRepository.findById(tenantId, eventId);
    if (!event) throw new Error('Event not found');
    const merged = mergeEventPublicProfile(event.opsConfig, patch);
    const update: Prisma.EventUpdateInput = {
      opsConfig: merged as Prisma.InputJsonValue,
    };
    if (patch.acceptsRegistration === true) {
      update.registrationOpen = true;
    }
    if (patch.acceptsRegistration === false) {
      update.registrationOpen = false;
    }
    return EventRepository.update(tenantId, eventId, update);
  }

  static async listPublishedEvents(tenantId: string, limit = 20): Promise<PublicEventDto[]> {
    const cap = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const rows = await EventRepository.findPublishedForWebsite(tenantId, cap * 3);
    const published = rows.filter((e) => isPublishedToWebsite(e.opsConfig));

    const upcoming = published
      .filter((e) => e.date >= startOfToday)
      .sort((a, b) => +a.date - +b.date);
    const past = published
      .filter((e) => e.date < startOfToday)
      .sort((a, b) => +b.date - +a.date);

    const merged = [...upcoming, ...past.reverse()].slice(0, cap);
    return merged.map(toPublicDto);
  }

  static async getPublishedEvent(tenantId: string, eventId: string): Promise<PublicEventDto | null> {
    const event = await EventRepository.findById(tenantId, eventId);
    if (!event || !isPublishedToWebsite(event.opsConfig)) return null;
    return toPublicDto(event);
  }

  static async registerGuest(
    tenantId: string,
    eventId: string,
    input: { name: string; email?: string; phone?: string },
  ) {
    const event = await EventRepository.findById(tenantId, eventId);
    if (!event) throw new Error('Event not found');
    if (!isPublishedToWebsite(event.opsConfig)) {
      throw new Error('This event is not published on the website');
    }
    if (!registrationOpenForPublic(event)) {
      throw new Error('Registration is not open for this event');
    }

    const pub = getEventPublicProfile(event.opsConfig);
    const existing = pub.registrations ?? [];
    const cap = typeof pub.capacity === 'number' && pub.capacity > 0 ? pub.capacity : null;
    if (cap !== null && existing.length >= cap) {
      throw new Error('This event is at capacity');
    }

    const email = input.email?.trim().toLowerCase();
    if (email && existing.some((r) => r.email?.toLowerCase() === email)) {
      throw new Error('This email is already registered for this event');
    }

    const registration: EventPublicRegistration = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      email: input.email?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const merged = mergeEventPublicProfile(event.opsConfig, {
      registrations: [...existing, registration],
    });

    await EventRepository.update(tenantId, eventId, {
      opsConfig: merged as Prisma.InputJsonValue,
    });

    await EventBus.publish({
      eventName: 'EventRegistrationCompleted',
      tenantId,
      entityId: eventId,
      entityType: 'Event',
      payload: {
        eventName: event.name,
        registrantName: registration.name,
        registrationId: registration.id,
      },
    });

    try {
      await NotificationService.createNotification({
        tenantId,
        type: 'EventRegistration',
        title: 'New event registration',
        message: `${registration.name} registered for “${event.name}”.`,
        targetRole: 'Admin',
        priority: 'MEDIUM',
        actionType: 'VIEW_MODULE',
        actionLink: 'events',
        expiresInDays: 30,
      });
    } catch {
      /* notification optional if worker unavailable */
    }

    return { registration, registrationCount: existing.length + 1 };
  }
}
