/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetKitRepository } from "@/core/repositories/asset-kit.repository.interface";
import type { AssetKit } from "@/core/domain/entities/asset-kit.entity";

export interface ListAssetKitsRequest {
  activeOnly?: boolean;
  search?: string;
}

export interface ListAssetKitsResponse {
  kits: AssetKit[];
  total: number;
}

@injectable()
export class ListAssetKitsUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetKitRepository)
    private readonly assetKitRepository: IAssetKitRepository,
  ) {}

  async execute(request: ListAssetKitsRequest): Promise<ListAssetKitsResponse> {
    let kits: AssetKit[];

    if (request.search) {
      kits = await this.assetKitRepository.search(request.search);
    } else if (request.activeOnly) {
      kits = await this.assetKitRepository.findActive();
    } else {
      kits = await this.assetKitRepository.findAll();
    }

    return {
      kits,
      total: kits.length,
    };
  }
}
