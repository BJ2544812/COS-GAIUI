import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { MinistryIntelligenceService } from '../services/MinistryIntelligenceService.js';

function campusFromQuery(req: TenantRequest): string | undefined {
  const c = req.query.campusId;
  return typeof c === 'string' && c.length > 0 ? c : undefined;
}

export class MinistryIntelligenceController {
  static async getFull(req: TenantRequest, res: Response) {
    try {
      const data = await MinistryIntelligenceService.getFullIntelligence(req.tenantId!, campusFromQuery(req));
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load ministry intelligence';
      res.status(400).json({ error: message });
    }
  }

  static async getVolunteerHealth(req: TenantRequest, res: Response) {
    try {
      const data = await MinistryIntelligenceService.getVolunteerHealth(req.tenantId!, campusFromQuery(req));
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getServiceHealth(req: TenantRequest, res: Response) {
    try {
      const data = await MinistryIntelligenceService.getServiceHealth(req.tenantId!, campusFromQuery(req));
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getEventHealth(req: TenantRequest, res: Response) {
    try {
      const data = await MinistryIntelligenceService.getEventHealth(req.tenantId!, campusFromQuery(req));
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getPredictive(req: TenantRequest, res: Response) {
    try {
      const data = await MinistryIntelligenceService.getPredictiveSignals(req.tenantId!, campusFromQuery(req));
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getEngagement(req: TenantRequest, res: Response) {
    try {
      const data = await MinistryIntelligenceService.getEngagementSignals(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getFollowUp(req: TenantRequest, res: Response) {
    try {
      const data = await MinistryIntelligenceService.getFollowUpPriority(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getExecutive(req: TenantRequest, res: Response) {
    try {
      const data = await MinistryIntelligenceService.getExecutiveDashboard(req.tenantId!, campusFromQuery(req));
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getPastoral(req: TenantRequest, res: Response) {
    try {
      const data = await MinistryIntelligenceService.getPastoralInsights(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getCampusOverview(req: TenantRequest, res: Response) {
    try {
      const data = await MinistryIntelligenceService.getCampusOverview(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getMinistryJourney(req: TenantRequest, res: Response) {
    try {
      const memberId = req.params.memberId as string;
      const data = await MinistryIntelligenceService.getMinistryJourney(req.tenantId!, memberId);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }
}
