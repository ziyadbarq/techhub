-- CreateEnum
CREATE TYPE "WarrantyCoverageType" AS ENUM ('STANDARD', 'EXTENDED', 'ENHANCED', 'PREMIUM', 'BASIC', 'THIRD_PARTY', 'MANUFACTURER', 'DEPOT', 'ONSITE', 'NEXT_BUSINESS_DAY');

-- AlterTable
ALTER TABLE "asset_assignments" ADD COLUMN     "conditionOnAssignment" TEXT,
ADD COLUMN     "conditionOnReturn" TEXT;

-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "condition" TEXT;

-- CreateTable
CREATE TABLE "warranties" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "vendorId" TEXT,
    "coverageType" "WarrantyCoverageType" NOT NULL DEFAULT 'STANDARD',
    "coverageDetails" TEXT,
    "policyReference" TEXT,
    "slaDetails" JSONB,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "cost" DECIMAL(12,2),
    "currency" TEXT,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "warranties_assetId_idx" ON "warranties"("assetId");

-- CreateIndex
CREATE INDEX "warranties_vendorId_idx" ON "warranties"("vendorId");

-- CreateIndex
CREATE INDEX "warranties_startDate_endDate_idx" ON "warranties"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "warranties_endDate_idx" ON "warranties"("endDate");

-- CreateIndex
CREATE INDEX "warranties_coverageType_idx" ON "warranties"("coverageType");

-- AddForeignKey
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranties" ADD CONSTRAINT "warranties_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
