import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceAssetRepository } from "@/core/repositories/service-asset.repository.interface";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { ServiceAsset } from "@/generated/prisma";
import { NotFoundError } from "@/core/domain/errors/not-found.error";

export interface ServiceAssetWithService extends ServiceAsset {
  service: {
    id: string;
    name: string;
    serviceType: string;
    currentStatus: string;
    criticality: string;
  };
}

export interface GetAssetServicesRequest {
  assetId: string;
}

@injectable()
export class GetAssetServicesUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceAssetRepository)
    private readonly serviceAssetRepository: IServiceAssetRepository,
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
  ) {}

  async execute(
    request: GetAssetServicesRequest,
  ): Promise<ServiceAssetWithService[]> {
    const asset = await this.assetRepository.findById(request.assetId);
    if (!asset) {
      throw new NotFoundError(`Asset with ID ${request.assetId} not found`);
    }

    return this.serviceAssetRepository.listByAsset(request.assetId);
  }
}
