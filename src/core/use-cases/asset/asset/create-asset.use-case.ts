/**
 * CreateAsset Use Case
 * Business Logic: Create a new asset with validation
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import {
  Asset,
  type CreateAssetProps,
} from "@/core/domain/entities/asset.entity";

@injectable()
export class CreateAssetUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
  ) {}

  async execute(props: CreateAssetProps): Promise<Asset> {
    // Business Rule: Asset tag must be unique
    const existingByTag = await this.assetRepository.existsByAssetTag(
      props.assetTag,
    );
    if (existingByTag) {
      throw new Error(
        `Asset tag "${props.assetTag}" already exists. Asset tags must be unique.`,
      );
    }

    // Business Rule: Serial number must be unique if provided
    if (props.serialNumber) {
      const existingBySerial = await this.assetRepository.existsBySerialNumber(
        props.serialNumber,
      );
      if (existingBySerial) {
        throw new Error(
          `Serial number "${props.serialNumber}" already exists. Serial numbers must be unique.`,
        );
      }
    }

    // Create the entity (validation happens in entity factory)
    const asset = Asset.create(props);

    // Persist to database
    return await this.assetRepository.create(asset);
  }
}
