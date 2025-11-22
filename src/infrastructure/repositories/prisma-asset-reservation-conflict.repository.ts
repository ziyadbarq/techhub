import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationConflictRepository } from "@/core/repositories/asset-reservation-conflict.repository.interface";
import { AssetReservationConflict } from "@/core/domain/entities/asset-reservation-conflict.entity";

@injectable()
export class PrismaAssetReservationConflictRepository
  implements IAssetReservationConflictRepository
{
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(
    conflict: AssetReservationConflict,
  ): Promise<AssetReservationConflict> {
    const data = {
      id: conflict.id,
      reservationId: conflict.reservationId,
      conflictingReservationId: conflict.conflictingReservationId,
      detectedAt: conflict.detectedAt,
      resolvedAt: conflict.resolvedAt,
      resolutionNote: conflict.resolutionNote,
    };

    const created = await this.prisma.assetReservationConflict.create({ data });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<AssetReservationConflict | null> {
    const conflict = await this.prisma.assetReservationConflict.findUnique({
      where: { id },
    });

    return conflict ? this.toDomain(conflict) : null;
  }

  async findByReservationId(
    reservationId: string,
  ): Promise<AssetReservationConflict[]> {
    const conflicts = await this.prisma.assetReservationConflict.findMany({
      where: { reservationId: reservationId },
      orderBy: { detectedAt: "desc" },
    });

    return conflicts.map((c) => this.toDomain(c));
  }

  async findInvolvingReservation(
    reservationId: string,
  ): Promise<AssetReservationConflict[]> {
    const conflicts = await this.prisma.assetReservationConflict.findMany({
      where: {
        OR: [
          { reservationId: reservationId },
          { conflictingReservationId: reservationId },
        ],
      },
      orderBy: { detectedAt: "desc" },
    });

    return conflicts.map((c) => this.toDomain(c));
  }

  async findUnresolved(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetReservationConflict[]> {
    const conflicts = await this.prisma.assetReservationConflict.findMany({
      where: { resolvedAt: null },
      skip: options?.skip,
      take: options?.take,
      orderBy: { detectedAt: "asc" },
    });

    return conflicts.map((c) => this.toDomain(c));
  }

  async findResolved(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetReservationConflict[]> {
    const conflicts = await this.prisma.assetReservationConflict.findMany({
      where: { resolvedAt: { not: null } },
      skip: options?.skip,
      take: options?.take,
      orderBy: { resolvedAt: "desc" },
    });

    return conflicts.map((c) => this.toDomain(c));
  }

  async findResolvedInDateRange(
    startDate: Date,
    endDate: Date,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservationConflict[]> {
    const conflicts = await this.prisma.assetReservationConflict.findMany({
      where: {
        resolvedAt: {
          not: null,
          gte: startDate,
          lte: endDate,
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { resolvedAt: "desc" },
    });

    return conflicts.map((c) => this.toDomain(c));
  }

  async findDetectedInDateRange(
    startDate: Date,
    endDate: Date,
    options?: { skip?: number; take?: number },
  ): Promise<AssetReservationConflict[]> {
    const conflicts = await this.prisma.assetReservationConflict.findMany({
      where: {
        detectedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { detectedAt: "desc" },
    });

    return conflicts.map((c) => this.toDomain(c));
  }

  async conflictExists(
    reservationId: string,
    conflictingReservationId: string,
  ): Promise<boolean> {
    const count = await this.prisma.assetReservationConflict.count({
      where: {
        OR: [
          {
            reservationId: reservationId,
            conflictingReservationId: conflictingReservationId,
          },
          {
            reservationId: conflictingReservationId,
            conflictingReservationId: reservationId,
          },
        ],
      },
    });

    return count > 0;
  }

  async hasUnresolvedConflicts(reservationId: string): Promise<boolean> {
    const count = await this.prisma.assetReservationConflict.count({
      where: {
        OR: [
          { reservationId: reservationId },
          { conflictingReservationId: reservationId },
        ],
        resolvedAt: null,
      },
    });

    return count > 0;
  }

  async update(
    conflict: AssetReservationConflict,
  ): Promise<AssetReservationConflict> {
    const data = {
      resolvedAt: conflict.resolvedAt,
      resolutionNote: conflict.resolutionNote,
    };

    const updated = await this.prisma.assetReservationConflict.update({
      where: { id: conflict.id },
      data,
    });

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.assetReservationConflict.delete({
      where: { id },
    });
  }

  async deleteByReservationId(reservationId: string): Promise<void> {
    await this.prisma.assetReservationConflict.deleteMany({
      where: {
        OR: [
          { reservationId: reservationId },
          { conflictingReservationId: reservationId },
        ],
      },
    });
  }

  async countUnresolved(): Promise<number> {
    return this.prisma.assetReservationConflict.count({
      where: { resolvedAt: null },
    });
  }

  async countByReservationId(reservationId: string): Promise<number> {
    return this.prisma.assetReservationConflict.count({
      where: {
        OR: [
          { reservationId: reservationId },
          { conflictingReservationId: reservationId },
        ],
      },
    });
  }

  async countUnresolvedByReservationId(reservationId: string): Promise<number> {
    return this.prisma.assetReservationConflict.count({
      where: {
        OR: [
          { reservationId: reservationId },
          { conflictingReservationId: reservationId },
        ],
        resolvedAt: null,
      },
    });
  }

  private toDomain(prismaConflict: {
    id: string;
    reservationId: string;
    conflictingReservationId: string;
    detectedAt: Date;
    resolvedAt: Date | null;
    resolutionNote: string | null;
  }): AssetReservationConflict {
    return AssetReservationConflict.reconstitute({
      id: prismaConflict.id,
      reservationId: prismaConflict.reservationId,
      conflictingReservationId: prismaConflict.conflictingReservationId,
      detectedAt: prismaConflict.detectedAt,
      resolvedAt: prismaConflict.resolvedAt,
      resolutionNote: prismaConflict.resolutionNote,
    });
  }
}
