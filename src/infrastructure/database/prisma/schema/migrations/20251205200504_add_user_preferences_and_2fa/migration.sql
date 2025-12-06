-- AlterTable
ALTER TABLE "users" ADD COLUMN     "twoFactorBackupCodes" TEXT,
ADD COLUMN     "twoFactorEnabled" BOOLEAN DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Riyadh',
    "dateFormat" TEXT NOT NULL DEFAULT 'dd/MM/yyyy',
    "currencyDisplay" TEXT NOT NULL DEFAULT 'dual',
    "notifications" JSONB NOT NULL DEFAULT '{"emailNotifications":true,"teamsNotifications":false,"whatsappNotifications":false,"weeklyDigest":true,"assetAlerts":true,"approvalAlerts":true,"warrantyAlerts":true}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "user_preferences_userId_idx" ON "user_preferences"("userId");

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
