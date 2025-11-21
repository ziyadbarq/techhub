-- CreateEnum
CREATE TYPE "KitType" AS ENUM ('NEW_HIRE', 'CONTRACTOR', 'EXECUTIVE', 'PROJECT', 'TEMPORARY', 'OTHER');
CREATE TYPE "KitCheckoutStatus" AS ENUM ('CHECKED_OUT', 'PARTIALLY_RETURNED', 'RETURNED', 'CANCELLED');

-- AssetKit: Kit definition (template)
CREATE TABLE "asset_kits" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT,
  "kit_type" "KitType",
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX "asset_kits_name_key" ON "asset_kits"("name");
CREATE UNIQUE INDEX "asset_kits_code_key" ON "asset_kits"("code");
CREATE INDEX "asset_kits_code_idx" ON "asset_kits"("code");
CREATE INDEX "asset_kits_is_active_idx" ON "asset_kits"("is_active");

-- AssetKitItem: Items in kit template
CREATE TABLE "asset_kit_items" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "asset_kit_id" TEXT NOT NULL,
  "asset_category_id" TEXT NOT NULL,
  "asset_model_id" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "is_required" BOOLEAN NOT NULL DEFAULT true,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "asset_kit_items_asset_kit_id_fkey" FOREIGN KEY ("asset_kit_id") REFERENCES "asset_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "asset_kit_items_asset_category_id_fkey" FOREIGN KEY ("asset_category_id") REFERENCES "asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "asset_kit_items_asset_model_id_fkey" FOREIGN KEY ("asset_model_id") REFERENCES "asset_models"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "asset_kit_items_kit_id_idx" ON "asset_kit_items"("asset_kit_id");
CREATE INDEX "asset_kit_items_category_id_idx" ON "asset_kit_items"("asset_category_id");

-- AssetKitCheckout: Actual kit instance checked out
CREATE TABLE "asset_kit_checkouts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "asset_kit_id" TEXT NOT NULL,
  "assignee_type" TEXT NOT NULL,
  "assignee_id" TEXT NOT NULL,
  "checkout_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expected_return_date" TIMESTAMP(3),
  "actual_return_date" TIMESTAMP(3),
  "status" "KitCheckoutStatus" NOT NULL DEFAULT 'CHECKED_OUT',
  "checked_out_by_id" TEXT NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "asset_kit_checkouts_asset_kit_id_fkey" FOREIGN KEY ("asset_kit_id") REFERENCES "asset_kits"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "asset_kit_checkouts_checked_out_by_id_fkey" FOREIGN KEY ("checked_out_by_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "asset_kit_checkouts_kit_id_idx" ON "asset_kit_checkouts"("asset_kit_id");
CREATE INDEX "asset_kit_checkouts_assignee_idx" ON "asset_kit_checkouts"("assignee_type", "assignee_id");
CREATE INDEX "asset_kit_checkouts_status_idx" ON "asset_kit_checkouts"("status");
CREATE INDEX "asset_kit_checkouts_checkout_date_idx" ON "asset_kit_checkouts"("checkout_date");

-- AssetKitCheckoutItem: Individual assets in checkout
CREATE TABLE "asset_kit_checkout_items" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "kit_checkout_id" TEXT NOT NULL,
  "asset_id" TEXT NOT NULL,
  "asset_assignment_id" TEXT,
  "is_returned" BOOLEAN NOT NULL DEFAULT false,
  "return_date" TIMESTAMP(3),
  "return_condition" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "asset_kit_checkout_items_kit_checkout_id_fkey" FOREIGN KEY ("kit_checkout_id") REFERENCES "asset_kit_checkouts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "asset_kit_checkout_items_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "asset_kit_checkout_items_asset_assignment_id_fkey" FOREIGN KEY ("asset_assignment_id") REFERENCES "asset_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "asset_kit_checkout_items_checkout_id_idx" ON "asset_kit_checkout_items"("kit_checkout_id");
CREATE INDEX "asset_kit_checkout_items_asset_id_idx" ON "asset_kit_checkout_items"("asset_id");
CREATE INDEX "asset_kit_checkout_items_is_returned_idx" ON "asset_kit_checkout_items"("is_returned");
