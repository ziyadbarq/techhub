-- CreateEnum
CREATE TYPE "DisposalType" AS ENUM ('DONATION', 'SALE', 'RECYCLING', 'DESTRUCTION', 'OTHER');
CREATE TYPE "DisposalStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "DisposalDocumentType" AS ENUM ('CERTIFICATE', 'RECEIPT', 'INVOICE', 'PHOTO', 'OTHER');

-- AssetDisposal: Main disposal record
CREATE TABLE "asset_disposals" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "asset_id" TEXT NOT NULL,
  "disposal_type" "DisposalType" NOT NULL,
  "reason" TEXT,
  "initiated_by_id" TEXT NOT NULL,
  "approved_by_id" TEXT,
  "approved_at" TIMESTAMP(3),
  "status" "DisposalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
  "estimated_value" DECIMAL(12,2),
  "actual_proceeds" DECIMAL(12,2),
  "currency" TEXT,
  "sanitization_checklist" JSONB,
  "disposal_date" TIMESTAMP(3),
  "certificate_number" TEXT,
  "certificate_issued_at" TIMESTAMP(3),
  "disposal_vendor_id" TEXT,
  "recipient_info" TEXT,
  "note" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "asset_disposals_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "asset_disposals_initiated_by_id_fkey" FOREIGN KEY ("initiated_by_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "asset_disposals_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "asset_disposals_disposal_vendor_id_fkey" FOREIGN KEY ("disposal_vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "asset_disposals_certificate_number_key" ON "asset_disposals"("certificate_number");
CREATE INDEX "asset_disposals_asset_id_idx" ON "asset_disposals"("asset_id");
CREATE INDEX "asset_disposals_status_idx" ON "asset_disposals"("status");
CREATE INDEX "asset_disposals_initiated_by_id_idx" ON "asset_disposals"("initiated_by_id");
CREATE INDEX "asset_disposals_approved_by_id_idx" ON "asset_disposals"("approved_by_id");
CREATE INDEX "asset_disposals_disposal_date_idx" ON "asset_disposals"("disposal_date");

-- Disposal Approval: Tracks approval workflow
CREATE TABLE "disposal_approvals" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "disposal_id" TEXT NOT NULL,
  "approver_id" TEXT NOT NULL,
  "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "decision_at" TIMESTAMP(3),
  "comment" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "disposal_approvals_disposal_id_fkey" FOREIGN KEY ("disposal_id") REFERENCES "asset_disposals"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "disposal_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "disposal_approvals_disposal_id_idx" ON "disposal_approvals"("disposal_id");
CREATE INDEX "disposal_approvals_approver_id_idx" ON "disposal_approvals"("approver_id");
CREATE INDEX "disposal_approvals_status_idx" ON "disposal_approvals"("status");

-- Disposal Document: Certificates, receipts, etc.
CREATE TABLE "disposal_documents" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "disposal_id" TEXT NOT NULL,
  "document_type" "DisposalDocumentType" NOT NULL,
  "file_name" TEXT NOT NULL,
  "file_path" TEXT NOT NULL,
  "mime_type" TEXT,
  "size_bytes" BIGINT,
  "uploaded_by_id" TEXT NOT NULL,
  "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "disposal_documents_disposal_id_fkey" FOREIGN KEY ("disposal_id") REFERENCES "asset_disposals"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "disposal_documents_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "disposal_documents_disposal_id_idx" ON "disposal_documents"("disposal_id");
