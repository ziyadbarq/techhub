import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceAssetRepository } from "@/core/repositories/service-asset.repository.interface";

export interface UnlinkServiceFromAssetRequest {
  serviceAssetId: string;
}

@injectable()
export class UnlinkServiceFromAssetUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceAssetRepository)
    private readonly serviceAssetRepository: IServiceAssetRepository,
  ) {}

  async execute(request: UnlinkServiceFromAssetRequest): Promise<void> {
    await this.serviceAssetRepository.deleteById(request.serviceAssetId);
  }
}
