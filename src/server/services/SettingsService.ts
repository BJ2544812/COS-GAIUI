import { SettingsRepository } from '../repositories/SettingsRepository.js';

export class SettingsService {
  static async upsertSetting(tenantId: string, key: string, value: string) {
    return SettingsRepository.upsertSetting(tenantId, key, value);
  }

  static async upsertAllSettings(tenantId: string, payload: any) {
    const settingsToUpsert = Object.keys(payload).map(key => ({
      key,
      value: JSON.stringify(payload[key])
    }));
    return SettingsRepository.upsertAllSettings(tenantId, settingsToUpsert);
  }

  static async getSettings(tenantId: string) {
    return SettingsRepository.getSettings(tenantId);
  }

  static async getSettingByKey(tenantId: string, key: string) {
    return SettingsRepository.getSettingByKey(tenantId, key);
  }

  static async deleteSetting(tenantId: string, key: string) {
    return SettingsRepository.deleteSetting(tenantId, key);
  }
}
