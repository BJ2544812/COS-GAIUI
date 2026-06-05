-- Prayer request workflow hardening (status lifecycle + activity timeline)
ALTER TABLE "PrayerRequest" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "PrayerRequest" ADD COLUMN IF NOT EXISTS "followUpNotes" TEXT;
ALTER TABLE "PrayerRequest" ALTER COLUMN "status" SET DEFAULT 'OPEN';
UPDATE "PrayerRequest" SET "status" = 'IN_PRAYER' WHERE "status" IN ('Assigned', 'assigned') AND "assignedUserId" IS NOT NULL;
UPDATE "PrayerRequest" SET "status" = 'OPEN' WHERE "status" IN ('Active', 'active', 'Assigned', 'assigned');

CREATE TABLE IF NOT EXISTS "PrayerRequestActivity" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "prayerRequestId" TEXT NOT NULL,
  "actionType" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "actorUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PrayerRequestActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PrayerRequestActivity_tenantId_prayerRequestId_createdAt_idx"
  ON "PrayerRequestActivity"("tenantId", "prayerRequestId", "createdAt");

ALTER TABLE "PrayerRequestActivity"
  ADD CONSTRAINT "PrayerRequestActivity_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PrayerRequestActivity"
  ADD CONSTRAINT "PrayerRequestActivity_prayerRequestId_fkey"
  FOREIGN KEY ("prayerRequestId") REFERENCES "PrayerRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PrayerRequestActivity"
  ADD CONSTRAINT "PrayerRequestActivity_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
