import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { DiscipleshipV2Service } from '../services/DiscipleshipV2Service.js';
import { Prisma } from '@prisma/client';

export class DiscipleshipV2Controller {
  // --- Tasks ---
  static async createTask(req: TenantRequest, res: Response) {
    try {
      const task = await DiscipleshipV2Service.createTask(req.tenantId!, req.user.id, req.body);
      res.status(201).json({ status: 'success', data: task });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getMyTasks(req: TenantRequest, res: Response) {
    try {
      console.log(`[DiscipleshipV2] getMyTasks: tenantId=${req.tenantId}, userId=${req.user.id}`);
      const tasks = await DiscipleshipV2Service.getVisibleTasks(req.tenantId!, req.user.id);
      console.log(`[DiscipleshipV2] getMyTasks: success, count=${tasks.length}`);
      res.status(200).json({ status: 'success', data: tasks });
    } catch (error: any) {
      console.error(`[DiscipleshipV2] getMyTasks error:`, error);
      res.status(400).json({ error: error.message });
    }
  }

  static async completeTask(req: TenantRequest, res: Response) {
    try {
      const task = await DiscipleshipV2Service.completeTask(req.tenantId!, req.params.id as string, req.user.id);
      res.status(200).json({ status: 'success', data: task });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async cancelTask(req: TenantRequest, res: Response) {
    try {
      const task = await DiscipleshipV2Service.cancelTask(req.tenantId!, req.params.id as string, req.user.id);
      res.status(200).json({ status: 'success', data: task });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async reassignTask(req: TenantRequest, res: Response) {
    try {
      const task = await DiscipleshipV2Service.reassignTask(req.tenantId!, req.params.id as string, req.body.assignedUserId, req.user.id);
      res.status(200).json({ status: 'success', data: task });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // --- Care System ---
  static async createCareCase(req: TenantRequest, res: Response) {
    try {
      const { memberId, ...data } = req.body;
      const careCase = await DiscipleshipV2Service.createCareCase(req.tenantId!, memberId, req.user.id, data);
      res.status(201).json({ status: 'success', data: careCase });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getCareCases(req: TenantRequest, res: Response) {
    try {
      console.log(`[DiscipleshipV2] getCareCases: tenantId=${req.tenantId}, userRole=${req.user.role}`);
      // Visibility is enforced based on user role inside getVisibleCareCases
      const careCases = await DiscipleshipV2Service.getVisibleCareCases(req.tenantId!, req.user.role);
      console.log(`[DiscipleshipV2] getCareCases: success, count=${careCases.length}`);
      res.status(200).json({ status: 'success', data: careCases });
    } catch (error: any) {
      console.error(`[DiscipleshipV2] getCareCases error:`, error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getCareCase(req: TenantRequest, res: Response) {
    try {
      const id = String(req.params.id || '');
      const careCase = await DiscipleshipV2Service.getCareCaseForViewer(req.tenantId!, id, req.user.role);
      if (!careCase) return res.status(404).json({ error: 'Care case not found' });
      res.status(200).json({ status: 'success', data: careCase });
    } catch (error: any) {
      const code = error.statusCode === 403 ? 403 : 400;
      res.status(code).json({ error: error.message });
    }
  }

  static async closeCareCase(req: TenantRequest, res: Response) {
    try {
      const careCase = await DiscipleshipV2Service.closeCareCase(req.tenantId!, req.params.id as string, req.user.id);
      res.status(200).json({ status: 'success', data: careCase });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async addCareLog(req: TenantRequest, res: Response) {
    try {
      const { careCaseId } = req.params;
      const log = await DiscipleshipV2Service.addCareLog(req.tenantId!, careCaseId as string, req.user.id, req.body);
      res.status(201).json({ status: 'success', data: log });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  // --- Mentorship ---
  static async assignMentor(req: TenantRequest, res: Response) {
    try {
      const { mentorId, discipleId } = req.body;
      const mentorship = await DiscipleshipV2Service.assignMentor(req.tenantId!, mentorId, discipleId);
      res.status(201).json({ status: 'success', data: mentorship });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async reassignMentor(req: TenantRequest, res: Response) {
    try {
      const mentorship = await DiscipleshipV2Service.reassignMentor(req.tenantId!, req.params.id as string, req.body.newMentorId);
      res.status(200).json({ status: 'success', data: mentorship });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  static async completeMentorship(req: TenantRequest, res: Response) {
    try {
      const mentorship = await DiscipleshipV2Service.completeMentorship(req.tenantId!, req.params.id as string);
      res.status(200).json({ status: 'success', data: mentorship });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
