import { CodedError } from './apiErrors.js';

export type AlertPayload = {
  category: 'payment' | 'webhook' | 'reconciliation' | 'system';
  code: string;
  message: string;
  context?: Record<string, unknown>;
};

const line = (p: AlertPayload) =>
  JSON.stringify({
    ts: new Date().toISOString(),
    scope: 'alert',
    ...p,
  });

/**
 * Emits a structured log line; optionally POSTs to ALERT_WEBHOOK_URL (Slack/Custom) in production.
 */
export async function triggerAlert(payload: AlertPayload): Promise<void> {
  console.warn(line(payload));
  const url = process.env.ALERT_WEBHOOK_URL?.trim();
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alert: 'church-erp', ...payload }),
    });
  } catch (e) {
    console.error(
      line({
        category: 'system',
        code: 'ALERT_WEBHOOK_DELIVERY_FAILED',
        message: e instanceof Error ? e.message : String(e),
      })
    );
  }
}

export function triggerAlertOnCodedError(
  err: unknown,
  category: AlertPayload['category'],
  context?: Record<string, unknown>
): void {
  if (err instanceof CodedError) {
    const codes = ['PAYMENT_AMOUNT_MISMATCH', 'PAYMENT_NOT_CAPTURED', 'RAZORPAY_KEY_MODE_MISMATCH'];
    if (codes.includes(err.code)) {
      void triggerAlert({ category, code: err.code, message: err.message, context });
    }
  }
}

export async function triggerWebhookFailureAlert(
  err: unknown,
  context: Record<string, unknown>
): Promise<void> {
  const msg = err instanceof Error ? err.message : String(err);
  const code = err instanceof CodedError ? err.code : 'WEBHOOK_PROCESSING_FAILED';
  await triggerAlert({
    category: 'webhook',
    code,
    message: msg,
    context,
  });
}
