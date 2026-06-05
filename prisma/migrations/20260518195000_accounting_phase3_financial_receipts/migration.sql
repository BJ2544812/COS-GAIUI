-- Phase 3: Financial Receipts + PDF Infrastructure

ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "receiptId" TEXT;
DO $$ BEGIN
  ALTER TABLE "Donation" ADD CONSTRAINT "Donation_receiptId_fkey"
    FOREIGN KEY ("receiptId") REFERENCES "FinancialReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN undefined_table THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "Donation_tenantId_receiptId_idx" ON "Donation"("tenantId", "receiptId");

CREATE TABLE IF NOT EXISTS "FinancialReceipt" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "receiptNo" TEXT NOT NULL,
  "donationId" TEXT NOT NULL,
  "voucherId" TEXT,
  "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "amount" DECIMAL(18,2) NOT NULL,
  "donorName" TEXT NOT NULL,
  "donorEmail" TEXT,
  "donorPhone" TEXT,
  "fundId" TEXT,
  "campaignId" TEXT,
  "eightyGEligible" BOOLEAN NOT NULL DEFAULT false,
  "pdfUrl" TEXT,
  "pdfChecksumSha256" TEXT,
  "regeneratedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FinancialReceipt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FinancialReceipt_donationId_key" ON "FinancialReceipt"("donationId");
CREATE UNIQUE INDEX IF NOT EXISTS "FinancialReceipt_tenantId_receiptNo_key" ON "FinancialReceipt"("tenantId", "receiptNo");
CREATE INDEX IF NOT EXISTS "FinancialReceipt_tenantId_issueDate_idx" ON "FinancialReceipt"("tenantId", "issueDate");
DO $$ BEGIN
  ALTER TABLE "FinancialReceipt" ADD CONSTRAINT "FinancialReceipt_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "FinancialReceipt" ADD CONSTRAINT "FinancialReceipt_donationId_fkey"
    FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "FinancialReceipt" ADD CONSTRAINT "FinancialReceipt_voucherId_fkey"
    FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "FinancialReceipt" ADD CONSTRAINT "FinancialReceipt_fundId_fkey"
    FOREIGN KEY ("fundId") REFERENCES "Fund"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "FinancialReceipt" ADD CONSTRAINT "FinancialReceipt_campaignId_fkey"
    FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Donation" ADD CONSTRAINT "Donation_receiptId_fkey"
    FOREIGN KEY ("receiptId") REFERENCES "FinancialReceipt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ReceiptFySequence" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "fyStartYear" INTEGER NOT NULL,
  "lastSeq" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReceiptFySequence_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ReceiptFySequence_tenantId_fyStartYear_key"
  ON "ReceiptFySequence"("tenantId", "fyStartYear");
DO $$ BEGIN
  ALTER TABLE "ReceiptFySequence" ADD CONSTRAINT "ReceiptFySequence_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
