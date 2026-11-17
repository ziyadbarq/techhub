-- AlterTable
ALTER TABLE "request_attachments" ALTER COLUMN "requestId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "request_attachments_uploadedById_requestId_idx" ON "request_attachments"("uploadedById", "requestId");
