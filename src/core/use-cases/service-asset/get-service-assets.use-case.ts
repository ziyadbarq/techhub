import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceAssetRepository } from "@/core/repositories/service-asset.repository.interface";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { ServiceAsset } from "@/generated/prisma";

export interface GetServiceAssetsRequest {
  serviceId: string;
}

@injectable()
export class GetServiceAssetsUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceAssetRepository)
    private readonly serviceAssetRepository: IServiceAssetRepository,
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(request: GetServiceAssetsRequest): Promise<ServiceAsset[]> {
    const service = await this.serviceRepository.findById(request.serviceId);
    if (!service) {
      throw new Error(`Service with ID ${request.serviceId} not found`);
    }

    return this.serviceAssetRepository.listByService(request.serviceId);
  }
}
