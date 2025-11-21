/*
  Warnings:

  - Added the required column `updatedAt` to the `license_allocations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "attachment_types" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "audit_log_entries" ADD COLUMN     "changedByUserId" TEXT;

-- AlterTable
ALTER TABLE "contract_types" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "data_domains" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "license_allocations" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "attachment_types_isActive_idx" ON "attachment_types"("isActive");

-- CreateIndex
CREATE INDEX "audit_log_entries_changedByUserId_idx" ON "audit_log_entries"("changedByUserId");

-- CreateIndex
CREATE INDEX "contract_types_isActive_idx" ON "contract_types"("isActive");

-- CreateIndex
CREATE INDEX "data_domains_isActive_idx" ON "data_domains"("isActive");

-- AddForeignKey
ALTER TABLE "audit_log_entries" ADD CONSTRAINT "audit_log_entries_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
