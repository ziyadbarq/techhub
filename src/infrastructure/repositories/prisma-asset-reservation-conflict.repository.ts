/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import type { PrismaClient } from "@/generated/prisma";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationConflictRepository } from "@/core/repositories/asset-reservation-conflict.repository.interface";
import { AssetReservationConflict } from "@/core/domain/entities/asset-reservation-conflict.entity";
import { createRepositoryLogger } from "./repository-logger";

@injectable()
export class PrismaAssetReservationConflictRepository
  implements IAssetReservationConflictRepository
{
  private readonly logger = createRepositoryLogger("AssetReservationConflict");

  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async create(
    conflict: AssetReservationConflict,
  ): Promise<AssetReservationConflict> {
    const data = {
      id: conflict.id,
      reservation_id: conflict.reservationId,
      conflicting_reservation_id: conflict.conflictingReservationId,
      detected_at: conflict.detectedAt,
      resolved_at: conflict.resolvedAt,
      resolution_note: conflict.resolutionNote,
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
      where: { reservation_id: reservationId },
      orderBy: { detected_at: "desc" },
    });

    return conflicts.map((c) => this.toDomain(c));
  }

  async findInvolvingReservation(
    reservationId: string,
  ): Promise<AssetReservationConflict[]> {
    const conflicts = await this.prisma.assetReservationConflict.findMany({
      where: {
        OR: [
          { reservation_id: reservationId },
          { conflicting_reservation_id: reservationId },
        ],
      },
      orderBy: { detected_at: "desc" },
    });

    return conflicts.map((c) => this.toDomain(c));
  }

  async findUnresolved(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetReservationConflict[]> {
    const conflicts = await this.prisma.assetReservationConflict.findMany({
      where: { resolved_at: null },
      skip: options?.skip,
      take: options?.take,
      orderBy: { detected_at: "asc" },
    });

    return conflicts.map((c) => this.toDomain(c));
  }

  async findResolved(options?: {
    skip?: number;
    take?: number;
  }): Promise<AssetReservationConflict[]> {
    const conflicts = await this.prisma.assetReservationConflict.findMany({
      where: { resolved_at: { not: null } },
      skip: options?.skip,
      take: options?.take,
      orderBy: { resolved_at: "desc" },
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
        resolved_at: {
          not: null,
          gte: startDate,
          lte: endDate,
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { resolved_at: "desc" },
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
        detected_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      skip: options?.skip,
      take: options?.take,
      orderBy: { detected_at: "desc" },
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
            reservation_id: reservationId,
            conflicting_reservation_id: conflictingReservationId,
          },
          {
            reservation_id: conflictingReservationId,
            conflicting_reservation_id: reservationId,
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
          { reservation_id: reservationId },
          { conflicting_reservation_id: reservationId },
        ],
        resolved_at: null,
      },
    });

    return count > 0;
  }

  async update(
    conflict: AssetReservationConflict,
  ): Promise<AssetReservationConflict> {
    const data = {
      resolved_at: conflict.resolvedAt,
      resolution_note: conflict.resolutionNote,
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
          { reservation_id: reservationId },
          { conflicting_reservation_id: reservationId },
        ],
      },
    });
  }

  async countUnresolved(): Promise<number> {
    return this.prisma.assetReservationConflict.count({
      where: { resolved_at: null },
    });
  }

  async countByReservationId(reservationId: string): Promise<number> {
    return this.prisma.assetReservationConflict.count({
      where: {
        OR: [
          { reservation_id: reservationId },
          { conflicting_reservation_id: reservationId },
        ],
      },
    });
  }

  async countUnresolvedByReservationId(reservationId: string): Promise<number> {
    return this.prisma.assetReservationConflict.count({
      where: {
        OR: [
          { reservation_id: reservationId },
          { conflicting_reservation_id: reservationId },
        ],
        resolved_at: null,
      },
    });
  }

  private toDomain(prismaConflict: {
    id: string;
    reservation_id: string;
    conflicting_reservation_id: string;
    detected_at: Date;
    resolved_at: Date | null;
    resolution_note: string | null;
  }): AssetReservationConflict {
    return AssetReservationConflict.reconstitute({
      id: prismaConflict.id,
      reservationId: prismaConflict.reservation_id,
      conflictingReservationId: prismaConflict.conflicting_reservation_id,
      detectedAt: prismaConflict.detected_at,
      resolvedAt: prismaConflict.resolved_at,
      resolutionNote: prismaConflict.resolution_note,
    });
  }
}
