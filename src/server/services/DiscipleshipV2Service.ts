import { DiscipleshipV2Repository } from '../repositories/DiscipleshipV2Repository.js';
import { TaskTargetResolverService } from './TaskTargetResolverService.js';
import { EventBus } from '../events/eventBus.js';
import { ConfidentialityLevel, TaskStatus, CareCaseStatus, TaskTargetType, Prisma } from '@prisma/client';

export class DiscipleshipV2Service {
  // --- Visibility & Permission Helpers ---
  private static determineConfidentialityAccess(userRole: string): ConfidentialityLevel[] {
    const levels = [ConfidentialityLevel.PUBLIC];
    const role = (userRole || '').toUpperCase().replace(/\s/g, '_');

    if (role === 'SYSTEM_ADMIN' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return [ConfidentialityLevel.PUBLIC, ConfidentialityLevel.GROUP, ConfidentialityLevel.PASTORAL, ConfidentialityLevel.SENIOR_PASTORAL, ConfidentialityLevel.RESTRICTED];
    }
    if (role === 'PASTOR' || role === 'SENIOR_PASTOR') {
      return [ConfidentialityLevel.PUBLIC, ConfidentialityLevel.GROUP, ConfidentialityLevel.PASTORAL, ConfidentialityLevel.SENIOR_PASTORAL, ConfidentialityLevel.RESTRICTED];
    }
    if (role === 'COUNSELOR') {
      return [ConfidentialityLevel.PUBLIC, ConfidentialityLevel.GROUP, ConfidentialityLevel.PASTORAL];
    }
    if (role === 'SHEPHERD') {
      return [ConfidentialityLevel.PUBLIC, ConfidentialityLevel.GROUP];
    }
    return levels; // Volunteers / basic users see only PUBLIC by default
  }

  // --- Task Lifecycle Engine ---
  static async createTask(tenantId: string, userId: string, data: any) {
    // 1. Validate Target Entity
    await TaskTargetResolverService.validateTarget(tenantId, data.targetType, data.targetId);

    // 2. Create Task
    const task = await DiscipleshipV2Repository.createTask(tenantId, { ...data, createdById: userId });
    
    // 3. Emit Event
    void EventBus.publish({
      eventName: 'TaskCreated',
      tenantId,
      entityId: task.id,
      entityType: 'Task',
      payload: { targetType: task.targetType, targetId: task.targetId, assignedUserId: task.assignedUserId }
    });

    return task;
  }

  static async completeTask(tenantId: string, taskId: string, userId: string) {
    const task = await DiscipleshipV2Repository.updateTask(tenantId, taskId, { status: TaskStatus.COMPLETED, updatedById: userId });
    void EventBus.publish({ eventName: 'TaskCompleted', tenantId, entityId: task.id, entityType: 'Task', payload: { taskId } });
    return task;
  }

  static async cancelTask(tenantId: string, taskId: string, userId: string) {
    const task = await DiscipleshipV2Repository.updateTask(tenantId, taskId, { status: TaskStatus.CANCELLED, updatedById: userId });
    void EventBus.publish({ eventName: 'TaskCancelled', tenantId, entityId: task.id, entityType: 'Task', payload: { taskId } });
    return task;
  }

  static async reassignTask(tenantId: string, taskId: string, newAssignedUserId: string, userId: string) {
    const task = await DiscipleshipV2Repository.updateTask(tenantId, taskId, { assignedUserId: newAssignedUserId, updatedById: userId });
    void EventBus.publish({ eventName: 'TaskReassigned', tenantId, entityId: task.id, entityType: 'Task', payload: { newAssignedUserId } });
    return task;
  }

  static async getVisibleTasks(tenantId: string, assignedUserId?: string) {
    return DiscipleshipV2Repository.findVisibleTasks(tenantId, assignedUserId);
  }

