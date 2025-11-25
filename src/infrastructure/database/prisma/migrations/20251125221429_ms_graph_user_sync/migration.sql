/*
  Warnings:

  - A unique constraint covering the columns `[azureAdId]` on the table `persons` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "persons" ADD COLUMN     "azureAdId" TEXT,
ADD COLUMN     "office" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "persons_azureAdId_key" ON "persons"("azureAdId");

-- CreateIndex
CREATE INDEX "persons_azureAdId_idx" ON "persons"("azureAdId");
