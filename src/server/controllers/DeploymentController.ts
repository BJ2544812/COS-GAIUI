import { Request, Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { DeploymentService } from '../services/DeploymentService.js';

export class DeploymentController {
  static async setupStatus(_req: Request, res: Response) {
    try {
      const data = await DeploymentService.getSetupStatus();
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async validateInfrastructure(req: TenantRequest, res: Response) {
    try {
      const data = await DeploymentService.validateInfrastructure(req.tenantId);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getVersion(_req: Request, res: Response) {
    try {
      const version = DeploymentService.getVersionInfo();
      const migrations = await DeploymentService.getMigrationStatus();
      res.status(200).json({ status: 'success', data: { ...version, migrations } });
    } catch (error: unknown) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getOnboarding(req: TenantRequest, res: Response) {
    try {
      const data = await DeploymentService.getOnboardingChecklist(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async patchOnboarding(req: TenantRequest, res: Response) {
    try {
      const { stepId, completed } = req.body as { stepId?: string; completed?: boolean };
      if (!stepId || typeof completed !== 'boolean') {
        return res.status(400).json({ error: 'stepId and completed are required' });
      }
      const data = await DeploymentService.patchOnboardingStep(req.tenantId!, stepId, completed);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async createBackup(req: TenantRequest, res: Response) {
    try {
      const data = await DeploymentService.createTenantBackup(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Backup failed' });
    }
  }

  static async restoreBackup(req: TenantRequest, res: Response) {
    try {
      const data = await DeploymentService.restoreTenantBackup(req.tenantId!, req.body);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Restore failed' });
    }
  }

  static async activateDemo(req: TenantRequest, res: Response) {
    try {
      const data = await DeploymentService.activateDemoMode(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getLicense(req: TenantRequest, res: Response) {
    try {
      const data = await DeploymentService.getLicenseEntitlements(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async listBackups(req: TenantRequest, res: Response) {
    try {
      const data = await DeploymentService.listBackupRuns(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async runScheduledBackup(req: TenantRequest, res: Response) {
    try {
      const data = await DeploymentService.runScheduledBackup(req.tenantId!);
      res.status(201).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Backup failed' });
    }
  }

  static async verifyBackup(req: TenantRequest, res: Response) {
    try {
      const data = await DeploymentService.verifyLatestBackup(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async resetDemo(req: TenantRequest, res: Response) {
    try {
      const data = await DeploymentService.resetDemoMode(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async getMaintenance(req: TenantRequest, res: Response) {
    try {
      const data = await DeploymentService.getMaintenanceMode(req.tenantId!);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }

  static async setMaintenance(req: TenantRequest, res: Response) {
    try {
      const { enabled, message } = req.body as { enabled?: boolean; message?: string };
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: 'enabled boolean required' });
      }
      const data = await DeploymentService.setMaintenanceMode(req.tenantId!, { enabled, message });
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  }
}
