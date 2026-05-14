import { prisma } from '../utils/prisma.js';
import { Prisma } from '@prisma/client';

export class SettingsRepository {
  static async upsertSetting(tenantId: string, key: string, value: string) {
    return prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key } },
      update: { value },
      create: { tenantId, key, value },
    });
  }

  static async upsertAllSettings(tenantId: string, settings: { key: string, value: string }[]) {
    return prisma.$transaction(
      settings.map((setting) => 
        prisma.setting.upsert({
          where: { tenantId_key: { tenantId, key: setting.key } },
          update: { value: setting.value },
          create: { tenantId, key: setting.key, value: setting.value },
        })
      )
    );
  }

  static async getSettings(tenantId: string) {
    return prisma.setting.findMany({ where: { tenantId } });
  }

  static async getSettingByKey(tenantId: string, key: string) {
    return prisma.setting.findUnique({ where: { tenantId_key: { tenantId, key } } });
  }

  static async deleteSetting(tenantId: string, key: string) {
    return prisma.setting.delete({
      where: { tenantId_key: { tenantId, key } },
    });
  }
}
