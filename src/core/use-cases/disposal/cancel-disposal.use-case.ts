import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetDisposalRepository } from "@/core/repositories/asset-disposal.repository.interface";
import type { AssetDisposal } from "@/core/domain/entities/asset-disposal.entity";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface CancelDisposalRequest {
  disposalId: string;
  cancellationReason: string;
}

@injectable()
export class CancelDisposalUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetDisposalRepository)
    private readonly assetDisposalRepository: IAssetDisposalRepository,
  ) {}

  @LogExecution("disposal.cancel")
  async execute(request: CancelDisposalRequest): Promise<AssetDisposal> {
    const disposal = await this.assetDisposalRepository.findById(
      request.disposalId,
    );
    if (!disposal) {
      throw new NotFoundError(
        `Disposal with ID ${request.disposalId} not found`,
      );
    }

    disposal.cancel();

    return this.assetDisposalRepository.update(disposal);
  }
}
