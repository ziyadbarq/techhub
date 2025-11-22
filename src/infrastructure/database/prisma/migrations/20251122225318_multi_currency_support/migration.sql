-- AlterTable
ALTER TABLE "maintenance_records" ADD COLUMN     "currency" TEXT;

-- CreateTable
CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "rateToSAR" DECIMAL(10,6) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exchange_rates_currency_key" ON "exchange_rates"("currency");

-- CreateIndex
CREATE INDEX "exchange_rates_currency_idx" ON "exchange_rates"("currency");

-- CreateIndex
CREATE INDEX "exchange_rates_isActive_idx" ON "exchange_rates"("isActive");
