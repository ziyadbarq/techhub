/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetDisposalRepository } from "@/core/repositories/asset-disposal.repository.interface";

export interface DeleteAssetDisposalRequest {
  disposalId: string;
}

@injectable()
export class DeleteAssetDisposalUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetDisposalRepository)
    private readonly assetDisposalRepository: IAssetDisposalRepository,
  ) {}

  async execute(request: DeleteAssetDisposalRequest): Promise<void> {
    const disposal = await this.assetDisposalRepository.findById(
      request.disposalId,
    );
    if (!disposal) {
      throw new Error(`Disposal with ID ${request.disposalId} not found`);
    }

    // Only allow deletion of pending or cancelled disposals
    if (
      disposal.status !== "PENDING_APPROVAL" &&
      disposal.status !== "CANCELLED"
    ) {
      throw new Error(
        `Cannot delete disposal with status ${disposal.status}. Only PENDING_APPROVAL or CANCELLED disposals can be deleted.`,
      );
    }

    await this.assetDisposalRepository.delete(request.disposalId);
  }
}
