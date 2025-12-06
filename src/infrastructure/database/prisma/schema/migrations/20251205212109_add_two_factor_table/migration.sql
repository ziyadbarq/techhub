/*
  Warnings:

  - You are about to drop the `two_factor_backup_codes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "two_factor_backup_codes" DROP CONSTRAINT "two_factor_backup_codes_userId_fkey";

-- DropTable
DROP TABLE "two_factor_backup_codes";

-- CreateTable
CREATE TABLE "two_factor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "two_factor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "two_factor_userId_key" ON "two_factor"("userId");

-- CreateIndex
CREATE INDEX "two_factor_userId_idx" ON "two_factor"("userId");

-- AddForeignKey
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
