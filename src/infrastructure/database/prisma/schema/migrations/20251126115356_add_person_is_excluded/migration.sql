-- AlterTable
ALTER TABLE "persons" ADD COLUMN     "isExcluded" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "persons_isExcluded_idx" ON "persons"("isExcluded");
