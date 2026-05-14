import { AttendanceRepository } from '../repositories/AttendanceRepository.js';
import { Prisma } from '@prisma/client';

export class AttendanceService {
  // Session Service
  static async createSession(tenantId: string, data: any) {
    return AttendanceRepository.createSession(tenantId, data);
  }

  static async getSessions(tenantId: string) {
    return AttendanceRepository.getSessions(tenantId);
  }

  static async getSessionById(tenantId: string, id: string) {
    return AttendanceRepository.getSessionById(tenantId, id);
  }

  static async updateSession(tenantId: string, id: string, data: any) {
    return AttendanceRepository.updateSession(tenantId, id, data);
  }

  // Attendance Service
  static async recordAttendance(tenantId: string, data: Omit<Prisma.AttendanceUncheckedCreateInput, 'tenant'>) {
    return AttendanceRepository.recordAttendance(tenantId, data as any);
  }

  static async getRecordsBySession(tenantId: string, sessionId: string) {
    return AttendanceRepository.getRecordsBySession(tenantId, sessionId);
  }

  static async getAttendanceForEvent(tenantId: string, eventId: string) {
    return AttendanceRepository.findByEvent(tenantId, eventId);
  }

  static async getMetrics(tenantId: string) {
    return AttendanceRepository.getMetrics(tenantId);
  }
}
