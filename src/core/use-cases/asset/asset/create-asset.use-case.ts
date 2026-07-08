/**
 * CreateAsset Use Case
 * Business Logic: Create a new asset with validation
 * Automatically creates stock movement when asset is placed in a stock location
 */

import { injectable, inject } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import {
  Asset,
  type CreateAssetProps,
} from "@/core/domain/entities/asset.entity";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";
import type { ISarConversionService } from "@/core/services/sar-conversion.service.interface";
import type { IAssetMovementService } from "@/core/services/asset-movement.service.interface";
import type { ILoggerService } from "@/core/services/logger.service.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

@injectable()
export class CreateAssetUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
    @inject(DI_TOKENS.ICodeGeneratorService)
    private readonly codeGenerator: ICodeGeneratorService,
    @inject(DI_TOKENS.ISarConversionService)
    private readonly sarConversionService: ISarConversionService,
    @inject(DI_TOKENS.IAssetMovementService)
    private readonly assetMovementService: IAssetMovementService,
    @inject(DI_TOKENS.ILoggerService)
    private readonly logger: ILoggerService,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(props: CreateAssetProps): Promise<Asset> {
    // Auto-generate asset tag if not provided or empty
    const assetTag =
      props.assetTag ||
      (await this.codeGenerator.generateCode("ASSET", "ASSET"));

    // Business Rule: Asset tag must be unique
    const existingByTag = await this.assetRepository.existsByAssetTag(assetTag);
    if (existingByTag) {
      throw new ConflictError(
        `Asset tag "${assetTag}" already exists. Asset tags must be unique.`,
      );
    }

    // Business Rule: Serial number must be unique if provided
    if (props.serialNumber) {
      const existingBySerial = await this.assetRepository.existsBySerialNumber(
        props.serialNumber,
      );
      if (existingBySerial) {
        throw new ConflictError(
          `Serial number "${props.serialNumber}" already exists. Serial numbers must be unique.`,
        );
      }
    }

    // Calculate SAR snapshot for purchase cost
    const purchaseCostSar =
      await this.sarConversionService.convertToSarIfNeeded(
        props.purchaseCost,
        props.currency,
      );

    // Create the entity (validation happens in entity factory)
    const asset = Asset.create({ ...props, assetTag, purchaseCostSar });

    // Persist to database
    const createdAsset = await this.assetRepository.create(asset);

    // Create automatic stock movement if asset is placed in a stock location
    if (props.currentStockLocationId && props.performedById) {
      try {
        await this.assetMovementService.recordAssetReceived({
          assetId: createdAsset.id,
          stockLocationId: props.currentStockLocationId,
          performedById: props.performedById,
          reason: "Asset created in inventory",
          source: "SYSTEM",
          sourceReferenceType: "Asset",
          sourceReferenceId: createdAsset.id,
        });
        this.logger.debug("Created automatic IN movement for new asset", {
          assetId: createdAsset.id,
          assetTag: createdAsset.assetTag,
          stockLocationId: props.currentStockLocationId,
        });
      } catch (error) {
        // Log but don't fail asset creation if movement creation fails
        this.logger.warn("Failed to create automatic movement for new asset", {
          assetId: createdAsset.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return createdAsset;
  }
}
