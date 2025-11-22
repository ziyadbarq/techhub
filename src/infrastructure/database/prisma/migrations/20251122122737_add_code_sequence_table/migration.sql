-- CreateTable
CREATE TABLE "code_sequences" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "code_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "code_sequences_entityType_key" ON "code_sequences"("entityType");

-- CreateIndex
CREATE INDEX "code_sequences_entityType_idx" ON "code_sequences"("entityType");
