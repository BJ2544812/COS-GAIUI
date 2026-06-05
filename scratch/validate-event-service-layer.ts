/** Direct EventService.createEvent — validates applyPublicProfile without HTTP server age. */
import '../src/server/utils/loadEnv.ts';
import { prisma } from '../src/server/utils/prisma.js';
import { EventService } from '../src/server/services/EventService.js';

async function main() {
  const admin = await prisma.user.findFirst({
    where: { username: 'admin' },
    select: { tenantId: true },
  });
  const tenantId = admin!.tenantId!;
  const runId = `svc-${Date.now()}`;
  try {
    const event = await EventService.createEvent(tenantId, {
      name: `Svc layer ${runId}`,
      type: 'Special',
      date: new Date(Date.now() + 86400000 * 7),
      location: 'Hall',
      publicProfile: {
        publishedToWebsite: true,
        publicDescription: `desc ${runId}`,
        acceptsRegistration: true,
      },
    });
    const pub = (event.opsConfig as { public?: { publishedToWebsite?: boolean } })?.public;
    if (!pub?.publishedToWebsite) {
      console.log('FAIL service layer — opsConfig.public missing', event.opsConfig);
      process.exit(1);
    }
    console.log('PASS service layer — publicProfile → opsConfig.public', event.id);
    await prisma.event.delete({ where: { id: event.id } });
  } catch (e) {
    console.log('FAIL service layer', e);
    process.exit(1);
  }
}

main().finally(() => prisma.$disconnect());
