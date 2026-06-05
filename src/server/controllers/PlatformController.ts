import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { PlatformService } from '../services/PlatformService.js';
import { FeatureFlagService } from '../services/FeatureFlagService.js';
import { OperationalMonitoringService } from '../services/OperationalMonitoringService.js';
import { PlatformOperatorService } from '../services/PlatformOperatorService.js';
import { listIntegrationCapabilities } from '../integrations/registry.js';
import type { FeatureFlagMap } from '../utils/featureFlags.js';

export class PlatformController {
  static async getHealth(req: TenantRequest, res: Response) {
    try {
      const data = await PlatformService.getPlatformHealth(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Health check failed' });
    }
  }

  static async getAdminOverview(req: TenantRequest, res: Response) {
    try {
      const data = await PlatformService.getAdminOverview(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async globalSearch(req: TenantRequest, res: Response) {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const data = await PlatformService.globalSearch(req.tenantId!, q);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Search failed' });
    }
  }

  static async getFeatureFlags(req: TenantRequest, res: Response) {
    try {
      const data = await FeatureFlagService.getFlags(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async updateFeatureFlags(req: TenantRequest, res: Response) {
    try {
      const patch = req.body as Partial<FeatureFlagMap>;
      const data = await FeatureFlagService.updateFlags(req.tenantId!, patch);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getComplianceAudit(req: TenantRequest, res: Response) {
    try {
      const data = await PlatformService.getComplianceAudit(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async exportReport(req: TenantRequest, res: Response) {
    try {
      const kind = (req.params.kind as 'attendance' | 'volunteer' | 'operational' | 'readiness') || 'operational';
      const { filename, csv } = await PlatformService.exportCsvReport(req.tenantId!, kind);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Export failed' });
    }
  }

  static async getIncidents(req: TenantRequest, res: Response) {
    try {
      const data = await OperationalMonitoringService.getIncidentPanel(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async replayFailedWorkflows(req: TenantRequest, res: Response) {
    try {
      const eventIds = Array.isArray(req.body?.eventIds) ? (req.body.eventIds as string[]) : undefined;
      const data = await OperationalMonitoringService.replayFailedWorkflows(req.tenantId!, eventIds);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async resolveIncident(req: TenantRequest, res: Response) {
    try {
      const data = await OperationalMonitoringService.resolveIncident(
        req.tenantId!,
        req.params.id as string,
      );
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getQueueMetrics(req: TenantRequest, res: Response) {
    try {
      const data = await OperationalMonitoringService.getQueueMetrics();
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async flushCache(req: TenantRequest, res: Response) {
    try {
      const data = PlatformOperatorService.flushTenantCache(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getDiagnostics(req: TenantRequest, res: Response) {
    try {
      const data = await PlatformOperatorService.getDiagnostics(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async exportDiagnostics(req: TenantRequest, res: Response) {
    try {
      const data = await PlatformOperatorService.exportDiagnosticsJson(req.tenantId!);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="diagnostics-${Date.now()}.json"`);
      res.send(JSON.stringify(data, null, 2));
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getIntegrations(req: TenantRequest, res: Response) {
    try {
      res.status(200).json({ status: 'success', data: listIntegrationCapabilities() });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async logClientError(req: TenantRequest, res: Response) {
    try {
      const { message, stack, module: mod } = req.body as {
        message?: string;
        stack?: string;
        module?: string;
      };
      if (!message) return res.status(400).json({ error: 'message required' });
      const data = await PlatformService.logClientError(req.tenantId!, {
        message,
        stack,
        module: mod,
        userId: req.user?.id,
      });
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }
}
