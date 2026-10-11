-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "owningOrgUnitId" TEXT;

-- CreateIndex
CREATE INDEX "assets_owningOrgUnitId_idx" ON "assets"("owningOrgUnitId");

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_owningOrgUnitId_fkey" FOREIGN KEY ("owningOrgUnitId") REFERENCES "organization_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
