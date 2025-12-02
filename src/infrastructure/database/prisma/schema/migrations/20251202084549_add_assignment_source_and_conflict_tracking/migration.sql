-- CreateEnum
CREATE TYPE "AssignmentSourceEnum" AS ENUM ('MANUAL', 'INTUNE_SYNC', 'INTUNE_MANUAL', 'IMPORT', 'SYSTEM');

-- AlterTable
ALTER TABLE "asset_assignments" ADD COLUMN     "conflictNote" TEXT,
ADD COLUMN     "hasConflict" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" "AssignmentSourceEnum" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "sourceReferenceId" TEXT,
ADD COLUMN     "sourceReferenceType" TEXT;

-- CreateIndex
CREATE INDEX "asset_assignments_source_idx" ON "asset_assignments"("source");

-- CreateIndex
CREATE INDEX "asset_assignments_sourceReferenceType_sourceReferenceId_idx" ON "asset_assignments"("sourceReferenceType", "sourceReferenceId");

-- CreateIndex
CREATE INDEX "asset_assignments_hasConflict_idx" ON "asset_assignments"("hasConflict");
