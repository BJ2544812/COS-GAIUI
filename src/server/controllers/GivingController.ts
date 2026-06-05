import { Response } from 'express';
import crypto from 'crypto';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { GivingService } from '../services/GivingService.js';
import { GatewaySettlementService } from '../services/GatewaySettlementService.js';
import { GatewayRepository } from '../repositories/GatewayRepository.js';
import { computeCheckoutAmounts } from '../utils/gatewayFee.js';
import { getMergedFinancialSettings } from '../utils/mergeTenantSettings.js';
import { DataQualityService } from '../services/DataQualityService.js';
import { toErrorResponse } from '../utils/apiErrors.js';
import { triggerAlertOnCodedError } from '../utils/alerting.js';
import { enqueueRazorpayWebhook, isWebhookQueueEnabled } from '../queue/razorpayWebhookQueue.js';

export class GivingController {
  static async createCampaign(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const campaign = await GivingService.createCampaign(tenantId, req.body);
      res.status(201).json({ status: 'success', data: campaign });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getCampaigns(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const campaigns = await GivingService.getCampaigns(tenantId);
      res.status(200).json({ status: 'success', data: campaigns });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async recordDonation(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { debitAccountId, creditAccountId, fundId, gatewayPaymentId, ...donationData } = req.body;
      const result = await GivingService.recordDonation(
        tenantId,
        donationData,
        { debitAccountId, creditAccountId, fundId },
        { userId: req.user?.id as string | undefined },
        typeof gatewayPaymentId === 'string' && gatewayPaymentId.trim()
          ? { gatewayPaymentId: gatewayPaymentId.trim() }
          : undefined
      );
      res.status(201).json({
        status: 'success',
        data: result.donation,
        meta: { idempotent: result.idempotent, voucherId: result.voucherId },
      });
    } catch (error: unknown) {
      console.error('[GIVING CONTROLLER] recordDonation error:', error);
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  /** Body is raw Buffer (see server index: express.raw). Verifies HMAC, runs idempotent post of payment. */
  static async razorpayWebhook(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const raw = req.body as Buffer;
      if (!Buffer.isBuffer(raw)) {
        return res.status(400).json({ error: toErrorResponse(new Error('Expected raw body')) });
      }
      const sig = String(req.headers['x-razorpay-signature'] || '');
      const cfg = await GivingService.getRazorpayConfig(tenantId);
      const { webhookSecret } = cfg;
      if (!webhookSecret) {
        return res.status(503).json({
          error: { code: 'WEBHOOK_NOT_CONFIGURED', message: 'Razorpay webhook secret is not configured for this tenant.' },
        });
      }
      const expected = crypto.createHmac('sha256', webhookSecret).update(raw).digest('hex');
      if (sig.length !== expected.length) {
        return res.status(400).json({ error: { code: 'WEBHOOK_SIGNATURE', message: 'Invalid webhook signature' } });
      }
      if (
        !crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'))
      ) {
        return res.status(400).json({ error: { code: 'WEBHOOK_SIGNATURE', message: 'Invalid webhook signature' } });
      }
      const body = JSON.parse(raw.toString('utf8')) as Record<string, unknown>;
      const signatureHash = crypto.createHash('sha256').update(raw).digest('hex');

      if (isWebhookQueueEnabled() && cfg.isConfigured) {
        const enq = await enqueueRazorpayWebhook({
          tenantId,
          body,
          signatureHash,
          rawSize: raw.length,
        });
        if (enq) {
          return res.status(202).json({ status: 'queued', jobId: enq.id });
        }
      }

      const out = await GivingService.handleRazorpayWebhook(tenantId, body, {
        signatureHash,
        rawSize: raw.length,
      });
      if (out.ignored) {
        return res.status(200).json({ status: 'ok', ignored: true, event: out.event });
      }
      if (out.duplicate) {
        return res.status(200).json({
          status: 'success',
          duplicate: true,
          data: out.donation,
          meta: { voucherId: out.voucherId, idempotent: true },
        });
      }
      return res.status(200).json({
        status: 'success',
        data: out.donation,
        meta: { idempotent: out.idempotent, voucherId: out.voucherId },
      });
    } catch (error: unknown) {
      triggerAlertOnCodedError(error, 'webhook', { route: 'razorpay' });
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getDonations(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const limit = Math.min(Number(req.query.limit) || 100, 500);
      const offset = Number(req.query.offset) || 0;
      const search = (req.query.search as string) || undefined;
      const fundId = (req.query.fundId as string) || undefined;
      const campaignId = (req.query.campaignId as string) || undefined;
      const method = (req.query.method as string) || undefined;
      const result = await GivingService.getDonations(tenantId, { limit, offset, search, fundId, campaignId, method });
      res.status(200).json({ status: 'success', data: result.rows, meta: { total: result.total, limit: result.limit, offset: result.offset } });
    } catch (error: unknown) {
      console.error('[GIVING CONTROLLER] getDonations error:', error);
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async reverseDonation(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const donationId = String(req.params.id || '');
      const out = await GivingService.reverseDonation(tenantId, donationId, (req.user?.id as string | undefined) ?? null);
      res.status(200).json({ status: 'success', data: out });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getDonationReconciliation(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const out = await GivingService.getDonationReconciliation(tenantId, { from, to });
      res.status(200).json({ status: 'success', data: out });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getDonationReceipt(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const donationId = String(req.params.id || '');
      const receipt = await GivingService.getDonationReceipt(tenantId, donationId);
      res.status(200).json({ status: 'success', data: receipt });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async regenerateDonationReceipt(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const donationId = String(req.params.id || '');
      const receipt = await GivingService.regenerateDonationReceipt(tenantId, donationId, (req.user?.id as string | undefined) ?? null);
      res.status(200).json({ status: 'success', data: receipt });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getDonationReceiptPdf(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const donationId = String(req.params.id || '');
      const { buffer, filename } = await GivingService.getDonationReceiptPdfBuffer(tenantId, donationId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.send(buffer);
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async listFinancialReceipts(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const offset = Number(req.query.offset) || 0;
      const result = await GivingService.listFinancialReceipts(tenantId, {
        limit,
        offset,
        search: (req.query.search as string) || undefined,
        fundId: (req.query.fundId as string) || undefined,
        campaignId: (req.query.campaignId as string) || undefined,
        from: (req.query.from as string) || undefined,
        to: (req.query.to as string) || undefined,
      });
      res.status(200).json({ status: 'success', data: result.rows, meta: { total: result.total, limit: result.limit, offset: result.offset } });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  /** Public Key ID + configuration status for Razorpay (from settings, not env). Secrets never returned. */
  static async getPaymentGateway(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const c = await GivingService.getPaymentGatewayConfig(tenantId);
      res.status(200).json({
        status: 'success',
        data: c,
      });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async createPublicGatewayOrder(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const order = await GivingService.createPublicGatewayOrder(tenantId, req.body ?? {});
      res.status(201).json({ status: 'success', data: order });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async verifyPublicGatewayPayment(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const verified = await GivingService.verifyAndRecordPublicGatewayPayment(tenantId, req.body ?? {});
      res.status(200).json({ status: 'success', data: verified });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async createRazorpayOrder(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const order = await GivingService.createRazorpayOrder(tenantId, req.body);
      res.status(201).json({ status: 'success', data: order });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async verifyPublicRazorpayPayment(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const verified = await GivingService.verifyAndRecordPublicRazorpayPayment(tenantId, req.body ?? {});
      res.status(200).json({ status: 'success', data: verified });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async cashfreeWebhook(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const raw = req.body as Buffer;
      if (!Buffer.isBuffer(raw)) {
        return res.status(400).json({ error: toErrorResponse(new Error('Expected raw body')) });
      }
      const sig = String(req.headers['x-webhook-signature'] || '');
      const out = await GivingService.handleCashfreeWebhook(tenantId, raw, sig);
      res.status(200).json({ status: 'success', data: out });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async estimateGatewayFee(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const amount = Number(req.body?.amount || req.query?.amount || 0);
      const donorCoveredFee = Boolean(req.body?.donorCoveredFee);
      const fin = await getMergedFinancialSettings(tenantId);
      const amounts = computeCheckoutAmounts(amount, donorCoveredFee, {
        feePercent: fin.gatewayFeePercent,
        gstPercent: fin.gatewayFeeGstPercent,
      });
      res.status(200).json({ status: 'success', data: amounts });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getGatewayReconciliationDashboard(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const data = await GatewaySettlementService.getDashboard(tenantId);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async importGatewaySettlement(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const userId = req.user?.id as string | undefined;
      const data = await GatewaySettlementService.importSettlement(tenantId, req.body, userId ?? null);
      res.status(201).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async postGatewaySettlement(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const settlementId = String(req.params.settlementId || '');
      const userId = req.user?.id as string | undefined;
      const data = await GatewaySettlementService.postSettlementVouchers(tenantId, settlementId, userId ?? null);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async listPendingSettlementDonations(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const offset = Number(req.query.offset) || 0;
      const data = await GatewaySettlementService.listPendingDonations(tenantId, limit, offset);
      res.status(200).json({ status: 'success', data: data.rows, meta: { total: data.total, limit: data.limit, offset: data.offset } });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async listServiceCollectionSessions(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const data = await GatewayRepository.listServiceSessions(tenantId);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async getDataQualityReport(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const data = await DataQualityService.getOperationalReport(tenantId);
      res.status(200).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  static async createServiceCollectionSession(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const { name, serviceDate, notes } = req.body ?? {};
      const data = await GatewayRepository.createServiceSession(tenantId, {
        name: String(name || 'Sunday Service'),
        serviceDate: new Date(serviceDate || Date.now()),
        notes: notes ? String(notes) : undefined,
      });
      res.status(201).json({ status: 'success', data });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }
}
