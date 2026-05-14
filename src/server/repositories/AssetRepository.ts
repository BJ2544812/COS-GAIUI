import { prisma } from '../utils/prisma.js';
import { Prisma } from '@prisma/client';

export class AssetRepository {
  static async createAsset(tenantId: string, data: any) {
    return prisma.asset.create({
      data: {
        name: data.name,
        category: data.category,
        serialNumber: data.serialNumber,
        location: data.location,
        value: parseFloat(data.value) || 0,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        status: data.status || 'Active',
        condition: data.condition,
        imageUrl: data.imageUrl,
        notes: data.notes,
        tenant: { connect: { id: tenantId } },
        ...(data.assignedToId ? { assignedTo: { connect: { id: data.assignedToId } } } : {}),
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
      }
    });
  }

  static async getAssets(tenantId: string) {
    return prisma.asset.findMany({
      where: { tenantId },
      include: {
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { maintenanceLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getAssetById(tenantId: string, id: string) {
    return prisma.asset.findFirst({
      where: { id, tenantId },
      include: {
        assignedTo: { select: { id: true, name: true } },
        maintenanceLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
  }

  static async updateAsset(tenantId: string, id: string, data: any) {
    const asset = await prisma.asset.findFirst({ where: { id, tenantId } });
    if (!asset) throw new Error('Asset not found');
    return prisma.asset.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.value !== undefined && { value: parseFloat(data.value) }),
        ...(data.purchaseDate !== undefined && { purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.condition !== undefined && { condition: data.condition }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.assignedToId !== undefined && {
          assignedTo: data.assignedToId ? { connect: { id: data.assignedToId } } : { disconnect: true }
        }),
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
      }
    });
  }

  static async deleteAsset(tenantId: string, id: string) {
    const asset = await prisma.asset.findFirst({ where: { id, tenantId } });
    if (!asset) throw new Error('Asset not found');
    return prisma.asset.delete({ where: { id } });
  }

  // --- Maintenance Logs ---
  static async createMaintenanceLog(tenantId: string, assetId: string, data: any) {
    // Verify asset belongs to tenant
    const asset = await prisma.asset.findFirst({ where: { id: assetId, tenantId } });
    if (!asset) throw new Error('Asset not found');
    return prisma.assetMaintenanceLog.create({
      data: {
        tenantId,
        assetId,
        serviceType: data.serviceType,
        description: data.description,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        cost: data.cost ? parseFloat(data.cost) : null,
        technician: data.technician,
        status: data.status || 'Scheduled',
      }
    });
  }

  static async getMaintenanceLogs(tenantId: string, assetId: string) {
    const asset = await prisma.asset.findFirst({ where: { id: assetId, tenantId } });
    if (!asset) throw new Error('Asset not found');
    return prisma.assetMaintenanceLog.findMany({
      where: { assetId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getAssetStats(tenantId: string) {
    const [total, byStatus, totalValue] = await Promise.all([
      prisma.asset.count({ where: { tenantId } }),
      prisma.asset.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
      }),
      prisma.asset.aggregate({
        where: { tenantId },
        _sum: { value: true },
      }),
    ]);

    const statusMap = byStatus.reduce((acc, cur) => {
      acc[cur.status] = cur._count.id;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      totalValue: totalValue._sum.value ?? 0,
      active: statusMap['Active'] ?? 0,
      maintenance: statusMap['Maintenance'] ?? 0,
      damaged: statusMap['Damaged'] ?? 0,
      retired: statusMap['Retired'] ?? 0,
    };
  }
}
