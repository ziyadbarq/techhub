-- CreateEnum
CREATE TYPE "OciSyncStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "oci_sync_logs" (
    "id" TEXT NOT NULL,
    "status" "OciSyncStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "serviceTypes" TEXT[],
    "tenancyId" TEXT,
    "regions" TEXT[],
    "resourcesProcessed" INTEGER NOT NULL DEFAULT 0,
    "resourcesCreated" INTEGER NOT NULL DEFAULT 0,
    "resourcesUpdated" INTEGER NOT NULL DEFAULT 0,
    "resourcesUnchanged" INTEGER NOT NULL DEFAULT 0,
    "compartmentsCreated" INTEGER NOT NULL DEFAULT 0,
    "relationshipsCreated" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "triggeredBy" TEXT,
    "isDryRun" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "oci_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "oci_sync_logs_status_idx" ON "oci_sync_logs"("status");

-- CreateIndex
CREATE INDEX "oci_sync_logs_startedAt_idx" ON "oci_sync_logs"("startedAt");
