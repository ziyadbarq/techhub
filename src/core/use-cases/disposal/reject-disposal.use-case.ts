import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetDisposalRepository } from "@/core/repositories/asset-disposal.repository.interface";
import type { AssetDisposal } from "@/core/domain/entities/asset-disposal.entity";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

export interface RejectDisposalRequest {
  disposalId: string;
  approverId: string;
  rejectionReason: string;
}

@injectable()
export class RejectDisposalUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetDisposalRepository)
    private readonly assetDisposalRepository: IAssetDisposalRepository,
  ) {}

  @LogExecution("disposal.reject")
  async execute(request: RejectDisposalRequest): Promise<AssetDisposal> {
    const disposal = await this.assetDisposalRepository.findById(
      request.disposalId,
    );
    if (!disposal) {
      throw new Error(`Disposal with ID ${request.disposalId} not found`);
    }

    disposal.reject(request.rejectionReason);

    return this.assetDisposalRepository.update(disposal);
  }
}
