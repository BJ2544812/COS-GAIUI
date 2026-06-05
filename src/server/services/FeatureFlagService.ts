import { prisma } from '../utils/prisma.js';
import { DEFAULT_FEATURE_FLAGS, type FeatureFlagMap } from '../utils/featureFlags.js';

const STORAGE_KEY = 'feature_flags';

export class FeatureFlagService {
  static async getFlags(tenantId: string): Promise<FeatureFlagMap> {
    const row = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: STORAGE_KEY } },
    });
    if (!row?.value) return { ...DEFAULT_FEATURE_FLAGS };
    try {
      const parsed = JSON.parse(row.value) as Partial<FeatureFlagMap>;
      return { ...DEFAULT_FEATURE_FLAGS, ...parsed };
    } catch {
      return { ...DEFAULT_FEATURE_FLAGS };
    }
  }

  static async updateFlags(tenantId: string, patch: Partial<FeatureFlagMap>): Promise<FeatureFlagMap> {
    const current = await this.getFlags(tenantId);
    const merged = { ...current, ...patch };
    await prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: STORAGE_KEY } },
      create: { tenantId, key: STORAGE_KEY, value: JSON.stringify(merged) },
      update: { value: JSON.stringify(merged) },
    });
    return merged;
  }

  static async isEnabled(tenantId: string, flag: keyof FeatureFlagMap): Promise<boolean> {
    const flags = await this.getFlags(tenantId);
    return flags[flag] !== false;
  }
}
