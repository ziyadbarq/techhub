/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetDisposalRepository } from "@/core/repositories/asset-disposal.repository.interface";
import type { AssetDisposal } from "@/core/domain/entities/asset-disposal.entity";

export interface GetAssetDisposalRequest {
  id: string;
}

@injectable()
export class GetAssetDisposalUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetDisposalRepository)
    private readonly assetDisposalRepository: IAssetDisposalRepository,
  ) {}

  async execute(request: GetAssetDisposalRequest): Promise<AssetDisposal> {
    const disposal = await this.assetDisposalRepository.findById(request.id);

    if (!disposal) {
      throw new Error(`Asset disposal with ID ${request.id} not found`);
    }

    return disposal;
  }
}
