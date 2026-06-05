import crypto from 'crypto';
import { CodedError } from './apiErrors.js';

type CashfreeEnv = 'sandbox' | 'production';

function baseUrl(env: CashfreeEnv) {
  return env === 'production' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com';
}

function headers(appId: string, secretKey: string) {
  return {
    'Content-Type': 'application/json',
    'x-client-id': appId,
    'x-client-secret': secretKey,
    'x-api-version': '2023-08-01',
  };
}

/** Lightweight credential check (lists recent orders; empty list is OK). */
export async function pingCashfreeCredentials(cfg: {
  appId: string;
  secretKey: string;
  environment: CashfreeEnv;
}) {
  if (!cfg.appId || !cfg.secretKey) {
    throw new CodedError('CASHFREE_NOT_CONFIGURED', 'Cashfree API keys are not configured.');
  }
  const res = await fetch(`${baseUrl(cfg.environment)}/pg/orders?limit=1`, {
    headers: headers(cfg.appId, cfg.secretKey),
  });
  if (res.status === 401 || res.status === 403) {
    throw new CodedError('CASHFREE_AUTH', 'Cashfree rejected these credentials. Check App ID, secret, and environment.');
  }
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new CodedError('CASHFREE_API', `Cashfree API unreachable (${res.status}): ${t.slice(0, 200)}`);
  }
}

export async function createCashfreeOrder(
  cfg: { appId: string; secretKey: string; environment: CashfreeEnv },
  input: {
    orderId: string;
    amount: number;
    currency: string;
    customerId: string;
    customerEmail: string;
    customerPhone: string;
    customerName?: string;
    returnUrl?: string;
    notifyUrl?: string;
    orderNote?: string;
  }
) {
  if (!cfg.appId || !cfg.secretKey) {
    throw new CodedError('CASHFREE_NOT_CONFIGURED', 'Cashfree API keys are not configured.');
  }
  const res = await fetch(`${baseUrl(cfg.environment)}/pg/orders`, {
    method: 'POST',
    headers: headers(cfg.appId, cfg.secretKey),
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: input.amount,
      order_currency: input.currency,
      customer_details: {
        customer_id: input.customerId,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone,
        customer_name: input.customerName || 'Donor',
      },
      order_meta: {
        return_url: input.returnUrl || '',
        notify_url: input.notifyUrl || '',
      },
      order_note: input.orderNote || '',
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new CodedError('CASHFREE_API', `Cashfree order creation failed (${res.status}): ${t.slice(0, 250)}`);
  }
  return (await res.json()) as {
    order_id: string;
    payment_session_id: string;
    order_amount: number;
    order_currency: string;
  };
}

export async function verifyCashfreePayment(
  cfg: { appId: string; secretKey: string; environment: CashfreeEnv },
  orderId: string,
  cfPaymentId: string
) {
  if (!cfg.appId || !cfg.secretKey) {
    throw new CodedError('CASHFREE_NOT_CONFIGURED', 'Cashfree API keys are not configured.');
  }
  const res = await fetch(`${baseUrl(cfg.environment)}/pg/orders/${encodeURIComponent(orderId)}/payments`, {
    headers: headers(cfg.appId, cfg.secretKey),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new CodedError('CASHFREE_API', `Cashfree payment verification failed (${res.status}): ${t.slice(0, 250)}`);
  }
  const items = (await res.json()) as Array<{
    cf_payment_id?: string;
    payment_status?: string;
    payment_amount?: number;
  }>;
  const matched = items.find((x) => x.cf_payment_id === cfPaymentId);
  if (!matched) {
    throw new CodedError('PAYMENT_NOT_FOUND', 'Cashfree payment not found for this order.');
  }
  if (String(matched.payment_status || '').toUpperCase() !== 'SUCCESS') {
    throw new CodedError('PAYMENT_NOT_CAPTURED', `Cashfree payment not successful (status=${matched.payment_status || 'unknown'})`);
  }
  return matched;
}

/** Verify Cashfree webhook signature (x-webhook-signature, base64 HMAC-SHA256 of raw body). */
export function verifyCashfreeWebhookSignature(
  webhookSecret: string,
  rawBody: string | Buffer,
  signatureHeader: string
): boolean {
  if (!webhookSecret || !signatureHeader) return false;
  const body = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
  const expected = crypto.createHmac('sha256', webhookSecret).update(body).digest('base64');
  const sig = signatureHeader.trim();
  if (sig.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

