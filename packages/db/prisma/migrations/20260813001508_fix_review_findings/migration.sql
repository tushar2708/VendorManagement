/*
  Warnings:

  - The values [UPLOADED,VERIFIED] on the enum `DocumentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [GSTIN,BANK_PENNY_DROP,COMPANY_FILINGS,DIRECTOR_UBO_SCREENING] on the enum `VerificationCheckType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `buyerSignedAt` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `documentData` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `documentName` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `mimeType` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `sizeBytes` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `vendorSignedAt` on the `Contract` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `ContractComment` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `ContractComment` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedAt` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `commercials` on the `RequestCandidate` table. All the data in the column will be lost.
  - You are about to drop the column `inviteStatus` on the `RequestCandidate` table. All the data in the column will be lost.
  - You are about to drop the column `isAwarded` on the `RequestCandidate` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `RequestCandidate` table. All the data in the column will be lost.
  - You are about to drop the column `scoreBreakdown` on the `RequestCandidate` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `RequestCandidate` table. All the data in the column will be lost.
  - You are about to drop the column `channel` on the `VendorInvitation` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `VendorInvitation` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `VendorRequest` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `VerificationCheck` table. All the data in the column will be lost.
  - You are about to drop the column `rawResponse` on the `VerificationCheck` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `VerificationCheck` table. All the data in the column will be lost.
  - You are about to drop the column `vendorId` on the `VerificationCheck` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedAt` on the `VerificationCheck` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedById` on the `VerificationCheck` table. All the data in the column will be lost.
  - The `status` column on the `VerificationCheck` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `ActivityLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Approval` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ErpPushRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Vendor` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[currentVersionId]` on the table `Contract` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[linkId,contractType]` on the table `Contract` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[supersedesDocumentId]` on the table `Document` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[linkId,checkType]` on the table `VerificationCheck` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `contractType` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `linkId` to the `Contract` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorSide` to the `ContractComment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `body` to the `ContractComment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contractVersionId` to the `ContractComment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `linkId` to the `ContractComment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileBlobId` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileName` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `linkId` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyerOrgId` to the `RequestCandidate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyerOrgId` to the `VendorInvitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyerOrgId` to the `VendorRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `checkType` to the `VerificationCheck` table without a default value. This is not possible if the table is not empty.
  - Added the required column `linkId` to the `VerificationCheck` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectValue` to the `VerificationCheck` table without a default value. This is not possible if the table is not empty.

*/
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
CREATE TYPE "BadgeState" AS ENUM ('VERIFIED', 'LISTED', 'STALE');

-- AlterEnum
BEGIN;
CREATE TYPE "DocumentStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');
ALTER TABLE "public"."Document" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Document" ALTER COLUMN "status" TYPE "DocumentStatus_new" USING ("status"::text::"DocumentStatus_new");
ALTER TYPE "DocumentStatus" RENAME TO "DocumentStatus_old";
ALTER TYPE "DocumentStatus_new" RENAME TO "DocumentStatus";
DROP TYPE "public"."DocumentStatus_old";
ALTER TABLE "Document" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "VerificationCheckType_new" AS ENUM ('PAN', 'GST', 'UDYAM', 'PENNY_DROP', 'GST_FILINGS');
ALTER TABLE "VerificationCheck" ALTER COLUMN "checkType" TYPE "VerificationCheckType_new" USING ("checkType"::text::"VerificationCheckType_new");
ALTER TYPE "VerificationCheckType" RENAME TO "VerificationCheckType_old";
ALTER TYPE "VerificationCheckType_new" RENAME TO "VerificationCheckType";
DROP TYPE "public"."VerificationCheckType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_requestId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "Approval" DROP CONSTRAINT "Approval_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "Approval" DROP CONSTRAINT "Approval_requestId_fkey";

-- DropForeignKey
ALTER TABLE "Approval" DROP CONSTRAINT "Approval_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "Contract" DROP CONSTRAINT "Contract_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "ContractComment" DROP CONSTRAINT "ContractComment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "ErpPushRecord" DROP CONSTRAINT "ErpPushRecord_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "RequestCandidate" DROP CONSTRAINT "RequestCandidate_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "Vendor" DROP CONSTRAINT "Vendor_userId_fkey";

-- DropForeignKey
ALTER TABLE "VendorInvitation" DROP CONSTRAINT "VendorInvitation_vendorId_fkey";

