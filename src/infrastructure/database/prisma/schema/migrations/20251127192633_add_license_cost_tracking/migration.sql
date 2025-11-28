-- AlterTable
ALTER TABLE "license_entitlements" ADD COLUMN     "currency" TEXT,
ADD COLUMN     "unitCost" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "license_addons" (
    "id" TEXT NOT NULL,
    "licenseProductId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_addons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "license_entitlement_addons" (
    "id" TEXT NOT NULL,
    "licenseEntitlementId" TEXT NOT NULL,
    "licenseAddonId" TEXT NOT NULL,
    "cost" DECIMAL(12,2),
    "currency" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_entitlement_addons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "license_addons_licenseProductId_idx" ON "license_addons"("licenseProductId");

-- CreateIndex
CREATE INDEX "license_addons_isActive_idx" ON "license_addons"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "license_addons_licenseProductId_code_key" ON "license_addons"("licenseProductId", "code");

-- CreateIndex
CREATE INDEX "license_entitlement_addons_licenseEntitlementId_idx" ON "license_entitlement_addons"("licenseEntitlementId");

-- CreateIndex
CREATE INDEX "license_entitlement_addons_licenseAddonId_idx" ON "license_entitlement_addons"("licenseAddonId");

-- CreateIndex
CREATE UNIQUE INDEX "license_entitlement_addons_licenseEntitlementId_licenseAddo_key" ON "license_entitlement_addons"("licenseEntitlementId", "licenseAddonId");

-- AddForeignKey
ALTER TABLE "license_addons" ADD CONSTRAINT "license_addons_licenseProductId_fkey" FOREIGN KEY ("licenseProductId") REFERENCES "license_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_entitlement_addons" ADD CONSTRAINT "license_entitlement_addons_licenseEntitlementId_fkey" FOREIGN KEY ("licenseEntitlementId") REFERENCES "license_entitlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_entitlement_addons" ADD CONSTRAINT "license_entitlement_addons_licenseAddonId_fkey" FOREIGN KEY ("licenseAddonId") REFERENCES "license_addons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
