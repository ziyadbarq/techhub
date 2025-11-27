-- AlterTable: Convert action column from String to FeatureFlagAction enum
-- Uppercase existing values before casting to handle lowercase data
ALTER TABLE "feature_flag_audit_logs"
ALTER COLUMN "action" TYPE "FeatureFlagAction"
USING UPPER("action")::"FeatureFlagAction";

-- AlterTable: Convert category column from String to FeatureFlagCategory enum
-- Uppercase existing values before casting to handle lowercase data
ALTER TABLE "feature_flags"
ALTER COLUMN "category" TYPE "FeatureFlagCategory"
USING UPPER("category")::"FeatureFlagCategory";
