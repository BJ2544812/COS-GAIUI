-- Gateway payment operations + settlement reconciliation

CREATE TABLE "ProcessedCashfreeEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT,
    "orderId" TEXT,
    "paymentId" TEXT,
    "signatureHash" TEXT,
    "donationId" TEXT,
    "voucherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcessedCashfreeEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProcessedCashfreeEvent_tenantId_eventId_key" ON "ProcessedCashfreeEvent"("tenantId", "eventId");
CREATE INDEX "ProcessedCashfreeEvent_tenantId_createdAt_idx" ON "ProcessedCashfreeEvent"("tenantId", "createdAt");
ALTER TABLE "ProcessedCashfreeEvent" ADD CONSTRAINT "ProcessedCashfreeEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GatewayPaymentOrder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "externalOrderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "donationAmount" DECIMAL(18,2) NOT NULL,
    "grossAmount" DECIMAL(18,2) NOT NULL,
    "gatewayFeeAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "donorCoveredFee" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "donorName" TEXT,
    "donorPhone" TEXT,
    "donorEmail" TEXT,
    "donorId" TEXT,
    "donationCategory" TEXT,
    "fundId" TEXT,
    "campaignId" TEXT,
    "eventId" TEXT,
    "serviceCollectionSessionId" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GatewayPaymentOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GatewayPaymentOrder_tenantId_gateway_externalOrderId_key" ON "GatewayPaymentOrder"("tenantId", "gateway", "externalOrderId");
CREATE INDEX "GatewayPaymentOrder_tenantId_status_idx" ON "GatewayPaymentOrder"("tenantId", "status");
ALTER TABLE "GatewayPaymentOrder" ADD CONSTRAINT "GatewayPaymentOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GatewaySettlement" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "externalSettlementId" TEXT NOT NULL,
    "settlementDate" TIMESTAMP(3) NOT NULL,
    "grossAmount" DECIMAL(18,2) NOT NULL,
    "feeAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(18,2) NOT NULL,
    "bankReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'imported',
    "settlementVoucherId" TEXT,
    "feeVoucherId" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reconciledAt" TIMESTAMP(3),
    "notes" TEXT,
    CONSTRAINT "GatewaySettlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GatewaySettlement_tenantId_gateway_externalSettlementId_key" ON "GatewaySettlement"("tenantId", "gateway", "externalSettlementId");
CREATE INDEX "GatewaySettlement_tenantId_settlementDate_idx" ON "GatewaySettlement"("tenantId", "settlementDate");
ALTER TABLE "GatewaySettlement" ADD CONSTRAINT "GatewaySettlement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "GatewaySettlementLine" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "donationId" TEXT,
    "externalPaymentId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "feeAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "matchStatus" TEXT NOT NULL DEFAULT 'unmatched',
    CONSTRAINT "GatewaySettlementLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GatewaySettlementLine_tenantId_settlementId_idx" ON "GatewaySettlementLine"("tenantId", "settlementId");
CREATE INDEX "GatewaySettlementLine_donationId_idx" ON "GatewaySettlementLine"("donationId");
ALTER TABLE "GatewaySettlementLine" ADD CONSTRAINT "GatewaySettlementLine_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES "GatewaySettlement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GatewaySettlementLine" ADD CONSTRAINT "GatewaySettlementLine_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ServiceCollectionSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ServiceCollectionSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ServiceCollectionSession_tenantId_serviceDate_idx" ON "ServiceCollectionSession"("tenantId", "serviceDate");
ALTER TABLE "ServiceCollectionSession" ADD CONSTRAINT "ServiceCollectionSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "eventId" TEXT;
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "feeVoucherId" TEXT;
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "settlementVoucherId" TEXT;
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "gatewayPaymentOrderId" TEXT;
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "gatewaySettlementId" TEXT;
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "serviceCollectionSessionId" TEXT;
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "grossAmount" DECIMAL(18,2);
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "netSettlementAmount" DECIMAL(18,2);
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "gatewayFeeAmount" DECIMAL(18,2);
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "donorCoveredFee" DECIMAL(18,2);
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "donationCategory" TEXT;
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "isAnonymous" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "gateway" TEXT;
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "gatewayOrderId" TEXT;
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "settlementStatus" TEXT NOT NULL DEFAULT 'n_a';
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "reconciliationState" TEXT NOT NULL DEFAULT 'unmatched';
ALTER TABLE "Donation" ADD COLUMN IF NOT EXISTS "notes" TEXT;

CREATE INDEX IF NOT EXISTS "Donation_tenantId_settlementStatus_idx" ON "Donation"("tenantId", "settlementStatus");
CREATE INDEX IF NOT EXISTS "Donation_tenantId_gatewaySettlementId_idx" ON "Donation"("tenantId", "gatewaySettlementId");
CREATE INDEX IF NOT EXISTS "Donation_tenantId_serviceCollectionSessionId_idx" ON "Donation"("tenantId", "serviceCollectionSessionId");

ALTER TABLE "Donation" ADD CONSTRAINT "Donation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_feeVoucherId_fkey" FOREIGN KEY ("feeVoucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_settlementVoucherId_fkey" FOREIGN KEY ("settlementVoucherId") REFERENCES "Voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_gatewayPaymentOrderId_fkey" FOREIGN KEY ("gatewayPaymentOrderId") REFERENCES "GatewayPaymentOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_gatewaySettlementId_fkey" FOREIGN KEY ("gatewaySettlementId") REFERENCES "GatewaySettlement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_serviceCollectionSessionId_fkey" FOREIGN KEY ("serviceCollectionSessionId") REFERENCES "ServiceCollectionSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
