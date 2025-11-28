-- CreateEnum
CREATE TYPE "IntuneDeviceOwnershipType" AS ENUM ('CORPORATE', 'PERSONAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "IntuneComplianceState" AS ENUM ('COMPLIANT', 'NON_COMPLIANT', 'CONFLICT', 'ERROR', 'IN_GRACE_PERIOD', 'CONFIG_MANAGER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "IntuneManagementState" AS ENUM ('MANAGED', 'RETIRE_PENDING', 'RETIRE_ISSUED', 'WIPE_PENDING', 'WIPE_ISSUED', 'UNHEALTHY', 'DELETE_PENDING', 'DISCOVERED');

-- CreateEnum
CREATE TYPE "IntuneSyncStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "intune_devices" (
    "id" TEXT NOT NULL,
    "intuneDeviceId" TEXT NOT NULL,
    "azureAdDeviceId" TEXT,
    "deviceName" TEXT NOT NULL,
    "serialNumber" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "operatingSystem" TEXT,
    "osVersion" TEXT,
    "imei" TEXT,
    "wiFiMacAddress" TEXT,
    "ethernetMacAddress" TEXT,
    "intuneUserId" TEXT,
    "userPrincipalName" TEXT,
    "userDisplayName" TEXT,
    "ownershipType" "IntuneDeviceOwnershipType" NOT NULL DEFAULT 'UNKNOWN',
    "complianceState" "IntuneComplianceState" NOT NULL DEFAULT 'UNKNOWN',
    "managementState" "IntuneManagementState" NOT NULL DEFAULT 'MANAGED',
    "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
    "isSupervised" BOOLEAN NOT NULL DEFAULT false,
    "isJailBroken" BOOLEAN NOT NULL DEFAULT false,
    "enrolledDateTime" TIMESTAMP(3),
    "lastSyncDateTime" TIMESTAMP(3),
    "linkedAssetId" TEXT,
    "linkedPersonId" TEXT,
    "assetLinkMethod" TEXT,
    "assetLinkedAt" TIMESTAMP(3),
    "personLinkMethod" TEXT,
    "personLinkedAt" TIMESTAMP(3),
    "lastSyncedFromIntune" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intune_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intune_compliance_history" (
    "id" TEXT NOT NULL,
    "intuneDeviceId" TEXT NOT NULL,
    "previousState" "IntuneComplianceState" NOT NULL,
    "newState" "IntuneComplianceState" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "policyName" TEXT,
    "policyId" TEXT,
    "reason" TEXT,

    CONSTRAINT "intune_compliance_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "intune_sync_logs" (
    "id" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "status" "IntuneSyncStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "devicesProcessed" INTEGER NOT NULL DEFAULT 0,
    "devicesCreated" INTEGER NOT NULL DEFAULT 0,
    "devicesUpdated" INTEGER NOT NULL DEFAULT 0,
    "devicesDeactivated" INTEGER NOT NULL DEFAULT 0,
    "assetsLinked" INTEGER NOT NULL DEFAULT 0,
    "personsLinked" INTEGER NOT NULL DEFAULT 0,
    "complianceChanges" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "triggeredBy" TEXT,
    "intuneDeviceId" TEXT,

    CONSTRAINT "intune_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "intune_devices_intuneDeviceId_key" ON "intune_devices"("intuneDeviceId");

-- CreateIndex
CREATE UNIQUE INDEX "intune_devices_azureAdDeviceId_key" ON "intune_devices"("azureAdDeviceId");

-- CreateIndex
CREATE UNIQUE INDEX "intune_devices_linkedAssetId_key" ON "intune_devices"("linkedAssetId");

-- CreateIndex
CREATE INDEX "intune_devices_serialNumber_idx" ON "intune_devices"("serialNumber");

-- CreateIndex
CREATE INDEX "intune_devices_intuneUserId_idx" ON "intune_devices"("intuneUserId");

-- CreateIndex
CREATE INDEX "intune_devices_complianceState_idx" ON "intune_devices"("complianceState");

-- CreateIndex
CREATE INDEX "intune_devices_complianceState_isActive_idx" ON "intune_devices"("complianceState", "isActive");

-- CreateIndex
CREATE INDEX "intune_devices_managementState_idx" ON "intune_devices"("managementState");

-- CreateIndex
CREATE INDEX "intune_devices_ownershipType_idx" ON "intune_devices"("ownershipType");

-- CreateIndex
CREATE INDEX "intune_devices_linkedAssetId_idx" ON "intune_devices"("linkedAssetId");

-- CreateIndex
CREATE INDEX "intune_devices_linkedPersonId_idx" ON "intune_devices"("linkedPersonId");

-- CreateIndex
CREATE INDEX "intune_devices_isActive_idx" ON "intune_devices"("isActive");

-- CreateIndex
CREATE INDEX "intune_devices_lastSyncDateTime_idx" ON "intune_devices"("lastSyncDateTime");

-- CreateIndex
CREATE INDEX "intune_compliance_history_intuneDeviceId_idx" ON "intune_compliance_history"("intuneDeviceId");

-- CreateIndex
CREATE INDEX "intune_compliance_history_changedAt_idx" ON "intune_compliance_history"("changedAt");

-- CreateIndex
CREATE INDEX "intune_compliance_history_newState_changedAt_idx" ON "intune_compliance_history"("newState", "changedAt");

-- CreateIndex
CREATE INDEX "intune_sync_logs_syncType_idx" ON "intune_sync_logs"("syncType");

-- CreateIndex
CREATE INDEX "intune_sync_logs_status_idx" ON "intune_sync_logs"("status");

-- CreateIndex
CREATE INDEX "intune_sync_logs_startedAt_idx" ON "intune_sync_logs"("startedAt");

-- CreateIndex
CREATE INDEX "intune_sync_logs_intuneDeviceId_idx" ON "intune_sync_logs"("intuneDeviceId");

-- AddForeignKey
ALTER TABLE "intune_devices" ADD CONSTRAINT "intune_devices_linkedAssetId_fkey" FOREIGN KEY ("linkedAssetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intune_devices" ADD CONSTRAINT "intune_devices_linkedPersonId_fkey" FOREIGN KEY ("linkedPersonId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intune_compliance_history" ADD CONSTRAINT "intune_compliance_history_intuneDeviceId_fkey" FOREIGN KEY ("intuneDeviceId") REFERENCES "intune_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intune_sync_logs" ADD CONSTRAINT "intune_sync_logs_intuneDeviceId_fkey" FOREIGN KEY ("intuneDeviceId") REFERENCES "intune_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
