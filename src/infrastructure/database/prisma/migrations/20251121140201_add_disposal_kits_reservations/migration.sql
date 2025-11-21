/*
  Warnings:

  - The `status` column on the `asset_disposals` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `asset_assignment_id` on the `asset_kit_checkout_items` table. All the data in the column will be lost.
  - You are about to drop the column `is_returned` on the `asset_kit_checkout_items` table. All the data in the column will be lost.
  - You are about to drop the column `return_condition` on the `asset_kit_checkout_items` table. All the data in the column will be lost.
  - The `status` column on the `asset_kit_checkouts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `resolved` on the `asset_reservation_conflicts` table. All the data in the column will be lost.
  - You are about to drop the column `fulfillment_assignment_id` on the `asset_reservations` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `asset_reservations` table. All the data in the column will be lost.
  - You are about to drop the column `notification_sent` on the `asset_reservations` table. All the data in the column will be lost.
  - You are about to drop the column `pickup_location_id` on the `asset_reservations` table. All the data in the column will be lost.
  - You are about to drop the column `reserved_for_id` on the `asset_reservations` table. All the data in the column will be lost.
  - You are about to drop the column `return_location_id` on the `asset_reservations` table. All the data in the column will be lost.
  - The `status` column on the `asset_reservations` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `disposal_approvals` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `disposal_type` on the `asset_disposals` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `kit_item_id` to the `asset_kit_checkout_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `asset_kit_checkout_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `asset_kit_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kit_type` to the `asset_kits` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `document_type` on the `disposal_documents` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "asset_disposals" DROP CONSTRAINT "asset_disposals_approved_by_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_disposals" DROP CONSTRAINT "asset_disposals_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_disposals" DROP CONSTRAINT "asset_disposals_disposal_vendor_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_disposals" DROP CONSTRAINT "asset_disposals_initiated_by_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_kit_checkout_items" DROP CONSTRAINT "asset_kit_checkout_items_asset_assignment_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_kit_checkout_items" DROP CONSTRAINT "asset_kit_checkout_items_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_kit_checkouts" DROP CONSTRAINT "asset_kit_checkouts_checked_out_by_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_kit_items" DROP CONSTRAINT "asset_kit_items_asset_category_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_kit_items" DROP CONSTRAINT "asset_kit_items_asset_model_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_reservations" DROP CONSTRAINT "asset_reservations_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_reservations" DROP CONSTRAINT "asset_reservations_fulfillment_assignment_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_reservations" DROP CONSTRAINT "asset_reservations_pickup_location_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_reservations" DROP CONSTRAINT "asset_reservations_reserved_by_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_reservations" DROP CONSTRAINT "asset_reservations_reserved_for_id_fkey";

-- DropForeignKey
ALTER TABLE "asset_reservations" DROP CONSTRAINT "asset_reservations_return_location_id_fkey";

-- DropForeignKey
ALTER TABLE "disposal_approvals" DROP CONSTRAINT "disposal_approvals_approver_id_fkey";

-- DropForeignKey
ALTER TABLE "disposal_documents" DROP CONSTRAINT "disposal_documents_uploaded_by_id_fkey";

-- DropIndex
DROP INDEX "asset_kit_checkout_items_is_returned_idx";

-- DropIndex
DROP INDEX "asset_kit_checkouts_checkout_date_idx";

-- DropIndex
DROP INDEX "asset_kits_name_key";

-- DropIndex
DROP INDEX "asset_reservations_end_date_idx";

-- DropIndex
DROP INDEX "asset_reservations_reserved_for_id_idx";

-- DropIndex
DROP INDEX "asset_reservations_start_date_idx";

-- AlterTable
ALTER TABLE "asset_disposals" DROP COLUMN "disposal_type",
ADD COLUMN     "disposal_type" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL';

-- AlterTable
ALTER TABLE "asset_kit_checkout_items" DROP COLUMN "asset_assignment_id",
DROP COLUMN "is_returned",
DROP COLUMN "return_condition",
ADD COLUMN     "checkout_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "condition_at_checkout" TEXT,
ADD COLUMN     "condition_at_return" TEXT,
ADD COLUMN     "kit_item_id" TEXT NOT NULL,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'CHECKED_OUT',
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "asset_kit_checkouts" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'CHECKED_OUT';

-- AlterTable
ALTER TABLE "asset_kit_items" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "asset_category_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "asset_kits" DROP COLUMN "kit_type",
ADD COLUMN     "kit_type" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "asset_reservation_conflicts" DROP COLUMN "resolved",
ADD COLUMN     "resolved_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "asset_reservations" DROP COLUMN "fulfillment_assignment_id",
DROP COLUMN "metadata",
DROP COLUMN "notification_sent",
DROP COLUMN "pickup_location_id",
DROP COLUMN "reserved_for_id",
DROP COLUMN "return_location_id",
ADD COLUMN     "cancellation_reason" TEXT,
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "cancelled_by_id" TEXT,
ADD COLUMN     "confirmation_date" TIMESTAMP(3),
ADD COLUMN     "confirmed_by_id" TEXT,
ADD COLUMN     "reserved_for_org_unit_id" TEXT,
ADD COLUMN     "reserved_for_person_id" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "disposal_approvals" DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "disposal_documents" DROP COLUMN "document_type",
ADD COLUMN     "document_type" TEXT NOT NULL;

-- DropEnum
DROP TYPE "ApprovalStatus";

-- DropEnum
DROP TYPE "DisposalDocumentType";

-- DropEnum
DROP TYPE "DisposalStatus";

-- DropEnum
DROP TYPE "DisposalType";

-- DropEnum
DROP TYPE "KitCheckoutStatus";

-- DropEnum
DROP TYPE "KitType";

-- DropEnum
DROP TYPE "ReservationStatus";

-- CreateIndex
CREATE INDEX "asset_disposals_status_idx" ON "asset_disposals"("status");

-- CreateIndex
CREATE INDEX "asset_disposals_disposal_type_idx" ON "asset_disposals"("disposal_type");

-- CreateIndex
CREATE INDEX "asset_disposals_certificate_number_idx" ON "asset_disposals"("certificate_number");

-- CreateIndex
CREATE INDEX "asset_kit_checkout_items_kit_item_id_idx" ON "asset_kit_checkout_items"("kit_item_id");

-- CreateIndex
CREATE INDEX "asset_kit_checkout_items_status_idx" ON "asset_kit_checkout_items"("status");

-- CreateIndex
CREATE INDEX "asset_kit_checkouts_status_idx" ON "asset_kit_checkouts"("status");

-- CreateIndex
CREATE INDEX "asset_kit_checkouts_checked_out_by_id_idx" ON "asset_kit_checkouts"("checked_out_by_id");

-- CreateIndex
CREATE INDEX "asset_kit_checkouts_expected_return_date_idx" ON "asset_kit_checkouts"("expected_return_date");

-- CreateIndex
CREATE INDEX "asset_kit_items_asset_model_id_idx" ON "asset_kit_items"("asset_model_id");

-- CreateIndex
CREATE INDEX "asset_kits_kit_type_idx" ON "asset_kits"("kit_type");

-- CreateIndex
CREATE INDEX "asset_reservation_conflicts_conflicting_reservation_id_idx" ON "asset_reservation_conflicts"("conflicting_reservation_id");

-- CreateIndex
CREATE INDEX "asset_reservation_conflicts_resolved_at_idx" ON "asset_reservation_conflicts"("resolved_at");

-- CreateIndex
CREATE INDEX "asset_reservations_reserved_for_person_id_idx" ON "asset_reservations"("reserved_for_person_id");

-- CreateIndex
CREATE INDEX "asset_reservations_reserved_for_org_unit_id_idx" ON "asset_reservations"("reserved_for_org_unit_id");

-- CreateIndex
CREATE INDEX "asset_reservations_status_idx" ON "asset_reservations"("status");

-- CreateIndex
CREATE INDEX "disposal_approvals_status_idx" ON "disposal_approvals"("status");

-- CreateIndex
CREATE INDEX "disposal_documents_document_type_idx" ON "disposal_documents"("document_type");

-- CreateIndex
CREATE INDEX "disposal_documents_uploaded_by_id_idx" ON "disposal_documents"("uploaded_by_id");

-- RenameIndex
ALTER INDEX "asset_kit_checkout_items_checkout_id_idx" RENAME TO "asset_kit_checkout_items_kit_checkout_id_idx";

-- RenameIndex
ALTER INDEX "asset_kit_checkouts_assignee_idx" RENAME TO "asset_kit_checkouts_assignee_type_assignee_id_idx";

-- RenameIndex
ALTER INDEX "asset_kit_checkouts_kit_id_idx" RENAME TO "asset_kit_checkouts_asset_kit_id_idx";

-- RenameIndex
ALTER INDEX "asset_kit_items_category_id_idx" RENAME TO "asset_kit_items_asset_category_id_idx";

-- RenameIndex
ALTER INDEX "asset_kit_items_kit_id_idx" RENAME TO "asset_kit_items_asset_kit_id_idx";

-- RenameIndex
ALTER INDEX "asset_reservations_date_range_idx" RENAME TO "asset_reservations_start_date_end_date_idx";
