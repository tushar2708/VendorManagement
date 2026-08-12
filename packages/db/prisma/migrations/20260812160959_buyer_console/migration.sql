/*
  Warnings:

  - The values [FINANCE,IT_SECURITY,QUALITY] on the enum `ApprovalStage` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[vendorId,stage,requestId]` on the table `Approval` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ApprovalStage_new" AS ENUM ('FINANCIAL_CRIME', 'COMPLIANCE', 'LEGAL', 'IT_INFOSEC', 'TAX', 'PROCUREMENT', 'DATA_PRIVACY', 'BUSINESS_OWNER');
ALTER TABLE "SlaRule" ALTER COLUMN "stage" TYPE "ApprovalStage_new" USING ("stage"::text::"ApprovalStage_new");
ALTER TABLE "Approval" ALTER COLUMN "stage" TYPE "ApprovalStage_new" USING ("stage"::text::"ApprovalStage_new");
ALTER TYPE "ApprovalStage" RENAME TO "ApprovalStage_old";
ALTER TYPE "ApprovalStage_new" RENAME TO "ApprovalStage";
DROP TYPE "public"."ApprovalStage_old";
COMMIT;

-- DropIndex
DROP INDEX "Approval_vendorId_stage_key";

-- AlterTable
ALTER TABLE "Approval" ADD COLUMN     "requestId" TEXT;

-- AlterTable
ALTER TABLE "RequestCandidate" ADD COLUMN     "commercials" JSONB,
ADD COLUMN     "isAwarded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "score" INTEGER,
ADD COLUMN     "scoreBreakdown" JSONB;

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
CREATE INDEX "ScoringCriterion_requirementId_idx" ON "ScoringCriterion"("requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoringCriterion_requirementId_name_key" ON "ScoringCriterion"("requirementId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Approval_vendorId_stage_requestId_key" ON "Approval"("vendorId", "stage", "requestId");

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VendorRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoringCriterion" ADD CONSTRAINT "ScoringCriterion_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "VendorRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
