--
-- PostgreSQL database dump
--

\restrict Etk7NjNJQfwW7wfFav1pRfsbJfNzrJhUUbc3zOGMPNDkWNVdiv3ENsaRpG4Ya8M

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: CareCaseStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CareCaseStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'CLOSED'
);


--
-- Name: ConfidentialityLevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ConfidentialityLevel" AS ENUM (
    'PUBLIC',
    'GROUP',
    'PASTORAL',
    'SENIOR_PASTORAL',
    'RESTRICTED'
);


--
-- Name: SmallGroupRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SmallGroupRole" AS ENUM (
    'LEADER',
    'HOST',
    'PARTICIPANT'
);


--
-- Name: TaskPriority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


--
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


--
-- Name: TaskTargetType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TaskTargetType" AS ENUM (
    'MEMBER',
    'CARE_CASE',
    'SMALL_GROUP',
    'PRAYER_REQUEST',
    'EVENT'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    "parentId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    balance numeric(18,2) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AnalyticsEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AnalyticsEvent" (
    id text NOT NULL,
    "eventId" text NOT NULL,
    "tenantId" text NOT NULL,
    type text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    payload jsonb NOT NULL
);


--
-- Name: ApprovalDecision; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ApprovalDecision" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "approvalRequestId" text NOT NULL,
    level integer NOT NULL,
    decision text NOT NULL,
    "actorUserId" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ApprovalRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ApprovalRequest" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "requestedByUserId" text,
    status text DEFAULT 'Pending'::text NOT NULL,
    "currentLevel" integer DEFAULT 1 NOT NULL,
    "minRequiredLevel" integer DEFAULT 1 NOT NULL,
    amount numeric(18,2),
    "moduleKey" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ApprovalRule; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ApprovalRule" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "entityType" text NOT NULL,
    "minAmount" numeric(18,2),
    "moduleKey" text,
    "approverRoleId" text,
    level integer DEFAULT 1 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Asset; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Asset" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    category text,
    "serialNumber" text,
    location text,
    value double precision NOT NULL,
    "purchaseDate" timestamp(3) without time zone,
    status text DEFAULT 'Active'::text NOT NULL,
    condition text,
    "imageUrl" text,
    notes text,
    "assignedToId" text,
    "capitalizationVoucherId" text,
    "disposalVoucherId" text,
    "residualValue" double precision DEFAULT 0,
    "usefulLifeMonths" integer DEFAULT 60,
    "depreciationMethod" text DEFAULT 'SLM'::text,
    "accumulatedDepreciation" double precision DEFAULT 0 NOT NULL,
    "lastDepreciationDate" timestamp(3) without time zone,
    "disposedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AssetDepreciationEntry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AssetDepreciationEntry" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "assetId" text NOT NULL,
    "periodDate" timestamp(3) without time zone NOT NULL,
    amount numeric(18,2) NOT NULL,
    "accumulatedAfter" numeric(18,2) NOT NULL,
    "voucherId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AssetMaintenanceLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AssetMaintenanceLog" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "assetId" text NOT NULL,
    "serviceType" text NOT NULL,
    description text NOT NULL,
    "scheduledAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    cost double precision,
    technician text,
    status text DEFAULT 'Scheduled'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Attendance" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "sessionId" text NOT NULL,
    "memberId" text,
    "visitorName" text,
    "visitorPhone" text,
    status text DEFAULT 'PRESENT'::text NOT NULL,
    "checkInTime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    method text DEFAULT 'MANUAL'::text NOT NULL,
    notes text
);


--
-- Name: AttendanceSession; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AttendanceSession" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "startTime" timestamp(3) without time zone,
    "endTime" timestamp(3) without time zone,
    status text DEFAULT 'OPEN'::text NOT NULL,
    type text DEFAULT 'SERVICE'::text NOT NULL,
    "campusId" text,
    "eventId" text
);


--
-- Name: BackupRun; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BackupRun" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    status text NOT NULL,
    "storageKey" text,
    "sizeBytes" integer,
    verified boolean DEFAULT false NOT NULL,
    "errorDetail" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: BankReconciliationSession; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BankReconciliationSession" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "accountId" text NOT NULL,
    "fromDate" timestamp(3) without time zone NOT NULL,
    "toDate" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'Open'::text NOT NULL,
    "closedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: BankStatementLine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BankStatementLine" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "sessionId" text NOT NULL,
    "accountId" text NOT NULL,
    "txnDate" timestamp(3) without time zone NOT NULL,
    amount numeric(18,2) NOT NULL,
    direction text NOT NULL,
    reference text,
    description text,
    "isMatched" boolean DEFAULT false NOT NULL,
    "matchedVoucherId" text,
    "matchedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Budget; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Budget" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "financialYearId" text NOT NULL,
    "fundId" text,
    "costCenterId" text,
    amount numeric(18,2) NOT NULL,
    "trackingMode" text DEFAULT 'SOFT'::text NOT NULL
);


--
-- Name: Campaign; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Campaign" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    goal double precision,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "defaultFundId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Campus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Campus" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    type text,
    leader text,
    address text,
    "upiId" text,
    "bankInfo" text,
    departments text[] DEFAULT ARRAY[]::text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CareCase; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CareCase" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    "assignedUserId" text,
    category text NOT NULL,
    urgency public."TaskPriority" DEFAULT 'MEDIUM'::public."TaskPriority" NOT NULL,
    "confidentialityLevel" public."ConfidentialityLevel" DEFAULT 'PASTORAL'::public."ConfidentialityLevel" NOT NULL,
    status public."CareCaseStatus" DEFAULT 'OPEN'::public."CareCaseStatus" NOT NULL,
    "createdById" text,
    "updatedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CareLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CareLog" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "careCaseId" text NOT NULL,
    "authorId" text NOT NULL,
    "interactionType" text NOT NULL,
    content text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: CareNote; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CareNote" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    "authorId" text NOT NULL,
    note text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CommunicationCampaign; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CommunicationCampaign" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    channels text NOT NULL,
    "audienceFilter" text NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    "scheduledAt" timestamp(3) without time zone,
    "sentAt" timestamp(3) without time zone,
    "createdById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CommunicationDelivery; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CommunicationDelivery" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "campaignId" text NOT NULL,
    channel text NOT NULL,
    "recipientKey" text NOT NULL,
    "memberId" text,
    "userId" text,
    status text DEFAULT 'pending'::text NOT NULL,
    "openedAt" timestamp(3) without time zone,
    "deliveredAt" timestamp(3) without time zone,
    "errorMessage" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: CommunicationLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CommunicationLog" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    type text NOT NULL,
    recipient text NOT NULL,
    subject text,
    content text NOT NULL,
    status text DEFAULT 'Sent'::text NOT NULL,
    "sentAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Contact; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Contact" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    status text DEFAULT 'New'::text NOT NULL,
    source text,
    "memberId" text,
    "visitCount" integer DEFAULT 1 NOT NULL,
    "lastVisitAt" timestamp(3) without time zone,
    "assignedUserId" text,
    "isFirstVisit" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: CostCenter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CostCenter" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Document; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Document" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    title text NOT NULL,
    category text,
    url text NOT NULL,
    "uploadedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Donation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Donation" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "donorId" text,
    "campaignId" text,
    "fundId" text,
    "eventId" text,
    "voucherId" text,
    "reversalVoucherId" text,
    "feeVoucherId" text,
    "settlementVoucherId" text,
    "gatewayPaymentOrderId" text,
    "gatewaySettlementId" text,
    "serviceCollectionSessionId" text,
    amount numeric(18,2) NOT NULL,
    "grossAmount" numeric(18,2),
    "netSettlementAmount" numeric(18,2),
    "gatewayFeeAmount" numeric(18,2),
    "donorCoveredFee" numeric(18,2),
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    method text NOT NULL,
    reference text,
    "donationCategory" text,
    "isAnonymous" boolean DEFAULT false NOT NULL,
    source text,
    "sourceRefId" text,
    gateway text,
    "gatewayOrderId" text,
    "gatewayPaymentId" text,
    "settlementStatus" text DEFAULT 'n_a'::text NOT NULL,
    "reconciliationState" text DEFAULT 'unmatched'::text NOT NULL,
    notes text,
    status text DEFAULT 'Recorded'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: EmploymentProfile; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EmploymentProfile" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp(3) without time zone,
    status text DEFAULT 'Active'::text NOT NULL,
    "jobTitle" text,
    "emergencyContact" jsonb,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Event; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Event" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "campusId" text,
    name text NOT NULL,
    type text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    "registrationOpen" boolean DEFAULT false NOT NULL,
    location text,
    "internalNotes" text,
    "recurringRule" text,
    "runSheet" jsonb,
    "opsConfig" jsonb,
    "cancelledAt" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    "archivedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: EventLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EventLog" (
    id text NOT NULL,
    "eventName" text NOT NULL,
    "tenantId" text NOT NULL,
    "entityId" text NOT NULL,
    "entityType" text NOT NULL,
    payload jsonb NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "occurredAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "processedAt" timestamp(3) without time zone,
    status text DEFAULT 'PENDING'::text NOT NULL,
    error text
);


--
-- Name: ExportLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ExportLog" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "exportType" text NOT NULL,
    "filtersJson" jsonb,
    "rowCount" integer,
    "checksumSha256" text,
    "generatedByUserId" text,
    "generatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "sourceEntityType" text,
    "sourceEntityId" text
);


--
-- Name: Family; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Family" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    "imageUrl" text,
    "addressLine1" text,
    "addressLine2" text,
    city text,
    "stateRegion" text,
    "postalCode" text,
    country text DEFAULT 'India'::text,
    latitude double precision,
    longitude double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: FinancialAuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FinancialAuditLog" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    action text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    "actorUserId" text,
    "beforeJson" jsonb,
    "afterJson" jsonb,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: FinancialPeriod; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FinancialPeriod" (
    id text NOT NULL,
    "financialYearId" text NOT NULL,
    name text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "isOpen" boolean DEFAULT false NOT NULL,
    "isLocked" boolean DEFAULT false NOT NULL
);


--
-- Name: FinancialReceipt; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FinancialReceipt" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "receiptNo" text NOT NULL,
    "donationId" text NOT NULL,
    "voucherId" text,
    "issueDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    amount numeric(18,2) NOT NULL,
    "donorName" text NOT NULL,
    "donorEmail" text,
    "donorPhone" text,
    "fundId" text,
    "campaignId" text,
    "eightyGEligible" boolean DEFAULT false NOT NULL,
    "pdfUrl" text,
    "pdfChecksumSha256" text,
    "regeneratedCount" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: FinancialYear; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FinancialYear" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    "isClosed" boolean DEFAULT false NOT NULL
);


--
-- Name: Fund; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Fund" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: GatewayPaymentOrder; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GatewayPaymentOrder" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    gateway text NOT NULL,
    "externalOrderId" text NOT NULL,
    status text DEFAULT 'created'::text NOT NULL,
    "donationAmount" numeric(18,2) NOT NULL,
    "grossAmount" numeric(18,2) NOT NULL,
    "gatewayFeeAmount" numeric(18,2) DEFAULT 0 NOT NULL,
    "donorCoveredFee" boolean DEFAULT false NOT NULL,
    currency text DEFAULT 'INR'::text NOT NULL,
    "donorName" text,
    "donorPhone" text,
    "donorEmail" text,
    "donorId" text,
    "donationCategory" text,
    "fundId" text,
    "campaignId" text,
    "eventId" text,
    "serviceCollectionSessionId" text,
    "isAnonymous" boolean DEFAULT false NOT NULL,
    "metadataJson" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: GatewaySettlement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GatewaySettlement" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    gateway text NOT NULL,
    "externalSettlementId" text NOT NULL,
    "settlementDate" timestamp(3) without time zone NOT NULL,
    "grossAmount" numeric(18,2) NOT NULL,
    "feeAmount" numeric(18,2) DEFAULT 0 NOT NULL,
    "netAmount" numeric(18,2) NOT NULL,
    "bankReference" text,
    status text DEFAULT 'imported'::text NOT NULL,
    "settlementVoucherId" text,
    "feeVoucherId" text,
    "importedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "reconciledAt" timestamp(3) without time zone,
    notes text
);


--
-- Name: GatewaySettlementLine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GatewaySettlementLine" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "settlementId" text NOT NULL,
    "donationId" text,
    "externalPaymentId" text,
    amount numeric(18,2) NOT NULL,
    "feeAmount" numeric(18,2) DEFAULT 0 NOT NULL,
    "matchStatus" text DEFAULT 'unmatched'::text NOT NULL
);


--
-- Name: IdempotencyKey; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."IdempotencyKey" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    key text NOT NULL,
    operation text NOT NULL,
    "resultRefId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: JournalEntry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."JournalEntry" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "voucherId" text NOT NULL,
    "accountId" text NOT NULL,
    debit numeric(18,2) DEFAULT 0 NOT NULL,
    credit numeric(18,2) DEFAULT 0 NOT NULL,
    narration text,
    "fundId" text,
    "costCenterId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: LeaveBalance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LeaveBalance" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    "leaveType" text NOT NULL,
    year integer NOT NULL,
    allocated integer DEFAULT 0 NOT NULL,
    used integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LeaveRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LeaveRequest" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    "leaveType" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    reason text,
    status text DEFAULT 'Pending'::text NOT NULL,
    "approvedByUserId" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "conflictSnapshot" jsonb
);


--
-- Name: Member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Member" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "familyId" text,
    name text NOT NULL,
    email text,
    phone text,
    role text,
    dob timestamp(3) without time zone,
    "profileImageUrl" text,
    "membershipDate" timestamp(3) without time zone,
    status text DEFAULT 'Active'::text NOT NULL,
    "growthStage" text DEFAULT 'Visitor'::text NOT NULL,
    "workforceClass" text,
    "employmentType" text,
    department text,
    gender text,
    aadhaar text,
    pan text,
    "addressLine1" text,
    "addressLine2" text,
    city text,
    "stateRegion" text,
    "postalCode" text,
    country text DEFAULT 'India'::text,
    latitude double precision,
    longitude double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "reportingManagerId" text
);


--
-- Name: MemberDocument; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MemberDocument" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    type text NOT NULL,
    number text,
    "fileUrl" text,
    verified boolean DEFAULT false NOT NULL,
    notes text,
    "acceptedAt" timestamp(3) without time zone,
    "signerName" text,
    "signatureDataUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: MemberEngagementSnapshot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MemberEngagementSnapshot" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    score double precision NOT NULL,
    "attendanceMetric" double precision,
    "givingMetric" double precision,
    "calculatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: MemberPathwayProgress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MemberPathwayProgress" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    "pathwayId" text NOT NULL,
    "currentStepId" text,
    "assignedMentorId" text,
    status text DEFAULT 'InProgress'::text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: MemberResponsibility; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."MemberResponsibility" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    role text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text,
    status text DEFAULT 'Active'::text NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp(3) without time zone,
    "allocatedFunds" double precision,
    "usedFunds" double precision,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Mentorship; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Mentorship" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "mentorId" text NOT NULL,
    "discipleId" text NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp(3) without time zone,
    status text DEFAULT 'Active'::text NOT NULL,
    notes text
);


--
-- Name: Ministry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Ministry" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "campusId" text,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Notification; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "userId" text,
    "targetRole" text,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'unread'::text NOT NULL,
    priority text DEFAULT 'MEDIUM'::text NOT NULL,
    "actionType" text,
    "actionLink" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "readAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone
);


--
-- Name: OnboardingTask; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OnboardingTask" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    "taskName" text NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "isCompleted" boolean DEFAULT false NOT NULL,
    "completedAt" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: OperationalDigest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OperationalDigest" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "digestType" text NOT NULL,
    payload text NOT NULL,
    "generatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: OutreachFollowUp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OutreachFollowUp" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "contactId" text,
    "memberId" text,
    type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "assignedUserId" text,
    "dueDate" timestamp(3) without time zone,
    "completedAt" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PageData; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PageData" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    "isPublished" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Pathway; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Pathway" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PathwayStep; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PathwayStep" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "pathwayId" text NOT NULL,
    name text NOT NULL,
    sequence integer NOT NULL
);


--
-- Name: PayableBill; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PayableBill" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "vendorId" text NOT NULL,
    "billNo" text NOT NULL,
    "billDate" timestamp(3) without time zone NOT NULL,
    "dueDate" timestamp(3) without time zone,
    amount numeric(18,2) NOT NULL,
    outstanding numeric(18,2) NOT NULL,
    "expenseAccountId" text NOT NULL,
    "payableAccountId" text NOT NULL,
    "fundId" text,
    "costCenterId" text,
    status text DEFAULT 'Pending'::text NOT NULL,
    description text,
    "sourceType" text,
    "sourceId" text,
    "sourceMetadata" jsonb,
    "billVoucherId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PayablePayment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PayablePayment" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "vendorId" text NOT NULL,
    "billId" text NOT NULL,
    "paymentDate" timestamp(3) without time zone NOT NULL,
    amount numeric(18,2) NOT NULL,
    "paymentAccountId" text NOT NULL,
    "payableAccountId" text NOT NULL,
    "fundId" text,
    "costCenterId" text,
    notes text,
    "sourceType" text,
    "sourceId" text,
    "paymentVoucherId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PayrollLine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PayrollLine" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "runId" text NOT NULL,
    "memberId" text NOT NULL,
    "grossAmount" numeric(18,2) NOT NULL,
    "deductionAmount" numeric(18,2) DEFAULT 0 NOT NULL,
    "netAmount" numeric(18,2) NOT NULL,
    "salaryExpenseAccountId" text NOT NULL,
    "payrollPayableAccountId" text NOT NULL,
    "payslipNo" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PayrollRun; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PayrollRun" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "periodYear" integer NOT NULL,
    "periodMonth" integer NOT NULL,
    status text DEFAULT 'Draft'::text NOT NULL,
    "totalGross" numeric(18,2) DEFAULT 0 NOT NULL,
    "totalDeductions" numeric(18,2) DEFAULT 0 NOT NULL,
    "totalNet" numeric(18,2) DEFAULT 0 NOT NULL,
    "payableVoucherId" text,
    "paymentVoucherId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PayrollStructure; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PayrollStructure" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    "baseSalary" numeric(18,2) NOT NULL,
    allowances numeric(18,2) DEFAULT 0 NOT NULL,
    deductions numeric(18,2) DEFAULT 0 NOT NULL,
    "salaryExpenseAccountId" text NOT NULL,
    "payrollPayableAccountId" text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PerformanceReview; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PerformanceReview" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "revieweeId" text NOT NULL,
    "reviewerId" text NOT NULL,
    "reviewDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    rating integer,
    feedback text,
    goals text,
    status text DEFAULT 'Draft'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Permission" (
    id text NOT NULL,
    name text NOT NULL,
    "moduleKey" text NOT NULL,
    description text
);


--
-- Name: PrayerRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PrayerRequest" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "requesterId" text,
    content text NOT NULL,
    visibility public."ConfidentialityLevel" DEFAULT 'PUBLIC'::public."ConfidentialityLevel" NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    urgency public."TaskPriority" DEFAULT 'MEDIUM'::public."TaskPriority" NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    "assignedUserId" text,
    testimony text,
    "createdById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ProcessedCashfreeEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProcessedCashfreeEvent" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "eventId" text NOT NULL,
    "eventType" text,
    "orderId" text,
    "paymentId" text,
    "signatureHash" text,
    "donationId" text,
    "voucherId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ProcessedRazorpayEvent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProcessedRazorpayEvent" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "eventId" text NOT NULL,
    "paymentId" text,
    "signatureHash" text,
    "donationId" text,
    "voucherId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ReceiptFySequence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ReceiptFySequence" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "fyStartYear" integer NOT NULL,
    "lastSeq" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: RecruitmentPipeline; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RecruitmentPipeline" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "candidateName" text NOT NULL,
    email text NOT NULL,
    phone text,
    "appliedRole" text NOT NULL,
    stage text DEFAULT 'Applied'::text NOT NULL,
    "resumeUrl" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Region; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Region" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "campusId" text,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ReimbursementRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ReimbursementRequest" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    amount numeric(18,2) NOT NULL,
    category text NOT NULL,
    description text,
    status text DEFAULT 'Pending'::text NOT NULL,
    "receiptUrl" text,
    "voucherId" text,
    "approvedByUserId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Role" (
    id text NOT NULL,
    "tenantId" text,
    name text NOT NULL,
    description text,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: RolePermission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RolePermission" (
    "roleId" text NOT NULL,
    "permissionId" text NOT NULL
);


--
-- Name: Sermon; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Sermon" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    title text NOT NULL,
    speaker text,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "videoUrl" text,
    "audioUrl" text,
    description text,
    thumbnail text,
    scripture text,
    "isPublished" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ServiceCollectionSession; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ServiceCollectionSession" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    "serviceDate" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Setting; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Setting" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    key text NOT NULL,
    value text NOT NULL
);


--
-- Name: SmallGroup; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SmallGroup" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "zoneId" text,
    name text NOT NULL,
    type text NOT NULL,
    "meetingDay" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SmallGroupMember; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SmallGroupMember" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "groupId" text NOT NULL,
    "memberId" text NOT NULL,
    role public."SmallGroupRole" DEFAULT 'PARTICIPANT'::public."SmallGroupRole" NOT NULL,
    "joinedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: SpiritualMilestone; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SpiritualMilestone" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    type text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: StaffDocument; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StaffDocument" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    "fileUrl" text NOT NULL,
    "uploadedBy" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Task; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Task" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    title text NOT NULL,
    description text,
    "assignedUserId" text,
    "assignedMemberId" text,
    "targetType" public."TaskTargetType" NOT NULL,
    "targetId" text NOT NULL,
    "dueDate" timestamp(3) without time zone,
    status public."TaskStatus" DEFAULT 'PENDING'::public."TaskStatus" NOT NULL,
    priority public."TaskPriority" DEFAULT 'MEDIUM'::public."TaskPriority" NOT NULL,
    "createdById" text,
    "updatedById" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Tenant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Tenant" (
    id text NOT NULL,
    name text NOT NULL,
    domain text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TrainingRecord; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TrainingRecord" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "memberId" text NOT NULL,
    "courseName" text NOT NULL,
    provider text,
    "completionDate" timestamp(3) without time zone,
    "certificationNo" text,
    status text DEFAULT 'Completed'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    "roleId" text NOT NULL,
    status text DEFAULT 'Active'::text NOT NULL,
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "memberId" text
);


--
-- Name: Vendor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Vendor" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    category text,
    "contactName" text,
    email text,
    phone text,
    gstin text,
    pan text,
    address text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Voucher; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Voucher" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "voucherNo" text NOT NULL,
    type text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    amount numeric(18,2) NOT NULL,
    description text,
    status text DEFAULT 'draft'::text NOT NULL,
    "postedAt" timestamp(3) without time zone,
    "reversesVoucherId" text,
    "approvedByUserId" text,
    "postedByUserId" text,
    source text,
    "sourceRefId" text,
    "sourceType" text,
    "sourceId" text,
    "sourceMetadata" jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: VoucherAttachment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VoucherAttachment" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "voucherId" text NOT NULL,
    "documentId" text,
    "fileUrl" text,
    title text,
    "mimeType" text,
    "checksumSha256" text,
    "sizeBytes" integer,
    notes text,
    "createdByUserId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: VoucherFySequence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VoucherFySequence" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "fyStartYear" integer NOT NULL,
    "voucherType" text DEFAULT 'Journal'::text NOT NULL,
    "lastSeq" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: YearCloseRun; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."YearCloseRun" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "financialYearId" text NOT NULL,
    status text DEFAULT 'Completed'::text NOT NULL,
    "closingVoucherId" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Zone; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Zone" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "regionId" text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Account" (id, "tenantId", code, name, type, "parentId", "isActive", balance, "createdAt", "updatedAt") FROM stdin;
6fccd041-38c4-447e-be95-691ce907d96e	default-tenant-id	4010	Tithes	Revenue	\N	t	1009449.00	2026-05-20 06:49:36.993	2026-05-20 12:20:41.905
5bb34254-2f64-4d93-be2a-fb888ec912c3	default-tenant-id	4020	Offerings	Revenue	\N	t	17150.00	2026-05-20 06:49:36.996	2026-05-20 06:49:39.485
b88bdacf-1d54-4f96-914e-ef86660a6440	default-tenant-id	4030	Building Fund	Revenue	\N	t	9500.00	2026-05-20 06:49:36.998	2026-05-20 06:49:39.535
1510846b-12fa-441c-b42b-e2c44bcce5a0	default-tenant-id	1010	Cash Account	Asset	\N	t	26205.00	2026-05-20 06:49:36.984	2026-05-20 06:49:39.575
0f31d1e3-6ac7-4aa7-8bea-6e2c44b56bb6	default-tenant-id	4040	Missions	Revenue	\N	t	9055.00	2026-05-20 06:49:37.001	2026-05-20 06:49:39.577
f5655eaa-67ac-4fa8-a908-690e0cd4af66	default-tenant-id	1000	Bank Account	Asset	\N	t	1018949.00	2026-05-20 06:49:36.988	2026-05-20 12:20:41.901
\.


--
-- Data for Name: AnalyticsEvent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AnalyticsEvent" (id, "eventId", "tenantId", type, "timestamp", payload) FROM stdin;
e42e0e6c-c9e3-4f00-b33e-bcb51dfaa2eb	826db6a5-7519-4a4a-aeab-b30c152c7d4e	default-tenant-id	VoucherApproved	2026-05-20 06:49:37.863	{"type": "Receipt", "amount": 14180}
2a16c267-5a99-4804-affd-eb601891fd14	f40c7763-a1e0-4894-94c2-9b1d2b14877c	default-tenant-id	TransactionPosted	2026-05-20 06:49:37.909	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00001"}
112347c1-21f6-4a27-b568-3b2fb46ffa94	69974804-3b56-4f64-9056-e0fe2f46d31a	default-tenant-id	VoucherApproved	2026-05-20 06:49:37.991	{"type": "Receipt", "amount": 205}
3e893b48-bdd9-4e3a-bfeb-fae6c2842670	864c4124-f62c-4242-a51e-ffba90cb5e58	default-tenant-id	TransactionPosted	2026-05-20 06:49:38.019	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00002"}
b16b2679-08f0-4de7-9691-6826c3d586c9	f1fbf151-f652-4022-951a-8af8c3727178	default-tenant-id	VoucherApproved	2026-05-20 06:49:38.115	{"type": "Receipt", "amount": 300}
2c9a6968-3c1d-43e0-9e6c-8b8d81ed35be	a6442d0f-45d0-4f54-a15a-bc93c3bb5be3	default-tenant-id	TransactionPosted	2026-05-20 06:49:38.139	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00003"}
553d1f08-f0e2-4e12-85ee-cf3c82553732	a9fd1648-965d-4094-a51d-56a40f6c88c2	default-tenant-id	VoucherApproved	2026-05-20 06:49:38.223	{"type": "Receipt", "amount": 395}
ceaf3c01-7e75-4e2c-918d-c6d653804db9	8eeb4197-9e87-40d8-8481-038c016bd913	default-tenant-id	TransactionPosted	2026-05-20 06:49:38.238	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00004"}
9c501a11-f68b-4755-803e-3cb283ddbae5	6e73d551-e4fe-42a3-b0df-fc3d218c60d4	default-tenant-id	VoucherApproved	2026-05-20 06:49:38.304	{"type": "Receipt", "amount": 330}
ecf1f4f9-e854-463f-9c77-7ba1670cfb15	b20cffa1-3084-46e5-890e-2cdbd0381030	default-tenant-id	TransactionPosted	2026-05-20 06:49:38.319	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00005"}
cf26a0f1-1e2f-44c9-b789-ebf5833aa49e	0137d4a4-dab6-445b-974b-54d0db1c4045	default-tenant-id	VoucherApproved	2026-05-20 06:49:38.389	{"type": "Receipt", "amount": 425}
70f87648-2d53-4f1b-846f-d490c24ad28f	cda2f03c-c3e9-421d-813e-a8ebfbaa821f	default-tenant-id	TransactionPosted	2026-05-20 06:49:38.406	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00006"}
1a23a5b2-3eca-41cb-a3b2-24970b9b4540	25d696c5-c849-442f-a674-53e7aad00fdf	default-tenant-id	VoucherApproved	2026-05-20 06:49:38.479	{"type": "Receipt", "amount": 520}
ea14a68e-2127-40a2-8a10-d530fc5a9205	39f5695b-d729-411f-ac09-921d7781aec7	default-tenant-id	TransactionPosted	2026-05-20 06:49:38.494	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00007"}
73da763c-9267-4bd7-aedc-1a6b71f2dec7	5361a1db-5029-49ba-ad16-31bc259aec11	default-tenant-id	VoucherApproved	2026-05-20 06:49:38.556	{"type": "Receipt", "amount": 230}
aba1fecb-3af2-4fae-8c50-39b31555e6c9	42e22e6a-424c-4172-b15f-b8b9f5e3f720	default-tenant-id	TransactionPosted	2026-05-20 06:49:38.567	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00008"}
8ff21453-561b-4724-af23-80ff07a299a6	811b9f4f-56d1-41cf-b461-290612044669	default-tenant-id	VoucherApproved	2026-05-20 06:49:38.613	{"type": "Receipt", "amount": 165}
463c9cac-2d42-431a-8f06-2ceace62d346	36c92b2d-cd4d-4638-9b54-c137abbfbaea	default-tenant-id	TransactionPosted	2026-05-20 06:49:38.627	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00009"}
1674093f-12b6-409d-8e0f-8eac6609630a	c55fa9df-8958-4887-9aee-d28dff28b4ec	default-tenant-id	VoucherApproved	2026-05-20 06:49:38.687	{"type": "Receipt", "amount": 440}
7567476f-e806-43cf-9cc3-4f89b9e2b5fb	aa413ebf-6676-4eb4-adcd-4e5188d08564	default-tenant-id	TransactionPosted	2026-05-20 06:49:38.702	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00010"}
9a5f8ef6-9c8b-4002-9878-2dfc06b8592e	6d51aba6-a7f7-463f-9639-dd05aca245c8	default-tenant-id	VoucherApproved	2026-05-20 06:49:38.757	{"type": "Receipt", "amount": 355}
f266eecd-1fbd-42b9-9725-5f0c4aabfa2c	618656e5-247a-40ca-babe-971f76ac6d1b	default-tenant-id	TransactionPosted	2026-05-20 06:49:38.768	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00011"}
96e7f95b-dea2-4774-9a87-762ce498d9ee	f473bb52-b1a3-483b-9e5c-23b35358ca4b	default-tenant-id	VoucherApproved	2026-05-20 06:49:38.815	{"type": "Receipt", "amount": 6900}
689ea516-9c14-4af2-a3be-cb33af260b6f	7c7f2aee-7a32-47c9-9340-5f9a7bdbabfe	default-tenant-id	TransactionPosted	2026-05-20 06:49:38.824	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00012"}
b105c5db-2eac-4cb0-8f22-9c0963c416fb	3f026cba-1087-45c9-8e8a-428fda24b35b	default-tenant-id	VoucherApproved	2026-05-20 06:49:38.866	{"type": "Receipt", "amount": 385}
8d4193f9-b6c8-499c-b69b-83aaef63471b	238bf639-59c1-4705-b306-2aca0ea0e968	default-tenant-id	TransactionPosted	2026-05-20 06:49:38.874	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00013"}
ae941244-7cad-420d-8c7c-c51d3ffb06f3	0eac03a9-f097-4ec5-884a-719cb2b6b37e	default-tenant-id	VoucherApproved	2026-05-20 06:49:38.91	{"type": "Receipt", "amount": 480}
781f51ea-6089-4fa4-8555-a5bd1cb2e291	58af4d77-be0e-492d-8e01-7bfe2e70af05	default-tenant-id	TransactionPosted	2026-05-20 06:49:38.918	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00014"}
70860b05-e13e-4301-9d2a-607e653be18c	f20a1158-3ef6-40d5-ae4f-6e1a8a72befd	default-tenant-id	VoucherApproved	2026-05-20 06:49:38.961	{"type": "Receipt", "amount": 190}
6bade123-6919-496b-bf99-ca055f3075f6	d11491ab-a00a-4851-841a-d8f0d34ddf4e	default-tenant-id	TransactionPosted	2026-05-20 06:49:38.969	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00015"}
6d1e38d4-fc41-42c9-96a7-59955cac0438	b265c41a-7a52-46ff-bed8-af319bb5a3f2	default-tenant-id	VoucherApproved	2026-05-20 06:49:39.003	{"type": "Receipt", "amount": 285}
6aaf0f75-2647-41f4-ad07-743a4f592f35	0e4d0140-c243-42ef-9511-f76e479e0058	default-tenant-id	TransactionPosted	2026-05-20 06:49:39.019	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00016"}
3ff0a484-17f2-45f2-a394-3886f2a31f73	51a98470-91ea-46e7-ae7f-74bbd5c9805e	default-tenant-id	VoucherApproved	2026-05-20 06:49:39.056	{"type": "Receipt", "amount": 220}
280f7267-596e-4c75-b599-64c05987250d	2c09aab0-5983-44f2-9453-16544354cf95	default-tenant-id	TransactionPosted	2026-05-20 06:49:39.064	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00017"}
201e977e-02ca-42e6-99b9-f5f9a067357c	e8d8ea7f-e347-4e22-8037-981d79203afb	default-tenant-id	VoucherApproved	2026-05-20 06:49:39.107	{"type": "Receipt", "amount": 15000}
b9178f65-cadf-405c-86c0-ca7196c907d2	32f3cbd5-cf97-47bb-8341-272e5b68c8e1	default-tenant-id	TransactionPosted	2026-05-20 06:49:39.115	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00018"}
c973936a-699a-4083-9590-170553def466	accc65e8-f9da-453b-8c86-211be6d18731	default-tenant-id	VoucherApproved	2026-05-20 06:49:39.165	{"type": "Receipt", "amount": 410}
730f131d-44e1-48c0-95f9-d10d4ce9e90d	58691abb-702e-4ab1-9b2d-49284bdcec2d	default-tenant-id	TransactionPosted	2026-05-20 06:49:39.174	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00019"}
785fe6cb-3c94-405f-a83d-96e1ec5bb59f	cb6e4f69-937c-45e8-b9b7-7dbf4c02b9e9	default-tenant-id	VoucherApproved	2026-05-20 06:49:39.21	{"type": "Receipt", "amount": 505}
9ab38f6a-e23e-4b5a-8317-4d94c5f25385	38e33dd2-b451-4b0f-9bef-75733751118c	default-tenant-id	TransactionPosted	2026-05-20 06:49:39.218	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00020"}
eb35a8a9-00da-46d6-a14a-7c348cd01a7e	29c79fc2-5b6f-483e-847c-817a03d55ff3	default-tenant-id	VoucherApproved	2026-05-20 06:49:39.262	{"type": "Receipt", "amount": 560}
0b5f52c4-066e-4a2d-803e-dfcca671502f	46bf918c-5281-47b9-b9e3-32b948900dff	default-tenant-id	TransactionPosted	2026-05-20 06:49:39.27	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00021"}
8bb844d9-03f8-40cd-a8ec-ae77f968562c	2c9f4d75-22bf-4e90-a12f-9a0615216a99	default-tenant-id	VoucherApproved	2026-05-20 06:49:39.311	{"type": "Receipt", "amount": 230}
474aba14-5675-46f5-9124-807436c98fd4	c4a05d29-a9ea-4890-b7fb-0369f292141c	default-tenant-id	TransactionPosted	2026-05-20 06:49:39.32	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00022"}
14a477ef-77d6-486b-aede-b709977b3b96	1f3af258-522a-4164-9f58-8ee518396c5a	default-tenant-id	VoucherApproved	2026-05-20 06:49:39.358	{"type": "Receipt", "amount": 7300}
0e8cb619-cdfc-4e93-9ef1-0a4658be0086	35d01514-c708-426e-ade0-969e1ba66412	default-tenant-id	TransactionPosted	2026-05-20 06:49:39.367	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00023"}
8632d74d-82dc-4886-83ba-9eaf35b2fb45	b1585085-6e49-445c-b8bc-a4a43c70ea2a	default-tenant-id	VoucherApproved	2026-05-20 06:49:39.411	{"type": "Receipt", "amount": 220}
c2340f34-c1b1-4285-bb0d-fad4eeefe4c0	d4f75846-8809-4d7a-bf0e-33c1dbeead84	default-tenant-id	TransactionPosted	2026-05-20 06:49:39.419	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00024"}
8c2e86f3-147e-430f-acca-d53bae2b8567	374dc661-afc7-4632-a966-e5c3c926a2ee	default-tenant-id	VoucherApproved	2026-05-20 06:49:39.45	{"type": "Receipt", "amount": 455}
52d67281-d6b2-4e83-8839-140de4e6c87e	a65d39e0-cf35-4636-a63f-95f75095ed51	default-tenant-id	TransactionPosted	2026-05-20 06:49:39.457	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00025"}
9ed4a96f-c41c-4f98-97e8-cece72299d8b	319fd2a9-58b3-422d-ba6d-b626a45ca2c4	default-tenant-id	VoucherApproved	2026-05-20 06:49:39.494	{"type": "Receipt", "amount": 370}
da85e310-c463-4cb3-a95c-8882edffce36	aa89c5e3-c582-4a3e-9b61-a306b41a7430	default-tenant-id	TransactionPosted	2026-05-20 06:49:39.501	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00026"}
dc3211f3-01fb-4cdf-aca8-9a5c42501d05	04b31de3-5741-4aef-843d-ccb352b71282	default-tenant-id	VoucherApproved	2026-05-20 06:49:39.551	{"type": "Receipt", "amount": 425}
b9a9cc0b-368c-4cd0-8920-073a104230b4	d3c1f91e-61ef-4f76-9e8d-1e30f66483f4	default-tenant-id	TransactionPosted	2026-05-20 06:49:39.558	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00027"}
9de831fe-2f81-48d6-b7ea-0584ba1d40c6	59721868-f228-4295-9213-50db97527716	default-tenant-id	VoucherApproved	2026-05-20 06:49:39.585	{"type": "Receipt", "amount": 520}
f8b6d12b-9479-4a49-83bc-f66c19023e67	a73a860f-f575-4032-8db8-bef2ec841ccb	default-tenant-id	TransactionPosted	2026-05-20 06:49:39.593	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00028"}
aba01e8f-2a4e-48b8-805d-73690e7845c7	8fd6062d-237b-481a-9bb7-f1fab38238c8	default-tenant-id	MemberCreated	2026-05-20 06:51:12.389	{"name": "E2E Test Member", "email": "e2e-1779259872327@test.com", "status": "Active"}
88db4282-191b-4e52-9ba1-05c242b25839	5a05de70-2cf5-44ef-9844-b50eb8e5b43b	default-tenant-id	EventCreated	2026-05-20 06:51:12.448	{"date": "2026-05-20T06:51:12.420Z", "name": "E2E Test Event", "type": "Special", "status": "DRAFT"}
7da70386-030b-4582-bdf5-4aa966d5bc80	33f1e856-6816-4264-88f8-25c9ae81d186	default-tenant-id	VoucherApproved	2026-05-20 06:51:12.671	{"type": "Receipt", "amount": 250}
f43a1bd5-980a-42f0-8ae4-e26187558ecd	1013cc53-8a5d-4ef5-9830-59161c498b4d	default-tenant-id	TransactionPosted	2026-05-20 06:51:12.681	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00029"}
9aa7094b-b64b-4cb4-91ac-981c8fb1046d	e943a36a-95a7-432e-9d69-a5653a1eb626	default-tenant-id	DonationReceived	2026-05-20 06:51:13.768	{"amount": 250, "method": "Bank Transfer", "reference": "E2E-TXN-1779259872528"}
7117eb49-5479-4fce-a45c-6ae71a6a5283	b8dcccec-7977-49e8-b50a-b9a8cdd596cb	default-tenant-id	MemberCreated	2026-05-20 06:53:00.6	{"name": "PWFirst1779259978592 PWLast1779259978592", "email": "pw.member.1779259978592@example.com", "status": "Active"}
00f796a4-d29f-4412-996c-4b9eea28f706	dc3889c9-5daa-465e-ba0c-91e90ca7d115	default-tenant-id	MemberCreated	2026-05-20 06:53:16.924	{"name": "PathFirst1779259994667 PathLast1779259994667", "email": "pw.path.1779259994667@example.com", "status": "Active"}
00e8672b-da45-4ce1-92f8-220097746497	5b35a9aa-fceb-49db-a889-fa61d4e3e81d	default-tenant-id	MemberCreated	2026-05-20 06:53:26.145	{"name": "VolFirst1779260004009 VolLast1779260004009", "email": "pw.vol.1779260004009@example.com", "status": "Active"}
61909232-b311-4a52-a7be-2e5b1e828096	85eaedfe-6023-47bb-bca6-aff1f94c1600	default-tenant-id	MemberCreated	2026-05-20 06:53:37.592	{"name": "CareFirst1779260015731 CareLast1779260015731", "email": "pw.care.1779260015731@example.com", "status": "Active"}
7bc587a3-48f7-4b11-83c7-930c7ad8f147	33725a5c-951f-420c-b2d3-3ee21a44efad	default-tenant-id	CareCaseOpened	2026-05-20 06:53:39.499	{"urgency": "MEDIUM", "category": "General Pastoral Care", "memberId": "957bc638-6ec7-4c1a-b343-de8fb625ccd4"}
b2d6974b-b0ff-46e0-9116-b80e95c8c3c3	aa6bd204-e243-43cd-b2c0-e2771e85153c	default-tenant-id	CareLogAdded	2026-05-20 06:53:39.686	{"careCaseId": "f9e31a22-274e-4403-b9c6-20fd41d8996d", "interactionType": "Note"}
a6961896-1cbc-4e7c-809f-32ec075398ca	1c34e903-b439-4315-bfcc-5d02c4894d45	default-tenant-id	EventCreated	2026-05-20 06:53:46.027	{"date": "2026-05-20T00:00:00.000Z", "name": "PW Event 1779260025223", "type": "Service", "status": "DRAFT"}
3ab00f4e-0888-41f0-a7c0-ec8ace7afe81	c8dc500f-8fe2-431d-8fb7-27fe7ab4ffb5	default-tenant-id	EventCreated	2026-05-20 06:57:07.831	{"date": "2026-05-20T00:00:00.000Z", "name": "PW Event 1779260226990", "type": "Service", "status": "DRAFT"}
b9ff0bcc-eefa-43d7-a08b-2beda78807fa	2e1e5f9d-9f94-44a4-a45d-25343564d1ab	default-tenant-id	MemberCreated	2026-05-20 07:07:15.324	{"name": "PWFirst1779260833777 PWLast1779260833777", "email": "pw.member.1779260833777@example.com", "status": "Active"}
7942e70a-15e4-4baf-b8f3-aff88139aaff	783b76d0-2c34-4fcd-bbff-3c7717d624f5	default-tenant-id	MemberCreated	2026-05-20 07:07:32.92	{"name": "PathFirst1779260850281 PathLast1779260850281", "email": "pw.path.1779260850281@example.com", "status": "Active"}
f9aade29-69e2-4af6-bd7c-ac9d5e0a78cc	e662f868-c677-4da5-8acf-3192ce332837	default-tenant-id	MemberCreated	2026-05-20 07:07:41.787	{"name": "VolFirst1779260859968 VolLast1779260859968", "email": "pw.vol.1779260859968@example.com", "status": "Active"}
ed2a512e-6f08-4bc4-880d-754ba1968cd5	0d7e5f8d-46c1-4cf0-87a3-db1c4ae4c5c9	default-tenant-id	MemberCreated	2026-05-20 07:07:52.957	{"name": "CareFirst1779260871160 CareLast1779260871160", "email": "pw.care.1779260871160@example.com", "status": "Active"}
8a46ee7a-4f37-4859-b219-2c6821cdc441	b35feb7e-56b4-4cb4-a465-de0ce75866cd	default-tenant-id	CareCaseOpened	2026-05-20 07:07:54.973	{"urgency": "MEDIUM", "category": "General Pastoral Care", "memberId": "1123e00f-6a65-4e2e-baff-74fdace3fe37"}
14335e61-79f3-4c3c-95e8-74739df17675	6fb902d5-9254-4968-b7bf-97318b2830e5	default-tenant-id	CareLogAdded	2026-05-20 07:07:55.275	{"careCaseId": "bf120795-8af8-41bd-bed3-af539938f5eb", "interactionType": "Note"}
3e4cd743-4c0b-4e8e-8173-9b23ac7bbf17	edcccf98-bbd9-441f-b850-f37a2a5ca2af	default-tenant-id	EventCreated	2026-05-20 07:08:01.998	{"date": "2026-05-20T00:00:00.000Z", "name": "PW Event 1779260881318", "type": "Service", "status": "DRAFT"}
5bd35e4a-6bf4-4016-b955-e351fe79eeba	b9b337fb-9358-41aa-a33a-a3a4c9eef7e7	default-tenant-id	MemberCreated	2026-05-20 07:12:58.478	{"name": "PWFirst1779261176438 PWLast1779261176438", "email": "pw.member.1779261176438@example.com", "status": "Active"}
6a752e04-9575-41c5-818e-7b66a65a1053	be69840f-c466-4a3b-b533-911bf3d38f45	default-tenant-id	MemberCreated	2026-05-20 07:13:15.807	{"name": "PathFirst1779261192989 PathLast1779261192989", "email": "pw.path.1779261192989@example.com", "status": "Active"}
cc292639-e7d9-4f7d-83c2-c3c51ede7658	01380724-b268-4bf2-85c3-8d677ed85325	default-tenant-id	MemberCreated	2026-05-20 07:13:25.273	{"name": "VolFirst1779261202588 VolLast1779261202588", "email": "pw.vol.1779261202588@example.com", "status": "Active"}
3c8cc0a2-b7c7-41cb-9b03-65888557f87e	cee9a492-79c8-4303-bab0-4c8b8fcae80e	default-tenant-id	MemberCreated	2026-05-20 07:13:37.26	{"name": "CareFirst1779261215058 CareLast1779261215058", "email": "pw.care.1779261215058@example.com", "status": "Active"}
9b6c4419-3e2e-4dfd-99a0-bc81e6179e0e	1605b9e7-398e-4efc-a490-a34eddbd86c3	default-tenant-id	CareCaseOpened	2026-05-20 07:13:39.047	{"urgency": "MEDIUM", "category": "General Pastoral Care", "memberId": "e1cd4a3a-1425-463f-9a8e-9e4f0bfdd25b"}
4f460505-e690-48a2-83e5-43fd6df09f8a	eb3d1642-fdf6-49a7-8aee-f2eeff36a75c	default-tenant-id	CareLogAdded	2026-05-20 07:13:39.214	{"careCaseId": "12e60bfa-1718-4973-be94-c34886dadd9e", "interactionType": "Note"}
e5754da6-d2e3-43eb-a759-bd47ec1cc003	cc2cfaa2-8d84-46c1-a79a-776a8886e03d	default-tenant-id	EventCreated	2026-05-20 07:13:45.818	{"date": "2026-05-20T00:00:00.000Z", "name": "PW Event 1779261225073", "type": "Service", "status": "DRAFT"}
9ade415c-b3a7-4d7f-b5ba-60fe600f3fad	d3b170d2-af9c-470b-b037-4eb975d97745	default-tenant-id	MemberCreated	2026-05-20 07:28:05.869	{"name": "PWFirst1779262083769 PWLast1779262083769", "email": "pw.member.1779262083769@example.com", "status": "Active"}
0e086c64-5dc7-45cd-a69a-9897e78d84b2	069f30d5-16d4-4a8e-9fae-7aa82d7996cc	default-tenant-id	MemberCreated	2026-05-20 07:28:22.891	{"name": "PathFirst1779262100157 PathLast1779262100157", "email": "pw.path.1779262100157@example.com", "status": "Active"}
94d202e6-7f59-4221-8ec3-a4251c07d05d	0939924f-8208-4c51-99f5-20710de26186	default-tenant-id	MemberCreated	2026-05-20 07:28:31.868	{"name": "VolFirst1779262109544 VolLast1779262109544", "email": "pw.vol.1779262109544@example.com", "status": "Active"}
ad2eb7d3-87ac-4d03-afbd-2f2bc17b0f95	e32f12c0-bd82-4629-a4b1-0db6983c7625	default-tenant-id	MemberCreated	2026-05-20 07:28:42.473	{"name": "CareFirst1779262120692 CareLast1779262120692", "email": "pw.care.1779262120692@example.com", "status": "Active"}
2c15acf4-fb2b-4140-816c-d9117e3b8073	739d08ef-b623-465d-8ae9-bd785285caa0	default-tenant-id	CareCaseOpened	2026-05-20 07:28:44.418	{"urgency": "MEDIUM", "category": "General Pastoral Care", "memberId": "05e6bcf1-3d05-4bc0-9019-f612c5dea737"}
b91b6d7b-ce1e-4c39-bc26-0535f81ef73d	2c7b6020-1a14-44e1-8183-b92eac25f6c7	default-tenant-id	CareLogAdded	2026-05-20 07:28:44.607	{"careCaseId": "c09e2724-5cb9-4c04-9a55-09975ec6593a", "interactionType": "Note"}
af2f84d4-77b5-4b89-adc0-8e0e05db7741	191c12f4-a95f-4285-a1b4-9f6c86ce36e2	default-tenant-id	EventCreated	2026-05-20 07:28:51.043	{"date": "2026-05-20T00:00:00.000Z", "name": "PW Event 1779262130305", "type": "Service", "status": "DRAFT"}
b1a64d8a-ab2f-4ac4-96f1-fca297a47614	c187f9af-de51-4c44-a834-a990c450a195	default-tenant-id	MemberCreated	2026-05-20 10:23:04.448	{"name": "E2E Test Member", "email": "e2e-1779272584403@test.com", "status": "Active"}
5135cf75-db96-49d8-8cca-32efcaee7d04	95442da3-6c26-4c17-965e-63b3ed89c554	default-tenant-id	EventCreated	2026-05-20 10:23:04.489	{"date": "2026-05-20T10:23:04.467Z", "name": "E2E Test Event", "type": "Special", "status": "DRAFT"}
9f9e7142-b75b-47fa-af06-855453b5e46a	b99994c6-5b62-410e-9878-bd7585c38681	default-tenant-id	VoucherApproved	2026-05-20 10:23:04.725	{"type": "Receipt", "amount": 250}
edc45b75-ad9a-48b2-8b90-70d3e763934d	8f1d4ee5-aff0-49bc-9b7f-619422b19b6d	default-tenant-id	TransactionPosted	2026-05-20 10:23:04.746	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00030"}
862774ae-98d7-4ed4-bb58-5bad77353b5c	89445f29-c27c-4ec2-a387-e0d1be180a43	default-tenant-id	DonationReceived	2026-05-20 10:23:05.757	{"amount": 250, "method": "Bank Transfer", "reference": "E2E-TXN-1779272584561"}
db7bbb36-2dcf-49b4-a26d-8c6dc06d09d6	eea3a9cd-7ffc-4201-8df8-b21be52c4c54	default-tenant-id	MemberCreated	2026-05-20 11:16:02.423	{"name": "PWFirst1779275760621 PWLast1779275760621", "email": "pw.member.1779275760621@example.com", "status": "Active"}
fbcb08cf-dfb6-44f8-b80f-d46081e08b49	b355fcca-097d-4c1c-8af6-42670c179584	default-tenant-id	MemberCreated	2026-05-20 11:16:22.484	{"name": "PathFirst1779275780562 PathLast1779275780562", "email": "pw.path.1779275780562@example.com", "status": "Active"}
45eb17b3-b332-45d1-90f3-bd35d0a29fe9	64b184ab-0b91-41e8-9358-10d545aad353	default-tenant-id	MemberCreated	2026-05-20 11:16:34.916	{"name": "VolFirst1779275793122 VolLast1779275793122", "email": "pw.vol.1779275793122@example.com", "status": "Active"}
9fd478af-9130-4199-8b21-91e31ca606d6	6569e205-3d6c-4cd6-be56-11baa65f3cac	default-tenant-id	MemberCreated	2026-05-20 11:16:50.405	{"name": "CareFirst1779275808239 CareLast1779275808239", "email": "pw.care.1779275808239@example.com", "status": "Active"}
82b87314-1773-46f5-8afd-f73f04278c07	9c016425-0829-4dba-aa70-1bbbe28d7f7d	default-tenant-id	CareCaseOpened	2026-05-20 11:16:52.658	{"urgency": "MEDIUM", "category": "General Pastoral Care", "memberId": "14bf9867-357d-46f3-8203-1eee5e129153"}
e634e858-2246-4f10-83d8-2ed2018446e0	c4714121-bfe8-4110-9563-848539cd8096	default-tenant-id	CareLogAdded	2026-05-20 11:16:52.959	{"careCaseId": "0e46ced9-4d34-46cd-9202-3b4e14287581", "interactionType": "Note"}
84e5cf9d-befb-4e84-91b3-f9d9ceaa22a4	cb91622b-0cf2-4dbd-91a8-323b55eb42a1	default-tenant-id	EventCreated	2026-05-20 11:17:01.392	{"date": "2026-05-20T00:00:00.000Z", "name": "PW Event 1779275820723", "type": "Service", "status": "DRAFT"}
f456dc0a-7974-41ef-9abc-43b21ceb7c75	47b39f73-cb1d-428c-b073-5cc1f7838ff1	default-tenant-id	MemberCreated	2026-05-20 12:16:37.687	{"name": "Ravi Nair", "email": "hif-ecopark-sim.ravi@hifecopark.org", "status": "Active"}
ab9464f8-b1b6-4eef-aae1-d2b2d32e0b7f	e8b6b444-4767-4ba7-8bcf-9aea8213d552	default-tenant-id	MemberCreated	2026-05-20 12:16:37.713	{"name": "Priya Nair", "email": "hif-ecopark-sim.priya@hifecopark.org", "status": "Active"}
c41720d2-94eb-4560-8528-a0a9962f9a92	209e33ba-d3da-4039-b5d5-a11bcbabfdd2	default-tenant-id	MemberCreated	2026-05-20 12:16:37.73	{"name": "Arjun Nair", "email": "hif-ecopark-sim.arjun@hifecopark.org", "status": "Active"}
e868d48e-e8d7-4461-bcba-d809b7e582cd	5a004645-49e8-4012-8f8f-a7a49a15c00f	default-tenant-id	MemberCreated	2026-05-20 12:16:37.747	{"name": "Meera Thomas", "email": "hif-ecopark-sim.meera@hifecopark.org", "status": "Active"}
0de7edf5-25e7-473d-ae7b-13bc24d1bd71	33900b22-cde8-4808-8957-d160fccedf90	default-tenant-id	MemberCreated	2026-05-20 12:16:37.766	{"name": "David Kurian", "email": "hif-ecopark-sim.finance@hifecopark.org", "status": "Active"}
b8688d26-5769-4be6-b1cf-aa4c1f6a87d6	73c940be-c4b2-4c03-afe6-d27c6bb6da6e	default-tenant-id	MemberCreated	2026-05-20 12:16:37.784	{"name": "Sarah Mathew", "email": "hif-ecopark-sim.worship@hifecopark.org", "status": "Active"}
bc783c79-b50f-4f03-a904-c7239f22ff9d	8f83c624-0abc-4142-9dde-ceec7cdc97f9	default-tenant-id	MemberCreated	2026-05-20 12:16:37.802	{"name": "James Paul", "email": "hif-ecopark-sim.campus@hifecopark.org", "status": "Active"}
a0d20302-320c-4b77-8f5f-b532f7eb2359	4735c892-9f8c-4efc-b011-b887b4289587	default-tenant-id	EventCreated	2026-05-20 12:18:34.79	{"date": "2026-05-27T12:18:34.761Z", "name": "hif-ecopark-sim Sunday Worship Gathering", "type": "Service", "status": "DRAFT"}
69abac3b-c1f0-4638-86c1-63adbd924817	6c1e01ce-8cd9-4c06-b9f2-ccfcdab8468a	default-tenant-id	EventCreated	2026-05-20 12:18:34.836	{"date": "2026-05-25T12:18:34.808Z", "name": "hif-ecopark-sim Friday Worship Night", "type": "Worship", "status": "DRAFT"}
496bd17e-9322-42eb-b325-2a437adb7d51	3ac22982-211f-44e3-a783-2a962b906928	default-tenant-id	EventCreated	2026-05-20 12:18:34.877	{"date": "2026-06-03T12:18:34.850Z", "name": "hif-ecopark-sim Youth Alive Night", "type": "Youth", "status": "DRAFT"}
05bb1d54-a81c-48e0-a056-bb6120e617f8	7e2f842a-2cc7-4ba6-871f-342003ee54e8	default-tenant-id	EventCreated	2026-05-20 12:18:34.908	{"date": "2026-07-04T12:18:34.885Z", "name": "hif-ecopark-sim Kingdom Conference 2026", "type": "Conference", "status": "DRAFT"}
2dff7b13-5621-433c-96b1-6346f64f3e69	3f13b133-8bd9-4c0f-9ae1-42f399ed6e10	default-tenant-id	VisitorRegistered	2026-05-20 12:18:35.005	{"name": "hif-ecopark-sim Visitor — Ananya Das", "source": "Sunday"}
e4186bc6-d551-4c00-88e9-ea23297c0045	bed94e9c-7ad8-4328-9952-0e9fb8eb7030	default-tenant-id	VoucherApproved	2026-05-20 12:18:35.082	{"type": "Receipt", "amount": 2500}
17924071-efaf-4c52-b768-ab53297ba864	8ad8b133-edbb-4145-8258-c06040077b57	default-tenant-id	TransactionPosted	2026-05-20 12:18:35.095	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00031"}
49ddf317-27a2-4fe0-83ac-9205ae820477	0bd7a48a-7640-4a65-8404-a2e8dc726b0b	default-tenant-id	DonationReceived	2026-05-20 12:18:36.117	{"date": "2026-05-20T12:18:35.007Z", "amount": 2500, "method": "Bank Transfer", "reference": "hif-ecopark-sim-offering-1779279515007"}
89a4b966-fb74-4604-94aa-5d29c40ee70a	e658de6e-6d53-4524-8f61-88eed8f0bf6b	default-tenant-id	CareCaseOpened	2026-05-20 12:20:32.614	{"urgency": "MEDIUM", "category": "Pastoral follow-up", "memberId": "2ad34cf4-a3e3-40f2-8436-7ed668803986"}
7798f900-b8f6-4507-ab25-48c4502a886e	39362302-47c1-4e9d-b077-f955d53107d6	default-tenant-id	VoucherApproved	2026-05-20 12:20:32.868	{"type": "Receipt", "amount": 2500}
cdbcfc0e-09f8-422d-bf75-9332a56f2f2c	913dae51-c5aa-47cd-8e62-2ee4220f022a	default-tenant-id	TransactionPosted	2026-05-20 12:20:32.88	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00032"}
097d7346-f009-4064-9124-fa9155d94e58	eb3c9e11-e741-46c6-a81b-67f87d9d0e6f	default-tenant-id	DonationReceived	2026-05-20 12:20:33.906	{"date": "2026-05-20T12:20:32.782Z", "amount": 2500, "method": "Bank Transfer", "reference": "hif-ecopark-sim-offering-1779279632782"}
ca3ad7ff-0fcc-4722-b783-32802e0379f8	be1dc12d-6377-4ad9-920e-3b8cb6c46f97	default-tenant-id	VoucherApproved	2026-05-20 12:20:41.925	{"type": "Receipt", "amount": 987654}
d1709029-f6ad-4dfe-9333-0fe2a2718a56	e76eb586-1242-4ff2-ae16-595f3b1d8e53	default-tenant-id	TransactionPosted	2026-05-20 12:20:41.936	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00033"}
2cd908c1-5632-495e-bf1b-5c485300a8bd	b14a2bc9-a272-40f4-b044-2eb3a91b5087	default-tenant-id	DonationReceived	2026-05-20 12:20:42.978	{"date": "2026-05-20T12:20:41.841Z", "amount": 987654, "method": "Bank Transfer", "reference": "PW-DEEP-1779279641153"}
f33f3b2e-0ff9-4a26-81c3-d32c531c9765	feea6dff-e47a-449d-9f9a-2b83f0942edd	default-tenant-id	ServiceSegmentAdvanced	2026-05-20 15:49:29.749	{"index": 1, "action": "complete", "actorUserId": "cbf6a56e-b0a1-45da-bdd3-5518b14ab417"}
d34a53e9-f39e-4e8d-9573-1181830bec42	76b37a31-7d6a-4748-9a1e-d96bd7662361	default-tenant-id	ServiceSegmentAdvanced	2026-05-20 15:49:30.679	{"index": 2, "action": "complete", "actorUserId": "cbf6a56e-b0a1-45da-bdd3-5518b14ab417"}
a07a2968-8cf9-4c85-9665-7fe8573e73f4	f8618758-116b-449b-805c-e297b7062990	default-tenant-id	ServiceSegmentAdvanced	2026-05-20 15:49:31.577	{"index": 3, "action": "complete", "actorUserId": "cbf6a56e-b0a1-45da-bdd3-5518b14ab417"}
df3d8f7f-2870-46a4-a578-ed87e2ed3322	f658cc81-33e9-4476-8eac-1be4315b81b9	default-tenant-id	ServiceSegmentAdvanced	2026-05-20 15:49:31.98	{"index": 4, "action": "complete", "actorUserId": "cbf6a56e-b0a1-45da-bdd3-5518b14ab417"}
e8951a2c-ad0d-4982-85aa-2e6d1b436e03	3b07ff56-09d9-494c-b964-39a7c5ca4d58	default-tenant-id	ServiceSegmentAdvanced	2026-05-20 15:49:33.198	{"index": 4, "action": "complete", "actorUserId": "cbf6a56e-b0a1-45da-bdd3-5518b14ab417"}
5d133c70-7f6a-4f62-ab5b-f0863b38f956	f972ec37-311a-4747-a379-d516932b1bf2	default-tenant-id	ServiceSegmentAdvanced	2026-05-20 15:49:34.741	{"index": 4, "action": "complete", "actorUserId": "cbf6a56e-b0a1-45da-bdd3-5518b14ab417"}
e7191b70-2f28-477d-8ab0-13893e103e58	7a3a8b96-1964-4b7e-9ff4-131429c643f2	default-tenant-id	ServiceSegmentAdvanced	2026-05-20 15:49:38.024	{"index": 4, "action": "skip", "actorUserId": "cbf6a56e-b0a1-45da-bdd3-5518b14ab417"}
43404274-2096-4f94-b5a3-89fea361d4ca	921011b7-c5c6-4735-aac4-929f467a169c	default-tenant-id	ServiceSegmentAdvanced	2026-05-20 15:49:39.316	{"index": 4, "action": "skip", "actorUserId": "cbf6a56e-b0a1-45da-bdd3-5518b14ab417"}
4d98e37d-7924-464f-a190-d223bcc364e8	18880b2d-8f4c-4000-866f-c01996589fef	default-tenant-id	ServiceSegmentAdvanced	2026-05-20 15:49:40.352	{"index": 4, "action": "complete", "actorUserId": "cbf6a56e-b0a1-45da-bdd3-5518b14ab417"}
7a63564a-2d0f-4034-807f-60e9403f6d55	aa6f056b-2da8-48dd-aa01-6e8b67a35935	default-tenant-id	MemberCreated	2026-05-20 17:18:10.352	{"name": "HR Sim Staff 1779297490292", "email": "hr-sim.staff.1779297490292@grace.local", "status": "Active"}
3712ec96-bdb8-4db4-86a2-9536664dab5e	8c9cb0bb-f8ea-4d6a-8a48-530a6b3954fa	default-tenant-id	MemberCreated	2026-05-20 17:24:45.492	{"name": "HR Sim Staff 1779297885381", "email": "hr-sim.staff.1779297885381@grace.local", "status": "Active"}
d5224133-baa3-475d-a89b-2588e6107092	65df73dd-8b60-4f67-bb0b-dacce8515c90	default-tenant-id	MemberCreated	2026-05-20 17:27:01.131	{"name": "HR Sim Staff 1779298021072", "email": "hr-sim.staff.1779298021072@grace.local", "status": "Active"}
122e6e5f-887f-4186-864d-f815b7d80ea4	13f7d1c5-4269-452a-b411-4462a24e944f	default-tenant-id	MemberCreated	2026-05-20 17:49:34.814	{"name": "HR Sim Staff 1779299374781", "email": "hr-sim.staff.1779299374781@grace.local", "status": "Active"}
7d76b00d-dc0d-4519-a65a-28d67865b515	2a05ded3-4274-4b34-939f-0097f2836840	default-tenant-id	MemberCreated	2026-05-20 18:15:43.279	{"name": "PWFirst1779300941483 PWLast1779300941483", "email": "pw.member.1779300941483@example.com", "status": "Active"}
f0e1bbf2-7847-468f-b642-eb0a337603a6	fec95b4f-ae01-4db2-bb90-003dbe9baf92	default-tenant-id	MemberCreated	2026-05-20 18:16:01.984	{"name": "PathFirst1779300959635 PathLast1779300959635", "email": "pw.path.1779300959635@example.com", "status": "Active"}
bc16ac21-2dbb-4a0a-8919-ec0fa7643438	28003540-e05c-4223-8f45-56f91a7d69ef	default-tenant-id	MemberCreated	2026-05-20 18:16:12.067	{"name": "VolFirst1779300970330 VolLast1779300970330", "email": "pw.vol.1779300970330@example.com", "status": "Active"}
86d5ac94-0aef-4e66-9fab-d0e8317c5c2c	70d6674d-4779-4dfe-84a6-80d5d0303047	default-tenant-id	MemberCreated	2026-05-20 18:16:24.631	{"name": "CareFirst1779300982225 CareLast1779300982225", "email": "pw.care.1779300982225@example.com", "status": "Active"}
9f8d2b3d-2f06-401f-b390-682e46490921	08ff8081-ba9a-4c47-8419-211f1b144e29	default-tenant-id	CareCaseOpened	2026-05-20 18:16:26.898	{"urgency": "MEDIUM", "category": "General Pastoral Care", "memberId": "352be535-1722-4f5a-a659-09943ac51095"}
47d75cf5-115a-4597-ba06-a03547c172bd	11e95ba4-25a8-4394-a812-ea8d22ad1a67	default-tenant-id	CareLogAdded	2026-05-20 18:16:27.075	{"careCaseId": "e97bddfe-c16a-4634-bb42-ecdba20fe142", "interactionType": "Note"}
53c075b2-2ac8-4cf4-a88b-47913c34b2b6	54a23c61-e68d-4e7b-ae8d-72da72e8dbc2	default-tenant-id	EventCreated	2026-05-20 18:16:34.65	{"date": "2026-05-20T00:00:00.000Z", "name": "PW Event 1779300994027", "type": "Service", "status": "DRAFT"}
c6deb7ad-4a77-4cf3-b30a-0c69743b3435	cfa4d58f-3909-40e3-865b-2358761e9ae3	default-tenant-id	MemberCreated	2026-05-21 14:45:52.868	{"name": "PWFirst1779374749624 PWLast1779374749624", "email": "pw.member.1779374749624@example.com", "status": "Active"}
5329cba4-1870-4c15-acad-f83bb69fedb9	3e53b6f6-abb1-4101-8258-fd8df52d3a9c	default-tenant-id	MemberCreated	2026-05-21 14:46:11.407	{"name": "PathFirst1779374769083 PathLast1779374769083", "email": "pw.path.1779374769083@example.com", "status": "Active"}
e8d2f321-82f0-4861-a9f9-4b88a62f8caf	d018f254-7fa2-4222-9777-cdbbff2343bb	default-tenant-id	MemberCreated	2026-05-21 14:46:22.778	{"name": "VolFirst1779374779967 VolLast1779374779967", "email": "pw.vol.1779374779967@example.com", "status": "Active"}
4a3b0178-984b-4275-a80c-699354c59fc0	0714fca3-6dc0-48fa-bb39-2185ed3f21b0	default-tenant-id	MemberCreated	2026-05-21 14:46:36.691	{"name": "CareFirst1779374793851 CareLast1779374793851", "email": "pw.care.1779374793851@example.com", "status": "Active"}
bb2abdde-295a-4e14-85d9-16dfc1faadbb	dc0c5432-a1a9-4292-88a0-c0d7661ebb2e	default-tenant-id	CareCaseOpened	2026-05-21 14:46:38.741	{"urgency": "MEDIUM", "category": "General Pastoral Care", "memberId": "3ff916c5-e8c6-4e9f-baef-b233545a9e0f"}
13089be8-1e55-46f4-a608-b5adff6f73ea	74436681-85eb-4d67-bb5d-474a6d6a8f88	default-tenant-id	CareLogAdded	2026-05-21 14:46:38.929	{"careCaseId": "53262ce1-cd20-4fa2-9c66-b666a06e7820", "interactionType": "Note"}
426fc5d2-0bda-480a-bd09-3d57c2967f78	3cb432d8-9d23-4b3b-8f89-f351de3b0b54	default-tenant-id	EventCreated	2026-05-21 14:46:46.866	{"date": "2026-05-21T00:00:00.000Z", "name": "PW Event 1779374806224", "type": "Service", "status": "DRAFT"}
4c859fc3-b024-485a-a781-0ef8f5120a71	a5c2f8e5-acd8-4196-b281-9acc647870ea	default-tenant-id	TenantBackupRestored	2026-05-24 09:00:50.445	{"at": "2026-05-24T09:00:49.563Z", "restoredPages": 11, "restoredSettings": 13}
37c3e1e7-ad03-4df3-94b5-861dc9f07f14	d9012e34-17cd-46c6-97cf-752187f69af1	default-tenant-id	TenantBackupRestored	2026-05-24 09:03:42.226	{"at": "2026-05-24T09:03:41.320Z", "restoredPages": 11, "restoredSettings": 13}
\.


--
-- Data for Name: ApprovalDecision; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ApprovalDecision" (id, "tenantId", "approvalRequestId", level, decision, "actorUserId", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ApprovalRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ApprovalRequest" (id, "tenantId", "entityType", "entityId", "requestedByUserId", status, "currentLevel", "minRequiredLevel", amount, "moduleKey", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ApprovalRule; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ApprovalRule" (id, "tenantId", "entityType", "minAmount", "moduleKey", "approverRoleId", level, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Asset; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Asset" (id, "tenantId", name, category, "serialNumber", location, value, "purchaseDate", status, condition, "imageUrl", notes, "assignedToId", "capitalizationVoucherId", "disposalVoucherId", "residualValue", "usefulLifeMonths", "depreciationMethod", "accumulatedDepreciation", "lastDepreciationDate", "disposedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AssetDepreciationEntry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AssetDepreciationEntry" (id, "tenantId", "assetId", "periodDate", amount, "accumulatedAfter", "voucherId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AssetMaintenanceLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AssetMaintenanceLog" (id, "tenantId", "assetId", "serviceType", description, "scheduledAt", "completedAt", cost, technician, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Attendance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Attendance" (id, "tenantId", "sessionId", "memberId", "visitorName", "visitorPhone", status, "checkInTime", method, notes) FROM stdin;
c88a558c-46e5-42f0-bf89-888070c20b1e	default-tenant-id	c8dfe044-e7cb-4401-babb-8aeb6a65931e	74d135ee-b8a7-4137-951a-dc4898ff4451	\N	\N	PRESENT	2026-05-20 06:49:37.173	MANUAL	\N
893e51f5-fecc-45fc-84a4-5e56dad7f222	default-tenant-id	c8dfe044-e7cb-4401-babb-8aeb6a65931e	f1c66b29-be4b-41ae-8e1b-a707a2cb8893	\N	\N	PRESENT	2026-05-20 06:49:37.179	MANUAL	\N
bf1d43ab-0cb6-4171-82fd-b09bda5d6535	default-tenant-id	c8dfe044-e7cb-4401-babb-8aeb6a65931e	efec78ed-a3ce-4306-aa5d-a78cb7dc4439	\N	\N	PRESENT	2026-05-20 06:49:37.18	MANUAL	\N
d81ca017-3677-470b-9920-611ea1e5ac46	default-tenant-id	c8dfe044-e7cb-4401-babb-8aeb6a65931e	d0095111-4f2f-4d13-acf6-c83b356c3d0a	\N	\N	PRESENT	2026-05-20 06:49:37.183	MANUAL	\N
862cab3a-866d-40c6-a85c-97e269485db8	default-tenant-id	c8dfe044-e7cb-4401-babb-8aeb6a65931e	8404911d-3139-4f4c-8e9b-cbd4e703ddf6	\N	\N	PRESENT	2026-05-20 06:49:37.184	MANUAL	\N
dc90bbd6-0fa0-4d8b-bdaa-7ef73a4abb4a	default-tenant-id	c8dfe044-e7cb-4401-babb-8aeb6a65931e	4867b73b-742d-4675-983e-994381643be9	\N	\N	PRESENT	2026-05-20 06:49:37.186	MANUAL	\N
afa500d9-b775-42c1-97c8-66a9f0e600eb	default-tenant-id	c8dfe044-e7cb-4401-babb-8aeb6a65931e	0e7855c1-e24d-4bfe-a750-f137064628ed	\N	\N	PRESENT	2026-05-20 06:49:37.187	MANUAL	\N
4de9d91c-dd5b-4b13-baa0-5098494e3a9a	default-tenant-id	c8dfe044-e7cb-4401-babb-8aeb6a65931e	4b707156-1f9a-4bb9-9d89-03d8a0ddeaf1	\N	\N	PRESENT	2026-05-20 06:49:37.188	MANUAL	\N
6da3c784-f841-4893-81d0-ebba20efbb2a	default-tenant-id	c8dfe044-e7cb-4401-babb-8aeb6a65931e	32dd462a-1938-4468-a4e1-638640fad0e7	\N	\N	PRESENT	2026-05-20 06:49:37.189	MANUAL	\N
6e1ce27e-f947-4577-a8d4-14586f318b58	default-tenant-id	c8dfe044-e7cb-4401-babb-8aeb6a65931e	5ab36650-61da-4ddb-b9a2-a832166fc45e	\N	\N	PRESENT	2026-05-20 06:49:37.191	MANUAL	\N
bce38081-3170-4c15-a9cb-84221a80d844	default-tenant-id	c8dfe044-e7cb-4401-babb-8aeb6a65931e	3e6ca72a-5085-4bb7-9116-e992efa10b27	\N	\N	PRESENT	2026-05-20 06:49:37.192	MANUAL	\N
3eb67f1b-fbd0-4ea3-b13e-7e75d40b3024	default-tenant-id	c8dfe044-e7cb-4401-babb-8aeb6a65931e	08fafbd6-285c-4b4a-b9d4-0edce7c34521	\N	\N	PRESENT	2026-05-20 06:49:37.194	MANUAL	\N
ce33773f-3c6f-458c-8ff2-4ca0ddb1fabc	default-tenant-id	c8dfe044-e7cb-4401-babb-8aeb6a65931e	a3695171-a8ec-4bab-8e6c-e8420e194dfa	\N	\N	PRESENT	2026-05-20 06:49:37.195	MANUAL	\N
cb13a219-6030-449a-a393-6ea11ef2b769	default-tenant-id	c8dfe044-e7cb-4401-babb-8aeb6a65931e	403a03ca-341c-42b4-b013-e6a7a891cbfe	\N	\N	PRESENT	2026-05-20 06:49:37.197	MANUAL	\N
54b81850-c724-44d9-8566-e78c3b9284f6	default-tenant-id	c8dfe044-e7cb-4401-babb-8aeb6a65931e	1b54d681-9526-4421-9648-eae426a8a982	\N	\N	PRESENT	2026-05-20 06:49:37.199	MANUAL	\N
f0544ef6-6969-40e9-b133-c44f9d48833b	default-tenant-id	c8dfe044-e7cb-4401-babb-8aeb6a65931e	35c29c25-08e9-495d-b1ee-f29a8316d929	\N	\N	PRESENT	2026-05-20 06:49:37.2	MANUAL	\N
cb76497e-0e3d-46c3-bd26-5fe857c3ca09	default-tenant-id	c8dfe044-e7cb-4401-babb-8aeb6a65931e	bf88f9d5-6934-4ccb-9a14-72a70ffd18af	\N	\N	PRESENT	2026-05-20 06:49:37.201	MANUAL	\N
54edc6d5-32ec-41b2-ac9f-5247cba97b86	default-tenant-id	c8dfe044-e7cb-4401-babb-8aeb6a65931e	a2facb1d-d19e-4689-92a1-4dc7f850bb69	\N	\N	PRESENT	2026-05-20 06:49:37.202	MANUAL	\N
d14456ec-e488-4069-854e-847d0b660eab	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	efec78ed-a3ce-4306-aa5d-a78cb7dc4439	\N	\N	PRESENT	2026-05-20 06:49:37.206	MANUAL	\N
9e05ea66-9bba-41c7-b62c-e675d896f411	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	d0095111-4f2f-4d13-acf6-c83b356c3d0a	\N	\N	PRESENT	2026-05-20 06:49:37.207	MANUAL	\N
de1a76f2-9b9d-4dc9-8b5b-8e51c753f056	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	8404911d-3139-4f4c-8e9b-cbd4e703ddf6	\N	\N	PRESENT	2026-05-20 06:49:37.209	MANUAL	\N
0466798d-6ec7-4a5e-82a6-023c8e3fccf0	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	4867b73b-742d-4675-983e-994381643be9	\N	\N	PRESENT	2026-05-20 06:49:37.211	MANUAL	\N
2765f1b5-01c8-4119-a862-b070cfb32d87	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	0e7855c1-e24d-4bfe-a750-f137064628ed	\N	\N	PRESENT	2026-05-20 06:49:37.212	MANUAL	\N
a15fe974-f561-495d-8ac5-1a8aafec1164	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	4b707156-1f9a-4bb9-9d89-03d8a0ddeaf1	\N	\N	PRESENT	2026-05-20 06:49:37.213	MANUAL	\N
62f12033-ff4f-4b66-95e3-5212a3b14282	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	32dd462a-1938-4468-a4e1-638640fad0e7	\N	\N	PRESENT	2026-05-20 06:49:37.214	MANUAL	\N
8678bb6e-ed4e-46f9-aa93-3359588cd6c4	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	5ab36650-61da-4ddb-b9a2-a832166fc45e	\N	\N	PRESENT	2026-05-20 06:49:37.216	MANUAL	\N
1266d711-a9bb-4ef4-b8b7-c39bc63183e1	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	3e6ca72a-5085-4bb7-9116-e992efa10b27	\N	\N	PRESENT	2026-05-20 06:49:37.218	MANUAL	\N
ce1d2e79-64ac-4b11-927c-8bed9ea4a36e	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	08fafbd6-285c-4b4a-b9d4-0edce7c34521	\N	\N	PRESENT	2026-05-20 06:49:37.219	MANUAL	\N
11effa55-da69-4ea8-bf42-d55ea336a131	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	a3695171-a8ec-4bab-8e6c-e8420e194dfa	\N	\N	PRESENT	2026-05-20 06:49:37.22	MANUAL	\N
34c78430-c0da-4298-bde5-4ac233204fe0	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	403a03ca-341c-42b4-b013-e6a7a891cbfe	\N	\N	PRESENT	2026-05-20 06:49:37.221	MANUAL	\N
a024a758-e7fa-4c57-ace6-08b6247b3510	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	1b54d681-9526-4421-9648-eae426a8a982	\N	\N	PRESENT	2026-05-20 06:49:37.221	MANUAL	\N
64744f06-fb95-4466-83c8-24c7a4d70b79	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	35c29c25-08e9-495d-b1ee-f29a8316d929	\N	\N	PRESENT	2026-05-20 06:49:37.222	MANUAL	\N
d791ee0f-f0cd-4fa3-820f-e2b7b9917b39	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	bf88f9d5-6934-4ccb-9a14-72a70ffd18af	\N	\N	PRESENT	2026-05-20 06:49:37.223	MANUAL	\N
079d3adf-cdfa-4270-820c-8e9a8807f714	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	a2facb1d-d19e-4689-92a1-4dc7f850bb69	\N	\N	PRESENT	2026-05-20 06:49:37.224	MANUAL	\N
0df3672b-f3be-4bbf-aa20-d26918eeb131	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	f13407e2-1aea-4523-b5ed-e6f58fd6d368	\N	\N	PRESENT	2026-05-20 06:49:37.225	MANUAL	\N
643101f5-dca9-46a1-9171-31a3a82c522d	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	4b6dab00-d55c-466f-a49e-d261f4c87570	\N	\N	PRESENT	2026-05-20 06:49:37.226	MANUAL	\N
7cf733e5-e168-4931-b5fa-8617632f15aa	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	9e033035-6ca2-4706-b10b-a3cd015f5b00	\N	\N	PRESENT	2026-05-20 06:49:37.227	MANUAL	\N
6c568ea6-c8d5-4e75-bad1-2fc4a3164c84	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	74d135ee-b8a7-4137-951a-dc4898ff4451	\N	\N	PRESENT	2026-05-20 06:49:37.228	MANUAL	\N
726a1873-5350-4b61-9880-af0de184c786	default-tenant-id	75d94f25-c2f8-462c-bb91-52b0c73f914b	f1c66b29-be4b-41ae-8e1b-a707a2cb8893	\N	\N	PRESENT	2026-05-20 06:49:37.23	MANUAL	\N
8df05719-4d27-4295-b559-fd94128fb9e3	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	8404911d-3139-4f4c-8e9b-cbd4e703ddf6	\N	\N	PRESENT	2026-05-20 06:49:37.232	MANUAL	\N
d517d6ae-ac22-4080-98dd-8ffbd6acbc2e	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	4867b73b-742d-4675-983e-994381643be9	\N	\N	PRESENT	2026-05-20 06:49:37.234	MANUAL	\N
1b37075a-5fb5-4943-9638-800c94b1e908	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	0e7855c1-e24d-4bfe-a750-f137064628ed	\N	\N	PRESENT	2026-05-20 06:49:37.236	MANUAL	\N
2faf2c5a-9a0b-4d34-8280-24220f32365a	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	4b707156-1f9a-4bb9-9d89-03d8a0ddeaf1	\N	\N	PRESENT	2026-05-20 06:49:37.238	MANUAL	\N
42de9158-719b-44e0-9916-c9db8b128b0c	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	32dd462a-1938-4468-a4e1-638640fad0e7	\N	\N	PRESENT	2026-05-20 06:49:37.239	MANUAL	\N
3c22d3ba-8815-4735-b444-906dcb6cda2a	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	5ab36650-61da-4ddb-b9a2-a832166fc45e	\N	\N	PRESENT	2026-05-20 06:49:37.24	MANUAL	\N
fc10c6db-9eee-4c3e-b43a-8c639f0cd11c	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	3e6ca72a-5085-4bb7-9116-e992efa10b27	\N	\N	PRESENT	2026-05-20 06:49:37.24	MANUAL	\N
eb4c5fc3-3cea-46b5-8c34-93bc2450aa42	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	08fafbd6-285c-4b4a-b9d4-0edce7c34521	\N	\N	PRESENT	2026-05-20 06:49:37.241	MANUAL	\N
aa89f622-1950-4539-8dac-ac9b4cbb4bc1	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	a3695171-a8ec-4bab-8e6c-e8420e194dfa	\N	\N	PRESENT	2026-05-20 06:49:37.242	MANUAL	\N
3463668f-fff8-438e-8cc0-758e921a9767	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	403a03ca-341c-42b4-b013-e6a7a891cbfe	\N	\N	PRESENT	2026-05-20 06:49:37.245	MANUAL	\N
d80dcb33-a03f-4d17-b979-9f4a1229c3bf	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	1b54d681-9526-4421-9648-eae426a8a982	\N	\N	PRESENT	2026-05-20 06:49:37.247	MANUAL	\N
20dff9af-7b27-4b4b-8325-b54ad0bc2337	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	35c29c25-08e9-495d-b1ee-f29a8316d929	\N	\N	PRESENT	2026-05-20 06:49:37.248	MANUAL	\N
6c8e7dbb-2c77-411f-805c-0c6a22bac263	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	bf88f9d5-6934-4ccb-9a14-72a70ffd18af	\N	\N	PRESENT	2026-05-20 06:49:37.249	MANUAL	\N
03afb5a0-e8d8-4235-8815-dc9f140a527d	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	a2facb1d-d19e-4689-92a1-4dc7f850bb69	\N	\N	PRESENT	2026-05-20 06:49:37.25	MANUAL	\N
f1bfe9de-acbb-4958-87c5-fb4b77965d1b	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	f13407e2-1aea-4523-b5ed-e6f58fd6d368	\N	\N	PRESENT	2026-05-20 06:49:37.251	MANUAL	\N
bed98a9f-4299-4736-b721-d6eb4460353b	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	4b6dab00-d55c-466f-a49e-d261f4c87570	\N	\N	PRESENT	2026-05-20 06:49:37.252	MANUAL	\N
1eb99535-bca0-4f24-8e7e-57669f7e71b4	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	9e033035-6ca2-4706-b10b-a3cd015f5b00	\N	\N	PRESENT	2026-05-20 06:49:37.253	MANUAL	\N
9883f1f4-83d8-4582-8231-2fc1e6b748d2	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	74d135ee-b8a7-4137-951a-dc4898ff4451	\N	\N	PRESENT	2026-05-20 06:49:37.254	MANUAL	\N
0c3482b9-eee4-4268-8ef8-d214d52d2e84	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	f1c66b29-be4b-41ae-8e1b-a707a2cb8893	\N	\N	PRESENT	2026-05-20 06:49:37.255	MANUAL	\N
57eefc6a-af49-412c-af70-3768e5cf0cd9	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	efec78ed-a3ce-4306-aa5d-a78cb7dc4439	\N	\N	PRESENT	2026-05-20 06:49:37.256	MANUAL	\N
e0d8a540-47b0-41c7-ac93-32fb63799b19	default-tenant-id	693a0092-50c1-48b8-820b-e0e318df3642	d0095111-4f2f-4d13-acf6-c83b356c3d0a	\N	\N	PRESENT	2026-05-20 06:49:37.258	MANUAL	\N
bff89c01-4c66-40ff-a470-c054db933d80	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	0e7855c1-e24d-4bfe-a750-f137064628ed	\N	\N	PRESENT	2026-05-20 06:49:37.262	MANUAL	\N
40bd1d4d-9a8d-401a-b367-f55d108a09fb	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	4b707156-1f9a-4bb9-9d89-03d8a0ddeaf1	\N	\N	PRESENT	2026-05-20 06:49:37.263	MANUAL	\N
d91e98ca-b15e-4fd4-aa27-5f70d97541fb	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	32dd462a-1938-4468-a4e1-638640fad0e7	\N	\N	PRESENT	2026-05-20 06:49:37.263	MANUAL	\N
6da73a1d-a5ca-4d27-b6f5-36dd1f568c9f	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	5ab36650-61da-4ddb-b9a2-a832166fc45e	\N	\N	PRESENT	2026-05-20 06:49:37.264	MANUAL	\N
6200e65d-2cfa-4c10-b838-b68f722a971d	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	3e6ca72a-5085-4bb7-9116-e992efa10b27	\N	\N	PRESENT	2026-05-20 06:49:37.265	MANUAL	\N
a909a505-6ae8-48b8-8f60-1ea09bc18f96	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	08fafbd6-285c-4b4a-b9d4-0edce7c34521	\N	\N	PRESENT	2026-05-20 06:49:37.265	MANUAL	\N
8af20fd7-eab6-4afc-92ef-94274841149a	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	a3695171-a8ec-4bab-8e6c-e8420e194dfa	\N	\N	PRESENT	2026-05-20 06:49:37.266	MANUAL	\N
ad287586-b262-4dd8-a226-e2e614fbee26	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	403a03ca-341c-42b4-b013-e6a7a891cbfe	\N	\N	PRESENT	2026-05-20 06:49:37.267	MANUAL	\N
a10844b7-31ab-43f3-a1a5-e1fcbafa884e	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	1b54d681-9526-4421-9648-eae426a8a982	\N	\N	PRESENT	2026-05-20 06:49:37.268	MANUAL	\N
766580dd-e1f1-4562-bc78-6a0c30ff59ba	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	35c29c25-08e9-495d-b1ee-f29a8316d929	\N	\N	PRESENT	2026-05-20 06:49:37.269	MANUAL	\N
f256640a-6b09-4c4d-bc32-24c2af2b52db	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	bf88f9d5-6934-4ccb-9a14-72a70ffd18af	\N	\N	PRESENT	2026-05-20 06:49:37.27	MANUAL	\N
fa8c5498-33da-47fb-af69-c9cec01d3b7f	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	a2facb1d-d19e-4689-92a1-4dc7f850bb69	\N	\N	PRESENT	2026-05-20 06:49:37.271	MANUAL	\N
3ac1a3bc-6772-4aa4-bfb8-535e50eb79ca	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	f13407e2-1aea-4523-b5ed-e6f58fd6d368	\N	\N	PRESENT	2026-05-20 06:49:37.273	MANUAL	\N
06d3ad7b-dd0b-431a-94b2-11aa9ef6cbc6	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	4b6dab00-d55c-466f-a49e-d261f4c87570	\N	\N	PRESENT	2026-05-20 06:49:37.274	MANUAL	\N
c5293e49-347e-4e5a-8489-5c91bcbb8973	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	9e033035-6ca2-4706-b10b-a3cd015f5b00	\N	\N	PRESENT	2026-05-20 06:49:37.275	MANUAL	\N
8062ea16-cf6f-405b-a7d4-68fd41d2600b	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	74d135ee-b8a7-4137-951a-dc4898ff4451	\N	\N	PRESENT	2026-05-20 06:49:37.276	MANUAL	\N
a8323def-cdd0-41a9-ba03-1633dd1558d7	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	f1c66b29-be4b-41ae-8e1b-a707a2cb8893	\N	\N	PRESENT	2026-05-20 06:49:37.278	MANUAL	\N
da9dac31-8be8-416a-82e2-e5194f095b67	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	efec78ed-a3ce-4306-aa5d-a78cb7dc4439	\N	\N	PRESENT	2026-05-20 06:49:37.279	MANUAL	\N
6e3e050e-eb63-4cf8-8abd-f726b8fc7b1a	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	d0095111-4f2f-4d13-acf6-c83b356c3d0a	\N	\N	PRESENT	2026-05-20 06:49:37.28	MANUAL	\N
6dbb3c6d-7c88-447f-a208-762a9dd21d77	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	8404911d-3139-4f4c-8e9b-cbd4e703ddf6	\N	\N	PRESENT	2026-05-20 06:49:37.281	MANUAL	\N
e46f6eff-96b7-41e2-8d39-ec273d8aaf8d	default-tenant-id	0ecf5861-f598-4012-b05a-f01184f9b284	4867b73b-742d-4675-983e-994381643be9	\N	\N	PRESENT	2026-05-20 06:49:37.282	MANUAL	\N
96262457-4e41-48cf-bb56-d17a89ac1a5a	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	32dd462a-1938-4468-a4e1-638640fad0e7	\N	\N	PRESENT	2026-05-20 06:49:37.286	MANUAL	\N
92e9445f-c4c1-438e-9af5-f91d7e017ef8	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	5ab36650-61da-4ddb-b9a2-a832166fc45e	\N	\N	PRESENT	2026-05-20 06:49:37.287	MANUAL	\N
fe77e4be-8411-4286-8453-8d871c923e21	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	3e6ca72a-5085-4bb7-9116-e992efa10b27	\N	\N	PRESENT	2026-05-20 06:49:37.288	MANUAL	\N
15bf9445-11ed-4398-92f3-90a22e042078	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	08fafbd6-285c-4b4a-b9d4-0edce7c34521	\N	\N	PRESENT	2026-05-20 06:49:37.289	MANUAL	\N
fd45c83e-29e1-42ec-9b18-4dedb609507b	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	a3695171-a8ec-4bab-8e6c-e8420e194dfa	\N	\N	PRESENT	2026-05-20 06:49:37.29	MANUAL	\N
c1d34f42-e4e1-4934-afe7-6276cabe10b8	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	403a03ca-341c-42b4-b013-e6a7a891cbfe	\N	\N	PRESENT	2026-05-20 06:49:37.291	MANUAL	\N
3a508dbd-8914-44eb-a850-b79367b4326b	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	1b54d681-9526-4421-9648-eae426a8a982	\N	\N	PRESENT	2026-05-20 06:49:37.292	MANUAL	\N
e1bf2912-b71d-4fcb-a675-35957a3bd527	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	35c29c25-08e9-495d-b1ee-f29a8316d929	\N	\N	PRESENT	2026-05-20 06:49:37.293	MANUAL	\N
acd30545-6ef4-44e4-9eb6-7bc454fd0dfd	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	bf88f9d5-6934-4ccb-9a14-72a70ffd18af	\N	\N	PRESENT	2026-05-20 06:49:37.293	MANUAL	\N
710b9cd8-4400-422e-a0ac-25c6411b050f	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	a2facb1d-d19e-4689-92a1-4dc7f850bb69	\N	\N	PRESENT	2026-05-20 06:49:37.294	MANUAL	\N
d97f675e-1b91-4fcf-91b8-0ed0438374c8	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	f13407e2-1aea-4523-b5ed-e6f58fd6d368	\N	\N	PRESENT	2026-05-20 06:49:37.295	MANUAL	\N
221efb5b-2a63-4d92-8d6a-4afb2041ae2e	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	4b6dab00-d55c-466f-a49e-d261f4c87570	\N	\N	PRESENT	2026-05-20 06:49:37.295	MANUAL	\N
0c3ac287-b7ef-458a-8ded-49119055c9a2	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	9e033035-6ca2-4706-b10b-a3cd015f5b00	\N	\N	PRESENT	2026-05-20 06:49:37.296	MANUAL	\N
22a6a222-53ed-45dd-ac00-58a5ab60e0e7	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	74d135ee-b8a7-4137-951a-dc4898ff4451	\N	\N	PRESENT	2026-05-20 06:49:37.297	MANUAL	\N
f441d19d-fdcd-4be1-b947-bea841f6d631	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	f1c66b29-be4b-41ae-8e1b-a707a2cb8893	\N	\N	PRESENT	2026-05-20 06:49:37.297	MANUAL	\N
d5a10734-9d31-4a34-a5b0-24b7852648d8	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	efec78ed-a3ce-4306-aa5d-a78cb7dc4439	\N	\N	PRESENT	2026-05-20 06:49:37.298	MANUAL	\N
93609d52-f90c-4097-a501-c50341c670b1	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	d0095111-4f2f-4d13-acf6-c83b356c3d0a	\N	\N	PRESENT	2026-05-20 06:49:37.299	MANUAL	\N
de891748-1b7e-4ebb-b431-b218abe1023a	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	8404911d-3139-4f4c-8e9b-cbd4e703ddf6	\N	\N	PRESENT	2026-05-20 06:49:37.3	MANUAL	\N
54ace1ea-285a-4704-9ed5-bad5ecb6e6f2	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	4867b73b-742d-4675-983e-994381643be9	\N	\N	PRESENT	2026-05-20 06:49:37.301	MANUAL	\N
59e243e3-d1a1-4ac6-a752-145fa475831d	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	0e7855c1-e24d-4bfe-a750-f137064628ed	\N	\N	PRESENT	2026-05-20 06:49:37.302	MANUAL	\N
40e79123-2e5f-4be3-a7b7-68c102b5d6e5	default-tenant-id	5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	4b707156-1f9a-4bb9-9d89-03d8a0ddeaf1	\N	\N	PRESENT	2026-05-20 06:49:37.303	MANUAL	\N
beb61980-d9be-4956-8528-837dfd78a965	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	3e6ca72a-5085-4bb7-9116-e992efa10b27	\N	\N	PRESENT	2026-05-20 06:49:37.306	MANUAL	\N
c4369121-5af6-4d4d-8591-a13aeaea0ddd	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	08fafbd6-285c-4b4a-b9d4-0edce7c34521	\N	\N	PRESENT	2026-05-20 06:49:37.307	MANUAL	\N
41263354-3624-49fd-904c-3b895fd0df4f	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	a3695171-a8ec-4bab-8e6c-e8420e194dfa	\N	\N	PRESENT	2026-05-20 06:49:37.307	MANUAL	\N
c5516830-6ee4-480c-a5a2-5865cbb4202f	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	403a03ca-341c-42b4-b013-e6a7a891cbfe	\N	\N	PRESENT	2026-05-20 06:49:37.308	MANUAL	\N
74608c81-2da4-4371-a5c0-28f2378ed5b5	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	1b54d681-9526-4421-9648-eae426a8a982	\N	\N	PRESENT	2026-05-20 06:49:37.309	MANUAL	\N
0120d35f-d278-4bf2-aae1-c221ec9ded2f	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	35c29c25-08e9-495d-b1ee-f29a8316d929	\N	\N	PRESENT	2026-05-20 06:49:37.31	MANUAL	\N
9cbf1a19-a671-4823-8be9-db33d6e3a814	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	bf88f9d5-6934-4ccb-9a14-72a70ffd18af	\N	\N	PRESENT	2026-05-20 06:49:37.311	MANUAL	\N
67affe9f-94e1-4719-89f0-aece650d850b	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	a2facb1d-d19e-4689-92a1-4dc7f850bb69	\N	\N	PRESENT	2026-05-20 06:49:37.312	MANUAL	\N
18b18e9a-30e6-4bb9-aeed-86b4d8d4afdc	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	f13407e2-1aea-4523-b5ed-e6f58fd6d368	\N	\N	PRESENT	2026-05-20 06:49:37.313	MANUAL	\N
2daaee14-4860-45a1-a336-74f788414359	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	4b6dab00-d55c-466f-a49e-d261f4c87570	\N	\N	PRESENT	2026-05-20 06:49:37.314	MANUAL	\N
92f0e8fc-fa65-4ee2-b7c6-be021fa11ed5	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	9e033035-6ca2-4706-b10b-a3cd015f5b00	\N	\N	PRESENT	2026-05-20 06:49:37.315	MANUAL	\N
0568f4f9-b8e1-4aae-bde5-27ad969ac283	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	74d135ee-b8a7-4137-951a-dc4898ff4451	\N	\N	PRESENT	2026-05-20 06:49:37.316	MANUAL	\N
018a8936-8e74-49f4-8508-f461083a9a8a	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	f1c66b29-be4b-41ae-8e1b-a707a2cb8893	\N	\N	PRESENT	2026-05-20 06:49:37.317	MANUAL	\N
69dd507b-b84b-4258-b1d6-b7176d0a16f7	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	efec78ed-a3ce-4306-aa5d-a78cb7dc4439	\N	\N	PRESENT	2026-05-20 06:49:37.318	MANUAL	\N
710000be-8bc9-45d0-a416-87befc45826f	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	d0095111-4f2f-4d13-acf6-c83b356c3d0a	\N	\N	PRESENT	2026-05-20 06:49:37.319	MANUAL	\N
779c9109-8c16-4dab-988a-63ba7b2a4797	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	8404911d-3139-4f4c-8e9b-cbd4e703ddf6	\N	\N	PRESENT	2026-05-20 06:49:37.319	MANUAL	\N
a8256a84-ec33-4ccd-a7cf-42d34c3e9f4d	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	4867b73b-742d-4675-983e-994381643be9	\N	\N	PRESENT	2026-05-20 06:49:37.32	MANUAL	\N
9c53a697-c4e5-4156-b6b0-ad79ac4234e7	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	0e7855c1-e24d-4bfe-a750-f137064628ed	\N	\N	PRESENT	2026-05-20 06:49:37.321	MANUAL	\N
a3edf7fb-0ca3-43b1-b5c6-923f5fdd554a	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	4b707156-1f9a-4bb9-9d89-03d8a0ddeaf1	\N	\N	PRESENT	2026-05-20 06:49:37.322	MANUAL	\N
2883a766-a18c-4919-bff5-dc41e1619dac	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	32dd462a-1938-4468-a4e1-638640fad0e7	\N	\N	PRESENT	2026-05-20 06:49:37.323	MANUAL	\N
98662117-e70f-42ee-83d0-e28f0c56db93	default-tenant-id	29b850d4-75e4-45d6-80f2-fa71463fb1f6	5ab36650-61da-4ddb-b9a2-a832166fc45e	\N	\N	PRESENT	2026-05-20 06:49:37.324	MANUAL	\N
b1b036e8-3e4f-4cb7-934c-e4cb35858743	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	a3695171-a8ec-4bab-8e6c-e8420e194dfa	\N	\N	PRESENT	2026-05-20 06:49:37.326	MANUAL	\N
91680a96-39bd-43cb-a02e-75a58a51271b	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	403a03ca-341c-42b4-b013-e6a7a891cbfe	\N	\N	PRESENT	2026-05-20 06:49:37.327	MANUAL	\N
926d585a-e6e6-4772-994a-adc955944d66	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	1b54d681-9526-4421-9648-eae426a8a982	\N	\N	PRESENT	2026-05-20 06:49:37.328	MANUAL	\N
fc6c3890-567c-4194-b855-2cb0f160d25f	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	35c29c25-08e9-495d-b1ee-f29a8316d929	\N	\N	PRESENT	2026-05-20 06:49:37.33	MANUAL	\N
2470ee3e-c9aa-467e-9435-a3bd3a689ed1	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	bf88f9d5-6934-4ccb-9a14-72a70ffd18af	\N	\N	PRESENT	2026-05-20 06:49:37.331	MANUAL	\N
0c8dc83a-dd9b-4a04-9955-498f532b1668	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	a2facb1d-d19e-4689-92a1-4dc7f850bb69	\N	\N	PRESENT	2026-05-20 06:49:37.332	MANUAL	\N
fe9eb60a-6903-4dd9-8d04-984f70d6213f	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	f13407e2-1aea-4523-b5ed-e6f58fd6d368	\N	\N	PRESENT	2026-05-20 06:49:37.333	MANUAL	\N
ad4f9361-eac2-4f60-b25d-5108d346906d	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	4b6dab00-d55c-466f-a49e-d261f4c87570	\N	\N	PRESENT	2026-05-20 06:49:37.334	MANUAL	\N
245f205f-9d80-4137-81d1-7bb3a2fb09bd	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	9e033035-6ca2-4706-b10b-a3cd015f5b00	\N	\N	PRESENT	2026-05-20 06:49:37.335	MANUAL	\N
2640b7eb-3c7c-4996-a7d6-be9dedc19086	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	74d135ee-b8a7-4137-951a-dc4898ff4451	\N	\N	PRESENT	2026-05-20 06:49:37.336	MANUAL	\N
0a6cdc2e-b2ff-49ce-80cd-92fc781bad29	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	f1c66b29-be4b-41ae-8e1b-a707a2cb8893	\N	\N	PRESENT	2026-05-20 06:49:37.337	MANUAL	\N
de7c2b57-deaa-4a90-b1e9-0d5e8670d282	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	efec78ed-a3ce-4306-aa5d-a78cb7dc4439	\N	\N	PRESENT	2026-05-20 06:49:37.338	MANUAL	\N
3294cc11-bc94-4935-a5eb-7ff046a8bf48	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	d0095111-4f2f-4d13-acf6-c83b356c3d0a	\N	\N	PRESENT	2026-05-20 06:49:37.339	MANUAL	\N
c7037625-4397-4804-8b04-3115ff806b34	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	8404911d-3139-4f4c-8e9b-cbd4e703ddf6	\N	\N	PRESENT	2026-05-20 06:49:37.34	MANUAL	\N
c487d01f-8b9f-4b0c-b264-4a9b07f5396d	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	4867b73b-742d-4675-983e-994381643be9	\N	\N	PRESENT	2026-05-20 06:49:37.341	MANUAL	\N
54ccb613-5645-4b58-8077-8e500b6b1b84	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	0e7855c1-e24d-4bfe-a750-f137064628ed	\N	\N	PRESENT	2026-05-20 06:49:37.342	MANUAL	\N
0b71ede3-1cb9-4ea0-8438-8446c5a63c50	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	4b707156-1f9a-4bb9-9d89-03d8a0ddeaf1	\N	\N	PRESENT	2026-05-20 06:49:37.343	MANUAL	\N
0ac5b82c-3533-47dc-99be-381e0a990995	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	32dd462a-1938-4468-a4e1-638640fad0e7	\N	\N	PRESENT	2026-05-20 06:49:37.344	MANUAL	\N
21a400ab-b129-4629-87db-75867f7c4b72	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	5ab36650-61da-4ddb-b9a2-a832166fc45e	\N	\N	PRESENT	2026-05-20 06:49:37.346	MANUAL	\N
ab1e3026-0e9e-4b35-9f70-35b7552e2c35	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	3e6ca72a-5085-4bb7-9116-e992efa10b27	\N	\N	PRESENT	2026-05-20 06:49:37.347	MANUAL	\N
04fe50fd-f734-4bcd-b375-25e6a67089eb	default-tenant-id	77b01849-0bb9-492b-9976-cf3f5b603de1	08fafbd6-285c-4b4a-b9d4-0edce7c34521	\N	\N	PRESENT	2026-05-20 06:49:37.348	MANUAL	\N
03d28b3a-67aa-4486-9c57-749e1c3e3110	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	1b54d681-9526-4421-9648-eae426a8a982	\N	\N	PRESENT	2026-05-20 06:49:37.351	MANUAL	\N
6ad96f1c-ffd8-40f4-95ea-6c7d38484986	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	35c29c25-08e9-495d-b1ee-f29a8316d929	\N	\N	PRESENT	2026-05-20 06:49:37.352	MANUAL	\N
4539d577-d0f1-493b-b5a5-20040b569dac	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	bf88f9d5-6934-4ccb-9a14-72a70ffd18af	\N	\N	PRESENT	2026-05-20 06:49:37.353	MANUAL	\N
c150392f-fe20-4fbc-bea9-f6a6876a5207	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	a2facb1d-d19e-4689-92a1-4dc7f850bb69	\N	\N	PRESENT	2026-05-20 06:49:37.354	MANUAL	\N
06bd8df8-4e40-4dbb-b6a6-92a70e6c98ce	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	f13407e2-1aea-4523-b5ed-e6f58fd6d368	\N	\N	PRESENT	2026-05-20 06:49:37.355	MANUAL	\N
13ed9aed-9e81-4743-b604-9109f91f0fde	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	4b6dab00-d55c-466f-a49e-d261f4c87570	\N	\N	PRESENT	2026-05-20 06:49:37.356	MANUAL	\N
7cf7c5f2-7bd8-420b-974a-ecd23f4a943e	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	9e033035-6ca2-4706-b10b-a3cd015f5b00	\N	\N	PRESENT	2026-05-20 06:49:37.357	MANUAL	\N
a4d30863-98da-48c3-8305-e39dd5154976	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	74d135ee-b8a7-4137-951a-dc4898ff4451	\N	\N	PRESENT	2026-05-20 06:49:37.359	MANUAL	\N
81254d5b-3fc8-429a-a4ef-ae7b42255250	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	f1c66b29-be4b-41ae-8e1b-a707a2cb8893	\N	\N	PRESENT	2026-05-20 06:49:37.36	MANUAL	\N
eff98b3b-974d-42d5-81ef-73542dbcd8f5	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	efec78ed-a3ce-4306-aa5d-a78cb7dc4439	\N	\N	PRESENT	2026-05-20 06:49:37.361	MANUAL	\N
912af430-29e5-4edc-aa92-41a569ac4199	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	d0095111-4f2f-4d13-acf6-c83b356c3d0a	\N	\N	PRESENT	2026-05-20 06:49:37.362	MANUAL	\N
9d5c2bd4-8daa-4ee7-9c4b-95a12e0d3275	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	8404911d-3139-4f4c-8e9b-cbd4e703ddf6	\N	\N	PRESENT	2026-05-20 06:49:37.363	MANUAL	\N
e5b62e6b-0299-4b80-8e58-4dd20e6dfbfe	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	4867b73b-742d-4675-983e-994381643be9	\N	\N	PRESENT	2026-05-20 06:49:37.364	MANUAL	\N
0ff13d12-e554-4114-bd13-d0c3258df15d	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	0e7855c1-e24d-4bfe-a750-f137064628ed	\N	\N	PRESENT	2026-05-20 06:49:37.366	MANUAL	\N
393c5cb1-4b53-44ea-8d34-5858884fa4cb	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	4b707156-1f9a-4bb9-9d89-03d8a0ddeaf1	\N	\N	PRESENT	2026-05-20 06:49:37.367	MANUAL	\N
5ec28bc1-db28-4b29-90ae-f7696a852bed	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	32dd462a-1938-4468-a4e1-638640fad0e7	\N	\N	PRESENT	2026-05-20 06:49:37.367	MANUAL	\N
c6852f79-3b80-427f-8855-38b3360132eb	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	5ab36650-61da-4ddb-b9a2-a832166fc45e	\N	\N	PRESENT	2026-05-20 06:49:37.369	MANUAL	\N
45f269a2-9df5-4672-b714-56f1ed7041d9	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	3e6ca72a-5085-4bb7-9116-e992efa10b27	\N	\N	PRESENT	2026-05-20 06:49:37.369	MANUAL	\N
afd96e4b-8a2e-4c47-8b9e-1a6ddd5910d3	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	08fafbd6-285c-4b4a-b9d4-0edce7c34521	\N	\N	PRESENT	2026-05-20 06:49:37.37	MANUAL	\N
7b163260-28ec-4ee9-b46f-9ec36b68b96e	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	a3695171-a8ec-4bab-8e6c-e8420e194dfa	\N	\N	PRESENT	2026-05-20 06:49:37.371	MANUAL	\N
025ff537-c7c7-4b0f-91d2-b1c4d91ffa51	default-tenant-id	a8cfa133-2ee7-40c8-a2d1-28df43878700	403a03ca-341c-42b4-b013-e6a7a891cbfe	\N	\N	PRESENT	2026-05-20 06:49:37.372	MANUAL	\N
2f6584f0-25af-46d3-840b-db65dd4e891e	default-tenant-id	4395cc8f-b0d9-420b-99ed-dcf37518084f	fed7e035-15f4-4917-bfb0-621794b2ff20	\N	\N	PRESENT	2026-05-20 06:51:12.481	MANUAL	\N
e3db1f0e-cacd-45dc-9d3c-271d94a7ffc9	default-tenant-id	58a8dc60-5ac3-487f-9e9b-54809907b0b3	aba4e66d-faf2-4418-b913-292e621cccfa	\N	\N	PRESENT	2026-05-20 10:23:04.514	MANUAL	\N
\.


--
-- Data for Name: AttendanceSession; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AttendanceSession" (id, "tenantId", name, date, "startTime", "endTime", status, type, "campusId", "eventId") FROM stdin;
c8dfe044-e7cb-4401-babb-8aeb6a65931e	default-tenant-id	Sunday Service	2026-05-10 05:00:00	\N	\N	CLOSED	SERVICE	\N	6efbdb4b-71f5-41f0-b6e1-f83a93eb5577
75d94f25-c2f8-462c-bb91-52b0c73f914b	default-tenant-id	Sunday Worship Gathering	2026-05-03 05:00:00	\N	\N	CLOSED	SERVICE	\N	980b9401-6f4c-4474-9430-e99f116cec53
693a0092-50c1-48b8-820b-e0e318df3642	default-tenant-id	Sunday Service	2026-04-26 05:00:00	\N	\N	CLOSED	SERVICE	\N	a2ae4317-c5d7-479e-915c-78b9c9aea44d
0ecf5861-f598-4012-b05a-f01184f9b284	default-tenant-id	Sunday Worship Gathering	2026-04-19 05:00:00	\N	\N	CLOSED	SERVICE	\N	3acb7748-9a47-46b3-85f2-eee6013453d2
5c911c7e-568a-4d0e-b99d-9d13edc7ea8e	default-tenant-id	Wednesday Bible Study	2026-05-16 13:30:00	\N	\N	CLOSED	GROUP	\N	a193778a-0b79-4eb9-b38d-e54b1be1108c
29b850d4-75e4-45d6-80f2-fa71463fb1f6	default-tenant-id	Youth Service	2026-05-14 13:15:00	\N	\N	CLOSED	GROUP	\N	4d70e679-e546-4ae8-a41f-de99a1b66881
77b01849-0bb9-492b-9976-cf3f5b603de1	default-tenant-id	Community Thanksgiving Dinner	2026-06-01 11:30:00	\N	\N	CLOSED	GROUP	\N	9deac610-3103-4c8a-9c2d-09b799050791
a8cfa133-2ee7-40c8-a2d1-28df43878700	default-tenant-id	Guest Speaker Night	2026-05-25 13:00:00	\N	\N	CLOSED	GROUP	\N	fe0522ba-9060-4327-a10b-bc5879de005b
4395cc8f-b0d9-420b-99ed-dcf37518084f	default-tenant-id	E2E Service	2026-05-20 06:51:12.453	\N	\N	OPEN	EVENT	\N	d45d96a6-1138-4640-955b-ef26504c58dd
61c2f78b-54cc-4f24-92bf-22b59423c11a	default-tenant-id	PW Smoke 1779260046564	2026-05-20 06:54:06.581	\N	\N	OPEN	SERVICE	\N	\N
4e6016de-45d7-4e6c-ace1-3a641ee7037d	default-tenant-id	PW Smoke 1779260885231	2026-05-20 07:08:05.241	\N	\N	OPEN	SERVICE	\N	\N
9f760b9b-70fb-4d65-b13a-a5d2a8a37ea0	default-tenant-id	PW Smoke 1779261229052	2026-05-20 07:13:49.063	\N	\N	OPEN	SERVICE	\N	\N
7104422a-a233-4c78-ba70-7fdc22f8de87	default-tenant-id	PW Smoke 1779262134435	2026-05-20 07:28:54.449	\N	\N	OPEN	SERVICE	\N	\N
58a8dc60-5ac3-487f-9e9b-54809907b0b3	default-tenant-id	E2E Service	2026-05-20 10:23:04.492	\N	\N	OPEN	EVENT	\N	8c3b63d9-cbf6-4f12-9b6d-376fd675e256
49c2b28d-ea74-4d90-bf82-7748f49254bd	default-tenant-id	PW Smoke 1779275825980	2026-05-20 11:17:05.999	\N	\N	OPEN	SERVICE	\N	\N
cdbb40c1-e00d-4f61-9c5f-37d5fc35aa96	default-tenant-id	PW Smoke 1779300998587	2026-05-20 18:16:38.603	\N	\N	OPEN	SERVICE	\N	\N
4636aa88-eb6f-481c-8021-bf9da1b27f5f	default-tenant-id	PW Smoke 1779374811270	2026-05-21 14:46:51.287	\N	\N	OPEN	SERVICE	\N	\N
\.


--
-- Data for Name: BackupRun; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BackupRun" (id, "tenantId", status, "storageKey", "sizeBytes", verified, "errorDetail", "createdAt") FROM stdin;
4f97097b-eea3-4f02-bb72-862ebb29cad3	default-tenant-id	completed	tenant-backup-default-tenant-id-4f97097b-eea3-4f02-bb72-862ebb29cad3.json	27600	t	\N	2026-05-20 06:55:55.183
7115caec-c294-4472-9828-9a1fd899d9e4	default-tenant-id	completed	tenant-backup-default-tenant-id-7115caec-c294-4472-9828-9a1fd899d9e4.json	32235	t	\N	2026-05-20 07:31:20.423
3729e2b6-5632-4724-91a1-20d02088e5ee	default-tenant-id	completed	tenant-backup-default-tenant-id-3729e2b6-5632-4724-91a1-20d02088e5ee.json	42970	t	\N	2026-05-20 17:27:46.264
e99b4484-70c2-4abf-ad4a-6b88227f2528	default-tenant-id	completed	tenant-backup-default-tenant-id-e99b4484-70c2-4abf-ad4a-6b88227f2528.json	48018	t	\N	2026-05-21 17:22:46.288
47997928-877d-4167-8ad1-7ce90307b93a	default-tenant-id	completed	tenant-backup-default-tenant-id-47997928-877d-4167-8ad1-7ce90307b93a.json	48019	t	\N	2026-05-24 08:42:39.467
\.


--
-- Data for Name: BankReconciliationSession; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BankReconciliationSession" (id, "tenantId", "accountId", "fromDate", "toDate", status, "closedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BankStatementLine; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BankStatementLine" (id, "tenantId", "sessionId", "accountId", "txnDate", amount, direction, reference, description, "isMatched", "matchedVoucherId", "matchedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Budget; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Budget" (id, "tenantId", "financialYearId", "fundId", "costCenterId", amount, "trackingMode") FROM stdin;
\.


--
-- Data for Name: Campaign; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Campaign" (id, "tenantId", name, goal, "startDate", "endDate", "defaultFundId", "createdAt", "updatedAt") FROM stdin;
73fd77c1-8427-482b-a24c-ebaa6aeed08c	default-tenant-id	Tithes	\N	\N	\N	\N	2026-05-20 06:49:37.376	2026-05-20 06:49:37.376
8cd99706-c1a3-4c87-b1ea-c32b34b614e1	default-tenant-id	General Offerings	\N	\N	\N	\N	2026-05-20 06:49:37.379	2026-05-20 06:49:37.379
cecdf942-d337-4e6f-a7b9-ad8ad51862ce	default-tenant-id	Building Fund	\N	\N	\N	\N	2026-05-20 06:49:37.382	2026-05-20 06:49:37.382
ec3455aa-04bf-41c3-bfc5-8a869cf21133	default-tenant-id	Missions Fund	\N	\N	\N	\N	2026-05-20 06:49:37.384	2026-05-20 06:49:37.384
\.


--
-- Data for Name: Campus; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Campus" (id, "tenantId", name, type, leader, address, "upiId", "bankInfo", departments, "createdAt", "updatedAt") FROM stdin;
33a7c5a0-6fe6-485c-84c3-845d8877dd0a	default-tenant-id	Main Campus	Primary	74d135ee-b8a7-4137-951a-dc4898ff4451	\N	\N	\N	{}	2026-05-20 06:49:37.076	2026-05-20 06:49:39.717
\.


--
-- Data for Name: CareCase; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CareCase" (id, "tenantId", "memberId", "assignedUserId", category, urgency, "confidentialityLevel", status, "createdById", "updatedById", "createdAt", "updatedAt") FROM stdin;
f9e31a22-274e-4403-b9c6-20fd41d8996d	default-tenant-id	957bc638-6ec7-4c1a-b343-de8fb625ccd4	\N	General Pastoral Care	MEDIUM	PASTORAL	OPEN	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	\N	2026-05-20 06:53:39.475	2026-05-20 06:53:39.475
bf120795-8af8-41bd-bed3-af539938f5eb	default-tenant-id	1123e00f-6a65-4e2e-baff-74fdace3fe37	\N	General Pastoral Care	MEDIUM	PASTORAL	OPEN	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	\N	2026-05-20 07:07:54.957	2026-05-20 07:07:54.957
12e60bfa-1718-4973-be94-c34886dadd9e	default-tenant-id	e1cd4a3a-1425-463f-9a8e-9e4f0bfdd25b	\N	General Pastoral Care	MEDIUM	PASTORAL	OPEN	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	\N	2026-05-20 07:13:39.025	2026-05-20 07:13:39.025
c09e2724-5cb9-4c04-9a55-09975ec6593a	default-tenant-id	05e6bcf1-3d05-4bc0-9019-f612c5dea737	\N	General Pastoral Care	MEDIUM	PASTORAL	OPEN	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	\N	2026-05-20 07:28:44.395	2026-05-20 07:28:44.395
0e46ced9-4d34-46cd-9202-3b4e14287581	default-tenant-id	14bf9867-357d-46f3-8203-1eee5e129153	\N	General Pastoral Care	MEDIUM	PASTORAL	OPEN	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	\N	2026-05-20 11:16:52.632	2026-05-20 11:16:52.632
5aaef236-08a6-48b2-972e-d3dc8ebaed79	default-tenant-id	2ad34cf4-a3e3-40f2-8436-7ed668803986	\N	Pastoral follow-up	MEDIUM	PASTORAL	OPEN	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	\N	2026-05-20 12:20:32.588	2026-05-20 12:20:32.588
e97bddfe-c16a-4634-bb42-ecdba20fe142	default-tenant-id	352be535-1722-4f5a-a659-09943ac51095	\N	General Pastoral Care	MEDIUM	PASTORAL	OPEN	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	\N	2026-05-20 18:16:26.886	2026-05-20 18:16:26.886
53262ce1-cd20-4fa2-9c66-b666a06e7820	default-tenant-id	3ff916c5-e8c6-4e9f-baef-b233545a9e0f	\N	General Pastoral Care	MEDIUM	PASTORAL	OPEN	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	\N	2026-05-21 14:46:38.717	2026-05-21 14:46:38.717
\.


--
-- Data for Name: CareLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CareLog" (id, "tenantId", "careCaseId", "authorId", "interactionType", content, date, "createdById", "createdAt") FROM stdin;
637c964d-34eb-4f3c-92fc-9de98a449373	default-tenant-id	f9e31a22-274e-4403-b9c6-20fd41d8996d	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	Note	Pastoral follow-up 1779260015731	2026-05-20 06:53:39.675	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	2026-05-20 06:53:39.675
796cc9d5-ecef-454f-b3f0-cea7e2fbd542	default-tenant-id	bf120795-8af8-41bd-bed3-af539938f5eb	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	Note	Pastoral follow-up 1779260871160	2026-05-20 07:07:55.258	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	2026-05-20 07:07:55.258
afd3740f-2085-4ecf-919a-cb16241a314c	default-tenant-id	12e60bfa-1718-4973-be94-c34886dadd9e	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	Note	Pastoral follow-up 1779261215058	2026-05-20 07:13:39.201	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	2026-05-20 07:13:39.201
ace95e3d-e5b0-4cc1-9bcd-5bc50a52bec9	default-tenant-id	c09e2724-5cb9-4c04-9a55-09975ec6593a	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	Note	Pastoral follow-up 1779262120692	2026-05-20 07:28:44.592	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	2026-05-20 07:28:44.592
624c20bd-84f1-4bd3-8ea8-46d56b8ec5fc	default-tenant-id	0e46ced9-4d34-46cd-9202-3b4e14287581	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	Note	Pastoral follow-up 1779275808239	2026-05-20 11:16:52.934	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	2026-05-20 11:16:52.934
40918b74-80e0-46f5-82a1-dc944f0a9d6c	default-tenant-id	e97bddfe-c16a-4634-bb42-ecdba20fe142	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	Note	Pastoral follow-up 1779300982225	2026-05-20 18:16:27.062	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	2026-05-20 18:16:27.062
10dd6209-569e-4fe3-ba7a-58fbdcd7f712	default-tenant-id	53262ce1-cd20-4fa2-9c66-b666a06e7820	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	Note	Pastoral follow-up 1779374793851	2026-05-21 14:46:38.913	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	2026-05-21 14:46:38.913
\.


--
-- Data for Name: CareNote; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CareNote" (id, "tenantId", "memberId", "authorId", note, date, "createdAt", "updatedAt") FROM stdin;
e6af4bd8-3796-4a3d-8300-9bb746abc3e0	default-tenant-id	2ad34cf4-a3e3-40f2-8436-7ed668803986	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	hif-ecopark-sim: Follow-up after Sunday — family doing well, schedule home visit.	2026-05-20 12:16:37.84	2026-05-20 12:16:37.84	2026-05-20 12:16:37.84
356ec898-ea69-4ce9-9e16-565f34d2aa0a	default-tenant-id	2ad34cf4-a3e3-40f2-8436-7ed668803986	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	hif-ecopark-sim: Follow-up after Sunday — family doing well, schedule home visit.	2026-05-20 12:18:34.72	2026-05-20 12:18:34.72	2026-05-20 12:18:34.72
ca4efd55-13ab-441e-afb8-71f0b0e5ef9e	default-tenant-id	2ad34cf4-a3e3-40f2-8436-7ed668803986	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	hif-ecopark-sim: Follow-up after Sunday — family doing well, schedule home visit.	2026-05-20 12:20:32.575	2026-05-20 12:20:32.575	2026-05-20 12:20:32.575
\.


--
-- Data for Name: CommunicationCampaign; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CommunicationCampaign" (id, "tenantId", title, body, channels, "audienceFilter", status, "scheduledAt", "sentAt", "createdById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: CommunicationDelivery; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CommunicationDelivery" (id, "tenantId", "campaignId", channel, "recipientKey", "memberId", "userId", status, "openedAt", "deliveredAt", "errorMessage", "createdAt") FROM stdin;
\.


--
-- Data for Name: CommunicationLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CommunicationLog" (id, "tenantId", type, recipient, subject, content, status, "sentAt") FROM stdin;
\.


--
-- Data for Name: Contact; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Contact" (id, "tenantId", name, email, phone, status, source, "memberId", "visitCount", "lastVisitAt", "assignedUserId", "isFirstVisit", "createdAt", "updatedAt") FROM stdin;
7bd66d49-0618-47fd-ad02-cfe8727baeb4	default-tenant-id	hif-ecopark-sim Visitor — Ananya Das	\N	+91 99887 76655	Contacted	Sunday	\N	2	2026-05-20 12:20:32.761	\N	f	2026-05-20 12:18:34.987	2026-05-20 12:20:32.763
\.


--
-- Data for Name: CostCenter; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CostCenter" (id, "tenantId", name, code, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Document" (id, "tenantId", title, category, url, "uploadedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Donation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Donation" (id, "tenantId", "donorId", "campaignId", "fundId", "eventId", "voucherId", "reversalVoucherId", "feeVoucherId", "settlementVoucherId", "gatewayPaymentOrderId", "gatewaySettlementId", "serviceCollectionSessionId", amount, "grossAmount", "netSettlementAmount", "gatewayFeeAmount", "donorCoveredFee", date, method, reference, "donationCategory", "isAnonymous", source, "sourceRefId", gateway, "gatewayOrderId", "gatewayPaymentId", "settlementStatus", "reconciliationState", notes, status, "createdAt", "updatedAt") FROM stdin;
c4f15756-b9c5-4be7-8517-a15e0867f9cc	default-tenant-id	74d135ee-b8a7-4137-951a-dc4898ff4451	73fd77c1-8427-482b-a24c-ebaa6aeed08c	\N	\N	\N	\N	\N	\N	\N	\N	\N	14180.00	\N	\N	\N	\N	2026-05-20 06:49:37.395	Cash	SEED-1779259777038-D-001	\N	f	seed	SEED-1779259777038-D-001	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:37.404	2026-05-20 06:49:37.404
f39821f4-91ac-4557-a14f-85b7f738d1d1	default-tenant-id	f1c66b29-be4b-41ae-8e1b-a707a2cb8893	8cd99706-c1a3-4c87-b1ea-c32b34b614e1	\N	\N	\N	\N	\N	\N	\N	\N	\N	205.00	\N	\N	\N	\N	2026-05-19 06:49:37.912	Card	SEED-1779259777038-D-002	\N	f	seed	SEED-1779259777038-D-002	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:37.919	2026-05-20 06:49:37.919
fa253149-9210-4117-b63a-e82224ec5079	default-tenant-id	efec78ed-a3ce-4306-aa5d-a78cb7dc4439	cecdf942-d337-4e6f-a7b9-ad8ad51862ce	\N	\N	\N	\N	\N	\N	\N	\N	\N	300.00	\N	\N	\N	\N	2026-05-18 06:49:38.023	Bank Transfer	SEED-1779259777038-D-003	\N	f	seed	SEED-1779259777038-D-003	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:38.03	2026-05-20 06:49:38.03
32053051-e4aa-4009-b4b6-0134a56ecb8d	default-tenant-id	d0095111-4f2f-4d13-acf6-c83b356c3d0a	ec3455aa-04bf-41c3-bfc5-8a869cf21133	\N	\N	\N	\N	\N	\N	\N	\N	\N	395.00	\N	\N	\N	\N	2026-05-17 06:49:38.143	Cash	SEED-1779259777038-D-004	\N	f	seed	SEED-1779259777038-D-004	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:38.151	2026-05-20 06:49:38.151
a9036195-e92d-40fd-b5b0-9470cf084926	default-tenant-id	8404911d-3139-4f4c-8e9b-cbd4e703ddf6	73fd77c1-8427-482b-a24c-ebaa6aeed08c	\N	\N	\N	\N	\N	\N	\N	\N	\N	330.00	\N	\N	\N	\N	2026-05-16 06:49:38.241	Card	SEED-1779259777038-D-005	\N	f	seed	SEED-1779259777038-D-005	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:38.248	2026-05-20 06:49:38.248
1e03ed19-3448-4027-b287-1f4c15a1b5d6	default-tenant-id	4867b73b-742d-4675-983e-994381643be9	8cd99706-c1a3-4c87-b1ea-c32b34b614e1	\N	\N	\N	\N	\N	\N	\N	\N	\N	425.00	\N	\N	\N	\N	2026-05-15 06:49:38.321	Bank Transfer	SEED-1779259777038-D-006	\N	f	seed	SEED-1779259777038-D-006	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:38.329	2026-05-20 06:49:38.329
37aebd79-7ac4-4972-ab2c-949f2822f64d	default-tenant-id	0e7855c1-e24d-4bfe-a750-f137064628ed	cecdf942-d337-4e6f-a7b9-ad8ad51862ce	\N	\N	\N	\N	\N	\N	\N	\N	\N	520.00	\N	\N	\N	\N	2026-05-14 06:49:38.408	Cash	SEED-1779259777038-D-007	\N	f	seed	SEED-1779259777038-D-007	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:38.417	2026-05-20 06:49:38.417
b0bd452b-2781-42e7-aeaf-71fa6064e59c	default-tenant-id	4b707156-1f9a-4bb9-9d89-03d8a0ddeaf1	ec3455aa-04bf-41c3-bfc5-8a869cf21133	\N	\N	\N	\N	\N	\N	\N	\N	\N	230.00	\N	\N	\N	\N	2026-05-13 06:49:38.496	Card	SEED-1779259777038-D-008	\N	f	seed	SEED-1779259777038-D-008	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:38.504	2026-05-20 06:49:38.504
6ae28ebd-9714-4575-b087-e79026b17434	default-tenant-id	74d135ee-b8a7-4137-951a-dc4898ff4451	73fd77c1-8427-482b-a24c-ebaa6aeed08c	\N	\N	\N	\N	\N	\N	\N	\N	\N	165.00	\N	\N	\N	\N	2026-05-12 06:49:38.569	Bank Transfer	SEED-1779259777038-D-009	\N	f	seed	SEED-1779259777038-D-009	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:38.573	2026-05-20 06:49:38.573
48285772-ff6b-4525-a23b-ff9207a07f45	default-tenant-id	f1c66b29-be4b-41ae-8e1b-a707a2cb8893	8cd99706-c1a3-4c87-b1ea-c32b34b614e1	\N	\N	\N	\N	\N	\N	\N	\N	\N	440.00	\N	\N	\N	\N	2026-05-11 06:49:38.629	Cash	SEED-1779259777038-D-010	\N	f	seed	SEED-1779259777038-D-010	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:38.635	2026-05-20 06:49:38.635
e892a2dc-d829-4551-9910-311a7567b4a2	default-tenant-id	efec78ed-a3ce-4306-aa5d-a78cb7dc4439	cecdf942-d337-4e6f-a7b9-ad8ad51862ce	\N	\N	\N	\N	\N	\N	\N	\N	\N	355.00	\N	\N	\N	\N	2026-05-10 06:49:38.704	Card	SEED-1779259777038-D-011	\N	f	seed	SEED-1779259777038-D-011	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:38.712	2026-05-20 06:49:38.712
614234f9-eaa7-4e07-ac31-3c943f35e27b	default-tenant-id	d0095111-4f2f-4d13-acf6-c83b356c3d0a	ec3455aa-04bf-41c3-bfc5-8a869cf21133	\N	\N	\N	\N	\N	\N	\N	\N	\N	6900.00	\N	\N	\N	\N	2026-05-07 06:49:38.773	Bank Transfer	SEED-1779259777038-D-012	\N	f	seed	SEED-1779259777038-D-012	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:38.778	2026-05-20 06:49:38.778
42abf449-73e5-4c3e-8428-c068e585ec82	default-tenant-id	8404911d-3139-4f4c-8e9b-cbd4e703ddf6	73fd77c1-8427-482b-a24c-ebaa6aeed08c	\N	\N	\N	\N	\N	\N	\N	\N	\N	385.00	\N	\N	\N	\N	2026-05-06 06:49:38.826	Cash	SEED-1779259777038-D-013	\N	f	seed	SEED-1779259777038-D-013	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:38.829	2026-05-20 06:49:38.829
10468cea-708e-4376-a3a4-3fb7fd9e773a	default-tenant-id	4867b73b-742d-4675-983e-994381643be9	8cd99706-c1a3-4c87-b1ea-c32b34b614e1	\N	\N	\N	\N	\N	\N	\N	\N	\N	480.00	\N	\N	\N	\N	2026-05-05 06:49:38.876	Card	SEED-1779259777038-D-014	\N	f	seed	SEED-1779259777038-D-014	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:38.88	2026-05-20 06:49:38.88
d7ee865d-e1f1-4279-a29c-405c89f96dc8	default-tenant-id	0e7855c1-e24d-4bfe-a750-f137064628ed	cecdf942-d337-4e6f-a7b9-ad8ad51862ce	\N	\N	\N	\N	\N	\N	\N	\N	\N	190.00	\N	\N	\N	\N	2026-05-04 06:49:38.919	Bank Transfer	SEED-1779259777038-D-015	\N	f	seed	SEED-1779259777038-D-015	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:38.924	2026-05-20 06:49:38.924
d7b3d82a-35c0-480c-842c-9369f9f74cdf	default-tenant-id	4b707156-1f9a-4bb9-9d89-03d8a0ddeaf1	ec3455aa-04bf-41c3-bfc5-8a869cf21133	\N	\N	\N	\N	\N	\N	\N	\N	\N	285.00	\N	\N	\N	\N	2026-05-03 06:49:38.97	Cash	SEED-1779259777038-D-016	\N	f	seed	SEED-1779259777038-D-016	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:38.974	2026-05-20 06:49:38.974
f016cb47-1e7e-4b44-bcd3-06784a7b5451	default-tenant-id	74d135ee-b8a7-4137-951a-dc4898ff4451	73fd77c1-8427-482b-a24c-ebaa6aeed08c	\N	\N	\N	\N	\N	\N	\N	\N	\N	220.00	\N	\N	\N	\N	2026-05-02 06:49:39.02	Card	SEED-1779259777038-D-017	\N	f	seed	SEED-1779259777038-D-017	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:39.024	2026-05-20 06:49:39.024
c97d8da4-452e-4304-8078-1a36e481d209	default-tenant-id	f1c66b29-be4b-41ae-8e1b-a707a2cb8893	8cd99706-c1a3-4c87-b1ea-c32b34b614e1	\N	\N	\N	\N	\N	\N	\N	\N	\N	15000.00	\N	\N	\N	\N	2026-05-01 06:49:39.066	Bank Transfer	SEED-1779259777038-D-018	\N	f	seed	SEED-1779259777038-D-018	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:39.07	2026-05-20 06:49:39.07
d5314d6c-ccf0-466e-abab-939e0de79980	default-tenant-id	0e7855c1-e24d-4bfe-a750-f137064628ed	cecdf942-d337-4e6f-a7b9-ad8ad51862ce	\N	\N	\N	\N	\N	\N	\N	\N	\N	410.00	\N	\N	\N	\N	2026-04-30 06:49:39.117	Cash	SEED-1779259777038-D-019	\N	f	seed	SEED-1779259777038-D-019	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:39.12	2026-05-20 06:49:39.12
711e721f-0082-47b0-87e1-6cd34ec198db	default-tenant-id	4b6dab00-d55c-466f-a49e-d261f4c87570	ec3455aa-04bf-41c3-bfc5-8a869cf21133	\N	\N	\N	\N	\N	\N	\N	\N	\N	505.00	\N	\N	\N	\N	2026-04-29 06:49:39.175	Card	SEED-1779259777038-D-020	\N	f	seed	SEED-1779259777038-D-020	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:39.178	2026-05-20 06:49:39.178
582ca844-40bd-491e-923e-e3581a99d415	default-tenant-id	08fafbd6-285c-4b4a-b9d4-0edce7c34521	73fd77c1-8427-482b-a24c-ebaa6aeed08c	\N	\N	\N	\N	\N	\N	\N	\N	\N	560.00	\N	\N	\N	\N	2026-04-28 06:49:39.221	Bank Transfer	SEED-1779259777038-D-021	\N	f	seed	SEED-1779259777038-D-021	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:39.225	2026-05-20 06:49:39.225
8dfd9ce7-28b7-4041-9981-629eb38d2709	default-tenant-id	d0095111-4f2f-4d13-acf6-c83b356c3d0a	8cd99706-c1a3-4c87-b1ea-c32b34b614e1	\N	\N	\N	\N	\N	\N	\N	\N	\N	230.00	\N	\N	\N	\N	2026-04-27 06:49:39.272	Cash	SEED-1779259777038-D-022	\N	f	seed	SEED-1779259777038-D-022	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:39.274	2026-05-20 06:49:39.274
6481ec5f-af80-461a-a7ac-6be0dfcd23af	default-tenant-id	bf88f9d5-6934-4ccb-9a14-72a70ffd18af	cecdf942-d337-4e6f-a7b9-ad8ad51862ce	\N	\N	\N	\N	\N	\N	\N	\N	\N	7300.00	\N	\N	\N	\N	2026-04-24 06:49:39.321	Card	SEED-1779259777038-D-023	\N	f	seed	SEED-1779259777038-D-023	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:39.324	2026-05-20 06:49:39.324
a51ac41e-d7b0-4015-ac87-8df16060f56e	default-tenant-id	32dd462a-1938-4468-a4e1-638640fad0e7	ec3455aa-04bf-41c3-bfc5-8a869cf21133	\N	\N	\N	\N	\N	\N	\N	\N	\N	220.00	\N	\N	\N	\N	2026-04-23 06:49:39.368	Bank Transfer	SEED-1779259777038-D-024	\N	f	seed	SEED-1779259777038-D-024	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:39.37	2026-05-20 06:49:39.37
a8872ec0-34fc-4100-ba58-13bf622c211e	default-tenant-id	74d135ee-b8a7-4137-951a-dc4898ff4451	73fd77c1-8427-482b-a24c-ebaa6aeed08c	\N	\N	\N	\N	\N	\N	\N	\N	\N	455.00	\N	\N	\N	\N	2026-04-22 06:49:39.42	Cash	SEED-1779259777038-D-025	\N	f	seed	SEED-1779259777038-D-025	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:39.423	2026-05-20 06:49:39.423
7e9c2854-cf8b-4c1f-aa9a-a43a62f48056	default-tenant-id	403a03ca-341c-42b4-b013-e6a7a891cbfe	8cd99706-c1a3-4c87-b1ea-c32b34b614e1	\N	\N	\N	\N	\N	\N	\N	\N	\N	370.00	\N	\N	\N	\N	2026-04-21 06:49:39.462	Card	SEED-1779259777038-D-026	\N	f	seed	SEED-1779259777038-D-026	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:39.468	2026-05-20 06:49:39.468
748b3115-00a1-48ad-a9dd-35093e3f7c1b	default-tenant-id	4867b73b-742d-4675-983e-994381643be9	cecdf942-d337-4e6f-a7b9-ad8ad51862ce	\N	\N	\N	\N	\N	\N	\N	\N	\N	425.00	\N	\N	\N	\N	2026-04-20 06:49:39.502	Bank Transfer	SEED-1779259777038-D-027	\N	f	seed	SEED-1779259777038-D-027	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:39.504	2026-05-20 06:49:39.504
d2379808-190d-4212-bd44-57e6dfaed220	default-tenant-id	f13407e2-1aea-4523-b5ed-e6f58fd6d368	ec3455aa-04bf-41c3-bfc5-8a869cf21133	\N	\N	\N	\N	\N	\N	\N	\N	\N	520.00	\N	\N	\N	\N	2026-04-19 06:49:39.559	Cash	SEED-1779259777038-D-028	\N	f	seed	SEED-1779259777038-D-028	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:49:39.561	2026-05-20 06:49:39.561
0188bf33-9418-4577-8ea9-632c6d58f85a	default-tenant-id	\N	\N	\N	\N	4af4b97f-fb46-4413-b8e8-d5efa809ec9f	\N	\N	\N	\N	\N	\N	250.00	\N	\N	\N	\N	2026-05-20 06:51:12.56	Bank Transfer	E2E-TXN-1779259872528	\N	f	user	\N	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 06:51:12.569	2026-05-20 06:51:12.687
3c3d90ee-a62a-42b1-8431-ff1ad005756d	default-tenant-id	\N	\N	\N	\N	296f9834-07b5-4c4e-897e-a3a40e721fbc	\N	\N	\N	\N	\N	\N	250.00	\N	\N	\N	\N	2026-05-20 10:23:04.595	Bank Transfer	E2E-TXN-1779272584561	\N	f	user	\N	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 10:23:04.6	2026-05-20 10:23:04.751
49f1a4f9-eddd-4703-ba79-e45492550296	default-tenant-id	\N	\N	\N	\N	9fb5e342-b409-43f1-8c06-6275177f2327	\N	\N	\N	\N	\N	\N	2500.00	\N	\N	\N	\N	2026-05-20 12:18:35.007	Bank Transfer	hif-ecopark-sim-offering-1779279515007	\N	f	user	\N	\N	\N	\N	n_a	unmatched	hif-ecopark-sim Sunday offering batch	Recorded	2026-05-20 12:18:35.029	2026-05-20 12:18:35.101
d1c46f71-3dd1-40b2-9147-683839b2aca2	default-tenant-id	\N	\N	\N	\N	7278e894-4bbf-42f8-89f2-8e4c8e2d57d8	\N	\N	\N	\N	\N	\N	2500.00	\N	\N	\N	\N	2026-05-20 12:20:32.782	Bank Transfer	hif-ecopark-sim-offering-1779279632782	\N	f	user	\N	\N	\N	\N	n_a	unmatched	hif-ecopark-sim Sunday offering batch	Recorded	2026-05-20 12:20:32.793	2026-05-20 12:20:32.883
3b0782a3-8048-4fc7-93e7-5c5601ae06e2	default-tenant-id	\N	\N	\N	\N	a398c59b-892b-46a5-b1b0-d15c7882001d	\N	\N	\N	\N	\N	\N	987654.00	\N	\N	\N	\N	2026-05-20 12:20:41.841	Bank Transfer	PW-DEEP-1779279641153	\N	f	user	\N	\N	\N	\N	n_a	unmatched	\N	Recorded	2026-05-20 12:20:41.86	2026-05-20 12:20:41.941
\.


--
-- Data for Name: EmploymentProfile; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EmploymentProfile" (id, "tenantId", "memberId", "startDate", "endDate", status, "jobTitle", "emergencyContact", notes, "createdAt", "updatedAt") FROM stdin;
d7f0a70f-b132-4223-bda1-5d1f464184ed	default-tenant-id	08433f56-2ce1-48c3-949d-ec87509dcdbe	2026-05-20 00:00:00	\N	Active	Ministry Coordinator	null	\N	2026-05-20 17:24:45.511	2026-05-20 17:24:45.511
63c42065-4413-4236-b29f-59ed13288d93	default-tenant-id	5a79ac10-43f9-4f3b-9a88-9a56d9fc684b	2026-05-20 00:00:00	\N	Active	Ministry Coordinator	null	\N	2026-05-20 17:27:01.145	2026-05-20 17:27:01.145
257b15b2-ff5b-4031-972f-b378a9ac2cb6	default-tenant-id	6dc40e02-c1c0-41c9-9562-d36ca8d72b63	2026-05-20 00:00:00	\N	Active	Ministry Coordinator	null	\N	2026-05-20 17:49:34.826	2026-05-20 17:49:34.826
\.


--
-- Data for Name: Event; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Event" (id, "tenantId", "campusId", name, type, date, status, "registrationOpen", location, "internalNotes", "recurringRule", "runSheet", "opsConfig", "cancelledAt", "completedAt", "archivedAt", "createdAt", "updatedAt") FROM stdin;
6efbdb4b-71f5-41f0-b6e1-f83a93eb5577	default-tenant-id	\N	Sunday Service	Service	2026-05-10 05:00:00	DRAFT	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-20 06:49:37.164	2026-05-20 06:49:37.164
980b9401-6f4c-4474-9430-e99f116cec53	default-tenant-id	\N	Sunday Worship Gathering	Service	2026-05-03 05:00:00	DRAFT	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-20 06:49:37.204	2026-05-20 06:49:37.204
a2ae4317-c5d7-479e-915c-78b9c9aea44d	default-tenant-id	\N	Sunday Service	Service	2026-04-26 05:00:00	DRAFT	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-20 06:49:37.231	2026-05-20 06:49:37.231
3acb7748-9a47-46b3-85f2-eee6013453d2	default-tenant-id	\N	Sunday Worship Gathering	Service	2026-04-19 05:00:00	DRAFT	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-20 06:49:37.259	2026-05-20 06:49:37.259
a193778a-0b79-4eb9-b38d-e54b1be1108c	default-tenant-id	\N	Wednesday Bible Study	SmallGroup	2026-05-16 13:30:00	DRAFT	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-20 06:49:37.283	2026-05-20 06:49:37.283
4d70e679-e546-4ae8-a41f-de99a1b66881	default-tenant-id	\N	Youth Service	SmallGroup	2026-05-14 13:15:00	DRAFT	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-20 06:49:37.304	2026-05-20 06:49:37.304
9deac610-3103-4c8a-9c2d-09b799050791	default-tenant-id	\N	Community Thanksgiving Dinner	Special	2026-06-01 11:30:00	DRAFT	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-20 06:49:37.324	2026-05-20 06:49:37.324
fe0522ba-9060-4327-a10b-bc5879de005b	default-tenant-id	\N	Guest Speaker Night	Special	2026-05-25 13:00:00	DRAFT	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-20 06:49:37.349	2026-05-20 06:49:37.349
d45d96a6-1138-4640-955b-ef26504c58dd	default-tenant-id	\N	E2E Test Event	Special	2026-05-20 06:51:12.42	DRAFT	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-20 06:51:12.43	2026-05-20 06:51:12.43
f26b75ad-3748-4ed2-bcef-b7b714c34d52	default-tenant-id	\N	PW Event 1779260226990	Service	2026-05-20 00:00:00	DRAFT	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-20 06:57:07.804	2026-05-20 06:57:07.804
466084e6-7a94-41a7-8013-bf9bc4d04faf	default-tenant-id	\N	PW Event 1779260881318	Service	2026-05-20 00:00:00	DRAFT	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-20 07:08:01.96	2026-05-20 07:08:01.96
42c437db-2f87-4d09-b053-154fef8ae63b	default-tenant-id	\N	PW Event 1779261225073	Service	2026-05-20 00:00:00	DRAFT	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-20 07:13:45.802	2026-05-20 07:13:45.802
2c047430-6dc6-42e2-8214-1c1f16879ba1	default-tenant-id	\N	PW Event 1779262130305	Service	2026-05-20 00:00:00	DRAFT	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-20 07:28:51.022	2026-05-20 07:28:51.022
8c3b63d9-cbf6-4f12-9b6d-376fd675e256	default-tenant-id	\N	E2E Test Event	Special	2026-05-20 10:23:04.467	DRAFT	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-20 10:23:04.475	2026-05-20 10:23:04.475
e4ef3078-8c8d-40b9-b292-f08bd4a6f470	default-tenant-id	\N	PW Event 1779275820723	Service	2026-05-20 00:00:00	DRAFT	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-20 11:17:01.364	2026-05-20 11:17:01.364
6f6c210e-8f02-4ab3-a810-0e42f7f25e2d	default-tenant-id	\N	hif-ecopark-sim Sunday Worship Gathering	Service	2026-05-27 12:18:34.761	DRAFT	f	HIF Eco Park Main Auditorium	Operational simulation event for HIF Eco Park Church	\N	\N	\N	\N	\N	\N	2026-05-20 12:18:34.778	2026-05-20 12:18:34.778
aba11e20-8b0d-4a99-bfca-f1bd9ca7f991	default-tenant-id	\N	hif-ecopark-sim Friday Worship Night	Worship	2026-05-25 12:18:34.808	DRAFT	f	HIF Eco Park Main Auditorium	Operational simulation event for HIF Eco Park Church	\N	\N	\N	\N	\N	\N	2026-05-20 12:18:34.823	2026-05-20 12:18:34.823
6753a8ca-6589-47c2-98e6-76e1cdaa3c00	default-tenant-id	\N	hif-ecopark-sim Youth Alive Night	Youth	2026-06-03 12:18:34.85	DRAFT	f	HIF Eco Park Main Auditorium	Operational simulation event for HIF Eco Park Church	\N	\N	\N	\N	\N	\N	2026-05-20 12:18:34.866	2026-05-20 12:18:34.866
d3ddde00-7e4e-4549-acce-626849cc57c0	default-tenant-id	\N	hif-ecopark-sim Kingdom Conference 2026	Conference	2026-07-04 12:18:34.885	DRAFT	f	HIF Eco Park Main Auditorium	Operational simulation event for HIF Eco Park Church	\N	\N	\N	\N	\N	\N	2026-05-20 12:18:34.899	2026-05-20 12:18:34.899
0a74d41c-acc9-4c04-85e8-c441bd2fbd2f	default-tenant-id	\N	PW Event 1779260025223	Service	2026-05-20 00:00:00	DRAFT	f	\N	\N	\N	\N	{"liveActive": true, "liveStartedAt": "2026-05-20T15:49:29.714Z", "segmentStartedAt": "2026-05-20T15:49:40.338Z", "currentSegmentIndex": 4}	\N	\N	\N	2026-05-20 06:53:46.006	2026-05-20 15:49:40.341
9c37bd90-be9f-41a6-b809-1b2aba76fda3	default-tenant-id	\N	PW Event 1779300994027	Service	2026-05-20 00:00:00	DRAFT	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-20 18:16:34.626	2026-05-20 18:16:34.626
ca5d6d7d-bcfd-417c-ad66-e1c917a08c35	default-tenant-id	\N	PW Event 1779374806224	Service	2026-05-21 00:00:00	DRAFT	f	\N	\N	\N	\N	\N	\N	\N	\N	2026-05-21 14:46:46.828	2026-05-21 14:46:46.828
\.


--
-- Data for Name: EventLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EventLog" (id, "eventName", "tenantId", "entityId", "entityType", payload, version, "occurredAt", "processedAt", status, error) FROM stdin;
826db6a5-7519-4a4a-aeab-b30c152c7d4e	VoucherApproved	default-tenant-id	dfefc66c-06e5-423a-bd54-1f24349f1f58	Voucher	{"type": "Receipt", "amount": 14180}	1	2026-05-20 06:49:37.529	2026-05-20 06:49:37.858	PROCESSED	\N
8fd6062d-237b-481a-9bb7-f1fab38238c8	MemberCreated	default-tenant-id	fed7e035-15f4-4917-bfb0-621794b2ff20	Member	{"name": "E2E Test Member", "email": "e2e-1779259872327@test.com", "status": "Active"}	1	2026-05-20 06:51:12.376	2026-05-20 06:51:12.386	PROCESSED	\N
f40c7763-a1e0-4894-94c2-9b1d2b14877c	TransactionPosted	default-tenant-id	dfefc66c-06e5-423a-bd54-1f24349f1f58	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00001"}	1	2026-05-20 06:49:37.882	2026-05-20 06:49:37.906	PROCESSED	\N
69974804-3b56-4f64-9056-e0fe2f46d31a	VoucherApproved	default-tenant-id	81741658-f336-46f8-bb20-ca095a841095	Voucher	{"type": "Receipt", "amount": 205}	1	2026-05-20 06:49:37.978	2026-05-20 06:49:37.989	PROCESSED	\N
5a05de70-2cf5-44ef-9844-b50eb8e5b43b	EventCreated	default-tenant-id	d45d96a6-1138-4640-955b-ef26504c58dd	Event	{"date": "2026-05-20T06:51:12.420Z", "name": "E2E Test Event", "type": "Special", "status": "DRAFT"}	1	2026-05-20 06:51:12.436	2026-05-20 06:51:12.447	PROCESSED	\N
864c4124-f62c-4242-a51e-ffba90cb5e58	TransactionPosted	default-tenant-id	81741658-f336-46f8-bb20-ca095a841095	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00002"}	1	2026-05-20 06:49:37.994	2026-05-20 06:49:38.017	PROCESSED	\N
f1fbf151-f652-4022-951a-8af8c3727178	VoucherApproved	default-tenant-id	5aed788d-6d4b-4458-a7e0-0e9600e16204	Voucher	{"type": "Receipt", "amount": 300}	1	2026-05-20 06:49:38.088	2026-05-20 06:49:38.112	PROCESSED	\N
85eaedfe-6023-47bb-bca6-aff1f94c1600	MemberCreated	default-tenant-id	957bc638-6ec7-4c1a-b343-de8fb625ccd4	Member	{"name": "CareFirst1779260015731 CareLast1779260015731", "email": "pw.care.1779260015731@example.com", "status": "Active"}	1	2026-05-20 06:53:37.577	2026-05-20 06:53:37.591	PROCESSED	\N
a6442d0f-45d0-4f54-a15a-bc93c3bb5be3	TransactionPosted	default-tenant-id	5aed788d-6d4b-4458-a7e0-0e9600e16204	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00003"}	1	2026-05-20 06:49:38.118	2026-05-20 06:49:38.136	PROCESSED	\N
a9fd1648-965d-4094-a51d-56a40f6c88c2	VoucherApproved	default-tenant-id	b00225ed-3429-49e6-b685-2b01fffba48c	Voucher	{"type": "Receipt", "amount": 395}	1	2026-05-20 06:49:38.212	2026-05-20 06:49:38.221	PROCESSED	\N
783b76d0-2c34-4fcd-bbff-3c7717d624f5	MemberCreated	default-tenant-id	60d89616-69d3-48c2-8889-7c3c6db310c2	Member	{"name": "PathFirst1779260850281 PathLast1779260850281", "email": "pw.path.1779260850281@example.com", "status": "Active"}	1	2026-05-20 07:07:32.911	2026-05-20 07:07:32.918	PROCESSED	\N
8eeb4197-9e87-40d8-8481-038c016bd913	TransactionPosted	default-tenant-id	b00225ed-3429-49e6-b685-2b01fffba48c	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00004"}	1	2026-05-20 06:49:38.225	2026-05-20 06:49:38.236	PROCESSED	\N
6e73d551-e4fe-42a3-b0df-fc3d218c60d4	VoucherApproved	default-tenant-id	daf7817f-c2d7-4c8a-a627-eb3c38276fd4	Voucher	{"type": "Receipt", "amount": 330}	1	2026-05-20 06:49:38.294	2026-05-20 06:49:38.302	PROCESSED	\N
b9b337fb-9358-41aa-a33a-a3a4c9eef7e7	MemberCreated	default-tenant-id	4d3af43e-2590-43f1-bb70-ec00793629b8	Member	{"name": "PWFirst1779261176438 PWLast1779261176438", "email": "pw.member.1779261176438@example.com", "status": "Active"}	1	2026-05-20 07:12:58.467	2026-05-20 07:12:58.476	PROCESSED	\N
b20cffa1-3084-46e5-890e-2cdbd0381030	TransactionPosted	default-tenant-id	daf7817f-c2d7-4c8a-a627-eb3c38276fd4	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00005"}	1	2026-05-20 06:49:38.307	2026-05-20 06:49:38.317	PROCESSED	\N
0137d4a4-dab6-445b-974b-54d0db1c4045	VoucherApproved	default-tenant-id	b2ee5dc4-e155-41b1-86fa-1e3f17960afc	Voucher	{"type": "Receipt", "amount": 425}	1	2026-05-20 06:49:38.379	2026-05-20 06:49:38.386	PROCESSED	\N
be69840f-c466-4a3b-b533-911bf3d38f45	MemberCreated	default-tenant-id	5af4bd77-f5c1-4e6a-9495-a300f0080523	Member	{"name": "PathFirst1779261192989 PathLast1779261192989", "email": "pw.path.1779261192989@example.com", "status": "Active"}	1	2026-05-20 07:13:15.799	2026-05-20 07:13:15.805	PROCESSED	\N
cda2f03c-c3e9-421d-813e-a8ebfbaa821f	TransactionPosted	default-tenant-id	b2ee5dc4-e155-41b1-86fa-1e3f17960afc	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00006"}	1	2026-05-20 06:49:38.392	2026-05-20 06:49:38.404	PROCESSED	\N
25d696c5-c849-442f-a674-53e7aad00fdf	VoucherApproved	default-tenant-id	5ffb0752-e5c5-4fef-a262-564580c25de1	Voucher	{"type": "Receipt", "amount": 520}	1	2026-05-20 06:49:38.471	2026-05-20 06:49:38.478	PROCESSED	\N
1605b9e7-398e-4efc-a490-a34eddbd86c3	CareCaseOpened	default-tenant-id	12e60bfa-1718-4973-be94-c34886dadd9e	CareCase	{"urgency": "MEDIUM", "category": "General Pastoral Care", "memberId": "e1cd4a3a-1425-463f-9a8e-9e4f0bfdd25b"}	1	2026-05-20 07:13:39.037	2026-05-20 07:13:39.045	PROCESSED	\N
39f5695b-d729-411f-ac09-921d7781aec7	TransactionPosted	default-tenant-id	5ffb0752-e5c5-4fef-a262-564580c25de1	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00007"}	1	2026-05-20 06:49:38.482	2026-05-20 06:49:38.492	PROCESSED	\N
5361a1db-5029-49ba-ad16-31bc259aec11	VoucherApproved	default-tenant-id	dcc8562c-ac3b-42ee-8e02-0ad0c9d99682	Voucher	{"type": "Receipt", "amount": 230}	1	2026-05-20 06:49:38.55	2026-05-20 06:49:38.555	PROCESSED	\N
eb3d1642-fdf6-49a7-8aee-f2eeff36a75c	CareLogAdded	default-tenant-id	afd3740f-2085-4ecf-919a-cb16241a314c	CareLog	{"careCaseId": "12e60bfa-1718-4973-be94-c34886dadd9e", "interactionType": "Note"}	1	2026-05-20 07:13:39.204	2026-05-20 07:13:39.213	PROCESSED	\N
42e22e6a-424c-4172-b15f-b8b9f5e3f720	TransactionPosted	default-tenant-id	dcc8562c-ac3b-42ee-8e02-0ad0c9d99682	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00008"}	1	2026-05-20 06:49:38.558	2026-05-20 06:49:38.566	PROCESSED	\N
811b9f4f-56d1-41cf-b461-290612044669	VoucherApproved	default-tenant-id	713f5a4e-fe4d-4da9-9a78-be975210d810	Voucher	{"type": "Receipt", "amount": 165}	1	2026-05-20 06:49:38.606	2026-05-20 06:49:38.612	PROCESSED	\N
069f30d5-16d4-4a8e-9fae-7aa82d7996cc	MemberCreated	default-tenant-id	27a56c7f-1bd1-467b-8b06-3290519a6f9b	Member	{"name": "PathFirst1779262100157 PathLast1779262100157", "email": "pw.path.1779262100157@example.com", "status": "Active"}	1	2026-05-20 07:28:22.879	2026-05-20 07:28:22.889	PROCESSED	\N
2c7b6020-1a14-44e1-8183-b92eac25f6c7	CareLogAdded	default-tenant-id	ace95e3d-e5b0-4cc1-9bcd-5bc50a52bec9	CareLog	{"careCaseId": "c09e2724-5cb9-4c04-9a55-09975ec6593a", "interactionType": "Note"}	1	2026-05-20 07:28:44.598	2026-05-20 07:28:44.606	PROCESSED	\N
191c12f4-a95f-4285-a1b4-9f6c86ce36e2	EventCreated	default-tenant-id	2c047430-6dc6-42e2-8214-1c1f16879ba1	Event	{"date": "2026-05-20T00:00:00.000Z", "name": "PW Event 1779262130305", "type": "Service", "status": "DRAFT"}	1	2026-05-20 07:28:51.028	2026-05-20 07:28:51.04	PROCESSED	\N
c4714121-bfe8-4110-9563-848539cd8096	CareLogAdded	default-tenant-id	624c20bd-84f1-4bd3-8ea8-46d56b8ec5fc	CareLog	{"careCaseId": "0e46ced9-4d34-46cd-9202-3b4e14287581", "interactionType": "Note"}	1	2026-05-20 11:16:52.947	2026-05-20 11:16:52.956	PROCESSED	\N
aa6f056b-2da8-48dd-aa01-6e8b67a35935	MemberCreated	default-tenant-id	888cd8c0-3d5d-4ba4-a5de-26ff89501d26	Member	{"name": "HR Sim Staff 1779297490292", "email": "hr-sim.staff.1779297490292@grace.local", "status": "Active"}	1	2026-05-20 17:18:10.318	2026-05-20 17:18:10.351	PROCESSED	\N
36c92b2d-cd4d-4638-9b54-c137abbfbaea	TransactionPosted	default-tenant-id	713f5a4e-fe4d-4da9-9a78-be975210d810	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00009"}	1	2026-05-20 06:49:38.615	2026-05-20 06:49:38.624	PROCESSED	\N
33f1e856-6816-4264-88f8-25c9ae81d186	VoucherApproved	default-tenant-id	4af4b97f-fb46-4413-b8e8-d5efa809ec9f	Voucher	{"type": "Receipt", "amount": 250}	1	2026-05-20 06:51:12.661	2026-05-20 06:51:12.669	PROCESSED	\N
c55fa9df-8958-4887-9aee-d28dff28b4ec	VoucherApproved	default-tenant-id	57d2b2da-91eb-4281-8198-fc8fa0f572da	Voucher	{"type": "Receipt", "amount": 440}	1	2026-05-20 06:49:38.676	2026-05-20 06:49:38.685	PROCESSED	\N
aa413ebf-6676-4eb4-adcd-4e5188d08564	TransactionPosted	default-tenant-id	57d2b2da-91eb-4281-8198-fc8fa0f572da	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00010"}	1	2026-05-20 06:49:38.69	2026-05-20 06:49:38.7	PROCESSED	\N
1013cc53-8a5d-4ef5-9830-59161c498b4d	TransactionPosted	default-tenant-id	4af4b97f-fb46-4413-b8e8-d5efa809ec9f	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00029"}	1	2026-05-20 06:51:12.673	2026-05-20 06:51:12.68	PROCESSED	\N
6d51aba6-a7f7-463f-9639-dd05aca245c8	VoucherApproved	default-tenant-id	708c8854-da4d-44d3-b1ff-273e77fd2927	Voucher	{"type": "Receipt", "amount": 355}	1	2026-05-20 06:49:38.751	2026-05-20 06:49:38.756	PROCESSED	\N
618656e5-247a-40ca-babe-971f76ac6d1b	TransactionPosted	default-tenant-id	708c8854-da4d-44d3-b1ff-273e77fd2927	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00011"}	1	2026-05-20 06:49:38.759	2026-05-20 06:49:38.767	PROCESSED	\N
e943a36a-95a7-432e-9d69-a5653a1eb626	DonationReceived	default-tenant-id	0188bf33-9418-4577-8ea9-632c6d58f85a	Donation	{"amount": 250, "method": "Bank Transfer", "reference": "E2E-TXN-1779259872528"}	1	2026-05-20 06:51:13.748	2026-05-20 06:51:13.763	PROCESSED	\N
f473bb52-b1a3-483b-9e5c-23b35358ca4b	VoucherApproved	default-tenant-id	0c16ca38-0931-48d0-84c7-c78c75be6e13	Voucher	{"type": "Receipt", "amount": 6900}	1	2026-05-20 06:49:38.808	2026-05-20 06:49:38.814	PROCESSED	\N
7c7f2aee-7a32-47c9-9340-5f9a7bdbabfe	TransactionPosted	default-tenant-id	0c16ca38-0931-48d0-84c7-c78c75be6e13	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00012"}	1	2026-05-20 06:49:38.816	2026-05-20 06:49:38.823	PROCESSED	\N
33725a5c-951f-420c-b2d3-3ee21a44efad	CareCaseOpened	default-tenant-id	f9e31a22-274e-4403-b9c6-20fd41d8996d	CareCase	{"urgency": "MEDIUM", "category": "General Pastoral Care", "memberId": "957bc638-6ec7-4c1a-b343-de8fb625ccd4"}	1	2026-05-20 06:53:39.488	2026-05-20 06:53:39.498	PROCESSED	\N
3f026cba-1087-45c9-8e8a-428fda24b35b	VoucherApproved	default-tenant-id	b4442385-f24b-4663-9f2f-7eeb7d4a85c2	Voucher	{"type": "Receipt", "amount": 385}	1	2026-05-20 06:49:38.86	2026-05-20 06:49:38.865	PROCESSED	\N
238bf639-59c1-4705-b306-2aca0ea0e968	TransactionPosted	default-tenant-id	b4442385-f24b-4663-9f2f-7eeb7d4a85c2	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00013"}	1	2026-05-20 06:49:38.867	2026-05-20 06:49:38.873	PROCESSED	\N
aa6bd204-e243-43cd-b2c0-e2771e85153c	CareLogAdded	default-tenant-id	637c964d-34eb-4f3c-92fc-9de98a449373	CareLog	{"careCaseId": "f9e31a22-274e-4403-b9c6-20fd41d8996d", "interactionType": "Note"}	1	2026-05-20 06:53:39.677	2026-05-20 06:53:39.685	PROCESSED	\N
0eac03a9-f097-4ec5-884a-719cb2b6b37e	VoucherApproved	default-tenant-id	9fbb9a28-c7f0-4755-b368-818017e88e16	Voucher	{"type": "Receipt", "amount": 480}	1	2026-05-20 06:49:38.904	2026-05-20 06:49:38.909	PROCESSED	\N
58af4d77-be0e-492d-8e01-7bfe2e70af05	TransactionPosted	default-tenant-id	9fbb9a28-c7f0-4755-b368-818017e88e16	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00014"}	1	2026-05-20 06:49:38.911	2026-05-20 06:49:38.917	PROCESSED	\N
0d7e5f8d-46c1-4cf0-87a3-db1c4ae4c5c9	MemberCreated	default-tenant-id	1123e00f-6a65-4e2e-baff-74fdace3fe37	Member	{"name": "CareFirst1779260871160 CareLast1779260871160", "email": "pw.care.1779260871160@example.com", "status": "Active"}	1	2026-05-20 07:07:52.946	2026-05-20 07:07:52.955	PROCESSED	\N
f20a1158-3ef6-40d5-ae4f-6e1a8a72befd	VoucherApproved	default-tenant-id	b88a5e5e-d348-4063-993a-5d69813e39bd	Voucher	{"type": "Receipt", "amount": 190}	1	2026-05-20 06:49:38.955	2026-05-20 06:49:38.96	PROCESSED	\N
d11491ab-a00a-4851-841a-d8f0d34ddf4e	TransactionPosted	default-tenant-id	b88a5e5e-d348-4063-993a-5d69813e39bd	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00015"}	1	2026-05-20 06:49:38.962	2026-05-20 06:49:38.968	PROCESSED	\N
01380724-b268-4bf2-85c3-8d677ed85325	MemberCreated	default-tenant-id	6d35bcde-b308-45c7-a1db-87e453d0101a	Member	{"name": "VolFirst1779261202588 VolLast1779261202588", "email": "pw.vol.1779261202588@example.com", "status": "Active"}	1	2026-05-20 07:13:25.265	2026-05-20 07:13:25.271	PROCESSED	\N
b265c41a-7a52-46ff-bed8-af319bb5a3f2	VoucherApproved	default-tenant-id	59f0f1a3-c521-4b44-a734-f02e903e8c02	Voucher	{"type": "Receipt", "amount": 285}	1	2026-05-20 06:49:38.998	2026-05-20 06:49:39.002	PROCESSED	\N
0e4d0140-c243-42ef-9511-f76e479e0058	TransactionPosted	default-tenant-id	59f0f1a3-c521-4b44-a734-f02e903e8c02	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00016"}	1	2026-05-20 06:49:39.007	2026-05-20 06:49:39.018	PROCESSED	\N
cc2cfaa2-8d84-46c1-a79a-776a8886e03d	EventCreated	default-tenant-id	42c437db-2f87-4d09-b053-154fef8ae63b	Event	{"date": "2026-05-20T00:00:00.000Z", "name": "PW Event 1779261225073", "type": "Service", "status": "DRAFT"}	1	2026-05-20 07:13:45.806	2026-05-20 07:13:45.816	PROCESSED	\N
51a98470-91ea-46e7-ae7f-74bbd5c9805e	VoucherApproved	default-tenant-id	e7455175-9b8f-4b13-a635-ae625724c883	Voucher	{"type": "Receipt", "amount": 220}	1	2026-05-20 06:49:39.05	2026-05-20 06:49:39.055	PROCESSED	\N
2c09aab0-5983-44f2-9453-16544354cf95	TransactionPosted	default-tenant-id	e7455175-9b8f-4b13-a635-ae625724c883	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00017"}	1	2026-05-20 06:49:39.057	2026-05-20 06:49:39.063	PROCESSED	\N
0939924f-8208-4c51-99f5-20710de26186	MemberCreated	default-tenant-id	d99ad09a-3c1b-4fa9-bbb5-8b8154354d3c	Member	{"name": "VolFirst1779262109544 VolLast1779262109544", "email": "pw.vol.1779262109544@example.com", "status": "Active"}	1	2026-05-20 07:28:31.857	2026-05-20 07:28:31.867	PROCESSED	\N
c187f9af-de51-4c44-a834-a990c450a195	MemberCreated	default-tenant-id	aba4e66d-faf2-4418-b913-292e621cccfa	Member	{"name": "E2E Test Member", "email": "e2e-1779272584403@test.com", "status": "Active"}	1	2026-05-20 10:23:04.438	2026-05-20 10:23:04.446	PROCESSED	\N
95442da3-6c26-4c17-965e-63b3ed89c554	EventCreated	default-tenant-id	8c3b63d9-cbf6-4f12-9b6d-376fd675e256	Event	{"date": "2026-05-20T10:23:04.467Z", "name": "E2E Test Event", "type": "Special", "status": "DRAFT"}	1	2026-05-20 10:23:04.477	2026-05-20 10:23:04.487	PROCESSED	\N
b355fcca-097d-4c1c-8af6-42670c179584	MemberCreated	default-tenant-id	f9bf29fd-f47a-45c9-a4c9-444805fd44f9	Member	{"name": "PathFirst1779275780562 PathLast1779275780562", "email": "pw.path.1779275780562@example.com", "status": "Active"}	1	2026-05-20 11:16:22.469	2026-05-20 11:16:22.48	PROCESSED	\N
e8d8ea7f-e347-4e22-8037-981d79203afb	VoucherApproved	default-tenant-id	b62d9e86-98b9-4ef0-825c-eeb916519e9a	Voucher	{"type": "Receipt", "amount": 15000}	1	2026-05-20 06:49:39.101	2026-05-20 06:49:39.105	PROCESSED	\N
b8dcccec-7977-49e8-b50a-b9a8cdd596cb	MemberCreated	default-tenant-id	23af6d78-3128-4130-bfba-bfd50618de8c	Member	{"name": "PWFirst1779259978592 PWLast1779259978592", "email": "pw.member.1779259978592@example.com", "status": "Active"}	1	2026-05-20 06:53:00.576	2026-05-20 06:53:00.599	PROCESSED	\N
32f3cbd5-cf97-47bb-8341-272e5b68c8e1	TransactionPosted	default-tenant-id	b62d9e86-98b9-4ef0-825c-eeb916519e9a	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00018"}	1	2026-05-20 06:49:39.108	2026-05-20 06:49:39.114	PROCESSED	\N
accc65e8-f9da-453b-8c86-211be6d18731	VoucherApproved	default-tenant-id	bb94d7d0-fae8-4269-9ac8-abbec50e8512	Voucher	{"type": "Receipt", "amount": 410}	1	2026-05-20 06:49:39.153	2026-05-20 06:49:39.163	PROCESSED	\N
1c34e903-b439-4315-bfcc-5d02c4894d45	EventCreated	default-tenant-id	0a74d41c-acc9-4c04-85e8-c441bd2fbd2f	Event	{"date": "2026-05-20T00:00:00.000Z", "name": "PW Event 1779260025223", "type": "Service", "status": "DRAFT"}	1	2026-05-20 06:53:46.018	2026-05-20 06:53:46.026	PROCESSED	\N
58691abb-702e-4ab1-9b2d-49284bdcec2d	TransactionPosted	default-tenant-id	bb94d7d0-fae8-4269-9ac8-abbec50e8512	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00019"}	1	2026-05-20 06:49:39.167	2026-05-20 06:49:39.173	PROCESSED	\N
cb6e4f69-937c-45e8-b9b7-7dbf4c02b9e9	VoucherApproved	default-tenant-id	83b989f2-cf20-4bc6-ac82-bedb2cd00138	Voucher	{"type": "Receipt", "amount": 505}	1	2026-05-20 06:49:39.204	2026-05-20 06:49:39.209	PROCESSED	\N
c8dc500f-8fe2-431d-8fb7-27fe7ab4ffb5	EventCreated	default-tenant-id	f26b75ad-3748-4ed2-bcef-b7b714c34d52	Event	{"date": "2026-05-20T00:00:00.000Z", "name": "PW Event 1779260226990", "type": "Service", "status": "DRAFT"}	1	2026-05-20 06:57:07.816	2026-05-20 06:57:07.829	PROCESSED	\N
38e33dd2-b451-4b0f-9bef-75733751118c	TransactionPosted	default-tenant-id	83b989f2-cf20-4bc6-ac82-bedb2cd00138	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00020"}	1	2026-05-20 06:49:39.211	2026-05-20 06:49:39.217	PROCESSED	\N
29c79fc2-5b6f-483e-847c-817a03d55ff3	VoucherApproved	default-tenant-id	ff8d6354-1a2b-421d-aa0f-6346aa0b2769	Voucher	{"type": "Receipt", "amount": 560}	1	2026-05-20 06:49:39.256	2026-05-20 06:49:39.261	PROCESSED	\N
b35feb7e-56b4-4cb4-a465-de0ce75866cd	CareCaseOpened	default-tenant-id	bf120795-8af8-41bd-bed3-af539938f5eb	CareCase	{"urgency": "MEDIUM", "category": "General Pastoral Care", "memberId": "1123e00f-6a65-4e2e-baff-74fdace3fe37"}	1	2026-05-20 07:07:54.961	2026-05-20 07:07:54.97	PROCESSED	\N
46bf918c-5281-47b9-b9e3-32b948900dff	TransactionPosted	default-tenant-id	ff8d6354-1a2b-421d-aa0f-6346aa0b2769	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00021"}	1	2026-05-20 06:49:39.264	2026-05-20 06:49:39.269	PROCESSED	\N
2c9f4d75-22bf-4e90-a12f-9a0615216a99	VoucherApproved	default-tenant-id	781fc419-f67b-42d0-8a68-1f8e78744b51	Voucher	{"type": "Receipt", "amount": 230}	1	2026-05-20 06:49:39.299	2026-05-20 06:49:39.308	PROCESSED	\N
cee9a492-79c8-4303-bab0-4c8b8fcae80e	MemberCreated	default-tenant-id	e1cd4a3a-1425-463f-9a8e-9e4f0bfdd25b	Member	{"name": "CareFirst1779261215058 CareLast1779261215058", "email": "pw.care.1779261215058@example.com", "status": "Active"}	1	2026-05-20 07:13:37.252	2026-05-20 07:13:37.259	PROCESSED	\N
c4a05d29-a9ea-4890-b7fb-0369f292141c	TransactionPosted	default-tenant-id	781fc419-f67b-42d0-8a68-1f8e78744b51	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00022"}	1	2026-05-20 06:49:39.313	2026-05-20 06:49:39.319	PROCESSED	\N
1f3af258-522a-4164-9f58-8ee518396c5a	VoucherApproved	default-tenant-id	6f4d5a2f-e0dc-47da-a9ff-940ffa07f9fc	Voucher	{"type": "Receipt", "amount": 7300}	1	2026-05-20 06:49:39.352	2026-05-20 06:49:39.356	PROCESSED	\N
e32f12c0-bd82-4629-a4b1-0db6983c7625	MemberCreated	default-tenant-id	05e6bcf1-3d05-4bc0-9019-f612c5dea737	Member	{"name": "CareFirst1779262120692 CareLast1779262120692", "email": "pw.care.1779262120692@example.com", "status": "Active"}	1	2026-05-20 07:28:42.463	2026-05-20 07:28:42.471	PROCESSED	\N
35d01514-c708-426e-ade0-969e1ba66412	TransactionPosted	default-tenant-id	6f4d5a2f-e0dc-47da-a9ff-940ffa07f9fc	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00023"}	1	2026-05-20 06:49:39.359	2026-05-20 06:49:39.366	PROCESSED	\N
b1585085-6e49-445c-b8bc-a4a43c70ea2a	VoucherApproved	default-tenant-id	66db418a-5e4e-4ba0-9bf4-de38463fdfd8	Voucher	{"type": "Receipt", "amount": 220}	1	2026-05-20 06:49:39.403	2026-05-20 06:49:39.41	PROCESSED	\N
b99994c6-5b62-410e-9878-bd7585c38681	VoucherApproved	default-tenant-id	296f9834-07b5-4c4e-897e-a3a40e721fbc	Voucher	{"type": "Receipt", "amount": 250}	1	2026-05-20 10:23:04.713	2026-05-20 10:23:04.723	PROCESSED	\N
d4f75846-8809-4d7a-bf0e-33c1dbeead84	TransactionPosted	default-tenant-id	66db418a-5e4e-4ba0-9bf4-de38463fdfd8	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00024"}	1	2026-05-20 06:49:39.412	2026-05-20 06:49:39.418	PROCESSED	\N
374dc661-afc7-4632-a966-e5c3c926a2ee	VoucherApproved	default-tenant-id	21befbc0-1468-412b-a56f-b079444ae73d	Voucher	{"type": "Receipt", "amount": 455}	1	2026-05-20 06:49:39.445	2026-05-20 06:49:39.449	PROCESSED	\N
8f1d4ee5-aff0-49bc-9b7f-619422b19b6d	TransactionPosted	default-tenant-id	296f9834-07b5-4c4e-897e-a3a40e721fbc	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00030"}	1	2026-05-20 10:23:04.728	2026-05-20 10:23:04.738	PROCESSED	\N
a65d39e0-cf35-4636-a63f-95f75095ed51	TransactionPosted	default-tenant-id	21befbc0-1468-412b-a56f-b079444ae73d	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00025"}	1	2026-05-20 06:49:39.451	2026-05-20 06:49:39.456	PROCESSED	\N
319fd2a9-58b3-422d-ba6d-b626a45ca2c4	VoucherApproved	default-tenant-id	021c72f6-678a-4276-8dd9-696c06bf40e3	Voucher	{"type": "Receipt", "amount": 370}	1	2026-05-20 06:49:39.489	2026-05-20 06:49:39.493	PROCESSED	\N
89445f29-c27c-4ec2-a387-e0d1be180a43	DonationReceived	default-tenant-id	3c3d90ee-a62a-42b1-8431-ff1ad005756d	Donation	{"amount": 250, "method": "Bank Transfer", "reference": "E2E-TXN-1779272584561"}	1	2026-05-20 10:23:05.741	2026-05-20 10:23:05.755	PROCESSED	\N
64b184ab-0b91-41e8-9358-10d545aad353	MemberCreated	default-tenant-id	8ac59352-f9cf-418e-b9c4-58a92722ecdc	Member	{"name": "VolFirst1779275793122 VolLast1779275793122", "email": "pw.vol.1779275793122@example.com", "status": "Active"}	1	2026-05-20 11:16:34.901	2026-05-20 11:16:34.913	PROCESSED	\N
cb91622b-0cf2-4dbd-91a8-323b55eb42a1	EventCreated	default-tenant-id	e4ef3078-8c8d-40b9-b292-f08bd4a6f470	Event	{"date": "2026-05-20T00:00:00.000Z", "name": "PW Event 1779275820723", "type": "Service", "status": "DRAFT"}	1	2026-05-20 11:17:01.37	2026-05-20 11:17:01.389	PROCESSED	\N
4735c892-9f8c-4efc-b011-b887b4289587	EventCreated	default-tenant-id	6f6c210e-8f02-4ab3-a810-0e42f7f25e2d	Event	{"date": "2026-05-27T12:18:34.761Z", "name": "hif-ecopark-sim Sunday Worship Gathering", "type": "Service", "status": "DRAFT"}	1	2026-05-20 12:18:34.781	2026-05-20 12:18:34.788	PROCESSED	\N
aa89c5e3-c582-4a3e-9b61-a306b41a7430	TransactionPosted	default-tenant-id	021c72f6-678a-4276-8dd9-696c06bf40e3	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00026"}	1	2026-05-20 06:49:39.495	2026-05-20 06:49:39.5	PROCESSED	\N
dc3889c9-5daa-465e-ba0c-91e90ca7d115	MemberCreated	default-tenant-id	60ae1a9e-9c4b-463a-b265-a2ffc9a8fb08	Member	{"name": "PathFirst1779259994667 PathLast1779259994667", "email": "pw.path.1779259994667@example.com", "status": "Active"}	1	2026-05-20 06:53:16.916	2026-05-20 06:53:16.923	PROCESSED	\N
04b31de3-5741-4aef-843d-ccb352b71282	VoucherApproved	default-tenant-id	f6563df8-2f5c-479e-bc48-65abee7622eb	Voucher	{"type": "Receipt", "amount": 425}	1	2026-05-20 06:49:39.545	2026-05-20 06:49:39.55	PROCESSED	\N
d3c1f91e-61ef-4f76-9e8d-1e30f66483f4	TransactionPosted	default-tenant-id	f6563df8-2f5c-479e-bc48-65abee7622eb	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00027"}	1	2026-05-20 06:49:39.552	2026-05-20 06:49:39.557	PROCESSED	\N
5b35a9aa-fceb-49db-a889-fa61d4e3e81d	MemberCreated	default-tenant-id	ede36984-078e-4d72-ad15-f55dd44bfa99	Member	{"name": "VolFirst1779260004009 VolLast1779260004009", "email": "pw.vol.1779260004009@example.com", "status": "Active"}	1	2026-05-20 06:53:26.132	2026-05-20 06:53:26.142	PROCESSED	\N
59721868-f228-4295-9213-50db97527716	VoucherApproved	default-tenant-id	0c31578f-32ca-4bb0-b8b9-9e7b4b0417cb	Voucher	{"type": "Receipt", "amount": 520}	1	2026-05-20 06:49:39.581	2026-05-20 06:49:39.585	PROCESSED	\N
a73a860f-f575-4032-8db8-bef2ec841ccb	TransactionPosted	default-tenant-id	0c31578f-32ca-4bb0-b8b9-9e7b4b0417cb	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00028"}	1	2026-05-20 06:49:39.586	2026-05-20 06:49:39.591	PROCESSED	\N
2e1e5f9d-9f94-44a4-a45d-25343564d1ab	MemberCreated	default-tenant-id	8dfde6d6-b543-4718-8911-f42aefe8233b	Member	{"name": "PWFirst1779260833777 PWLast1779260833777", "email": "pw.member.1779260833777@example.com", "status": "Active"}	1	2026-05-20 07:07:15.314	2026-05-20 07:07:15.321	PROCESSED	\N
e662f868-c677-4da5-8acf-3192ce332837	MemberCreated	default-tenant-id	f0b8a548-5dcb-4bc6-bcbe-86bfd9a952d0	Member	{"name": "VolFirst1779260859968 VolLast1779260859968", "email": "pw.vol.1779260859968@example.com", "status": "Active"}	1	2026-05-20 07:07:41.778	2026-05-20 07:07:41.785	PROCESSED	\N
6fb902d5-9254-4968-b7bf-97318b2830e5	CareLogAdded	default-tenant-id	796cc9d5-ecef-454f-b3f0-cea7e2fbd542	CareLog	{"careCaseId": "bf120795-8af8-41bd-bed3-af539938f5eb", "interactionType": "Note"}	1	2026-05-20 07:07:55.26	2026-05-20 07:07:55.272	PROCESSED	\N
edcccf98-bbd9-441f-b850-f37a2a5ca2af	EventCreated	default-tenant-id	466084e6-7a94-41a7-8013-bf9bc4d04faf	Event	{"date": "2026-05-20T00:00:00.000Z", "name": "PW Event 1779260881318", "type": "Service", "status": "DRAFT"}	1	2026-05-20 07:08:01.973	2026-05-20 07:08:01.996	PROCESSED	\N
d3b170d2-af9c-470b-b037-4eb975d97745	MemberCreated	default-tenant-id	9f3474dd-7ea9-4ec0-a568-d9a413d30c1c	Member	{"name": "PWFirst1779262083769 PWLast1779262083769", "email": "pw.member.1779262083769@example.com", "status": "Active"}	1	2026-05-20 07:28:05.849	2026-05-20 07:28:05.863	PROCESSED	\N
739d08ef-b623-465d-8ae9-bd785285caa0	CareCaseOpened	default-tenant-id	c09e2724-5cb9-4c04-9a55-09975ec6593a	CareCase	{"urgency": "MEDIUM", "category": "General Pastoral Care", "memberId": "05e6bcf1-3d05-4bc0-9019-f612c5dea737"}	1	2026-05-20 07:28:44.406	2026-05-20 07:28:44.417	PROCESSED	\N
eea3a9cd-7ffc-4201-8df8-b21be52c4c54	MemberCreated	default-tenant-id	37673a99-f166-4702-8df3-91aea41f1dcc	Member	{"name": "PWFirst1779275760621 PWLast1779275760621", "email": "pw.member.1779275760621@example.com", "status": "Active"}	1	2026-05-20 11:16:02.412	2026-05-20 11:16:02.421	PROCESSED	\N
6569e205-3d6c-4cd6-be56-11baa65f3cac	MemberCreated	default-tenant-id	14bf9867-357d-46f3-8203-1eee5e129153	Member	{"name": "CareFirst1779275808239 CareLast1779275808239", "email": "pw.care.1779275808239@example.com", "status": "Active"}	1	2026-05-20 11:16:50.392	2026-05-20 11:16:50.403	PROCESSED	\N
9c016425-0829-4dba-aa70-1bbbe28d7f7d	CareCaseOpened	default-tenant-id	0e46ced9-4d34-46cd-9202-3b4e14287581	CareCase	{"urgency": "MEDIUM", "category": "General Pastoral Care", "memberId": "14bf9867-357d-46f3-8203-1eee5e129153"}	1	2026-05-20 11:16:52.645	2026-05-20 11:16:52.657	PROCESSED	\N
47b39f73-cb1d-428c-b073-5cc1f7838ff1	MemberCreated	default-tenant-id	2ad34cf4-a3e3-40f2-8436-7ed668803986	Member	{"name": "Ravi Nair", "email": "hif-ecopark-sim.ravi@hifecopark.org", "status": "Active"}	1	2026-05-20 12:16:37.666	2026-05-20 12:16:37.685	PROCESSED	\N
e8b6b444-4767-4ba7-8bcf-9aea8213d552	MemberCreated	default-tenant-id	28362ed7-c283-4ccb-b966-4e18bf313120	Member	{"name": "Priya Nair", "email": "hif-ecopark-sim.priya@hifecopark.org", "status": "Active"}	1	2026-05-20 12:16:37.705	2026-05-20 12:16:37.712	PROCESSED	\N
209e33ba-d3da-4039-b5d5-a11bcbabfdd2	MemberCreated	default-tenant-id	a3dc0b17-df27-4313-8d6c-c1f2c4d8c72b	Member	{"name": "Arjun Nair", "email": "hif-ecopark-sim.arjun@hifecopark.org", "status": "Active"}	1	2026-05-20 12:16:37.724	2026-05-20 12:16:37.729	PROCESSED	\N
5a004645-49e8-4012-8f8f-a7a49a15c00f	MemberCreated	default-tenant-id	088407ab-2061-439f-824f-209c5e6fe9dc	Member	{"name": "Meera Thomas", "email": "hif-ecopark-sim.meera@hifecopark.org", "status": "Active"}	1	2026-05-20 12:16:37.741	2026-05-20 12:16:37.746	PROCESSED	\N
33900b22-cde8-4808-8957-d160fccedf90	MemberCreated	default-tenant-id	fcee9106-d08e-4903-a84c-6f146128179d	Member	{"name": "David Kurian", "email": "hif-ecopark-sim.finance@hifecopark.org", "status": "Active"}	1	2026-05-20 12:16:37.757	2026-05-20 12:16:37.763	PROCESSED	\N
73c940be-c4b2-4c03-afe6-d27c6bb6da6e	MemberCreated	default-tenant-id	7434384b-ba2d-4415-97a0-9830f720b153	Member	{"name": "Sarah Mathew", "email": "hif-ecopark-sim.worship@hifecopark.org", "status": "Active"}	1	2026-05-20 12:16:37.778	2026-05-20 12:16:37.783	PROCESSED	\N
8f83c624-0abc-4142-9dde-ceec7cdc97f9	MemberCreated	default-tenant-id	b6e8d402-2717-45e6-8de3-5a708f2fec98	Member	{"name": "James Paul", "email": "hif-ecopark-sim.campus@hifecopark.org", "status": "Active"}	1	2026-05-20 12:16:37.796	2026-05-20 12:16:37.801	PROCESSED	\N
6c1e01ce-8cd9-4c06-b9f2-ccfcdab8468a	EventCreated	default-tenant-id	aba11e20-8b0d-4a99-bfca-f1bd9ca7f991	Event	{"date": "2026-05-25T12:18:34.808Z", "name": "hif-ecopark-sim Friday Worship Night", "type": "Worship", "status": "DRAFT"}	1	2026-05-20 12:18:34.825	2026-05-20 12:18:34.834	PROCESSED	\N
3ac22982-211f-44e3-a783-2a962b906928	EventCreated	default-tenant-id	6753a8ca-6589-47c2-98e6-76e1cdaa3c00	Event	{"date": "2026-06-03T12:18:34.850Z", "name": "hif-ecopark-sim Youth Alive Night", "type": "Youth", "status": "DRAFT"}	1	2026-05-20 12:18:34.868	2026-05-20 12:18:34.876	PROCESSED	\N
7e2f842a-2cc7-4ba6-871f-342003ee54e8	EventCreated	default-tenant-id	d3ddde00-7e4e-4549-acce-626849cc57c0	Event	{"date": "2026-07-04T12:18:34.885Z", "name": "hif-ecopark-sim Kingdom Conference 2026", "type": "Conference", "status": "DRAFT"}	1	2026-05-20 12:18:34.901	2026-05-20 12:18:34.907	PROCESSED	\N
bed94e9c-7ad8-4328-9952-0e9fb8eb7030	VoucherApproved	default-tenant-id	9fb5e342-b409-43f1-8c06-6275177f2327	Voucher	{"type": "Receipt", "amount": 2500}	1	2026-05-20 12:18:35.073	2026-05-20 12:18:35.081	PROCESSED	\N
3f13b133-8bd9-4c0f-9ae1-42f399ed6e10	VisitorRegistered	default-tenant-id	7bd66d49-0618-47fd-ad02-cfe8727baeb4	Contact	{"name": "hif-ecopark-sim Visitor — Ananya Das", "source": "Sunday"}	1	2026-05-20 12:18:34.997	2026-05-20 12:18:35.003	PROCESSED	\N
8c9cb0bb-f8ea-4d6a-8a48-530a6b3954fa	MemberCreated	default-tenant-id	08433f56-2ce1-48c3-949d-ec87509dcdbe	Member	{"name": "HR Sim Staff 1779297885381", "email": "hr-sim.staff.1779297885381@grace.local", "status": "Active"}	1	2026-05-20 17:24:45.449	2026-05-20 17:24:45.486	PROCESSED	\N
13f7d1c5-4269-452a-b411-4462a24e944f	MemberCreated	default-tenant-id	6dc40e02-c1c0-41c9-9562-d36ca8d72b63	Member	{"name": "HR Sim Staff 1779299374781", "email": "hr-sim.staff.1779299374781@grace.local", "status": "Active"}	1	2026-05-20 17:49:34.802	2026-05-20 17:49:34.812	PROCESSED	\N
fec95b4f-ae01-4db2-bb90-003dbe9baf92	MemberCreated	default-tenant-id	2ee2973e-3dbb-418c-aea4-ee39724f9478	Member	{"name": "PathFirst1779300959635 PathLast1779300959635", "email": "pw.path.1779300959635@example.com", "status": "Active"}	1	2026-05-20 18:16:01.974	2026-05-20 18:16:01.981	PROCESSED	\N
cfa4d58f-3909-40e3-865b-2358761e9ae3	MemberCreated	default-tenant-id	98e9b4a4-b430-423e-96e3-bf9dcc771238	Member	{"name": "PWFirst1779374749624 PWLast1779374749624", "email": "pw.member.1779374749624@example.com", "status": "Active"}	1	2026-05-21 14:45:52.842	2026-05-21 14:45:52.866	PROCESSED	\N
d018f254-7fa2-4222-9777-cdbbff2343bb	MemberCreated	default-tenant-id	7715c94b-5534-4d20-b763-ca49ea780b06	Member	{"name": "VolFirst1779374779967 VolLast1779374779967", "email": "pw.vol.1779374779967@example.com", "status": "Active"}	1	2026-05-21 14:46:22.769	2026-05-21 14:46:22.777	PROCESSED	\N
0714fca3-6dc0-48fa-bb39-2185ed3f21b0	MemberCreated	default-tenant-id	3ff916c5-e8c6-4e9f-baef-b233545a9e0f	Member	{"name": "CareFirst1779374793851 CareLast1779374793851", "email": "pw.care.1779374793851@example.com", "status": "Active"}	1	2026-05-21 14:46:36.681	2026-05-21 14:46:36.689	PROCESSED	\N
dc0c5432-a1a9-4292-88a0-c0d7661ebb2e	CareCaseOpened	default-tenant-id	53262ce1-cd20-4fa2-9c66-b666a06e7820	CareCase	{"urgency": "MEDIUM", "category": "General Pastoral Care", "memberId": "3ff916c5-e8c6-4e9f-baef-b233545a9e0f"}	1	2026-05-21 14:46:38.73	2026-05-21 14:46:38.739	PROCESSED	\N
74436681-85eb-4d67-bb5d-474a6d6a8f88	CareLogAdded	default-tenant-id	10dd6209-569e-4fe3-ba7a-58fbdcd7f712	CareLog	{"careCaseId": "53262ce1-cd20-4fa2-9c66-b666a06e7820", "interactionType": "Note"}	1	2026-05-21 14:46:38.918	2026-05-21 14:46:38.927	PROCESSED	\N
3cb432d8-9d23-4b3b-8f89-f351de3b0b54	EventCreated	default-tenant-id	ca5d6d7d-bcfd-417c-ad66-e1c917a08c35	Event	{"date": "2026-05-21T00:00:00.000Z", "name": "PW Event 1779374806224", "type": "Service", "status": "DRAFT"}	1	2026-05-21 14:46:46.84	2026-05-21 14:46:46.864	PROCESSED	\N
a5c2f8e5-acd8-4196-b281-9acc647870ea	TenantBackupRestored	default-tenant-id	default-tenant-id	Tenant	{"at": "2026-05-24T09:00:49.563Z", "restoredPages": 11, "restoredSettings": 13}	1	2026-05-24 09:00:49.563	2026-05-24 09:00:50.441	PROCESSED	\N
d9012e34-17cd-46c6-97cf-752187f69af1	TenantBackupRestored	default-tenant-id	default-tenant-id	Tenant	{"at": "2026-05-24T09:03:41.320Z", "restoredPages": 11, "restoredSettings": 13}	1	2026-05-24 09:03:41.32	2026-05-24 09:03:42.223	PROCESSED	\N
8ad8b133-edbb-4145-8258-c06040077b57	TransactionPosted	default-tenant-id	9fb5e342-b409-43f1-8c06-6275177f2327	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00031"}	1	2026-05-20 12:18:35.085	2026-05-20 12:18:35.093	PROCESSED	\N
65df73dd-8b60-4f67-bb0b-dacce8515c90	MemberCreated	default-tenant-id	5a79ac10-43f9-4f3b-9a88-9a56d9fc684b	Member	{"name": "HR Sim Staff 1779298021072", "email": "hr-sim.staff.1779298021072@grace.local", "status": "Active"}	1	2026-05-20 17:27:01.091	2026-05-20 17:27:01.129	PROCESSED	\N
0bd7a48a-7640-4a65-8404-a2e8dc726b0b	DonationReceived	default-tenant-id	49f1a4f9-eddd-4703-ba79-e45492550296	Donation	{"date": "2026-05-20T12:18:35.007Z", "amount": 2500, "method": "Bank Transfer", "reference": "hif-ecopark-sim-offering-1779279515007"}	1	2026-05-20 12:18:36.098	2026-05-20 12:18:36.116	PROCESSED	\N
e658de6e-6d53-4524-8f61-88eed8f0bf6b	CareCaseOpened	default-tenant-id	5aaef236-08a6-48b2-972e-d3dc8ebaed79	CareCase	{"urgency": "MEDIUM", "category": "Pastoral follow-up", "memberId": "2ad34cf4-a3e3-40f2-8436-7ed668803986"}	1	2026-05-20 12:20:32.59	2026-05-20 12:20:32.612	PROCESSED	\N
2a05ded3-4274-4b34-939f-0097f2836840	MemberCreated	default-tenant-id	ef0995b5-4816-42a4-83ab-fc65fe29a6ee	Member	{"name": "PWFirst1779300941483 PWLast1779300941483", "email": "pw.member.1779300941483@example.com", "status": "Active"}	1	2026-05-20 18:15:43.246	2026-05-20 18:15:43.277	PROCESSED	\N
39362302-47c1-4e9d-b077-f955d53107d6	VoucherApproved	default-tenant-id	7278e894-4bbf-42f8-89f2-8e4c8e2d57d8	Voucher	{"type": "Receipt", "amount": 2500}	1	2026-05-20 12:20:32.858	2026-05-20 12:20:32.866	PROCESSED	\N
913dae51-c5aa-47cd-8e62-2ee4220f022a	TransactionPosted	default-tenant-id	7278e894-4bbf-42f8-89f2-8e4c8e2d57d8	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00032"}	1	2026-05-20 12:20:32.87	2026-05-20 12:20:32.878	PROCESSED	\N
28003540-e05c-4223-8f45-56f91a7d69ef	MemberCreated	default-tenant-id	512da348-0a31-4f5a-968a-17d471f5cbf3	Member	{"name": "VolFirst1779300970330 VolLast1779300970330", "email": "pw.vol.1779300970330@example.com", "status": "Active"}	1	2026-05-20 18:16:12.055	2026-05-20 18:16:12.064	PROCESSED	\N
eb3c9e11-e741-46c6-a81b-67f87d9d0e6f	DonationReceived	default-tenant-id	d1c46f71-3dd1-40b2-9147-683839b2aca2	Donation	{"date": "2026-05-20T12:20:32.782Z", "amount": 2500, "method": "Bank Transfer", "reference": "hif-ecopark-sim-offering-1779279632782"}	1	2026-05-20 12:20:33.892	2026-05-20 12:20:33.902	PROCESSED	\N
be1dc12d-6377-4ad9-920e-3b8cb6c46f97	VoucherApproved	default-tenant-id	a398c59b-892b-46a5-b1b0-d15c7882001d	Voucher	{"type": "Receipt", "amount": 987654}	1	2026-05-20 12:20:41.909	2026-05-20 12:20:41.924	PROCESSED	\N
70d6674d-4779-4dfe-84a6-80d5d0303047	MemberCreated	default-tenant-id	352be535-1722-4f5a-a659-09943ac51095	Member	{"name": "CareFirst1779300982225 CareLast1779300982225", "email": "pw.care.1779300982225@example.com", "status": "Active"}	1	2026-05-20 18:16:24.621	2026-05-20 18:16:24.629	PROCESSED	\N
e76eb586-1242-4ff2-ae16-595f3b1d8e53	TransactionPosted	default-tenant-id	a398c59b-892b-46a5-b1b0-d15c7882001d	Voucher	{"type": "Receipt", "voucherNo": "RECEIPT-2026-00033"}	1	2026-05-20 12:20:41.928	2026-05-20 12:20:41.935	PROCESSED	\N
b14a2bc9-a272-40f4-b044-2eb3a91b5087	DonationReceived	default-tenant-id	3b0782a3-8048-4fc7-93e7-5c5601ae06e2	Donation	{"date": "2026-05-20T12:20:41.841Z", "amount": 987654, "method": "Bank Transfer", "reference": "PW-DEEP-1779279641153"}	1	2026-05-20 12:20:42.971	2026-05-20 12:20:42.976	PROCESSED	\N
08ff8081-ba9a-4c47-8419-211f1b144e29	CareCaseOpened	default-tenant-id	e97bddfe-c16a-4634-bb42-ecdba20fe142	CareCase	{"urgency": "MEDIUM", "category": "General Pastoral Care", "memberId": "352be535-1722-4f5a-a659-09943ac51095"}	1	2026-05-20 18:16:26.891	2026-05-20 18:16:26.897	PROCESSED	\N
feea6dff-e47a-449d-9f9a-2b83f0942edd	ServiceSegmentAdvanced	default-tenant-id	0a74d41c-acc9-4c04-85e8-c441bd2fbd2f	Event	{"index": 1, "action": "complete", "actorUserId": "cbf6a56e-b0a1-45da-bdd3-5518b14ab417"}	1	2026-05-20 15:49:29.729	2026-05-20 15:49:29.747	PROCESSED	\N
76b37a31-7d6a-4748-9a1e-d96bd7662361	ServiceSegmentAdvanced	default-tenant-id	0a74d41c-acc9-4c04-85e8-c441bd2fbd2f	Event	{"index": 2, "action": "complete", "actorUserId": "cbf6a56e-b0a1-45da-bdd3-5518b14ab417"}	1	2026-05-20 15:49:30.673	2026-05-20 15:49:30.678	PROCESSED	\N
11e95ba4-25a8-4394-a812-ea8d22ad1a67	CareLogAdded	default-tenant-id	40918b74-80e0-46f5-82a1-dc944f0a9d6c	CareLog	{"careCaseId": "e97bddfe-c16a-4634-bb42-ecdba20fe142", "interactionType": "Note"}	1	2026-05-20 18:16:27.064	2026-05-20 18:16:27.072	PROCESSED	\N
f8618758-116b-449b-805c-e297b7062990	ServiceSegmentAdvanced	default-tenant-id	0a74d41c-acc9-4c04-85e8-c441bd2fbd2f	Event	{"index": 3, "action": "complete", "actorUserId": "cbf6a56e-b0a1-45da-bdd3-5518b14ab417"}	1	2026-05-20 15:49:31.571	2026-05-20 15:49:31.576	PROCESSED	\N
f658cc81-33e9-4476-8eac-1be4315b81b9	ServiceSegmentAdvanced	default-tenant-id	0a74d41c-acc9-4c04-85e8-c441bd2fbd2f	Event	{"index": 4, "action": "complete", "actorUserId": "cbf6a56e-b0a1-45da-bdd3-5518b14ab417"}	1	2026-05-20 15:49:31.974	2026-05-20 15:49:31.979	PROCESSED	\N
54a23c61-e68d-4e7b-ae8d-72da72e8dbc2	EventCreated	default-tenant-id	9c37bd90-be9f-41a6-b809-1b2aba76fda3	Event	{"date": "2026-05-20T00:00:00.000Z", "name": "PW Event 1779300994027", "type": "Service", "status": "DRAFT"}	1	2026-05-20 18:16:34.639	2026-05-20 18:16:34.649	PROCESSED	\N
3b07ff56-09d9-494c-b964-39a7c5ca4d58	ServiceSegmentAdvanced	default-tenant-id	0a74d41c-acc9-4c04-85e8-c441bd2fbd2f	Event	{"index": 4, "action": "complete", "actorUserId": "cbf6a56e-b0a1-45da-bdd3-5518b14ab417"}	1	2026-05-20 15:49:33.192	2026-05-20 15:49:33.197	PROCESSED	\N
f972ec37-311a-4747-a379-d516932b1bf2	ServiceSegmentAdvanced	default-tenant-id	0a74d41c-acc9-4c04-85e8-c441bd2fbd2f	Event	{"index": 4, "action": "complete", "actorUserId": "cbf6a56e-b0a1-45da-bdd3-5518b14ab417"}	1	2026-05-20 15:49:34.733	2026-05-20 15:49:34.739	PROCESSED	\N
3e53b6f6-abb1-4101-8258-fd8df52d3a9c	MemberCreated	default-tenant-id	f92dc6d1-359f-4a0b-be00-9dca7fdda1d0	Member	{"name": "PathFirst1779374769083 PathLast1779374769083", "email": "pw.path.1779374769083@example.com", "status": "Active"}	1	2026-05-21 14:46:11.396	2026-05-21 14:46:11.404	PROCESSED	\N
7a3a8b96-1964-4b7e-9ff4-131429c643f2	ServiceSegmentAdvanced	default-tenant-id	0a74d41c-acc9-4c04-85e8-c441bd2fbd2f	Event	{"index": 4, "action": "skip", "actorUserId": "cbf6a56e-b0a1-45da-bdd3-5518b14ab417"}	1	2026-05-20 15:49:38.017	2026-05-20 15:49:38.023	PROCESSED	\N
921011b7-c5c6-4735-aac4-929f467a169c	ServiceSegmentAdvanced	default-tenant-id	0a74d41c-acc9-4c04-85e8-c441bd2fbd2f	Event	{"index": 4, "action": "skip", "actorUserId": "cbf6a56e-b0a1-45da-bdd3-5518b14ab417"}	1	2026-05-20 15:49:39.309	2026-05-20 15:49:39.315	PROCESSED	\N
18880b2d-8f4c-4000-866f-c01996589fef	ServiceSegmentAdvanced	default-tenant-id	0a74d41c-acc9-4c04-85e8-c441bd2fbd2f	Event	{"index": 4, "action": "complete", "actorUserId": "cbf6a56e-b0a1-45da-bdd3-5518b14ab417"}	1	2026-05-20 15:49:40.344	2026-05-20 15:49:40.351	PROCESSED	\N
\.


--
-- Data for Name: ExportLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExportLog" (id, "tenantId", "exportType", "filtersJson", "rowCount", "checksumSha256", "generatedByUserId", "generatedAt", "sourceEntityType", "sourceEntityId") FROM stdin;
\.


--
-- Data for Name: Family; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Family" (id, "tenantId", name, "imageUrl", "addressLine1", "addressLine2", city, "stateRegion", "postalCode", country, latitude, longitude, "createdAt", "updatedAt") FROM stdin;
2e31e875-4907-48d5-a629-cd11bd8ef7cd	default-tenant-id	PW Household 1779259978592	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:53:00.628	2026-05-20 06:53:00.628
e1aec606-acc9-4dde-872d-330548af6cf0	default-tenant-id	PW Household 1779260833777	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 07:07:15.354	2026-05-20 07:07:15.354
c911c033-b472-473a-85c2-22751f495d5a	default-tenant-id	PW Household 1779261176438	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 07:12:58.521	2026-05-20 07:12:58.521
16d2b157-887c-47ef-b765-aea0774598aa	default-tenant-id	PW Household 1779262083769	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 07:28:05.904	2026-05-20 07:28:05.904
0551f21b-fd30-4be7-83f3-280c93b4d880	default-tenant-id	PW Household 1779275760621	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 11:16:02.444	2026-05-20 11:16:02.444
25d0ef6b-7dfb-4dab-b20f-28dc776a32a0	default-tenant-id	hif-ecopark-sim Nair Household	\N	12 Palm Grove, Eco Park	\N	Kolkata	West Bengal	700091	India	\N	\N	2026-05-20 12:16:37.64	2026-05-20 12:16:37.64
ec74a6c8-0c66-4dca-9335-76be36c3f225	default-tenant-id	E2E Household 1779279680262	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 12:21:21.048	2026-05-20 12:21:21.048
514992a7-84b2-4c57-9bf8-497a284c1f53	default-tenant-id	PW Household 1779300941483	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 18:15:43.307	2026-05-20 18:15:43.307
d64edfbb-c4eb-42f5-ae13-16415ccac549	default-tenant-id	PW Household 1779374749624	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-21 14:45:52.911	2026-05-21 14:45:52.911
\.


--
-- Data for Name: FinancialAuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FinancialAuditLog" (id, "tenantId", action, "entityType", "entityId", "actorUserId", "beforeJson", "afterJson", metadata, "createdAt") FROM stdin;
e73c79ed-4383-400d-b4a4-1443f6b07c38	default-tenant-id	voucher.created	Voucher	dfefc66c-06e5-423a-bd54-1f24349f1f58	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 14180, "status": "draft"}	null	2026-05-20 06:49:37.485
a5acf538-2827-4dd0-b06c-f5a85d590b3b	default-tenant-id	voucher.approved	Voucher	dfefc66c-06e5-423a-bd54-1f24349f1f58	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:37.494
a0ac2d6b-1716-49fc-ab1a-384b0d23d16f	default-tenant-id	voucher.posted	Voucher	dfefc66c-06e5-423a-bd54-1f24349f1f58	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00001"}	null	2026-05-20 06:49:37.528
acfa31b4-aa72-4f11-89a1-c2f61ec136ab	default-tenant-id	voucher.created	Voucher	81741658-f336-46f8-bb20-ca095a841095	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 205, "status": "draft"}	null	2026-05-20 06:49:37.936
f857ca49-1738-46d2-88c5-1b08c531815d	default-tenant-id	voucher.approved	Voucher	81741658-f336-46f8-bb20-ca095a841095	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:37.941
80b7260b-0be3-48f6-a3a1-448d8042e768	default-tenant-id	voucher.posted	Voucher	81741658-f336-46f8-bb20-ca095a841095	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00002"}	null	2026-05-20 06:49:37.976
52059248-9725-4dc2-992d-5eee263518dc	default-tenant-id	voucher.created	Voucher	5aed788d-6d4b-4458-a7e0-0e9600e16204	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 300, "status": "draft"}	null	2026-05-20 06:49:38.047
b3486ad2-4cd3-4ec8-8776-9bd1a934a985	default-tenant-id	voucher.approved	Voucher	5aed788d-6d4b-4458-a7e0-0e9600e16204	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:38.052
b046dd0d-56a4-482e-80b2-829b31aba7d6	default-tenant-id	voucher.posted	Voucher	5aed788d-6d4b-4458-a7e0-0e9600e16204	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00003"}	null	2026-05-20 06:49:38.086
0eea61cf-b644-4325-9aa5-d09fb9ff1b2f	default-tenant-id	voucher.created	Voucher	b00225ed-3429-49e6-b685-2b01fffba48c	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 395, "status": "draft"}	null	2026-05-20 06:49:38.17
efaa0df5-76a6-4b06-81dc-6ce1b7659f88	default-tenant-id	voucher.approved	Voucher	b00225ed-3429-49e6-b685-2b01fffba48c	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:38.175
828eae96-6968-42fa-b3b4-4e86eb628f3f	default-tenant-id	voucher.posted	Voucher	b00225ed-3429-49e6-b685-2b01fffba48c	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00004"}	null	2026-05-20 06:49:38.211
35feba50-4775-43c5-8f84-83653e0deb1a	default-tenant-id	voucher.created	Voucher	daf7817f-c2d7-4c8a-a627-eb3c38276fd4	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 330, "status": "draft"}	null	2026-05-20 06:49:38.263
983aac3d-3d54-4ef2-923f-86ab807b51f9	default-tenant-id	voucher.approved	Voucher	daf7817f-c2d7-4c8a-a627-eb3c38276fd4	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:38.266
e084acb4-0a0f-49c3-a467-9bd56b385600	default-tenant-id	voucher.posted	Voucher	daf7817f-c2d7-4c8a-a627-eb3c38276fd4	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00005"}	null	2026-05-20 06:49:38.293
b7f2584f-1ebe-4791-a6ad-24704fdae551	default-tenant-id	voucher.created	Voucher	b2ee5dc4-e155-41b1-86fa-1e3f17960afc	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 425, "status": "draft"}	null	2026-05-20 06:49:38.345
feeb52ca-3fa1-412d-96b1-bbacfd72725a	default-tenant-id	voucher.approved	Voucher	b2ee5dc4-e155-41b1-86fa-1e3f17960afc	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:38.349
deeca25f-2ab7-4b45-82b1-01c7db4ceefa	default-tenant-id	voucher.posted	Voucher	b2ee5dc4-e155-41b1-86fa-1e3f17960afc	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00006"}	null	2026-05-20 06:49:38.377
8de4e6f7-6c22-47ce-9727-3f3b0be140a8	default-tenant-id	voucher.created	Voucher	5ffb0752-e5c5-4fef-a262-564580c25de1	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 520, "status": "draft"}	null	2026-05-20 06:49:38.435
1419a18d-0433-48c6-80b7-59fd5f4e84f6	default-tenant-id	voucher.approved	Voucher	5ffb0752-e5c5-4fef-a262-564580c25de1	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:38.439
f497b3da-3d79-4d9b-b8d9-c2b7a43d7af6	default-tenant-id	voucher.posted	Voucher	5ffb0752-e5c5-4fef-a262-564580c25de1	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00007"}	null	2026-05-20 06:49:38.47
62b92974-9b75-46ea-9b88-8b21d5b8b958	default-tenant-id	voucher.created	Voucher	dcc8562c-ac3b-42ee-8e02-0ad0c9d99682	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 230, "status": "draft"}	null	2026-05-20 06:49:38.519
9df20855-251b-49e6-8249-8c1bba5660b8	default-tenant-id	voucher.approved	Voucher	dcc8562c-ac3b-42ee-8e02-0ad0c9d99682	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:38.526
5d26e9db-bc52-437b-826f-27a39ecc4463	default-tenant-id	voucher.posted	Voucher	dcc8562c-ac3b-42ee-8e02-0ad0c9d99682	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00008"}	null	2026-05-20 06:49:38.549
87385155-16b6-438a-87f4-b6f7007dd75b	default-tenant-id	voucher.created	Voucher	713f5a4e-fe4d-4da9-9a78-be975210d810	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 165, "status": "draft"}	null	2026-05-20 06:49:38.583
deeacac7-f979-40b3-b2d8-5fcdce30befa	default-tenant-id	voucher.approved	Voucher	713f5a4e-fe4d-4da9-9a78-be975210d810	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:38.585
569b5598-84ab-427e-bad1-d054e5d92fd5	default-tenant-id	voucher.posted	Voucher	713f5a4e-fe4d-4da9-9a78-be975210d810	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00009"}	null	2026-05-20 06:49:38.605
5624a246-be50-4cef-ba7d-47f04f074d5e	default-tenant-id	voucher.created	Voucher	57d2b2da-91eb-4281-8198-fc8fa0f572da	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 440, "status": "draft"}	null	2026-05-20 06:49:38.646
8db6aecb-89ee-4569-a7a1-05cb5e128690	default-tenant-id	voucher.approved	Voucher	57d2b2da-91eb-4281-8198-fc8fa0f572da	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:38.649
166cdb29-75c7-41e8-8da6-faf4574322ff	default-tenant-id	voucher.posted	Voucher	57d2b2da-91eb-4281-8198-fc8fa0f572da	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00010"}	null	2026-05-20 06:49:38.674
97dda291-c252-47c0-8e16-2c9fbffe76ff	default-tenant-id	voucher.created	Voucher	708c8854-da4d-44d3-b1ff-273e77fd2927	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 355, "status": "draft"}	null	2026-05-20 06:49:38.726
7af68c0e-f203-417d-87bc-233584c5a4a2	default-tenant-id	voucher.approved	Voucher	708c8854-da4d-44d3-b1ff-273e77fd2927	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:38.729
373600e7-11b1-4a74-809a-c29b9582ddac	default-tenant-id	voucher.posted	Voucher	708c8854-da4d-44d3-b1ff-273e77fd2927	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00011"}	null	2026-05-20 06:49:38.749
4158e352-9440-4fe5-b3a1-9056eb212630	default-tenant-id	voucher.created	Voucher	0c16ca38-0931-48d0-84c7-c78c75be6e13	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 6900, "status": "draft"}	null	2026-05-20 06:49:38.786
cef24348-6fc0-4429-ad3f-881bad344841	default-tenant-id	voucher.approved	Voucher	0c16ca38-0931-48d0-84c7-c78c75be6e13	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:38.788
a1bbe6a9-111e-48c0-b94b-68a640784acd	default-tenant-id	voucher.posted	Voucher	0c16ca38-0931-48d0-84c7-c78c75be6e13	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00012"}	null	2026-05-20 06:49:38.808
23c31d79-8ac9-4a33-9ad1-ef795e270bbd	default-tenant-id	voucher.created	Voucher	b4442385-f24b-4663-9f2f-7eeb7d4a85c2	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 385, "status": "draft"}	null	2026-05-20 06:49:38.837
2bf30dc4-7f47-4dcb-b46c-c1d4f0b5280a	default-tenant-id	voucher.approved	Voucher	b4442385-f24b-4663-9f2f-7eeb7d4a85c2	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:38.838
ed64160e-97c8-41ed-a079-23f15b20c7a0	default-tenant-id	voucher.posted	Voucher	b4442385-f24b-4663-9f2f-7eeb7d4a85c2	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00013"}	null	2026-05-20 06:49:38.86
a08cb66a-04fa-4857-9315-449b50bd76de	default-tenant-id	voucher.created	Voucher	9fbb9a28-c7f0-4755-b368-818017e88e16	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 480, "status": "draft"}	null	2026-05-20 06:49:38.887
7e171caf-d3d0-4102-ace0-d8ec702c759b	default-tenant-id	voucher.approved	Voucher	9fbb9a28-c7f0-4755-b368-818017e88e16	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:38.889
85ab6008-f13c-4b1e-bd05-9f3f2d6eb9b2	default-tenant-id	voucher.posted	Voucher	9fbb9a28-c7f0-4755-b368-818017e88e16	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00014"}	null	2026-05-20 06:49:38.903
3658e472-c203-45e5-a082-a461b1c4520f	default-tenant-id	voucher.created	Voucher	b88a5e5e-d348-4063-993a-5d69813e39bd	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 190, "status": "draft"}	null	2026-05-20 06:49:38.932
3f48b9e4-6124-4a21-a32d-1b4fae086325	default-tenant-id	voucher.approved	Voucher	b88a5e5e-d348-4063-993a-5d69813e39bd	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:38.934
8c84c054-7305-4576-b24f-9809c40c298f	default-tenant-id	voucher.posted	Voucher	b88a5e5e-d348-4063-993a-5d69813e39bd	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00015"}	null	2026-05-20 06:49:38.953
8f5d122f-e31c-4ad5-acaa-c449fede3235	default-tenant-id	voucher.created	Voucher	59f0f1a3-c521-4b44-a734-f02e903e8c02	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 285, "status": "draft"}	null	2026-05-20 06:49:38.982
428df4ad-8340-47c2-bef8-7ccbd8ae77dd	default-tenant-id	voucher.approved	Voucher	59f0f1a3-c521-4b44-a734-f02e903e8c02	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:38.983
aba3569f-f4af-4749-a3e6-5664ec443678	default-tenant-id	voucher.posted	Voucher	59f0f1a3-c521-4b44-a734-f02e903e8c02	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00016"}	null	2026-05-20 06:49:38.997
e0c79c2e-b054-421f-b900-f94ee80a388b	default-tenant-id	voucher.created	Voucher	e7455175-9b8f-4b13-a635-ae625724c883	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 220, "status": "draft"}	null	2026-05-20 06:49:39.032
cecb54d8-1a1f-4bff-9df0-c16fba748a34	default-tenant-id	voucher.approved	Voucher	e7455175-9b8f-4b13-a635-ae625724c883	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:39.034
2ab96524-eda4-4be6-9c05-051d89a2ecf9	default-tenant-id	voucher.posted	Voucher	e7455175-9b8f-4b13-a635-ae625724c883	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00017"}	null	2026-05-20 06:49:39.049
1a7549c8-7409-463e-a988-16c05df1fe1e	default-tenant-id	voucher.created	Voucher	b62d9e86-98b9-4ef0-825c-eeb916519e9a	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 15000, "status": "draft"}	null	2026-05-20 06:49:39.078
4fb47ef9-73d8-4969-a3c9-b6eff474dc57	default-tenant-id	voucher.approved	Voucher	b62d9e86-98b9-4ef0-825c-eeb916519e9a	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:39.079
dcf1b000-b20b-4116-a22a-f9567acfadcd	default-tenant-id	voucher.posted	Voucher	b62d9e86-98b9-4ef0-825c-eeb916519e9a	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00018"}	null	2026-05-20 06:49:39.1
812a0dc7-c567-4ebc-9830-5bcb0ab17044	default-tenant-id	voucher.created	Voucher	bb94d7d0-fae8-4269-9ac8-abbec50e8512	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 410, "status": "draft"}	null	2026-05-20 06:49:39.129
7c2b898d-076e-4da6-9f67-338b5b0a30e8	default-tenant-id	voucher.approved	Voucher	bb94d7d0-fae8-4269-9ac8-abbec50e8512	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:39.132
e74b6bb7-70ed-489d-8c93-2e4d0a9a1655	default-tenant-id	voucher.posted	Voucher	bb94d7d0-fae8-4269-9ac8-abbec50e8512	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00019"}	null	2026-05-20 06:49:39.152
d17ada79-1d28-44ca-8176-af7a10e8b84f	default-tenant-id	voucher.created	Voucher	83b989f2-cf20-4bc6-ac82-bedb2cd00138	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 505, "status": "draft"}	null	2026-05-20 06:49:39.186
f92af771-3350-4c3e-b48e-a3f89a821ed6	default-tenant-id	voucher.approved	Voucher	83b989f2-cf20-4bc6-ac82-bedb2cd00138	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:39.188
a62927ed-2240-40d5-9c66-0da1f8ac4ca6	default-tenant-id	voucher.posted	Voucher	83b989f2-cf20-4bc6-ac82-bedb2cd00138	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00020"}	null	2026-05-20 06:49:39.203
a4516da9-82fe-4352-98f8-47759996aa17	default-tenant-id	voucher.created	Voucher	ff8d6354-1a2b-421d-aa0f-6346aa0b2769	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 560, "status": "draft"}	null	2026-05-20 06:49:39.232
ce3adc93-f32a-4857-833d-6737ec69d1e2	default-tenant-id	voucher.approved	Voucher	ff8d6354-1a2b-421d-aa0f-6346aa0b2769	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:39.236
7178a0bc-4a77-4170-888a-433e5ea6300e	default-tenant-id	voucher.posted	Voucher	ff8d6354-1a2b-421d-aa0f-6346aa0b2769	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00021"}	null	2026-05-20 06:49:39.255
5a84f335-cc57-47ce-a146-97dab6d81e9a	default-tenant-id	voucher.created	Voucher	781fc419-f67b-42d0-8a68-1f8e78744b51	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 230, "status": "draft"}	null	2026-05-20 06:49:39.283
46aed9a5-f24d-4f29-84c7-fd3ddae6df05	default-tenant-id	voucher.approved	Voucher	781fc419-f67b-42d0-8a68-1f8e78744b51	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:39.285
653629bc-e411-4dfa-a929-3c5b1ded31f3	default-tenant-id	voucher.posted	Voucher	781fc419-f67b-42d0-8a68-1f8e78744b51	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00022"}	null	2026-05-20 06:49:39.298
bd0dc377-e919-4623-b552-88fee0bdcb6a	default-tenant-id	voucher.created	Voucher	6f4d5a2f-e0dc-47da-a9ff-940ffa07f9fc	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 7300, "status": "draft"}	null	2026-05-20 06:49:39.334
d39b68a0-a6a4-40b1-aa63-df03338c9c31	default-tenant-id	voucher.approved	Voucher	6f4d5a2f-e0dc-47da-a9ff-940ffa07f9fc	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:39.336
4696710b-6f4d-4240-82d9-4b80567cea31	default-tenant-id	voucher.posted	Voucher	6f4d5a2f-e0dc-47da-a9ff-940ffa07f9fc	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00023"}	null	2026-05-20 06:49:39.351
34d23a2b-7cfc-4309-9d5e-1868599afddc	default-tenant-id	voucher.created	Voucher	66db418a-5e4e-4ba0-9bf4-de38463fdfd8	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 220, "status": "draft"}	null	2026-05-20 06:49:39.378
0ecc6619-16e3-48cc-afd8-4c542a5ee378	default-tenant-id	voucher.approved	Voucher	66db418a-5e4e-4ba0-9bf4-de38463fdfd8	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:39.38
94b1e5d5-a5da-4c96-ba41-55dee2f27d80	default-tenant-id	voucher.posted	Voucher	66db418a-5e4e-4ba0-9bf4-de38463fdfd8	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00024"}	null	2026-05-20 06:49:39.402
1602fc3b-962e-4b8d-b3de-f55c0586b621	default-tenant-id	voucher.created	Voucher	21befbc0-1468-412b-a56f-b079444ae73d	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 455, "status": "draft"}	null	2026-05-20 06:49:39.43
a686d0d6-fc2a-443e-b113-2d15b5334e5e	default-tenant-id	voucher.approved	Voucher	21befbc0-1468-412b-a56f-b079444ae73d	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:39.432
ff97e750-7f1a-47c1-83a0-45cab4c50d15	default-tenant-id	voucher.posted	Voucher	21befbc0-1468-412b-a56f-b079444ae73d	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00025"}	null	2026-05-20 06:49:39.444
e792ee32-9a75-4a28-8475-9d867149f1ef	default-tenant-id	voucher.created	Voucher	021c72f6-678a-4276-8dd9-696c06bf40e3	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 370, "status": "draft"}	null	2026-05-20 06:49:39.474
893eea6e-5181-4366-8a14-23d8fed3c188	default-tenant-id	voucher.approved	Voucher	021c72f6-678a-4276-8dd9-696c06bf40e3	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:39.476
f0784255-339f-4c70-b2be-069709728b47	default-tenant-id	voucher.posted	Voucher	021c72f6-678a-4276-8dd9-696c06bf40e3	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00026"}	null	2026-05-20 06:49:39.488
7bf54b03-6f24-43ec-abec-1c70f70006d6	default-tenant-id	voucher.created	Voucher	f6563df8-2f5c-479e-bc48-65abee7622eb	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 425, "status": "draft"}	null	2026-05-20 06:49:39.514
76e2ad02-9ca9-4de0-a114-f4105ade4e15	default-tenant-id	voucher.approved	Voucher	f6563df8-2f5c-479e-bc48-65abee7622eb	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:39.516
86d2138b-ed21-4bac-bf39-401ad5790f56	default-tenant-id	voucher.posted	Voucher	f6563df8-2f5c-479e-bc48-65abee7622eb	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00027"}	null	2026-05-20 06:49:39.544
7a8bc701-ac45-4ebb-a4af-d9662f5ed7d2	default-tenant-id	voucher.created	Voucher	0c31578f-32ca-4bb0-b8b9-9e7b4b0417cb	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 520, "status": "draft"}	null	2026-05-20 06:49:39.567
f42282da-9a11-4cb1-af30-acc87e60cb23	default-tenant-id	voucher.approved	Voucher	0c31578f-32ca-4bb0-b8b9-9e7b4b0417cb	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:49:39.569
0e92cd53-4a9b-4dca-9b87-e270ae32b2b3	default-tenant-id	voucher.posted	Voucher	0c31578f-32ca-4bb0-b8b9-9e7b4b0417cb	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00028"}	null	2026-05-20 06:49:39.58
79f786d8-9c75-4cde-91e3-d5476178146e	default-tenant-id	voucher.created	Voucher	4af4b97f-fb46-4413-b8e8-d5efa809ec9f	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 250, "status": "draft"}	null	2026-05-20 06:51:12.616
ad808faa-a76e-426a-805d-30bdb6c5ac2c	default-tenant-id	voucher.approved	Voucher	4af4b97f-fb46-4413-b8e8-d5efa809ec9f	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 06:51:12.634
ea723eb1-0737-4917-9dd5-047ea18e6b18	default-tenant-id	voucher.posted	Voucher	4af4b97f-fb46-4413-b8e8-d5efa809ec9f	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00029"}	null	2026-05-20 06:51:12.661
a88e084f-8534-4f0f-8c8f-11abe5bb590c	default-tenant-id	donation.recorded	Donation	0188bf33-9418-4577-8ea9-632c6d58f85a	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"amount": 250, "fundId": null, "method": "Bank Transfer", "voucherId": "4af4b97f-fb46-4413-b8e8-d5efa809ec9f"}	null	2026-05-20 06:51:12.689
588dbae1-9587-4a6a-9fca-9ba7664ec5be	default-tenant-id	voucher.created	Voucher	296f9834-07b5-4c4e-897e-a3a40e721fbc	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 250, "status": "draft"}	null	2026-05-20 10:23:04.67
b16c2e35-1453-4997-8813-cb071e2f3e89	default-tenant-id	voucher.approved	Voucher	296f9834-07b5-4c4e-897e-a3a40e721fbc	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 10:23:04.684
c1f9634d-d666-44b1-8e9d-f9aa6e160f0c	default-tenant-id	voucher.posted	Voucher	296f9834-07b5-4c4e-897e-a3a40e721fbc	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00030"}	null	2026-05-20 10:23:04.712
2af65aea-6b98-47d6-baf0-07238215d2f4	default-tenant-id	donation.recorded	Donation	3c3d90ee-a62a-42b1-8431-ff1ad005756d	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"amount": 250, "fundId": null, "method": "Bank Transfer", "voucherId": "296f9834-07b5-4c4e-897e-a3a40e721fbc"}	null	2026-05-20 10:23:04.754
f06c3226-f705-40cd-896f-a44f22721075	default-tenant-id	voucher.created	Voucher	9fb5e342-b409-43f1-8c06-6275177f2327	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 2500, "status": "draft"}	null	2026-05-20 12:18:35.052
15cb67fc-013e-49eb-a3f5-e0059d90f49d	default-tenant-id	voucher.approved	Voucher	9fb5e342-b409-43f1-8c06-6275177f2327	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 12:18:35.055
13039d9a-47e3-43f3-a5de-78b2cd8590d9	default-tenant-id	voucher.posted	Voucher	9fb5e342-b409-43f1-8c06-6275177f2327	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00031"}	null	2026-05-20 12:18:35.073
f53ae3b6-12da-4707-8575-093c503939c7	default-tenant-id	donation.recorded	Donation	49f1a4f9-eddd-4703-ba79-e45492550296	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"amount": 2500, "fundId": null, "method": "Bank Transfer", "voucherId": "9fb5e342-b409-43f1-8c06-6275177f2327"}	null	2026-05-20 12:18:35.106
04ce33a0-18cc-40b9-93c7-0a6530d8cb82	default-tenant-id	voucher.created	Voucher	7278e894-4bbf-42f8-89f2-8e4c8e2d57d8	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 2500, "status": "draft"}	null	2026-05-20 12:20:32.82
141a13a6-de10-44a6-a8f3-1a1c4185eaaa	default-tenant-id	voucher.approved	Voucher	7278e894-4bbf-42f8-89f2-8e4c8e2d57d8	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 12:20:32.833
db59601e-8564-404c-9eaf-df76dc14d60e	default-tenant-id	voucher.posted	Voucher	7278e894-4bbf-42f8-89f2-8e4c8e2d57d8	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00032"}	null	2026-05-20 12:20:32.857
c440aa04-1adc-47da-91bc-3b2f8112e02b	default-tenant-id	donation.recorded	Donation	d1c46f71-3dd1-40b2-9147-683839b2aca2	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"amount": 2500, "fundId": null, "method": "Bank Transfer", "voucherId": "7278e894-4bbf-42f8-89f2-8e4c8e2d57d8"}	null	2026-05-20 12:20:32.886
d19707c8-548d-4b94-ae97-9cf8a331abc6	default-tenant-id	voucher.created	Voucher	a398c59b-892b-46a5-b1b0-d15c7882001d	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"type": "Receipt", "amount": 987654, "status": "draft"}	null	2026-05-20 12:20:41.878
153dac74-4898-4bd7-84bb-12e44ceb6fe1	default-tenant-id	voucher.approved	Voucher	a398c59b-892b-46a5-b1b0-d15c7882001d	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "approved"}	null	2026-05-20 12:20:41.882
cb1a6f32-2ee9-4f97-bc38-815ea30f8fa9	default-tenant-id	voucher.posted	Voucher	a398c59b-892b-46a5-b1b0-d15c7882001d	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"status": "posted", "voucherNo": "RECEIPT-2026-00033"}	null	2026-05-20 12:20:41.908
c965d052-b4ff-4fa5-a1ba-5ac70276651c	default-tenant-id	donation.recorded	Donation	3b0782a3-8048-4fc7-93e7-5c5601ae06e2	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	null	{"amount": 987654, "fundId": null, "method": "Bank Transfer", "voucherId": "a398c59b-892b-46a5-b1b0-d15c7882001d"}	null	2026-05-20 12:20:41.945
\.


--
-- Data for Name: FinancialPeriod; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FinancialPeriod" (id, "financialYearId", name, "startDate", "endDate", "isOpen", "isLocked") FROM stdin;
\.


--
-- Data for Name: FinancialReceipt; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FinancialReceipt" (id, "tenantId", "receiptNo", "donationId", "voucherId", "issueDate", amount, "donorName", "donorEmail", "donorPhone", "fundId", "campaignId", "eightyGEligible", "pdfUrl", "pdfChecksumSha256", "regeneratedCount", "createdAt", "updatedAt") FROM stdin;
e9bd7abb-e2a9-4e8c-9bff-66b09f52a07c	default-tenant-id	RCP-2026-00001	0188bf33-9418-4577-8ea9-632c6d58f85a	4af4b97f-fb46-4413-b8e8-d5efa809ec9f	2026-05-20 06:51:13.742	250.00	Anonymous Donor	\N	\N	\N	\N	f	/uploads/receipts/default-tenant-id/RCP-2026-00001.pdf	8451fca3d89c82f688cbc7478a3115b6d1fdb5d416135b7fac1521deabfc5279	0	2026-05-20 06:51:13.742	2026-05-20 06:51:13.742
30999b68-10e7-468f-bff3-00fd1adcf90b	default-tenant-id	RCP-2026-00002	3c3d90ee-a62a-42b1-8431-ff1ad005756d	296f9834-07b5-4c4e-897e-a3a40e721fbc	2026-05-20 10:23:05.738	250.00	Anonymous Donor	\N	\N	\N	\N	f	/uploads/receipts/default-tenant-id/RCP-2026-00002.pdf	a3bb15b513abdb6cafc70a6d3010955bd4c355c062b82a979a04a44522b8def1	0	2026-05-20 10:23:05.738	2026-05-20 10:23:05.738
258646d8-1829-42b7-9ec3-6ee760a68769	default-tenant-id	RCP-2026-00003	49f1a4f9-eddd-4703-ba79-e45492550296	9fb5e342-b409-43f1-8c06-6275177f2327	2026-05-20 12:18:36.094	2500.00	Anonymous Donor	\N	\N	\N	\N	f	/uploads/receipts/default-tenant-id/RCP-2026-00003.pdf	2f969b716bdf6acf7a21d07bc1d29e0ef3c37b8e06a01eec177a14b36abe8927	0	2026-05-20 12:18:36.094	2026-05-20 12:18:36.094
f1db0938-533b-4a55-a452-3f59dc76bf31	default-tenant-id	RCP-2026-00004	d1c46f71-3dd1-40b2-9147-683839b2aca2	7278e894-4bbf-42f8-89f2-8e4c8e2d57d8	2026-05-20 12:20:33.888	2500.00	Anonymous Donor	\N	\N	\N	\N	f	/uploads/receipts/default-tenant-id/RCP-2026-00004.pdf	ec2c61e678b72ea77fe8f2ed9a0fee18d22e3b9a276fc821af0839605a5bf9e6	0	2026-05-20 12:20:33.888	2026-05-20 12:20:33.888
d1a6a723-9945-499b-955c-057bf5f0d811	default-tenant-id	RCP-2026-00005	3b0782a3-8048-4fc7-93e7-5c5601ae06e2	a398c59b-892b-46a5-b1b0-d15c7882001d	2026-05-20 12:20:42.968	987654.00	Anonymous Donor	\N	\N	\N	\N	f	/uploads/receipts/default-tenant-id/RCP-2026-00005.pdf	61e5d15cc61cdea6986426dd644fad2af4554b9566676ea73ac21e52bbaa173c	0	2026-05-20 12:20:42.968	2026-05-20 12:20:42.968
\.


--
-- Data for Name: FinancialYear; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FinancialYear" (id, "tenantId", name, "startDate", "endDate", "isActive", "isClosed") FROM stdin;
2412b5b8-3c09-414e-b2ea-8bf5c761dc08	default-tenant-id	FY 26-27	2026-03-31 18:30:00	2027-03-31 18:29:59.999	t	f
\.


--
-- Data for Name: Fund; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Fund" (id, "tenantId", name, type, description, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: GatewayPaymentOrder; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GatewayPaymentOrder" (id, "tenantId", gateway, "externalOrderId", status, "donationAmount", "grossAmount", "gatewayFeeAmount", "donorCoveredFee", currency, "donorName", "donorPhone", "donorEmail", "donorId", "donationCategory", "fundId", "campaignId", "eventId", "serviceCollectionSessionId", "isAnonymous", "metadataJson", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: GatewaySettlement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GatewaySettlement" (id, "tenantId", gateway, "externalSettlementId", "settlementDate", "grossAmount", "feeAmount", "netAmount", "bankReference", status, "settlementVoucherId", "feeVoucherId", "importedAt", "reconciledAt", notes) FROM stdin;
\.


--
-- Data for Name: GatewaySettlementLine; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GatewaySettlementLine" (id, "tenantId", "settlementId", "donationId", "externalPaymentId", amount, "feeAmount", "matchStatus") FROM stdin;
\.


--
-- Data for Name: IdempotencyKey; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."IdempotencyKey" (id, "tenantId", key, operation, "resultRefId", "createdAt", "expiresAt") FROM stdin;
\.


--
-- Data for Name: JournalEntry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."JournalEntry" (id, "tenantId", "voucherId", "accountId", debit, credit, narration, "fundId", "costCenterId", "createdAt") FROM stdin;
97abb275-b4ea-4e5c-8ce2-e145ad213f1f	default-tenant-id	dfefc66c-06e5-423a-bd54-1f24349f1f58	f5655eaa-67ac-4fa8-a908-690e0cd4af66	14180.00	0.00	\N	\N	\N	2026-05-20 06:49:37.469
66a50277-553a-47a2-aba0-a0394794ad64	default-tenant-id	dfefc66c-06e5-423a-bd54-1f24349f1f58	6fccd041-38c4-447e-be95-691ce907d96e	0.00	14180.00	\N	\N	\N	2026-05-20 06:49:37.469
0afe992b-c154-4c8f-a6ff-ac55d171fbaf	default-tenant-id	81741658-f336-46f8-bb20-ca095a841095	1510846b-12fa-441c-b42b-e2c44bcce5a0	205.00	0.00	\N	\N	\N	2026-05-20 06:49:37.928
ca16113e-91d4-4d52-8169-47ea162002e3	default-tenant-id	81741658-f336-46f8-bb20-ca095a841095	5bb34254-2f64-4d93-be2a-fb888ec912c3	0.00	205.00	\N	\N	\N	2026-05-20 06:49:37.928
95f6ca97-56bd-4b91-837d-506c6aed6157	default-tenant-id	5aed788d-6d4b-4458-a7e0-0e9600e16204	f5655eaa-67ac-4fa8-a908-690e0cd4af66	300.00	0.00	\N	\N	\N	2026-05-20 06:49:38.039
22b19207-7df2-4483-b965-6d75f71921b7	default-tenant-id	5aed788d-6d4b-4458-a7e0-0e9600e16204	b88bdacf-1d54-4f96-914e-ef86660a6440	0.00	300.00	\N	\N	\N	2026-05-20 06:49:38.039
448730b1-fcba-4186-b1d2-0734891e8cd3	default-tenant-id	b00225ed-3429-49e6-b685-2b01fffba48c	1510846b-12fa-441c-b42b-e2c44bcce5a0	395.00	0.00	\N	\N	\N	2026-05-20 06:49:38.161
ca6925c5-95e3-4bd0-b317-02a846a7cc7c	default-tenant-id	b00225ed-3429-49e6-b685-2b01fffba48c	0f31d1e3-6ac7-4aa7-8bea-6e2c44b56bb6	0.00	395.00	\N	\N	\N	2026-05-20 06:49:38.161
f61b46e5-ad59-425c-b190-e527b497140b	default-tenant-id	daf7817f-c2d7-4c8a-a627-eb3c38276fd4	f5655eaa-67ac-4fa8-a908-690e0cd4af66	330.00	0.00	\N	\N	\N	2026-05-20 06:49:38.256
48626d04-4f6c-44cf-9edc-d23166446ad5	default-tenant-id	daf7817f-c2d7-4c8a-a627-eb3c38276fd4	6fccd041-38c4-447e-be95-691ce907d96e	0.00	330.00	\N	\N	\N	2026-05-20 06:49:38.256
35060973-efd2-4dfe-bd09-12fd881de62c	default-tenant-id	b2ee5dc4-e155-41b1-86fa-1e3f17960afc	1510846b-12fa-441c-b42b-e2c44bcce5a0	425.00	0.00	\N	\N	\N	2026-05-20 06:49:38.337
fa84ddbe-f835-4409-81d5-2f531f967ae6	default-tenant-id	b2ee5dc4-e155-41b1-86fa-1e3f17960afc	5bb34254-2f64-4d93-be2a-fb888ec912c3	0.00	425.00	\N	\N	\N	2026-05-20 06:49:38.337
2f653d1c-194d-4d8e-a6dd-553f932bafa7	default-tenant-id	5ffb0752-e5c5-4fef-a262-564580c25de1	f5655eaa-67ac-4fa8-a908-690e0cd4af66	520.00	0.00	\N	\N	\N	2026-05-20 06:49:38.426
d9c3c225-cdeb-4f52-a01a-4dd6fefc7ce4	default-tenant-id	5ffb0752-e5c5-4fef-a262-564580c25de1	b88bdacf-1d54-4f96-914e-ef86660a6440	0.00	520.00	\N	\N	\N	2026-05-20 06:49:38.426
00cf3fc6-366d-45f0-a033-b44d5774dfca	default-tenant-id	dcc8562c-ac3b-42ee-8e02-0ad0c9d99682	1510846b-12fa-441c-b42b-e2c44bcce5a0	230.00	0.00	\N	\N	\N	2026-05-20 06:49:38.51
f203fd1f-eb1b-4328-b2cc-9fe3191e023c	default-tenant-id	dcc8562c-ac3b-42ee-8e02-0ad0c9d99682	0f31d1e3-6ac7-4aa7-8bea-6e2c44b56bb6	0.00	230.00	\N	\N	\N	2026-05-20 06:49:38.51
64debf3b-5dbb-461d-b7bd-255313dda5a1	default-tenant-id	713f5a4e-fe4d-4da9-9a78-be975210d810	f5655eaa-67ac-4fa8-a908-690e0cd4af66	165.00	0.00	\N	\N	\N	2026-05-20 06:49:38.578
f5b88fb1-0e45-4212-8e16-0beb7a30a8bd	default-tenant-id	713f5a4e-fe4d-4da9-9a78-be975210d810	6fccd041-38c4-447e-be95-691ce907d96e	0.00	165.00	\N	\N	\N	2026-05-20 06:49:38.578
f4f89976-7831-4b9a-9562-8ffb0e930c92	default-tenant-id	57d2b2da-91eb-4281-8198-fc8fa0f572da	1510846b-12fa-441c-b42b-e2c44bcce5a0	440.00	0.00	\N	\N	\N	2026-05-20 06:49:38.64
d7da288b-a259-4e6a-8dba-b2cc74030155	default-tenant-id	57d2b2da-91eb-4281-8198-fc8fa0f572da	5bb34254-2f64-4d93-be2a-fb888ec912c3	0.00	440.00	\N	\N	\N	2026-05-20 06:49:38.64
e5b82c22-06ff-4cd1-ad29-c70d9095f887	default-tenant-id	708c8854-da4d-44d3-b1ff-273e77fd2927	f5655eaa-67ac-4fa8-a908-690e0cd4af66	355.00	0.00	\N	\N	\N	2026-05-20 06:49:38.719
cd7bf89f-1e31-4d49-9bb8-c2dfae74d04c	default-tenant-id	708c8854-da4d-44d3-b1ff-273e77fd2927	b88bdacf-1d54-4f96-914e-ef86660a6440	0.00	355.00	\N	\N	\N	2026-05-20 06:49:38.719
bc071b77-3952-4873-8224-a040dae54df9	default-tenant-id	0c16ca38-0931-48d0-84c7-c78c75be6e13	1510846b-12fa-441c-b42b-e2c44bcce5a0	6900.00	0.00	\N	\N	\N	2026-05-20 06:49:38.782
0517b8f3-6c8f-4852-b293-b94c5ab58545	default-tenant-id	0c16ca38-0931-48d0-84c7-c78c75be6e13	0f31d1e3-6ac7-4aa7-8bea-6e2c44b56bb6	0.00	6900.00	\N	\N	\N	2026-05-20 06:49:38.782
0793f41c-395c-493f-8c41-91746153b91e	default-tenant-id	b4442385-f24b-4663-9f2f-7eeb7d4a85c2	f5655eaa-67ac-4fa8-a908-690e0cd4af66	385.00	0.00	\N	\N	\N	2026-05-20 06:49:38.833
8b67deda-ca0e-400a-9854-e6c9c2543ad0	default-tenant-id	b4442385-f24b-4663-9f2f-7eeb7d4a85c2	6fccd041-38c4-447e-be95-691ce907d96e	0.00	385.00	\N	\N	\N	2026-05-20 06:49:38.833
08243eb4-da85-48a3-8efc-3e519260daf3	default-tenant-id	9fbb9a28-c7f0-4755-b368-818017e88e16	1510846b-12fa-441c-b42b-e2c44bcce5a0	480.00	0.00	\N	\N	\N	2026-05-20 06:49:38.883
d821fc69-4a6a-4b10-b28f-81613844e77c	default-tenant-id	9fbb9a28-c7f0-4755-b368-818017e88e16	5bb34254-2f64-4d93-be2a-fb888ec912c3	0.00	480.00	\N	\N	\N	2026-05-20 06:49:38.883
41909d71-d44f-44a3-8ac2-e497a61aae7b	default-tenant-id	b88a5e5e-d348-4063-993a-5d69813e39bd	f5655eaa-67ac-4fa8-a908-690e0cd4af66	190.00	0.00	\N	\N	\N	2026-05-20 06:49:38.928
ed416c25-e49c-4b8f-85c5-392b19f407c4	default-tenant-id	b88a5e5e-d348-4063-993a-5d69813e39bd	b88bdacf-1d54-4f96-914e-ef86660a6440	0.00	190.00	\N	\N	\N	2026-05-20 06:49:38.928
e07e1cd6-9110-4e51-bc51-f874a0c962c2	default-tenant-id	59f0f1a3-c521-4b44-a734-f02e903e8c02	1510846b-12fa-441c-b42b-e2c44bcce5a0	285.00	0.00	\N	\N	\N	2026-05-20 06:49:38.978
d971ecf3-c26e-4002-9607-312be62e5d8b	default-tenant-id	59f0f1a3-c521-4b44-a734-f02e903e8c02	0f31d1e3-6ac7-4aa7-8bea-6e2c44b56bb6	0.00	285.00	\N	\N	\N	2026-05-20 06:49:38.978
e40b5e50-0932-470b-a0ec-f276248daf3e	default-tenant-id	e7455175-9b8f-4b13-a635-ae625724c883	f5655eaa-67ac-4fa8-a908-690e0cd4af66	220.00	0.00	\N	\N	\N	2026-05-20 06:49:39.028
fdf8082c-ca3b-411b-867a-e6bde07bfe30	default-tenant-id	e7455175-9b8f-4b13-a635-ae625724c883	6fccd041-38c4-447e-be95-691ce907d96e	0.00	220.00	\N	\N	\N	2026-05-20 06:49:39.028
6f089139-ea99-4353-83f0-36ac5ae1ef16	default-tenant-id	b62d9e86-98b9-4ef0-825c-eeb916519e9a	1510846b-12fa-441c-b42b-e2c44bcce5a0	15000.00	0.00	\N	\N	\N	2026-05-20 06:49:39.074
f312dcb1-00c7-4c7c-9d22-1997a10e80ed	default-tenant-id	b62d9e86-98b9-4ef0-825c-eeb916519e9a	5bb34254-2f64-4d93-be2a-fb888ec912c3	0.00	15000.00	\N	\N	\N	2026-05-20 06:49:39.074
74c36b96-a9d6-430a-873d-c2bcd6754630	default-tenant-id	bb94d7d0-fae8-4269-9ac8-abbec50e8512	f5655eaa-67ac-4fa8-a908-690e0cd4af66	410.00	0.00	\N	\N	\N	2026-05-20 06:49:39.125
d8b69504-68f8-4d1f-b51b-da3f980db71d	default-tenant-id	bb94d7d0-fae8-4269-9ac8-abbec50e8512	b88bdacf-1d54-4f96-914e-ef86660a6440	0.00	410.00	\N	\N	\N	2026-05-20 06:49:39.125
d5b57254-2738-4760-96ec-141e2476a97e	default-tenant-id	83b989f2-cf20-4bc6-ac82-bedb2cd00138	1510846b-12fa-441c-b42b-e2c44bcce5a0	505.00	0.00	\N	\N	\N	2026-05-20 06:49:39.182
2542883d-2aa8-49f5-a20b-cbbe8eafb01a	default-tenant-id	83b989f2-cf20-4bc6-ac82-bedb2cd00138	0f31d1e3-6ac7-4aa7-8bea-6e2c44b56bb6	0.00	505.00	\N	\N	\N	2026-05-20 06:49:39.182
7d554a68-e880-44bd-b0ed-cbd36faa2939	default-tenant-id	ff8d6354-1a2b-421d-aa0f-6346aa0b2769	f5655eaa-67ac-4fa8-a908-690e0cd4af66	560.00	0.00	\N	\N	\N	2026-05-20 06:49:39.228
e62ba24b-da80-42d4-b11a-cba750ec2809	default-tenant-id	ff8d6354-1a2b-421d-aa0f-6346aa0b2769	6fccd041-38c4-447e-be95-691ce907d96e	0.00	560.00	\N	\N	\N	2026-05-20 06:49:39.228
e36c2681-368f-4f85-bf19-f69950048521	default-tenant-id	781fc419-f67b-42d0-8a68-1f8e78744b51	1510846b-12fa-441c-b42b-e2c44bcce5a0	230.00	0.00	\N	\N	\N	2026-05-20 06:49:39.278
c46e9bed-d6da-42ff-99e2-0a44466e0fd7	default-tenant-id	781fc419-f67b-42d0-8a68-1f8e78744b51	5bb34254-2f64-4d93-be2a-fb888ec912c3	0.00	230.00	\N	\N	\N	2026-05-20 06:49:39.278
09bc865a-8e85-45d8-b724-e3acdb521812	default-tenant-id	6f4d5a2f-e0dc-47da-a9ff-940ffa07f9fc	f5655eaa-67ac-4fa8-a908-690e0cd4af66	7300.00	0.00	\N	\N	\N	2026-05-20 06:49:39.328
0c6469ef-3723-4946-bbc0-8a2c9e790810	default-tenant-id	6f4d5a2f-e0dc-47da-a9ff-940ffa07f9fc	b88bdacf-1d54-4f96-914e-ef86660a6440	0.00	7300.00	\N	\N	\N	2026-05-20 06:49:39.328
c514d374-fdc5-4bf2-bf78-55857d7504c4	default-tenant-id	66db418a-5e4e-4ba0-9bf4-de38463fdfd8	1510846b-12fa-441c-b42b-e2c44bcce5a0	220.00	0.00	\N	\N	\N	2026-05-20 06:49:39.374
a02b8d7f-83dc-4658-8107-67ee5d79c971	default-tenant-id	66db418a-5e4e-4ba0-9bf4-de38463fdfd8	0f31d1e3-6ac7-4aa7-8bea-6e2c44b56bb6	0.00	220.00	\N	\N	\N	2026-05-20 06:49:39.374
09007c8a-a16d-4211-aa00-0f297c8b3c44	default-tenant-id	21befbc0-1468-412b-a56f-b079444ae73d	f5655eaa-67ac-4fa8-a908-690e0cd4af66	455.00	0.00	\N	\N	\N	2026-05-20 06:49:39.427
045939df-12d9-405a-9195-22c206985975	default-tenant-id	21befbc0-1468-412b-a56f-b079444ae73d	6fccd041-38c4-447e-be95-691ce907d96e	0.00	455.00	\N	\N	\N	2026-05-20 06:49:39.427
590eb5eb-e448-413b-8110-8a20a3b22fa4	default-tenant-id	021c72f6-678a-4276-8dd9-696c06bf40e3	1510846b-12fa-441c-b42b-e2c44bcce5a0	370.00	0.00	\N	\N	\N	2026-05-20 06:49:39.471
559f98d6-20c0-4af7-a7c8-420dc77a1edb	default-tenant-id	021c72f6-678a-4276-8dd9-696c06bf40e3	5bb34254-2f64-4d93-be2a-fb888ec912c3	0.00	370.00	\N	\N	\N	2026-05-20 06:49:39.471
c88a8969-756b-40e8-8d08-c62992b8f77e	default-tenant-id	f6563df8-2f5c-479e-bc48-65abee7622eb	f5655eaa-67ac-4fa8-a908-690e0cd4af66	425.00	0.00	\N	\N	\N	2026-05-20 06:49:39.51
bf88e405-c4d4-493d-934b-aae5cc731290	default-tenant-id	f6563df8-2f5c-479e-bc48-65abee7622eb	b88bdacf-1d54-4f96-914e-ef86660a6440	0.00	425.00	\N	\N	\N	2026-05-20 06:49:39.51
84dbf64a-fed1-4245-b2ef-3a50301fa398	default-tenant-id	0c31578f-32ca-4bb0-b8b9-9e7b4b0417cb	1510846b-12fa-441c-b42b-e2c44bcce5a0	520.00	0.00	\N	\N	\N	2026-05-20 06:49:39.564
d4349feb-7afb-4aed-9a06-a3a76df1d036	default-tenant-id	0c31578f-32ca-4bb0-b8b9-9e7b4b0417cb	0f31d1e3-6ac7-4aa7-8bea-6e2c44b56bb6	0.00	520.00	\N	\N	\N	2026-05-20 06:49:39.564
6a4ed11a-70e3-4f8e-93a9-0226e55484d8	default-tenant-id	4af4b97f-fb46-4413-b8e8-d5efa809ec9f	f5655eaa-67ac-4fa8-a908-690e0cd4af66	250.00	0.00	Donation receipt	\N	\N	2026-05-20 06:51:12.594
22cb26d0-94eb-4d76-bfe1-ade7c85a72f7	default-tenant-id	4af4b97f-fb46-4413-b8e8-d5efa809ec9f	6fccd041-38c4-447e-be95-691ce907d96e	0.00	250.00	Donation income	\N	\N	2026-05-20 06:51:12.594
45dbd93d-17ea-4e60-b27b-8ee05ea98892	default-tenant-id	296f9834-07b5-4c4e-897e-a3a40e721fbc	f5655eaa-67ac-4fa8-a908-690e0cd4af66	250.00	0.00	Donation receipt	\N	\N	2026-05-20 10:23:04.63
3a9e8f52-093f-4c8a-b74c-9436fc7c5647	default-tenant-id	296f9834-07b5-4c4e-897e-a3a40e721fbc	6fccd041-38c4-447e-be95-691ce907d96e	0.00	250.00	Donation income	\N	\N	2026-05-20 10:23:04.63
87c48187-92e6-4957-9f71-6e5a06578f89	default-tenant-id	9fb5e342-b409-43f1-8c06-6275177f2327	f5655eaa-67ac-4fa8-a908-690e0cd4af66	2500.00	0.00	Donation receipt	\N	\N	2026-05-20 12:18:35.034
f2b2c5dd-c670-4c09-9f48-d667212d5188	default-tenant-id	9fb5e342-b409-43f1-8c06-6275177f2327	6fccd041-38c4-447e-be95-691ce907d96e	0.00	2500.00	Donation income	\N	\N	2026-05-20 12:18:35.034
6be0ec1f-6a05-45a7-be4e-cd86101e806f	default-tenant-id	7278e894-4bbf-42f8-89f2-8e4c8e2d57d8	f5655eaa-67ac-4fa8-a908-690e0cd4af66	2500.00	0.00	Donation receipt	\N	\N	2026-05-20 12:20:32.797
71047001-695f-491c-bb3f-0dad3452efeb	default-tenant-id	7278e894-4bbf-42f8-89f2-8e4c8e2d57d8	6fccd041-38c4-447e-be95-691ce907d96e	0.00	2500.00	Donation income	\N	\N	2026-05-20 12:20:32.797
07fbdf5b-64ee-4423-b103-fe759c98a2c1	default-tenant-id	a398c59b-892b-46a5-b1b0-d15c7882001d	f5655eaa-67ac-4fa8-a908-690e0cd4af66	987654.00	0.00	Donation receipt	\N	\N	2026-05-20 12:20:41.868
1bfcde7f-111b-453c-a4ea-0cad67c5dfd3	default-tenant-id	a398c59b-892b-46a5-b1b0-d15c7882001d	6fccd041-38c4-447e-be95-691ce907d96e	0.00	987654.00	Donation income	\N	\N	2026-05-20 12:20:41.868
\.


--
-- Data for Name: LeaveBalance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LeaveBalance" (id, "tenantId", "memberId", "leaveType", year, allocated, used, "createdAt", "updatedAt") FROM stdin;
cc558fe2-2e07-4738-8731-d6f9efedc925	default-tenant-id	08433f56-2ce1-48c3-949d-ec87509dcdbe	Sick	2026	10	0	2026-05-20 17:24:45.534	2026-05-20 17:24:45.534
54676ae2-d649-49eb-82fb-c21f39f22ca1	default-tenant-id	08433f56-2ce1-48c3-949d-ec87509dcdbe	Spiritual	2026	5	0	2026-05-20 17:24:45.538	2026-05-20 17:24:45.538
a8bf7489-7b9b-4619-8805-7a164e0f3e2c	default-tenant-id	08433f56-2ce1-48c3-949d-ec87509dcdbe	Annual	2026	15	3	2026-05-20 17:24:45.529	2026-05-20 17:24:45.636
0f1b87bb-70bd-4e75-a318-7e7cd4fc074c	default-tenant-id	5a79ac10-43f9-4f3b-9a88-9a56d9fc684b	Sick	2026	10	0	2026-05-20 17:27:01.165	2026-05-20 17:27:01.165
46c1a7c5-1c18-448a-beef-b331424e6791	default-tenant-id	5a79ac10-43f9-4f3b-9a88-9a56d9fc684b	Spiritual	2026	5	0	2026-05-20 17:27:01.172	2026-05-20 17:27:01.172
b668e4a7-dd0e-4d35-a60c-0c2a757983b7	default-tenant-id	5a79ac10-43f9-4f3b-9a88-9a56d9fc684b	Annual	2026	15	3	2026-05-20 17:27:01.16	2026-05-20 17:27:01.228
2d1062ef-a777-414f-9823-f2d76b5b59cd	default-tenant-id	6dc40e02-c1c0-41c9-9562-d36ca8d72b63	Sick	2026	10	0	2026-05-20 17:49:34.84	2026-05-20 17:49:34.84
ca1a7e16-b699-4d26-9719-79dcae5062d5	default-tenant-id	6dc40e02-c1c0-41c9-9562-d36ca8d72b63	Spiritual	2026	5	0	2026-05-20 17:49:34.842	2026-05-20 17:49:34.842
1cdc30b1-3f3f-4a71-a179-1e1c812ebaa7	default-tenant-id	6dc40e02-c1c0-41c9-9562-d36ca8d72b63	Annual	2026	15	3	2026-05-20 17:49:34.837	2026-05-20 17:49:34.885
\.


--
-- Data for Name: LeaveRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LeaveRequest" (id, "tenantId", "memberId", "leaveType", "startDate", "endDate", reason, status, "approvedByUserId", notes, "createdAt", "updatedAt", "conflictSnapshot") FROM stdin;
79e7f97c-1554-4992-8a36-0ea7e159cd9d	default-tenant-id	08433f56-2ce1-48c3-949d-ec87509dcdbe	Annual	2026-06-03 00:00:00	2026-06-05 00:00:00	HR simulation leave	Approved	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	HR simulation approval	2026-05-20 17:24:45.588	2026-05-20 17:24:45.639	{"warnings": [], "conflicts": [], "hasConflict": false}
af4df1d9-b98b-4a8a-911b-fa36a3597eb3	default-tenant-id	5a79ac10-43f9-4f3b-9a88-9a56d9fc684b	Annual	2026-06-03 00:00:00	2026-06-05 00:00:00	HR simulation leave	Approved	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	HR simulation approval	2026-05-20 17:27:01.205	2026-05-20 17:27:01.229	{"warnings": [], "conflicts": [], "hasConflict": false}
bcb84e5e-78a5-4a94-87b4-a1d6cb4001ad	default-tenant-id	6dc40e02-c1c0-41c9-9562-d36ca8d72b63	Annual	2026-06-03 00:00:00	2026-06-05 00:00:00	HR simulation leave	Approved	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	HR simulation approval	2026-05-20 17:49:34.867	2026-05-20 17:49:34.887	{"warnings": [], "conflicts": [], "hasConflict": false}
c9289cc3-e9de-4613-844d-9932474163fa	default-tenant-id	6dc40e02-c1c0-41c9-9562-d36ca8d72b63	Sick	2026-06-19 00:00:00	2026-06-20 00:00:00	HR simulation deny path	Rejected	\N	HR simulation denial	2026-05-20 17:49:34.906	2026-05-20 17:49:34.919	{"warnings": [], "conflicts": [], "hasConflict": false}
e7c640a1-3a2f-4c0b-af88-a5701da2c51e	default-tenant-id	08433f56-2ce1-48c3-949d-ec87509dcdbe	Sick	2026-07-04 00:00:00	2026-07-05 00:00:00	E2E leave workflow	Rejected	\N	E2E deny	2026-05-20 17:53:52.45	2026-05-20 17:53:52.541	{"warnings": [], "conflicts": [], "hasConflict": false}
\.


--
-- Data for Name: Member; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Member" (id, "tenantId", "familyId", name, email, phone, role, dob, "profileImageUrl", "membershipDate", status, "growthStage", "workforceClass", "employmentType", department, gender, aadhaar, pan, "addressLine1", "addressLine2", city, "stateRegion", "postalCode", country, latitude, longitude, "createdAt", "updatedAt", "reportingManagerId") FROM stdin;
f1c66b29-be4b-41ae-8e1b-a707a2cb8893	default-tenant-id	\N	Susan Bennett	susanbennett1@members.grace.local	+15552010001	\N	\N	\N	2026-03-10 06:49:37.046	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.046	2026-05-20 06:49:37.046	\N
efec78ed-a3ce-4306-aa5d-a78cb7dc4439	default-tenant-id	\N	Emily Bennett	emilybennett2@members.grace.local	+15552010002	\N	\N	\N	2026-01-28 06:49:37.047	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.047	2026-05-20 06:49:37.047	\N
d0095111-4f2f-4d13-acf6-c83b356c3d0a	default-tenant-id	\N	Carlos Martinez	carlosmartinez3@members.grace.local	+15552010003	\N	\N	\N	2025-12-18 06:49:37.048	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.049	2026-05-20 06:49:37.049	\N
8404911d-3139-4f4c-8e9b-cbd4e703ddf6	default-tenant-id	\N	Rosa Martinez	rosamartinez4@members.grace.local	+15552010004	\N	\N	\N	2025-11-07 06:49:37.05	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.05	2026-05-20 06:49:37.05	\N
4867b73b-742d-4675-983e-994381643be9	default-tenant-id	\N	James Thompson	jamesthompson5@members.grace.local	+15552010005	\N	\N	\N	2025-09-27 06:49:37.052	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.053	2026-05-20 06:49:37.053	\N
0e7855c1-e24d-4bfe-a750-f137064628ed	default-tenant-id	\N	Rachel Thompson	rachelthompson6@members.grace.local	+15552010006	\N	\N	\N	2025-08-17 06:49:37.054	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.054	2026-05-20 06:49:37.054	\N
4b707156-1f9a-4bb9-9d89-03d8a0ddeaf1	default-tenant-id	\N	Noah Thompson	noahthompson7@members.grace.local	+15552010007	\N	\N	\N	2025-07-07 06:49:37.055	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.056	2026-05-20 06:49:37.056	\N
32dd462a-1938-4468-a4e1-638640fad0e7	default-tenant-id	\N	Linh Nguyen	linhnguyen8@members.grace.local	+15552010008	\N	\N	\N	2025-05-27 06:49:37.057	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.057	2026-05-20 06:49:37.057	\N
5ab36650-61da-4ddb-b9a2-a832166fc45e	default-tenant-id	\N	Minh Nguyen	minhnguyen9@members.grace.local	+15552010009	\N	\N	\N	2025-04-16 06:49:37.058	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.059	2026-05-20 06:49:37.059	\N
3e6ca72a-5085-4bb7-9116-e992efa10b27	default-tenant-id	\N	Priya Patel	priyapatel10@members.grace.local	+15552010010	\N	\N	\N	2025-03-06 06:49:37.06	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.06	2026-05-20 06:49:37.06	\N
08fafbd6-285c-4b4a-b9d4-0edce7c34521	default-tenant-id	\N	Arjun Patel	arjunpatel11@members.grace.local	+15552010011	\N	\N	\N	2026-03-20 06:49:37.061	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.062	2026-05-20 06:49:37.062	\N
a3695171-a8ec-4bab-8e6c-e8420e194dfa	default-tenant-id	\N	Marcus Collins	marcuscollins12@members.grace.local	+15552010012	\N	\N	\N	2026-02-07 06:49:37.063	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.063	2026-05-20 06:49:37.063	\N
403a03ca-341c-42b4-b013-e6a7a891cbfe	default-tenant-id	\N	Tanya Collins	tanyacollins13@members.grace.local	+15552010013	\N	\N	\N	2025-12-28 06:49:37.064	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.064	2026-05-20 06:49:37.064	\N
1b54d681-9526-4421-9648-eae426a8a982	default-tenant-id	\N	Sofia Reyes	sofiareyes14@members.grace.local	+15552010014	\N	\N	\N	2025-11-17 06:49:37.065	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.066	2026-05-20 06:49:37.066	\N
35c29c25-08e9-495d-b1ee-f29a8316d929	default-tenant-id	\N	Jordan Brooks	jordanbrooks15@members.grace.local	+15552010015	\N	\N	\N	2025-10-07 06:49:37.066	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.067	2026-05-20 06:49:37.067	\N
bf88f9d5-6934-4ccb-9a14-72a70ffd18af	default-tenant-id	\N	Casey Brooks	caseybrooks16@members.grace.local	+15552010016	\N	\N	\N	2025-08-27 06:49:37.068	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.068	2026-05-20 06:49:37.068	\N
a2facb1d-d19e-4689-92a1-4dc7f850bb69	default-tenant-id	\N	Eleanor Scott	eleanorscott17@members.grace.local	+15552010017	\N	\N	\N	2025-11-07 06:49:37.069	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.069	2026-05-20 06:49:37.069	\N
f13407e2-1aea-4523-b5ed-e6f58fd6d368	default-tenant-id	\N	Vincent Price	vincentprice18@members.grace.local	+15552010018	\N	\N	\N	2025-10-01 06:49:37.07	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.071	2026-05-20 06:49:37.071	\N
4b6dab00-d55c-466f-a49e-d261f4c87570	default-tenant-id	\N	Amara Lewis	amaralewis19@members.grace.local	+15552010019	\N	\N	\N	2025-08-25 06:49:37.072	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.073	2026-05-20 06:49:37.073	\N
9e033035-6ca2-4706-b10b-a3cd015f5b00	default-tenant-id	\N	Theo Ramirez	theoramirez20@members.grace.local	+15552010020	\N	\N	\N	2025-07-19 06:49:37.074	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.074	2026-05-20 06:49:37.074	\N
74d135ee-b8a7-4137-951a-dc4898ff4451	default-tenant-id	\N	David Bennett	davidbennett0@members.grace.local	+15552010000	\N	\N	\N	2026-04-20 06:49:37.04	Active	Leader	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:49:37.043	2026-05-20 06:49:39.715	\N
fed7e035-15f4-4917-bfb0-621794b2ff20	default-tenant-id	\N	E2E Test Member	e2e-1779259872327@test.com	\N	\N	\N	\N	\N	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:51:12.36	2026-05-20 06:51:12.36	\N
23af6d78-3128-4130-bfba-bfd50618de8c	default-tenant-id	2e31e875-4907-48d5-a629-cd11bd8ef7cd	PWFirst1779259978592 PWLast1779259978592	pw.member.1779259978592@example.com		Smoke role 1779259978592	1990-01-15 00:00:00	\N	2026-05-20 00:00:00	Active	Visitor	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:53:00.57	2026-05-20 06:53:11.74	\N
60ae1a9e-9c4b-463a-b265-a2ffc9a8fb08	default-tenant-id	\N	PathFirst1779259994667 PathLast1779259994667	pw.path.1779259994667@example.com	\N	Head of Household · Campus: Downtown	\N	\N	\N	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:53:16.912	2026-05-20 06:53:17.807	\N
ede36984-078e-4d72-ad15-f55dd44bfa99	default-tenant-id	\N	VolFirst1779260004009 VolLast1779260004009	pw.vol.1779260004009@example.com	\N	Head of Household · Campus: Downtown	\N	\N	2026-05-20 12:00:00	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:53:26.119	2026-05-20 06:53:26.119	\N
957bc638-6ec7-4c1a-b343-de8fb625ccd4	default-tenant-id	\N	CareFirst1779260015731 CareLast1779260015731	pw.care.1779260015731@example.com	\N	Head of Household · Campus: Downtown	\N	\N	2026-05-20 12:00:00	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 06:53:37.573	2026-05-20 06:53:37.573	\N
5af4bd77-f5c1-4e6a-9495-a300f0080523	default-tenant-id	\N	PathFirst1779261192989 PathLast1779261192989	pw.path.1779261192989@example.com	\N	Head of Household · Campus: Downtown	\N	\N	\N	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 07:13:15.786	2026-05-20 07:13:16.527	\N
8dfde6d6-b543-4718-8911-f42aefe8233b	default-tenant-id	e1aec606-acc9-4dde-872d-330548af6cf0	PWFirst1779260833777 PWLast1779260833777	pw.member.1779260833777@example.com		Smoke role 1779260833777	1990-01-15 00:00:00	\N	2026-05-20 00:00:00	Active	Visitor	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 07:07:15.309	2026-05-20 07:07:27.328	\N
60d89616-69d3-48c2-8889-7c3c6db310c2	default-tenant-id	\N	PathFirst1779260850281 PathLast1779260850281	pw.path.1779260850281@example.com	\N	Head of Household · Campus: Downtown	\N	\N	\N	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 07:07:32.898	2026-05-20 07:07:33.646	\N
f0b8a548-5dcb-4bc6-bcbe-86bfd9a952d0	default-tenant-id	\N	VolFirst1779260859968 VolLast1779260859968	pw.vol.1779260859968@example.com	\N	Head of Household · Campus: Downtown	\N	\N	2026-05-20 12:00:00	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 07:07:41.765	2026-05-20 07:07:41.765	\N
1123e00f-6a65-4e2e-baff-74fdace3fe37	default-tenant-id	\N	CareFirst1779260871160 CareLast1779260871160	pw.care.1779260871160@example.com	\N	Head of Household · Campus: Downtown	\N	\N	2026-05-20 12:00:00	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 07:07:52.932	2026-05-20 07:07:52.932	\N
4d3af43e-2590-43f1-bb70-ec00793629b8	default-tenant-id	c911c033-b472-473a-85c2-22751f495d5a	PWFirst1779261176438 PWLast1779261176438	pw.member.1779261176438@example.com		Smoke role 1779261176438	1990-01-15 00:00:00	\N	2026-05-20 00:00:00	Active	Visitor	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 07:12:58.453	2026-05-20 07:13:09.772	\N
6d35bcde-b308-45c7-a1db-87e453d0101a	default-tenant-id	\N	VolFirst1779261202588 VolLast1779261202588	pw.vol.1779261202588@example.com	\N	Head of Household · Campus: Downtown	\N	\N	2026-05-20 12:00:00	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 07:13:25.25	2026-05-20 07:13:25.25	\N
e1cd4a3a-1425-463f-9a8e-9e4f0bfdd25b	default-tenant-id	\N	CareFirst1779261215058 CareLast1779261215058	pw.care.1779261215058@example.com	\N	Head of Household · Campus: Downtown	\N	\N	2026-05-20 12:00:00	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 07:13:37.239	2026-05-20 07:13:37.239	\N
9f3474dd-7ea9-4ec0-a568-d9a413d30c1c	default-tenant-id	16d2b157-887c-47ef-b765-aea0774598aa	PWFirst1779262083769 PWLast1779262083769	pw.member.1779262083769@example.com		Smoke role 1779262083769	1990-01-15 00:00:00	\N	2026-05-20 00:00:00	Active	Visitor	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 07:28:05.842	2026-05-20 07:28:17.057	\N
27a56c7f-1bd1-467b-8b06-3290519a6f9b	default-tenant-id	\N	PathFirst1779262100157 PathLast1779262100157	pw.path.1779262100157@example.com	\N	Head of Household · Campus: Downtown	\N	\N	\N	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 07:28:22.853	2026-05-20 07:28:23.626	\N
d99ad09a-3c1b-4fa9-bbb5-8b8154354d3c	default-tenant-id	\N	VolFirst1779262109544 VolLast1779262109544	pw.vol.1779262109544@example.com	\N	Head of Household · Campus: Downtown	\N	\N	2026-05-20 12:00:00	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 07:28:31.852	2026-05-20 07:28:31.852	\N
05e6bcf1-3d05-4bc0-9019-f612c5dea737	default-tenant-id	\N	CareFirst1779262120692 CareLast1779262120692	pw.care.1779262120692@example.com	\N	Head of Household · Campus: Downtown	\N	\N	2026-05-20 12:00:00	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 07:28:42.451	2026-05-20 07:28:42.451	\N
aba4e66d-faf2-4418-b913-292e621cccfa	default-tenant-id	\N	E2E Test Member	e2e-1779272584403@test.com	\N	\N	\N	\N	\N	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 10:23:04.417	2026-05-20 10:23:04.417	\N
6dc40e02-c1c0-41c9-9562-d36ca8d72b63	default-tenant-id	\N	HR Sim Staff 1779299374781	hr-sim.staff.1779299374781@grace.local	+91 90000 00001	Staff	\N	\N	\N	Active	Staff	staff	FullTime	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 17:49:34.789	2026-05-20 17:49:34.829	\N
37673a99-f166-4702-8df3-91aea41f1dcc	default-tenant-id	0551f21b-fd30-4be7-83f3-280c93b4d880	PWFirst1779275760621 PWLast1779275760621	pw.member.1779275760621@example.com		Smoke role 1779275760621	1990-01-15 00:00:00	\N	2026-05-20 00:00:00	Active	Visitor	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 11:16:02.399	2026-05-20 11:16:15.351	\N
f9bf29fd-f47a-45c9-a4c9-444805fd44f9	default-tenant-id	\N	PathFirst1779275780562 PathLast1779275780562	pw.path.1779275780562@example.com	\N	Head of Household · Campus: Downtown	\N	\N	\N	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 11:16:22.462	2026-05-20 11:16:23.723	\N
8ac59352-f9cf-418e-b9c4-58a92722ecdc	default-tenant-id	\N	VolFirst1779275793122 VolLast1779275793122	pw.vol.1779275793122@example.com	\N	Head of Household · Campus: Downtown	\N	\N	2026-05-20 12:00:00	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 11:16:34.887	2026-05-20 11:16:34.887	\N
14bf9867-357d-46f3-8203-1eee5e129153	default-tenant-id	\N	CareFirst1779275808239 CareLast1779275808239	pw.care.1779275808239@example.com	\N	Head of Household · Campus: Downtown	\N	\N	2026-05-20 12:00:00	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 11:16:50.388	2026-05-20 11:16:50.388	\N
28362ed7-c283-4ccb-b966-4e18bf313120	default-tenant-id	25d0ef6b-7dfb-4dab-b20f-28dc776a32a0	Priya Nair	hif-ecopark-sim.priya@hifecopark.org	+91 98765 43210	Adult Member	\N	\N	\N	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 12:16:37.703	2026-05-20 12:16:37.703	\N
a3dc0b17-df27-4313-8d6c-c1f2c4d8c72b	default-tenant-id	25d0ef6b-7dfb-4dab-b20f-28dc776a32a0	Arjun Nair	hif-ecopark-sim.arjun@hifecopark.org	+91 98765 43210	Youth	\N	\N	\N	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 12:16:37.723	2026-05-20 12:16:37.723	\N
088407ab-2061-439f-824f-209c5e6fe9dc	default-tenant-id	\N	Meera Thomas	hif-ecopark-sim.meera@hifecopark.org	+91 98765 43210	Volunteer Coordinator	\N	\N	\N	Active	Leader	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 12:16:37.74	2026-05-20 12:16:37.74	\N
fcee9106-d08e-4903-a84c-6f146128179d	default-tenant-id	\N	David Kurian	hif-ecopark-sim.finance@hifecopark.org	+91 98765 43210	Finance Steward	\N	\N	\N	Active	Leader	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 12:16:37.756	2026-05-20 12:16:37.756	\N
7434384b-ba2d-4415-97a0-9830f720b153	default-tenant-id	\N	Sarah Mathew	hif-ecopark-sim.worship@hifecopark.org	+91 98765 43210	Worship Leader	\N	\N	\N	Active	Leader	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 12:16:37.777	2026-05-20 12:16:37.777	\N
b6e8d402-2717-45e6-8de3-5a708f2fec98	default-tenant-id	\N	James Paul	hif-ecopark-sim.campus@hifecopark.org	+91 98765 43210	Campus Coordinator	\N	\N	\N	Active	Leader	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 12:16:37.795	2026-05-20 12:16:37.795	\N
7715c94b-5534-4d20-b763-ca49ea780b06	default-tenant-id	\N	VolFirst1779374779967 VolLast1779374779967	pw.vol.1779374779967@example.com	\N	Head of Household · Campus: Downtown	\N	\N	2026-05-21 12:00:00	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-21 14:46:22.755	2026-05-21 14:46:22.755	\N
2ad34cf4-a3e3-40f2-8436-7ed668803986	default-tenant-id	25d0ef6b-7dfb-4dab-b20f-28dc776a32a0	Ravi Nair	hif-ecopark-sim.ravi@hifecopark.org	+91 98765 43210	Adult Member	\N	\N	\N	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 12:16:37.663	2026-05-20 12:20:32.525	\N
888cd8c0-3d5d-4ba4-a5de-26ff89501d26	default-tenant-id	\N	HR Sim Staff 1779297490292	hr-sim.staff.1779297490292@grace.local	+91 90000 00001	Staff	\N	\N	\N	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 17:18:10.303	2026-05-20 17:18:10.303	\N
08433f56-2ce1-48c3-949d-ec87509dcdbe	default-tenant-id	\N	HR Sim Staff 1779297885381	hr-sim.staff.1779297885381@grace.local	+91 90000 00001	Staff	\N	\N	\N	Active	Staff	staff	FullTime	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 17:24:45.434	2026-05-20 17:24:45.516	\N
5a79ac10-43f9-4f3b-9a88-9a56d9fc684b	default-tenant-id	\N	HR Sim Staff 1779298021072	hr-sim.staff.1779298021072@grace.local	+91 90000 00001	Staff	\N	\N	\N	Active	Staff	staff	FullTime	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 17:27:01.086	2026-05-20 17:27:01.15	\N
3591fe28-b233-4e86-abc0-f5728369e2a1	default-tenant-id	\N	Church Secretary	secretary@grace.local	+91 90000 00002	Staff	\N	\N	\N	Active	Staff	staff	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 17:49:01.145	2026-05-20 17:49:01.145	\N
ef0995b5-4816-42a4-83ab-fc65fe29a6ee	default-tenant-id	514992a7-84b2-4c57-9bf8-497a284c1f53	PWFirst1779300941483 PWLast1779300941483	pw.member.1779300941483@example.com		Smoke role 1779300941483	1990-01-15 00:00:00	\N	2026-05-20 00:00:00	Active	Visitor	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 18:15:43.24	2026-05-20 18:15:55.733	\N
2ee2973e-3dbb-418c-aea4-ee39724f9478	default-tenant-id	\N	PathFirst1779300959635 PathLast1779300959635	pw.path.1779300959635@example.com	\N	Head of Household · Campus: Downtown	\N	\N	\N	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 18:16:01.96	2026-05-20 18:16:03.297	\N
512da348-0a31-4f5a-968a-17d471f5cbf3	default-tenant-id	\N	VolFirst1779300970330 VolLast1779300970330	pw.vol.1779300970330@example.com	\N	Head of Household · Campus: Downtown	\N	\N	2026-05-20 12:00:00	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 18:16:12.042	2026-05-20 18:16:12.042	\N
352be535-1722-4f5a-a659-09943ac51095	default-tenant-id	\N	CareFirst1779300982225 CareLast1779300982225	pw.care.1779300982225@example.com	\N	Head of Household · Campus: Downtown	\N	\N	2026-05-20 12:00:00	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-20 18:16:24.609	2026-05-20 18:16:24.609	\N
98e9b4a4-b430-423e-96e3-bf9dcc771238	default-tenant-id	d64edfbb-c4eb-42f5-ae13-16415ccac549	PWFirst1779374749624 PWLast1779374749624	pw.member.1779374749624@example.com		Smoke role 1779374749624	1990-01-15 00:00:00	\N	2026-05-21 00:00:00	Active	Visitor	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-21 14:45:52.82	2026-05-21 14:46:04.719	\N
f92dc6d1-359f-4a0b-be00-9dca7fdda1d0	default-tenant-id	\N	PathFirst1779374769083 PathLast1779374769083	pw.path.1779374769083@example.com	\N	Head of Household · Campus: Downtown	\N	\N	\N	Active	Member	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-21 14:46:11.38	2026-05-21 14:46:12.749	\N
3ff916c5-e8c6-4e9f-baef-b233545a9e0f	default-tenant-id	\N	CareFirst1779374793851 CareLast1779374793851	pw.care.1779374793851@example.com	\N	Head of Household · Campus: Downtown	\N	\N	2026-05-21 12:00:00	Active	Visitor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	India	\N	\N	2026-05-21 14:46:36.667	2026-05-21 14:46:36.667	\N
\.


--
-- Data for Name: MemberDocument; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MemberDocument" (id, "tenantId", "memberId", type, number, "fileUrl", verified, notes, "acceptedAt", "signerName", "signatureDataUrl", "createdAt", "updatedAt") FROM stdin;
6f8df4d4-90e5-4ed7-a0f6-4c250f3a131b	default-tenant-id	23af6d78-3128-4130-bfba-bfd50618de8c	DeclarationForm	\N	\N	f	Declaration policy accepted at intake (staff-attested).	\N	\N	\N	2026-05-20 06:53:00.7	2026-05-20 06:53:00.7
06848736-f162-403c-9926-00eb41fb0fb1	default-tenant-id	23af6d78-3128-4130-bfba-bfd50618de8c	GeneratedVisitorDeclaration	VIS-2026-00001	/uploads/members/default-tenant-id/23af6d78-3128-4130-bfba-bfd50618de8c/generated/visitor-declaration-4672dbc9-9f7f-4db9-b72a-3d8e758ef8c7.pdf	f	Registry document VIS-2026-00001. Official Institutional PDF compliance record.	\N	\N	\N	2026-05-20 06:53:05.472	2026-05-20 06:53:05.472
29dd916d-d386-4c23-9cc7-42f741d0f0a2	default-tenant-id	8dfde6d6-b543-4718-8911-f42aefe8233b	DeclarationForm	\N	\N	f	Declaration policy accepted at intake (staff-attested).	\N	\N	\N	2026-05-20 07:07:15.404	2026-05-20 07:07:15.404
8dd841f0-c00e-47e4-9dbb-691c6c5d4ef7	default-tenant-id	8dfde6d6-b543-4718-8911-f42aefe8233b	GeneratedVisitorDeclaration	VIS-2026-00002	/uploads/members/default-tenant-id/8dfde6d6-b543-4718-8911-f42aefe8233b/generated/visitor-declaration-e3cd4c91-f6a0-4763-9cd5-7219c6f12e0f.pdf	f	Registry document VIS-2026-00002. Official Institutional PDF compliance record.	\N	\N	\N	2026-05-20 07:07:20.541	2026-05-20 07:07:20.541
98d20007-852e-4b51-ba82-bd7823d47b3d	default-tenant-id	4d3af43e-2590-43f1-bb70-ec00793629b8	DeclarationForm	\N	\N	f	Declaration policy accepted at intake (staff-attested).	\N	\N	\N	2026-05-20 07:12:58.589	2026-05-20 07:12:58.589
206ae0cf-49b8-4e99-a2bd-838e1af4127f	default-tenant-id	4d3af43e-2590-43f1-bb70-ec00793629b8	GeneratedVisitorDeclaration	VIS-2026-00003	/uploads/members/default-tenant-id/4d3af43e-2590-43f1-bb70-ec00793629b8/generated/visitor-declaration-73d71008-c44c-4bc8-9b4f-2300b117a2a4.pdf	f	Registry document VIS-2026-00003. Official Institutional PDF compliance record.	\N	\N	\N	2026-05-20 07:13:03.692	2026-05-20 07:13:03.692
2dce456d-1742-4847-8600-8d7badf8b27a	default-tenant-id	9f3474dd-7ea9-4ec0-a568-d9a413d30c1c	DeclarationForm	\N	\N	f	Declaration policy accepted at intake (staff-attested).	\N	\N	\N	2026-05-20 07:28:05.996	2026-05-20 07:28:05.996
bd376447-ded0-464f-aa29-278986fe24d4	default-tenant-id	9f3474dd-7ea9-4ec0-a568-d9a413d30c1c	GeneratedVisitorDeclaration	VIS-2026-00004	/uploads/members/default-tenant-id/9f3474dd-7ea9-4ec0-a568-d9a413d30c1c/generated/visitor-declaration-1f8a8479-9c75-4cf2-9e2c-d29767a7cdcf.pdf	f	Registry document VIS-2026-00004. Official Institutional PDF compliance record.	\N	\N	\N	2026-05-20 07:28:10.823	2026-05-20 07:28:10.823
e4207a5a-727c-4c30-a983-318f5ef9a429	default-tenant-id	37673a99-f166-4702-8df3-91aea41f1dcc	DeclarationForm	\N	\N	f	Declaration policy accepted at intake (staff-attested).	\N	\N	\N	2026-05-20 11:16:02.501	2026-05-20 11:16:02.501
1f4478b8-2bb6-45f5-8deb-af916b4ed35f	default-tenant-id	37673a99-f166-4702-8df3-91aea41f1dcc	GeneratedVisitorDeclaration	VIS-2026-00005	/uploads/members/default-tenant-id/37673a99-f166-4702-8df3-91aea41f1dcc/generated/visitor-declaration-3bfcfb02-87fc-457e-936f-12fe764985be.pdf	f	Registry document VIS-2026-00005. Official Institutional PDF compliance record.	\N	\N	\N	2026-05-20 11:16:07.195	2026-05-20 11:16:07.195
dd74aa01-d49b-4d22-868d-a96edd8bb38b	default-tenant-id	ef0995b5-4816-42a4-83ab-fc65fe29a6ee	DeclarationForm	\N	\N	f	Declaration policy accepted at intake (staff-attested).	\N	\N	\N	2026-05-20 18:15:43.397	2026-05-20 18:15:43.397
7f4bf805-de8e-4a9f-a4e4-86ef2eee5319	default-tenant-id	ef0995b5-4816-42a4-83ab-fc65fe29a6ee	GeneratedVisitorDeclaration	VIS-2026-00006	/uploads/members/default-tenant-id/ef0995b5-4816-42a4-83ab-fc65fe29a6ee/generated/visitor-declaration-a5b85306-ea7d-4a28-a2d0-030678cdbf9a.pdf	f	Registry document VIS-2026-00006. Official Institutional PDF compliance record.	\N	\N	\N	2026-05-20 18:15:48.234	2026-05-20 18:15:48.234
b1a1748a-dd73-4e2c-83c1-a3ef128d6c20	default-tenant-id	98e9b4a4-b430-423e-96e3-bf9dcc771238	DeclarationForm	\N	\N	f	Declaration policy accepted at intake (staff-attested).	\N	\N	\N	2026-05-21 14:45:52.977	2026-05-21 14:45:52.977
f0c81780-2b9e-4af3-91b2-1daa36a7c2a2	default-tenant-id	98e9b4a4-b430-423e-96e3-bf9dcc771238	GeneratedVisitorDeclaration	VIS-2026-00007	/uploads/members/default-tenant-id/98e9b4a4-b430-423e-96e3-bf9dcc771238/generated/visitor-declaration-a651d317-7def-4ddd-9e1a-0eb932290cd1.pdf	f	Registry document VIS-2026-00007. Official Institutional PDF compliance record.	\N	\N	\N	2026-05-21 14:45:57.731	2026-05-21 14:45:57.731
\.


--
-- Data for Name: MemberEngagementSnapshot; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MemberEngagementSnapshot" (id, "tenantId", "memberId", score, "attendanceMetric", "givingMetric", "calculatedAt") FROM stdin;
\.


--
-- Data for Name: MemberPathwayProgress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MemberPathwayProgress" (id, "tenantId", "memberId", "pathwayId", "currentStepId", "assignedMentorId", status, "updatedAt") FROM stdin;
\.


--
-- Data for Name: MemberResponsibility; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."MemberResponsibility" (id, "tenantId", "memberId", role, "entityType", "entityId", status, "startDate", "endDate", "allocatedFunds", "usedFunds", notes, "createdAt", "updatedAt") FROM stdin;
7b7c462d-339e-492d-9aae-f9082fd79c97	default-tenant-id	74d135ee-b8a7-4137-951a-dc4898ff4451	Ministry Leader	Ministry	6fb8acd0-558c-4a62-a682-154b4f70f569	Active	2026-05-20 06:49:39.723	\N	\N	\N	\N	2026-05-20 06:49:39.724	2026-05-20 06:49:39.724
5f745002-034b-437b-a009-416d4e3a92eb	default-tenant-id	f1c66b29-be4b-41ae-8e1b-a707a2cb8893	Worship Team	Ministry	6fb8acd0-558c-4a62-a682-154b4f70f569	Active	2026-05-20 06:49:39.727	\N	\N	\N	\N	2026-05-20 06:49:39.727	2026-05-20 06:49:39.727
250c13e4-f6b0-4032-9097-cde52df2cea6	default-tenant-id	efec78ed-a3ce-4306-aa5d-a78cb7dc4439	Youth Leader	Ministry	5ffeeb66-fb19-45a1-8274-539f07e5cfdc	Active	2026-05-20 06:49:39.729	\N	\N	\N	\N	2026-05-20 06:49:39.729	2026-05-20 06:49:39.729
4a63188a-26a5-44bf-a480-1e078437e922	default-tenant-id	d0095111-4f2f-4d13-acf6-c83b356c3d0a	Coordinator	Ministry	368f3497-11e3-40c7-a364-9d33020f9c34	Active	2026-05-20 06:49:39.73	\N	\N	\N	\N	2026-05-20 06:49:39.731	2026-05-20 06:49:39.731
e6b79e1a-a4a0-420f-a2f3-418b78215cb7	default-tenant-id	8404911d-3139-4f4c-8e9b-cbd4e703ddf6	Outreach	Ministry	368f3497-11e3-40c7-a364-9d33020f9c34	Active	2026-05-20 06:49:39.732	\N	\N	\N	\N	2026-05-20 06:49:39.732	2026-05-20 06:49:39.732
0ba0b932-229d-40dc-bc2e-000fca3590d9	default-tenant-id	4867b73b-742d-4675-983e-994381643be9	Team Lead	Ministry	678278c7-535f-4abb-b3ec-1e868fa43a0f	Active	2026-05-20 06:49:39.734	\N	\N	\N	\N	2026-05-20 06:49:39.734	2026-05-20 06:49:39.734
886d78e8-9415-4a7c-a9ee-a7ed1dcaa5db	default-tenant-id	0e7855c1-e24d-4bfe-a750-f137064628ed	Children Ministry	Ministry	678278c7-535f-4abb-b3ec-1e868fa43a0f	Active	2026-05-20 06:49:39.736	\N	\N	\N	\N	2026-05-20 06:49:39.736	2026-05-20 06:49:39.736
68e6ea5f-ed77-4002-bd72-a43af735ac1c	default-tenant-id	ede36984-078e-4d72-ad15-f55dd44bfa99	Greeter	Ministry	\N	Active	2026-05-20 00:00:00	\N	\N	\N	\N	2026-05-20 06:53:26.953	2026-05-20 06:53:26.953
9333affe-1e6a-4cd1-9f4a-737aae32acfa	default-tenant-id	f0b8a548-5dcb-4bc6-bcbe-86bfd9a952d0	Greeter	Ministry	\N	Active	2026-05-20 00:00:00	\N	\N	\N	\N	2026-05-20 07:07:42.621	2026-05-20 07:07:42.621
b29ed93a-b8e9-4cbc-9ee6-653d87d76fb8	default-tenant-id	6d35bcde-b308-45c7-a1db-87e453d0101a	Greeter	Ministry	\N	Active	2026-05-20 00:00:00	\N	\N	\N	\N	2026-05-20 07:13:26.006	2026-05-20 07:13:26.006
c9fd7c28-3e88-4f52-94c3-8d5ebb1f528e	default-tenant-id	d99ad09a-3c1b-4fa9-bbb5-8b8154354d3c	Greeter	Ministry	\N	Active	2026-05-20 00:00:00	\N	\N	\N	\N	2026-05-20 07:28:32.621	2026-05-20 07:28:32.621
8cb84c60-7c1f-4df8-b85d-9567a4cb6a5a	default-tenant-id	8ac59352-f9cf-418e-b9c4-58a92722ecdc	Greeter	Ministry	\N	Active	2026-05-20 00:00:00	\N	\N	\N	\N	2026-05-20 11:16:36.207	2026-05-20 11:16:36.207
6e84df3f-3146-4f4b-8788-90270a089673	default-tenant-id	b6e8d402-2717-45e6-8de3-5a708f2fec98	Usher	Ministry	\N	Active	2026-05-20 00:00:00	\N	\N	\N	\N	2026-05-20 12:21:37.551	2026-05-20 12:21:37.551
a779f42f-1fe4-40c1-bbbb-ac7c01402926	default-tenant-id	b6e8d402-2717-45e6-8de3-5a708f2fec98	Usher	Ministry	\N	Active	2026-05-20 00:00:00	\N	\N	\N	\N	2026-05-20 12:21:43.005	2026-05-20 12:21:43.005
cd8f8280-fcbb-4e51-8b92-d7c981f21efc	default-tenant-id	b6e8d402-2717-45e6-8de3-5a708f2fec98	Greeter	Ministry	\N	Active	2026-05-20 00:00:00	\N	\N	\N	\N	2026-05-20 12:21:43.595	2026-05-20 12:21:43.595
e79f3196-a011-436c-b816-110e27b7dc9c	default-tenant-id	512da348-0a31-4f5a-968a-17d471f5cbf3	Greeter	Ministry	\N	Active	2026-05-20 00:00:00	\N	\N	\N	\N	2026-05-20 18:16:13.133	2026-05-20 18:16:13.133
ed1e0676-c210-427b-8226-3cdc2d199ae0	default-tenant-id	7715c94b-5534-4d20-b763-ca49ea780b06	Greeter	Ministry	\N	Active	2026-05-21 00:00:00	\N	\N	\N	\N	2026-05-21 14:46:23.825	2026-05-21 14:46:23.825
\.


--
-- Data for Name: Mentorship; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Mentorship" (id, "tenantId", "mentorId", "discipleId", "startDate", "endDate", status, notes) FROM stdin;
\.


--
-- Data for Name: Ministry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Ministry" (id, "tenantId", "campusId", name, "createdAt", "updatedAt") FROM stdin;
4815c160-e0b9-4880-bc31-39ce9b7e8622	default-tenant-id	\N	Kids Ministry	2026-05-20 06:49:39.686	2026-05-20 06:49:39.686
a718d38f-c465-4a95-b600-4c3df263180a	default-tenant-id	\N	Youth Ministry	2026-05-20 06:49:39.686	2026-05-20 06:49:39.686
08c53acd-02f0-4ea9-812b-97664e7915a7	default-tenant-id	\N	Worship Ministry	2026-05-20 06:49:39.686	2026-05-20 06:49:39.686
fc1b3cf9-0f8a-4d9d-bb03-4489fc7b9d63	default-tenant-id	\N	Care Ministry	2026-05-20 06:49:39.686	2026-05-20 06:49:39.686
6fb8acd0-558c-4a62-a682-154b4f70f569	default-tenant-id	33a7c5a0-6fe6-485c-84c3-845d8877dd0a	Worship	2026-05-20 06:49:39.703	2026-05-20 06:49:39.703
5ffeeb66-fb19-45a1-8274-539f07e5cfdc	default-tenant-id	33a7c5a0-6fe6-485c-84c3-845d8877dd0a	Youth Ministry	2026-05-20 06:49:39.705	2026-05-20 06:49:39.705
368f3497-11e3-40c7-a364-9d33020f9c34	default-tenant-id	33a7c5a0-6fe6-485c-84c3-845d8877dd0a	Outreach	2026-05-20 06:49:39.707	2026-05-20 06:49:39.707
678278c7-535f-4abb-b3ec-1e868fa43a0f	default-tenant-id	33a7c5a0-6fe6-485c-84c3-845d8877dd0a	Children Ministry	2026-05-20 06:49:39.709	2026-05-20 06:49:39.709
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Notification" (id, "tenantId", "userId", "targetRole", type, title, message, status, priority, "actionType", "actionLink", "createdAt", "readAt", "expiresAt") FROM stdin;
d3ee8604-e0d5-44d3-8d28-16e84e8edf81	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00001 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:37.895	\N	2026-05-27 06:49:37.893
7bd691ef-e970-4928-83af-28fa748bdd66	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00002 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:38.013	\N	2026-05-27 06:49:38.012
5ef501db-50c7-4697-b93b-69a80d74b759	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00003 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:38.132	\N	2026-05-27 06:49:38.131
a520510c-8517-4519-b8e0-995a09cfcbce	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00004 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:38.233	\N	2026-05-27 06:49:38.232
732078ea-34c5-4283-a6dd-7c7bb08b9694	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00005 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:38.314	\N	2026-05-27 06:49:38.314
c3873e7f-a44f-42c2-b528-e22220d40597	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00006 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:38.401	\N	2026-05-27 06:49:38.4
c3096c88-8737-4517-a458-a380891c68ee	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00007 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:38.489	\N	2026-05-27 06:49:38.489
3e745f58-e0ed-4a5f-85ac-2a41404cd81d	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00008 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:38.563	\N	2026-05-27 06:49:38.563
7affb5d5-089d-4fce-b1d0-561d3d2c68e5	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00009 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:38.621	\N	2026-05-27 06:49:38.621
9801038e-b04e-4e33-bebe-2ffd0419665f	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00010 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:38.697	\N	2026-05-27 06:49:38.697
d52b4c04-ef70-40ba-bb4b-9bec929c9ab3	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00011 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:38.765	\N	2026-05-27 06:49:38.764
dfac691c-c9e1-4634-852a-d7ea0af1a2a0	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00012 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:38.821	\N	2026-05-27 06:49:38.821
79298690-7201-4590-bce8-e824f2704dce	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00013 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:38.871	\N	2026-05-27 06:49:38.871
b590cf49-fde5-4c31-a7c5-70e4f5ca0584	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00014 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:38.915	\N	2026-05-27 06:49:38.915
6a38ff34-66ac-4054-8dde-55f19e3ac439	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00015 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:38.966	\N	2026-05-27 06:49:38.966
b08f9c29-8478-4f73-acea-bb6cea4b3882	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00016 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:39.016	\N	2026-05-27 06:49:39.016
3ba0ce8d-9407-4413-989f-2bacc5ed82a3	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00017 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:39.062	\N	2026-05-27 06:49:39.061
e9118b40-316f-486c-be6b-003b52186310	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00018 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:39.112	\N	2026-05-27 06:49:39.112
7b40a70b-98fd-42d1-b7aa-39612e407a3f	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00019 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:39.171	\N	2026-05-27 06:49:39.171
6c200006-15ec-45fb-b9d9-bf7d2a06405b	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00020 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:39.215	\N	2026-05-27 06:49:39.215
c77559dd-37cf-446b-bca3-0b98426af6cd	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00021 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:39.268	\N	2026-05-27 06:49:39.267
a00da815-18f5-4c70-9e5d-3a54bdabcf03	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00022 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:39.317	\N	2026-05-27 06:49:39.317
5d9080d9-130a-4497-be1d-d488db706842	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00023 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:39.364	\N	2026-05-27 06:49:39.363
0bea12c6-ff0d-4358-8b86-6d8bd4fc61c0	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00024 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:39.417	\N	2026-05-27 06:49:39.416
433dc404-52ad-4b35-8a7a-79cf244c3044	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00025 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:39.455	\N	2026-05-27 06:49:39.454
f26c2f5f-c7bc-4a53-9277-a54baa86c1cd	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00026 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:39.499	\N	2026-05-27 06:49:39.498
0d8d31af-1f23-4239-840c-7a1192d60877	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00027 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:39.556	\N	2026-05-27 06:49:39.556
97e5f398-f25e-4b39-b0a1-179725861a72	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00028 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:49:39.59	\N	2026-05-27 06:49:39.59
a76b833f-4079-47a2-a6ec-91b6d693e6fe	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00029 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 06:51:12.678	\N	2026-05-27 06:51:12.678
85c506fc-2c3e-4df1-a9a0-6e25b4d35270	default-tenant-id	\N	Pastoral	Digest_daily_ops	Daily operations digest	{"eventsToday":2,"pendingTasks":0,"failedEvents":0}	unread	MEDIUM	VIEW_MODULE	dashboard	2026-05-20 06:52:55.167	\N	2026-05-27 06:52:55.167
7bca8a42-aeed-4a4a-81fa-6ea768e110f6	default-tenant-id	\N	Pastoral	Digest_daily_ops	Daily operations digest	{"eventsToday":2,"pendingTasks":0,"failedEvents":0}	unread	MEDIUM	VIEW_MODULE	dashboard	2026-05-20 07:28:20.402	\N	2026-05-27 07:28:20.4
7e8b9d82-a7c3-4b69-9116-6f3539b15b94	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00030 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 10:23:04.734	\N	2026-05-27 10:23:04.733
ffa63095-498c-4858-b6bb-7139e4c2b6ea	default-tenant-id	\N	Pastoral	VisitorRegistered	New visitor registered	Guest “hif-ecopark-sim Visitor — Ananya Das” — assign follow-up in Outreach.	unread	MEDIUM	VIEW_MODULE	outreach	2026-05-20 12:18:35.001	\N	2026-06-03 12:18:35.001
44fa960b-a31a-425f-b9d6-b31d49851ddd	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00031 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 12:18:35.091	\N	2026-05-27 12:18:35.09
b343972a-59cc-4aa4-8e07-b2c041c7fa48	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00032 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 12:20:32.875	\N	2026-05-27 12:20:32.875
1ece8a87-63be-4e29-859a-9f433206e527	default-tenant-id	\N	Finance	VoucherPosted	Voucher Posted to Ledger	Receipt Voucher RECEIPT-2026-00033 has been successfully posted.	unread	LOW	VIEW_MODULE	finance	2026-05-20 12:20:41.932	\N	2026-05-27 12:20:41.932
75b0f36e-b14f-48c6-b24b-8a6a6732f021	default-tenant-id	\N	Admin	EventCreated	New event drafted	“E2E Test Event” was created. Open Events to coordinate volunteers and logistics.	read	LOW	VIEW_MODULE	events	2026-05-20 06:51:12.442	2026-05-20 15:50:01.759	2026-06-03 06:51:12.441
3aeeee54-9b31-498d-91ec-d0afba418775	default-tenant-id	\N	Admin	EventCreated	New event drafted	“PW Event 1779260025223” was created. Open Events to coordinate volunteers and logistics.	read	LOW	VIEW_MODULE	events	2026-05-20 06:53:46.023	2026-05-20 15:50:01.759	2026-06-03 06:53:46.023
ed2cebbd-1eba-4195-a44a-8d1ed8cde20d	default-tenant-id	\N	Admin	EventCreated	New event drafted	“PW Event 1779260226990” was created. Open Events to coordinate volunteers and logistics.	read	LOW	VIEW_MODULE	events	2026-05-20 06:57:07.825	2026-05-20 15:50:01.759	2026-06-03 06:57:07.825
e55b7923-9653-4187-90ae-7f83f1101201	default-tenant-id	\N	Admin	EventCreated	New event drafted	“PW Event 1779260881318” was created. Open Events to coordinate volunteers and logistics.	read	LOW	VIEW_MODULE	events	2026-05-20 07:08:01.981	2026-05-20 15:50:01.759	2026-06-03 07:08:01.98
b012c818-04c6-414a-a7df-7a1ff7f3b4cd	default-tenant-id	\N	Admin	EventCreated	New event drafted	“PW Event 1779261225073” was created. Open Events to coordinate volunteers and logistics.	read	LOW	VIEW_MODULE	events	2026-05-20 07:13:45.814	2026-05-20 15:50:01.759	2026-06-03 07:13:45.813
914ad932-2f85-4a79-8243-71217eac0631	default-tenant-id	\N	Admin	EventCreated	New event drafted	“PW Event 1779262130305” was created. Open Events to coordinate volunteers and logistics.	read	LOW	VIEW_MODULE	events	2026-05-20 07:28:51.037	2026-05-20 15:50:01.759	2026-06-03 07:28:51.036
c07be902-18e3-490a-b3d0-615b8f17f9b4	default-tenant-id	\N	Admin	EventCreated	New event drafted	“E2E Test Event” was created. Open Events to coordinate volunteers and logistics.	read	LOW	VIEW_MODULE	events	2026-05-20 10:23:04.482	2026-05-20 15:50:01.759	2026-06-03 10:23:04.482
fc16cae1-cd03-43f5-b971-b99dd89d5c5e	default-tenant-id	\N	Admin	EventCreated	New event drafted	“PW Event 1779275820723” was created. Open Events to coordinate volunteers and logistics.	read	LOW	VIEW_MODULE	events	2026-05-20 11:17:01.383	2026-05-20 15:50:01.759	2026-06-03 11:17:01.381
c52587a2-f5e6-443d-bc8c-8b0c8c50a0e0	default-tenant-id	\N	Admin	EventCreated	New event drafted	“hif-ecopark-sim Sunday Worship Gathering” was created. Open Events to coordinate volunteers and logistics.	read	LOW	VIEW_MODULE	events	2026-05-20 12:18:34.786	2026-05-20 15:50:01.759	2026-06-03 12:18:34.786
db5999ed-1620-4d03-a1e4-e6185faf1e15	default-tenant-id	\N	Admin	EventCreated	New event drafted	“hif-ecopark-sim Friday Worship Night” was created. Open Events to coordinate volunteers and logistics.	read	LOW	VIEW_MODULE	events	2026-05-20 12:18:34.831	2026-05-20 15:50:01.759	2026-06-03 12:18:34.831
2acdfccf-3fb7-47d2-8458-3cb119cf1a66	default-tenant-id	\N	Admin	EventCreated	New event drafted	“hif-ecopark-sim Youth Alive Night” was created. Open Events to coordinate volunteers and logistics.	read	LOW	VIEW_MODULE	events	2026-05-20 12:18:34.873	2026-05-20 15:50:01.759	2026-06-03 12:18:34.872
5318de3e-480e-49f1-a77c-dddae0ee39f3	default-tenant-id	\N	Admin	EventCreated	New event drafted	“hif-ecopark-sim Kingdom Conference 2026” was created. Open Events to coordinate volunteers and logistics.	read	LOW	VIEW_MODULE	events	2026-05-20 12:18:34.905	2026-05-20 15:50:01.759	2026-06-03 12:18:34.905
ac390786-5a44-4d65-b2b5-9f90b5c962c0	default-tenant-id	\N	Admin	LeaveRequestSubmitted	New Leave Request Received	HR Sim Staff 1779297885381 requested Annual leave from 2026-06-03 to 2026-06-05.	unread	MEDIUM	\N	/hr	2026-05-20 17:24:45.598	\N	\N
68ea6ba5-0e4e-4b6d-9dc9-ec74560057b6	default-tenant-id	\N	Pastoral	Digest_daily_ops	Daily operations digest	{"eventsToday":6,"pendingTasks":0,"failedEvents":0}	unread	MEDIUM	VIEW_MODULE	dashboard	2026-05-20 17:24:46.288	\N	2026-05-27 17:24:46.286
7d2a59b2-2c48-4578-bb62-b46db7213100	default-tenant-id	\N	Admin	LeaveRequestSubmitted	New Leave Request Received	HR Sim Staff 1779298021072 requested Annual leave from 2026-06-03 to 2026-06-05.	unread	MEDIUM	\N	/hr	2026-05-20 17:27:01.209	\N	\N
c6aecfb9-59e8-4290-b4d8-17fdddca7a7a	default-tenant-id	\N	Admin	LeaveRequestSubmitted	New Leave Request Received	HR Sim Staff 1779299374781 requested Annual leave from 2026-06-03 to 2026-06-05.	unread	MEDIUM	\N	/hr	2026-05-20 17:49:34.87	\N	\N
66199323-c973-42f0-a90d-82e6fe031d44	default-tenant-id	\N	Admin	LeaveRequestSubmitted	New Leave Request Received	HR Sim Staff 1779299374781 requested Sick leave from 2026-06-19 to 2026-06-20.	unread	MEDIUM	\N	/hr	2026-05-20 17:49:34.908	\N	\N
25023079-8a2c-48ca-b8d3-7c035b462280	default-tenant-id	\N	Admin	LeaveRequestSubmitted	New Leave Request Received	HR Sim Staff 1779297885381 requested Sick leave from 2026-07-04 to 2026-07-05.	unread	MEDIUM	\N	/hr	2026-05-20 17:53:52.473	\N	\N
6606d02f-e013-4c5a-bdc8-9d54ec644e22	default-tenant-id	\N	Admin	EventCreated	New event drafted	“PW Event 1779300994027” was created. Open Events to coordinate volunteers and logistics.	unread	LOW	VIEW_MODULE	events	2026-05-20 18:16:34.645	\N	2026-06-03 18:16:34.645
d735615a-5aed-4094-87b5-2b062d2f8f5d	default-tenant-id	\N	Pastoral	Digest_daily_ops	Daily operations digest	{"eventsToday":6,"pendingTasks":0,"failedEvents":0}	unread	MEDIUM	VIEW_MODULE	dashboard	2026-05-21 13:59:53.588	\N	2026-05-28 13:59:53.587
9140f690-cff7-46c7-b337-ed6e3c541b84	default-tenant-id	\N	Admin	EventCreated	New event drafted	“PW Event 1779374806224” was created. Open Events to coordinate volunteers and logistics.	unread	LOW	VIEW_MODULE	events	2026-05-21 14:46:46.848	\N	2026-06-04 14:46:46.847
a72f3cd7-7eb2-4b09-ab72-34ce447085d8	default-tenant-id	\N	Pastoral	Digest_daily_ops	Daily operations digest	{"eventsToday":6,"pendingTasks":0,"failedEvents":0}	unread	MEDIUM	VIEW_MODULE	dashboard	2026-05-24 08:42:39.986	\N	2026-05-31 08:42:39.986
\.


--
-- Data for Name: OnboardingTask; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OnboardingTask" (id, "tenantId", "memberId", "taskName", "dueDate", "isCompleted", "completedAt", notes, "createdAt", "updatedAt") FROM stdin;
9487c863-73bb-4269-9721-1fb29040cee8	default-tenant-id	08433f56-2ce1-48c3-949d-ec87509dcdbe	Policy acknowledgement	2026-05-20 00:00:00	f	\N	\N	2026-05-20 17:24:45.703	2026-05-20 17:24:45.703
e00a1620-4ebf-4880-a4ea-b3caffe408b3	default-tenant-id	5a79ac10-43f9-4f3b-9a88-9a56d9fc684b	Policy acknowledgement	2026-05-20 00:00:00	f	\N	\N	2026-05-20 17:27:01.26	2026-05-20 17:27:01.26
88eeab20-e2e1-40dc-bec4-e8b7627647f7	default-tenant-id	6dc40e02-c1c0-41c9-9562-d36ca8d72b63	Policy acknowledgement	2026-05-20 00:00:00	f	\N	\N	2026-05-20 17:49:34.944	2026-05-20 17:49:34.944
\.


--
-- Data for Name: OperationalDigest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OperationalDigest" (id, "tenantId", "digestType", payload, "generatedAt") FROM stdin;
d2657172-5e31-4636-a16a-3074f5fa51b5	default-tenant-id	daily_ops	{"eventsToday":2,"pendingTasks":0,"failedEvents":0}	2026-05-20 06:52:55.157
7ca9a03e-ddb4-4507-b48e-3839fc20c224	default-tenant-id	daily_ops	{"eventsToday":2,"pendingTasks":0,"failedEvents":0}	2026-05-20 07:28:20.396
f22c34ca-06f7-41f1-b3fd-40aa2397ab4c	default-tenant-id	daily_ops	{"eventsToday":6,"pendingTasks":0,"failedEvents":0}	2026-05-20 17:24:46.28
e86e488a-ed5b-4d4a-9d40-5799c41c84de	default-tenant-id	daily_ops	{"eventsToday":6,"pendingTasks":0,"failedEvents":0}	2026-05-21 13:59:53.577
c52f5b93-1151-41b3-b825-367ccc64e358	default-tenant-id	daily_ops	{"eventsToday":6,"pendingTasks":0,"failedEvents":0}	2026-05-24 08:42:39.974
\.


--
-- Data for Name: OutreachFollowUp; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OutreachFollowUp" (id, "tenantId", "contactId", "memberId", type, status, "assignedUserId", "dueDate", "completedAt", notes, "createdAt", "updatedAt") FROM stdin;
1ed0a56b-d9ba-4d4e-9dca-18742c843a9b	default-tenant-id	7bd66d49-0618-47fd-ad02-cfe8727baeb4	\N	first_visit	pending	\N	2026-05-21 12:18:34.991	\N	First-time guest follow-up	2026-05-20 12:18:34.995	2026-05-20 12:18:34.995
a342d1ad-9ace-4a0b-9d5a-ab049bf386a9	default-tenant-id	7bd66d49-0618-47fd-ad02-cfe8727baeb4	\N	repeat_visit	pending	\N	2026-05-22 12:20:32.765	\N	Repeat visit #2	2026-05-20 12:20:32.767	2026-05-20 12:20:32.767
\.


--
-- Data for Name: PageData; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PageData" (id, "tenantId", slug, title, content, "isPublished", "createdAt", "updatedAt") FROM stdin;
49271abb-3705-411d-82a0-0e0922ae219f	default-tenant-id	sermons	Sermons	[{"id":"8c26836a-3e02-45c3-acd6-6d255915bd54","type":"hero","config":{"variant":"centered","title":"The Message","subtitle":"Explore teachings centered on the timeless truth of Scripture and the person of Jesus.","buttonText":"Plan Your Visit","overlayOpacity":0.4,"imageUrl":"https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=2000"},"isVisible":true,"order":0},{"id":"aab6d824-bc42-4ed8-a769-fb94e1d81d36","type":"worship","config":{"title":"Atmosphere of Praise","imageUrl":""},"isVisible":true,"order":161},{"id":"cff6dfa9-0999-4520-bc2a-46903b6ba953","type":"sermon_list","config":{"title":"Watch Latest","limit":12,"widgetType":"latest_sermons"},"isVisible":true,"order":32}]	t	2026-05-20 06:49:39.623	2026-05-24 09:03:41.289
8c5c6398-18f3-406d-acf8-d507b787d0df	default-tenant-id	about	About	[{"id":"f3115644-f985-49b4-a291-3c64c41f5106","type":"hero","config":{"variant":"centered","title":"Kingdom smoke 1779374827480","subtitle":"A legacy of faith, anchored in the truth of the Gospel and the power of the Spirit.","buttonText":"Plan Your Visit","overlayOpacity":0.4,"imageUrl":"https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=2000"},"isVisible":true,"order":0},{"id":"90798e11-1193-4026-9fd4-b0376bb9c0ac","type":"timeline","config":{"title":"The Journey","events":[]},"isVisible":true,"order":171},{"id":"200daa50-c3d1-4e45-b4b5-321d253b6dc5","type":"values","config":{"title":"The Kingdom DNA","values":[]},"isVisible":true,"order":182},{"id":"6d172407-f73b-434c-9661-313b96ff0026","type":"leadership_grid","config":{"title":"The Team","widgetType":"leadership_grid"},"isVisible":true,"order":93},{"id":"d86afbe9-322b-4e64-be3a-2516aa535d43","type":"pastoral_note","config":{"title":"Come As You Are","message":"We are a church of second chances and new beginnings. You don't have to have it all figured out to be a part of what God is doing here.","author":"Pastoral Team"},"isVisible":true,"order":214}]	t	2026-05-20 06:49:39.621	2026-05-24 09:03:41.284
64dbddfc-3517-47b8-96e5-8fdaa6ff6bd8	default-tenant-id	giving	Giving	[{"id":"b7e6df8a-33af-4965-87ea-2681451d80fb","type":"hero","config":{"variant":"centered","title":"Radical Generosity","subtitle":"Join us in fueling a movement of grace through faithful and visionary stewardship.","buttonText":"Plan Your Visit","overlayOpacity":0.4,"imageUrl":"https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=2000"},"isVisible":true,"order":0},{"id":"5cb5d1dd-7a94-4750-b0b0-f54919d2d83c","type":"text","config":{"title":"The Heart of Giving","content":"We believe giving is an response to the grace we have received. Your partnership enables every outreach, mission, and moment of transformation.","alignment":"center"},"isVisible":true,"order":11},{"id":"3646caf0-76db-450e-bb23-d701971c6530","type":"giving_impact","config":{"title":"Collective Impact","widgetType":"giving_campaigns","campaigns":[{"title":"Local Care Hub","progress":65,"target":"$25,000","current":"$16,250","desc":"Expanding our reach to serve underprivileged families in our neighborhood."},{"title":"Global Mission Partners","progress":80,"target":"$40,000","current":"$32,000","desc":"Supporting sustainable gospel work across our international partner networks."}]},"isVisible":true,"order":112},{"id":"0068b280-0292-4fb6-ac34-4143ca798226","type":"qr_payment","config":{"title":"Quick & Secure","fundName":"Vision Fund"},"isVisible":true,"order":123},{"id":"cd8bb5ed-f8c1-49e0-afb9-be098f9db2ef","type":"giving_cta","config":{"title":"Partner With Us","description":"Your generosity fuels ministry and outreach in our community.","buttonText":"Give Online"},"isVisible":true,"order":54}]	t	2026-05-20 06:49:39.625	2026-05-24 09:03:41.294
25f7186c-87e2-45eb-9ea1-c03f45bc3c8b	default-tenant-id	ministries	Ministries	[{"id":"612336e7-96e7-46b0-a973-8cba173f1e9e","type":"hero","config":{"variant":"centered","title":"Connect & Serve","subtitle":"Discover a place where you can grow, belong, and use your unique gifts for His glory.","buttonText":"Plan Your Visit","overlayOpacity":0.4,"imageUrl":"https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=2000"},"isVisible":true,"order":0},{"id":"193c80f8-ed03-4332-967c-3f986199a450","type":"ministry_highlight","config":{"title":"Grace Kids","subtitle":"A safe, high-energy environment where your children can discover the love of Jesus through play and biblical teaching.","imageUrl":"https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&q=80&w=1000","reversed":false},"isVisible":true,"order":201},{"id":"67507cd0-33ac-408f-acfa-cc2391362af8","type":"ministry_grid","config":{"title":"Opportunities","widgetType":"ministry_grid"},"isVisible":true,"order":82},{"id":"f800178c-8e52-4e6e-ae61-21f8d6b13681","type":"ministry_highlight","config":{"title":"The Collective","subtitle":"Empowering the next generation to live with influence through authentic discipleship and community.","imageUrl":"https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=1000","reversed":true},"isVisible":true,"order":203},{"id":"d8d7f380-acb5-482c-878c-3f45145b8fa4","type":"next_steps","config":{"title":"Find Your Next Step","steps":[]},"isVisible":true,"order":154}]	t	2026-05-20 06:49:39.622	2026-05-24 09:03:41.287
dc5b56ac-f2aa-4312-83b5-e9fa8e006981	default-tenant-id	events	Events	[{"id":"93d221fb-77ee-48d3-ac29-f1be26f4eaf3","type":"hero","config":{"variant":"centered","title":"Gatherings","subtitle":"Life happens in community. Join us for what's next in the life of our church.","buttonText":"Plan Your Visit","overlayOpacity":0.4,"imageUrl":"https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=2000"},"isVisible":true,"order":0},{"id":"9cb7701b-e6b8-4a73-95e3-19087bc750da","type":"event_list","config":{"title":"Full Calendar","limit":20,"widgetType":"featured_events"},"isVisible":true,"order":41},{"id":"de38b322-31f3-445e-8f52-9540bff5b95c","type":"faq","config":{"title":"Event FAQs","items":[]},"isVisible":true,"order":192}]	t	2026-05-20 06:49:39.624	2026-05-24 09:03:41.292
24b2ceed-1988-4c7c-9362-87381697a3e9	default-tenant-id	next-steps	Next Steps	[{"id":"27b3d7ca-a5e8-4bd5-965b-80b7744e1d13","type":"hero","config":{"variant":"centered","title":"Your Journey","subtitle":"Finding your place in God's story and walking with purpose in community.","buttonText":"Plan Your Visit","overlayOpacity":0.4,"imageUrl":"https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=2000"},"isVisible":true,"order":0},{"id":"d54deb5f-f6f3-4ee1-90e4-746fe14777ad","type":"next_steps","config":{"title":"Discover Your Path","steps":[{"title":"New to Faith","desc":"A guided introduction to the radical love and message of Jesus Christ.","icon":"Sparkles"},{"title":"Public Baptism","desc":"Declare your faith publicly and join the family through baptism.","icon":"Video"},{"title":"Covenant Membership","desc":"Commit to the vision and find your unique place in the community.","icon":"Users"},{"title":"Ministry Serve","desc":"Use your God-given gifts to build the Kingdom and serve others.","icon":"Heart"}]},"isVisible":true,"order":151},{"id":"51b52dd8-3a06-4b6b-b863-1314d47ad5a8","type":"vision_statement","config":{"title":"Follow Him","subtitle":"Helping people far from God discover their identity and purpose in Christ."},"isVisible":true,"order":222}]	t	2026-05-20 06:49:39.628	2026-05-24 09:03:41.299
ab78a1d6-db74-4d88-bed0-0a10759ec936	default-tenant-id	leadership	Leadership	[{"id":"7d485f61-e08d-4fa4-9cce-5b13f250dc33","type":"hero","config":{"variant":"centered","title":"The Stewards","subtitle":"A team dedicated to serving God and His people with integrity and pastoral vision.","buttonText":"Plan Your Visit","overlayOpacity":0.4,"imageUrl":"https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=2000"},"isVisible":true,"order":0},{"id":"2246c341-084d-43a9-abc9-11e6cffc1cc8","type":"leadership_grid","config":{"title":"Pastoral Team","widgetType":"leadership_grid","staff":[{"name":"Pastors David & Sarah Chen","role":"Lead Visionaries","bio":"David and Sarah lead Grace Community with a focus on radical grace and biblical truth.","quote":"Our joy is seeing people discover their God-given potential."},{"name":"Marcus Wright","role":"Worship Director","bio":"Marcus leads our creative teams in crafting atmospheres of praise and devotion.","quote":"Worship is our lifestyle, not just our Sunday morning."},{"name":"Jessica Miller","role":"Executive Pastor","bio":"Jessica oversees the operations and discipleship pathways of our church family.","quote":"Excellence in ministry honors God and inspires people."}]},"isVisible":true,"order":91},{"id":"050aff58-e00c-4b95-a491-64bf208658fe","type":"pastoral_note","config":{"title":"Built to Serve","message":"We lead by serving. Our greatest honor is walking alongside you in your journey of faith.","author":"Senior Leadership"},"isVisible":true,"order":212}]	t	2026-05-20 06:49:39.628	2026-05-24 09:03:41.302
44cae3f1-8699-4df5-8952-bb9db9cbb22a	default-tenant-id	contact	Contact	[{"id":"6b99b5b5-6190-46c9-a198-86c470fcf723","type":"hero","config":{"variant":"centered","title":"Get In Touch","subtitle":"Connect with our team digitally or join us at our campus this weekend.","buttonText":"Plan Your Visit","overlayOpacity":0.4,"imageUrl":"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=2000"},"isVisible":true,"order":0},{"id":"31ec8c6a-eae3-4c2e-a7d9-2b3b471f8464","type":"contact_form","config":{"title":"Reach Out","widgetType":"campus_locations","subtitle":"General inquiries, baptism interest, or pastoral needs.","address":"","email":"","phone":""},"isVisible":true,"order":61},{"id":"df7a5fc0-8120-4bac-bd84-7ce8e92614c5","type":"faq","config":{"title":"Got Questions?","items":[]},"isVisible":true,"order":192}]	t	2026-05-20 06:49:39.629	2026-05-24 09:03:41.304
f4099bc5-0655-4683-b9d4-00c6aab78a7a	default-tenant-id	prayer	Prayer	[{"id":"8cbd2608-830f-4480-98b7-8865c62d4216","type":"hero","config":{"variant":"centered","title":"Stand Together","subtitle":"We believe in the power of persistent prayer and the active presence of God.","buttonText":"Plan Your Visit","overlayOpacity":0.4,"imageUrl":"https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&q=80&w=2000"},"isVisible":true,"order":0},{"id":"9c7e754c-6e6c-47cc-ba29-b52718e5a604","type":"text","config":{"title":"Pastoral Encouragement","content":"\\"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.\\" — Philippians 4:6","alignment":"center"},"isVisible":true,"order":11},{"id":"8eb918e5-1833-498e-b882-2316dbc90e28","type":"pastoral_note","config":{"title":"We Pray For You","message":"Our pastoral team and intercessors are dedicated to standing in the gap for you with honor and faith.","author":"Grace Prayer Team"},"isVisible":true,"order":212},{"id":"2b760ae2-0c5c-4793-9f45-b4045f0c135a","type":"testimonials","config":{"title":"Testimonies of Faith","items":[]},"isVisible":true,"order":103},{"id":"14abac38-1aec-40fc-bf49-f10df04909e1","type":"prayer_cta","config":{"title":"How Can We Pray?","subtitle":"Share your heart with our private and confidential prayer team."},"isVisible":true,"order":144}]	t	2026-05-20 06:49:39.626	2026-05-24 09:03:41.297
2ebe3607-7248-4e0f-ab1c-d5c498c4aa4a	default-tenant-id	portal	Portal	[{"id":"ddb42859-acb2-4de9-902c-eb1d4ef9cf38","type":"hero","config":{"variant":"centered","title":"Church Portal","subtitle":"Continue to the Kingdom OS portal for members, teams, and ministry operations.","buttonText":"Plan Your Visit","overlayOpacity":0.4},"isVisible":true,"order":0},{"id":"7bd51377-dc50-4820-bd6a-5215cf831fa5","type":"next_steps","config":{"title":"Portal Access Steps","steps":[{"title":"Member Login","desc":"Use your church credentials to access your dashboard.","icon":"Users"},{"title":"Team Workspace","desc":"Serve teams can review schedules, tasks, and updates.","icon":"Layout"},{"title":"Need Help?","desc":"Contact the office if you need login support.","icon":"Heart"},{"title":"Open Platform","desc":"Launch Kingdom OS securely.","icon":"ArrowRight"}]},"isVisible":true,"order":151}]	t	2026-05-20 06:49:39.63	2026-05-24 09:03:41.306
3e5860fd-072e-4f7f-8dfc-0245b1ea1e66	default-tenant-id	home	Home	[{"id":"d058202f-2dcd-4584-8a7b-7c2f99985bcc","type":"hero","config":{"variant":"centered","title":"Kingdom smoke 1779261144048","subtitle":"A community centered on the radical love of Jesus and the pursuit of His purpose.","buttonText":"Plan Your Visit","overlayOpacity":0.4,"imageUrl":"https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=2000"},"isVisible":true,"order":0},{"id":"84d84b6e-0d54-4245-b76b-0692b5d449fa","type":"text","config":{"title":"Gather With Us","content":"Sunday Services: 9:00 AM • 11:00 AM • 5:00 PM\\nExperience the presence of God through music, prayer, and authentic community.","alignment":"center"},"isVisible":true,"order":11},{"id":"f6ca8019-81e5-4c66-9bfc-ecaa1751ce12","type":"vision_statement","config":{"title":"Built for Glory","subtitle":"To reach people far from God and teach them how to follow Jesus step by radical step."},"isVisible":true,"order":222},{"id":"30c54917-aad4-4885-a9b4-9074ad76bd15","type":"pastoral_note","config":{"title":"A Message from Our Pastors","message":"We believe that church isn't just a building you visit, but a family where you truly belong and are deeply loved.","author":"Pastors David & Sarah Chen"},"isVisible":true,"order":213},{"id":"bf7ca660-1f04-4dba-922e-989c66dd2010","type":"ministry_grid","config":{"title":"Find Your Tribe","widgetType":"ministry_grid"},"isVisible":true,"order":84},{"id":"497a55af-ee26-4316-bde5-69b994877976","type":"event_list","config":{"title":"Featured Gatherings","limit":2,"widgetType":"featured_events"},"isVisible":true,"order":45},{"id":"f4c0763c-70d9-4bca-a030-850bff322a8f","type":"sermon_list","config":{"title":"Latest Message","limit":1,"widgetType":"latest_sermons"},"isVisible":true,"order":36},{"id":"8740c9ac-36c9-443b-a613-ae01e533586e","type":"giving_cta","config":{"title":"Support the Vision","description":"Your generosity enables us to serve our city and share the message of Jesus globally.","buttonText":"Give Online"},"isVisible":true,"order":57}]	f	2026-05-20 06:49:39.619	2026-05-24 09:03:41.319
\.


--
-- Data for Name: Pathway; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Pathway" (id, "tenantId", name, description, "createdAt", "updatedAt") FROM stdin;
23f5f0c8-d023-40dd-8e3d-3d82be290c2b	default-tenant-id	Faith Foundations	Seeded new-member pathway for UI testing	2026-05-20 06:49:37.123	2026-05-20 06:49:37.123
\.


--
-- Data for Name: PathwayStep; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PathwayStep" (id, "tenantId", "pathwayId", name, sequence) FROM stdin;
29c5ada7-663e-4898-b96b-861a11a6fd2a	default-tenant-id	23f5f0c8-d023-40dd-8e3d-3d82be290c2b	Attend worship	1
67db303a-7680-4222-8ad8-95e385844808	default-tenant-id	23f5f0c8-d023-40dd-8e3d-3d82be290c2b	Welcome lunch	2
41f0057a-50c3-49a6-b7c5-2210c384c83a	default-tenant-id	23f5f0c8-d023-40dd-8e3d-3d82be290c2b	Membership class	3
\.


--
-- Data for Name: PayableBill; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PayableBill" (id, "tenantId", "vendorId", "billNo", "billDate", "dueDate", amount, outstanding, "expenseAccountId", "payableAccountId", "fundId", "costCenterId", status, description, "sourceType", "sourceId", "sourceMetadata", "billVoucherId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PayablePayment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PayablePayment" (id, "tenantId", "vendorId", "billId", "paymentDate", amount, "paymentAccountId", "payableAccountId", "fundId", "costCenterId", notes, "sourceType", "sourceId", "paymentVoucherId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PayrollLine; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PayrollLine" (id, "tenantId", "runId", "memberId", "grossAmount", "deductionAmount", "netAmount", "salaryExpenseAccountId", "payrollPayableAccountId", "payslipNo", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PayrollRun; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PayrollRun" (id, "tenantId", "periodYear", "periodMonth", status, "totalGross", "totalDeductions", "totalNet", "payableVoucherId", "paymentVoucherId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PayrollStructure; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PayrollStructure" (id, "tenantId", "memberId", "baseSalary", allowances, deductions, "salaryExpenseAccountId", "payrollPayableAccountId", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PerformanceReview; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PerformanceReview" (id, "tenantId", "revieweeId", "reviewerId", "reviewDate", rating, feedback, goals, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Permission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Permission" (id, name, "moduleKey", description) FROM stdin;
2b42f467-4478-4b2a-bcc3-e68de877214e	manage_analytics	manage_analytics	\N
8e12fc45-1fec-46bc-b4a4-da4f7b0ac7cf	manage_members	manage_members	\N
3089ce10-4e40-4df7-b881-6d98ea094f16	manage_events	manage_events	\N
fd340465-6d61-48ca-bb74-e04eb2fb528f	manage_attendance	manage_attendance	\N
13759da9-30db-4b31-a58f-b09b103a7681	manage_finance	manage_finance	\N
6ccd9e5e-af1a-49f8-8e85-43666cb4fdd9	approve_voucher	approve_voucher	\N
316e86ce-dc92-4071-a291-4982cdaeb5a8	post_voucher	post_voucher	\N
8cce80db-5016-4173-9aec-36f98527c586	manage_giving	manage_giving	\N
188dc415-c2f6-4110-a443-8a159dbf10a4	manage_discipleship	manage_discipleship	\N
f44eef12-8f39-4697-972d-3905afd9dde0	manage_assets	manage_assets	\N
d06a6d96-5203-4704-91f4-166c716abca1	manage_outreach	manage_outreach	\N
0e995ba4-5fbe-41e5-ac12-1d1e8bffbf74	manage_communication	manage_communication	\N
cb3d082f-faaf-4d13-aaf6-12df3465d0de	manage_documents	manage_documents	\N
2c9c245a-4565-446e-966f-607e3edfb557	manage_website	manage_website	\N
719aef50-d978-47f6-8ddc-2c611c3cc319	manage_settings	manage_settings	\N
1bf0232e-3e48-4895-ad77-ea09987b3127	manage_hr	manage_hr	\N
\.


--
-- Data for Name: PrayerRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PrayerRequest" (id, "tenantId", "requesterId", content, visibility, status, urgency, category, "assignedUserId", testimony, "createdById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProcessedCashfreeEvent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProcessedCashfreeEvent" (id, "tenantId", "eventId", "eventType", "orderId", "paymentId", "signatureHash", "donationId", "voucherId", "createdAt") FROM stdin;
\.


--
-- Data for Name: ProcessedRazorpayEvent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProcessedRazorpayEvent" (id, "tenantId", "eventId", "paymentId", "signatureHash", "donationId", "voucherId", "createdAt") FROM stdin;
\.


--
-- Data for Name: ReceiptFySequence; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ReceiptFySequence" (id, "tenantId", "fyStartYear", "lastSeq", "createdAt", "updatedAt") FROM stdin;
fa0d4c49-cc7a-4783-b48b-bb4d7abee4b1	default-tenant-id	2026	5	2026-05-20 12:21:12.56	2026-05-20 17:50:41.86
\.


--
-- Data for Name: RecruitmentPipeline; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RecruitmentPipeline" (id, "tenantId", "candidateName", email, phone, "appliedRole", stage, "resumeUrl", notes, "createdAt", "updatedAt") FROM stdin;
05d96051-5508-4259-848d-3ba74371ff87	default-tenant-id	Applicant 1779297885381	hr-sim.applicant.1779297885381@grace.local	\N	Ministry Coordinator	Interview	\N	Simulation pipeline	2026-05-20 17:24:45.686	2026-05-20 17:24:45.686
e60a8bbb-fa31-4451-877a-12638a63a2ab	default-tenant-id	Applicant 1779298021072	hr-sim.applicant.1779298021072@grace.local	\N	Ministry Coordinator	Interview	\N	Simulation pipeline	2026-05-20 17:27:01.25	2026-05-20 17:27:01.25
4aba2b14-eab9-4a9b-b9f3-b6437cc6f2a3	default-tenant-id	Applicant 1779299374781	hr-sim.applicant.1779299374781@grace.local	\N	Ministry Coordinator	Interview	\N	Simulation pipeline	2026-05-20 17:49:34.935	2026-05-20 17:49:34.935
\.


--
-- Data for Name: Region; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Region" (id, "tenantId", "campusId", name, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ReimbursementRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ReimbursementRequest" (id, "tenantId", "memberId", amount, category, description, status, "receiptUrl", "voucherId", "approvedByUserId", "createdAt", "updatedAt") FROM stdin;
707af7e0-9f13-447a-bef9-b2994da81634	default-tenant-id	08433f56-2ce1-48c3-949d-ec87509dcdbe	250.00	Ministry	HR simulation travel	Pending	\N	\N	\N	2026-05-20 17:24:45.667	2026-05-20 17:24:45.667
edb380c4-105a-4f0b-863d-3bb9712ae6e4	default-tenant-id	5a79ac10-43f9-4f3b-9a88-9a56d9fc684b	250.00	Ministry	HR simulation travel	Pending	\N	\N	\N	2026-05-20 17:27:01.239	2026-05-20 17:27:01.239
367632e0-f26f-4256-970d-950c44173864	default-tenant-id	6dc40e02-c1c0-41c9-9562-d36ca8d72b63	250.00	Ministry	HR simulation travel	Pending	\N	\N	\N	2026-05-20 17:49:34.928	2026-05-20 17:49:34.928
b23ba721-c641-4cdb-b195-8b25e376f56d	default-tenant-id	08433f56-2ce1-48c3-949d-ec87509dcdbe	99.00	Ministry	E2E reimbursement	Pending	\N	\N	\N	2026-05-20 17:53:56.023	2026-05-20 17:53:56.023
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Role" (id, "tenantId", name, description, "isSystem", "createdAt", "updatedAt") FROM stdin;
f7dfe6bf-12ac-475f-906e-5c77fc864d98	default-tenant-id	Super Admin	\N	t	2026-05-20 06:49:36.775	2026-05-20 06:49:36.775
30209384-6ec1-49b4-8d66-16680440aec7	default-tenant-id	Member	\N	f	2026-05-20 06:49:36.779	2026-05-20 06:49:36.779
72598d6e-7f36-478d-85e0-d58b2fa817f9	default-tenant-id	Pastor	\N	f	2026-05-20 09:54:15.31	2026-05-20 09:54:15.31
014a79f4-f90a-4009-b04f-c2dc01fb2f98	default-tenant-id	Worship Leader	\N	f	2026-05-20 09:54:15.373	2026-05-20 09:54:15.373
9a77dbc1-bfbf-4aee-bd7d-c58145fa3ade	default-tenant-id	Volunteer Coordinator	\N	f	2026-05-20 09:54:15.387	2026-05-20 09:54:15.387
c2b8c6c6-82b2-4952-8694-3b33d2ff41c4	default-tenant-id	Finance Admin	\N	f	2026-05-20 09:54:15.404	2026-05-20 09:54:15.404
3c93fe58-3b7a-4729-a633-cb512e800f0b	default-tenant-id	Church Secretary	\N	f	2026-05-20 09:54:15.422	2026-05-20 09:54:15.422
1d562f89-fd1f-4431-bac1-811cfd97589b	default-tenant-id	Event Manager	\N	f	2026-05-20 09:54:15.438	2026-05-20 09:54:15.438
a03c3663-9908-40f8-bcbd-1bdc0f027d57	default-tenant-id	Campus Admin	\N	f	2026-05-20 09:54:15.45	2026-05-20 09:54:15.45
812ba713-bd63-4b90-82f7-bafadb7562ca	default-tenant-id	HR Admin	\N	f	2026-05-20 17:23:52.192	2026-05-20 17:23:52.192
\.


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RolePermission" ("roleId", "permissionId") FROM stdin;
f7dfe6bf-12ac-475f-906e-5c77fc864d98	2b42f467-4478-4b2a-bcc3-e68de877214e
f7dfe6bf-12ac-475f-906e-5c77fc864d98	8e12fc45-1fec-46bc-b4a4-da4f7b0ac7cf
f7dfe6bf-12ac-475f-906e-5c77fc864d98	3089ce10-4e40-4df7-b881-6d98ea094f16
f7dfe6bf-12ac-475f-906e-5c77fc864d98	fd340465-6d61-48ca-bb74-e04eb2fb528f
f7dfe6bf-12ac-475f-906e-5c77fc864d98	13759da9-30db-4b31-a58f-b09b103a7681
f7dfe6bf-12ac-475f-906e-5c77fc864d98	6ccd9e5e-af1a-49f8-8e85-43666cb4fdd9
f7dfe6bf-12ac-475f-906e-5c77fc864d98	316e86ce-dc92-4071-a291-4982cdaeb5a8
f7dfe6bf-12ac-475f-906e-5c77fc864d98	8cce80db-5016-4173-9aec-36f98527c586
f7dfe6bf-12ac-475f-906e-5c77fc864d98	188dc415-c2f6-4110-a443-8a159dbf10a4
f7dfe6bf-12ac-475f-906e-5c77fc864d98	f44eef12-8f39-4697-972d-3905afd9dde0
f7dfe6bf-12ac-475f-906e-5c77fc864d98	d06a6d96-5203-4704-91f4-166c716abca1
f7dfe6bf-12ac-475f-906e-5c77fc864d98	0e995ba4-5fbe-41e5-ac12-1d1e8bffbf74
f7dfe6bf-12ac-475f-906e-5c77fc864d98	cb3d082f-faaf-4d13-aaf6-12df3465d0de
f7dfe6bf-12ac-475f-906e-5c77fc864d98	2c9c245a-4565-446e-966f-607e3edfb557
f7dfe6bf-12ac-475f-906e-5c77fc864d98	719aef50-d978-47f6-8ddc-2c611c3cc319
72598d6e-7f36-478d-85e0-d58b2fa817f9	8e12fc45-1fec-46bc-b4a4-da4f7b0ac7cf
72598d6e-7f36-478d-85e0-d58b2fa817f9	188dc415-c2f6-4110-a443-8a159dbf10a4
72598d6e-7f36-478d-85e0-d58b2fa817f9	0e995ba4-5fbe-41e5-ac12-1d1e8bffbf74
72598d6e-7f36-478d-85e0-d58b2fa817f9	2b42f467-4478-4b2a-bcc3-e68de877214e
014a79f4-f90a-4009-b04f-c2dc01fb2f98	3089ce10-4e40-4df7-b881-6d98ea094f16
014a79f4-f90a-4009-b04f-c2dc01fb2f98	fd340465-6d61-48ca-bb74-e04eb2fb528f
9a77dbc1-bfbf-4aee-bd7d-c58145fa3ade	8e12fc45-1fec-46bc-b4a4-da4f7b0ac7cf
9a77dbc1-bfbf-4aee-bd7d-c58145fa3ade	3089ce10-4e40-4df7-b881-6d98ea094f16
9a77dbc1-bfbf-4aee-bd7d-c58145fa3ade	fd340465-6d61-48ca-bb74-e04eb2fb528f
c2b8c6c6-82b2-4952-8694-3b33d2ff41c4	13759da9-30db-4b31-a58f-b09b103a7681
c2b8c6c6-82b2-4952-8694-3b33d2ff41c4	8cce80db-5016-4173-9aec-36f98527c586
c2b8c6c6-82b2-4952-8694-3b33d2ff41c4	6ccd9e5e-af1a-49f8-8e85-43666cb4fdd9
c2b8c6c6-82b2-4952-8694-3b33d2ff41c4	316e86ce-dc92-4071-a291-4982cdaeb5a8
3c93fe58-3b7a-4729-a633-cb512e800f0b	8e12fc45-1fec-46bc-b4a4-da4f7b0ac7cf
3c93fe58-3b7a-4729-a633-cb512e800f0b	0e995ba4-5fbe-41e5-ac12-1d1e8bffbf74
3c93fe58-3b7a-4729-a633-cb512e800f0b	cb3d082f-faaf-4d13-aaf6-12df3465d0de
1d562f89-fd1f-4431-bac1-811cfd97589b	3089ce10-4e40-4df7-b881-6d98ea094f16
1d562f89-fd1f-4431-bac1-811cfd97589b	fd340465-6d61-48ca-bb74-e04eb2fb528f
a03c3663-9908-40f8-bcbd-1bdc0f027d57	8e12fc45-1fec-46bc-b4a4-da4f7b0ac7cf
a03c3663-9908-40f8-bcbd-1bdc0f027d57	3089ce10-4e40-4df7-b881-6d98ea094f16
a03c3663-9908-40f8-bcbd-1bdc0f027d57	2b42f467-4478-4b2a-bcc3-e68de877214e
a03c3663-9908-40f8-bcbd-1bdc0f027d57	719aef50-d978-47f6-8ddc-2c611c3cc319
c2b8c6c6-82b2-4952-8694-3b33d2ff41c4	1bf0232e-3e48-4895-ad77-ea09987b3127
812ba713-bd63-4b90-82f7-bafadb7562ca	1bf0232e-3e48-4895-ad77-ea09987b3127
812ba713-bd63-4b90-82f7-bafadb7562ca	8e12fc45-1fec-46bc-b4a4-da4f7b0ac7cf
812ba713-bd63-4b90-82f7-bafadb7562ca	13759da9-30db-4b31-a58f-b09b103a7681
\.


--
-- Data for Name: Sermon; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Sermon" (id, "tenantId", title, speaker, date, "videoUrl", "audioUrl", description, thumbnail, scripture, "isPublished", "createdAt", "updatedAt") FROM stdin;
8023362e-0c03-49c2-9c43-e228c7f4b13e	default-tenant-id	Walking in Faith	Pastor David	2026-05-13 06:49:37.385	\N	\N	Sunday message — demo archive.	\N	\N	f	2026-05-20 06:49:37.386	2026-05-20 06:49:37.386
312b2f27-fb23-413f-bc9b-796ce4e80bd7	default-tenant-id	Generous Hearts	Pastor Rachel	2026-05-06 06:49:37.39	\N	\N	Sunday message — demo archive.	\N	\N	f	2026-05-20 06:49:37.39	2026-05-20 06:49:37.39
08ab74e5-a8d3-4beb-8dc9-dfd19d8c8c89	default-tenant-id	Hope for the City	Elder Michael	2026-04-29 06:49:37.392	\N	\N	Sunday message — demo archive.	\N	\N	f	2026-05-20 06:49:37.392	2026-05-20 06:49:37.392
c54b9272-ced9-4f3b-9f11-0ad01dc539a9	default-tenant-id	The Good Shepherd	Pastor David	2026-04-22 06:49:37.393	\N	\N	Sunday message — demo archive.	\N	\N	f	2026-05-20 06:49:37.394	2026-05-20 06:49:37.394
85ce3a61-eb0c-46c0-b933-13dd6e8e3ae7	default-tenant-id	PW Sermon 1779260052952 edited	\N	2026-05-20 00:00:00	\N	\N	\N	\N	\N	f	2026-05-20 06:54:13.528	2026-05-20 06:54:14.19
0c3d8bfe-82bc-414a-9401-249c031fb74d	default-tenant-id	PW Sermon 1779260891919 edited	\N	2026-05-20 00:00:00	\N	\N	\N	\N	\N	f	2026-05-20 07:08:12.326	2026-05-20 07:08:12.845
c0c5310a-c94a-4432-b268-61e14e01b293	default-tenant-id	PW Sermon 1779261235117 edited	\N	2026-05-20 00:00:00	\N	\N	\N	\N	\N	f	2026-05-20 07:13:55.542	2026-05-20 07:13:55.969
b6fcac00-af13-4c2d-90bf-77896c37a0b6	default-tenant-id	PW Sermon 1779262141565 edited	\N	2026-05-20 00:00:00	\N	\N	\N	\N	\N	f	2026-05-20 07:29:01.992	2026-05-20 07:29:02.364
cca8f927-6bef-4963-b276-d0752085123b	default-tenant-id	PW Sermon 1779275834382 edited	\N	2026-05-20 00:00:00	\N	\N	\N	\N	\N	f	2026-05-20 11:17:14.711	2026-05-20 11:17:15.339
85b9e916-51ea-4933-8d74-15fbf381316e	default-tenant-id	PW Sermon 1779301006092	\N	2026-05-20 00:00:00	\N	\N	\N	\N	\N	f	2026-05-20 18:16:46.419	2026-05-20 18:16:46.419
eaf9d71f-f905-4309-ad2e-cb4e9a62d304	default-tenant-id	PW Sermon 1779301006092 edited	Pastor Ravi Nair	2026-05-20 00:00:00	https://www.youtube.com/watch?v=dQw4w9WgXcQ	\N	Message from Sunday worship at HIF Eco Park.	\N	\N	t	2026-05-20 12:20:33.998	2026-05-20 18:16:46.993
dae1554a-bcaa-47c2-ab11-901d8919d753	default-tenant-id	PW Sermon 1779374819778 edited	\N	2026-05-21 00:00:00	\N	\N	\N	\N	\N	f	2026-05-21 14:47:00.102	2026-05-21 14:47:01.183
\.


--
-- Data for Name: ServiceCollectionSession; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ServiceCollectionSession" (id, "tenantId", name, "serviceDate", status, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Setting; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Setting" (id, "tenantId", key, value) FROM stdin;
fb7fce99-f093-45b6-8cdf-94b5f546b9d3	default-tenant-id	seed.expanded_demo_v4	1779259777038
216410e5-7023-4daf-9112-078b6fb2e37f	default-tenant-id	seed.serving_demo_v1	2026-05-20T06:49:39.737Z
d1029af0-e701-40c6-9fc6-896ded419c4f	default-tenant-id	organization	{"name":"Zero-State QA 1779374846115","tagline":"","logo":"","address":"","phone":"","email":"","registrationNumber":"","taxId":""}
105e1ba2-1234-44e0-acaa-bab64f5a62ff	default-tenant-id	backup.last_run_at	2026-05-24T08:42:40.070Z
4290a00b-2d14-49df-88a3-3d111893d504	default-tenant-id	backup.last_size_bytes	48019
250af5d3-2094-4b8c-84d7-04fd3f1de46f	default-tenant-id	operational	{"notificationDelivery":"in_app","defaultConfidentiality":"PUBLIC","autoAssignCareCases":false,"requireFollowUpApproval":true}
aad2fbc4-cdcc-4f2d-8853-8bb1e0a9dcec	default-tenant-id	branding	{"primaryColor":"#1E3A5F","secondaryColor":"#C9A227","themeMode":"light","emailHeaderLogo":"","emailFooterText":"","publicTagline":"Welcome home — worship, grow, serve","favicon":""}
d820b562-6603-47d7-a73e-f27bdedd61ce	default-tenant-id	demo_mode	true
c5d5bba2-2d93-4a7e-aa53-85e4c3bb9b99	default-tenant-id	paymentGateway	{"onlineGivingEnabled":true,"primaryGateway":"cashfree","cashfreeEnvironment":"sandbox","cashfreeAppId":"","cashfreeSecretKey":"","cashfreeWebhookSecret":"","thankYouMessage":"","donorConfirmationEmail":true,"recurringGivingEnabled":false,"razorpayKeyId":"","razorpayKeySecret":"","razorpayWebhookSecret":""}
243769a3-ae15-4c31-a33b-acd13a47b5d3	default-tenant-id	system	{"timezone":"Asia/Kolkata","dateFormat":"DD/MM/YYYY","language":"en","auditLogging":true,"dataRetentionDays":365}
e91b8aff-c8ec-4d4d-889d-d3b65602d8c4	default-tenant-id	license_entitlements	{"plan":"pilot-ministry","modules":["members","events","attendance","giving","finance","website","operations","communication"],"issuedTo":"HIF Eco Park Church","validThrough":"2027-12-31"}
cc092ba9-f7ca-400a-ba46-25c004e379cf	default-tenant-id	operational_incidents	[{"id":"inc_1779613423003_ao4z4cs","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-24T09:03:43.003Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779613251315_imid9h2","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-24T09:00:51.315Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779374586831_uy7k5hi","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-21T14:43:06.831Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779374582432_kr54ew2","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-21T14:43:02.432Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779300804807_5w8vrwt","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T18:13:24.807Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779300800746_rcpjucv","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T18:13:20.746Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779299660521_b5e1srg","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T17:54:20.521Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779299656324_vapyft3","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T17:54:16.324Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779298114797_xzq5scf","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T17:28:34.797Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779298109521_af334hi","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T17:28:29.521Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779296041168_4hbetnf","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T16:54:01.168Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779296036422_v0fw1qs","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T16:53:56.422Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779279755300_vffsqt6","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T12:22:35.300Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779279751398_kgypvpx","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T12:22:31.398Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779275928479_8z7oqjf","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T11:18:48.479Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779275924473_lxujes2","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T11:18:44.473Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779275552092_ssm1tji","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T11:12:32.092Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779275548115_0qszdap","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T11:12:28.115Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779272798856_33v1n6x","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T10:26:38.856Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779272580973_vzoc3cx","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T10:23:00.973Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779270771265_d6zf9th","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T09:52:51.265Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779262056919_z4g7atj","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T07:27:36.919Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"},{"id":"inc_1779259975199_ia72rai","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T06:52:55.199Z","severity":"warning","category":"redis","title":"Redis not configured","detail":"Background queue runs synchronously — not ideal for production scale"},{"id":"inc_1779259869974_4goj9rq","tenantId":"default-tenant-id","status":"open","createdAt":"2026-05-20T06:51:09.974Z","severity":"info","category":"workflow_replay","title":"Failed workflows replay initiated","detail":"Requeued 0 domain events"}]
\.


--
-- Data for Name: SmallGroup; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SmallGroup" (id, "tenantId", "zoneId", name, type, "meetingDay", "isActive", "createdAt", "updatedAt") FROM stdin;
5e1738b2-50bc-41c5-ba11-c022803d7de9	default-tenant-id	\N	Young Adults Bible Study	Cell	Thursday	t	2026-05-20 06:49:37.134	2026-05-20 06:49:37.134
488174db-bea3-4bea-88eb-38ab5a1687d4	default-tenant-id	\N	Women's Fellowship	Group	Tuesday	t	2026-05-20 06:49:37.153	2026-05-20 06:49:37.153
\.


--
-- Data for Name: SmallGroupMember; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SmallGroupMember" (id, "tenantId", "groupId", "memberId", role, "joinedAt") FROM stdin;
ee4774ae-a91e-4a05-9dee-1f3a855b8c62	default-tenant-id	5e1738b2-50bc-41c5-ba11-c022803d7de9	74d135ee-b8a7-4137-951a-dc4898ff4451	LEADER	2026-05-20 06:49:37.14
498ec06d-1272-4636-9893-a156a1894cfb	default-tenant-id	5e1738b2-50bc-41c5-ba11-c022803d7de9	f1c66b29-be4b-41ae-8e1b-a707a2cb8893	PARTICIPANT	2026-05-20 06:49:37.146
91701369-5dcf-49ea-b155-c555a91dd1c1	default-tenant-id	5e1738b2-50bc-41c5-ba11-c022803d7de9	efec78ed-a3ce-4306-aa5d-a78cb7dc4439	PARTICIPANT	2026-05-20 06:49:37.147
12e921c7-30f7-4a05-8918-b6597022869a	default-tenant-id	5e1738b2-50bc-41c5-ba11-c022803d7de9	d0095111-4f2f-4d13-acf6-c83b356c3d0a	PARTICIPANT	2026-05-20 06:49:37.149
011afb7a-0127-4f3a-beba-237d25c9aa1e	default-tenant-id	5e1738b2-50bc-41c5-ba11-c022803d7de9	8404911d-3139-4f4c-8e9b-cbd4e703ddf6	PARTICIPANT	2026-05-20 06:49:37.15
b1f41ff3-8bf9-4939-89c4-57e66f4cfa56	default-tenant-id	5e1738b2-50bc-41c5-ba11-c022803d7de9	4867b73b-742d-4675-983e-994381643be9	PARTICIPANT	2026-05-20 06:49:37.152
2ec8e420-c1da-4381-bb9e-81deef2e27ce	default-tenant-id	488174db-bea3-4bea-88eb-38ab5a1687d4	74d135ee-b8a7-4137-951a-dc4898ff4451	LEADER	2026-05-20 06:49:37.155
72bea8d7-e76b-4b20-a6f1-64aa5fb7225f	default-tenant-id	488174db-bea3-4bea-88eb-38ab5a1687d4	f1c66b29-be4b-41ae-8e1b-a707a2cb8893	PARTICIPANT	2026-05-20 06:49:37.156
cbb71153-4a95-4551-973e-00870be1a2e4	default-tenant-id	488174db-bea3-4bea-88eb-38ab5a1687d4	efec78ed-a3ce-4306-aa5d-a78cb7dc4439	PARTICIPANT	2026-05-20 06:49:37.157
466db8c9-4f52-4844-b429-ce4fca958962	default-tenant-id	488174db-bea3-4bea-88eb-38ab5a1687d4	d0095111-4f2f-4d13-acf6-c83b356c3d0a	PARTICIPANT	2026-05-20 06:49:37.159
162f80e2-610f-4d80-bb65-a8cecd8b0c9c	default-tenant-id	488174db-bea3-4bea-88eb-38ab5a1687d4	8404911d-3139-4f4c-8e9b-cbd4e703ddf6	PARTICIPANT	2026-05-20 06:49:37.16
2ac9a9eb-661b-4d36-873c-fed06ef30831	default-tenant-id	488174db-bea3-4bea-88eb-38ab5a1687d4	4867b73b-742d-4675-983e-994381643be9	PARTICIPANT	2026-05-20 06:49:37.161
\.


--
-- Data for Name: SpiritualMilestone; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SpiritualMilestone" (id, "tenantId", "memberId", type, date, notes, "createdAt", "updatedAt") FROM stdin;
03511322-847a-43cd-a62a-d6ccd3b877ed	default-tenant-id	23af6d78-3128-4130-bfba-bfd50618de8c	Baptism	2026-05-20 12:00:00	Recorded at member intake.	2026-05-20 06:53:00.678	2026-05-20 06:53:00.678
84af566f-ebb5-44aa-86a6-68a76f9e44ad	default-tenant-id	8dfde6d6-b543-4718-8911-f42aefe8233b	Baptism	2026-05-20 12:00:00	Recorded at member intake.	2026-05-20 07:07:15.388	2026-05-20 07:07:15.388
3d68c214-5eee-481a-b5a8-99334931bcab	default-tenant-id	4d3af43e-2590-43f1-bb70-ec00793629b8	Baptism	2026-05-20 12:00:00	Recorded at member intake.	2026-05-20 07:12:58.571	2026-05-20 07:12:58.571
9c7ce116-c58c-4e2f-9fa3-fd908d6f737d	default-tenant-id	9f3474dd-7ea9-4ec0-a568-d9a413d30c1c	Baptism	2026-05-20 12:00:00	Recorded at member intake.	2026-05-20 07:28:05.973	2026-05-20 07:28:05.973
c8033215-d07f-42fd-95ef-03bf111473ab	default-tenant-id	37673a99-f166-4702-8df3-91aea41f1dcc	Baptism	2026-05-20 12:00:00	Recorded at member intake.	2026-05-20 11:16:02.479	2026-05-20 11:16:02.479
d1cd02b4-4026-4354-94ab-815569901575	default-tenant-id	ef0995b5-4816-42a4-83ab-fc65fe29a6ee	Baptism	2026-05-20 12:00:00	Recorded at member intake.	2026-05-20 18:15:43.377	2026-05-20 18:15:43.377
a24111fd-a719-43cd-9c5e-8140154fdabd	default-tenant-id	98e9b4a4-b430-423e-96e3-bf9dcc771238	Baptism	2026-05-21 12:00:00	Recorded at member intake.	2026-05-21 14:45:52.948	2026-05-21 14:45:52.948
\.


--
-- Data for Name: StaffDocument; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."StaffDocument" (id, "tenantId", "memberId", title, category, "fileUrl", "uploadedBy", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Task; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Task" (id, "tenantId", title, description, "assignedUserId", "assignedMemberId", "targetType", "targetId", "dueDate", status, priority, "createdById", "updatedById", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Tenant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Tenant" (id, name, domain, "createdAt", "updatedAt") FROM stdin;
default-tenant-id	HIF Eco Park Church	hifecopark.local	2026-05-20 06:49:36.694	2026-05-20 12:20:32.414
\.


--
-- Data for Name: TrainingRecord; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TrainingRecord" (id, "tenantId", "memberId", "courseName", provider, "completionDate", "certificationNo", status, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, "tenantId", email, username, password, "roleId", status, "resetToken", "resetTokenExpiry", "createdAt", "updatedAt", "memberId") FROM stdin;
cbf6a56e-b0a1-45da-bdd3-5518b14ab417	default-tenant-id	admin@grace.local	admin	$2b$10$h117bX2CEiKL6vFNbCtxROVcP/X06XlJkO8wenh03suNPibWxzr8K	f7dfe6bf-12ac-475f-906e-5c77fc864d98	Active	\N	\N	2026-05-20 06:49:36.978	2026-05-20 06:49:36.978	\N
c79a9a13-3ddb-456c-b730-f67a21263f0c	default-tenant-id	pastor@grace.local	pastor	$2b$10$Je20JySfx6G7yG8/QA85Hea1fSF5ykCFHV2PTgAkScF0/Xir9ykzK	72598d6e-7f36-478d-85e0-d58b2fa817f9	Active	\N	\N	2026-05-20 09:54:15.368	2026-05-20 17:49:00.994	\N
6e66cb8e-b39e-45e7-95b8-92eb5d02686f	default-tenant-id	worship@grace.local	worship	$2b$10$Je20JySfx6G7yG8/QA85Hea1fSF5ykCFHV2PTgAkScF0/Xir9ykzK	014a79f4-f90a-4009-b04f-c2dc01fb2f98	Active	\N	\N	2026-05-20 09:54:15.383	2026-05-20 17:49:01.022	\N
4273b5d7-fb93-468c-98e5-a210e1de2e00	default-tenant-id	volunteers@grace.local	volunteers	$2b$10$Je20JySfx6G7yG8/QA85Hea1fSF5ykCFHV2PTgAkScF0/Xir9ykzK	9a77dbc1-bfbf-4aee-bd7d-c58145fa3ade	Active	\N	\N	2026-05-20 09:54:15.401	2026-05-20 17:49:01.039	\N
d65d1880-665a-4ebe-96da-66970a528820	default-tenant-id	finance@grace.local	finance	$2b$10$Je20JySfx6G7yG8/QA85Hea1fSF5ykCFHV2PTgAkScF0/Xir9ykzK	c2b8c6c6-82b2-4952-8694-3b33d2ff41c4	Active	\N	\N	2026-05-20 09:54:15.42	2026-05-20 17:49:01.066	\N
2171aec2-aaa9-4e2e-93a0-5ca100fd8518	default-tenant-id	hradmin@grace.local	hradmin	$2b$10$Je20JySfx6G7yG8/QA85Hea1fSF5ykCFHV2PTgAkScF0/Xir9ykzK	812ba713-bd63-4b90-82f7-bafadb7562ca	Active	\N	\N	2026-05-20 17:23:52.202	2026-05-20 17:49:01.082	\N
c9837d18-95f2-45b4-8f9d-bed0a4a93350	default-tenant-id	events@grace.local	events	$2b$10$Je20JySfx6G7yG8/QA85Hea1fSF5ykCFHV2PTgAkScF0/Xir9ykzK	1d562f89-fd1f-4431-bac1-811cfd97589b	Active	\N	\N	2026-05-20 09:54:15.446	2026-05-20 17:49:01.107	\N
a52e6a22-c58e-4c31-b423-50653b8a0fc7	default-tenant-id	campus@grace.local	campus	$2b$10$Je20JySfx6G7yG8/QA85Hea1fSF5ykCFHV2PTgAkScF0/Xir9ykzK	a03c3663-9908-40f8-bcbd-1bdc0f027d57	Active	\N	\N	2026-05-20 09:54:15.467	2026-05-20 17:49:01.124	\N
665bc25b-4b9f-45ff-a1ad-9b488ce25b66	default-tenant-id	secretary@grace.local	secretary	$2b$10$Je20JySfx6G7yG8/QA85Hea1fSF5ykCFHV2PTgAkScF0/Xir9ykzK	3c93fe58-3b7a-4729-a633-cb512e800f0b	Active	\N	\N	2026-05-20 09:54:15.435	2026-05-20 17:49:01.151	3591fe28-b233-4e86-abc0-f5728369e2a1
\.


--
-- Data for Name: Vendor; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Vendor" (id, "tenantId", name, category, "contactName", email, phone, gstin, pan, address, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Voucher; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Voucher" (id, "tenantId", "voucherNo", type, date, amount, description, status, "postedAt", "reversesVoucherId", "approvedByUserId", "postedByUserId", source, "sourceRefId", "sourceType", "sourceId", "sourceMetadata", "createdAt", "updatedAt") FROM stdin;
dfefc66c-06e5-423a-bd54-1f24349f1f58	default-tenant-id	RECEIPT-2026-00001	Receipt	2026-05-20 06:49:37.395	14180.00	Donation via Cash - Ref: SEED-1779259777038-D-001	posted	2026-05-20 06:49:37.511	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	c4f15756-b9c5-4be7-8517-a15e0867f9cc	donation	c4f15756-b9c5-4be7-8517-a15e0867f9cc	null	2026-05-20 06:49:37.469	2026-05-20 06:49:37.513
4af4b97f-fb46-4413-b8e8-d5efa809ec9f	default-tenant-id	RECEIPT-2026-00029	Receipt	2026-05-20 06:51:12.579	250.00	Donation via Bank Transfer - Ref: E2E-TXN-1779259872528	posted	2026-05-20 06:51:12.649	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	0188bf33-9418-4577-8ea9-632c6d58f85a	donation	0188bf33-9418-4577-8ea9-632c6d58f85a	{"donorId": null, "campaignId": null, "donationId": "0188bf33-9418-4577-8ea9-632c6d58f85a"}	2026-05-20 06:51:12.594	2026-05-20 06:51:12.65
81741658-f336-46f8-bb20-ca095a841095	default-tenant-id	RECEIPT-2026-00002	Receipt	2026-05-19 06:49:37.912	205.00	Donation via Card - Ref: SEED-1779259777038-D-002	posted	2026-05-20 06:49:37.957	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	f39821f4-91ac-4557-a14f-85b7f738d1d1	donation	f39821f4-91ac-4557-a14f-85b7f738d1d1	null	2026-05-20 06:49:37.928	2026-05-20 06:49:37.958
a398c59b-892b-46a5-b1b0-d15c7882001d	default-tenant-id	RECEIPT-2026-00033	Receipt	2026-05-20 12:20:41.841	987654.00	Donation via Bank Transfer - Ref: PW-DEEP-1779279641153	posted	2026-05-20 12:20:41.897	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	3b0782a3-8048-4fc7-93e7-5c5601ae06e2	donation	3b0782a3-8048-4fc7-93e7-5c5601ae06e2	{"donorId": null, "campaignId": null, "donationId": "3b0782a3-8048-4fc7-93e7-5c5601ae06e2"}	2026-05-20 12:20:41.868	2026-05-20 12:20:41.898
5aed788d-6d4b-4458-a7e0-0e9600e16204	default-tenant-id	RECEIPT-2026-00003	Receipt	2026-05-18 06:49:38.023	300.00	Donation via Bank Transfer - Ref: SEED-1779259777038-D-003	posted	2026-05-20 06:49:38.068	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	fa253149-9210-4117-b63a-e82224ec5079	donation	fa253149-9210-4117-b63a-e82224ec5079	null	2026-05-20 06:49:38.039	2026-05-20 06:49:38.069
b00225ed-3429-49e6-b685-2b01fffba48c	default-tenant-id	RECEIPT-2026-00004	Receipt	2026-05-17 06:49:38.143	395.00	Donation via Cash - Ref: SEED-1779259777038-D-004	posted	2026-05-20 06:49:38.193	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	32053051-e4aa-4009-b4b6-0134a56ecb8d	donation	32053051-e4aa-4009-b4b6-0134a56ecb8d	null	2026-05-20 06:49:38.161	2026-05-20 06:49:38.194
daf7817f-c2d7-4c8a-a627-eb3c38276fd4	default-tenant-id	RECEIPT-2026-00005	Receipt	2026-05-16 06:49:38.241	330.00	Donation via Card - Ref: SEED-1779259777038-D-005	posted	2026-05-20 06:49:38.279	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	a9036195-e92d-40fd-b5b0-9470cf084926	donation	a9036195-e92d-40fd-b5b0-9470cf084926	null	2026-05-20 06:49:38.256	2026-05-20 06:49:38.28
b2ee5dc4-e155-41b1-86fa-1e3f17960afc	default-tenant-id	RECEIPT-2026-00006	Receipt	2026-05-15 06:49:38.321	425.00	Donation via Bank Transfer - Ref: SEED-1779259777038-D-006	posted	2026-05-20 06:49:38.365	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	1e03ed19-3448-4027-b287-1f4c15a1b5d6	donation	1e03ed19-3448-4027-b287-1f4c15a1b5d6	null	2026-05-20 06:49:38.337	2026-05-20 06:49:38.366
5ffb0752-e5c5-4fef-a262-564580c25de1	default-tenant-id	RECEIPT-2026-00007	Receipt	2026-05-14 06:49:38.408	520.00	Donation via Cash - Ref: SEED-1779259777038-D-007	posted	2026-05-20 06:49:38.456	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	37aebd79-7ac4-4972-ab2c-949f2822f64d	donation	37aebd79-7ac4-4972-ab2c-949f2822f64d	null	2026-05-20 06:49:38.426	2026-05-20 06:49:38.456
dcc8562c-ac3b-42ee-8e02-0ad0c9d99682	default-tenant-id	RECEIPT-2026-00008	Receipt	2026-05-13 06:49:38.496	230.00	Donation via Card - Ref: SEED-1779259777038-D-008	posted	2026-05-20 06:49:38.537	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	b0bd452b-2781-42e7-aeaf-71fa6064e59c	donation	b0bd452b-2781-42e7-aeaf-71fa6064e59c	null	2026-05-20 06:49:38.51	2026-05-20 06:49:38.537
296f9834-07b5-4c4e-897e-a3a40e721fbc	default-tenant-id	RECEIPT-2026-00030	Receipt	2026-05-20 10:23:04.616	250.00	Donation via Bank Transfer - Ref: E2E-TXN-1779272584561	posted	2026-05-20 10:23:04.699	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	3c3d90ee-a62a-42b1-8431-ff1ad005756d	donation	3c3d90ee-a62a-42b1-8431-ff1ad005756d	{"donorId": null, "campaignId": null, "donationId": "3c3d90ee-a62a-42b1-8431-ff1ad005756d"}	2026-05-20 10:23:04.63	2026-05-20 10:23:04.7
713f5a4e-fe4d-4da9-9a78-be975210d810	default-tenant-id	RECEIPT-2026-00009	Receipt	2026-05-12 06:49:38.569	165.00	Donation via Bank Transfer - Ref: SEED-1779259777038-D-009	posted	2026-05-20 06:49:38.594	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	6ae28ebd-9714-4575-b087-e79026b17434	donation	6ae28ebd-9714-4575-b087-e79026b17434	null	2026-05-20 06:49:38.578	2026-05-20 06:49:38.594
57d2b2da-91eb-4281-8198-fc8fa0f572da	default-tenant-id	RECEIPT-2026-00010	Receipt	2026-05-11 06:49:38.629	440.00	Donation via Cash - Ref: SEED-1779259777038-D-010	posted	2026-05-20 06:49:38.661	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	48285772-ff6b-4525-a23b-ff9207a07f45	donation	48285772-ff6b-4525-a23b-ff9207a07f45	null	2026-05-20 06:49:38.64	2026-05-20 06:49:38.661
708c8854-da4d-44d3-b1ff-273e77fd2927	default-tenant-id	RECEIPT-2026-00011	Receipt	2026-05-10 06:49:38.704	355.00	Donation via Card - Ref: SEED-1779259777038-D-011	posted	2026-05-20 06:49:38.739	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	e892a2dc-d829-4551-9910-311a7567b4a2	donation	e892a2dc-d829-4551-9910-311a7567b4a2	null	2026-05-20 06:49:38.719	2026-05-20 06:49:38.739
0c16ca38-0931-48d0-84c7-c78c75be6e13	default-tenant-id	RECEIPT-2026-00012	Receipt	2026-05-07 06:49:38.773	6900.00	Donation via Bank Transfer - Ref: SEED-1779259777038-D-012	posted	2026-05-20 06:49:38.796	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	614234f9-eaa7-4e07-ac31-3c943f35e27b	donation	614234f9-eaa7-4e07-ac31-3c943f35e27b	null	2026-05-20 06:49:38.782	2026-05-20 06:49:38.796
b4442385-f24b-4663-9f2f-7eeb7d4a85c2	default-tenant-id	RECEIPT-2026-00013	Receipt	2026-05-06 06:49:38.826	385.00	Donation via Cash - Ref: SEED-1779259777038-D-013	posted	2026-05-20 06:49:38.848	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	42abf449-73e5-4c3e-8428-c068e585ec82	donation	42abf449-73e5-4c3e-8428-c068e585ec82	null	2026-05-20 06:49:38.833	2026-05-20 06:49:38.849
9fbb9a28-c7f0-4755-b368-818017e88e16	default-tenant-id	RECEIPT-2026-00014	Receipt	2026-05-05 06:49:38.876	480.00	Donation via Card - Ref: SEED-1779259777038-D-014	posted	2026-05-20 06:49:38.896	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	10468cea-708e-4376-a3a4-3fb7fd9e773a	donation	10468cea-708e-4376-a3a4-3fb7fd9e773a	null	2026-05-20 06:49:38.883	2026-05-20 06:49:38.896
b88a5e5e-d348-4063-993a-5d69813e39bd	default-tenant-id	RECEIPT-2026-00015	Receipt	2026-05-04 06:49:38.919	190.00	Donation via Bank Transfer - Ref: SEED-1779259777038-D-015	posted	2026-05-20 06:49:38.941	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	d7ee865d-e1f1-4279-a29c-405c89f96dc8	donation	d7ee865d-e1f1-4279-a29c-405c89f96dc8	null	2026-05-20 06:49:38.928	2026-05-20 06:49:38.941
9fb5e342-b409-43f1-8c06-6275177f2327	default-tenant-id	RECEIPT-2026-00031	Receipt	2026-05-20 12:18:35.007	2500.00	Donation via Bank Transfer - Ref: hif-ecopark-sim-offering-1779279515007	posted	2026-05-20 12:18:35.066	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	49f1a4f9-eddd-4703-ba79-e45492550296	donation	49f1a4f9-eddd-4703-ba79-e45492550296	{"donorId": null, "campaignId": null, "donationId": "49f1a4f9-eddd-4703-ba79-e45492550296"}	2026-05-20 12:18:35.034	2026-05-20 12:18:35.066
59f0f1a3-c521-4b44-a734-f02e903e8c02	default-tenant-id	RECEIPT-2026-00016	Receipt	2026-05-03 06:49:38.97	285.00	Donation via Cash - Ref: SEED-1779259777038-D-016	posted	2026-05-20 06:49:38.99	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	d7b3d82a-35c0-480c-842c-9369f9f74cdf	donation	d7b3d82a-35c0-480c-842c-9369f9f74cdf	null	2026-05-20 06:49:38.978	2026-05-20 06:49:38.99
e7455175-9b8f-4b13-a635-ae625724c883	default-tenant-id	RECEIPT-2026-00017	Receipt	2026-05-02 06:49:39.02	220.00	Donation via Card - Ref: SEED-1779259777038-D-017	posted	2026-05-20 06:49:39.041	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	f016cb47-1e7e-4b44-bcd3-06784a7b5451	donation	f016cb47-1e7e-4b44-bcd3-06784a7b5451	null	2026-05-20 06:49:39.028	2026-05-20 06:49:39.042
b62d9e86-98b9-4ef0-825c-eeb916519e9a	default-tenant-id	RECEIPT-2026-00018	Receipt	2026-05-01 06:49:39.066	15000.00	Donation via Bank Transfer - Ref: SEED-1779259777038-D-018	posted	2026-05-20 06:49:39.086	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	c97d8da4-452e-4304-8078-1a36e481d209	donation	c97d8da4-452e-4304-8078-1a36e481d209	null	2026-05-20 06:49:39.074	2026-05-20 06:49:39.087
bb94d7d0-fae8-4269-9ac8-abbec50e8512	default-tenant-id	RECEIPT-2026-00019	Receipt	2026-04-30 06:49:39.117	410.00	Donation via Cash - Ref: SEED-1779259777038-D-019	posted	2026-05-20 06:49:39.146	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	d5314d6c-ccf0-466e-abab-939e0de79980	donation	d5314d6c-ccf0-466e-abab-939e0de79980	null	2026-05-20 06:49:39.125	2026-05-20 06:49:39.146
83b989f2-cf20-4bc6-ac82-bedb2cd00138	default-tenant-id	RECEIPT-2026-00020	Receipt	2026-04-29 06:49:39.175	505.00	Donation via Card - Ref: SEED-1779259777038-D-020	posted	2026-05-20 06:49:39.196	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	711e721f-0082-47b0-87e1-6cd34ec198db	donation	711e721f-0082-47b0-87e1-6cd34ec198db	null	2026-05-20 06:49:39.182	2026-05-20 06:49:39.196
ff8d6354-1a2b-421d-aa0f-6346aa0b2769	default-tenant-id	RECEIPT-2026-00021	Receipt	2026-04-28 06:49:39.221	560.00	Donation via Bank Transfer - Ref: SEED-1779259777038-D-021	posted	2026-05-20 06:49:39.247	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	582ca844-40bd-491e-923e-e3581a99d415	donation	582ca844-40bd-491e-923e-e3581a99d415	null	2026-05-20 06:49:39.228	2026-05-20 06:49:39.248
781fc419-f67b-42d0-8a68-1f8e78744b51	default-tenant-id	RECEIPT-2026-00022	Receipt	2026-04-27 06:49:39.272	230.00	Donation via Cash - Ref: SEED-1779259777038-D-022	posted	2026-05-20 06:49:39.291	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	8dfd9ce7-28b7-4041-9981-629eb38d2709	donation	8dfd9ce7-28b7-4041-9981-629eb38d2709	null	2026-05-20 06:49:39.278	2026-05-20 06:49:39.291
7278e894-4bbf-42f8-89f2-8e4c8e2d57d8	default-tenant-id	RECEIPT-2026-00032	Receipt	2026-05-20 12:20:32.782	2500.00	Donation via Bank Transfer - Ref: hif-ecopark-sim-offering-1779279632782	posted	2026-05-20 12:20:32.846	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	d1c46f71-3dd1-40b2-9147-683839b2aca2	donation	d1c46f71-3dd1-40b2-9147-683839b2aca2	{"donorId": null, "campaignId": null, "donationId": "d1c46f71-3dd1-40b2-9147-683839b2aca2"}	2026-05-20 12:20:32.797	2026-05-20 12:20:32.846
6f4d5a2f-e0dc-47da-a9ff-940ffa07f9fc	default-tenant-id	RECEIPT-2026-00023	Receipt	2026-04-24 06:49:39.321	7300.00	Donation via Card - Ref: SEED-1779259777038-D-023	posted	2026-05-20 06:49:39.343	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	6481ec5f-af80-461a-a7ac-6be0dfcd23af	donation	6481ec5f-af80-461a-a7ac-6be0dfcd23af	null	2026-05-20 06:49:39.328	2026-05-20 06:49:39.344
66db418a-5e4e-4ba0-9bf4-de38463fdfd8	default-tenant-id	RECEIPT-2026-00024	Receipt	2026-04-23 06:49:39.368	220.00	Donation via Bank Transfer - Ref: SEED-1779259777038-D-024	posted	2026-05-20 06:49:39.396	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	a51ac41e-d7b0-4015-ac87-8df16060f56e	donation	a51ac41e-d7b0-4015-ac87-8df16060f56e	null	2026-05-20 06:49:39.374	2026-05-20 06:49:39.396
21befbc0-1468-412b-a56f-b079444ae73d	default-tenant-id	RECEIPT-2026-00025	Receipt	2026-04-22 06:49:39.42	455.00	Donation via Cash - Ref: SEED-1779259777038-D-025	posted	2026-05-20 06:49:39.438	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	a8872ec0-34fc-4100-ba58-13bf622c211e	donation	a8872ec0-34fc-4100-ba58-13bf622c211e	null	2026-05-20 06:49:39.427	2026-05-20 06:49:39.438
021c72f6-678a-4276-8dd9-696c06bf40e3	default-tenant-id	RECEIPT-2026-00026	Receipt	2026-04-21 06:49:39.462	370.00	Donation via Card - Ref: SEED-1779259777038-D-026	posted	2026-05-20 06:49:39.482	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	7e9c2854-cf8b-4c1f-aa9a-a43a62f48056	donation	7e9c2854-cf8b-4c1f-aa9a-a43a62f48056	null	2026-05-20 06:49:39.471	2026-05-20 06:49:39.482
f6563df8-2f5c-479e-bc48-65abee7622eb	default-tenant-id	RECEIPT-2026-00027	Receipt	2026-04-20 06:49:39.502	425.00	Donation via Bank Transfer - Ref: SEED-1779259777038-D-027	posted	2026-05-20 06:49:39.523	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	748b3115-00a1-48ad-a9dd-35093e3f7c1b	donation	748b3115-00a1-48ad-a9dd-35093e3f7c1b	null	2026-05-20 06:49:39.51	2026-05-20 06:49:39.524
0c31578f-32ca-4bb0-b8b9-9e7b4b0417cb	default-tenant-id	RECEIPT-2026-00028	Receipt	2026-04-19 06:49:39.559	520.00	Donation via Cash - Ref: SEED-1779259777038-D-028	posted	2026-05-20 06:49:39.574	\N	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	cbf6a56e-b0a1-45da-bdd3-5518b14ab417	donation	d2379808-190d-4212-bd44-57e6dfaed220	donation	d2379808-190d-4212-bd44-57e6dfaed220	null	2026-05-20 06:49:39.564	2026-05-20 06:49:39.574
\.


--
-- Data for Name: VoucherAttachment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VoucherAttachment" (id, "tenantId", "voucherId", "documentId", "fileUrl", title, "mimeType", "checksumSha256", "sizeBytes", notes, "createdByUserId", "createdAt") FROM stdin;
\.


--
-- Data for Name: VoucherFySequence; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VoucherFySequence" (id, "tenantId", "fyStartYear", "voucherType", "lastSeq", "createdAt", "updatedAt") FROM stdin;
d8a3d541-b125-475c-ae17-1350d00ec9f5	default-tenant-id	2026	Receipt	33	2026-05-20 12:19:37.04	2026-05-20 17:50:41.86
\.


--
-- Data for Name: YearCloseRun; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."YearCloseRun" (id, "tenantId", "financialYearId", status, "closingVoucherId", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Zone; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Zone" (id, "tenantId", "regionId", name, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: AnalyticsEvent AnalyticsEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AnalyticsEvent"
    ADD CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY (id);


--
-- Name: ApprovalDecision ApprovalDecision_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ApprovalDecision"
    ADD CONSTRAINT "ApprovalDecision_pkey" PRIMARY KEY (id);


--
-- Name: ApprovalRequest ApprovalRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ApprovalRequest"
    ADD CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY (id);


--
-- Name: ApprovalRule ApprovalRule_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ApprovalRule"
    ADD CONSTRAINT "ApprovalRule_pkey" PRIMARY KEY (id);


--
-- Name: AssetDepreciationEntry AssetDepreciationEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssetDepreciationEntry"
    ADD CONSTRAINT "AssetDepreciationEntry_pkey" PRIMARY KEY (id);


--
-- Name: AssetMaintenanceLog AssetMaintenanceLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssetMaintenanceLog"
    ADD CONSTRAINT "AssetMaintenanceLog_pkey" PRIMARY KEY (id);


--
-- Name: Asset Asset_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_pkey" PRIMARY KEY (id);


--
-- Name: AttendanceSession AttendanceSession_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSession"
    ADD CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY (id);


--
-- Name: Attendance Attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_pkey" PRIMARY KEY (id);


--
-- Name: BackupRun BackupRun_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BackupRun"
    ADD CONSTRAINT "BackupRun_pkey" PRIMARY KEY (id);


--
-- Name: BankReconciliationSession BankReconciliationSession_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankReconciliationSession"
    ADD CONSTRAINT "BankReconciliationSession_pkey" PRIMARY KEY (id);


--
-- Name: BankStatementLine BankStatementLine_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankStatementLine"
    ADD CONSTRAINT "BankStatementLine_pkey" PRIMARY KEY (id);


--
-- Name: Budget Budget_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_pkey" PRIMARY KEY (id);


--
-- Name: Campaign Campaign_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Campaign"
    ADD CONSTRAINT "Campaign_pkey" PRIMARY KEY (id);


--
-- Name: Campus Campus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Campus"
    ADD CONSTRAINT "Campus_pkey" PRIMARY KEY (id);


--
-- Name: CareCase CareCase_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CareCase"
    ADD CONSTRAINT "CareCase_pkey" PRIMARY KEY (id);


--
-- Name: CareLog CareLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CareLog"
    ADD CONSTRAINT "CareLog_pkey" PRIMARY KEY (id);


--
-- Name: CareNote CareNote_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CareNote"
    ADD CONSTRAINT "CareNote_pkey" PRIMARY KEY (id);


--
-- Name: CommunicationCampaign CommunicationCampaign_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunicationCampaign"
    ADD CONSTRAINT "CommunicationCampaign_pkey" PRIMARY KEY (id);


--
-- Name: CommunicationDelivery CommunicationDelivery_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunicationDelivery"
    ADD CONSTRAINT "CommunicationDelivery_pkey" PRIMARY KEY (id);


--
-- Name: CommunicationLog CommunicationLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunicationLog"
    ADD CONSTRAINT "CommunicationLog_pkey" PRIMARY KEY (id);


--
-- Name: Contact Contact_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contact"
    ADD CONSTRAINT "Contact_pkey" PRIMARY KEY (id);


--
-- Name: CostCenter CostCenter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CostCenter"
    ADD CONSTRAINT "CostCenter_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: Donation Donation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Donation"
    ADD CONSTRAINT "Donation_pkey" PRIMARY KEY (id);


--
-- Name: EmploymentProfile EmploymentProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmploymentProfile"
    ADD CONSTRAINT "EmploymentProfile_pkey" PRIMARY KEY (id);


--
-- Name: EventLog EventLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EventLog"
    ADD CONSTRAINT "EventLog_pkey" PRIMARY KEY (id);


--
-- Name: Event Event_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_pkey" PRIMARY KEY (id);


--
-- Name: ExportLog ExportLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExportLog"
    ADD CONSTRAINT "ExportLog_pkey" PRIMARY KEY (id);


--
-- Name: Family Family_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Family"
    ADD CONSTRAINT "Family_pkey" PRIMARY KEY (id);


--
-- Name: FinancialAuditLog FinancialAuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FinancialAuditLog"
    ADD CONSTRAINT "FinancialAuditLog_pkey" PRIMARY KEY (id);


--
-- Name: FinancialPeriod FinancialPeriod_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FinancialPeriod"
    ADD CONSTRAINT "FinancialPeriod_pkey" PRIMARY KEY (id);


--
-- Name: FinancialReceipt FinancialReceipt_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FinancialReceipt"
    ADD CONSTRAINT "FinancialReceipt_pkey" PRIMARY KEY (id);


--
-- Name: FinancialYear FinancialYear_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FinancialYear"
    ADD CONSTRAINT "FinancialYear_pkey" PRIMARY KEY (id);


--
-- Name: Fund Fund_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Fund"
    ADD CONSTRAINT "Fund_pkey" PRIMARY KEY (id);


--
-- Name: GatewayPaymentOrder GatewayPaymentOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GatewayPaymentOrder"
    ADD CONSTRAINT "GatewayPaymentOrder_pkey" PRIMARY KEY (id);


--
-- Name: GatewaySettlementLine GatewaySettlementLine_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GatewaySettlementLine"
    ADD CONSTRAINT "GatewaySettlementLine_pkey" PRIMARY KEY (id);


--
-- Name: GatewaySettlement GatewaySettlement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GatewaySettlement"
    ADD CONSTRAINT "GatewaySettlement_pkey" PRIMARY KEY (id);


--
-- Name: IdempotencyKey IdempotencyKey_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IdempotencyKey"
    ADD CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY (id);


--
-- Name: JournalEntry JournalEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JournalEntry"
    ADD CONSTRAINT "JournalEntry_pkey" PRIMARY KEY (id);


--
-- Name: LeaveBalance LeaveBalance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveBalance"
    ADD CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY (id);


--
-- Name: LeaveRequest LeaveRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveRequest"
    ADD CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY (id);


--
-- Name: MemberDocument MemberDocument_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MemberDocument"
    ADD CONSTRAINT "MemberDocument_pkey" PRIMARY KEY (id);


--
-- Name: MemberEngagementSnapshot MemberEngagementSnapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MemberEngagementSnapshot"
    ADD CONSTRAINT "MemberEngagementSnapshot_pkey" PRIMARY KEY (id);


--
-- Name: MemberPathwayProgress MemberPathwayProgress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MemberPathwayProgress"
    ADD CONSTRAINT "MemberPathwayProgress_pkey" PRIMARY KEY (id);


--
-- Name: MemberResponsibility MemberResponsibility_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MemberResponsibility"
    ADD CONSTRAINT "MemberResponsibility_pkey" PRIMARY KEY (id);


--
-- Name: Member Member_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Member"
    ADD CONSTRAINT "Member_pkey" PRIMARY KEY (id);


--
-- Name: Mentorship Mentorship_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Mentorship"
    ADD CONSTRAINT "Mentorship_pkey" PRIMARY KEY (id);


--
-- Name: Ministry Ministry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ministry"
    ADD CONSTRAINT "Ministry_pkey" PRIMARY KEY (id);


--
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- Name: OnboardingTask OnboardingTask_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OnboardingTask"
    ADD CONSTRAINT "OnboardingTask_pkey" PRIMARY KEY (id);


--
-- Name: OperationalDigest OperationalDigest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OperationalDigest"
    ADD CONSTRAINT "OperationalDigest_pkey" PRIMARY KEY (id);


--
-- Name: OutreachFollowUp OutreachFollowUp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OutreachFollowUp"
    ADD CONSTRAINT "OutreachFollowUp_pkey" PRIMARY KEY (id);


--
-- Name: PageData PageData_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PageData"
    ADD CONSTRAINT "PageData_pkey" PRIMARY KEY (id);


--
-- Name: PathwayStep PathwayStep_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PathwayStep"
    ADD CONSTRAINT "PathwayStep_pkey" PRIMARY KEY (id);


--
-- Name: Pathway Pathway_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Pathway"
    ADD CONSTRAINT "Pathway_pkey" PRIMARY KEY (id);


--
-- Name: PayableBill PayableBill_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayableBill"
    ADD CONSTRAINT "PayableBill_pkey" PRIMARY KEY (id);


--
-- Name: PayablePayment PayablePayment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayablePayment"
    ADD CONSTRAINT "PayablePayment_pkey" PRIMARY KEY (id);


--
-- Name: PayrollLine PayrollLine_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayrollLine"
    ADD CONSTRAINT "PayrollLine_pkey" PRIMARY KEY (id);


--
-- Name: PayrollRun PayrollRun_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayrollRun"
    ADD CONSTRAINT "PayrollRun_pkey" PRIMARY KEY (id);


--
-- Name: PayrollStructure PayrollStructure_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayrollStructure"
    ADD CONSTRAINT "PayrollStructure_pkey" PRIMARY KEY (id);


--
-- Name: PerformanceReview PerformanceReview_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PerformanceReview"
    ADD CONSTRAINT "PerformanceReview_pkey" PRIMARY KEY (id);


--
-- Name: Permission Permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- Name: PrayerRequest PrayerRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PrayerRequest"
    ADD CONSTRAINT "PrayerRequest_pkey" PRIMARY KEY (id);


--
-- Name: ProcessedCashfreeEvent ProcessedCashfreeEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProcessedCashfreeEvent"
    ADD CONSTRAINT "ProcessedCashfreeEvent_pkey" PRIMARY KEY (id);


--
-- Name: ProcessedRazorpayEvent ProcessedRazorpayEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProcessedRazorpayEvent"
    ADD CONSTRAINT "ProcessedRazorpayEvent_pkey" PRIMARY KEY (id);


--
-- Name: ReceiptFySequence ReceiptFySequence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReceiptFySequence"
    ADD CONSTRAINT "ReceiptFySequence_pkey" PRIMARY KEY (id);


--
-- Name: RecruitmentPipeline RecruitmentPipeline_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RecruitmentPipeline"
    ADD CONSTRAINT "RecruitmentPipeline_pkey" PRIMARY KEY (id);


--
-- Name: Region Region_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Region"
    ADD CONSTRAINT "Region_pkey" PRIMARY KEY (id);


--
-- Name: ReimbursementRequest ReimbursementRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReimbursementRequest"
    ADD CONSTRAINT "ReimbursementRequest_pkey" PRIMARY KEY (id);


--
-- Name: RolePermission RolePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId");


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: Sermon Sermon_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sermon"
    ADD CONSTRAINT "Sermon_pkey" PRIMARY KEY (id);


--
-- Name: ServiceCollectionSession ServiceCollectionSession_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ServiceCollectionSession"
    ADD CONSTRAINT "ServiceCollectionSession_pkey" PRIMARY KEY (id);


--
-- Name: Setting Setting_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Setting"
    ADD CONSTRAINT "Setting_pkey" PRIMARY KEY (id);


--
-- Name: SmallGroupMember SmallGroupMember_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SmallGroupMember"
    ADD CONSTRAINT "SmallGroupMember_pkey" PRIMARY KEY (id);


--
-- Name: SmallGroup SmallGroup_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SmallGroup"
    ADD CONSTRAINT "SmallGroup_pkey" PRIMARY KEY (id);


--
-- Name: SpiritualMilestone SpiritualMilestone_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SpiritualMilestone"
    ADD CONSTRAINT "SpiritualMilestone_pkey" PRIMARY KEY (id);


--
-- Name: StaffDocument StaffDocument_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StaffDocument"
    ADD CONSTRAINT "StaffDocument_pkey" PRIMARY KEY (id);


--
-- Name: Task Task_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_pkey" PRIMARY KEY (id);


--
-- Name: Tenant Tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tenant"
    ADD CONSTRAINT "Tenant_pkey" PRIMARY KEY (id);


--
-- Name: TrainingRecord TrainingRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TrainingRecord"
    ADD CONSTRAINT "TrainingRecord_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Vendor Vendor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Vendor"
    ADD CONSTRAINT "Vendor_pkey" PRIMARY KEY (id);


--
-- Name: VoucherAttachment VoucherAttachment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoucherAttachment"
    ADD CONSTRAINT "VoucherAttachment_pkey" PRIMARY KEY (id);


--
-- Name: VoucherFySequence VoucherFySequence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoucherFySequence"
    ADD CONSTRAINT "VoucherFySequence_pkey" PRIMARY KEY (id);


--
-- Name: Voucher Voucher_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Voucher"
    ADD CONSTRAINT "Voucher_pkey" PRIMARY KEY (id);


--
-- Name: YearCloseRun YearCloseRun_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."YearCloseRun"
    ADD CONSTRAINT "YearCloseRun_pkey" PRIMARY KEY (id);


--
-- Name: Zone Zone_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Zone"
    ADD CONSTRAINT "Zone_pkey" PRIMARY KEY (id);


--
-- Name: Account_tenantId_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Account_tenantId_code_key" ON public."Account" USING btree ("tenantId", code);


--
-- Name: AnalyticsEvent_eventId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AnalyticsEvent_eventId_key" ON public."AnalyticsEvent" USING btree ("eventId");


--
-- Name: AnalyticsEvent_tenantId_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AnalyticsEvent_tenantId_timestamp_idx" ON public."AnalyticsEvent" USING btree ("tenantId", "timestamp");


--
-- Name: ApprovalDecision_tenantId_approvalRequestId_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ApprovalDecision_tenantId_approvalRequestId_level_idx" ON public."ApprovalDecision" USING btree ("tenantId", "approvalRequestId", level);


--
-- Name: ApprovalRequest_tenantId_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ApprovalRequest_tenantId_entityType_entityId_idx" ON public."ApprovalRequest" USING btree ("tenantId", "entityType", "entityId");


--
-- Name: ApprovalRequest_tenantId_status_currentLevel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ApprovalRequest_tenantId_status_currentLevel_idx" ON public."ApprovalRequest" USING btree ("tenantId", status, "currentLevel");


--
-- Name: ApprovalRule_tenantId_entityType_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ApprovalRule_tenantId_entityType_isActive_idx" ON public."ApprovalRule" USING btree ("tenantId", "entityType", "isActive");


--
-- Name: AssetDepreciationEntry_tenantId_assetId_periodDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssetDepreciationEntry_tenantId_assetId_periodDate_idx" ON public."AssetDepreciationEntry" USING btree ("tenantId", "assetId", "periodDate");


--
-- Name: AssetMaintenanceLog_tenantId_assetId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AssetMaintenanceLog_tenantId_assetId_idx" ON public."AssetMaintenanceLog" USING btree ("tenantId", "assetId");


--
-- Name: AttendanceSession_eventId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceSession_eventId_idx" ON public."AttendanceSession" USING btree ("eventId");


--
-- Name: AttendanceSession_tenantId_campusId_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceSession_tenantId_campusId_date_idx" ON public."AttendanceSession" USING btree ("tenantId", "campusId", date);


--
-- Name: AttendanceSession_tenantId_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceSession_tenantId_date_idx" ON public."AttendanceSession" USING btree ("tenantId", date);


--
-- Name: Attendance_memberId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Attendance_memberId_idx" ON public."Attendance" USING btree ("memberId");


--
-- Name: Attendance_sessionId_checkInTime_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Attendance_sessionId_checkInTime_idx" ON public."Attendance" USING btree ("sessionId", "checkInTime");


--
-- Name: Attendance_tenantId_memberId_checkInTime_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Attendance_tenantId_memberId_checkInTime_idx" ON public."Attendance" USING btree ("tenantId", "memberId", "checkInTime");


--
-- Name: Attendance_tenantId_sessionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Attendance_tenantId_sessionId_idx" ON public."Attendance" USING btree ("tenantId", "sessionId");


--
-- Name: BackupRun_tenantId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BackupRun_tenantId_createdAt_idx" ON public."BackupRun" USING btree ("tenantId", "createdAt");


--
-- Name: BankReconciliationSession_tenantId_accountId_fromDate_toDat_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BankReconciliationSession_tenantId_accountId_fromDate_toDat_idx" ON public."BankReconciliationSession" USING btree ("tenantId", "accountId", "fromDate", "toDate");


--
-- Name: BankStatementLine_tenantId_accountId_isMatched_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BankStatementLine_tenantId_accountId_isMatched_idx" ON public."BankStatementLine" USING btree ("tenantId", "accountId", "isMatched");


--
-- Name: BankStatementLine_tenantId_sessionId_txnDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BankStatementLine_tenantId_sessionId_txnDate_idx" ON public."BankStatementLine" USING btree ("tenantId", "sessionId", "txnDate");


--
-- Name: CareCase_tenantId_assignedUserId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CareCase_tenantId_assignedUserId_status_idx" ON public."CareCase" USING btree ("tenantId", "assignedUserId", status);


--
-- Name: CommunicationCampaign_tenantId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CommunicationCampaign_tenantId_status_idx" ON public."CommunicationCampaign" USING btree ("tenantId", status);


--
-- Name: CommunicationDelivery_tenantId_campaignId_channel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CommunicationDelivery_tenantId_campaignId_channel_idx" ON public."CommunicationDelivery" USING btree ("tenantId", "campaignId", channel);


--
-- Name: CommunicationDelivery_tenantId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "CommunicationDelivery_tenantId_status_idx" ON public."CommunicationDelivery" USING btree ("tenantId", status);


--
-- Name: Contact_tenantId_lastVisitAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Contact_tenantId_lastVisitAt_idx" ON public."Contact" USING btree ("tenantId", "lastVisitAt");


--
-- Name: Contact_tenantId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Contact_tenantId_status_idx" ON public."Contact" USING btree ("tenantId", status);


--
-- Name: Donation_tenantId_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Donation_tenantId_date_idx" ON public."Donation" USING btree ("tenantId", date);


--
-- Name: Donation_tenantId_fundId_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Donation_tenantId_fundId_date_idx" ON public."Donation" USING btree ("tenantId", "fundId", date);


--
-- Name: Donation_tenantId_gatewayPaymentId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Donation_tenantId_gatewayPaymentId_key" ON public."Donation" USING btree ("tenantId", "gatewayPaymentId");


--
-- Name: Donation_tenantId_gatewaySettlementId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Donation_tenantId_gatewaySettlementId_idx" ON public."Donation" USING btree ("tenantId", "gatewaySettlementId");


--
-- Name: Donation_tenantId_reversalVoucherId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Donation_tenantId_reversalVoucherId_idx" ON public."Donation" USING btree ("tenantId", "reversalVoucherId");


--
-- Name: Donation_tenantId_serviceCollectionSessionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Donation_tenantId_serviceCollectionSessionId_idx" ON public."Donation" USING btree ("tenantId", "serviceCollectionSessionId");


--
-- Name: Donation_tenantId_settlementStatus_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Donation_tenantId_settlementStatus_idx" ON public."Donation" USING btree ("tenantId", "settlementStatus");


--
-- Name: Donation_tenantId_voucherId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Donation_tenantId_voucherId_idx" ON public."Donation" USING btree ("tenantId", "voucherId");


--
-- Name: EmploymentProfile_memberId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "EmploymentProfile_memberId_key" ON public."EmploymentProfile" USING btree ("memberId");


--
-- Name: EventLog_tenantId_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EventLog_tenantId_entityType_entityId_idx" ON public."EventLog" USING btree ("tenantId", "entityType", "entityId");


--
-- Name: EventLog_tenantId_eventName_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EventLog_tenantId_eventName_idx" ON public."EventLog" USING btree ("tenantId", "eventName");


--
-- Name: EventLog_tenantId_occurredAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EventLog_tenantId_occurredAt_idx" ON public."EventLog" USING btree ("tenantId", "occurredAt");


--
-- Name: EventLog_tenantId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "EventLog_tenantId_status_idx" ON public."EventLog" USING btree ("tenantId", status);


--
-- Name: Event_tenantId_campusId_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Event_tenantId_campusId_date_idx" ON public."Event" USING btree ("tenantId", "campusId", date);


--
-- Name: Event_tenantId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Event_tenantId_status_idx" ON public."Event" USING btree ("tenantId", status);


--
-- Name: ExportLog_tenantId_exportType_generatedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExportLog_tenantId_exportType_generatedAt_idx" ON public."ExportLog" USING btree ("tenantId", "exportType", "generatedAt");


--
-- Name: FinancialAuditLog_tenantId_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FinancialAuditLog_tenantId_action_idx" ON public."FinancialAuditLog" USING btree ("tenantId", action);


--
-- Name: FinancialAuditLog_tenantId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FinancialAuditLog_tenantId_createdAt_idx" ON public."FinancialAuditLog" USING btree ("tenantId", "createdAt");


--
-- Name: FinancialAuditLog_tenantId_entityType_entityId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FinancialAuditLog_tenantId_entityType_entityId_idx" ON public."FinancialAuditLog" USING btree ("tenantId", "entityType", "entityId");


--
-- Name: FinancialReceipt_donationId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "FinancialReceipt_donationId_key" ON public."FinancialReceipt" USING btree ("donationId");


--
-- Name: FinancialReceipt_tenantId_issueDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "FinancialReceipt_tenantId_issueDate_idx" ON public."FinancialReceipt" USING btree ("tenantId", "issueDate");


--
-- Name: FinancialReceipt_tenantId_receiptNo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "FinancialReceipt_tenantId_receiptNo_key" ON public."FinancialReceipt" USING btree ("tenantId", "receiptNo");


--
-- Name: Fund_tenantId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Fund_tenantId_name_key" ON public."Fund" USING btree ("tenantId", name);


--
-- Name: GatewayPaymentOrder_tenantId_gateway_externalOrderId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "GatewayPaymentOrder_tenantId_gateway_externalOrderId_key" ON public."GatewayPaymentOrder" USING btree ("tenantId", gateway, "externalOrderId");


--
-- Name: GatewayPaymentOrder_tenantId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "GatewayPaymentOrder_tenantId_status_idx" ON public."GatewayPaymentOrder" USING btree ("tenantId", status);


--
-- Name: GatewaySettlementLine_donationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "GatewaySettlementLine_donationId_idx" ON public."GatewaySettlementLine" USING btree ("donationId");


--
-- Name: GatewaySettlementLine_tenantId_settlementId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "GatewaySettlementLine_tenantId_settlementId_idx" ON public."GatewaySettlementLine" USING btree ("tenantId", "settlementId");


--
-- Name: GatewaySettlement_tenantId_gateway_externalSettlementId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "GatewaySettlement_tenantId_gateway_externalSettlementId_key" ON public."GatewaySettlement" USING btree ("tenantId", gateway, "externalSettlementId");


--
-- Name: GatewaySettlement_tenantId_settlementDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "GatewaySettlement_tenantId_settlementDate_idx" ON public."GatewaySettlement" USING btree ("tenantId", "settlementDate");


--
-- Name: IdempotencyKey_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IdempotencyKey_expiresAt_idx" ON public."IdempotencyKey" USING btree ("expiresAt");


--
-- Name: IdempotencyKey_tenantId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IdempotencyKey_tenantId_createdAt_idx" ON public."IdempotencyKey" USING btree ("tenantId", "createdAt");


--
-- Name: IdempotencyKey_tenantId_key_operation_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "IdempotencyKey_tenantId_key_operation_key" ON public."IdempotencyKey" USING btree ("tenantId", key, operation);


--
-- Name: LeaveBalance_tenantId_memberId_leaveType_year_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LeaveBalance_tenantId_memberId_leaveType_year_key" ON public."LeaveBalance" USING btree ("tenantId", "memberId", "leaveType", year);


--
-- Name: MemberDocument_memberId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MemberDocument_memberId_idx" ON public."MemberDocument" USING btree ("memberId");


--
-- Name: MemberDocument_tenantId_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MemberDocument_tenantId_type_idx" ON public."MemberDocument" USING btree ("tenantId", type);


--
-- Name: MemberEngagementSnapshot_tenantId_memberId_calculatedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MemberEngagementSnapshot_tenantId_memberId_calculatedAt_idx" ON public."MemberEngagementSnapshot" USING btree ("tenantId", "memberId", "calculatedAt");


--
-- Name: MemberResponsibility_memberId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MemberResponsibility_memberId_idx" ON public."MemberResponsibility" USING btree ("memberId");


--
-- Name: MemberResponsibility_tenantId_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "MemberResponsibility_tenantId_role_idx" ON public."MemberResponsibility" USING btree ("tenantId", role);


--
-- Name: Member_tenantId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Member_tenantId_createdAt_idx" ON public."Member" USING btree ("tenantId", "createdAt");


--
-- Name: Member_tenantId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Member_tenantId_status_idx" ON public."Member" USING btree ("tenantId", status);


--
-- Name: Mentorship_tenantId_discipleId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Mentorship_tenantId_discipleId_idx" ON public."Mentorship" USING btree ("tenantId", "discipleId");


--
-- Name: Mentorship_tenantId_mentorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Mentorship_tenantId_mentorId_idx" ON public."Mentorship" USING btree ("tenantId", "mentorId");


--
-- Name: Notification_tenantId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_tenantId_createdAt_idx" ON public."Notification" USING btree ("tenantId", "createdAt");


--
-- Name: Notification_tenantId_targetRole_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_tenantId_targetRole_status_idx" ON public."Notification" USING btree ("tenantId", "targetRole", status);


--
-- Name: Notification_tenantId_userId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Notification_tenantId_userId_status_idx" ON public."Notification" USING btree ("tenantId", "userId", status);


--
-- Name: OperationalDigest_tenantId_digestType_generatedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OperationalDigest_tenantId_digestType_generatedAt_idx" ON public."OperationalDigest" USING btree ("tenantId", "digestType", "generatedAt");


--
-- Name: OutreachFollowUp_tenantId_assignedUserId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OutreachFollowUp_tenantId_assignedUserId_idx" ON public."OutreachFollowUp" USING btree ("tenantId", "assignedUserId");


--
-- Name: OutreachFollowUp_tenantId_status_dueDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OutreachFollowUp_tenantId_status_dueDate_idx" ON public."OutreachFollowUp" USING btree ("tenantId", status, "dueDate");


--
-- Name: PageData_tenantId_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PageData_tenantId_slug_key" ON public."PageData" USING btree ("tenantId", slug);


--
-- Name: PayableBill_tenantId_billNo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PayableBill_tenantId_billNo_key" ON public."PayableBill" USING btree ("tenantId", "billNo");


--
-- Name: PayableBill_tenantId_vendorId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PayableBill_tenantId_vendorId_status_idx" ON public."PayableBill" USING btree ("tenantId", "vendorId", status);


--
-- Name: PayablePayment_tenantId_billId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PayablePayment_tenantId_billId_idx" ON public."PayablePayment" USING btree ("tenantId", "billId");


--
-- Name: PayablePayment_tenantId_vendorId_paymentDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PayablePayment_tenantId_vendorId_paymentDate_idx" ON public."PayablePayment" USING btree ("tenantId", "vendorId", "paymentDate");


--
-- Name: PayrollLine_tenantId_memberId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PayrollLine_tenantId_memberId_idx" ON public."PayrollLine" USING btree ("tenantId", "memberId");


--
-- Name: PayrollLine_tenantId_runId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PayrollLine_tenantId_runId_idx" ON public."PayrollLine" USING btree ("tenantId", "runId");


--
-- Name: PayrollRun_tenantId_periodYear_periodMonth_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PayrollRun_tenantId_periodYear_periodMonth_key" ON public."PayrollRun" USING btree ("tenantId", "periodYear", "periodMonth");


--
-- Name: PayrollRun_tenantId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PayrollRun_tenantId_status_idx" ON public."PayrollRun" USING btree ("tenantId", status);


--
-- Name: PayrollStructure_memberId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PayrollStructure_memberId_key" ON public."PayrollStructure" USING btree ("memberId");


--
-- Name: Permission_moduleKey_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Permission_moduleKey_key" ON public."Permission" USING btree ("moduleKey");


--
-- Name: Permission_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Permission_name_key" ON public."Permission" USING btree (name);


--
-- Name: PrayerRequest_tenantId_assignedUserId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PrayerRequest_tenantId_assignedUserId_status_idx" ON public."PrayerRequest" USING btree ("tenantId", "assignedUserId", status);


--
-- Name: PrayerRequest_tenantId_requesterId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PrayerRequest_tenantId_requesterId_status_idx" ON public."PrayerRequest" USING btree ("tenantId", "requesterId", status);


--
-- Name: ProcessedCashfreeEvent_tenantId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProcessedCashfreeEvent_tenantId_createdAt_idx" ON public."ProcessedCashfreeEvent" USING btree ("tenantId", "createdAt");


--
-- Name: ProcessedCashfreeEvent_tenantId_eventId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ProcessedCashfreeEvent_tenantId_eventId_key" ON public."ProcessedCashfreeEvent" USING btree ("tenantId", "eventId");


--
-- Name: ProcessedRazorpayEvent_tenantId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProcessedRazorpayEvent_tenantId_createdAt_idx" ON public."ProcessedRazorpayEvent" USING btree ("tenantId", "createdAt");


--
-- Name: ProcessedRazorpayEvent_tenantId_eventId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ProcessedRazorpayEvent_tenantId_eventId_key" ON public."ProcessedRazorpayEvent" USING btree ("tenantId", "eventId");


--
-- Name: ReceiptFySequence_tenantId_fyStartYear_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ReceiptFySequence_tenantId_fyStartYear_key" ON public."ReceiptFySequence" USING btree ("tenantId", "fyStartYear");


--
-- Name: Role_tenantId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Role_tenantId_name_key" ON public."Role" USING btree ("tenantId", name);


--
-- Name: Sermon_tenantId_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Sermon_tenantId_date_idx" ON public."Sermon" USING btree ("tenantId", date);


--
-- Name: ServiceCollectionSession_tenantId_serviceDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ServiceCollectionSession_tenantId_serviceDate_idx" ON public."ServiceCollectionSession" USING btree ("tenantId", "serviceDate");


--
-- Name: Setting_tenantId_key_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Setting_tenantId_key_key" ON public."Setting" USING btree ("tenantId", key);


--
-- Name: SmallGroupMember_tenantId_groupId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SmallGroupMember_tenantId_groupId_idx" ON public."SmallGroupMember" USING btree ("tenantId", "groupId");


--
-- Name: SmallGroupMember_tenantId_memberId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SmallGroupMember_tenantId_memberId_idx" ON public."SmallGroupMember" USING btree ("tenantId", "memberId");


--
-- Name: SpiritualMilestone_memberId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SpiritualMilestone_memberId_idx" ON public."SpiritualMilestone" USING btree ("memberId");


--
-- Name: SpiritualMilestone_tenantId_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SpiritualMilestone_tenantId_type_idx" ON public."SpiritualMilestone" USING btree ("tenantId", type);


--
-- Name: Task_tenantId_assignedUserId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Task_tenantId_assignedUserId_status_idx" ON public."Task" USING btree ("tenantId", "assignedUserId", status);


--
-- Name: Task_tenantId_targetType_targetId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Task_tenantId_targetType_targetId_idx" ON public."Task" USING btree ("tenantId", "targetType", "targetId");


--
-- Name: Tenant_domain_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Tenant_domain_key" ON public."Tenant" USING btree (domain);


--
-- Name: User_memberId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_memberId_key" ON public."User" USING btree ("memberId");


--
-- Name: User_tenantId_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_tenantId_email_key" ON public."User" USING btree ("tenantId", email);


--
-- Name: User_tenantId_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_tenantId_username_key" ON public."User" USING btree ("tenantId", username);


--
-- Name: Vendor_tenantId_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Vendor_tenantId_isActive_idx" ON public."Vendor" USING btree ("tenantId", "isActive");


--
-- Name: Vendor_tenantId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Vendor_tenantId_name_key" ON public."Vendor" USING btree ("tenantId", name);


--
-- Name: VoucherAttachment_tenantId_voucherId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VoucherAttachment_tenantId_voucherId_createdAt_idx" ON public."VoucherAttachment" USING btree ("tenantId", "voucherId", "createdAt");


--
-- Name: VoucherFySequence_tenantId_fyStartYear_voucherType_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "VoucherFySequence_tenantId_fyStartYear_voucherType_key" ON public."VoucherFySequence" USING btree ("tenantId", "fyStartYear", "voucherType");


--
-- Name: Voucher_reversesVoucherId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Voucher_reversesVoucherId_key" ON public."Voucher" USING btree ("reversesVoucherId");


--
-- Name: Voucher_tenantId_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Voucher_tenantId_date_idx" ON public."Voucher" USING btree ("tenantId", date);


--
-- Name: Voucher_tenantId_sourceType_sourceId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Voucher_tenantId_sourceType_sourceId_idx" ON public."Voucher" USING btree ("tenantId", "sourceType", "sourceId");


--
-- Name: Voucher_tenantId_source_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Voucher_tenantId_source_idx" ON public."Voucher" USING btree ("tenantId", source);


--
-- Name: Voucher_tenantId_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Voucher_tenantId_status_idx" ON public."Voucher" USING btree ("tenantId", status);


--
-- Name: Voucher_tenantId_voucherNo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Voucher_tenantId_voucherNo_key" ON public."Voucher" USING btree ("tenantId", "voucherNo");


--
-- Name: YearCloseRun_tenantId_financialYearId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "YearCloseRun_tenantId_financialYearId_createdAt_idx" ON public."YearCloseRun" USING btree ("tenantId", "financialYearId", "createdAt");


--
-- Name: Account Account_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Account Account_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AnalyticsEvent AnalyticsEvent_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AnalyticsEvent"
    ADD CONSTRAINT "AnalyticsEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ApprovalDecision ApprovalDecision_approvalRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ApprovalDecision"
    ADD CONSTRAINT "ApprovalDecision_approvalRequestId_fkey" FOREIGN KEY ("approvalRequestId") REFERENCES public."ApprovalRequest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ApprovalDecision ApprovalDecision_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ApprovalDecision"
    ADD CONSTRAINT "ApprovalDecision_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ApprovalRequest ApprovalRequest_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ApprovalRequest"
    ADD CONSTRAINT "ApprovalRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ApprovalRule ApprovalRule_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ApprovalRule"
    ADD CONSTRAINT "ApprovalRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AssetDepreciationEntry AssetDepreciationEntry_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssetDepreciationEntry"
    ADD CONSTRAINT "AssetDepreciationEntry_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public."Asset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AssetDepreciationEntry AssetDepreciationEntry_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssetDepreciationEntry"
    ADD CONSTRAINT "AssetDepreciationEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AssetDepreciationEntry AssetDepreciationEntry_voucherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssetDepreciationEntry"
    ADD CONSTRAINT "AssetDepreciationEntry_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES public."Voucher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AssetMaintenanceLog AssetMaintenanceLog_assetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssetMaintenanceLog"
    ADD CONSTRAINT "AssetMaintenanceLog_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES public."Asset"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AssetMaintenanceLog AssetMaintenanceLog_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AssetMaintenanceLog"
    ADD CONSTRAINT "AssetMaintenanceLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Asset Asset_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Asset Asset_capitalizationVoucherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_capitalizationVoucherId_fkey" FOREIGN KEY ("capitalizationVoucherId") REFERENCES public."Voucher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Asset Asset_disposalVoucherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_disposalVoucherId_fkey" FOREIGN KEY ("disposalVoucherId") REFERENCES public."Voucher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Asset Asset_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Asset"
    ADD CONSTRAINT "Asset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AttendanceSession AttendanceSession_campusId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSession"
    ADD CONSTRAINT "AttendanceSession_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES public."Campus"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AttendanceSession AttendanceSession_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSession"
    ADD CONSTRAINT "AttendanceSession_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AttendanceSession AttendanceSession_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceSession"
    ADD CONSTRAINT "AttendanceSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Attendance Attendance_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Attendance Attendance_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."AttendanceSession"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Attendance Attendance_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BackupRun BackupRun_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BackupRun"
    ADD CONSTRAINT "BackupRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BankReconciliationSession BankReconciliationSession_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankReconciliationSession"
    ADD CONSTRAINT "BankReconciliationSession_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BankReconciliationSession BankReconciliationSession_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankReconciliationSession"
    ADD CONSTRAINT "BankReconciliationSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BankStatementLine BankStatementLine_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankStatementLine"
    ADD CONSTRAINT "BankStatementLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: BankStatementLine BankStatementLine_matchedVoucherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankStatementLine"
    ADD CONSTRAINT "BankStatementLine_matchedVoucherId_fkey" FOREIGN KEY ("matchedVoucherId") REFERENCES public."Voucher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BankStatementLine BankStatementLine_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankStatementLine"
    ADD CONSTRAINT "BankStatementLine_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public."BankReconciliationSession"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BankStatementLine BankStatementLine_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BankStatementLine"
    ADD CONSTRAINT "BankStatementLine_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Budget Budget_costCenterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES public."CostCenter"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Budget Budget_financialYearId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES public."FinancialYear"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Budget Budget_fundId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES public."Fund"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Budget Budget_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Budget"
    ADD CONSTRAINT "Budget_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Campaign Campaign_defaultFundId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Campaign"
    ADD CONSTRAINT "Campaign_defaultFundId_fkey" FOREIGN KEY ("defaultFundId") REFERENCES public."Fund"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Campaign Campaign_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Campaign"
    ADD CONSTRAINT "Campaign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Campus Campus_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Campus"
    ADD CONSTRAINT "Campus_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CareCase CareCase_assignedUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CareCase"
    ADD CONSTRAINT "CareCase_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CareCase CareCase_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CareCase"
    ADD CONSTRAINT "CareCase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CareCase CareCase_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CareCase"
    ADD CONSTRAINT "CareCase_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CareCase CareCase_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CareCase"
    ADD CONSTRAINT "CareCase_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CareCase CareCase_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CareCase"
    ADD CONSTRAINT "CareCase_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CareLog CareLog_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CareLog"
    ADD CONSTRAINT "CareLog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CareLog CareLog_careCaseId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CareLog"
    ADD CONSTRAINT "CareLog_careCaseId_fkey" FOREIGN KEY ("careCaseId") REFERENCES public."CareCase"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CareLog CareLog_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CareLog"
    ADD CONSTRAINT "CareLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: CareLog CareLog_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CareLog"
    ADD CONSTRAINT "CareLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CareNote CareNote_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CareNote"
    ADD CONSTRAINT "CareNote_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CareNote CareNote_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CareNote"
    ADD CONSTRAINT "CareNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommunicationCampaign CommunicationCampaign_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunicationCampaign"
    ADD CONSTRAINT "CommunicationCampaign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommunicationDelivery CommunicationDelivery_campaignId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunicationDelivery"
    ADD CONSTRAINT "CommunicationDelivery_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES public."CommunicationCampaign"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommunicationDelivery CommunicationDelivery_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunicationDelivery"
    ADD CONSTRAINT "CommunicationDelivery_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CommunicationLog CommunicationLog_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CommunicationLog"
    ADD CONSTRAINT "CommunicationLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Contact Contact_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Contact"
    ADD CONSTRAINT "Contact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: CostCenter CostCenter_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CostCenter"
    ADD CONSTRAINT "CostCenter_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Document Document_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Donation Donation_campaignId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Donation"
    ADD CONSTRAINT "Donation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES public."Campaign"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Donation Donation_donorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Donation"
    ADD CONSTRAINT "Donation_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Donation Donation_eventId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Donation"
    ADD CONSTRAINT "Donation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES public."Event"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Donation Donation_feeVoucherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Donation"
    ADD CONSTRAINT "Donation_feeVoucherId_fkey" FOREIGN KEY ("feeVoucherId") REFERENCES public."Voucher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Donation Donation_fundId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Donation"
    ADD CONSTRAINT "Donation_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES public."Fund"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Donation Donation_gatewayPaymentOrderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Donation"
    ADD CONSTRAINT "Donation_gatewayPaymentOrderId_fkey" FOREIGN KEY ("gatewayPaymentOrderId") REFERENCES public."GatewayPaymentOrder"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Donation Donation_gatewaySettlementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Donation"
    ADD CONSTRAINT "Donation_gatewaySettlementId_fkey" FOREIGN KEY ("gatewaySettlementId") REFERENCES public."GatewaySettlement"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Donation Donation_reversalVoucherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Donation"
    ADD CONSTRAINT "Donation_reversalVoucherId_fkey" FOREIGN KEY ("reversalVoucherId") REFERENCES public."Voucher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Donation Donation_serviceCollectionSessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Donation"
    ADD CONSTRAINT "Donation_serviceCollectionSessionId_fkey" FOREIGN KEY ("serviceCollectionSessionId") REFERENCES public."ServiceCollectionSession"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Donation Donation_settlementVoucherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Donation"
    ADD CONSTRAINT "Donation_settlementVoucherId_fkey" FOREIGN KEY ("settlementVoucherId") REFERENCES public."Voucher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Donation Donation_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Donation"
    ADD CONSTRAINT "Donation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Donation Donation_voucherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Donation"
    ADD CONSTRAINT "Donation_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES public."Voucher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EmploymentProfile EmploymentProfile_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmploymentProfile"
    ADD CONSTRAINT "EmploymentProfile_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EmploymentProfile EmploymentProfile_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmploymentProfile"
    ADD CONSTRAINT "EmploymentProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EventLog EventLog_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EventLog"
    ADD CONSTRAINT "EventLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Event Event_campusId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES public."Campus"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Event Event_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Event"
    ADD CONSTRAINT "Event_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ExportLog ExportLog_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExportLog"
    ADD CONSTRAINT "ExportLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Family Family_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Family"
    ADD CONSTRAINT "Family_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FinancialAuditLog FinancialAuditLog_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FinancialAuditLog"
    ADD CONSTRAINT "FinancialAuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FinancialPeriod FinancialPeriod_financialYearId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FinancialPeriod"
    ADD CONSTRAINT "FinancialPeriod_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES public."FinancialYear"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FinancialReceipt FinancialReceipt_campaignId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FinancialReceipt"
    ADD CONSTRAINT "FinancialReceipt_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES public."Campaign"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FinancialReceipt FinancialReceipt_donationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FinancialReceipt"
    ADD CONSTRAINT "FinancialReceipt_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES public."Donation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FinancialReceipt FinancialReceipt_fundId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FinancialReceipt"
    ADD CONSTRAINT "FinancialReceipt_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES public."Fund"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FinancialReceipt FinancialReceipt_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FinancialReceipt"
    ADD CONSTRAINT "FinancialReceipt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: FinancialReceipt FinancialReceipt_voucherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FinancialReceipt"
    ADD CONSTRAINT "FinancialReceipt_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES public."Voucher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FinancialYear FinancialYear_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FinancialYear"
    ADD CONSTRAINT "FinancialYear_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Fund Fund_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Fund"
    ADD CONSTRAINT "Fund_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GatewayPaymentOrder GatewayPaymentOrder_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GatewayPaymentOrder"
    ADD CONSTRAINT "GatewayPaymentOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GatewaySettlementLine GatewaySettlementLine_donationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GatewaySettlementLine"
    ADD CONSTRAINT "GatewaySettlementLine_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES public."Donation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: GatewaySettlementLine GatewaySettlementLine_settlementId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GatewaySettlementLine"
    ADD CONSTRAINT "GatewaySettlementLine_settlementId_fkey" FOREIGN KEY ("settlementId") REFERENCES public."GatewaySettlement"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GatewaySettlement GatewaySettlement_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GatewaySettlement"
    ADD CONSTRAINT "GatewaySettlement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: IdempotencyKey IdempotencyKey_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."IdempotencyKey"
    ADD CONSTRAINT "IdempotencyKey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JournalEntry JournalEntry_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JournalEntry"
    ADD CONSTRAINT "JournalEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: JournalEntry JournalEntry_costCenterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JournalEntry"
    ADD CONSTRAINT "JournalEntry_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES public."CostCenter"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: JournalEntry JournalEntry_fundId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JournalEntry"
    ADD CONSTRAINT "JournalEntry_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES public."Fund"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: JournalEntry JournalEntry_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JournalEntry"
    ADD CONSTRAINT "JournalEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: JournalEntry JournalEntry_voucherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JournalEntry"
    ADD CONSTRAINT "JournalEntry_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES public."Voucher"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeaveBalance LeaveBalance_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveBalance"
    ADD CONSTRAINT "LeaveBalance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeaveBalance LeaveBalance_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveBalance"
    ADD CONSTRAINT "LeaveBalance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeaveRequest LeaveRequest_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveRequest"
    ADD CONSTRAINT "LeaveRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LeaveRequest LeaveRequest_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveRequest"
    ADD CONSTRAINT "LeaveRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MemberDocument MemberDocument_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MemberDocument"
    ADD CONSTRAINT "MemberDocument_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MemberEngagementSnapshot MemberEngagementSnapshot_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MemberEngagementSnapshot"
    ADD CONSTRAINT "MemberEngagementSnapshot_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MemberEngagementSnapshot MemberEngagementSnapshot_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MemberEngagementSnapshot"
    ADD CONSTRAINT "MemberEngagementSnapshot_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MemberPathwayProgress MemberPathwayProgress_assignedMentorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MemberPathwayProgress"
    ADD CONSTRAINT "MemberPathwayProgress_assignedMentorId_fkey" FOREIGN KEY ("assignedMentorId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MemberPathwayProgress MemberPathwayProgress_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MemberPathwayProgress"
    ADD CONSTRAINT "MemberPathwayProgress_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MemberPathwayProgress MemberPathwayProgress_pathwayId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MemberPathwayProgress"
    ADD CONSTRAINT "MemberPathwayProgress_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES public."Pathway"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MemberPathwayProgress MemberPathwayProgress_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MemberPathwayProgress"
    ADD CONSTRAINT "MemberPathwayProgress_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MemberResponsibility MemberResponsibility_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."MemberResponsibility"
    ADD CONSTRAINT "MemberResponsibility_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Member Member_familyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Member"
    ADD CONSTRAINT "Member_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES public."Family"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Member Member_reportingManagerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Member"
    ADD CONSTRAINT "Member_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Member Member_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Member"
    ADD CONSTRAINT "Member_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Mentorship Mentorship_discipleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Mentorship"
    ADD CONSTRAINT "Mentorship_discipleId_fkey" FOREIGN KEY ("discipleId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Mentorship Mentorship_mentorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Mentorship"
    ADD CONSTRAINT "Mentorship_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Mentorship Mentorship_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Mentorship"
    ADD CONSTRAINT "Mentorship_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ministry Ministry_campusId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ministry"
    ADD CONSTRAINT "Ministry_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES public."Campus"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ministry Ministry_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Ministry"
    ADD CONSTRAINT "Ministry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Notification Notification_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OnboardingTask OnboardingTask_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OnboardingTask"
    ADD CONSTRAINT "OnboardingTask_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OnboardingTask OnboardingTask_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OnboardingTask"
    ADD CONSTRAINT "OnboardingTask_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OperationalDigest OperationalDigest_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OperationalDigest"
    ADD CONSTRAINT "OperationalDigest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OutreachFollowUp OutreachFollowUp_contactId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OutreachFollowUp"
    ADD CONSTRAINT "OutreachFollowUp_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES public."Contact"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: OutreachFollowUp OutreachFollowUp_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OutreachFollowUp"
    ADD CONSTRAINT "OutreachFollowUp_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PageData PageData_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PageData"
    ADD CONSTRAINT "PageData_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PathwayStep PathwayStep_pathwayId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PathwayStep"
    ADD CONSTRAINT "PathwayStep_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES public."Pathway"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PathwayStep PathwayStep_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PathwayStep"
    ADD CONSTRAINT "PathwayStep_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Pathway Pathway_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Pathway"
    ADD CONSTRAINT "Pathway_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PayableBill PayableBill_billVoucherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayableBill"
    ADD CONSTRAINT "PayableBill_billVoucherId_fkey" FOREIGN KEY ("billVoucherId") REFERENCES public."Voucher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PayableBill PayableBill_costCenterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayableBill"
    ADD CONSTRAINT "PayableBill_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES public."CostCenter"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PayableBill PayableBill_fundId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayableBill"
    ADD CONSTRAINT "PayableBill_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES public."Fund"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PayableBill PayableBill_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayableBill"
    ADD CONSTRAINT "PayableBill_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PayableBill PayableBill_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayableBill"
    ADD CONSTRAINT "PayableBill_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public."Vendor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PayablePayment PayablePayment_billId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayablePayment"
    ADD CONSTRAINT "PayablePayment_billId_fkey" FOREIGN KEY ("billId") REFERENCES public."PayableBill"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PayablePayment PayablePayment_costCenterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayablePayment"
    ADD CONSTRAINT "PayablePayment_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES public."CostCenter"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PayablePayment PayablePayment_fundId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayablePayment"
    ADD CONSTRAINT "PayablePayment_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES public."Fund"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PayablePayment PayablePayment_paymentVoucherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayablePayment"
    ADD CONSTRAINT "PayablePayment_paymentVoucherId_fkey" FOREIGN KEY ("paymentVoucherId") REFERENCES public."Voucher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PayablePayment PayablePayment_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayablePayment"
    ADD CONSTRAINT "PayablePayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PayablePayment PayablePayment_vendorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayablePayment"
    ADD CONSTRAINT "PayablePayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES public."Vendor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PayrollLine PayrollLine_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayrollLine"
    ADD CONSTRAINT "PayrollLine_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PayrollLine PayrollLine_runId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayrollLine"
    ADD CONSTRAINT "PayrollLine_runId_fkey" FOREIGN KEY ("runId") REFERENCES public."PayrollRun"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PayrollLine PayrollLine_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayrollLine"
    ADD CONSTRAINT "PayrollLine_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PayrollRun PayrollRun_payableVoucherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayrollRun"
    ADD CONSTRAINT "PayrollRun_payableVoucherId_fkey" FOREIGN KEY ("payableVoucherId") REFERENCES public."Voucher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PayrollRun PayrollRun_paymentVoucherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayrollRun"
    ADD CONSTRAINT "PayrollRun_paymentVoucherId_fkey" FOREIGN KEY ("paymentVoucherId") REFERENCES public."Voucher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PayrollRun PayrollRun_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayrollRun"
    ADD CONSTRAINT "PayrollRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PayrollStructure PayrollStructure_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayrollStructure"
    ADD CONSTRAINT "PayrollStructure_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PayrollStructure PayrollStructure_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PayrollStructure"
    ADD CONSTRAINT "PayrollStructure_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PerformanceReview PerformanceReview_revieweeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PerformanceReview"
    ADD CONSTRAINT "PerformanceReview_revieweeId_fkey" FOREIGN KEY ("revieweeId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PerformanceReview PerformanceReview_reviewerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PerformanceReview"
    ADD CONSTRAINT "PerformanceReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PerformanceReview PerformanceReview_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PerformanceReview"
    ADD CONSTRAINT "PerformanceReview_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PrayerRequest PrayerRequest_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PrayerRequest"
    ADD CONSTRAINT "PrayerRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PrayerRequest PrayerRequest_requesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PrayerRequest"
    ADD CONSTRAINT "PrayerRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PrayerRequest PrayerRequest_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PrayerRequest"
    ADD CONSTRAINT "PrayerRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProcessedCashfreeEvent ProcessedCashfreeEvent_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProcessedCashfreeEvent"
    ADD CONSTRAINT "ProcessedCashfreeEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProcessedRazorpayEvent ProcessedRazorpayEvent_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProcessedRazorpayEvent"
    ADD CONSTRAINT "ProcessedRazorpayEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReceiptFySequence ReceiptFySequence_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReceiptFySequence"
    ADD CONSTRAINT "ReceiptFySequence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RecruitmentPipeline RecruitmentPipeline_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RecruitmentPipeline"
    ADD CONSTRAINT "RecruitmentPipeline_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Region Region_campusId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Region"
    ADD CONSTRAINT "Region_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES public."Campus"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Region Region_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Region"
    ADD CONSTRAINT "Region_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReimbursementRequest ReimbursementRequest_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReimbursementRequest"
    ADD CONSTRAINT "ReimbursementRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ReimbursementRequest ReimbursementRequest_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ReimbursementRequest"
    ADD CONSTRAINT "ReimbursementRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public."Permission"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Role Role_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Sermon Sermon_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sermon"
    ADD CONSTRAINT "Sermon_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ServiceCollectionSession ServiceCollectionSession_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ServiceCollectionSession"
    ADD CONSTRAINT "ServiceCollectionSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Setting Setting_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Setting"
    ADD CONSTRAINT "Setting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SmallGroupMember SmallGroupMember_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SmallGroupMember"
    ADD CONSTRAINT "SmallGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."SmallGroup"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SmallGroupMember SmallGroupMember_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SmallGroupMember"
    ADD CONSTRAINT "SmallGroupMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SmallGroupMember SmallGroupMember_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SmallGroupMember"
    ADD CONSTRAINT "SmallGroupMember_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SmallGroup SmallGroup_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SmallGroup"
    ADD CONSTRAINT "SmallGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SmallGroup SmallGroup_zoneId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SmallGroup"
    ADD CONSTRAINT "SmallGroup_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES public."Zone"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SpiritualMilestone SpiritualMilestone_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SpiritualMilestone"
    ADD CONSTRAINT "SpiritualMilestone_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StaffDocument StaffDocument_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StaffDocument"
    ADD CONSTRAINT "StaffDocument_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StaffDocument StaffDocument_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StaffDocument"
    ADD CONSTRAINT "StaffDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Task Task_assignedMemberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_assignedMemberId_fkey" FOREIGN KEY ("assignedMemberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_assignedUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Task Task_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TrainingRecord TrainingRecord_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TrainingRecord"
    ADD CONSTRAINT "TrainingRecord_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: TrainingRecord TrainingRecord_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TrainingRecord"
    ADD CONSTRAINT "TrainingRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: User User_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Vendor Vendor_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Vendor"
    ADD CONSTRAINT "Vendor_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VoucherAttachment VoucherAttachment_documentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoucherAttachment"
    ADD CONSTRAINT "VoucherAttachment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES public."Document"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VoucherAttachment VoucherAttachment_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoucherAttachment"
    ADD CONSTRAINT "VoucherAttachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VoucherAttachment VoucherAttachment_voucherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoucherAttachment"
    ADD CONSTRAINT "VoucherAttachment_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES public."Voucher"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: VoucherFySequence VoucherFySequence_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VoucherFySequence"
    ADD CONSTRAINT "VoucherFySequence_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Voucher Voucher_approvedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Voucher"
    ADD CONSTRAINT "Voucher_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Voucher Voucher_postedByUserId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Voucher"
    ADD CONSTRAINT "Voucher_postedByUserId_fkey" FOREIGN KEY ("postedByUserId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Voucher Voucher_reversesVoucherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Voucher"
    ADD CONSTRAINT "Voucher_reversesVoucherId_fkey" FOREIGN KEY ("reversesVoucherId") REFERENCES public."Voucher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Voucher Voucher_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Voucher"
    ADD CONSTRAINT "Voucher_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: YearCloseRun YearCloseRun_closingVoucherId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."YearCloseRun"
    ADD CONSTRAINT "YearCloseRun_closingVoucherId_fkey" FOREIGN KEY ("closingVoucherId") REFERENCES public."Voucher"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: YearCloseRun YearCloseRun_financialYearId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."YearCloseRun"
    ADD CONSTRAINT "YearCloseRun_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES public."FinancialYear"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: YearCloseRun YearCloseRun_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."YearCloseRun"
    ADD CONSTRAINT "YearCloseRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Zone Zone_regionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Zone"
    ADD CONSTRAINT "Zone_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES public."Region"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Zone Zone_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Zone"
    ADD CONSTRAINT "Zone_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict Etk7NjNJQfwW7wfFav1pRfsbJfNzrJhUUbc3zOGMPNDkWNVdiv3ENsaRpG4Ya8M

