-- Phase 7: Bank Reconciliation Engine

CREATE TABLE IF NOT EXISTS "BankReconciliationSession" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "fromDate" TIMESTAMP(3) NOT NULL,
  "toDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Open',
  "closedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BankReconciliationSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BankReconciliationSession_tenantId_accountId_fromDate_toDate_idx"
  ON "BankReconciliationSession"("tenantId", "accountId", "fromDate", "toDate");
DO $$ BEGIN
  ALTER TABLE "BankReconciliationSession" ADD CONSTRAINT "BankReconciliationSession_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "BankReconciliationSession" ADD CONSTRAINT "BankReconciliationSession_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "BankStatementLine" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "txnDate" TIMESTAMP(3) NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "direction" TEXT NOT NULL,
  "reference" TEXT,
  "description" TEXT,
  "isMatched" BOOLEAN NOT NULL DEFAULT false,
  "matchedVoucherId" TEXT,
  "matchedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BankStatementLine_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BankStatementLine_tenantId_sessionId_txnDate_idx"
  ON "BankStatementLine"("tenantId", "sessionId", "txnDate");
CREATE INDEX IF NOT EXISTS "BankStatementLine_tenantId_accountId_isMatched_idx"
  ON "BankStatementLine"("tenantId", "accountId", "isMatched");
DO $$ BEGIN
  ALTER TABLE "BankStatementLine" ADD CONSTRAINT "BankStatementLine_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "BankStatementLine" ADD CONSTRAINT "BankStatementLine_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "BankReconciliationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "BankStatementLine" ADD CONSTRAINT "BankStatementLine_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "BankStatementLine" ADD CONSTRAINT "BankStatementLine_matchedVoucherId_fkey"
    FOREIGN KEY ("matchedVoucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
