/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import { prisma } from "@/infrastructure/database/prisma/client";
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
  ) {}

  async execute(request: LinkServiceToAssetRequest): Promise<void> {
    // Check if service exists
    const service = await this.serviceRepository.findById(request.serviceId);
    if (!service) {
      throw new Error(`Service with ID ${request.serviceId} not found`);
    }

    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: request.assetId },
    });
    if (!asset) {
      throw new Error(`Asset with ID ${request.assetId} not found`);
    }

    // Check if link already exists
    const existingLink = await prisma.serviceAsset.findFirst({
      where: {
        serviceId: request.serviceId,
        assetId: request.assetId,
        relationship: request.relationship,
      },
    });
    if (existingLink) {
      throw new Error(
        `Asset is already linked to this service with relationship ${request.relationship}`,
      );
    }

    // Create link
    await prisma.serviceAsset.create({
      data: {
        serviceId: request.serviceId,
        assetId: request.assetId,
        relationship: request.relationship,
        description: request.description,
      },
    });
  }
}
