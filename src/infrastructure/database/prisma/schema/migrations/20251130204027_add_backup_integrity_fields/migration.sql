-- AlterTable
ALTER TABLE "database_backups" ADD COLUMN     "checksum" TEXT,
ADD COLUMN     "codeSchemaVersion" TEXT,
ADD COLUMN     "dbSchemaVersion" TEXT,
ADD COLUMN     "schemaDrift" BOOLEAN DEFAULT false,
ADD COLUMN     "verificationError" TEXT,
ADD COLUMN     "verificationStatus" TEXT;
