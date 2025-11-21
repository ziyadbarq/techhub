/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitRepository } from "@/core/repositories/asset-kit.repository.interface";
import type { AssetKit } from "@/core/domain/entities/asset-kit.entity";

export interface UpdateAssetKitRequest {
  kitId: string;
  name?: string;
  code?: string;
  description?: string;
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
      throw new Error(`Asset kit with ID ${request.kitId} not found`);
    }

    // Check if code is being changed and if new code already exists
    if (request.code && request.code !== kit.code) {
      const codeExists = await this.assetKitRepository.codeExists(request.code);
      if (codeExists) {
        throw new Error(`Asset kit with code ${request.code} already exists`);
      }
    }

    if (request.name !== undefined) {
      kit.updateName(request.name);
    }

    if (request.code !== undefined) {
      kit.updateCode(request.code);
    }

    if (request.description !== undefined) {
      kit.updateDescription(request.description);
    }

    if (request.isActive !== undefined) {
      if (request.isActive) {
        kit.activate();
      } else {
        kit.deactivate();
      }
    }

    return this.assetKitRepository.update(kit);
  }
}
