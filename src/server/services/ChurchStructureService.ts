
import { ChurchStructureRepository } from '../repositories/ChurchStructureRepository.js';
import { MemberResponsibilityRepository } from '../repositories/MemberProfileRepository.js';
import { prisma } from '../utils/prisma.js';
import { isUuid, servingTierForRole } from '../utils/servingRoles.js';

function mapCampusLeaderFields<T extends { leader?: string | null }>(campus: T) {
  const leader = campus.leader ?? null;
  return {
    ...campus,
    leaderId: leader && isUuid(leader) ? leader : null,
    leaderLabel: leader && !isUuid(leader) ? leader : null,
  };
}

export class ChurchStructureService {
  // --- Campuses ---
  static async createCampus(tenantId: string, data: any) {
    if (!data.name) throw new Error('Campus name is required');
    const { leaderId, ...rest } = data;
    return ChurchStructureRepository.createCampus(tenantId, { ...rest, leader: leaderId || rest.leader });
  }

  static async getCampuses(tenantId: string) {
    const campuses = await ChurchStructureRepository.getCampuses(tenantId);
    return campuses.map((c) => mapCampusLeaderFields(c));
  }

  static async getCampusHierarchy(tenantId: string, campusId: string) {
    const campus = await ChurchStructureRepository.getCampusById(tenantId, campusId);
    if (!campus) throw new Error('Campus not found');
    return mapCampusLeaderFields(campus);
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

  static async getMinistries(tenantId: string, campusId?: string, enrichLeaders = true) {
    const ministries = await ChurchStructureRepository.getMinistries(tenantId, campusId);
    if (!enrichLeaders || ministries.length === 0) return ministries;

    const ids = ministries.map((m) => m.id);
    const assignments = await prisma.memberResponsibility.findMany({
      where: {
        tenantId,
        entityType: 'Ministry',
        entityId: { in: ids },
        status: 'Active',
      },
      include: { member: { select: { id: true, name: true, profileImageUrl: true, role: true } } },
    });

    const byMinistry = new Map<string, typeof assignments>();
    for (const a of assignments) {
      if (!a.entityId) continue;
      const list = byMinistry.get(a.entityId) ?? [];
      list.push(a);
      byMinistry.set(a.entityId, list);
    }

    return ministries.map((m) => {
      const list = byMinistry.get(m.id) ?? [];
      const sorted = [...list].sort((a, b) => {
        const ta = servingTierForRole(a.role);
        const tb = servingTierForRole(b.role);
        if (ta !== tb) return ta.localeCompare(tb);
        return a.role.localeCompare(b.role);
      });
      const lead = sorted.find((r) => servingTierForRole(r.role) !== 'Volunteer') ?? sorted[0];
      return {
        ...m,
        leaderName: lead?.member?.name ?? null,
        leaderRole: lead?.role ?? null,
        leaderImageUrl: lead?.member?.profileImageUrl ?? null,
        activeServingCount: list.length,
      };
    });
  }

  static async getMinistryRoster(tenantId: string, ministryId: string) {
    const ministry = await prisma.ministry.findFirst({ where: { id: ministryId, tenantId } });
    if (!ministry) throw new Error('Ministry not found');
    const assignments = await MemberResponsibilityRepository.findByEntity(tenantId, 'Ministry', ministryId);
    const roster = assignments.map((a) => ({
      id: a.id,
      memberId: a.memberId,
      role: a.role,
      entityType: a.entityType,
      entityId: a.entityId,
      status: a.status,
      startDate: a.startDate,
      endDate: a.endDate,
      notes: a.notes,
      tier: servingTierForRole(a.role),
      member: (a as any).member,
    }));
    roster.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'Active' ? -1 : 1;
      return servingTierForRole(a.role).localeCompare(servingTierForRole(b.role));
    });
    return { ministry, roster };
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
