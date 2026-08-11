/*
  Warnings:

  - A unique constraint covering the columns `[tokenHash]` on the table `VendorInvitation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CandidateSource" AS ENUM ('MANUAL', 'DIRECTORY');

-- AlterEnum
ALTER TYPE "InviteStatus" ADD VALUE 'INVITED';

-- AlterTable
ALTER TABLE "RequestCandidate" ADD COLUMN     "city" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "gstin" TEXT,
ADD COLUMN     "inviteStatus" "InviteStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "pan" TEXT,
ADD COLUMN     "source" "CandidateSource" NOT NULL DEFAULT 'DIRECTORY',
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "city" TEXT,
ADD COLUMN     "processTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "VendorInvitation" ADD COLUMN     "email" TEXT,
ADD COLUMN     "magicTokenPlain" TEXT,
ADD COLUMN     "tokenHash" TEXT;

-- AlterTable
ALTER TABLE "VendorRequest" ADD COLUMN     "plantLocation" TEXT,
ADD COLUMN     "processCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "targetAwardDate" TIMESTAMP(3),
ADD COLUMN     "title" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "VendorInvitation_tokenHash_key" ON "VendorInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "VendorInvitation_tokenHash_idx" ON "VendorInvitation"("tokenHash");
