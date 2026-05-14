
import { ChurchStructureRepository } from '../repositories/ChurchStructureRepository.js';

export class ChurchStructureService {
  // --- Campuses ---
  static async createCampus(tenantId: string, data: any) {
    if (!data.name) throw new Error('Campus name is required');
    const { leaderId, ...rest } = data;
    return ChurchStructureRepository.createCampus(tenantId, { ...rest, leader: leaderId || rest.leader });
  }

  static async getCampuses(tenantId: string) {
    return ChurchStructureRepository.getCampuses(tenantId);
  }

  static async getCampusHierarchy(tenantId: string, campusId: string) {
    const campus = await ChurchStructureRepository.getCampusById(tenantId, campusId);
    if (!campus) throw new Error('Campus not found');
    return campus;
  }

  static async updateCampus(tenantId: string, id: string, data: any) {
    const { leaderId, ...rest } = data;
    return ChurchStructureRepository.updateCampus(tenantId, id, { ...rest, leader: leaderId || rest.leader });
  }

  // --- Ministries ---
  static async createMinistry(tenantId: string, data: any) {
    if (!data.name) throw new Error('Ministry name is required');
    const { leaderId, ...rest } = data; // schema doesn't support leaderId for ministry yet
    return ChurchStructureRepository.createMinistry(tenantId, rest);
  }

  static async getMinistries(tenantId: string, campusId?: string) {
    return ChurchStructureRepository.getMinistries(tenantId, campusId);
  }

  static async updateMinistry(tenantId: string, id: string, data: any) {
    return ChurchStructureRepository.updateMinistry(tenantId, id, data);
  }

  static async deleteMinistry(tenantId: string, id: string) {
    return ChurchStructureRepository.deleteMinistry(tenantId, id);
  }

  // --- Regions ---
  static async getRegions(tenantId: string) {
    return ChurchStructureRepository.getRegions(tenantId);
  }

  static async createRegion(tenantId: string, data: any) {
    if (!data.name) throw new Error('Region name is required');
    return ChurchStructureRepository.createRegion(tenantId, data);
  }

  // --- Zones ---
  static async getZones(tenantId: string) {
    return ChurchStructureRepository.getZones(tenantId);
  }

  static async createZone(tenantId: string, data: any) {
    if (!data.name) throw new Error('Zone name is required');
    if (!data.regionId) throw new Error('Region ID is required');
    return ChurchStructureRepository.createZone(tenantId, data);
  }

  // --- Small Groups ---
  static async getSmallGroups(tenantId: string, zoneId?: string) {
    return ChurchStructureRepository.getSmallGroups(tenantId, zoneId);
  }

  static async getSmallGroupById(tenantId: string, id: string) {
    const group = await ChurchStructureRepository.getSmallGroupById(tenantId, id);
    if (!group) throw new Error('Small group not found');
    return group;
  }

  static async createSmallGroup(tenantId: string, data: any) {
    if (!data.name) throw new Error('Group name is required');
    if (!data.type) throw new Error('Group type is required');
    return ChurchStructureRepository.createSmallGroup(tenantId, data);
  }

  static async updateSmallGroup(tenantId: string, id: string, data: any) {
    return ChurchStructureRepository.updateSmallGroup(tenantId, id, data);
  }

  static async deleteSmallGroup(tenantId: string, id: string) {
    return ChurchStructureRepository.deleteSmallGroup(tenantId, id);
  }

  // --- Small Group Members ---
  static async getSmallGroupMembers(tenantId: string, groupId: string) {
    return ChurchStructureRepository.getSmallGroupMembers(tenantId, groupId);
  }

  static async addSmallGroupMember(tenantId: string, groupId: string, data: { memberId: string; role?: string }) {
    if (!data.memberId) throw new Error('Member ID is required');
    return ChurchStructureRepository.addSmallGroupMember(tenantId, groupId, data.memberId, data.role || 'PARTICIPANT');
  }

  static async updateSmallGroupMember(tenantId: string, groupId: string, memberId: string, data: any) {
    return ChurchStructureRepository.updateSmallGroupMember(tenantId, groupId, memberId, data);
  }

  static async removeSmallGroupMember(tenantId: string, groupId: string, memberId: string) {
    return ChurchStructureRepository.removeSmallGroupMember(tenantId, groupId, memberId);
  }

  static async getPathways(tenantId: string) {
    return ChurchStructureRepository.listPathways(tenantId);
  }
}
