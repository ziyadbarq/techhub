-- CreateEnum
CREATE TYPE "access_service_role" AS ENUM ('OWNER', 'CYBERSECURITY', 'IMPLEMENTER');

-- AlterEnum
ALTER TYPE "field_type" ADD VALUE 'SYSTEM_FIELD';

-- CreateTable
CREATE TABLE "access_services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requireManagerApproval" BOOLEAN NOT NULL DEFAULT false,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "access_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_service_assignees" (
    "id" TEXT NOT NULL,
    "accessServiceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "access_service_role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_service_assignees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_service_request_snapshots" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "sourceFieldKey" TEXT NOT NULL,
    "accessServiceId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "serviceSlug" TEXT NOT NULL,
    "requireManagerApproval" BOOLEAN NOT NULL,
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_service_request_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_service_snapshot_assignees" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "role" "access_service_role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_service_snapshot_assignees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requester_identity_snapshots" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "managerUserId" TEXT,
    "managerName" TEXT,
    "managerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requester_identity_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "access_services_name_key" ON "access_services"("name");

-- CreateIndex
CREATE UNIQUE INDEX "access_services_slug_key" ON "access_services"("slug");

-- CreateIndex
CREATE INDEX "access_services_isActive_idx" ON "access_services"("isActive");

-- CreateIndex
CREATE INDEX "access_service_assignees_accessServiceId_role_idx" ON "access_service_assignees"("accessServiceId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "access_service_assignees_accessServiceId_userId_role_key" ON "access_service_assignees"("accessServiceId", "userId", "role");

-- CreateIndex
CREATE INDEX "access_service_request_snapshots_requestId_idx" ON "access_service_request_snapshots"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "access_service_request_snapshots_requestId_sourceFieldKey_key" ON "access_service_request_snapshots"("requestId", "sourceFieldKey");

-- CreateIndex
CREATE INDEX "access_service_snapshot_assignees_snapshotId_role_idx" ON "access_service_snapshot_assignees"("snapshotId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "requester_identity_snapshots_requestId_key" ON "requester_identity_snapshots"("requestId");

-- AddForeignKey
ALTER TABLE "access_services" ADD CONSTRAINT "access_services_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_services" ADD CONSTRAINT "access_services_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_service_assignees" ADD CONSTRAINT "access_service_assignees_accessServiceId_fkey" FOREIGN KEY ("accessServiceId") REFERENCES "access_services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_service_assignees" ADD CONSTRAINT "access_service_assignees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_service_request_snapshots" ADD CONSTRAINT "access_service_request_snapshots_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_service_request_snapshots" ADD CONSTRAINT "access_service_request_snapshots_accessServiceId_fkey" FOREIGN KEY ("accessServiceId") REFERENCES "access_services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_service_snapshot_assignees" ADD CONSTRAINT "access_service_snapshot_assignees_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "access_service_request_snapshots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_service_snapshot_assignees" ADD CONSTRAINT "access_service_snapshot_assignees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requester_identity_snapshots" ADD CONSTRAINT "requester_identity_snapshots_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