  // --- Care System Workflow ---
  static async createCareCase(tenantId: string, memberId: string, userId: string, data: any) {
    const careCase = await DiscipleshipV2Repository.createCareCase(tenantId, memberId, { ...data, createdById: userId });
    
    void EventBus.publish({
      eventName: 'CareCaseOpened',
      tenantId,
      entityId: careCase.id,
      entityType: 'CareCase',
      payload: { memberId, category: careCase.category, urgency: careCase.urgency }
    });

    return careCase;
  }

  static async getVisibleCareCases(tenantId: string, userRole: string, assignedUserId?: string) {
    const levels = this.determineConfidentialityAccess(userRole);
    return DiscipleshipV2Repository.findVisibleCareCases(tenantId, levels, assignedUserId);
  }

  /** Single case with logs (for detail view after navigation / refresh). */
  static async getCareCaseForViewer(tenantId: string, caseId: string, userRole: string) {
    const allowed = this.determineConfidentialityAccess(userRole);
    const c = await DiscipleshipV2Repository.getCareCaseById(tenantId, caseId);
    if (!c) return null;
    if (!allowed.includes(c.confidentialityLevel)) {
      const err = new Error('Care case not visible for this role') as Error & { statusCode?: number };
      err.statusCode = 403;
      throw err;
    }
    return c;
  }

  static async closeCareCase(tenantId: string, careCaseId: string, userId: string) {
    const careCase = await DiscipleshipV2Repository.updateCareCase(tenantId, careCaseId, { status: CareCaseStatus.CLOSED, updatedById: userId });
    void EventBus.publish({ eventName: 'CareCaseClosed', tenantId, entityId: careCase.id, entityType: 'CareCase', payload: {} });
    return careCase;
  }

  static async addCareLog(tenantId: string, careCaseId: string, userId: string, data: any) {
    // 1. Verify Case exists
    const careCase = await DiscipleshipV2Repository.getCareCaseById(tenantId, careCaseId);
    if (!careCase) throw new Error('CareCase not found');
    
    // 2. Insert Log
    const log = await DiscipleshipV2Repository.createCareLog(tenantId, careCaseId, { ...data, authorId: userId, createdById: userId });
    
    // 3. Emit Event
    void EventBus.publish({
      eventName: 'CareLogAdded',
      tenantId,
      entityId: log.id,
      entityType: 'CareLog',
      payload: { careCaseId, interactionType: log.interactionType }
    });

    return log;
  }

  // --- Mentorship Workflow ---
  static async assignMentor(tenantId: string, mentorId: string, discipleId: string) {
    const mentorship = await DiscipleshipV2Repository.createMentorship(tenantId, mentorId, discipleId);
    
    void EventBus.publish({
      eventName: 'MentorshipAssigned',
      tenantId,
      entityId: mentorship.id,
      entityType: 'Mentorship',
      payload: { mentorId, discipleId }
    });

    return mentorship;
  }

  static async completeMentorship(tenantId: string, mentorshipId: string) {
    const mentorship = await DiscipleshipV2Repository.updateMentorship(tenantId, mentorshipId, { status: 'Completed', endDate: new Date() });
    void EventBus.publish({ eventName: 'MentorshipCompleted', tenantId, entityId: mentorship.id, entityType: 'Mentorship', payload: { mentorId: mentorship.mentorId, discipleId: mentorship.discipleId } });
    return mentorship;
  }

  static async reassignMentor(tenantId: string, mentorshipId: string, newMentorId: string) {
    // End old mentorship
    await DiscipleshipV2Repository.updateMentorship(tenantId, mentorshipId, { status: 'Reassigned', endDate: new Date() });
    const oldMentorship = await DiscipleshipV2Repository.getMentorshipById(tenantId, mentorshipId);
    
    if (!oldMentorship) throw new Error("Mentorship not found");

    // Start new mentorship
    const newMentorship = await DiscipleshipV2Repository.createMentorship(tenantId, newMentorId, oldMentorship.discipleId);
    
    void EventBus.publish({ eventName: 'MentorshipReassigned', tenantId, entityId: newMentorship.id, entityType: 'Mentorship', payload: { oldMentorId: oldMentorship.mentorId, newMentorId, discipleId: oldMentorship.discipleId } });
    return newMentorship;
  }
}
