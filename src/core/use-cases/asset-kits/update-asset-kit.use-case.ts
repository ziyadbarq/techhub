import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitRepository } from "@/core/repositories/asset-kit.repository.interface";
import type { AssetKit } from "@/core/domain/entities/asset-kit.entity";
import type { KitType } from "@/core/domain/entities/asset-kit.entity";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface UpdateAssetKitRequest {
  kitId: string;
  name?: string;
  code?: string;
  description?: string;
  kitType?: KitType;
  isActive?: boolean;
}

@injectable()
export class UpdateAssetKitUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitRepository)
    private readonly assetKitRepository: IAssetKitRepository,
  ) {}

  async execute(request: UpdateAssetKitRequest): Promise<AssetKit> {
    const kit = await this.assetKitRepository.findById(request.kitId);
    if (!kit) {
      throw new NotFoundError(`Asset kit with ID ${request.kitId} not found`);
    }

    // Check if code is being changed and if new code already exists
    if (request.code && request.code !== kit.code) {
      const codeExists = await this.assetKitRepository.codeExists(request.code);
      if (codeExists) {
        throw new Error(`Asset kit with code ${request.code} already exists`);
      }
    }

    kit.update({
      name: request.name,
      code: request.code,
      description: request.description,
      kitType: request.kitType,
      isActive: request.isActive,
    });

    return this.assetKitRepository.update(kit);
  }
}
