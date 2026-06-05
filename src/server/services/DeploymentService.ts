import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Redis from 'ioredis';
import { prisma } from '../utils/prisma.js';
import { getSocketHub } from '../realtime/socketHub.js';
import { EventBus } from '../events/eventBus.js';
import { minioClient, BUCKET_NAME } from '../utils/minio.js';

export type InfraProbe = { name: string; status: 'up' | 'down' | 'degraded'; detail?: string; ms?: number };

export type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  module?: string;
};

const ONBOARDING_KEY = 'onboarding_progress';
const DEMO_MODE_KEY = 'demo_mode';
const LICENSE_KEY = 'license_entitlements';
const MAINTENANCE_KEY = 'tenant_maintenance_mode';

const DEFAULT_ENTITLEMENTS = [
  'members',
  'events',
  'attendance',
  'giving',
  'finance',
  'website',
  'operations',
  'intelligence',
  'communication',
] as const;

async function readSetting(tenantId: string, key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({
    where: { tenantId_key: { tenantId, key } },
  });
  return row?.value ?? null;
}

async function writeSetting(tenantId: string, key: string, value: string) {
  await prisma.setting.upsert({
    where: { tenantId_key: { tenantId, key } },
    create: { tenantId, key, value },
    update: { value },
  });
}

export class DeploymentService {
  static async getSetupStatus() {
    const tenantCount = await prisma.tenant.count();
    return {
      needsSetup: tenantCount === 0,
      tenantCount,
      version: this.getVersionInfo(),
    };
  }

  static getVersionInfo() {
    let packageVersion = '0.0.0';
    try {
      const pkgPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
      packageVersion = pkg.version ?? packageVersion;
    } catch {
      /* use default */
    }
    return {
      packageVersion,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV ?? 'development',
    };
  }

