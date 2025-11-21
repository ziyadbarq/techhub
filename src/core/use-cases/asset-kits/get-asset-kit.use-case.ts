/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitRepository } from "@/core/repositories/asset-kit.repository.interface";
import type { AssetKit } from "@/core/domain/entities/asset-kit.entity";

export interface GetAssetKitRequest {
  kitId: string;
}

@injectable()
export class GetAssetKitUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitRepository)
    private readonly assetKitRepository: IAssetKitRepository,
  ) {}

  async execute(request: GetAssetKitRequest): Promise<AssetKit> {
    const kit = await this.assetKitRepository.findById(request.kitId);
    if (!kit) {
      throw new Error(`Asset kit with ID ${request.kitId} not found`);
    }
    return kit;
  }
}
