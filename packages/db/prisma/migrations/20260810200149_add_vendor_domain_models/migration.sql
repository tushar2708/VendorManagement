-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'VENDOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('PRODUCTION_PART', 'INDIRECT_SERVICES');

-- CreateEnum
CREATE TYPE "RequestProcess" AS ENUM ('RFQ', 'NOMINATION', 'DIRECT');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'CANDIDATES_SELECTED', 'INVITES_DISPATCHED', 'PREQUAL_IN_PROGRESS', 'PREQUAL_COMPLETE', 'AWARDED', 'FULL_PACK_SUBMITTED', 'DEEP_VERIFICATION', 'APPROVALS_IN_PROGRESS', 'CONTRACT_REVIEW', 'ERP_PUSH', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InviteChannel" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'OPENED', 'REGISTERED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('SELECTED', 'INVITED', 'PREQUAL_SUBMITTED', 'APPROVED', 'REJECTED', 'AWARDED', 'WARM_POOL');

-- CreateEnum
CREATE TYPE "VerificationCheckType" AS ENUM ('PAN', 'GSTIN', 'UDYAM', 'BANK_PENNY_DROP', 'COMPANY_FILINGS', 'DIRECTOR_UBO_SCREENING');

-- CreateEnum
CREATE TYPE "VerificationCheckStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'PASS', 'PARTIAL_MATCH', 'FAIL', 'MANUAL_OVERRIDE');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('BANK_DETAILS', 'STATUTORY', 'LEGAL', 'IDENTITY', 'CAPABILITY');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'UPLOADED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalStage" AS ENUM ('FINANCE', 'LEGAL', 'IT_SECURITY', 'QUALITY');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "SlaRisk" AS ENUM ('ON_TRACK', 'AT_RISK', 'OVERDUE');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'BUYER_REVIEW', 'VENDOR_REVIEW', 'AWAITING_BUYER_SIGNATURE', 'AWAITING_VENDOR_SIGNATURE', 'SIGNED', 'VOIDED');

