import { injectable } from "inversify";
import { prisma } from "@/infrastructure/database/prisma/client";
import type {
  AssetDependencies,
  IAssetDependencyRepository,
} from "@/core/repositories/asset-dependency.repository.interface";

@injectable()
export class PrismaAssetDependencyRepository
  implements IAssetDependencyRepository
{
  async getDependencies(assetId: string): Promise<AssetDependencies> {
    const [
      warranties,
      maintenanceSchedules,
      maintenanceRecords,
      assignments,
      stockMovements,
      disposals,
      reservations,
      kitCheckoutItems,
      configurationItems,
    ] = await Promise.all([
      prisma.warranty.count({ where: { assetId } }),
      prisma.maintenanceSchedule.count({ where: { assetId } }),
      prisma.maintenanceRecord.count({ where: { assetId } }),
      prisma.assetAssignment.count({ where: { assetId } }),
      prisma.stockMovement.count({ where: { assetId } }),
      prisma.assetDisposal.count({ where: { assetId } }),
      prisma.assetReservation.count({ where: { assetId } }),
      prisma.assetKitCheckoutItem.count({ where: { assetId } }),
      prisma.serviceAsset.count({ where: { assetId } }),
    ]);

    return {
      warranties,
      maintenanceSchedules,
      maintenanceRecords,
      assignments,
      stockMovements,
      disposals,
      reservations,
      kitCheckoutItems,
      configurationItems,
    };
  }

  async countActiveReservations(assetId: string): Promise<number> {
    return prisma.assetReservation.count({
      where: { assetId, status: { in: ["PENDING", "CONFIRMED"] } },
    });
  }

  async countActiveDisposals(assetId: string): Promise<number> {
    return prisma.assetDisposal.count({
      where: {
        assetId,
        status: { notIn: ["COMPLETED", "CANCELLED", "REJECTED"] },
      },
    });
  }

  async countActiveKitCheckouts(assetId: string): Promise<number> {
    return prisma.assetKitCheckoutItem.count({
      where: { assetId, status: "CHECKED_OUT" },
    });
  }

  async countActiveAssignments(assetId: string): Promise<number> {
    return prisma.assetAssignment.count({
      where: {
        assetId,
        OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
      },
    });
  }
}
