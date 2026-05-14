import { Response } from 'express';
import { AnalyticsService, AnalyticsPeriod } from '../services/AnalyticsService.js';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { toErrorResponse } from '../utils/apiErrors.js';
import { EventBus } from '../events/eventBus.js';
import { prisma } from '../utils/prisma.js';

export class AnalyticsController {
  static async getMemberAnalytics(req: TenantRequest, res: Response) {
    try {
      const period = (req.query.period as AnalyticsPeriod) || 'this_month';
      const stats = await AnalyticsService.getMembers(req.tenantId!, period);
      res.json({ status: 'success', data: stats });
    } catch (error) {
      console.error('[AnalyticsController.getMemberAnalytics]', error);
      res.status(500).json({ status: 'error', message: toErrorResponse(error).message });
    }
  }

  static async getFinancialAnalytics(req: TenantRequest, res: Response) {
    try {
      const period = (req.query.period as AnalyticsPeriod) || 'this_month';
      const stats = await AnalyticsService.getFinancial(req.tenantId!, period);
      res.json({ status: 'success', data: stats });
    } catch (error) {
      console.error('[AnalyticsController.getFinancialAnalytics]', error);
      res.status(500).json({ status: 'error', message: toErrorResponse(error).message });
    }
  }

  static async getAttendanceAnalytics(req: TenantRequest, res: Response) {
    try {
      const period = (req.query.period as AnalyticsPeriod) || 'this_month';
      const stats = await AnalyticsService.getAttendance(req.tenantId!, period);
      res.json({ status: 'success', data: stats });
    } catch (error) {
      console.error('[AnalyticsController.getAttendanceAnalytics]', error);
      res.status(500).json({ status: 'error', message: toErrorResponse(error).message });
    }
  }

  static async getGrowthAnalytics(req: TenantRequest, res: Response) {
    try {
      const period = (req.query.period as AnalyticsPeriod) || 'this_month';
      const stats = await AnalyticsService.getMembers(req.tenantId!, period);
      res.json({ status: 'success', data: stats });
    } catch (error) {
      console.error('[AnalyticsController.getGrowthAnalytics]', error);
      res.status(500).json({ status: 'error', message: toErrorResponse(error).message });
    }
  }

  static async risk(req: TenantRequest, res: Response) {
    try {
      const signals = await AnalyticsService.getRiskSignals(req.tenantId!);
      res.json({ status: 'success', data: signals });
    } catch (error) {
      console.error('[AnalyticsController.risk]', error);
      res.status(500).json({ status: 'error', message: toErrorResponse(error).message });
    }
  }

  static async getEventStats(req: TenantRequest, res: Response) {
    try {
      const stats = await EventBus.getEventStats(req.tenantId!);
      res.json({ status: 'success', data: stats });
    } catch (error) {
      console.error('[AnalyticsController.getEventStats]', error);
      res.status(500).json({ status: 'error', message: toErrorResponse(error).message });
    }
  }

  static async getEventTimeline(req: TenantRequest, res: Response) {
    try {
      const limit = parseInt((req.query.limit as string) || '10', 10);
      const events = await prisma.eventLog.findMany({
        where: { tenantId: req.tenantId! },
        orderBy: { occurredAt: 'desc' },
        take: limit,
        select: {
          id: true,
          eventName: true,
          status: true,
          occurredAt: true,
          entityType: true,
          payload: true
        }
      });
      res.json({ status: 'success', data: events });
    } catch (error) {
      console.error('[AnalyticsController.getEventTimeline]', error);
      res.status(500).json({ status: 'error', message: toErrorResponse(error).message });
    }
  }
}
