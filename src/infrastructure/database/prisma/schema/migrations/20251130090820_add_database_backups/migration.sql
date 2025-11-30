-- CreateEnum
CREATE TYPE "backup_status" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "backup_stage" AS ENUM ('INITIALIZING', 'DUMPING', 'COMPRESSING', 'FINALIZING');

-- CreateTable
CREATE TABLE "database_backups" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL DEFAULT 0,
    "status" "backup_status" NOT NULL,
    "stage" "backup_stage",
    "percentage" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "createdById" TEXT NOT NULL,
    "notes" TEXT,
    "databaseName" TEXT NOT NULL,
    "postgresVersion" TEXT NOT NULL,
    "tableCount" INTEGER,
    "recordCount" BIGINT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "errorDetails" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "database_backups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "database_backups_filename_key" ON "database_backups"("filename");

-- CreateIndex
CREATE INDEX "database_backups_status_idx" ON "database_backups"("status");

-- CreateIndex
CREATE INDEX "database_backups_createdAt_idx" ON "database_backups"("createdAt");

-- CreateIndex
CREATE INDEX "database_backups_deletedAt_idx" ON "database_backups"("deletedAt");

-- AddForeignKey
ALTER TABLE "database_backups" ADD CONSTRAINT "database_backups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "database_backups" ADD CONSTRAINT "database_backups_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
