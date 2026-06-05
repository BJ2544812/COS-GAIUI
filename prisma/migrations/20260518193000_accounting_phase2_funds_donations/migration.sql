-- Phase 2: Fund Accounting + Donation Integrity

-- Fund master hardening
CREATE UNIQUE INDEX IF NOT EXISTS "Fund_tenantId_name_key" ON "Fund"("tenantId", "name");

-- Campaign -> default fund
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "defaultFundId" TEXT;
DO $$ BEGIN
  ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_defaultFundId_fkey"
    FOREIGN KEY ("defaultFundId") REFERENCES "Fund"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Donation accounting linkage
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "fundId" TEXT;
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "voucherId" TEXT;
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "reversalVoucherId" TEXT;
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "gatewayPaymentId" TEXT;
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'Recorded';
DO $$ BEGIN
  ALTER TABLE "Donation" ADD CONSTRAINT "Donation_fundId_fkey"
    FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Donation" ADD CONSTRAINT "Donation_voucherId_fkey"
    FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Donation" ADD CONSTRAINT "Donation_reversalVoucherId_fkey"
    FOREIGN KEY ("reversalVoucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "Donation_tenantId_fundId_date_idx" ON "Donation"("tenantId", "fundId", "date");
CREATE INDEX IF NOT EXISTS "Donation_tenantId_voucherId_idx" ON "Donation"("tenantId", "voucherId");
CREATE INDEX IF NOT EXISTS "Donation_tenantId_reversalVoucherId_idx" ON "Donation"("tenantId", "reversalVoucherId");
CREATE UNIQUE INDEX IF NOT EXISTS "Donation_tenantId_gatewayPaymentId_key"
  ON "Donation"("tenantId", "gatewayPaymentId")
  WHERE "gatewayPaymentId" IS NOT NULL;
