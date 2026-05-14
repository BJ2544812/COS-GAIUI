-- Audit who approved and posted vouchers; FKs to User (SET NULL on delete).
ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "approvedByUserId" TEXT;
ALTER TABLE "Voucher" ADD COLUMN IF NOT EXISTS "postedByUserId" TEXT;

DO $$ BEGIN
  ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_approvedByUserId_fkey"
    FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_postedByUserId_fkey"
    FOREIGN KEY ("postedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
