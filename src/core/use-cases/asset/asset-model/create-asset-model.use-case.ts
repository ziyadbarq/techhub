/**
 * Create AssetModel Use Case
 */

import { inject, injectable } from "inversify";
import { ConflictError } from "@/core/domain/errors/conflict.error";
import { DI_TOKENS } from "@/di/types";
import { AssetModel } from "@/core/domain/entities/asset-model.entity";
import type { IAssetModelRepository } from "@/core/repositories/asset-model.repository.interface";
import type { ICodeGeneratorService } from "@/core/services/code-generator.service.interface";
import type { IIdGenerator } from "@/core/services/id-generator.service.interface";

export interface CreateAssetModelProps {
  assetCategoryId: string;
  vendorId: string;
  name: string;
  code?: string;
  description?: string;
  defaultWarrantyMonths?: number | null;
  defaultAttributes?: Record<string, unknown> | null;
}

@injectable()
export class CreateAssetModelUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetModelRepository)
    private readonly assetModelRepository: IAssetModelRepository,
    @inject(DI_TOKENS.ICodeGeneratorService)
    private readonly codeGenerator: ICodeGeneratorService,

    @inject(DI_TOKENS.IIdGenerator)
    private readonly idGenerator: IIdGenerator,
  ) {}

  async execute(props: CreateAssetModelProps): Promise<AssetModel> {
    // Auto-generate code if not provided or empty
    const code =
      props.code ||
      (await this.codeGenerator.generateCode("ASSET_MODEL", "MODEL"));

    const existsByCode = await this.assetModelRepository.existsByCode(code);
    if (existsByCode) {
      throw new ConflictError(`Asset model with code "${code}" already exists`);
    }

    const assetModel = AssetModel.create({ ...props, code });
    const created = await this.assetModelRepository.create(assetModel);
    return created;
  }
}
