import express from 'express';
import { createServer } from 'node:http';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import { prisma } from './utils/prisma.js';
import { tenantMiddleware } from './middleware/tenant.middleware.js';
import { GivingController } from './controllers/GivingController.js';

// Import Routes (To be created)
import authRoutes from './routes/auth.routes.js';
import memberRoutes from './routes/member.routes.js';
import eventRoutes from './routes/event.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import financeRoutes from './routes/finance.routes.js';
import discipleshipRoutes from './routes/discipleship.routes.js';
import { discipleshipV2Router } from './routes/discipleshipV2.routes.js';
import givingRoutes from './routes/giving.routes.js';
import assetRoutes from './routes/asset.routes.js';
import outreachRoutes from './routes/outreach.routes.js';
import communicationRoutes from './routes/communication.routes.js';
import documentRoutes from './routes/document.routes.js';
import websiteRoutes from './routes/website.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import permissionsRoutes from './routes/permissions.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import churchStructureRouter from './routes/churchStructure.routes.js';
import { eventAdminRouter } from './routes/eventAdmin.routes.js';
import operationsRoutes from './routes/operations.routes.js';
import platformRoutes from './routes/platform.routes.js';
import deploymentRoutes from './routes/deployment.routes.js';
import memberPortalRoutes from './routes/memberPortal.routes.js';
import careRoutes from './routes/care.routes.js';
import digestRoutes from './routes/digest.routes.js';
import hrRoutes from './routes/hr.routes.js';
import { startScheduledOpsJobs } from './jobs/scheduledOps.js';
import { initSocketHub } from './realtime/socketHub.js';
import { authenticateToken, requirePermission } from './middleware/auth.middleware.js';
import { initializeMinio } from './utils/minio.js';
import { runIdempotencyCleanup } from './jobs/idempotencyCleanup.js';
import { razorpayWebhookRateLimiter } from './middleware/webhookRateLimit.js';
import { startRazorpayWebhookWorker } from './workers/razorpayWebhookWorker.js';
import { startEventWorker } from './events/eventWorker.js';
import {
  getRazorpayReconciliationIntervalMs,
  runRazorpayReconciliationOneShot,
} from './jobs/razorpayReconciliation.js';
import { requestContextMiddleware, apiErrorLogger } from './middleware/requestContext.middleware.js';
import { securityHeadersMiddleware } from './middleware/securityHeaders.js';
import { registerGracefulShutdown } from './utils/gracefulShutdown.js';
import {
  logBootEnvironment,
  logMountedRouteGroups,
  logOptionalIntegrations,
  logRouteVerificationSummary,
  readPackageVersion,
} from './utils/structuredStartup.js';
import { assertStartupRoutesOrExit, runStartupRouteVerification } from './utils/startupVerification.js';
import { MOUNTED_ROUTE_GROUPS, V1_ROUTE_GROUPS } from './utils/routeManifest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Minimal env: DB + JWT. MinIO is optional (uploads degrade gracefully; see utils/minio.ts).
  const missingDb = !process.env.DATABASE_URL?.trim();
  if (missingDb) {
    console.error('[CRITICAL] DATABASE_URL is required. Example: postgresql://postgres:password@localhost:5432/church_erp');
    console.error('[CRITICAL] Copy .env.example → .env and start Postgres (e.g. docker compose up -d postgres).');
    process.exit(1);
  }

  if (!process.env.JWT_SECRET?.trim()) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[CRITICAL] JWT_SECRET is required in production.');
      process.exit(1);
    }
    process.env.JWT_SECRET = 'church-erp-dev-jwt-change-me-not-for-production';
    console.warn('[boot] JWT_SECRET unset — using a dev-only default. Set JWT_SECRET in .env for stable sessions.');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const redisConfigured = Boolean(process.env.REDIS_URL?.trim());
  if (isProduction && !redisConfigured) {
    console.error('[CRITICAL] REDIS_URL is required in production for queue and realtime resilience.');
    process.exit(1);
  }

  const app = express();
  const PORT = Number(process.env.PORT || 4002);

  app.disable('x-powered-by');
  app.use(securityHeadersMiddleware);

  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    credentials: true,
  }));

  /** Raw body for Razorpay HMAC; must be registered before express.json. */
  app.post(
    '/api/v1/giving/webhooks/razorpay',
    express.raw({ type: 'application/json' }),
    tenantMiddleware,
    razorpayWebhookRateLimiter,
    GivingController.razorpayWebhook as any
  );

  app.post(
    '/api/v1/giving/webhooks/cashfree',
    express.raw({ type: 'application/json' }),
    tenantMiddleware,
    razorpayWebhookRateLimiter,
    GivingController.cashfreeWebhook as any
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(requestContextMiddleware);

  // Database: never crash the process; $connect alone is not enough — verify with a query.
  let databaseReady = false;
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    databaseReady = true;
    console.log('PostgreSQL Connected via Prisma');
  } catch (error) {
    console.error(
      '[database] Not ready — is PostgreSQL running? Check DATABASE_URL (e.g. postgresql://postgres:password@localhost:5432/church_erp with docker compose).',
      error
    );
  }

  if (databaseReady) {
    try {
      startScheduledOpsJobs();
    } catch (e) {
      console.error('[scheduled ops] failed to start:', e);
    }
    try {
      await runIdempotencyCleanup();
    } catch (e) {
      console.error('[idempotency cleanup] initial run failed:', e);
    }
    setInterval(() => {
      void runIdempotencyCleanup().catch((e) =>
        console.error('[idempotency cleanup] scheduled run failed:', e)
      );
    }, 60 * 60 * 1000);

    const reconMs = getRazorpayReconciliationIntervalMs();
    setTimeout(() => {
      void runRazorpayReconciliationOneShot().catch((e) =>
        console.error('[razorpay reconciliation] run failed:', e)
      );
    }, 60_000);
    setInterval(() => {
      void runRazorpayReconciliationOneShot().catch((e) =>
        console.error('[razorpay reconciliation] scheduled run failed:', e)
      );
    }, reconMs);
  } else {
    console.warn('[database] Skipping idempotency cleanup and reconciliation schedules until the database is available.');
  }

  try {
    startRazorpayWebhookWorker();
    startEventWorker();
  } catch (e) {
    console.error('[worker] failed to start (events/webhooks will run synchronously):', e);
  }
  if (!process.env.REDIS_URL?.trim()) {
    console.log('[redis] REDIS_URL not set — Razorpay webhooks use synchronous mode.');
  }

  try {
    await initializeMinio();
  } catch (e) {
    console.error('[minio] unexpected error:', e);
  }

  /** Liveness — process is up (orchestrator restarts if this fails). */
  app.get('/health/live', (_req, res) => {
    res.status(200).json({ status: 'live', timestamp: new Date().toISOString() });
  });

  /** Readiness — DB required for traffic in production. */
  app.get('/health/ready', (_req, res) => {
    const ready = databaseReady;
    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'not_ready',
      database: databaseReady ? 'connected' : 'disconnected',
      version: readPackageVersion(),
      timestamp: new Date().toISOString(),
    });
  });

  /** Operator diagnostics — queue, redis, workers (self-host friendly). */
  app.get('/health/diagnostics', async (_req, res) => {
    try {
      const { collectHealthDiagnostics } = await import('./utils/healthDiagnostics.js');
      const diagnostics = await collectHealthDiagnostics();
      const ok = diagnostics.database === 'connected';
      res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded', ...diagnostics });
    } catch (e) {
      res.status(500).json({
        status: 'error',
        message: e instanceof Error ? e.message : 'diagnostics failed',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Health Endpoint (always 200 when the HTTP server is up; includes DB status for ops)
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      database: databaseReady ? 'connected' : 'disconnected',
      version: readPackageVersion(),
      bootId: process.env.BOOT_ID ?? null,
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/health/routes', async (req, res) => {
    const headerTenant = (req.headers['x-tenant-id'] as string | undefined)?.trim();
    const report = await runStartupRouteVerification(
      PORT,
      headerTenant || process.env.VITE_TENANT_ID?.trim() || process.env.TENANT_ID?.trim() || 'default-tenant-id',
    );
    res.status(report.passed ? 200 : 503).json({
      status: report.passed ? 'ready' : 'degraded',
      version: report.buildVersion,
      bootId: report.bootId,
      mountedGroups: MOUNTED_ROUTE_GROUPS,
      criticalGroups: V1_ROUTE_GROUPS.map((g) => g.group),
      probes: report.probes,
      failures: report.failures,
    });
  });

  // API Routes
  const apiRouter = express.Router();
  
  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/members', memberRoutes);
  apiRouter.use('/events', eventRoutes);
  apiRouter.use('/attendance', attendanceRoutes);
  apiRouter.use('/finance', financeRoutes);
  /** Register v2 before legacy `/discipleship` so paths like `/discipleship/v2/care-cases/:id` resolve correctly. */
  apiRouter.use('/discipleship/v2', discipleshipV2Router);
  apiRouter.use('/discipleship', discipleshipRoutes);
  apiRouter.use('/giving', givingRoutes);
  apiRouter.use('/assets', assetRoutes);
  apiRouter.use('/outreach', outreachRoutes);
  apiRouter.use('/communication', communicationRoutes);
  apiRouter.use('/documents', documentRoutes);
  apiRouter.use('/website', websiteRoutes);
  apiRouter.use('/settings', settingsRoutes);
  apiRouter.use('/upload', authenticateToken, requirePermission('manage_settings'), uploadRoutes);
  apiRouter.use('/analytics', analyticsRoutes);
  apiRouter.use('/permissions', permissionsRoutes);
  apiRouter.use('/notifications', notificationRoutes);
  apiRouter.use('/operations', operationsRoutes);
  apiRouter.use('/platform', platformRoutes);
  apiRouter.use('/deploy', deploymentRoutes);
  apiRouter.use('/member-portal', memberPortalRoutes);
  apiRouter.use('/care', careRoutes);
  apiRouter.use('/digests', digestRoutes);
  apiRouter.use('/structure', churchStructureRouter);
  apiRouter.use('/admin/events', eventAdminRouter);
  apiRouter.use('/hr', hrRoutes);

  // --- Family image upload ---
  const familyRouter = (await import('express')).default.Router();
  const familyUpload = (await import('multer')).default({ storage: (await import('multer')).default.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  familyRouter.use(tenantMiddleware);
  familyRouter.use((await import('./middleware/auth.middleware.js')).authenticateToken);
  const { MemberProfileController: Mpc } = await import('./controllers/MemberProfileController.js');
  const { requirePermission: reqPerm } = await import('./middleware/auth.middleware.js');
  familyRouter.get('/', Mpc.listFamilies as any);
  familyRouter.post('/', reqPerm('manage_members'), Mpc.createFamily as any);
  familyRouter.post('/:id/image', reqPerm('manage_members'), familyUpload.single('file'), Mpc.uploadFamilyImage as any);
  apiRouter.use('/families', familyRouter);

  // --- Serve local uploads directly ---
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.use('/api/v1', apiRouter);
  /**
   * Legacy mount without `v1` — only paths that do not start with `/v1/` after `/api`.
   * Do not register a blanket `/api` router: it would steal `/api/v1/*` in some Express stacks.
   */
  app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/v1/') || req.path === '/v1') {
      next();
      return;
    }
    apiRouter(req, res, next);
  });

  // Catch-all for unmatched API paths (prevents falling through to Vite)
  app.use('/api', (req, res) => {
    res.status(404).json({
      error: 'API route not found',
      path: req.originalUrl,
      hint: 'Use /api/v1/... for Kingdom Church OS v1 endpoints',
    });
  });

  // Global Error Handler
  app.use(apiErrorLogger);
  app.use((err: any, req: any, res: any, next: any) => {
    if (res.headersSent) {
      next(err);
      return;
    }
    console.error('[GLOBAL ERROR]', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
      correlationId: req.correlationId,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
  });

  // Vite Integration for Frontend (API + /health must still work if Vite fails to init)
  if (process.env.NODE_ENV !== 'production') {
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error('[vite] Dev middleware failed; restart or check vite.config. API and /health still work:', e);
    }
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const httpServer = createServer(app);
  initSocketHub(httpServer);
  registerGracefulShutdown(httpServer);

  logBootEnvironment({
    port: PORT,
    databaseReady,
    redisConfigured,
    socketEnabled: true,
  });
  logMountedRouteGroups();
  logOptionalIntegrations();

  if (!databaseReady && isProduction) {
    console.error('[CRITICAL] Database not ready — refusing production startup.');
    process.exit(1);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[boot] Listening http://127.0.0.1:${PORT} (0.0.0.0:${PORT})`);
    console.log(`[boot] Health: /health /health/live /health/ready  |  Routes: /health/routes  |  API: /api/v1`);

    if (process.env.SKIP_ROUTE_VERIFY === '1') {
      console.warn('[boot] SKIP_ROUTE_VERIFY=1 — route fail-fast disabled');
      return;
    }

    void (async () => {
      try {
        const verifyTenant =
          process.env.VITE_TENANT_ID?.trim() ||
          process.env.TENANT_ID?.trim() ||
          'default-tenant-id';
        const report = await assertStartupRoutesOrExit(PORT, verifyTenant);
        logRouteVerificationSummary(report);
        console.log('[boot] Startup complete — V1 routes active');
      } catch (e) {
        console.error('[boot] Route verification error:', e);
        process.exit(1);
      }
    })();
  }).on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `[FATAL] Port ${PORT} is already in use. Stop the other process (e.g. old dev:server) or set PORT= in .env.`,
      );
    } else {
      console.error('[FATAL] HTTP listen error:', err);
    }
    process.exit(1);
  });
}

startServer().catch((err) => {
  console.error('[FATAL] Server failed to start:', err);
  process.exit(1);
});
