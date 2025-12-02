import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import type { IServiceAssetRepository } from "@/core/repositories/service-asset.repository.interface";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { AssetRelationship } from "@/generated/prisma";

export interface LinkServiceToAssetRequest {
  serviceId: string;
  assetId: string;
  relationship: AssetRelationship;
  description?: string;
}

@injectable()
export class LinkServiceToAssetUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
    @inject(DI_TOKENS.IServiceAssetRepository)
    private readonly serviceAssetRepository: IServiceAssetRepository,
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
  ) {}

  async execute(request: LinkServiceToAssetRequest): Promise<void> {
    // Check if service exists
    const service = await this.serviceRepository.findById(request.serviceId);
    if (!service) {
      throw new Error(`Service with ID ${request.serviceId} not found`);
    }

    const asset = await this.assetRepository.findById(request.assetId);
    if (!asset) {
      throw new Error(`Asset with ID ${request.assetId} not found`);
    }

    // Check if asset exists
    // Check if link already exists
    const existingLink =
      await this.serviceAssetRepository.findByServiceAndAsset(
        request.serviceId,
        request.assetId,
        request.relationship,
      );
    if (existingLink) {
      throw new Error(
        `Asset is already linked to this service with relationship ${request.relationship}`,
      );
    }

    // Create link
    await this.serviceAssetRepository.linkServiceToAsset({
      serviceId: request.serviceId,
      assetId: request.assetId,
      relationship: request.relationship,
      description: request.description,
    });
  }
}
