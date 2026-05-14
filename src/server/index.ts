import express from 'express';
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

  const app = express();
  const PORT = process.env.PORT || 4002;

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
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

  // Health Endpoint (always 200 when the HTTP server is up; includes DB status for ops)
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      database: databaseReady ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
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
  console.log('[API] Registering /structure routes');
  apiRouter.use('/structure', churchStructureRouter);
  apiRouter.use('/admin/events', eventAdminRouter);

  // --- Family image upload ---
  const familyRouter = (await import('express')).default.Router();
  const familyUpload = (await import('multer')).default({ storage: (await import('multer')).default.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
  familyRouter.use(tenantMiddleware);
  familyRouter.use((await import('./middleware/auth.middleware.js')).authenticateToken);
  familyRouter.get('/', (await import('./controllers/MemberProfileController.js')).MemberProfileController.listFamilies as any);
  familyRouter.post('/:id/image', (await import('./middleware/auth.middleware.js')).requirePermission('manage_members'), familyUpload.single('file'), (await import('./controllers/MemberProfileController.js')).MemberProfileController.uploadFamilyImage as any);
  apiRouter.use('/families', familyRouter);

  // --- Serve local uploads directly ---
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  app.use('/api/v1', apiRouter);

  // Catch-all for API routes to prevent falling through to Vite middleware
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('[GLOBAL ERROR]', err);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack 
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

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[boot] Kingdom OS API listening on http://127.0.0.1:${PORT} (bound 0.0.0.0:${PORT})`);
    console.log(`[boot] Health: http://127.0.0.1:${PORT}/health  |  API prefix: /api/v1`);
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
