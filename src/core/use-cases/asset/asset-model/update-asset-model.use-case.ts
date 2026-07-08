/**
 * Update AssetModel Use Case
 */

import { inject, injectable } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import type { AssetModel } from "@/core/domain/entities/asset-model.entity";
import type { IAssetModelRepository } from "@/core/repositories/asset-model.repository.interface";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface UpdateAssetModelProps {
  id: string;
  name?: string;
  code?: string;
  description?: string | null;
  assetCategoryId?: string;
  vendorId?: string;
  defaultWarrantyMonths?: number | null;
  defaultAttributes?: Record<string, unknown> | null;
}

@injectable()
export class UpdateAssetModelUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetModelRepository)
    private readonly assetModelRepository: IAssetModelRepository,
  ) {}

  async execute(props: UpdateAssetModelProps): Promise<AssetModel> {
    const assetModel = await this.assetModelRepository.findById(props.id);
    if (!assetModel) {
      throw new NotFoundError(`Asset model with ID "${props.id}" not found`);
    }

    if (props.code && props.code !== assetModel.code) {
      const existsByCode = await this.assetModelRepository.existsByCode(
        props.code,
        props.id,
      );
      if (existsByCode) {
        throw new ConflictError(
          `Asset model with code "${props.code}" already exists`,
        );
      }
    }

    assetModel.update({
      name: props.name,
      code: props.code,
      description: props.description,
      assetCategoryId: props.assetCategoryId,
      vendorId: props.vendorId,
      defaultWarrantyMonths: props.defaultWarrantyMonths,
      defaultAttributes: props.defaultAttributes,
    });

    return this.assetModelRepository.update(assetModel);
  }
}
