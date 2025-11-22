/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import { prisma } from "@/infrastructure/database/prisma/client";
import type { ServiceAsset } from "@/generated/prisma";

export interface GetServiceAssetsRequest {
  serviceId: string;
}

export interface ServiceAssetWithAsset extends ServiceAsset {
  asset: {
    id: string;
    assetTag: string;
    name: string | null;
    status: string;
    categoryId: string;
  } | null;
}

@injectable()
export class GetServiceAssetsUseCase {
  constructor(
    @inject(DI_TOKENS.IServiceRepository)
    private readonly serviceRepository: IServiceRepository,
  ) {}

  async execute(
    request: GetServiceAssetsRequest,
  ): Promise<ServiceAssetWithAsset[]> {
    // Check if service exists
    const service = await this.serviceRepository.findById(request.serviceId);
    if (!service) {
      throw new Error(`Service with ID ${request.serviceId} not found`);
    }

    // Get all assets linked to this service
    const serviceAssets = await prisma.serviceAsset.findMany({
      where: {
        serviceId: request.serviceId,
      },
      include: {
        asset: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            status: true,
            categoryId: true,
          },
        },
      },
      orderBy: [{ relationship: "asc" }, { asset: { assetTag: "asc" } }],
    });

    return serviceAssets;
  }
}
