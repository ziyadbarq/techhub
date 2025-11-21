/**
 * ListWarrantiesByAsset Use Case
 * Business Logic: Retrieve all warranties for a specific asset
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IWarrantyRepository } from "@/core/repositories/warranty.repository.interface";
import type { Warranty } from "@/core/domain/entities/warranty.entity";

@injectable()
export class ListWarrantiesByAssetUseCase {
  constructor(
    @inject(DI_TOKENS.IWarrantyRepository)
    private readonly warrantyRepository: IWarrantyRepository,
  ) {}

  async execute(assetId: string): Promise<Warranty[]> {
    return await this.warrantyRepository.findByAssetId(assetId);
  }
}
