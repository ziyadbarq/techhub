import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import type { IServiceAssetRepository } from "@/core/repositories/service-asset.repository.interface";
import type { AssetRelationship, ServiceAsset } from "@/generated/prisma";

@injectable()
export class PrismaServiceAssetRepository implements IServiceAssetRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}
  async findByServiceAndAsset(
    serviceId: string,
    assetId: string,
    relationship: AssetRelationship,
  ): Promise<ServiceAsset | null> {
    return this.prisma.serviceAsset.findFirst({
      where: { serviceId, assetId, relationship },
    });
  }

  async linkServiceToAsset(params: {
    serviceId: string;
    assetId: string;
    relationship: AssetRelationship;
    description?: string;
  }): Promise<void> {
    await this.prisma.serviceAsset.create({
      data: {
        serviceId: params.serviceId,
        assetId: params.assetId,
        relationship: params.relationship,
        description: params.description,
      },
    });
  }

  async unlinkServiceFromAsset(params: {
    serviceId: string;
    assetId: string;
    relationship?: AssetRelationship;
  }): Promise<number> {
    const result = await this.prisma.serviceAsset.deleteMany({
      where: {
        serviceId: params.serviceId,
        assetId: params.assetId,
        relationship: params.relationship,
      },
    });
    return result.count;
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.serviceAsset.deleteMany({
      where: { id },
    });
  }

  async listByAsset(assetId: string): Promise<
    (ServiceAsset & {
      service: {
        id: string;
        name: string;
        serviceType: string;
        currentStatus: string;
        criticality: string;
      };
    })[]
  > {
    return this.prisma.serviceAsset.findMany({
      where: { assetId },
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
  }

  async listByService(serviceId: string): Promise<ServiceAsset[]> {
    return this.prisma.serviceAsset.findMany({
      where: { serviceId },
      orderBy: [{ relationship: "asc" }],
    });
  }
}
