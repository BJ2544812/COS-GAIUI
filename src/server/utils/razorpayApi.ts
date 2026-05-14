import { CodedError } from './apiErrors.js';

export type RazorpayPaymentEntity = {
  id: string;
  status: string;
  amount: number;
  currency?: string;
};

export type RazorpayPaymentListItem = {
  id: string;
  status: string;
  amount: number;
  created_at?: number;
};

/**
 * Fetches a payment from Razorpay REST API (do not trust webhooks alone).
 * @param amountPaiseFromWebhook used to cross-check; must match API when provided.
 */
export async function verifyRazorpayPayment(
  paymentId: string,
  keyId: string,
  keySecret: string,
  options?: { expectedAmountPaise?: number }
): Promise<RazorpayPaymentEntity> {
  if (!keyId || !keySecret) {
    throw new CodedError('RAZORPAY_NOT_CONFIGURED', 'Razorpay API keys are not configured for this tenant.');
  }
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const res = await fetch(
    `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new CodedError('RAZORPAY_API', `Razorpay payment fetch failed (${res.status}): ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as RazorpayPaymentEntity;
  if (data.status !== 'captured') {
    throw new CodedError(
      'PAYMENT_NOT_CAPTURED',
      `Payment is not captured (status=${data.status ?? 'unknown'}).`
    );
  }
  if (options?.expectedAmountPaise !== undefined && data.amount !== options.expectedAmountPaise) {
    throw new CodedError('PAYMENT_AMOUNT_MISMATCH', 'Webhook amount does not match Razorpay API payment amount.');
  }
  return data;
}

/**
 * Lists payments in a time window (Unix seconds, Razorpay API). Used for reconciliation.
 */
export async function listRazorpayPaymentsInWindow(
  keyId: string,
  keySecret: string,
  fromSec: number,
  toSec: number,
  count = 100,
  skip = 0
): Promise<RazorpayPaymentListItem[]> {
  if (!keyId || !keySecret) {
    return [];
  }
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const url = `https://api.razorpay.com/v1/payments?from=${fromSec}&to=${toSec}&count=${count}&skip=${skip}`;
  const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new CodedError('RAZORPAY_API', `Razorpay list payments failed (${res.status}): ${t.slice(0, 200)}`);
  }
  const data = (await res.json()) as { items?: RazorpayPaymentListItem[] };
  return data.items ?? [];
}
