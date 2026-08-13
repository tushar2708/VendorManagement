-- CreateEnum
CREATE TYPE "UserTier" AS ENUM ('EXECUTIVE', 'LEADERSHIP');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'VENDOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('PRODUCTION_PART', 'INDIRECT_SERVICES');

-- CreateEnum
CREATE TYPE "RequestProcess" AS ENUM ('RFQ', 'NOMINATION', 'DIRECT');

-- CreateEnum
CREATE TYPE "CandidateSource" AS ENUM ('MANUAL', 'DIRECTORY');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'INVITED', 'OPENED', 'REGISTERED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ApprovalStage" AS ENUM ('FINANCIAL_CRIME', 'COMPLIANCE', 'LEGAL', 'IT_INFOSEC', 'TAX', 'PROCUREMENT', 'DATA_PRIVACY', 'BUSINESS_OWNER');

-- CreateEnum
CREATE TYPE "SlaRisk" AS ENUM ('ON_TRACK', 'AT_RISK', 'OVERDUE');

-- CreateEnum
CREATE TYPE "RequirementStage" AS ENUM ('DRAFT', 'CANDIDATES_SELECTED', 'INVITES_SENT', 'IN_PROGRESS', 'CLOSED');

-- CreateEnum
CREATE TYPE "LinkState" AS ENUM ('INVITED', 'PREQUAL_IN_PROGRESS', 'PREQUAL_SUBMITTED', 'PREQUAL_UNDER_REVIEW', 'PREQUAL_CLEARED', 'AWARDED', 'FULL_IN_PROGRESS', 'FULL_SUBMITTED', 'FULL_UNDER_REVIEW', 'CONTRACTS_IN_PROGRESS', 'APPROVED', 'ERP_SYNCING', 'ONBOARDED', 'REJECTED', 'ON_HOLD', 'WITHDRAWN', 'ERP_FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LinkStage" AS ENUM ('PREQUAL', 'FULL');

-- CreateEnum
CREATE TYPE "ActorSide" AS ENUM ('VENDOR', 'BUYER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PartySide" AS ENUM ('VENDOR', 'BUYER');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('NDA', 'MSA', 'QUALITY_AGREEMENT', 'SUPPLY_AGREEMENT', 'PRICING_AGREEMENT', 'DATA_PROCESSING');

-- CreateEnum
CREATE TYPE "ContractState" AS ENUM ('DRAFT_PENDING', 'DRAFT_UPLOADED', 'VENDOR_REVIEW', 'CHANGES_REQUESTED', 'REVISED', 'AGREED', 'AWAITING_SIGNATURES', 'PARTIALLY_EXECUTED', 'EXECUTED');

-- CreateEnum
CREATE TYPE "ContractVersionKind" AS ENUM ('DRAFT', 'REVISED', 'VENDOR_SIGNED', 'BUYER_SIGNED');

-- CreateEnum
CREATE TYPE "ReviewTaskStatus" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "ApprovalDecisionType" AS ENUM ('APPROVED', 'CHANGES_REQUESTED');

-- CreateEnum
CREATE TYPE "BuyerRole" AS ENUM ('OWNER', 'QUALITY', 'FINANCE', 'TAX', 'LEGAL');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('RUNNING', 'PASSED', 'FAILED', 'NEEDS_REVIEW', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationCheckType" AS ENUM ('PAN', 'GST', 'UDYAM', 'PENNY_DROP', 'GST_FILINGS');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BadgeState" AS ENUM ('VERIFIED', 'LISTED', 'STALE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'BUYER',
    "tier" "UserTier" NOT NULL DEFAULT 'EXECUTIVE',
    "buyerOrgId" TEXT,
    "vendorOrgId" TEXT,
    "buyerRole" "BuyerRole",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerOrg" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "gstId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerOrg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorOrg" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "pan" TEXT,
    "gstin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorOrg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectoryVendor" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "pan" TEXT,
    "primaryGstin" TEXT,
    "city" TEXT,
    "state" TEXT,
    "processTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "certificationTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "badgeState" "BadgeState" NOT NULL DEFAULT 'LISTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectoryVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "stage" "RequirementStage" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "category" TEXT NOT NULL,
    "process" "RequestProcess" NOT NULL,
    "vendorType" "VendorType" NOT NULL,
    "businessJustification" TEXT,
    "notes" TEXT,
    "processCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "plantLocation" TEXT,
    "targetAwardDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "buyerOrgId" TEXT NOT NULL,

    CONSTRAINT "VendorRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestCandidate" (
    "id" TEXT NOT NULL,
    "source" "CandidateSource" NOT NULL DEFAULT 'DIRECTORY',
    "legalName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "pan" TEXT,
    "gstin" TEXT,
    "city" TEXT,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requestId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "buyerOrgId" TEXT NOT NULL,

    CONSTRAINT "RequestCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorInvitation" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "tokenHash" TEXT,
    "magicTokenPlain" TEXT,
    "email" TEXT,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "remindersSent" INTEGER NOT NULL DEFAULT 0,
    "lastReminderAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "registeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requestId" TEXT NOT NULL,
    "buyerOrgId" TEXT NOT NULL,

    CONSTRAINT "VendorInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorBuyerLink" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "buyerOrgId" TEXT NOT NULL,
    "vendorUserId" TEXT,
    "vendorOrgId" TEXT,
    "state" "LinkState" NOT NULL DEFAULT 'INVITED',
    "stage" "LinkStage",
    "prequalScore" INTEGER,
    "awardedAt" TIMESTAMP(3),
    "onboardedAt" TIMESTAMP(3),
    "erpVendorCode" TEXT,
    "currentStateSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorBuyerLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkEvent" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "fromState" "LinkState",
    "toState" "LinkState" NOT NULL,
    "actorType" "ActorSide" NOT NULL,
    "actorId" TEXT,
    "side" "ActorSide" NOT NULL,
    "note" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LinkEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "stage" "LinkStage" NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "submittedAt" TIMESTAMP(3),
    "resolvedChecklist" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldValue" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "value" TEXT,
    "source" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileBlob" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "sha256" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileBlob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCheck" (
    "id" TEXT NOT NULL,
    "checkType" "VerificationCheckType" NOT NULL,
    "subjectValue" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'RUNNING',
    "matchScore" INTEGER,
    "detail" JSONB,
    "ranAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "linkId" TEXT NOT NULL,

    CONSTRAINT "VerificationCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "checklistItemKey" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rejectionReason" TEXT,
    "submissionId" TEXT,
    "linkId" TEXT NOT NULL,
    "fileBlobId" TEXT NOT NULL,
    "supersedesDocumentId" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlaRule" (
    "id" TEXT NOT NULL,
    "stage" "ApprovalStage" NOT NULL,
    "slaDays" INTEGER NOT NULL,
    "escalateAfterBreach" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SlaRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "state" "ContractState" NOT NULL DEFAULT 'DRAFT_PENDING',
    "currentVersionId" TEXT,
    "linkId" TEXT NOT NULL,
    "dispatchedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractVersion" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "fileBlobId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedBySide" "PartySide" NOT NULL,
    "kind" "ContractVersionKind" NOT NULL,
    "supersedesVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractComment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorSide" "PartySide" NOT NULL,
    "contractVersionId" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "fileBlobId" TEXT,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractId" TEXT NOT NULL,

    CONSTRAINT "ContractComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewTask" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "stage" "ApprovalStage" NOT NULL,
    "assignedUserId" TEXT,
    "status" "ReviewTaskStatus" NOT NULL DEFAULT 'PENDING',
    "slaHours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalDecision" (
    "id" TEXT NOT NULL,
    "reviewTaskId" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "decision" "ApprovalDecisionType" NOT NULL,
    "comment" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoringCriterion" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requirementId" TEXT NOT NULL,

    CONSTRAINT "ScoringCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_buyerOrgId_idx" ON "User"("buyerOrgId");

-- CreateIndex
CREATE INDEX "User_vendorOrgId_idx" ON "User"("vendorOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- CreateIndex
CREATE INDEX "BuyerOrg_gstId_idx" ON "BuyerOrg"("gstId");

-- CreateIndex
CREATE UNIQUE INDEX "DirectoryVendor_contactEmail_key" ON "DirectoryVendor"("contactEmail");

-- CreateIndex
CREATE INDEX "DirectoryVendor_contactEmail_idx" ON "DirectoryVendor"("contactEmail");

-- CreateIndex
CREATE INDEX "DirectoryVendor_primaryGstin_idx" ON "DirectoryVendor"("primaryGstin");

-- CreateIndex
CREATE UNIQUE INDEX "VendorRequest_requestNumber_key" ON "VendorRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "VendorRequest_createdById_idx" ON "VendorRequest"("createdById");

-- CreateIndex
CREATE INDEX "VendorRequest_stage_idx" ON "VendorRequest"("stage");

-- CreateIndex
CREATE INDEX "VendorRequest_requestNumber_idx" ON "VendorRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "VendorRequest_buyerOrgId_idx" ON "VendorRequest"("buyerOrgId");

-- CreateIndex
CREATE INDEX "RequestCandidate_requestId_idx" ON "RequestCandidate"("requestId");

-- CreateIndex
CREATE INDEX "RequestCandidate_vendorId_idx" ON "RequestCandidate"("vendorId");

-- CreateIndex
CREATE INDEX "RequestCandidate_buyerOrgId_idx" ON "RequestCandidate"("buyerOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestCandidate_requestId_vendorId_key" ON "RequestCandidate"("requestId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorInvitation_token_key" ON "VendorInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VendorInvitation_tokenHash_key" ON "VendorInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "VendorInvitation_token_idx" ON "VendorInvitation"("token");

-- CreateIndex
CREATE INDEX "VendorInvitation_tokenHash_idx" ON "VendorInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "VendorInvitation_requestId_idx" ON "VendorInvitation"("requestId");

-- CreateIndex
CREATE INDEX "VendorInvitation_buyerOrgId_idx" ON "VendorInvitation"("buyerOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorBuyerLink_candidateId_key" ON "VendorBuyerLink"("candidateId");

-- CreateIndex
CREATE INDEX "VendorBuyerLink_requestId_idx" ON "VendorBuyerLink"("requestId");

-- CreateIndex
CREATE INDEX "VendorBuyerLink_buyerOrgId_idx" ON "VendorBuyerLink"("buyerOrgId");

-- CreateIndex
CREATE INDEX "VendorBuyerLink_vendorUserId_idx" ON "VendorBuyerLink"("vendorUserId");

-- CreateIndex
CREATE INDEX "LinkEvent_linkId_idx" ON "LinkEvent"("linkId");

-- CreateIndex
CREATE INDEX "Submission_linkId_idx" ON "Submission"("linkId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_linkId_stage_key" ON "Submission"("linkId", "stage");

-- CreateIndex
CREATE INDEX "FieldValue_linkId_idx" ON "FieldValue"("linkId");

-- CreateIndex
CREATE INDEX "FieldValue_submissionId_idx" ON "FieldValue"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "FieldValue_submissionId_fieldKey_key" ON "FieldValue"("submissionId", "fieldKey");

-- CreateIndex
CREATE INDEX "VerificationCheck_linkId_idx" ON "VerificationCheck"("linkId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationCheck_linkId_checkType_key" ON "VerificationCheck"("linkId", "checkType");

-- CreateIndex
CREATE UNIQUE INDEX "Document_supersedesDocumentId_key" ON "Document"("supersedesDocumentId");

-- CreateIndex
CREATE INDEX "Document_linkId_idx" ON "Document"("linkId");

-- CreateIndex
CREATE INDEX "Document_fileBlobId_idx" ON "Document"("fileBlobId");

-- CreateIndex
CREATE INDEX "Document_checklistItemKey_idx" ON "Document"("checklistItemKey");

-- CreateIndex
CREATE UNIQUE INDEX "SlaRule_stage_key" ON "SlaRule"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_currentVersionId_key" ON "Contract"("currentVersionId");

-- CreateIndex
CREATE INDEX "Contract_linkId_idx" ON "Contract"("linkId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_linkId_contractType_key" ON "Contract"("linkId", "contractType");

-- CreateIndex
CREATE UNIQUE INDEX "ContractVersion_supersedesVersionId_key" ON "ContractVersion"("supersedesVersionId");

-- CreateIndex
CREATE INDEX "ContractVersion_contractId_idx" ON "ContractVersion"("contractId");

-- CreateIndex
CREATE INDEX "ContractVersion_linkId_idx" ON "ContractVersion"("linkId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractVersion_contractId_versionNo_key" ON "ContractVersion"("contractId", "versionNo");

-- CreateIndex
CREATE INDEX "ContractComment_linkId_idx" ON "ContractComment"("linkId");

-- CreateIndex
CREATE INDEX "ContractComment_contractVersionId_idx" ON "ContractComment"("contractVersionId");

-- CreateIndex
CREATE INDEX "ReviewTask_linkId_idx" ON "ReviewTask"("linkId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewTask_linkId_stage_key" ON "ReviewTask"("linkId", "stage");

-- CreateIndex
CREATE INDEX "ApprovalDecision_linkId_idx" ON "ApprovalDecision"("linkId");

-- CreateIndex
CREATE INDEX "ApprovalDecision_reviewTaskId_idx" ON "ApprovalDecision"("reviewTaskId");

-- CreateIndex
CREATE INDEX "ScoringCriterion_requirementId_idx" ON "ScoringCriterion"("requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoringCriterion_requirementId_name_key" ON "ScoringCriterion"("requirementId", "name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_buyerOrgId_fkey" FOREIGN KEY ("buyerOrgId") REFERENCES "BuyerOrg"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_vendorOrgId_fkey" FOREIGN KEY ("vendorOrgId") REFERENCES "VendorOrg"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRequest" ADD CONSTRAINT "VendorRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRequest" ADD CONSTRAINT "VendorRequest_buyerOrgId_fkey" FOREIGN KEY ("buyerOrgId") REFERENCES "BuyerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestCandidate" ADD CONSTRAINT "RequestCandidate_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VendorRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestCandidate" ADD CONSTRAINT "RequestCandidate_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "DirectoryVendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestCandidate" ADD CONSTRAINT "RequestCandidate_buyerOrgId_fkey" FOREIGN KEY ("buyerOrgId") REFERENCES "BuyerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorInvitation" ADD CONSTRAINT "VendorInvitation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VendorRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorInvitation" ADD CONSTRAINT "VendorInvitation_buyerOrgId_fkey" FOREIGN KEY ("buyerOrgId") REFERENCES "BuyerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBuyerLink" ADD CONSTRAINT "VendorBuyerLink_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "RequestCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBuyerLink" ADD CONSTRAINT "VendorBuyerLink_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VendorRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBuyerLink" ADD CONSTRAINT "VendorBuyerLink_buyerOrgId_fkey" FOREIGN KEY ("buyerOrgId") REFERENCES "BuyerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBuyerLink" ADD CONSTRAINT "VendorBuyerLink_vendorUserId_fkey" FOREIGN KEY ("vendorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorBuyerLink" ADD CONSTRAINT "VendorBuyerLink_vendorOrgId_fkey" FOREIGN KEY ("vendorOrgId") REFERENCES "VendorOrg"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkEvent" ADD CONSTRAINT "LinkEvent_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "VendorBuyerLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "VendorBuyerLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldValue" ADD CONSTRAINT "FieldValue_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldValue" ADD CONSTRAINT "FieldValue_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "VendorBuyerLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCheck" ADD CONSTRAINT "VerificationCheck_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "VendorBuyerLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "VendorBuyerLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_fileBlobId_fkey" FOREIGN KEY ("fileBlobId") REFERENCES "FileBlob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_supersedesDocumentId_fkey" FOREIGN KEY ("supersedesDocumentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "ContractVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "VendorBuyerLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractVersion" ADD CONSTRAINT "ContractVersion_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractVersion" ADD CONSTRAINT "ContractVersion_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "VendorBuyerLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractVersion" ADD CONSTRAINT "ContractVersion_fileBlobId_fkey" FOREIGN KEY ("fileBlobId") REFERENCES "FileBlob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractVersion" ADD CONSTRAINT "ContractVersion_supersedesVersionId_fkey" FOREIGN KEY ("supersedesVersionId") REFERENCES "ContractVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractComment" ADD CONSTRAINT "ContractComment_contractVersionId_fkey" FOREIGN KEY ("contractVersionId") REFERENCES "ContractVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractComment" ADD CONSTRAINT "ContractComment_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "VendorBuyerLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractComment" ADD CONSTRAINT "ContractComment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractComment" ADD CONSTRAINT "ContractComment_fileBlobId_fkey" FOREIGN KEY ("fileBlobId") REFERENCES "FileBlob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewTask" ADD CONSTRAINT "ReviewTask_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "VendorBuyerLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewTask" ADD CONSTRAINT "ReviewTask_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_reviewTaskId_fkey" FOREIGN KEY ("reviewTaskId") REFERENCES "ReviewTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "VendorBuyerLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalDecision" ADD CONSTRAINT "ApprovalDecision_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoringCriterion" ADD CONSTRAINT "ScoringCriterion_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "VendorRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
