import type {
  AnalyticsSinkAdapter,
  EmailProviderAdapter,
  SmsProviderAdapter,
  SsoProviderAdapter,
  WhatsAppProviderAdapter,
} from './types.js';

const emailProviders = new Map<string, EmailProviderAdapter>();
const smsProviders = new Map<string, SmsProviderAdapter>();
const whatsappProviders = new Map<string, WhatsAppProviderAdapter>();
const analyticsSinks = new Map<string, AnalyticsSinkAdapter>();
const ssoProviders = new Map<string, SsoProviderAdapter>();

export function registerEmailProvider(adapter: EmailProviderAdapter) {
  emailProviders.set(adapter.id, adapter);
}

export function registerSmsProvider(adapter: SmsProviderAdapter) {
  smsProviders.set(adapter.id, adapter);
}

export function registerWhatsAppProvider(adapter: WhatsAppProviderAdapter) {
  whatsappProviders.set(adapter.id, adapter);
}

export function registerAnalyticsSink(adapter: AnalyticsSinkAdapter) {
  analyticsSinks.set(adapter.id, adapter);
}

export function registerSsoProvider(adapter: SsoProviderAdapter) {
  ssoProviders.set(adapter.id, adapter);
}

export function getEmailProvider(id: string) {
  return emailProviders.get(id);
}

export function listIntegrationCapabilities() {
  return {
    email: [...emailProviders.keys()],
    sms: [...smsProviders.keys()],
    whatsapp: [...whatsappProviders.keys()],
    analytics: [...analyticsSinks.keys()],
    sso: [...ssoProviders.keys()],
    note: 'Built-in MessageProvider handles in-app delivery; register adapters for external channels.',
  };
}
