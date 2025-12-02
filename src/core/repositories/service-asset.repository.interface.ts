import type { AssetRelationship, ServiceAsset } from "@/generated/prisma";

export interface IServiceAssetRepository {
  findByServiceAndAsset(
    serviceId: string,
    assetId: string,
    relationship: AssetRelationship,
  ): Promise<ServiceAsset | null>;

  linkServiceToAsset(params: {
    serviceId: string;
    assetId: string;
    relationship: AssetRelationship;
    description?: string;
  }): Promise<void>;

  unlinkServiceFromAsset(params: {
    serviceId: string;
    assetId: string;
    relationship?: AssetRelationship;
  }): Promise<number>;

  deleteById(id: string): Promise<void>;

  listByAsset(assetId: string): Promise<
    (ServiceAsset & {
      service: {
        id: string;
        name: string;
        serviceType: string;
        currentStatus: string;
        criticality: string;
      };
    })[]
  >;

  listByService(serviceId: string): Promise<ServiceAsset[]>;
}
