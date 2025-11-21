/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationRepository } from "@/core/repositories/asset-reservation.repository.interface";
import {
  AssetReservation,
  type ReservationStatus,
} from "@/core/domain/entities/asset-reservation.entity";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaAssetReservationRepository
  implements IAssetReservationRepository
{
  private readonly logger = createRepositoryLogger("AssetReservation");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(reservation: AssetReservation): Promise<AssetReservation> {
    const data = {
      id: reservation.id,
      asset_id: reservation.assetId,
      reserved_for_person_id: reservation.reservedForPersonId,
      reserved_for_org_unit_id: reservation.reservedForOrgUnitId,
      reserved_by_id: reservation.reservedById,
      start_date: reservation.startDate,
      end_date: reservation.endDate,
      status: reservation.status,
      purpose: reservation.purpose,
      note: reservation.note,
      confirmation_date: reservation.confirmationDate,
      confirmed_by_id: reservation.confirmedById,
      cancellation_reason: reservation.cancellationReason,
      cancelled_at: reservation.cancelledAt,
      cancelled_by_id: reservation.cancelledById,
      created_at: reservation.createdAt,
      updated_at: reservation.updatedAt,
    };

    const created = await this.prisma.assetReservation.create({ data });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<AssetReservation | null> {
    const reservation = await this.prisma.assetReservation.findUnique({
      where: { id },
    });

    return reservation ? this.toDomain(reservation) : null;
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    orderBy?: "startDate" | "endDate" | "createdAt";
    order?: "asc" | "desc";
  }): Promise<AssetReservation[]> {
    const orderByMap = {
      startDate: "start_date",
      endDate: "end_date",
      createdAt: "created_at",
    };

    const reservations = await this.prisma.assetReservation.findMany({
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy
        ? { [orderByMap[options.orderBy]]: options.order ?? "asc" }
        : undefined,
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findByAssetId(
    assetId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]> {
    const reservations = await this.prisma.assetReservation.findMany({
      where: { asset_id: assetId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { start_date: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findByStatus(
    status: ReservationStatus,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]> {
    const reservations = await this.prisma.assetReservation.findMany({
      where: { status },
      skip: options?.skip,
      take: options?.take,
      orderBy: { start_date: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findByPersonId(
    personId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]> {
    const reservations = await this.prisma.assetReservation.findMany({
      where: { reserved_for_person_id: personId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { start_date: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findByOrgUnitId(
    orgUnitId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]> {
    const reservations = await this.prisma.assetReservation.findMany({
      where: { reserved_for_org_unit_id: orgUnitId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { start_date: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findByReservedBy(
    reservedById: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]> {
    const reservations = await this.prisma.assetReservation.findMany({
      where: { reserved_by_id: reservedById },
      skip: options?.skip,
      take: options?.take,
      orderBy: { created_at: "desc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findPending(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetReservation[]> {
    const reservations = await this.prisma.assetReservation.findMany({
      where: { status: "PENDING" },
      skip: options?.skip,
      take: options?.take,
      orderBy: { created_at: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findConfirmed(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetReservation[]> {
    const reservations = await this.prisma.assetReservation.findMany({
      where: { status: "CONFIRMED" },
      skip: options?.skip,
      take: options?.take,
      orderBy: { start_date: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findActive(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetReservation[]> {
    const reservations = await this.prisma.assetReservation.findMany({
      where: { status: "ACTIVE" },
      skip: options?.skip,
      take: options?.take,
      orderBy: { start_date: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findUpcoming(
    daysAhead?: number,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]> {
    const now = new Date();
    const futureDate = new Date();
    if (daysAhead) {
      futureDate.setDate(futureDate.getDate() + daysAhead);
    } else {
      futureDate.setDate(futureDate.getDate() + 30); // Default 30 days
    }

    const reservations = await this.prisma.assetReservation.findMany({
      where: {
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        start_date: {
          gte: now,
          lte: futureDate,
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { start_date: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findStartingInDateRange(
    startDate: Date,
    endDate: Date,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]> {
    const reservations = await this.prisma.assetReservation.findMany({
      where: {
        start_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { start_date: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findOverlappingWithDateRange(
    startDate: Date,
    endDate: Date,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]> {
    const reservations = await this.prisma.assetReservation.findMany({
      where: {
        AND: [{ start_date: { lt: endDate } }, { end_date: { gt: startDate } }],
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { start_date: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findAssetReservationsOverlapping(
    assetId: string,
    startDate: Date,
    endDate: Date,
    excludeReservationId?: string,
  ): Promise<AssetReservation[]> {
    const where: {
      asset_id: string;
      status: { in: ReservationStatus[] };
      AND: Array<Record<string, unknown>>;
      id?: { not: string };
    } = {
      asset_id: assetId,
      status: {
        in: ["PENDING", "CONFIRMED", "ACTIVE"],
      },
      AND: [{ start_date: { lt: endDate } }, { end_date: { gt: startDate } }],
    };

    if (excludeReservationId) {
      where.id = { not: excludeReservationId };
    }

    const reservations = await this.prisma.assetReservation.findMany({
      where,
      orderBy: { start_date: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findByConfirmedBy(
    confirmedById: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]> {
    const reservations = await this.prisma.assetReservation.findMany({
      where: { confirmed_by_id: confirmedById },
      skip: options?.skip,
      take: options?.take,
      orderBy: { confirmation_date: "desc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findReadyToActivate(): Promise<AssetReservation[]> {
    const now = new Date();

    const reservations = await this.prisma.assetReservation.findMany({
      where: {
        status: "CONFIRMED",
        start_date: { lte: now },
      },
      orderBy: { start_date: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findReadyToComplete(): Promise<AssetReservation[]> {
    const now = new Date();

    const reservations = await this.prisma.assetReservation.findMany({
      where: {
        status: "ACTIVE",
        end_date: { lte: now },
      },
      orderBy: { end_date: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async hasActiveReservation(assetId: string): Promise<boolean> {
    const count = await this.prisma.assetReservation.count({
      where: {
        asset_id: assetId,
        status: "ACTIVE",
      },
    });

    return count > 0;
  }

  async hasReservationInDateRange(
    assetId: string,
    startDate: Date,
    endDate: Date,
    excludeReservationId?: string,
  ): Promise<boolean> {
    const where: {
      asset_id: string;
      status: { in: ReservationStatus[] };
      AND: Array<Record<string, unknown>>;
      id?: { not: string };
    } = {
      asset_id: assetId,
      status: {
        in: ["PENDING", "CONFIRMED", "ACTIVE"],
      },
      AND: [{ start_date: { lt: endDate } }, { end_date: { gt: startDate } }],
    };

    if (excludeReservationId) {
      where.id = { not: excludeReservationId };
    }

    const count = await this.prisma.assetReservation.count({ where });
    return count > 0;
  }

  async update(reservation: AssetReservation): Promise<AssetReservation> {
    const data = {
      end_date: reservation.endDate,
      status: reservation.status,
      note: reservation.note,
      confirmation_date: reservation.confirmationDate,
      confirmed_by_id: reservation.confirmedById,
      cancellation_reason: reservation.cancellationReason,
      cancelled_at: reservation.cancelledAt,
      cancelled_by_id: reservation.cancelledById,
      updated_at: reservation.updatedAt,
    };

    const updated = await this.prisma.assetReservation.update({
      where: { id: reservation.id },
      data,
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.assetReservation.delete({
      where: { id },
    });
  }

  async countByStatus(status: ReservationStatus): Promise<number> {
    return this.prisma.assetReservation.count({
      where: { status },
    });
  }

  async countActive(): Promise<number> {
    return this.prisma.assetReservation.count({
      where: { status: "ACTIVE" },
    });
  }

  async countUpcoming(daysAhead?: number): Promise<number> {
    const now = new Date();
    const futureDate = new Date();
    if (daysAhead) {
      futureDate.setDate(futureDate.getDate() + daysAhead);
    } else {
      futureDate.setDate(futureDate.getDate() + 30);
    }

    return this.prisma.assetReservation.count({
      where: {
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        start_date: {
          gte: now,
          lte: futureDate,
        },
      },
    });
  }

  async count(): Promise<number> {
    return this.prisma.assetReservation.count();
  }

  private toDomain(prismaReservation: {
    id: string;
    asset_id: string;
    reserved_for_person_id: string | null;
    reserved_for_org_unit_id: string | null;
    reserved_by_id: string;
    start_date: Date;
    end_date: Date;
    status: string;
    purpose: string | null;
    note: string | null;
    confirmation_date: Date | null;
    confirmed_by_id: string | null;
    cancellation_reason: string | null;
    cancelled_at: Date | null;
    cancelled_by_id: string | null;
    created_at: Date;
    updated_at: Date;
  }): AssetReservation {
    return AssetReservation.reconstitute({
      id: prismaReservation.id,
      assetId: prismaReservation.asset_id,
      reservedForPersonId: prismaReservation.reserved_for_person_id,
      reservedForOrgUnitId: prismaReservation.reserved_for_org_unit_id,
      reservedById: prismaReservation.reserved_by_id,
      startDate: prismaReservation.start_date,
      endDate: prismaReservation.end_date,
      status: prismaReservation.status as ReservationStatus,
      purpose: prismaReservation.purpose,
      note: prismaReservation.note,
      confirmationDate: prismaReservation.confirmation_date,
      confirmedById: prismaReservation.confirmed_by_id,
      cancellationReason: prismaReservation.cancellation_reason,
      cancelledAt: prismaReservation.cancelled_at,
      cancelledById: prismaReservation.cancelled_by_id,
      createdAt: prismaReservation.created_at,
      updatedAt: prismaReservation.updated_at,
    });
  }
}
