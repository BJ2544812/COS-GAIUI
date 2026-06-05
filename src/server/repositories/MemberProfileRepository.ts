import { prisma } from '../utils/prisma.js';
import type { Prisma } from '@prisma/client';

/** Omit unset signature columns so a slightly stale @prisma/client (pre-migration) does not throw on create. */
function memberDocumentCreateData(
  tenantId: string,
  memberId: string,
  data: {
    type: string;
    number?: string | null;
    fileUrl?: string | null;
    notes?: string | null;
    acceptedAt?: Date | null;
    signerName?: string | null;
    signatureDataUrl?: string | null;
  },
): Record<string, unknown> {
  const row: Record<string, unknown> = {
    tenantId,
    memberId,
    type: data.type,
    number: data.number ?? null,
    fileUrl: data.fileUrl ?? null,
    notes: data.notes ?? null,
  };
  if (data.acceptedAt != null) row.acceptedAt = data.acceptedAt;
  if (data.signerName != null && data.signerName !== '') row.signerName = data.signerName;
  if (data.signatureDataUrl != null && data.signatureDataUrl !== '') row.signatureDataUrl = data.signatureDataUrl;
  return row;
}

// ------------------------------------------------------------------
// MemberDocument repository
// ------------------------------------------------------------------
export class MemberDocumentRepository {
  static async findByMember(memberId: string) {
    return prisma.memberDocument.findMany({
      where: { memberId },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async create(tenantId: string, memberId: string, data: {
    type: string;
    number?: string | null;
    fileUrl?: string | null;
    notes?: string | null;
    acceptedAt?: Date | null;
    signerName?: string | null;
    signatureDataUrl?: string | null;
  }) {
    return prisma.memberDocument.create({
      data: memberDocumentCreateData(tenantId, memberId, data) as Prisma.MemberDocumentUncheckedCreateInput,
    });
  }

  static async update(id: string, memberId: string, data: {
    type?: string;
    number?: string | null;
    fileUrl?: string | null;
    verified?: boolean;
    notes?: string | null;
    acceptedAt?: Date | null;
    signerName?: string | null;
    signatureDataUrl?: string | null;
  }) {
    const patch = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    ) as Prisma.MemberDocumentUpdateInput;
    return prisma.memberDocument.update({
      where: { id, memberId },
      data: patch,
    });
  }

  static async delete(id: string, memberId: string) {
    return prisma.memberDocument.delete({ where: { id, memberId } });
  }
}

// ------------------------------------------------------------------
// SpiritualMilestone repository
// ------------------------------------------------------------------
export class SpiritualMilestoneRepository {
  static async findByMember(memberId: string) {
    return prisma.spiritualMilestone.findMany({
      where: { memberId },
      orderBy: { date: 'asc' },
    });
  }

  static async create(tenantId: string, memberId: string, data: {
    type: string;
    date: Date;
    notes?: string | null;
  }) {
    return prisma.spiritualMilestone.create({
      data: { tenantId, memberId, ...data },
    });
  }

  static async update(id: string, memberId: string, data: {
    type?: string;
    date?: Date;
    notes?: string | null;
  }) {
    return prisma.spiritualMilestone.update({
      where: { id, memberId },
      data,
    });
  }

  static async delete(id: string, memberId: string) {
    return prisma.spiritualMilestone.delete({ where: { id, memberId } });
  }
}

// ------------------------------------------------------------------
// MemberResponsibility repository
// ------------------------------------------------------------------
export class MemberResponsibilityRepository {
  static async findByMember(memberId: string, tenantId?: string) {
    return prisma.memberResponsibility.findMany({
      where: { memberId, ...(tenantId ? { tenantId } : {}) },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findByEntity(tenantId: string, entityType: string, entityId: string) {
    return prisma.memberResponsibility.findMany({
      where: { tenantId, entityType, entityId },
      include: {
        member: {
          select: { id: true, name: true, email: true, phone: true, profileImageUrl: true, growthStage: true, role: true },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  static async create(tenantId: string, memberId: string, data: {
    role: string;
    entityType: string;
    entityId?: string | null;
    status?: string;
    startDate?: Date;
    endDate?: Date | null;
    allocatedFunds?: number | null;
    usedFunds?: number | null;
    notes?: string | null;
  }) {
    return prisma.memberResponsibility.create({
      data: {
        tenantId,
        member: { connect: { id: memberId } },
        ...data
      },
    });
  }

  static async update(id: string, memberId: string, data: {
    role?: string;
    entityType?: string | null;
    entityId?: string | null;
    status?: string;
    startDate?: Date;
    endDate?: Date | null;
    allocatedFunds?: number | null;
    usedFunds?: number | null;
    notes?: string | null;
  }) {
    return prisma.memberResponsibility.update({
      where: { id, memberId },
      data,
    });
  }

  static async delete(id: string, memberId: string) {
    return prisma.memberResponsibility.delete({ where: { id, memberId } });
  }
}
