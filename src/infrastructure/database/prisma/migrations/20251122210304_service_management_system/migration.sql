-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('APPLICATION', 'SERVER', 'NETWORK', 'DATABASE', 'ENDPOINT', 'CLOUD_SERVICE', 'API', 'MIDDLEWARE', 'STORAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('PRODUCTION', 'UAT', 'DR', 'DEVELOPMENT', 'RETIRED', 'PLANNED');

-- CreateEnum
CREATE TYPE "DataConfidentiality" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "BusinessImpactLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "CriticalityLevel" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('TECHNICAL', 'PRODUCT', 'BUSINESS');

-- CreateEnum
CREATE TYPE "ServiceLocation" AS ENUM ('ON_PREM', 'OCI_CLOUD', 'GCP_CLOUD', 'AWS_CLOUD', 'HYBRID');

-- CreateEnum
CREATE TYPE "AssetRelationship" AS ENUM ('HOSTS', 'SUPPORTS', 'DEPENDS_ON', 'MONITORS', 'BACKS_UP');

-- CreateTable
CREATE TABLE "business_processes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "description" TEXT,
    "businessPurpose" TEXT,
    "gitlabRepoUrl" TEXT,
    "dataConfidentiality" "DataConfidentiality" NOT NULL DEFAULT 'INTERNAL',
    "businessImpactLevel" "BusinessImpactLevel" NOT NULL DEFAULT 'MEDIUM',
    "criticality" "CriticalityLevel" NOT NULL DEFAULT 'MEDIUM',
    "isEssentialService" BOOLEAN NOT NULL DEFAULT false,
    "deploymentDate" TIMESTAMP(3),
    "currentStatus" "ServiceStatus" NOT NULL DEFAULT 'PRODUCTION',
    "lastPatchDate" TIMESTAMP(3),
    "plannedDecommissionDate" TIMESTAMP(3),
    "vendorId" TEXT,
    "slaDetails" JSONB,
    "businessProcessId" TEXT,
    "isInCentralRegister" BOOLEAN NOT NULL DEFAULT true,
    "complianceNotes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_ownerships" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "ownershipType" "OwnershipType" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_ownerships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_infrastructure" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "location" "ServiceLocation" NOT NULL,
    "cloudProvider" TEXT,
    "compartment" TEXT,
    "project" TEXT,
    "region" TEXT,
    "ipAddress" TEXT,
    "hostname" TEXT,
    "backupEnabled" BOOLEAN NOT NULL DEFAULT false,
    "backupSchedule" TEXT,
    "lastBackupDate" TIMESTAMP(3),
    "cloudProviderDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_infrastructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_assets" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "assetId" TEXT,
    "relationship" "AssetRelationship" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_processes_code_key" ON "business_processes"("code");

-- CreateIndex
CREATE INDEX "business_processes_code_idx" ON "business_processes"("code");

-- CreateIndex
CREATE INDEX "business_processes_category_idx" ON "business_processes"("category");

-- CreateIndex
CREATE UNIQUE INDEX "services_name_key" ON "services"("name");

-- CreateIndex
CREATE INDEX "services_serviceType_idx" ON "services"("serviceType");

-- CreateIndex
CREATE INDEX "services_currentStatus_idx" ON "services"("currentStatus");

-- CreateIndex
CREATE INDEX "services_criticality_idx" ON "services"("criticality");

-- CreateIndex
CREATE INDEX "services_businessImpactLevel_idx" ON "services"("businessImpactLevel");

-- CreateIndex
CREATE INDEX "services_vendorId_idx" ON "services"("vendorId");

-- CreateIndex
CREATE INDEX "services_businessProcessId_idx" ON "services"("businessProcessId");

-- CreateIndex
CREATE INDEX "services_isEssentialService_idx" ON "services"("isEssentialService");

-- CreateIndex
CREATE INDEX "services_plannedDecommissionDate_idx" ON "services"("plannedDecommissionDate");

-- CreateIndex
CREATE INDEX "service_ownerships_serviceId_idx" ON "service_ownerships"("serviceId");

-- CreateIndex
CREATE INDEX "service_ownerships_personId_idx" ON "service_ownerships"("personId");

-- CreateIndex
CREATE INDEX "service_ownerships_ownershipType_idx" ON "service_ownerships"("ownershipType");

-- CreateIndex
CREATE INDEX "service_ownerships_isPrimary_idx" ON "service_ownerships"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "service_ownerships_serviceId_personId_ownershipType_key" ON "service_ownerships"("serviceId", "personId", "ownershipType");

-- CreateIndex
CREATE INDEX "service_infrastructure_serviceId_idx" ON "service_infrastructure"("serviceId");

-- CreateIndex
CREATE INDEX "service_infrastructure_location_idx" ON "service_infrastructure"("location");

-- CreateIndex
CREATE INDEX "service_infrastructure_cloudProvider_idx" ON "service_infrastructure"("cloudProvider");

-- CreateIndex
CREATE INDEX "service_infrastructure_region_idx" ON "service_infrastructure"("region");

-- CreateIndex
CREATE INDEX "service_assets_serviceId_idx" ON "service_assets"("serviceId");

-- CreateIndex
CREATE INDEX "service_assets_assetId_idx" ON "service_assets"("assetId");

-- CreateIndex
CREATE INDEX "service_assets_relationship_idx" ON "service_assets"("relationship");

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_businessProcessId_fkey" FOREIGN KEY ("businessProcessId") REFERENCES "business_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_ownerships" ADD CONSTRAINT "service_ownerships_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_ownerships" ADD CONSTRAINT "service_ownerships_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_infrastructure" ADD CONSTRAINT "service_infrastructure_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_assets" ADD CONSTRAINT "service_assets_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_assets" ADD CONSTRAINT "service_assets_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
