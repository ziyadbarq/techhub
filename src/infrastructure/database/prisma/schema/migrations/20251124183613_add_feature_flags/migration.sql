-- CreateEnum
CREATE TYPE "FeatureFlagCategory" AS ENUM ('SYSTEM', 'LAYER_1', 'LAYER_2', 'LAYER_3');

-- CreateEnum
CREATE TYPE "FeatureFlagAction" AS ENUM ('ENABLED', 'DISABLED');

-- CreateTable
CREATE TABLE "feature_flags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "dependsOn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_flag_audit_logs" (
    "id" TEXT NOT NULL,
    "featureName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_flag_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feature_flags_name_key" ON "feature_flags"("name");

-- CreateIndex
CREATE INDEX "feature_flags_isEnabled_idx" ON "feature_flags"("isEnabled");

-- CreateIndex
CREATE INDEX "feature_flags_category_idx" ON "feature_flags"("category");

-- CreateIndex
CREATE INDEX "feature_flag_audit_logs_featureName_idx" ON "feature_flag_audit_logs"("featureName");

-- CreateIndex
CREATE INDEX "feature_flag_audit_logs_userId_idx" ON "feature_flag_audit_logs"("userId");

-- CreateIndex
CREATE INDEX "feature_flag_audit_logs_createdAt_idx" ON "feature_flag_audit_logs"("createdAt");
