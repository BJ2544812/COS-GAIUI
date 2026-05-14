-- Money: DECIMAL(18,2) for accounting and donations
ALTER TABLE "Account" ALTER COLUMN "balance" TYPE DECIMAL(18,2);
ALTER TABLE "Voucher" ALTER COLUMN "amount" TYPE DECIMAL(18,2);
ALTER TABLE "JournalEntry" ALTER COLUMN "debit" TYPE DECIMAL(18,2);
ALTER TABLE "JournalEntry" ALTER COLUMN "credit" TYPE DECIMAL(18,2);
ALTER TABLE "Donation" ALTER COLUMN "amount" TYPE DECIMAL(18,2);

-- Idempotency (gateway payment_id, etc.)
CREATE TABLE IF NOT EXISTS "IdempotencyKey" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "resultRefId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "IdempotencyKey_tenantId_key_operation_key" ON "IdempotencyKey"("tenantId", "key", "operation");

DO $$ BEGIN
  ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS "IdempotencyKey_tenantId_createdAt_idx" ON "IdempotencyKey"("tenantId", "createdAt");

-- New permissions (moduleKey is the permission key used by requirePermission)
INSERT INTO "Permission" ("id", "name", "moduleKey", "description")
SELECT gen_random_uuid()::text, 'approve_voucher', 'approve_voucher', 'Approve vouchers for posting'
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "moduleKey" = 'approve_voucher');

INSERT INTO "Permission" ("id", "name", "moduleKey", "description")
SELECT gen_random_uuid()::text, 'post_voucher', 'post_voucher', 'Post approved vouchers to ledger'
WHERE NOT EXISTS (SELECT 1 FROM "Permission" WHERE "moduleKey" = 'post_voucher');

-- Grant to any role that already has manage_finance (preserve access)
INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT rp."roleId", p."id"
FROM "RolePermission" rp
INNER JOIN "Permission" pf ON pf."id" = rp."permissionId" AND pf."moduleKey" = 'manage_finance'
CROSS JOIN "Permission" p
WHERE p."moduleKey" IN ('approve_voucher', 'post_voucher')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
