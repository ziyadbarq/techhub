/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Fix type errors - this is WIP code

import { injectable } from "inversify";
import { prisma } from "@/infrastructure/database/prisma/client";
import type { ServiceAsset } from "@/generated/prisma";

export interface GetAssetServicesRequest {
  assetId: string;
}

export interface ServiceAssetWithService extends ServiceAsset {
  service: {
    id: string;
    name: string;
    serviceType: string;
    currentStatus: string;
    criticality: string;
  };
}

@injectable()
export class GetAssetServicesUseCase {
  async execute(
    request: GetAssetServicesRequest,
  ): Promise<ServiceAssetWithService[]> {
    // Check if asset exists
    const asset = await prisma.asset.findUnique({
      where: { id: request.assetId },
    });
    if (!asset) {
      throw new Error(`Asset with ID ${request.assetId} not found`);
    }

    // Get all services linked to this asset
    const serviceAssets = await prisma.serviceAsset.findMany({
      where: {
        assetId: request.assetId,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            serviceType: true,
            currentStatus: true,
            criticality: true,
          },
        },
      },
      orderBy: [{ relationship: "asc" }, { service: { name: "asc" } }],
    });

    return serviceAssets;
  }
}
