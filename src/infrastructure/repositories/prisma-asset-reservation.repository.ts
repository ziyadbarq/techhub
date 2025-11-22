import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationRepository } from "@/core/repositories/asset-reservation.repository.interface";
import {
  AssetReservation,
  type ReservationStatus,
} from "@/core/domain/entities/asset-reservation.entity";

@injectable()
export class PrismaAssetReservationRepository
  implements IAssetReservationRepository
{
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(reservation: AssetReservation): Promise<AssetReservation> {
    const data = {
      id: reservation.id,
      assetId: reservation.assetId,
      reservedForPersonId: reservation.reservedForPersonId,
      reservedForOrgUnitId: reservation.reservedForOrgUnitId,
      reservedById: reservation.reservedById,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      status: reservation.status,
      purpose: reservation.purpose,
      note: reservation.note,
      confirmationDate: reservation.confirmationDate,
      confirmedById: reservation.confirmedById,
      cancellationReason: reservation.cancellationReason,
      cancelledAt: reservation.cancelledAt,
      cancelledById: reservation.cancelledById,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
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
      startDate: "startDate",
      endDate: "endDate",
      createdAt: "createdAt",
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
      where: { assetId: assetId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { startDate: "asc" },
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
      orderBy: { startDate: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findByPersonId(
    personId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]> {
    const reservations = await this.prisma.assetReservation.findMany({
      where: { reservedForPersonId: personId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { startDate: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findByOrgUnitId(
    orgUnitId: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]> {
    const reservations = await this.prisma.assetReservation.findMany({
      where: { reservedForOrgUnitId: orgUnitId },
      skip: options?.skip,
      take: options?.take,
      orderBy: { startDate: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findByReservedBy(
    reservedById: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]> {
    const reservations = await this.prisma.assetReservation.findMany({
      where: { reservedById: reservedById },
      skip: options?.skip,
      take: options?.take,
      orderBy: { createdAt: "desc" },
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
      orderBy: { createdAt: "asc" },
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
      orderBy: { startDate: "asc" },
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
      orderBy: { startDate: "asc" },
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
        startDate: {
          gte: now,
          lte: futureDate,
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { startDate: "asc" },
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
        startDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { startDate: "asc" },
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
        AND: [{ startDate: { lt: endDate } }, { endDate: { gt: startDate } }],
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { startDate: "asc" },
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
      assetId: string;
      status: { in: ReservationStatus[] };
      AND: Array<Record<string, unknown>>;
      id?: { not: string };
    } = {
      assetId: assetId,
      status: {
        in: ["PENDING", "CONFIRMED", "ACTIVE"],
      },
      AND: [{ startDate: { lt: endDate } }, { endDate: { gt: startDate } }],
    };

    if (excludeReservationId) {
      where.id = { not: excludeReservationId };
    }

    const reservations = await this.prisma.assetReservation.findMany({
      where,
      orderBy: { startDate: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findByConfirmedBy(
    confirmedById: string,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservation[]> {
    const reservations = await this.prisma.assetReservation.findMany({
      where: { confirmedById: confirmedById },
      skip: options?.skip,
      take: options?.take,
      orderBy: { confirmationDate: "desc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findReadyToActivate(): Promise<AssetReservation[]> {
    const now = new Date();

    const reservations = await this.prisma.assetReservation.findMany({
      where: {
        status: "CONFIRMED",
        startDate: { lte: now },
      },
      orderBy: { startDate: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async findReadyToComplete(): Promise<AssetReservation[]> {
    const now = new Date();

    const reservations = await this.prisma.assetReservation.findMany({
      where: {
        status: "ACTIVE",
        endDate: { lte: now },
      },
      orderBy: { endDate: "asc" },
    });

    return reservations.map((r) => this.toDomain(r));
  }

  async hasActiveReservation(assetId: string): Promise<boolean> {
    const count = await this.prisma.assetReservation.count({
      where: {
        assetId: assetId,
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
      assetId: string;
      status: { in: ReservationStatus[] };
      AND: Array<Record<string, unknown>>;
      id?: { not: string };
    } = {
      assetId: assetId,
      status: {
        in: ["PENDING", "CONFIRMED", "ACTIVE"],
      },
      AND: [{ startDate: { lt: endDate } }, { endDate: { gt: startDate } }],
    };

    if (excludeReservationId) {
      where.id = { not: excludeReservationId };
    }

    const count = await this.prisma.assetReservation.count({ where });
    return count > 0;
  }

  async update(reservation: AssetReservation): Promise<AssetReservation> {
    const data = {
      endDate: reservation.endDate,
      status: reservation.status,
      note: reservation.note,
      confirmationDate: reservation.confirmationDate,
      confirmedById: reservation.confirmedById,
      cancellationReason: reservation.cancellationReason,
      cancelledAt: reservation.cancelledAt,
      cancelledById: reservation.cancelledById,
      updatedAt: reservation.updatedAt,
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
        startDate: {
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
    assetId: string;
    reservedForPersonId: string | null;
    reservedForOrgUnitId: string | null;
    reservedById: string;
    startDate: Date;
    endDate: Date;
    status: string;
    purpose: string | null;
    note: string | null;
    confirmationDate: Date | null;
    confirmedById: string | null;
    cancellationReason: string | null;
    cancelledAt: Date | null;
    cancelledById: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): AssetReservation {
    return AssetReservation.reconstitute({
      id: prismaReservation.id,
      assetId: prismaReservation.assetId,
      reservedForPersonId: prismaReservation.reservedForPersonId,
      reservedForOrgUnitId: prismaReservation.reservedForOrgUnitId,
      reservedById: prismaReservation.reservedById,
      startDate: prismaReservation.startDate,
      endDate: prismaReservation.endDate,
      status: prismaReservation.status as ReservationStatus,
      purpose: prismaReservation.purpose,
      note: prismaReservation.note,
      confirmationDate: prismaReservation.confirmationDate,
      confirmedById: prismaReservation.confirmedById,
      cancellationReason: prismaReservation.cancellationReason,
      cancelledAt: prismaReservation.cancelledAt,
      cancelledById: prismaReservation.cancelledById,
      createdAt: prismaReservation.createdAt,
      updatedAt: prismaReservation.updatedAt,
    });
  }
}
