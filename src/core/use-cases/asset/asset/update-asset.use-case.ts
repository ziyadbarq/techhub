/**
 * UpdateAsset Use Case
 * Business Logic: Update an existing asset with validation
 * Automatically creates stock movements when location changes
 */

import { injectable, inject } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { Asset } from "@/core/domain/entities/asset.entity";
import type { ISarConversionService } from "@/core/services/sar-conversion.service.interface";
import type { IAssetMovementService } from "@/core/services/asset-movement.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface UpdateAssetInput {
  id: string;
  assetTag?: string;
  assetModelId?: string | null;
  vendorId?: string | null;
  contractId?: string | null;
  lifecycleStateId?: string | null;
  serialNumber?: string | null;
  purchaseDate?: Date | null;
  purchaseCost?: number | null;
  currency?: string | null;
  depreciationModel?: string | null;
  depreciationStart?: Date | null;
  depreciationEnd?: Date | null;
  currentStockLocationId?: string | null;
  attributes?: Record<string, unknown> | null;
  note?: string | null;
  /** Person ID of the user performing the action (used for movement tracking) */
  performedById?: string;
}

@injectable()
export class UpdateAssetUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
    @inject(DI_TOKENS.ISarConversionService)
    private readonly sarConversionService: ISarConversionService,
    @inject(DI_TOKENS.IAssetMovementService)
    private readonly assetMovementService: IAssetMovementService,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: UpdateAssetInput): Promise<Asset> {
    // Find existing asset
    const asset = await this.assetRepository.findById(input.id);
    if (!asset) {
      throw new NotFoundError(`Asset with ID "${input.id}" not found`);
    }

    // Capture original location for movement tracking
    const originalLocationId = asset.currentStockLocationId;

    // Business Rule: Asset tag must be unique
    if (input.assetTag && input.assetTag !== asset.assetTag) {
      const existingByTag = await this.assetRepository.existsByAssetTag(
        input.assetTag,
        input.id,
      );
      if (existingByTag) {
        throw new ConflictError(
          `Asset tag "${input.assetTag}" already exists. Asset tags must be unique.`,
        );
      }
    }

    // Business Rule: Serial number must be unique if provided
    if (input.serialNumber && input.serialNumber !== asset.serialNumber) {
      const existingBySerial = await this.assetRepository.existsBySerialNumber(
        input.serialNumber,
        input.id,
      );
      if (existingBySerial) {
        throw new ConflictError(
          `Serial number "${input.serialNumber}" already exists. Serial numbers must be unique.`,
        );
      }
    }

    // Check if SAR recalculation is needed (when cost or currency changes)
    const sarCheck = this.sarConversionService.shouldRecalculateSar(
      { amount: input.purchaseCost, currency: input.currency },
      asset.purchaseCost,
      asset.currency,
    );

    let purchaseCostSar: number | null | undefined;
    if (sarCheck.needsConversion) {
      purchaseCostSar = await this.sarConversionService.convertToSarIfNeeded(
        sarCheck.amount,
        sarCheck.currency,
      );
    }

    // Update the entity (validation happens in entity method)
    asset.update({
      assetTag: input.assetTag,
      assetModelId: input.assetModelId,
      vendorId: input.vendorId,
      contractId: input.contractId,
      lifecycleStateId: input.lifecycleStateId,
      serialNumber: input.serialNumber,
      purchaseDate: input.purchaseDate,
      purchaseCost: input.purchaseCost,
      purchaseCostSar,
      currency: input.currency,
      depreciationModel: input.depreciationModel,
      depreciationStart: input.depreciationStart,
      depreciationEnd: input.depreciationEnd,
      currentStockLocationId: input.currentStockLocationId,
      attributes: input.attributes,
      note: input.note,
    });

    // Persist changes
    const updatedAsset = await this.assetRepository.update(asset);

    // Create automatic stock movement if location changed
    // Only create movement if currentStockLocationId was explicitly provided in input
    if (
      input.currentStockLocationId !== undefined &&
      input.performedById &&
      originalLocationId !== input.currentStockLocationId
    ) {
      try {
        const result = await this.assetMovementService.syncAssetLocation({
          assetId: updatedAsset.id,
          oldLocationId: originalLocationId,
          newLocationId: input.currentStockLocationId,
          performedById: input.performedById,
          source: "LOCATION_CHANGE",
          sourceReferenceType: "Asset",
          sourceReferenceId: updatedAsset.id,
          reason: "Asset location updated",
        });

        if (result.movement) {
          this.logger.debug("Created automatic movement for location change", {
            assetId: updatedAsset.id,
            movementType: result.movementType,
            from: originalLocationId,
            to: input.currentStockLocationId,
          });
        }
      } catch (error) {
        // Log but don't fail asset update if movement creation fails
        this.logger.warn(
          "Failed to create automatic movement for location change",
          {
            assetId: updatedAsset.id,
            error: error instanceof Error ? error.message : String(error),
          },
        );
      }
    }

    return updatedAsset;
  }
}
