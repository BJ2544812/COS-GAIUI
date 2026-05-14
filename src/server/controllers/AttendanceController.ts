import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { AttendanceService } from '../services/AttendanceService.js';
import { toErrorResponse } from '../utils/apiErrors.js';

export class AttendanceController {
  // Session Endpoints
  static async createSession(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const session = await AttendanceService.createSession(tenantId, req.body);
      res.status(201).json({ status: 'success', data: session });
    } catch (error: any) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getSessions(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const sessions = await AttendanceService.getSessions(tenantId);
      res.status(200).json({ status: 'success', data: sessions });
    } catch (error: any) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getSessionById(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const session = await AttendanceService.getSessionById(tenantId, id as string);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      res.status(200).json({ status: 'success', data: session });
    } catch (error: any) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async updateSession(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const session = await AttendanceService.updateSession(tenantId, id as string, req.body);
      res.status(200).json({ status: 'success', data: session });
    } catch (error: any) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  // Attendance Record Endpoints
  static async recordAttendance(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id: sessionId } = req.params; // If called via /sessions/:id/records
      const data = { 
        ...req.body, 
        sessionId: sessionId || req.body.sessionId,
        tenantId 
      };
      const attendance = await AttendanceService.recordAttendance(tenantId, data);
      res.status(201).json({ status: 'success', data: attendance });
    } catch (error: any) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getSessionRecords(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const records = await AttendanceService.getRecordsBySession(tenantId, id as string);
      res.status(200).json({ status: 'success', data: records });
    } catch (error: any) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getAttendanceForEvent(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { eventId } = req.params;
      const attendances = await AttendanceService.getAttendanceForEvent(tenantId, eventId as string);
      res.status(200).json({ status: 'success', data: attendances });
    } catch (error: any) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getMetrics(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const metrics = await AttendanceService.getMetrics(tenantId);
      res.status(200).json({ status: 'success', data: metrics });
    } catch (error: any) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }
}
