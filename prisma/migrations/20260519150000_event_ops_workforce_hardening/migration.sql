-- Event lifecycle, service run sheet, operational config
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "registrationOpen" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "runSheet" JSONB;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "opsConfig" JSONB;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Event_tenantId_status_idx" ON "Event"("tenantId", "status");

ALTER TYPE "TaskTargetType" ADD VALUE IF NOT EXISTS 'EVENT';

-- Workforce fields on Member
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "employmentType" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "department" TEXT;
ALTER TABLE "Member" ADD COLUMN IF NOT EXISTS "workforceClass" TEXT;
