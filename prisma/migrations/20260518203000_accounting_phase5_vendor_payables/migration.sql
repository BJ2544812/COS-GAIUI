-- Phase 5: Vendor / Payables / Expense Workflow

CREATE TABLE IF NOT EXISTS "Vendor" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT,
  "contactName" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "gstin" TEXT,
  "pan" TEXT,
  "address" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Vendor_tenantId_name_key" ON "Vendor"("tenantId", "name");
CREATE INDEX IF NOT EXISTS "Vendor_tenantId_isActive_idx" ON "Vendor"("tenantId", "isActive");
DO $$ BEGIN
  ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "PayableBill" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "billNo" TEXT NOT NULL,
  "billDate" TIMESTAMP(3) NOT NULL,
  "dueDate" TIMESTAMP(3),
  "amount" DECIMAL(18,2) NOT NULL,
  "outstanding" DECIMAL(18,2) NOT NULL,
  "expenseAccountId" TEXT NOT NULL,
  "payableAccountId" TEXT NOT NULL,
  "fundId" TEXT,
  "costCenterId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "description" TEXT,
  "sourceType" TEXT,
  "sourceId" TEXT,
  "sourceMetadata" JSONB,
  "billVoucherId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayableBill_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PayableBill_tenantId_billNo_key" ON "PayableBill"("tenantId", "billNo");
CREATE INDEX IF NOT EXISTS "PayableBill_tenantId_vendorId_status_idx" ON "PayableBill"("tenantId", "vendorId", "status");
DO $$ BEGIN
  ALTER TABLE "PayableBill" ADD CONSTRAINT "PayableBill_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PayableBill" ADD CONSTRAINT "PayableBill_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PayableBill" ADD CONSTRAINT "PayableBill_fundId_fkey"
    FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PayableBill" ADD CONSTRAINT "PayableBill_costCenterId_fkey"
    FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PayableBill" ADD CONSTRAINT "PayableBill_billVoucherId_fkey"
    FOREIGN KEY ("billVoucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "PayablePayment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "billId" TEXT NOT NULL,
  "paymentDate" TIMESTAMP(3) NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "paymentAccountId" TEXT NOT NULL,
  "payableAccountId" TEXT NOT NULL,
  "fundId" TEXT,
  "costCenterId" TEXT,
  "notes" TEXT,
  "sourceType" TEXT,
  "sourceId" TEXT,
  "paymentVoucherId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayablePayment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PayablePayment_tenantId_vendorId_paymentDate_idx" ON "PayablePayment"("tenantId", "vendorId", "paymentDate");
CREATE INDEX IF NOT EXISTS "PayablePayment_tenantId_billId_idx" ON "PayablePayment"("tenantId", "billId");
DO $$ BEGIN
  ALTER TABLE "PayablePayment" ADD CONSTRAINT "PayablePayment_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PayablePayment" ADD CONSTRAINT "PayablePayment_vendorId_fkey"
    FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PayablePayment" ADD CONSTRAINT "PayablePayment_billId_fkey"
    FOREIGN KEY ("billId") REFERENCES "PayableBill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PayablePayment" ADD CONSTRAINT "PayablePayment_fundId_fkey"
    FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PayablePayment" ADD CONSTRAINT "PayablePayment_costCenterId_fkey"
    FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PayablePayment" ADD CONSTRAINT "PayablePayment_paymentVoucherId_fkey"
    FOREIGN KEY ("paymentVoucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
