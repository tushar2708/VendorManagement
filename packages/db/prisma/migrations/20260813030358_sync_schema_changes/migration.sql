/*
  Warnings:

  - A unique constraint covering the columns `[candidateId]` on the table `VendorInvitation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "VendorInvitation" ADD COLUMN     "candidateId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "VendorInvitation_candidateId_key" ON "VendorInvitation"("candidateId");

-- AddForeignKey
ALTER TABLE "VendorInvitation" ADD CONSTRAINT "VendorInvitation_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "RequestCandidate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
