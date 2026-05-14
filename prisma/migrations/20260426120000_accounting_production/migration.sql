-- Accounting: voucher lifecycle, FY sequence, reversals
-- Run when applying to an existing database. New databases can use `prisma migrate dev`.

-- VoucherFySequence
CREATE TABLE IF NOT EXISTS "VoucherFySequence" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fyStartYear" INTEGER NOT NULL,
    "lastSeq" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoucherFySequence_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VoucherFySequence_tenantId_fyStartYear_key" ON "VoucherFySequence"("tenantId", "fyStartYear");

DO $$ BEGIN
  ALTER TABLE "VoucherFySequence" ADD CONSTRAINT "VoucherFySequence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Voucher columns
ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "postedAt" TIMESTAMP(3);
ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "reversesVoucherId" TEXT;

DO $$ BEGIN
  ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_reversesVoucherId_key" UNIQUE ("reversesVoucherId");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_reversesVoucherId_fkey" FOREIGN KEY ("reversesVoucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Existing rows were already posted to the GL in prior app versions
UPDATE "Voucher" SET "status" = 'posted', "postedAt" = COALESCE("postedAt", "createdAt") WHERE "status" = 'draft';

CREATE INDEX IF NOT EXISTS "Voucher_tenantId_status_idx" ON "Voucher"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "Voucher_tenantId_date_idx" ON "Voucher"("tenantId", "date");
