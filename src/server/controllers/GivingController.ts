import { Response } from 'express';
import crypto from 'crypto';
import { TenantRequest } from '../middleware/tenant.middleware.js';
import { GivingService } from '../services/GivingService.js';
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
      const { debitAccountId, creditAccountId, gatewayPaymentId, ...donationData } = req.body;
      const result = await GivingService.recordDonation(
        tenantId,
        donationData,
        { debitAccountId, creditAccountId },
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
      const donations = await GivingService.getDonations(tenantId);
      res.status(200).json({ status: 'success', data: donations });
    } catch (error: unknown) {
      console.error('[GIVING CONTROLLER] getDonations error:', error);
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }

  /** Public Key ID + configuration status for Razorpay (from settings, not env). Secrets never returned. */
  static async getPaymentGateway(req: TenantRequest, res: Response) {
    try {
      const tenantId = req.tenantId!;
      const c = await GivingService.getRazorpayConfig(tenantId);
      res.status(200).json({
        status: 'success',
        data: {
          isConfigured: c.isConfigured,
          razorpayKeyId: c.keyId,
        },
      });
    } catch (error: unknown) {
      res.status(400).json({ error: toErrorResponse(error) });
    }
  }
}
