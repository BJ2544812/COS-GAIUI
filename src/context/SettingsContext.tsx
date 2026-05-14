import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { DEFAULT_SETTINGS as LIB_DEFAULT_SETTINGS } from '@/lib/settingsDefaults';

export interface SystemSettings {
  organization: {
    name: string;
    logo: string;
    address: string;
    phone: string;
    email: string;
    registrationNumber: string;
    taxId: string;
  };
  branding: {
    primaryColor: string;
    secondaryColor: string;
    themeMode: 'light' | 'dark' | 'system';
  };
  financial: {
    currency: string;
    financialYearStart: string;
    defaultAccounts: {
      cash: string;
      bank: string;
      tithes: string;
      offerings: string;
    };
    voucherPrefix: string;
    numberingFormat: string;
    /** YYYY-MM-DD: posting blocked for dates on or before this day (inclusive). Empty = none. */
    lockedUntilDate: string;
  };
  paymentGateway: {
    razorpayKeyId: string;
    razorpayKeySecret: string;
    razorpayWebhookSecret: string;
  };
  documents: {
    pastorSignature: string;
    accountantSignature: string;
    authorizedSignatoryName: string;
    sealStamp: string;
  };
  system: {
    timezone: string;
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    language: 'en' | 'hi' | 'ta';
    auditLogging: boolean;
    dataRetentionDays: number;
  };
  operational: {
    notificationDelivery: 'in_app' | 'email' | 'both';
    defaultConfidentiality: 'PUBLIC' | 'GROUP' | 'PASTORAL' | 'SENIOR_PASTORAL' | 'RESTRICTED';
    autoAssignCareCases: boolean;
    requireFollowUpApproval: boolean;
  };
  _meta?: {
    version: number;
    updatedAt: string | null;
    isDefault: boolean;
  };
}

export const DEFAULT_SETTINGS: SystemSettings = {
  ...LIB_DEFAULT_SETTINGS,
  documents: { ...LIB_DEFAULT_SETTINGS.documents },
  system: { ...LIB_DEFAULT_SETTINGS.system },
  operational: { ...LIB_DEFAULT_SETTINGS.operational },
  financial: { ...LIB_DEFAULT_SETTINGS.financial, defaultAccounts: { ...LIB_DEFAULT_SETTINGS.financial.defaultAccounts } },
  organization: { ...LIB_DEFAULT_SETTINGS.organization },
  branding: { ...LIB_DEFAULT_SETTINGS.branding },
  paymentGateway: { ...LIB_DEFAULT_SETTINGS.paymentGateway },
};

/**
 * Convert a CSS hex color to hsl() string usable in CSS variables.
 * Tailwind v4 uses OKLCH natively, but for custom branding we inject
 * the raw hex via inline CSS variable overrides on :root.
 */
function hexToHSLString(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Apply branding colors to the document root as CSS custom properties */
function applyBranding(branding: SystemSettings['branding']) {
  const root = document.documentElement;
  
  if (branding.primaryColor && /^#[0-9A-Fa-f]{6}$/.test(branding.primaryColor)) {
    root.style.setProperty('--brand-primary', branding.primaryColor);
    root.style.setProperty('--brand-primary-hsl', hexToHSLString(branding.primaryColor));
  }
  if (branding.secondaryColor && /^#[0-9A-Fa-f]{6}$/.test(branding.secondaryColor)) {
    root.style.setProperty('--brand-secondary', branding.secondaryColor);
    root.style.setProperty('--brand-secondary-hsl', hexToHSLString(branding.secondaryColor));
  }
  
  // Apply theme mode
  if (branding.themeMode === 'dark') {
    root.classList.add('dark');
  } else if (branding.themeMode === 'light') {
    root.classList.remove('dark');
  } else {
    // system: match OS preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) root.classList.add('dark');
    else root.classList.remove('dark');
  }
}

interface SettingsContextType {
  settings: SystemSettings;
  setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
  isLoading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const json = await apiRequest<unknown>('settings', { method: 'GET' });
      const response = json as {
        status: string;
        structured?: SystemSettings & { _meta?: any };
      };

      if (response.structured) {
        const loaded = response.structured;

        // Deep merge against in-memory defaults to guarantee all keys present
        const merged: SystemSettings = {
          organization: { ...DEFAULT_SETTINGS.organization, ...loaded.organization },
          branding:     { ...DEFAULT_SETTINGS.branding,     ...loaded.branding },
          financial: {
            ...DEFAULT_SETTINGS.financial,
            ...loaded.financial,
            defaultAccounts: {
              ...DEFAULT_SETTINGS.financial.defaultAccounts,
              ...loaded.financial?.defaultAccounts,
            },
          },
          paymentGateway: { ...DEFAULT_SETTINGS.paymentGateway, ...loaded.paymentGateway },
          documents:      { ...DEFAULT_SETTINGS.documents,      ...loaded.documents },
          system:         { ...DEFAULT_SETTINGS.system,         ...loaded.system },
          operational:    { ...DEFAULT_SETTINGS.operational,    ...loaded.operational },
          _meta:          loaded._meta,
        };

        setSettings(merged);
        applyBranding(merged.branding);
      }
    } catch (err: any) {
      // Graceful degradation: stay on defaults, report error, never crash
      console.error('[SettingsContext] Failed to load settings, using defaults:', err);
      setError('Could not load settings from server. Using defaults.');
      // Still apply default branding so UI is never broken
      applyBranding(DEFAULT_SETTINGS.branding);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, isLoading, error, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
