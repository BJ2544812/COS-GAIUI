import { prisma } from '../utils/prisma.js';
import { Prisma } from '@prisma/client';

export class WebsiteRepository {
  static async createPageData(tenantId: string, data: Omit<Prisma.PageDataCreateInput, 'tenant'>) {
    return prisma.pageData.create({
      data: {
        ...data,
        tenant: { connect: { id: tenantId } },
      },
    });
  }

  static async getPages(tenantId: string) {
    return prisma.pageData.findMany({ where: { tenantId } });
  }

  static async getPageBySlug(tenantId: string, slug: string) {
    const s = String(slug || '').trim().toLowerCase();
    if (!s) return null;
    const page = await prisma.pageData.findFirst({ where: { tenantId, slug: s } });
    return page;
  }

  static async updatePageData(tenantId: string, slug: string, data: Prisma.PageDataUpdateInput) {
    const s = String(slug || '').trim().toLowerCase();
    return prisma.pageData.update({
      where: { tenantId_slug: { tenantId, slug: s } },
      data,
    });
  }

  static async wipePages(tenantId: string) {
    return prisma.pageData.deleteMany({ where: { tenantId } });
  }
}
