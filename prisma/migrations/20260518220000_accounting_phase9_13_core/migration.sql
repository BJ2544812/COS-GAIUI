-- Phases 9-13 core models: payroll, asset depreciation, approvals, exports, year close

-- Asset accounting enhancements
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "capitalizationVoucherId" TEXT;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "disposalVoucherId" TEXT;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "residualValue" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "usefulLifeMonths" INTEGER DEFAULT 60;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "depreciationMethod" TEXT DEFAULT 'SLM';
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "accumulatedDepreciation" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "lastDepreciationDate" TIMESTAMP(3);
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "disposedAt" TIMESTAMP(3);
DO $$ BEGIN
  ALTER TABLE "Asset" ADD CONSTRAINT "Asset_capitalizationVoucherId_fkey"
    FOREIGN KEY ("capitalizationVoucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Asset" ADD CONSTRAINT "Asset_disposalVoucherId_fkey"
    FOREIGN KEY ("disposalVoucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "AssetDepreciationEntry" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "periodDate" TIMESTAMP(3) NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "accumulatedAfter" DECIMAL(18,2) NOT NULL,
  "voucherId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AssetDepreciationEntry_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AssetDepreciationEntry_tenantId_assetId_periodDate_idx"
  ON "AssetDepreciationEntry"("tenantId", "assetId", "periodDate");
DO $$ BEGIN
  ALTER TABLE "AssetDepreciationEntry" ADD CONSTRAINT "AssetDepreciationEntry_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssetDepreciationEntry" ADD CONSTRAINT "AssetDepreciationEntry_assetId_fkey"
    FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "AssetDepreciationEntry" ADD CONSTRAINT "AssetDepreciationEntry_voucherId_fkey"
    FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Payroll
CREATE TABLE IF NOT EXISTS "PayrollRun" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "periodYear" INTEGER NOT NULL,
  "periodMonth" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Draft',
  "totalGross" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "totalDeductions" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "totalNet" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "payableVoucherId" TEXT,
  "paymentVoucherId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PayrollRun_tenantId_periodYear_periodMonth_key"
  ON "PayrollRun"("tenantId", "periodYear", "periodMonth");
CREATE INDEX IF NOT EXISTS "PayrollRun_tenantId_status_idx" ON "PayrollRun"("tenantId", "status");
DO $$ BEGIN
  ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_payableVoucherId_fkey"
    FOREIGN KEY ("payableVoucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PayrollRun" ADD CONSTRAINT "PayrollRun_paymentVoucherId_fkey"
    FOREIGN KEY ("paymentVoucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "PayrollLine" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "grossAmount" DECIMAL(18,2) NOT NULL,
  "deductionAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
  "netAmount" DECIMAL(18,2) NOT NULL,
  "salaryExpenseAccountId" TEXT NOT NULL,
  "payrollPayableAccountId" TEXT NOT NULL,
  "payslipNo" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PayrollLine_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PayrollLine_tenantId_runId_idx" ON "PayrollLine"("tenantId", "runId");
CREATE INDEX IF NOT EXISTS "PayrollLine_tenantId_memberId_idx" ON "PayrollLine"("tenantId", "memberId");
DO $$ BEGIN
  ALTER TABLE "PayrollLine" ADD CONSTRAINT "PayrollLine_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PayrollLine" ADD CONSTRAINT "PayrollLine_runId_fkey"
    FOREIGN KEY ("runId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PayrollLine" ADD CONSTRAINT "PayrollLine_memberId_fkey"
    FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Approval workflow
CREATE TABLE IF NOT EXISTS "ApprovalRule" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "minAmount" DECIMAL(18,2),
  "moduleKey" TEXT,
  "approverRoleId" TEXT,
  "level" INTEGER NOT NULL DEFAULT 1,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApprovalRule_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ApprovalRule_tenantId_entityType_isActive_idx"
  ON "ApprovalRule"("tenantId", "entityType", "isActive");
DO $$ BEGIN
  ALTER TABLE "ApprovalRule" ADD CONSTRAINT "ApprovalRule_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ApprovalRequest" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "requestedByUserId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Pending',
  "currentLevel" INTEGER NOT NULL DEFAULT 1,
  "minRequiredLevel" INTEGER NOT NULL DEFAULT 1,
  "amount" DECIMAL(18,2),
  "moduleKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ApprovalRequest_tenantId_entityType_entityId_idx"
  ON "ApprovalRequest"("tenantId", "entityType", "entityId");
CREATE INDEX IF NOT EXISTS "ApprovalRequest_tenantId_status_currentLevel_idx"
  ON "ApprovalRequest"("tenantId", "status", "currentLevel");
DO $$ BEGIN
  ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ApprovalDecision" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "approvalRequestId" TEXT NOT NULL,
  "level" INTEGER NOT NULL,
  "decision" TEXT NOT NULL,
  "actorUserId" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApprovalDecision_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ApprovalDecision_tenantId_approvalRequestId_level_idx"
  ON "ApprovalDecision"("tenantId", "approvalRequestId", "level");
DO $$ BEGIN
  ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_approvalRequestId_fkey"
    FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Exports + year close
CREATE TABLE IF NOT EXISTS "ExportLog" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "exportType" TEXT NOT NULL,
  "filtersJson" JSONB,
  "rowCount" INTEGER,
  "checksumSha256" TEXT,
  "generatedByUserId" TEXT,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sourceEntityType" TEXT,
  "sourceEntityId" TEXT,
  CONSTRAINT "ExportLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ExportLog_tenantId_exportType_generatedAt_idx"
  ON "ExportLog"("tenantId", "exportType", "generatedAt");
DO $$ BEGIN
  ALTER TABLE "ExportLog" ADD CONSTRAINT "ExportLog_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "YearCloseRun" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "financialYearId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Completed',
  "closingVoucherId" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "YearCloseRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "YearCloseRun_tenantId_financialYearId_createdAt_idx"
  ON "YearCloseRun"("tenantId", "financialYearId", "createdAt");
DO $$ BEGIN
  ALTER TABLE "YearCloseRun" ADD CONSTRAINT "YearCloseRun_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "YearCloseRun" ADD CONSTRAINT "YearCloseRun_financialYearId_fkey"
    FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "YearCloseRun" ADD CONSTRAINT "YearCloseRun_closingVoucherId_fkey"
    FOREIGN KEY ("closingVoucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
