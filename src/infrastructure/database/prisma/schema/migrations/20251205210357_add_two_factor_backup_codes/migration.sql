/*
  Warnings:

  - You are about to drop the column `twoFactorBackupCodes` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "twoFactorBackupCodes";

-- CreateTable
CREATE TABLE "two_factor_backup_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "two_factor_backup_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "two_factor_backup_codes_userId_idx" ON "two_factor_backup_codes"("userId");

-- AddForeignKey
ALTER TABLE "two_factor_backup_codes" ADD CONSTRAINT "two_factor_backup_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
