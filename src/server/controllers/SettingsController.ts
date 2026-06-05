import { Response } from 'express';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { SettingsService } from '../services/SettingsService.js';
import { SETTINGS_SECTION_KEYS, settingsPayloadSchema } from '../validation/settingsSchema.js';
import { getMergedPaymentGatewaySettings } from '../utils/mergeTenantSettings.js';
import { pingCashfreeCredentials } from '../utils/cashfreeApi.js';
import { DEFAULT_SETTINGS } from '../utils/settingsDefaults.js';
import { AccountingService } from '../services/AccountingService.js';
import { assertRazorpayKeyMatchesMode } from '../utils/razorpayMode.js';
import { CodedError, toErrorResponse } from '../utils/apiErrors.js';

export class SettingsController {
  /**
   * POST /api/v1/settings
   * Accepts a partial or full settings object, validates with Zod, saves atomically.
   */
  static async upsertSetting(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;

      // --- Zod Validation ---
      const parsed = settingsPayloadSchema.safeParse(req.body);
      if (!parsed.success) {
        // Use .flatten() for reliable field-level error extraction
        const flatErrors = parsed.error.flatten();
        const allIssues = parsed.error.issues ?? [];
        const firstIssue = allIssues[0];

        return res.status(400).json({
          error: firstIssue?.message ?? 'Invalid settings payload',
          field: firstIssue?.path?.join('.') ?? 'unknown',
          details: allIssues.map((e) => ({
            field: e.path?.join('.') ?? '',
            message: e.message,
          })),
        });
      }

      const payload = parsed.data;
      const sanitized = Object.fromEntries(
        Object.entries(payload).filter(([k]) =>
          (SETTINGS_SECTION_KEYS as readonly string[]).includes(k),
        ),
      ) as Record<string, unknown>;

      const financial = sanitized.financial as { defaultAccounts?: Record<string, string> } | undefined;
      if (financial?.defaultAccounts) {
        const da = {
          ...DEFAULT_SETTINGS.financial.defaultAccounts,
          ...financial.defaultAccounts,
        };
        const hasId = [da.cash, da.bank, da.gatewayClearing, da.tithes, da.offerings].some((s) => s && String(s).trim() !== '');
        if (hasId) {
          await AccountingService.validateDefaultAccountIds(tenantId, da);
        }
      }
      const paymentGateway = sanitized.paymentGateway as { razorpayKeyId?: string } | undefined;
      if (paymentGateway?.razorpayKeyId) {
        assertRazorpayKeyMatchesMode(String(paymentGateway.razorpayKeyId).trim() || null);
      }
      await SettingsService.upsertAllSettings(tenantId, sanitized);

      res.status(200).json({ status: 'success', message: 'Settings saved atomically.' });
    } catch (error: unknown) {
      console.error('[SettingsController] upsertSetting failed.', error);
      if (error instanceof CodedError) {
        return res.status(400).json({ error: toErrorResponse(error) });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * GET /api/v1/settings
   * Returns a structured settings object merged with system defaults.
   * Never returns an empty response — always falls back to defaults.
   */
  static async getSettings(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const rawSettings = await SettingsService.getSettings(tenantId);

      // Parse raw key/value array into structured object
      const structured: Record<string, any> = {};
      for (const setting of rawSettings) {
        try {
          structured[setting.key] = JSON.parse(setting.value);
        } catch {
          structured[setting.key] = setting.value;
        }
      }

      // Deep merge with defaults so clients always get a complete object
      const result = {
        organization: { ...DEFAULT_SETTINGS.organization, ...(structured.organization || {}) },
        branding:     { ...DEFAULT_SETTINGS.branding,     ...(structured.branding     || {}) },
        financial: {
          ...DEFAULT_SETTINGS.financial,
          ...(structured.financial || {}),
          defaultAccounts: {
            ...DEFAULT_SETTINGS.financial.defaultAccounts,
            ...(structured.financial?.defaultAccounts || {}),
          },
        },
        paymentGateway: { ...DEFAULT_SETTINGS.paymentGateway, ...(structured.paymentGateway || {}) },
        documents:      { ...DEFAULT_SETTINGS.documents,      ...(structured.documents      || {}) },
        system:         { ...DEFAULT_SETTINGS.system,         ...(structured.system         || {}) },
        operational:    { ...DEFAULT_SETTINGS.operational,    ...(structured.operational    || {}) },
        _meta: {
          version: 1,
          updatedAt: rawSettings.length > 0
            ? new Date().toISOString()
            : null,
          isDefault: rawSettings.length === 0,
        },
      };

      res.status(200).json({ status: 'success', data: rawSettings, structured: result });
    } catch (error: any) {
      console.error('[SettingsController] getSettings failed; returning system defaults.', error);
      // Critical: on error, return defaults so the app never crashes
      res.status(200).json({
        status: 'fallback',
        data: [],
        structured: {
          ...DEFAULT_SETTINGS,
          _meta: { version: 1, updatedAt: null, isDefault: true },
        },
      });
    }
  }

  static async getSettingByKey(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { key } = req.params;
      const setting = await SettingsService.getSettingByKey(tenantId, key as string);
      if (!setting) {
        return res.status(404).json({ error: 'Setting not found' });
      }
      res.status(200).json({ status: 'success', data: setting });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /** POST /settings/test-cashfree — validate Cashfree credentials without saving. */
  static async testCashfree(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const body = req.body as {
        cashfreeAppId?: string;
        cashfreeSecretKey?: string;
        cashfreeEnvironment?: 'sandbox' | 'production';
      } | undefined;

      const merged = await getMergedPaymentGatewaySettings(tenantId);
      const appId = String(body?.cashfreeAppId ?? merged.cashfreeAppId ?? '').trim();
      const secretKey = String(body?.cashfreeSecretKey ?? merged.cashfreeSecretKey ?? '').trim();
      const environment = (body?.cashfreeEnvironment ?? merged.cashfreeEnvironment ?? 'sandbox') as
        | 'sandbox'
        | 'production';

      if (!appId || !secretKey) {
        return res.status(400).json({ error: 'Cashfree App ID and Secret Key are required' });
      }

      await pingCashfreeCredentials({ appId, secretKey, environment });
      res.status(200).json({ status: 'success', message: 'Cashfree credentials verified.' });
    } catch (error: unknown) {
      if (error instanceof CodedError) {
        return res.status(400).json({ error: toErrorResponse(error) });
      }
      res.status(400).json({ error: error instanceof Error ? error.message : 'Cashfree test failed' });
    }
  }

  static async deleteSetting(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { key } = req.params;
      await SettingsService.deleteSetting(tenantId, key as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