-- CreateEnum
CREATE TYPE "ErpPushStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('REQUEST_CREATED', 'REQUEST_UPDATED', 'CANDIDATES_SELECTED', 'INVITES_DISPATCHED', 'INVITE_OPENED', 'VENDOR_REGISTERED', 'PREQUAL_SUBMITTED', 'VERIFICATION_STARTED', 'VERIFICATION_COMPLETED', 'PREQUAL_APPROVED', 'PREQUAL_REJECTED', 'VENDOR_AWARDED', 'WARM_POOL_ADDED', 'FULL_PACK_SUBMITTED', 'DOCUMENT_UPLOADED', 'DOCUMENT_VERIFIED', 'DEEP_VERIFICATION_STARTED', 'DEEP_VERIFICATION_COMPLETED', 'APPROVAL_SUBMITTED', 'APPROVAL_APPROVED', 'APPROVAL_REJECTED', 'APPROVAL_ESCALATED', 'CONTRACT_UPLOADED', 'CONTRACT_COMMENT_ADDED', 'CONTRACT_SIGNED', 'ERP_PUSH_INITIATED', 'ERP_PUSH_COMPLETED', 'REMINDER_SENT', 'ISSUE_FLAGGED', 'VENDOR_ACTIVATED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'BUYER';

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "vendorType" "VendorType",
    "panNumber" TEXT,
    "gstin" TEXT,
    "udyamNumber" TEXT,
    "vendorCode" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isInWarmPool" BOOLEAN NOT NULL DEFAULT false,
    "isInDirectory" BOOLEAN NOT NULL DEFAULT false,
    "prequalScore" INTEGER,
    "category" TEXT,
    "certifications" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'DRAFT',
    "category" TEXT NOT NULL,
    "process" "RequestProcess" NOT NULL,
    "vendorType" "VendorType" NOT NULL,
    "businessJustification" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "VendorRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestCandidate" (
    "id" TEXT NOT NULL,
    "status" "CandidateStatus" NOT NULL DEFAULT 'SELECTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requestId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,

    CONSTRAINT "RequestCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorInvitation" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "channel" "InviteChannel" NOT NULL DEFAULT 'EMAIL',
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "remindersSent" INTEGER NOT NULL DEFAULT 0,
    "lastReminderAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "registeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,

    CONSTRAINT "VendorInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCheck" (
    "id" TEXT NOT NULL,
    "type" "VerificationCheckType" NOT NULL,
    "status" "VerificationCheckStatus" NOT NULL DEFAULT 'PENDING',
    "matchScore" INTEGER,
    "rawResponse" TEXT,
    "notes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT NOT NULL,

    CONSTRAINT "VerificationCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT NOT NULL,

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
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "stage" "ApprovalStage" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "slaRisk" "SlaRisk" NOT NULL DEFAULT 'ON_TRACK',
    "enteredStageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT NOT NULL,
    "assignedToId" TEXT,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "documentData" TEXT,
    "documentName" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "buyerSignedAt" TIMESTAMP(3),
    "vendorSignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractComment" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contractId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "ContractComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpPushRecord" (
    "id" TEXT NOT NULL,
    "status" "ErpPushStatus" NOT NULL DEFAULT 'PENDING',
    "vendorCode" TEXT,
    "apiMethod" TEXT,
    "responsePayload" TEXT,
    "errorMessage" TEXT,
    "pushedAt" TIMESTAMP(3),
    "totalDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "vendorId" TEXT NOT NULL,

    CONSTRAINT "ErpPushRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" "ActivityAction" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestId" TEXT,
    "vendorId" TEXT,
    "userId" TEXT,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_contactEmail_key" ON "Vendor"("contactEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_vendorCode_key" ON "Vendor"("vendorCode");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_userId_key" ON "Vendor"("userId");

-- CreateIndex
CREATE INDEX "Vendor_contactEmail_idx" ON "Vendor"("contactEmail");

-- CreateIndex
CREATE INDEX "Vendor_vendorCode_idx" ON "Vendor"("vendorCode");

-- CreateIndex
CREATE UNIQUE INDEX "VendorRequest_requestNumber_key" ON "VendorRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "VendorRequest_createdById_idx" ON "VendorRequest"("createdById");

-- CreateIndex
CREATE INDEX "VendorRequest_status_idx" ON "VendorRequest"("status");

-- CreateIndex
CREATE INDEX "VendorRequest_requestNumber_idx" ON "VendorRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "RequestCandidate_requestId_idx" ON "RequestCandidate"("requestId");

-- CreateIndex
CREATE INDEX "RequestCandidate_vendorId_idx" ON "RequestCandidate"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestCandidate_requestId_vendorId_key" ON "RequestCandidate"("requestId", "vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "VendorInvitation_token_key" ON "VendorInvitation"("token");

-- CreateIndex
CREATE INDEX "VendorInvitation_token_idx" ON "VendorInvitation"("token");

-- CreateIndex
CREATE INDEX "VendorInvitation_vendorId_idx" ON "VendorInvitation"("vendorId");

-- CreateIndex
CREATE INDEX "VendorInvitation_requestId_idx" ON "VendorInvitation"("requestId");

-- CreateIndex
CREATE INDEX "VerificationCheck_vendorId_idx" ON "VerificationCheck"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationCheck_vendorId_type_key" ON "VerificationCheck"("vendorId", "type");

-- CreateIndex
CREATE INDEX "Document_vendorId_idx" ON "Document"("vendorId");

-- CreateIndex
CREATE INDEX "Document_category_idx" ON "Document"("category");

-- CreateIndex
CREATE UNIQUE INDEX "SlaRule_stage_key" ON "SlaRule"("stage");

-- CreateIndex
CREATE INDEX "Approval_vendorId_idx" ON "Approval"("vendorId");

-- CreateIndex
CREATE INDEX "Approval_assignedToId_idx" ON "Approval"("assignedToId");

-- CreateIndex
CREATE INDEX "Approval_status_idx" ON "Approval"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Approval_vendorId_stage_key" ON "Approval"("vendorId", "stage");

-- CreateIndex
CREATE INDEX "Contract_vendorId_idx" ON "Contract"("vendorId");

-- CreateIndex
CREATE INDEX "ContractComment_contractId_idx" ON "ContractComment"("contractId");

-- CreateIndex
CREATE INDEX "ErpPushRecord_vendorId_idx" ON "ErpPushRecord"("vendorId");

-- CreateIndex
CREATE INDEX "ActivityLog_requestId_idx" ON "ActivityLog"("requestId");

-- CreateIndex
CREATE INDEX "ActivityLog_vendorId_idx" ON "ActivityLog"("vendorId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRequest" ADD CONSTRAINT "VendorRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestCandidate" ADD CONSTRAINT "RequestCandidate_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VendorRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestCandidate" ADD CONSTRAINT "RequestCandidate_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorInvitation" ADD CONSTRAINT "VendorInvitation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorInvitation" ADD CONSTRAINT "VendorInvitation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VendorRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCheck" ADD CONSTRAINT "VerificationCheck_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractComment" ADD CONSTRAINT "ContractComment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractComment" ADD CONSTRAINT "ContractComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErpPushRecord" ADD CONSTRAINT "ErpPushRecord_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VendorRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
