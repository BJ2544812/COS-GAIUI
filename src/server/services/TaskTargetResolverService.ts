import { prisma } from '../utils/prisma.js';
import { TaskTargetType } from '@prisma/client';

export class TaskTargetResolverService {
  /**
   * Validates that the target entity exists in the specified tenant.
   * Throws an error if invalid.
   */
  static async validateTarget(tenantId: string, targetType: TaskTargetType, targetId: string): Promise<boolean> {
    switch (targetType) {
      case TaskTargetType.MEMBER: {
        const member = await prisma.member.findFirst({ where: { id: targetId, tenantId } });
        if (!member) throw new Error(`Invalid target: Member ${targetId} not found`);
        return true;
      }
      case TaskTargetType.CARE_CASE: {
        const careCase = await prisma.careCase.findFirst({ where: { id: targetId, tenantId } });
        if (!careCase) throw new Error(`Invalid target: CareCase ${targetId} not found`);
        return true;
      }
      case TaskTargetType.SMALL_GROUP: {
        const group = await prisma.smallGroup.findFirst({ where: { id: targetId, tenantId } });
        if (!group) throw new Error(`Invalid target: SmallGroup ${targetId} not found`);
        return true;
      }
      case TaskTargetType.PRAYER_REQUEST: {
        const req = await prisma.prayerRequest.findFirst({ where: { id: targetId, tenantId } });
        if (!req) throw new Error(`Invalid target: PrayerRequest ${targetId} not found`);
        return true;
      }
      default:
        throw new Error(`Unsupported TaskTargetType: ${targetType}`);
    }
  }

  /**
   * Resolves a human-readable label and UI navigation route for the target.
   */
  static async resolveMetadata(tenantId: string, targetType: TaskTargetType, targetId: string) {
    switch (targetType) {
      case TaskTargetType.MEMBER: {
        const member = await prisma.member.findFirst({ where: { id: targetId, tenantId }, select: { name: true } });
        return { label: member?.name || 'Unknown Member', route: `/members/${targetId}` };
      }
      case TaskTargetType.CARE_CASE: {
        const careCase = await prisma.careCase.findFirst({ where: { id: targetId, tenantId }, select: { category: true, member: { select: { name: true } } } });
        return { label: `${careCase?.category} Case for ${careCase?.member?.name}`, route: `/care/${targetId}` };
      }
      case TaskTargetType.SMALL_GROUP: {
        const group = await prisma.smallGroup.findFirst({ where: { id: targetId, tenantId }, select: { name: true } });
        return { label: group?.name || 'Unknown Group', route: `/groups/${targetId}` };
      }
      case TaskTargetType.PRAYER_REQUEST: {
        return { label: 'Prayer Request', route: `/prayer/${targetId}` };
      }
      default:
        return { label: 'Unknown Target', route: '#' };
    }
  }
}
