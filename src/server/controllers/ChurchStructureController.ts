import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { ChurchStructureService } from '../services/ChurchStructureService.js';

function routeParam(param: unknown): string {
  if (param === undefined || param === null) throw new Error('Missing route parameter');
  if (Array.isArray(param)) {
    const first = param[0];
    if (typeof first !== 'string' || !first) throw new Error('Missing route parameter');
    return first;
  }
  if (typeof param !== 'string' || !param) throw new Error('Missing route parameter');
  return param;
}

function queryParam(q: unknown): string | undefined {
  if (q === undefined || q === null) return undefined;
  if (Array.isArray(q)) return typeof q[0] === 'string' ? q[0] : undefined;
  return typeof q === 'string' ? q : undefined;
}

export class ChurchStructureController {
  // ---- Campuses ----
  static async createCampus(req: TenantRequest, res: Response) {
    try {
      const campus = await ChurchStructureService.createCampus(req.tenantId!, req.body);
      res.status(201).json({ status: 'success', data: campus });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  static async getCampuses(req: TenantRequest, res: Response) {
    try {
      const campuses = await ChurchStructureService.getCampuses(req.tenantId!);
      res.status(200).json({ status: 'success', data: campuses });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  static async getCampusById(req: TenantRequest, res: Response) {
    try {
      const campus = await ChurchStructureService.getCampusHierarchy(req.tenantId!, routeParam(req.params.id));
      res.status(200).json({ status: 'success', data: campus });
    } catch (error: any) {
      res.status(404).json({ status: 'error', error: error.message });
    }
  }

  static async updateCampus(req: TenantRequest, res: Response) {
    try {
      const campus = await ChurchStructureService.updateCampus(req.tenantId!, routeParam(req.params.id), req.body);
      res.status(200).json({ status: 'success', data: campus });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  // ---- Ministries ----
  static async getMinistries(req: TenantRequest, res: Response) {
    try {
      const ministries = await ChurchStructureService.getMinistries(req.tenantId!, queryParam(req.query.campusId));
      res.status(200).json({ status: 'success', data: ministries });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  static async createMinistry(req: TenantRequest, res: Response) {
    try {
      const ministry = await ChurchStructureService.createMinistry(req.tenantId!, req.body);
      res.status(201).json({ status: 'success', data: ministry });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  static async updateMinistry(req: TenantRequest, res: Response) {
    try {
      const ministry = await ChurchStructureService.updateMinistry(req.tenantId!, routeParam(req.params.id), req.body);
      res.status(200).json({ status: 'success', data: ministry });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  static async deleteMinistry(req: TenantRequest, res: Response) {
    try {
      await ChurchStructureService.deleteMinistry(req.tenantId!, routeParam(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  // ---- Regions ----
  static async getRegions(req: TenantRequest, res: Response) {
    try {
      const regions = await ChurchStructureService.getRegions(req.tenantId!);
      res.status(200).json({ status: 'success', data: regions });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  static async createRegion(req: TenantRequest, res: Response) {
    try {
      const region = await ChurchStructureService.createRegion(req.tenantId!, req.body);
      res.status(201).json({ status: 'success', data: region });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  // ---- Zones ----
  static async getZones(req: TenantRequest, res: Response) {
    try {
      const zones = await ChurchStructureService.getZones(req.tenantId!);
      res.status(200).json({ status: 'success', data: zones });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  static async createZone(req: TenantRequest, res: Response) {
    try {
      const zone = await ChurchStructureService.createZone(req.tenantId!, req.body);
      res.status(201).json({ status: 'success', data: zone });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  // ---- Small Groups ----
  static async getSmallGroups(req: TenantRequest, res: Response) {
    try {
      const groups = await ChurchStructureService.getSmallGroups(req.tenantId!, queryParam(req.query.zoneId));
      res.status(200).json({ status: 'success', data: groups });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  static async getSmallGroupById(req: TenantRequest, res: Response) {
    try {
      const group = await ChurchStructureService.getSmallGroupById(req.tenantId!, routeParam(req.params.id));
      res.status(200).json({ status: 'success', data: group });
    } catch (error: any) {
      res.status(404).json({ status: 'error', error: error.message });
    }
  }

  static async createSmallGroup(req: TenantRequest, res: Response) {
    try {
      const group = await ChurchStructureService.createSmallGroup(req.tenantId!, req.body);
      res.status(201).json({ status: 'success', data: group });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  static async updateSmallGroup(req: TenantRequest, res: Response) {
    try {
      const group = await ChurchStructureService.updateSmallGroup(req.tenantId!, routeParam(req.params.id), req.body);
      res.status(200).json({ status: 'success', data: group });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  static async deleteSmallGroup(req: TenantRequest, res: Response) {
    try {
      await ChurchStructureService.deleteSmallGroup(req.tenantId!, routeParam(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  // ---- Small Group Members ----
  static async getSmallGroupMembers(req: TenantRequest, res: Response) {
    try {
      const members = await ChurchStructureService.getSmallGroupMembers(req.tenantId!, routeParam(req.params.id));
      res.status(200).json({ status: 'success', data: members });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  static async addSmallGroupMember(req: TenantRequest, res: Response) {
    try {
      const member = await ChurchStructureService.addSmallGroupMember(req.tenantId!, routeParam(req.params.id), req.body);
      res.status(201).json({ status: 'success', data: member });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  static async updateSmallGroupMember(req: TenantRequest, res: Response) {
    try {
      const member = await ChurchStructureService.updateSmallGroupMember(
        req.tenantId!,
        routeParam(req.params.id),
        routeParam(req.params.memberId),
        req.body,
      );
      res.status(200).json({ status: 'success', data: member });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  static async removeSmallGroupMember(req: TenantRequest, res: Response) {
    try {
      await ChurchStructureService.removeSmallGroupMember(req.tenantId!, routeParam(req.params.id), routeParam(req.params.memberId));
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }

  static async getPathways(req: TenantRequest, res: Response) {
    try {
      const pathways = await ChurchStructureService.getPathways(req.tenantId!);
      res.status(200).json({ status: 'success', data: pathways });
    } catch (error: any) {
      res.status(400).json({ status: 'error', error: error.message });
    }
  }
}
