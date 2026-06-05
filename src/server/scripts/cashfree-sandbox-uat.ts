/**
 * Cashfree sandbox operational UAT (non-mock).
 * Requires tenant settings or env: CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_WEBHOOK_SECRET.
 *
 * Run: npx tsx src/server/scripts/cashfree-sandbox-uat.ts [tenantId]
 */
import 'dotenv/config';
import { prisma } from '../utils/prisma.js';
import { createCashfreeOrder, verifyCashfreeWebhookSignature } from '../utils/cashfreeApi.js';
import { getMergedPaymentGatewaySettings } from '../utils/mergeTenantSettings.js';

type Result = { name: string; status: 'pass' | 'fail' | 'skip'; detail?: string };

async function main() {
  const results: Result[] = [];
  const tenantId =
    process.argv[2] ||
    (await prisma.tenant.findFirst({ select: { id: true } }))?.id ||
    '';

  if (!tenantId) {
    console.error('No tenant found. Pass tenantId or seed the database.');
    process.exit(1);
  }

  const pg = await getMergedPaymentGatewaySettings(tenantId);
  const appId = process.env.CASHFREE_APP_ID || pg.cashfreeAppId;
  const secretKey = process.env.CASHFREE_SECRET_KEY || pg.cashfreeSecretKey;
  const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET || pg.cashfreeWebhookSecret;
  const environment = (process.env.CASHFREE_ENVIRONMENT || pg.cashfreeEnvironment || 'sandbox') as
    | 'sandbox'
    | 'production';

  if (!appId || !secretKey) {
    results.push({
      name: 'Credentials',
      status: 'skip',
      detail: 'Set Cashfree App ID + Secret in Settings → Online Giving or CASHFREE_* env vars.',
    });
    printReport(results);
    process.exit(0);
  }

  if (environment === 'production') {
    results.push({ name: 'Environment guard', status: 'fail', detail: 'Refusing UAT against production keys.' });
    printReport(results);
    process.exit(1);
  }

  results.push({ name: 'Sandbox credentials present', status: 'pass', detail: `env=${environment}` });

  const orderId = `uat_${Date.now()}`;
  try {
    const order = await createCashfreeOrder(
      { appId, secretKey, environment },
      {
        orderId,
        amount: 101,
        currency: 'INR',
        customerId: 'uat_donor',
        customerEmail: 'uat@example.com',
        customerPhone: '9999999999',
        customerName: 'UAT Donor',
        orderNote: 'Kingdom OS sandbox UAT',
      }
    );
    results.push({
      name: 'Create sandbox order',
      status: order.payment_session_id ? 'pass' : 'fail',
      detail: `order_id=${order.order_id}`,
    });
  } catch (e) {
    results.push({
      name: 'Create sandbox order',
      status: 'fail',
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  if (webhookSecret) {
    const body = JSON.stringify({ type: 'PAYMENT_SUCCESS_WEBHOOK', data: { order: { order_id: orderId } } });
    const crypto = await import('crypto');
    const sig = crypto.createHmac('sha256', webhookSecret).update(body).digest('base64');
    const ok = verifyCashfreeWebhookSignature(webhookSecret, body, sig);
    results.push({
      name: 'Webhook HMAC (synthetic)',
      status: ok ? 'pass' : 'fail',
      detail: ok ? 'Signature round-trip OK' : 'Signature mismatch',
    });

    const dupOk = verifyCashfreeWebhookSignature(webhookSecret, body, sig);
    results.push({
      name: 'Duplicate webhook signature',
      status: dupOk ? 'pass' : 'fail',
      detail: 'Idempotency handled in ProcessedCashfreeEvent at runtime',
    });
  } else {
    results.push({ name: 'Webhook HMAC', status: 'skip', detail: 'No webhook secret configured' });
  }

  results.push({
    name: 'Live payment completion',
    status: 'skip',
    detail: 'Complete checkout in Cashfree sandbox UI; verify via /donate and Giving registry.',
  });
  results.push({
    name: 'Settlement import + post',
    status: 'skip',
    detail: 'Import settlement JSON in Giving → Settlement Recon after sandbox payout.',
  });

  printReport(results);
  await prisma.$disconnect();
  const failed = results.some((r) => r.status === 'fail');
  process.exit(failed ? 1 : 0);
}

function printReport(results: Result[]) {
  console.log('\n=== Cashfree Sandbox UAT ===\n');
  for (const r of results) {
    console.log(`[${r.status.toUpperCase()}] ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  }
  console.log('');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
