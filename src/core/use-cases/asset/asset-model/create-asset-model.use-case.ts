/**
 * Create AssetModel Use Case
 */

import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import { AssetModel } from "@/core/domain/entities/asset-model.entity";
import type { IAssetModelRepository } from "@/core/repositories/asset-model.repository.interface";

export interface CreateAssetModelProps {
  assetCategoryId: string;
  vendorId: string;
  name: string;
  code: string;
  description?: string;
  defaultWarrantyMonths?: number | null;
  defaultAttributes?: Record<string, unknown> | null;
}

@injectable()
export class CreateAssetModelUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetModelRepository)
    private readonly assetModelRepository: IAssetModelRepository,
  ) {}

  async execute(props: CreateAssetModelProps): Promise<AssetModel> {
    const existsByCode = await this.assetModelRepository.existsByCode(
      props.code,
    );
    if (existsByCode) {
      throw new Error(`Asset model with code "${props.code}" already exists`);
    }

    const assetModel = AssetModel.create(props);
    const created = await this.assetModelRepository.create(assetModel);
    return created;
  }
}