  static async validateInfrastructure(tenantId?: string) {
    const probes: InfraProbe[] = [];
    const t0 = Date.now();

    try {
      await prisma.$queryRaw`SELECT 1`;
      probes.push({ name: 'database', status: 'up', ms: Date.now() - t0 });
    } catch (e) {
      probes.push({
        name: 'database',
        status: 'down',
        detail: e instanceof Error ? e.message : 'unavailable',
      });
    }

    const redisUrl = process.env.REDIS_URL?.trim();
    if (!redisUrl) {
      probes.push({
        name: 'redis',
        status: 'degraded',
        detail: 'REDIS_URL not set — background queue runs synchronously',
      });
    } else {
      const rt0 = Date.now();
      const client = new Redis(redisUrl, { maxRetriesPerRequest: 1, connectTimeout: 3000 });
      try {
        await client.ping();
        probes.push({ name: 'redis', status: 'up', ms: Date.now() - rt0, detail: 'reachable' });
      } catch (e) {
        probes.push({
          name: 'redis',
          status: 'down',
          detail: e instanceof Error ? e.message : 'ping failed',
        });
      } finally {
        client.disconnect();
      }
    }

    const mt0 = Date.now();
    try {
      await minioClient.bucketExists(BUCKET_NAME);
      probes.push({
        name: 'object_storage',
        status: 'up',
        ms: Date.now() - mt0,
        detail: `bucket ${BUCKET_NAME}`,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unreachable';
      probes.push({
        name: 'object_storage',
        status: 'degraded',
        detail: `${msg} — uploads optional until MinIO is running`,
      });
    }

    const socket = getSocketHub();
    probes.push({
      name: 'socketio',
      status: socket ? 'up' : 'degraded',
      detail: socket ? 'realtime hub active' : 'not initialized on this process',
    });

    probes.push({
      name: 'jwt_secret',
      status: process.env.JWT_SECRET?.trim() ? 'up' : 'degraded',
      detail: process.env.JWT_SECRET?.trim()
        ? 'configured'
        : 'using dev default — set JWT_SECRET in production',
    });

    if (tenantId) {
      try {
        const stats = await EventBus.getEventStats(tenantId);
        probes.push({
          name: 'event_worker',
          status: stats.failed > 10 ? 'degraded' : 'up',
          detail: `pending ${stats.pending}, failed ${stats.failed}`,
        });
      } catch (e) {
        probes.push({
          name: 'event_worker',
          status: 'degraded',
          detail: e instanceof Error ? e.message : 'stats unavailable',
        });
      }
    }

    const down = probes.filter((p) => p.status === 'down').length;
    const degraded = probes.filter((p) => p.status === 'degraded').length;

    return {
      generatedAt: new Date().toISOString(),
      overall: down > 0 ? 'down' : degraded > 0 ? 'degraded' : 'healthy',
      probes,
      readyForSetup: probes.find((p) => p.name === 'database')?.status === 'up',
    };
  }

  static async getOnboardingChecklist(tenantId: string) {
    const manualRaw = await readSetting(tenantId, ONBOARDING_KEY);
    let manual: Record<string, boolean> = {};
    if (manualRaw) {
      try {
        manual = JSON.parse(manualRaw) as Record<string, boolean>;
      } catch {
        manual = {};
      }
    }

    const [
      campusCount,
      memberCount,
      publishedPages,
      eventCount,
      fundCount,
      accountCount,
      userCount,
      settingsRows,
    ] = await Promise.all([
      prisma.campus.count({ where: { tenantId } }),
      prisma.member.count({ where: { tenantId, status: 'Active' } }),
      prisma.pageData.count({ where: { tenantId, isPublished: true } }),
      prisma.event.count({ where: { tenantId } }),
      prisma.fund.count({ where: { tenantId } }),
      prisma.account.count({ where: { tenantId } }),
      prisma.user.count({ where: { tenantId } }),
      prisma.setting.findMany({ where: { tenantId }, take: 20 }),
    ]);

    const hasOrgProfile = settingsRows.some(
      (s) => s.key.includes('organization') || s.key === 'church_settings',
    );

    const steps: OnboardingStep[] = [
      {
        id: 'organization',
        title: 'Church profile',
        description: 'Organization name, contact, and branding in Settings.',
        completed: manual.organization ?? hasOrgProfile,
        module: 'settings',
      },
      {
        id: 'campuses',
        title: 'Campuses & structure',
        description: 'Define campuses and ministry structure.',
        completed: manual.campuses ?? campusCount > 0,
        module: 'structure',
      },
      {
        id: 'members',
        title: 'Member directory',
        description: 'Import or add your first members.',
        completed: manual.members ?? memberCount >= 3,
        module: 'members',
      },
      {
        id: 'website',
        title: 'Public website',
        description: 'Publish at least one public page.',
        completed: manual.website ?? publishedPages > 0,
        module: 'website',
      },
      {
        id: 'events',
        title: 'First gathering',
        description: 'Schedule a service or event.',
        completed: manual.events ?? eventCount > 0,
        module: 'events',
      },
      {
        id: 'giving',
        title: 'Giving funds',
        description: 'Configure funds for online and in-person giving.',
        completed: manual.giving ?? fundCount > 0,
        module: 'giving',
      },
      {
        id: 'finance',
        title: 'Chart of accounts',
        description: 'Accounting foundation for receipts and expenses.',
        completed: manual.finance ?? accountCount > 0,
        module: 'finance',
      },
      {
        id: 'team',
        title: 'Team access',
        description: 'Invite operators beyond the initial admin.',
        completed: manual.team ?? userCount > 1,
        module: 'permissions',
      },
    ];

    const completedCount = steps.filter((s) => s.completed).length;
    return {
      steps,
      completedCount,
      totalCount: steps.length,
      percentComplete: Math.round((completedCount / steps.length) * 100),
      demoMode: (await readSetting(tenantId, DEMO_MODE_KEY)) === 'true',
    };
  }

  static async patchOnboardingStep(tenantId: string, stepId: string, completed: boolean) {
    const manualRaw = await readSetting(tenantId, ONBOARDING_KEY);
    let manual: Record<string, boolean> = {};
    if (manualRaw) {
      try {
        manual = JSON.parse(manualRaw) as Record<string, boolean>;
      } catch {
        manual = {};
      }
    }
    manual[stepId] = completed;
    await writeSetting(tenantId, ONBOARDING_KEY, JSON.stringify(manual));
    return this.getOnboardingChecklist(tenantId);
  }

  static async activateDemoMode(tenantId: string) {
    await writeSetting(tenantId, DEMO_MODE_KEY, 'true');
    const memberCount = await prisma.member.count({ where: { tenantId } });
    return {
      demoMode: true,
      seeded: memberCount > 0,
      hint:
        memberCount === 0
          ? 'Run `npm run seed` to load the guided sample tenant dataset.'
          : 'Demo mode enabled — explore modules from the onboarding checklist.',
    };
  }

  static async resetDemoMode(tenantId: string) {
    await writeSetting(tenantId, DEMO_MODE_KEY, 'false');
    const { cacheInvalidatePrefix } = await import('../utils/opsCache.js');
    cacheInvalidatePrefix('ops:');
    cacheInvalidatePrefix('intel:');
    return {
      demoMode: false,
      message: 'Demo mode cleared. Live operational data unchanged.',
    };
  }

  static async getMaintenanceMode(tenantId: string) {
    const raw = await readSetting(tenantId, MAINTENANCE_KEY);
    if (!raw) return { enabled: false, message: '' };
    try {
      return JSON.parse(raw) as { enabled: boolean; message?: string };
    } catch {
      return { enabled: raw === 'true', message: '' };
    }
  }

  static async setMaintenanceMode(
    tenantId: string,
    input: { enabled: boolean; message?: string },
  ) {
    await writeSetting(
      tenantId,
      MAINTENANCE_KEY,
      JSON.stringify({
        enabled: input.enabled,
        message: input.message?.trim() || 'Scheduled maintenance in progress.',
      }),
    );
    return this.getMaintenanceMode(tenantId);
  }

  static async getLicenseEntitlements(tenantId: string) {
    const raw = await readSetting(tenantId, LICENSE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { modules?: string[]; plan?: string };
        return {
          plan: parsed.plan ?? 'ministry',
          modules: parsed.modules ?? [...DEFAULT_ENTITLEMENTS],
        };
      } catch {
        /* fall through */
      }
    }
    return {
      plan: 'ministry',
      modules: [...DEFAULT_ENTITLEMENTS],
    };
  }

  static async createTenantBackup(tenantId: string) {
    const [
      tenant,
      settings,
      members,
      events,
      pageData,
      sermons,
      funds,
      campuses,
      users,
    ] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.setting.findMany({ where: { tenantId } }),
      prisma.member.findMany({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          growthStage: true,
        },
        take: 5000,
      }),
      prisma.event.findMany({
        where: { tenantId },
        select: { id: true, name: true, type: true, date: true, status: true, location: true },
        take: 2000,
      }),
      prisma.pageData.findMany({ where: { tenantId } }),
      prisma.sermon.findMany({ where: { tenantId }, take: 500 }),
      prisma.fund.findMany({ where: { tenantId }, take: 100 }),
      prisma.campus.findMany({ where: { tenantId } }),
      prisma.user.findMany({
        where: { tenantId },
        select: { id: true, username: true, email: true, roleId: true, status: true },
        take: 200,
      }),
    ]);

    return {
      format: 'kingdom-os-backup-v1',
      exportedAt: new Date().toISOString(),
      tenantId,
      tenant,
      settings,
      members,
      events,
      pageData,
      sermons,
      funds,
      campuses,
      users,
    };
  }

  static async restoreTenantBackup(
    tenantId: string,
    manifest: {
      format?: string;
      settings?: Array<{ key: string; value: string }>;
      pageData?: Array<{
        slug: string;
        title: string;
        content: string;
        isPublished?: boolean;
      }>;
    },
  ) {
    if (manifest.format && manifest.format !== 'kingdom-os-backup-v1') {
      throw new Error('Unsupported backup format');
    }

    let restoredSettings = 0;
    let restoredPages = 0;

    if (Array.isArray(manifest.settings)) {
      for (const s of manifest.settings) {
        if (!s.key || s.value === undefined) continue;
        await writeSetting(tenantId, s.key, s.value);
        restoredSettings += 1;
      }
    }

    if (Array.isArray(manifest.pageData)) {
      for (const p of manifest.pageData) {
        if (!p.slug || !p.title) continue;
        await prisma.pageData.upsert({
          where: { tenantId_slug: { tenantId, slug: p.slug } },
          create: {
            tenantId,
            slug: p.slug,
            title: p.title,
            content: p.content ?? '[]',
            isPublished: p.isPublished ?? false,
          },
          update: {
            title: p.title,
            content: p.content ?? '[]',
            isPublished: p.isPublished ?? false,
          },
        });
        restoredPages += 1;
      }
    }

    await EventBus.publish({
      eventName: 'TenantBackupRestored',
      tenantId,
      entityId: tenantId,
      entityType: 'Tenant',
      payload: { restoredSettings, restoredPages, at: new Date().toISOString() },
    });

    return { restoredSettings, restoredPages };
  }

  static async listBackupRuns(tenantId: string, limit = 20) {
    return prisma.backupRun.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  static async runScheduledBackup(tenantId: string) {
    const run = await prisma.backupRun.create({
      data: { tenantId, status: 'running' },
    });
    try {
      const manifest = await this.createTenantBackup(tenantId);
      const json = JSON.stringify(manifest);
      const sizeBytes = Buffer.byteLength(json, 'utf8');
      const verified = Boolean(manifest.tenantId && manifest.settings);

      await prisma.backupRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          sizeBytes,
          verified,
          storageKey: `tenant-backup-${tenantId}-${run.id}.json`,
        },
      });

      await writeSetting(tenantId, 'backup.last_run_at', new Date().toISOString());
      await writeSetting(tenantId, 'backup.last_size_bytes', String(sizeBytes));

      return { runId: run.id, sizeBytes, verified };
    } catch (e) {
      const detail = e instanceof Error ? e.message : 'backup failed';
      await prisma.backupRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          errorDetail: detail,
        },
      });
      const { recordOperationalIncident } = await import('../utils/operationalIncidents.js');
      await recordOperationalIncident(tenantId, {
        severity: 'critical',
        category: 'backup_failure',
        title: 'Tenant backup failed',
        detail,
      }).catch(() => undefined);
      throw e;
    }
  }

  static async verifyLatestBackup(tenantId: string) {
    const latest = await prisma.backupRun.findFirst({
      where: { tenantId, status: 'completed' },
      orderBy: { createdAt: 'desc' },
    });
    if (!latest) return { ok: false, reason: 'No completed backup' };
    const ok = latest.sizeBytes != null && latest.sizeBytes > 100;
    if (ok && !latest.verified) {
      await prisma.backupRun.update({
        where: { id: latest.id },
        data: { verified: true },
      });
    }
    return { ok, run: latest };
  }

  static async getMigrationStatus() {
    try {
      const rows = await prisma.$queryRaw<Array<{ migration_name: string }>>`
        SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 5
      `;
      return { applied: rows.map((r) => r.migration_name), status: 'ok' as const };
    } catch (e) {
      return {
        applied: [] as string[],
        status: 'unknown' as const,
        detail: e instanceof Error ? e.message : 'Could not read migration table',
      };
    }
  }
}
