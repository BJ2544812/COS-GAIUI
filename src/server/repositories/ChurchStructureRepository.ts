
import { prisma } from '../utils/prisma.js';

export class ChurchStructureRepository {
  // --- Campus ---
  static async createCampus(tenantId: string, data: any) {
    return prisma.campus.create({ data: { ...data, tenantId } });
  }

  static async getCampuses(tenantId: string) {
    return prisma.campus.findMany({
      where: { tenantId },
      include: { _count: { select: { ministries: true, events: true, regions: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async getCampusById(tenantId: string, id: string) {
    return prisma.campus.findFirst({
      where: { tenantId, id },
      include: {
        ministries: true,
        regions: {
          include: { zones: { include: { smallGroups: { include: { _count: { select: { members: true } } } } } } }
        }
      }
    });
  }

  static async updateCampus(tenantId: string, id: string, data: any) {
    return prisma.campus.update({ where: { id }, data });
  }

  // --- Ministry ---
  static async createMinistry(tenantId: string, data: any) {
    return prisma.ministry.create({ data: { ...data, tenantId } });
  }

  static async getMinistries(tenantId: string, campusId?: string) {
    return prisma.ministry.findMany({
      where: { tenantId, ...(campusId ? { campusId } : {}) },
      orderBy: { name: 'asc' },
    });
  }

  static async updateMinistry(tenantId: string, id: string, data: any) {
    return prisma.ministry.update({ where: { id }, data });
  }

  static async deleteMinistry(tenantId: string, id: string) {
    return prisma.ministry.delete({ where: { id } });
  }

  // --- Regions ---
  static async getRegions(tenantId: string) {
    return prisma.region.findMany({
      where: { tenantId },
      include: { zones: { orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  static async createRegion(tenantId: string, data: any) {
    return prisma.region.create({ data: { ...data, tenantId } });
  }

  // --- Zones ---
  static async getZones(tenantId: string) {
    return prisma.zone.findMany({
      where: { tenantId },
      include: { region: true },
      orderBy: { name: 'asc' },
    });
  }

  static async createZone(tenantId: string, data: any) {
    return prisma.zone.create({ data: { ...data, tenantId } });
  }

  // --- Small Groups ---
  static async getSmallGroups(tenantId: string, zoneId?: string) {
    return prisma.smallGroup.findMany({
      where: { tenantId, ...(zoneId ? { zoneId } : {}) },
      include: {
        zone: { include: { region: true } },
        _count: { select: { members: true } },
        members: {
          take: 5,
          include: { member: { select: { id: true, name: true, email: true, profileImageUrl: true } } },
          orderBy: { joinedAt: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getSmallGroupById(tenantId: string, id: string) {
    return prisma.smallGroup.findFirst({
      where: { tenantId, id },
      include: {
        zone: { include: { region: true } },
        members: {
          include: { member: { select: { id: true, name: true, email: true, phone: true, profileImageUrl: true, growthStage: true } } },
          orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        },
        _count: { select: { members: true } },
      },
    });
  }

  static async createSmallGroup(tenantId: string, data: any) {
    return prisma.smallGroup.create({
      data: { ...data, tenantId },
      include: { zone: { include: { region: true } }, _count: { select: { members: true } } },
    });
  }

  static async updateSmallGroup(tenantId: string, id: string, data: any) {
    return prisma.smallGroup.update({ where: { id }, data });
  }

  static async deleteSmallGroup(tenantId: string, id: string) {
    return prisma.smallGroup.delete({ where: { id } });
  }

  // --- Small Group Members ---
  static async getSmallGroupMembers(tenantId: string, groupId: string) {
    return prisma.smallGroupMember.findMany({
      where: { tenantId, groupId },
      include: { member: { select: { id: true, name: true, email: true, phone: true, profileImageUrl: true, growthStage: true } } },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });
  }

  static async addSmallGroupMember(tenantId: string, groupId: string, memberId: string, role: string = 'PARTICIPANT') {
    // Check if already a member
    const existing = await prisma.smallGroupMember.findFirst({ where: { tenantId, groupId, memberId } });
    if (existing) return existing;
    return prisma.smallGroupMember.create({
      data: { tenantId, groupId, memberId, role: role as any },
      include: { member: { select: { id: true, name: true, email: true, profileImageUrl: true } } },
    });
  }

  static async updateSmallGroupMember(tenantId: string, groupId: string, memberId: string, data: any) {
    const record = await prisma.smallGroupMember.findFirst({ where: { tenantId, groupId, memberId } });
    if (!record) throw new Error('Member not found in group');
    return prisma.smallGroupMember.update({ where: { id: record.id }, data });
  }

  static async removeSmallGroupMember(tenantId: string, groupId: string, memberId: string) {
    const record = await prisma.smallGroupMember.findFirst({ where: { tenantId, groupId, memberId } });
    if (!record) throw new Error('Member not found in group');
    return prisma.smallGroupMember.delete({ where: { id: record.id } });
  }

  /** Pathways (discipleship tracks) stored on tenant — read-only list for admin UI. */
  static async listPathways(tenantId: string) {
    return prisma.pathway.findMany({
      where: { tenantId },
      include: {
        steps: { orderBy: { sequence: 'asc' } },
        _count: { select: { progress: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
