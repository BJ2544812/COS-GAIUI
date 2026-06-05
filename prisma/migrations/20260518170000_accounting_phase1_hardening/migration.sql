-- Phase 1: Ledger & Voucher Hardening

-- Voucher source architecture enrichment
ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "sourceType" TEXT;
ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "sourceId" TEXT;
ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "sourceMetadata" JSONB;
CREATE INDEX IF NOT EXISTS "Voucher_tenantId_sourceType_sourceId_idx"
  ON "Voucher"("tenantId", "sourceType", "sourceId");

-- Voucher attachments (immutable references)
CREATE TABLE IF NOT EXISTS "VoucherAttachment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "voucherId" TEXT NOT NULL,
  "documentId" TEXT,
  "fileUrl" TEXT,
  "title" TEXT,
  "mimeType" TEXT,
  "checksumSha256" TEXT,
  "sizeBytes" INTEGER,
  "notes" TEXT,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VoucherAttachment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "VoucherAttachment_tenantId_voucherId_createdAt_idx"
  ON "VoucherAttachment"("tenantId", "voucherId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "VoucherAttachment" ADD CONSTRAINT "VoucherAttachment_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "VoucherAttachment" ADD CONSTRAINT "VoucherAttachment_voucherId_fkey"
    FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "VoucherAttachment" ADD CONSTRAINT "VoucherAttachment_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Financial audit trail (append-only)
CREATE TABLE IF NOT EXISTS "FinancialAuditLog" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "beforeJson" JSONB,
  "afterJson" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FinancialAuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "FinancialAuditLog_tenantId_createdAt_idx"
  ON "FinancialAuditLog"("tenantId", "createdAt");
CREATE INDEX IF NOT EXISTS "FinancialAuditLog_tenantId_entityType_entityId_idx"
  ON "FinancialAuditLog"("tenantId", "entityType", "entityId");
CREATE INDEX IF NOT EXISTS "FinancialAuditLog_tenantId_action_idx"
  ON "FinancialAuditLog"("tenantId", "action");
DO $$ BEGIN
  ALTER TABLE "FinancialAuditLog" ADD CONSTRAINT "FinancialAuditLog_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
