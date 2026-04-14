import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetDisposalRepository } from "@/core/repositories/asset-disposal.repository.interface";
import type { AssetDisposal } from "@/core/domain/entities/asset-disposal.entity";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

export interface ApproveDisposalRequest {
  disposalId: string;
  approverId: string;
  comments?: string;
}

@injectable()
export class ApproveDisposalUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetDisposalRepository)
    private readonly assetDisposalRepository: IAssetDisposalRepository,
  ) {}

  @LogExecution("disposal.approve")
  async execute(request: ApproveDisposalRequest): Promise<AssetDisposal> {
    // Get disposal
    const disposal = await this.assetDisposalRepository.findById(
      request.disposalId,
    );
    if (!disposal) {
      throw new Error(`Disposal with ID ${request.disposalId} not found`);
    }

    // Approve disposal (entity validates state)
    disposal.approve(request.approverId);

    // Persist changes
    return this.assetDisposalRepository.update(disposal);
  }
}
