import { inject, injectable } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { PrismaClient } from "@/generated/prisma/server";
import type {
  AssetDependencies,
  IAssetDependencyRepository,
} from "@/core/repositories/asset-dependency.repository.interface";

@injectable()
export class PrismaAssetDependencyRepository implements IAssetDependencyRepository {
  constructor(
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}
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
      this.prisma.warranty.count({ where: { assetId } }),
      this.prisma.maintenanceSchedule.count({ where: { assetId } }),
      this.prisma.maintenanceRecord.count({ where: { assetId } }),
      this.prisma.assetAssignment.count({ where: { assetId } }),
      this.prisma.stockMovement.count({ where: { assetId } }),
      this.prisma.assetDisposal.count({ where: { assetId } }),
      this.prisma.assetReservation.count({ where: { assetId } }),
      this.prisma.assetKitCheckoutItem.count({ where: { assetId } }),
      this.prisma.serviceAsset.count({ where: { assetId } }),
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
    return this.prisma.assetReservation.count({
      where: { assetId, status: { in: ["PENDING", "CONFIRMED"] } },
    });
  }

  async countActiveDisposals(assetId: string): Promise<number> {
    return this.prisma.assetDisposal.count({
      where: {
        assetId,
        status: { notIn: ["COMPLETED", "CANCELLED", "REJECTED"] },
      },
    });
  }

  async countActiveKitCheckouts(assetId: string): Promise<number> {
    return this.prisma.assetKitCheckoutItem.count({
      where: { assetId, status: "CHECKED_OUT" },
    });
  }

  async countActiveAssignments(assetId: string): Promise<number> {
    return this.prisma.assetAssignment.count({
      where: {
        assetId,
        OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
      },
    });
  }
}