-- DropForeignKey
ALTER TABLE "VerificationCheck" DROP CONSTRAINT "VerificationCheck_vendorId_fkey";

-- DropIndex
DROP INDEX "Contract_vendorId_idx";

-- DropIndex
DROP INDEX "ContractComment_contractId_idx";

-- DropIndex
DROP INDEX "Document_category_idx";

-- DropIndex
DROP INDEX "Document_vendorId_idx";

-- DropIndex
DROP INDEX "VendorInvitation_vendorId_idx";

-- DropIndex
DROP INDEX "VendorRequest_status_idx";

-- DropIndex
DROP INDEX "VerificationCheck_vendorId_idx";

-- DropIndex
DROP INDEX "VerificationCheck_vendorId_type_key";

-- AlterTable
ALTER TABLE "Contract" DROP COLUMN "buyerSignedAt",
DROP COLUMN "documentData",
DROP COLUMN "documentName",
DROP COLUMN "mimeType",
DROP COLUMN "sizeBytes",
DROP COLUMN "status",
DROP COLUMN "title",
DROP COLUMN "updatedAt",
DROP COLUMN "vendorId",
DROP COLUMN "vendorSignedAt",
ADD COLUMN     "contractType" "ContractType" NOT NULL,
ADD COLUMN     "currentVersionId" TEXT,
ADD COLUMN     "dispatchedAt" TIMESTAMP(3),
ADD COLUMN     "executedAt" TIMESTAMP(3),
ADD COLUMN     "linkId" TEXT NOT NULL,
ADD COLUMN     "state" "ContractState" NOT NULL DEFAULT 'DRAFT_PENDING';

-- AlterTable
ALTER TABLE "ContractComment" DROP COLUMN "authorId",
DROP COLUMN "content",
ADD COLUMN     "authorSide" "PartySide" NOT NULL,
ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "contractVersionId" TEXT NOT NULL,
ADD COLUMN     "fileBlobId" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "linkId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "category",
DROP COLUMN "data",
DROP COLUMN "name",
DROP COLUMN "vendorId",
DROP COLUMN "verifiedAt",
ADD COLUMN     "checklistItemKey" TEXT,
ADD COLUMN     "fileBlobId" TEXT NOT NULL,
ADD COLUMN     "fileName" TEXT NOT NULL,
ADD COLUMN     "linkId" TEXT NOT NULL,
ADD COLUMN     "submissionId" TEXT,
ADD COLUMN     "supersedesDocumentId" TEXT,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "RequestCandidate" DROP COLUMN "commercials",
DROP COLUMN "inviteStatus",
DROP COLUMN "isAwarded",
DROP COLUMN "score",
DROP COLUMN "scoreBreakdown",
DROP COLUMN "status",
ADD COLUMN     "buyerOrgId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "buyerOrgId" TEXT,
ADD COLUMN     "buyerRole" "BuyerRole",
ADD COLUMN     "vendorOrgId" TEXT;

-- AlterTable
ALTER TABLE "VendorInvitation" DROP COLUMN "channel",
DROP COLUMN "vendorId",
ADD COLUMN     "buyerOrgId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VendorRequest" DROP COLUMN "status",
ADD COLUMN     "buyerOrgId" TEXT NOT NULL,
ADD COLUMN     "stage" "RequirementStage" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "VerificationCheck" DROP COLUMN "notes",
DROP COLUMN "rawResponse",
DROP COLUMN "type",
DROP COLUMN "vendorId",
DROP COLUMN "verifiedAt",
DROP COLUMN "verifiedById",
ADD COLUMN     "checkType" "VerificationCheckType" NOT NULL,
ADD COLUMN     "detail" JSONB,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "linkId" TEXT NOT NULL,
ADD COLUMN     "ranAt" TIMESTAMP(3),
ADD COLUMN     "subjectValue" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "VerificationStatus" NOT NULL DEFAULT 'RUNNING';

-- DropTable
DROP TABLE "ActivityLog";

-- DropTable
DROP TABLE "Approval";

-- DropTable
DROP TABLE "ErpPushRecord";

-- DropTable
DROP TABLE "Vendor";

-- DropEnum
DROP TYPE "ActivityAction";

-- DropEnum
DROP TYPE "ApprovalStatus";

-- DropEnum
DROP TYPE "CandidateStatus";

-- DropEnum
DROP TYPE "ContractStatus";

-- DropEnum
DROP TYPE "DocumentCategory";

