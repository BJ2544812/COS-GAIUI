-- Identity / declaration workflow foundation on member documents
ALTER TABLE "MemberDocument" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3);
ALTER TABLE "MemberDocument" ADD COLUMN IF NOT EXISTS "signerName" TEXT;
ALTER TABLE "MemberDocument" ADD COLUMN IF NOT EXISTS "signatureDataUrl" TEXT;
