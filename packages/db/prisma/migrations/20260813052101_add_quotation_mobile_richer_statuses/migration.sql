-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReviewTaskStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "ReviewTaskStatus" ADD VALUE 'INFORMATION_REQUIRED';
ALTER TYPE "ReviewTaskStatus" ADD VALUE 'EDD_COMPLETE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mobileNumber" TEXT,
ADD COLUMN     "mobileOtp" TEXT,
ADD COLUMN     "mobileOtpExpiresAt" TIMESTAMP(3),
ADD COLUMN     "mobileVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "toolingPerUnit" INTEGER NOT NULL DEFAULT 0,
    "freightPerUnit" INTEGER NOT NULL DEFAULT 0,
    "leadTimeDays" INTEGER NOT NULL,
    "location" TEXT,
    "capacityNote" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requestId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "capturedById" TEXT,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Quotation_requestId_idx" ON "Quotation"("requestId");

-- CreateIndex
CREATE INDEX "Quotation_vendorId_idx" ON "Quotation"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_requestId_vendorId_key" ON "Quotation"("requestId", "vendorId");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "VendorRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "DirectoryVendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_capturedById_fkey" FOREIGN KEY ("capturedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
