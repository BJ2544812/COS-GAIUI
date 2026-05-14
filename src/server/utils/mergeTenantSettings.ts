import { DEFAULT_SETTINGS } from '../../lib/settingsDefaults.js';
import { SettingsRepository } from '../repositories/SettingsRepository.js';
import type { DefaultSettings } from '../../lib/settingsDefaults.js';

type Financial = DefaultSettings['financial'];
type Organization = DefaultSettings['organization'];
type Documents = DefaultSettings['documents'];
type PaymentGateway = DefaultSettings['paymentGateway'];

export async function getMergedFinancialSettings(tenantId: string): Promise<Financial> {
  try {
    const row = await SettingsRepository.getSettingByKey(tenantId, 'financial');
    if (row) {
      const parsed = JSON.parse(row.value) as Partial<Financial> & { defaultAccounts?: Record<string, string> };
      return {
        ...DEFAULT_SETTINGS.financial,
        ...parsed,
        defaultAccounts: {
          ...DEFAULT_SETTINGS.financial.defaultAccounts,
          ...parsed.defaultAccounts,
        },
      };
    }
  } catch (e) {
    console.error('[Settings] getMergedFinancialSettings failed; using system defaults.', e);
  }
  return { ...DEFAULT_SETTINGS.financial, defaultAccounts: { ...DEFAULT_SETTINGS.financial.defaultAccounts } };
}

export async function getMergedOrganizationSettings(tenantId: string): Promise<Organization> {
  try {
    const row = await SettingsRepository.getSettingByKey(tenantId, 'organization');
    if (row) {
      const parsed = JSON.parse(row.value) as Partial<Organization>;
      return { ...DEFAULT_SETTINGS.organization, ...parsed };
    }
  } catch (e) {
    console.error('[Settings] getMergedOrganizationSettings failed; using system defaults.', e);
  }
  return { ...DEFAULT_SETTINGS.organization };
}

export async function getMergedDocumentSettings(tenantId: string): Promise<Documents> {
  try {
    const row = await SettingsRepository.getSettingByKey(tenantId, 'documents');
    if (row) {
      const parsed = JSON.parse(row.value) as Partial<Documents>;
      return { ...DEFAULT_SETTINGS.documents, ...parsed };
    }
  } catch (e) {
    console.error('[Settings] getMergedDocumentSettings failed; using system defaults.', e);
  }
  return { ...DEFAULT_SETTINGS.documents };
}

export async function getMergedPaymentGatewaySettings(tenantId: string): Promise<PaymentGateway> {
  try {
    const row = await SettingsRepository.getSettingByKey(tenantId, 'paymentGateway');
    if (row) {
      const parsed = JSON.parse(row.value) as Partial<PaymentGateway>;
      return { ...DEFAULT_SETTINGS.paymentGateway, ...parsed };
    }
  } catch (e) {
    console.error('[Settings] getMergedPaymentGatewaySettings failed; using system defaults.', e);
  }
  return { ...DEFAULT_SETTINGS.paymentGateway };
}
