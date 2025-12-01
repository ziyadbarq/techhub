import { injectable } from "inversify";
import { prisma } from "@/infrastructure/database/prisma/client";
import type { IServiceAssetRepository } from "@/core/repositories/service-asset.repository.interface";
import type { AssetRelationship, ServiceAsset } from "@/generated/prisma";

@injectable()
export class PrismaServiceAssetRepository implements IServiceAssetRepository {
  async findByServiceAndAsset(
    serviceId: string,
    assetId: string,
    relationship: AssetRelationship,
  ): Promise<ServiceAsset | null> {
    return prisma.serviceAsset.findFirst({
      where: { serviceId, assetId, relationship },
    });
  }

  async linkServiceToAsset(params: {
    serviceId: string;
    assetId: string;
    relationship: AssetRelationship;
    description?: string;
  }): Promise<void> {
    await prisma.serviceAsset.create({
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
    const result = await prisma.serviceAsset.deleteMany({
      where: {
        serviceId: params.serviceId,
        assetId: params.assetId,
        relationship: params.relationship,
      },
    });
    return result.count;
  }

  async deleteById(id: string): Promise<void> {
    await prisma.serviceAsset.deleteMany({
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
    return prisma.serviceAsset.findMany({
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
    return prisma.serviceAsset.findMany({
      where: { serviceId },
      orderBy: [{ relationship: "asc" }],
    });
  }
}
