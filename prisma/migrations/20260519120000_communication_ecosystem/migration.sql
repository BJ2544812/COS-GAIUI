-- Communication ecosystem, outreach follow-ups, digests, backups

ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "memberId" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "visitCount" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "lastVisitAt" TIMESTAMP(3);
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "assignedUserId" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "isFirstVisit" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "Contact_tenantId_status_idx" ON "Contact"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "Contact_tenantId_lastVisitAt_idx" ON "Contact"("tenantId", "lastVisitAt");

ALTER TABLE "PrayerRequest" ADD COLUMN IF NOT EXISTS "urgency" "TaskPriority" NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "PrayerRequest" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'general';
ALTER TABLE "PrayerRequest" ADD COLUMN IF NOT EXISTS "assignedUserId" TEXT;
ALTER TABLE "PrayerRequest" ADD COLUMN IF NOT EXISTS "testimony" TEXT;

CREATE INDEX IF NOT EXISTS "PrayerRequest_tenantId_assignedUserId_status_idx" ON "PrayerRequest"("tenantId", "assignedUserId", "status");

CREATE TABLE IF NOT EXISTS "CommunicationCampaign" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channels" TEXT NOT NULL,
    "audienceFilter" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CommunicationCampaign_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommunicationDelivery" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipientKey" TEXT NOT NULL,
    "memberId" TEXT,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "openedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommunicationDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OutreachFollowUp" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT,
    "memberId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "assignedUserId" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OutreachFollowUp_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "OperationalDigest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "digestType" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationalDigest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "BackupRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "storageKey" TEXT,
    "sizeBytes" INTEGER,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "errorDetail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BackupRun_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CommunicationCampaign" ADD CONSTRAINT "CommunicationCampaign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunicationDelivery" ADD CONSTRAINT "CommunicationDelivery_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunicationDelivery" ADD CONSTRAINT "CommunicationDelivery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "CommunicationCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutreachFollowUp" ADD CONSTRAINT "OutreachFollowUp_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutreachFollowUp" ADD CONSTRAINT "OutreachFollowUp_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OperationalDigest" ADD CONSTRAINT "OperationalDigest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BackupRun" ADD CONSTRAINT "BackupRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "CommunicationCampaign_tenantId_status_idx" ON "CommunicationCampaign"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "CommunicationDelivery_tenantId_campaignId_channel_idx" ON "CommunicationDelivery"("tenantId", "campaignId", "channel");
CREATE INDEX IF NOT EXISTS "CommunicationDelivery_tenantId_status_idx" ON "CommunicationDelivery"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "OutreachFollowUp_tenantId_status_dueDate_idx" ON "OutreachFollowUp"("tenantId", "status", "dueDate");
CREATE INDEX IF NOT EXISTS "OutreachFollowUp_tenantId_assignedUserId_idx" ON "OutreachFollowUp"("tenantId", "assignedUserId");
CREATE INDEX IF NOT EXISTS "OperationalDigest_tenantId_digestType_generatedAt_idx" ON "OperationalDigest"("tenantId", "digestType", "generatedAt");
CREATE INDEX IF NOT EXISTS "BackupRun_tenantId_createdAt_idx" ON "BackupRun"("tenantId", "createdAt");
