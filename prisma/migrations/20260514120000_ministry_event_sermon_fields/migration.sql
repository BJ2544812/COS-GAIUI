-- Operational fields for Events + Sermons (ministry workflows)
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "internalNotes" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "recurringRule" TEXT;

ALTER TABLE "Sermon" ADD COLUMN IF NOT EXISTS "scripture" TEXT;
ALTER TABLE "Sermon" ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT false;
