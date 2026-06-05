/** Integration adapter contracts — implement providers without changing core workflows. */

export type DeliveryResult = {
  ok: boolean;
  providerId: string;
  externalId?: string;
  error?: string;
};

export interface EmailProviderAdapter {
  readonly id: string;
  send(params: {
    to: string;
    subject: string;
    html: string;
    tenantId: string;
  }): Promise<DeliveryResult>;
}

export interface SmsProviderAdapter {
  readonly id: string;
  send(params: { to: string; body: string; tenantId: string }): Promise<DeliveryResult>;
}

export interface WhatsAppProviderAdapter {
  readonly id: string;
  send(params: { to: string; body: string; tenantId: string }): Promise<DeliveryResult>;
}

export interface AnalyticsSinkAdapter {
  readonly id: string;
  track(event: string, payload: Record<string, unknown>, tenantId: string): Promise<void>;
}

export interface SsoProviderAdapter {
  readonly id: string;
  getAuthorizeUrl(tenantId: string, returnUrl: string): Promise<string>;
  exchangeCode(code: string, tenantId: string): Promise<{ email: string; externalId: string }>;
}
