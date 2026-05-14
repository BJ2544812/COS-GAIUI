import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { getMergedPaymentGatewaySettings } from '../utils/mergeTenantSettings.js';
import { listRazorpayPaymentsInWindow } from '../utils/razorpayApi.js';
import { assertRazorpayKeyMatchesMode } from '../utils/razorpayMode.js';
import { triggerAlert } from '../utils/alerting.js';
import { accountingLog } from '../utils/accountingLog.js';

const LOOKBACK_SEC = Math.max(60, Number(process.env.RAZORPAY_RECON_LOOKBACK_SEC) || 86_400);
const PAGE = 100;

function expectedRupeesFromPaise(paise: number): Prisma.Decimal {
  return new Prisma.Decimal(paise).div(new Prisma.Decimal(100));
}

/**
 * For each tenant with Razorpay keys, fetches captured payments in the lookback window
 * and compares to Donation rows (sourceRefId or reference razorpay:pay_…).
 */
export async function runRazorpayReconciliationOneShot(): Promise<{
  tenants: number;
  issues: number;
}> {
  const toSec = Math.floor(Date.now() / 1000);
  const fromSec = toSec - LOOKBACK_SEC;
  const tenants = await prisma.tenant.findMany({ select: { id: true } });
  let issues = 0;

  for (const { id: tenantId } of tenants) {
    const cfg = await getMergedPaymentGatewaySettings(tenantId);
    const keyId = cfg.razorpayKeyId?.trim();
    const keySecret = cfg.razorpayKeySecret?.trim();
    if (!keyId || !keySecret) continue;

    try {
      assertRazorpayKeyMatchesMode(keyId);
    } catch (e) {
      accountingLog('reconciliation', 'skip_tenant_key_mode', { tenantId });
      continue;
    }

    const seen = new Set<string>();
    let skip = 0;
    for (;;) {
      const items = await listRazorpayPaymentsInWindow(
        keyId,
        keySecret,
        fromSec,
        toSec,
        PAGE,
        skip
      );
      for (const p of items) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        if (p.status !== 'captured') continue;

        const ref = `razorpay:${p.id}`;
        const donation = await prisma.donation.findFirst({
          where: {
            tenantId,
            OR: [{ sourceRefId: p.id }, { reference: ref }],
          },
        });

        if (!donation) {
          const msg = `No donation for captured Razorpay payment ${p.id} (reconciliation).`;
          accountingLog('reconciliation', 'missing_donation', { tenantId, paymentId: p.id, amountPaise: p.amount });
          issues += 1;
          void triggerAlert({
            category: 'reconciliation',
            code: 'RECONCILE_MISSING_DONATION',
            message: msg,
            context: {
              tenantId,
              paymentId: p.id,
              amountPaise: p.amount,
              window: { fromSec, toSec },
            },
          });
          continue;
        }

        const expected = expectedRupeesFromPaise(p.amount);
        if (!donation.amount.equals(expected)) {
          const msg = `Donation amount for payment ${p.id} does not match Razorpay (reconciliation).`;
          accountingLog('reconciliation', 'amount_mismatch', {
            tenantId,
            paymentId: p.id,
            donationId: donation.id,
            dbAmount: donation.amount.toString(),
            gatewayPaise: p.amount,
          });
          issues += 1;
          void triggerAlert({
            category: 'reconciliation',
            code: 'PAYMENT_AMOUNT_MISMATCH',
            message: msg,
            context: {
              tenantId,
              paymentId: p.id,
              donationId: donation.id,
              donationAmount: donation.amount.toString(),
              gatewayPaise: p.amount,
            },
          });
        }
      }
      if (items.length < PAGE) break;
      skip += PAGE;
    }
  }

  if (issues > 0) {
    accountingLog('reconciliation', 'completed_with_issues', { issues, tenantCount: tenants.length });
  } else {
    accountingLog('reconciliation', 'completed', { tenantCount: tenants.length, windowSec: LOOKBACK_SEC });
  }

  return { tenants: tenants.length, issues };
}

export function getRazorpayReconciliationIntervalMs(): number {
  return Math.max(60_000, Number(process.env.RAZORPAY_RECON_INTERVAL_MS) || 6 * 60 * 60 * 1000);
}
