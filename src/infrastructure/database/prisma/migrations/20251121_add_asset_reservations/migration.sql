-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED', 'OVERDUE');

-- AssetReservation: Future asset bookings
CREATE TABLE "asset_reservations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "asset_id" TEXT NOT NULL,
  "reserved_by_id" TEXT NOT NULL,
  "reserved_for_id" TEXT,
  "start_date" TIMESTAMP(3) NOT NULL,
  "end_date" TIMESTAMP(3) NOT NULL,
  "purpose" TEXT,
  "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
  "pickup_location_id" TEXT,
  "return_location_id" TEXT,
  "notification_sent" BOOLEAN NOT NULL DEFAULT false,
  "fulfillment_assignment_id" TEXT,
  "note" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "asset_reservations_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "asset_reservations_reserved_by_id_fkey" FOREIGN KEY ("reserved_by_id") REFERENCES "persons"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "asset_reservations_reserved_for_id_fkey" FOREIGN KEY ("reserved_for_id") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "asset_reservations_pickup_location_id_fkey" FOREIGN KEY ("pickup_location_id") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "asset_reservations_return_location_id_fkey" FOREIGN KEY ("return_location_id") REFERENCES "stock_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "asset_reservations_fulfillment_assignment_id_fkey" FOREIGN KEY ("fulfillment_assignment_id") REFERENCES "asset_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "asset_reservations_asset_id_idx" ON "asset_reservations"("asset_id");
CREATE INDEX "asset_reservations_reserved_by_id_idx" ON "asset_reservations"("reserved_by_id");
CREATE INDEX "asset_reservations_reserved_for_id_idx" ON "asset_reservations"("reserved_for_id");
CREATE INDEX "asset_reservations_status_idx" ON "asset_reservations"("status");
CREATE INDEX "asset_reservations_start_date_idx" ON "asset_reservations"("start_date");
CREATE INDEX "asset_reservations_end_date_idx" ON "asset_reservations"("end_date");
CREATE INDEX "asset_reservations_date_range_idx" ON "asset_reservations"("start_date", "end_date");

-- AssetReservationConflict: Tracks conflicts (optional - for audit)
CREATE TABLE "asset_reservation_conflicts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reservation_id" TEXT NOT NULL,
  "conflicting_reservation_id" TEXT NOT NULL,
  "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved" BOOLEAN NOT NULL DEFAULT false,
  "resolution_note" TEXT,
  CONSTRAINT "asset_reservation_conflicts_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "asset_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "asset_reservation_conflicts_conflicting_reservation_id_fkey" FOREIGN KEY ("conflicting_reservation_id") REFERENCES "asset_reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "asset_reservation_conflicts_reservation_id_idx" ON "asset_reservation_conflicts"("reservation_id");
