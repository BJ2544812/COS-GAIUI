import { EventRepository } from '../repositories/EventRepository.js';
import { Prisma } from '@prisma/client';
import { EventBus } from '../events/eventBus.js';

export class EventService {
  static async createEvent(tenantId: string, data: Omit<Prisma.EventCreateInput, 'tenant'>) {
    const event = await EventRepository.create(tenantId, data as any);
    
    await EventBus.publish({
      eventName: 'EventCreated',
      tenantId,
      entityId: event.id,
      entityType: 'Event',
      payload: { name: event.name, date: event.date, type: event.type }
    });
    
    return event;
  }

  static async getEvents(tenantId: string) {
    return EventRepository.findAll(tenantId);
  }

  static async getEventById(tenantId: string, id: string) {
    return EventRepository.findById(tenantId, id);
  }

  static async updateEvent(tenantId: string, id: string, data: Prisma.EventUpdateInput) {
    return EventRepository.update(tenantId, id, data);
  }

  static async deleteEvent(tenantId: string, id: string) {
    return EventRepository.delete(tenantId, id);
  }
}
