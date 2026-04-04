import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetDisposalRepository } from "@/core/repositories/asset-disposal.repository.interface";
import type { AssetDisposal } from "@/core/domain/entities/asset-disposal.entity";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";

export interface CompleteDisposalRequest {
  disposalId: string;
  disposalDate: Date;
  actualProceeds?: number | null;
}

@injectable()
export class CompleteDisposalUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetDisposalRepository)
    private readonly assetDisposalRepository: IAssetDisposalRepository,
  ) {}

  @LogExecution("disposal.complete")
  async execute(request: CompleteDisposalRequest): Promise<AssetDisposal> {
    const disposal = await this.assetDisposalRepository.findById(
      request.disposalId,
    );
    if (!disposal) {
      throw new Error(`Disposal with ID ${request.disposalId} not found`);
    }

    disposal.completeDisposal(
      request.disposalDate,
      request.actualProceeds ?? undefined,
    );

    return this.assetDisposalRepository.update(disposal);
  }
}
