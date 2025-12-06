import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetReservationRepository } from "@/core/repositories/asset-reservation.repository.interface";
import type { IAssetReservationConflictRepository } from "@/core/repositories/asset-reservation-conflict.repository.interface";
import type { IAssetAssignmentRepository } from "@/core/repositories/asset-assignment.repository.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";
import { AssetReservation } from "@/core/domain/entities/asset-reservation.entity";
import { LogExecution } from "@/lib/decorators";

export interface CreateReservationRequest {
  assetId: string;
  reservedForPersonId?: string;
  reservedForOrgUnitId?: string;
  reservedById: string;
  startDate: Date;
  endDate: Date;
  purpose?: string;
  notes?: string;
}

@injectable()
export class CreateReservationUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetReservationRepository)
    private readonly reservationRepository: IAssetReservationRepository,
    @inject(DI_TOKENS.IAssetReservationConflictRepository)
    private readonly conflictRepository: IAssetReservationConflictRepository,
    @inject(DI_TOKENS.IAssetAssignmentRepository)
    private readonly assignmentRepository: IAssetAssignmentRepository,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  @LogExecution("reservation.create")
  async execute(request: CreateReservationRequest): Promise<AssetReservation> {
    // Business rule validation
    if (request.endDate <= request.startDate) {
      throw new Error("End date must be after start date");
    }

    // CRITICAL: Block reservation if asset already has an active assignment
    const activeAssignments = await this.assignmentRepository.findActiveByAsset(
      request.assetId,
    );

    if (activeAssignments.length > 0) {
      this.logger.warn("Reservation blocked - asset has active assignment", {
        assetId: request.assetId,
        activeAssignmentCount: activeAssignments.length,
      });

      throw new Error(
        "This asset is currently assigned and cannot be reserved. Please return the asset to inventory before creating a reservation.",
      );
    }

    // CRITICAL: Check if asset has ANY active reservation (strict one-at-a-time policy)
    // First check: Get ALL reservations for this asset
    const existingReservations = await this.reservationRepository.findByAssetId(
      request.assetId,
    );

    // Block if there's ANY active reservation, regardless of dates
    const activeReservations = existingReservations.filter(
      (r) =>
        r.status === "PENDING" ||
        r.status === "CONFIRMED" ||
        r.status === "ACTIVE",
    );

    if (activeReservations.length > 0) {
      const conflictDetails = activeReservations
        .map(
          (r) =>
            `${r.startDate.toISOString().split("T")[0]} to ${r.endDate.toISOString().split("T")[0]} (${r.status})`,
        )
        .join(", ");

      this.logger.warn("Reservation blocked - asset has active reservation", {
        assetId: request.assetId,
        requestedStart: request.startDate,
        requestedEnd: request.endDate,
        activeReservationCount: activeReservations.length,
      });

      throw new Error(
        `This asset already has an active reservation and cannot be reserved again. Existing reservation: ${conflictDetails}`,
      );
    }

    // Create the reservation (only if no conflicts)
    const reservation = AssetReservation.create(
      {
        assetId: request.assetId,
        reservedForPersonId: request.reservedForPersonId,
        reservedForOrgUnitId: request.reservedForOrgUnitId,
        reservedById: request.reservedById,
        startDate: request.startDate,
        endDate: request.endDate,
        purpose: request.purpose,
        note: request.notes,
      },
      this.idGenerator,
    );

    const createdReservation =
      await this.reservationRepository.create(reservation);

    return createdReservation;
  }
}
