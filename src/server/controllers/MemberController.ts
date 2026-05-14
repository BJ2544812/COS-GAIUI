import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { MemberService } from '../services/MemberService.js';
import { toErrorResponse } from '../utils/apiErrors.js';

export class MemberController {
  static async createMember(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const member = await MemberService.createMember(tenantId, req.body);
      res.status(201).json({ status: 'success', data: member });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getMembers(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const members = await MemberService.getMembers(tenantId);
      const data = (members as any[]).map((m) => {
        const { memberResponsibilities, ...rest } = m;
        return {
          ...rest,
          responsibilities: memberResponsibilities ?? [],
        };
      });
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getMemberById(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      console.log("GET MEMBER PROFILE ID:", id);
      const member = await MemberService.getMemberById(tenantId, id as string);
      if (!member) {
        return res.status(404).json({ error: toErrorResponse(new Error('Member not found')) });
      }

      // Map relation names to match frontend expectations
      const data = {
        ...member,
        documents: (member as any).memberDocuments ?? [],
        milestones: (member as any).spiritualMilestones ?? [],
        attendances: (member as any).attendances ?? [],
        careNotes: (member as any).careNotes ?? [],
        donations: (member as any).donations ?? [],
        responsibilities: (member as any).memberResponsibilities ?? []
      };

      res.status(200).json({ status: 'success', data });
    } catch (error: any) {
      console.error("MEMBER PROFILE ERROR:", error);
      res.status(500).json({ error: toErrorResponse(error) });
    }
  }

  static async updateMember(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      const member = await MemberService.updateMember(tenantId, id as string, req.body);
      const m = member as any;
      const {
        memberDocuments,
        spiritualMilestones,
        memberResponsibilities,
        attendances,
        careNotes,
        donations,
        ...rest
      } = m;
      const data = {
        ...rest,
        documents: memberDocuments ?? [],
        milestones: spiritualMilestones ?? [],
        attendances: attendances ?? [],
        careNotes: careNotes ?? [],
        donations: donations ?? [],
        responsibilities: memberResponsibilities ?? [],
      };
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async deleteMember(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { id } = req.params;
      await MemberService.deleteMember(tenantId, id as string);
      res.status(204).send();
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }
}
