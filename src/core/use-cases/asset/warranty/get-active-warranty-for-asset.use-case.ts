/**
 * GetActiveWarrantyForAsset Use Case
 * Business Logic: Get the currently active warranty for a specific asset
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IWarrantyRepository } from "@/core/repositories/warranty.repository.interface";
import type { Warranty } from "@/core/domain/entities/warranty.entity";

@injectable()
export class GetActiveWarrantyForAssetUseCase {
  constructor(
    @inject(DI_TOKENS.IWarrantyRepository)
    private readonly warrantyRepository: IWarrantyRepository,
  ) {}

  async execute(assetId: string): Promise<Warranty | null> {
    return await this.warrantyRepository.findActiveByAssetId(assetId);
  }
}