-- DropEnum
DROP TYPE "ErpPushStatus";

-- DropEnum
DROP TYPE "InviteChannel";

-- DropEnum
DROP TYPE "RequestStatus";

-- DropEnum
DROP TYPE "VerificationCheckStatus";

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

-- CreateIndex
CREATE INDEX "BuyerOrg_gstId_idx" ON "BuyerOrg"("gstId");

-- CreateIndex
CREATE UNIQUE INDEX "DirectoryVendor_contactEmail_key" ON "DirectoryVendor"("contactEmail");

-- CreateIndex
CREATE INDEX "DirectoryVendor_contactEmail_idx" ON "DirectoryVendor"("contactEmail");

-- CreateIndex
CREATE INDEX "DirectoryVendor_primaryGstin_idx" ON "DirectoryVendor"("primaryGstin");

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
CREATE UNIQUE INDEX "ContractVersion_supersedesVersionId_key" ON "ContractVersion"("supersedesVersionId");

-- CreateIndex
CREATE INDEX "ContractVersion_contractId_idx" ON "ContractVersion"("contractId");

-- CreateIndex
CREATE INDEX "ContractVersion_linkId_idx" ON "ContractVersion"("linkId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractVersion_contractId_versionNo_key" ON "ContractVersion"("contractId", "versionNo");

-- CreateIndex
CREATE INDEX "ReviewTask_linkId_idx" ON "ReviewTask"("linkId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewTask_linkId_stage_key" ON "ReviewTask"("linkId", "stage");

-- CreateIndex
CREATE INDEX "ApprovalDecision_linkId_idx" ON "ApprovalDecision"("linkId");

-- CreateIndex
CREATE INDEX "ApprovalDecision_reviewTaskId_idx" ON "ApprovalDecision"("reviewTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_currentVersionId_key" ON "Contract"("currentVersionId");

-- CreateIndex
CREATE INDEX "Contract_linkId_idx" ON "Contract"("linkId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_linkId_contractType_key" ON "Contract"("linkId", "contractType");

-- CreateIndex
CREATE INDEX "ContractComment_linkId_idx" ON "ContractComment"("linkId");

-- CreateIndex
CREATE INDEX "ContractComment_contractVersionId_idx" ON "ContractComment"("contractVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Document_supersedesDocumentId_key" ON "Document"("supersedesDocumentId");

-- CreateIndex
CREATE INDEX "Document_linkId_idx" ON "Document"("linkId");

-- CreateIndex
CREATE INDEX "Document_fileBlobId_idx" ON "Document"("fileBlobId");

-- CreateIndex
CREATE INDEX "Document_checklistItemKey_idx" ON "Document"("checklistItemKey");

-- CreateIndex
CREATE INDEX "RequestCandidate_buyerOrgId_idx" ON "RequestCandidate"("buyerOrgId");

-- CreateIndex
CREATE INDEX "User_buyerOrgId_idx" ON "User"("buyerOrgId");

-- CreateIndex
CREATE INDEX "User_vendorOrgId_idx" ON "User"("vendorOrgId");

-- CreateIndex
CREATE INDEX "VendorInvitation_buyerOrgId_idx" ON "VendorInvitation"("buyerOrgId");

-- CreateIndex
CREATE INDEX "VendorRequest_stage_idx" ON "VendorRequest"("stage");

-- CreateIndex
CREATE INDEX "VendorRequest_buyerOrgId_idx" ON "VendorRequest"("buyerOrgId");

-- CreateIndex
CREATE INDEX "VerificationCheck_linkId_idx" ON "VerificationCheck"("linkId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationCheck_linkId_checkType_key" ON "VerificationCheck"("linkId", "checkType");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_buyerOrgId_fkey" FOREIGN KEY ("buyerOrgId") REFERENCES "BuyerOrg"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_vendorOrgId_fkey" FOREIGN KEY ("vendorOrgId") REFERENCES "VendorOrg"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorRequest" ADD CONSTRAINT "VendorRequest_buyerOrgId_fkey" FOREIGN KEY ("buyerOrgId") REFERENCES "BuyerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestCandidate" ADD CONSTRAINT "RequestCandidate_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "DirectoryVendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestCandidate" ADD CONSTRAINT "RequestCandidate_buyerOrgId_fkey" FOREIGN KEY ("buyerOrgId") REFERENCES "BuyerOrg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
