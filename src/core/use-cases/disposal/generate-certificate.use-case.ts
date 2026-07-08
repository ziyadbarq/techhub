import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetDisposalRepository } from "@/core/repositories/asset-disposal.repository.interface";
import type { AssetDisposal } from "@/core/domain/entities/asset-disposal.entity";
import { LogExecution } from "@/lib/decorators/log-execution.decorator";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface GenerateCertificateRequest {
  disposalId: string;
}

export interface GenerateCertificateResponse {
  disposal: AssetDisposal;
  certificateNumber: string;
}

@injectable()
export class GenerateCertificateUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetDisposalRepository)
    private readonly assetDisposalRepository: IAssetDisposalRepository,
  ) {}

  @LogExecution("disposal.generateCertificate")
  async execute(
    request: GenerateCertificateRequest,
  ): Promise<GenerateCertificateResponse> {
    const disposal = await this.assetDisposalRepository.findById(
      request.disposalId,
    );
    if (!disposal) {
      throw new NotFoundError(
        `Disposal with ID ${request.disposalId} not found`,
      );
    }

    const certificateNumber = disposal.generateCertificate();
    const updatedDisposal = await this.assetDisposalRepository.update(disposal);

    return {
      disposal: updatedDisposal,
      certificateNumber,
    };
  }
}
