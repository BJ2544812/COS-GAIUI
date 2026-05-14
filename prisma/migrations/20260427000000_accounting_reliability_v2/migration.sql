-- Idempotency TTL
ALTER TABLE "IdempotencyKey" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
UPDATE "IdempotencyKey" SET "expiresAt" = "createdAt" + INTERVAL '30 days' WHERE "expiresAt" IS NULL;
ALTER TABLE "IdempotencyKey" ALTER COLUMN "expiresAt" SET NOT NULL;
CREATE INDEX IF NOT EXISTS "IdempotencyKey_expiresAt_idx" ON "IdempotencyKey"("expiresAt");

-- Voucher + Donation source
ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "sourceRefId" TEXT;
CREATE INDEX IF NOT EXISTS "Voucher_tenantId_source_idx" ON "Voucher"("tenantId", "source");

ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "sourceRefId" TEXT;

-- Webhook replay table (Razorpay event id = evt_…)
CREATE TABLE IF NOT EXISTS "ProcessedRazorpayEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "paymentId" TEXT,
    "signatureHash" TEXT,
    "donationId" TEXT,
    "voucherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessedRazorpayEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ProcessedRazorpayEvent_tenantId_eventId_key" ON "ProcessedRazorpayEvent"("tenantId", "eventId");
CREATE INDEX IF NOT EXISTS "ProcessedRazorpayEvent_tenantId_createdAt_idx" ON "ProcessedRazorpayEvent"("tenantId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "ProcessedRazorpayEvent" ADD CONSTRAINT "ProcessedRazorpayEvent_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
