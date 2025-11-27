/**
 * Asset Reservation Factory
 *
 * Type-safe factory for generating AssetReservation test data
 */

import type { Prisma, PrismaClient } from "@/generated/prisma/server";
import {
  getRelativeDate,
  optionalConnect,
  requireConnect,
} from "../seed-utils.js";

export interface AssetReservationFactoryOptions {
  assetId: string;
  reservedForPersonId?: string;
  reservedForOrgUnitId?: string;
  reservedById: string;
  startDate: Date;
  endDate: Date;
  purpose?: string;
  status: "PENDING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  note?: string;
  confirmedById?: string;
  confirmationDate?: Date;
}

export class AssetReservationFactory {
  private options: AssetReservationFactoryOptions;

  constructor(options: AssetReservationFactoryOptions) {
    this.options = options;
  }

  build(): Prisma.AssetReservationCreateInput {
    const data = {
      ...requireConnect(this.options.assetId, "asset"),
      ...requireConnect(this.options.reservedById, "reservedBy"),
      ...optionalConnect(this.options.reservedForPersonId, "reservedForPerson"),
      ...optionalConnect(
        this.options.reservedForOrgUnitId,
        "reservedForOrgUnit",
      ),
      ...optionalConnect(this.options.confirmedById, "confirmedBy"),
      startDate: this.options.startDate,
      endDate: this.options.endDate,
      purpose: this.options.purpose,
      status: this.options.status,
      note: this.options.note,
      confirmationDate: this.options.confirmationDate,
    } satisfies Prisma.AssetReservationCreateInput;

    return data;
  }

  async create(prisma: PrismaClient) {
    return prisma.assetReservation.create({
      data: this.build(),
    });
  }

  /**
   * Create future reservation
   */
  static createFuture(
    assetId: string,
    reservedById: string,
    reservedForPersonId: string,
    startDaysFromNow: number,
    durationDays: number,
    purpose: string,
  ): AssetReservationFactory {
    return new AssetReservationFactory({
      assetId,
      reservedById,
      reservedForPersonId,
      startDate: getRelativeDate(startDaysFromNow),
      endDate: getRelativeDate(startDaysFromNow + durationDays),
      purpose,
      status: "CONFIRMED",
    });
  }
}
