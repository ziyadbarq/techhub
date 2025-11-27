/**
 * DeleteAssetWithConfirmation Use Case
 *
 * Application-layer safeguard for asset deletion with comprehensive dependency checking.
 * Performs soft delete (sets deletedAt timestamp) to preserve audit trails.
 *
 * Business Rules:
 * - Check all asset dependencies before deletion
 * - Return detailed confirmation info about what will be affected
 * - Perform soft delete to preserve history
 * - Prevent deletion if critical dependencies exist
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type { PrismaClient } from "@/generated/prisma/server";

export interface DeleteAssetConfirmationRequest {
  id: string;
}

export interface AssetDependencies {
  warranties: number;
  maintenanceSchedules: number;
  maintenanceRecords: number;
  assignments: number;
  stockMovements: number;
  disposals: number;
  reservations: number;
  kitCheckoutItems: number;
  configurationItems: number;
}

export interface DeleteAssetConfirmationResponse {
  canDelete: boolean;
  assetTag: string;
  assetCategory: string;
  dependencies: AssetDependencies;
  totalDependencies: number;
  blockers: string[];
  warnings: string[];
  message: string;
}

@injectable()
export class DeleteAssetWithConfirmationUseCase {
  constructor(
    @inject(DI_TOKENS.IAssetRepository)
    private readonly assetRepository: IAssetRepository,
    @inject(DI_TOKENS.PrismaClient)
    private readonly prisma: PrismaClient,
  ) {}

  async execute(
    request: DeleteAssetConfirmationRequest,
  ): Promise<DeleteAssetConfirmationResponse> {
    // Check if asset exists
    const asset = await this.assetRepository.findById(request.id);
    if (!asset) {
      throw new Error(`Asset with ID "${request.id}" not found`);
    }

    // Check all dependencies
    const dependencies = await this.checkDependencies(request.id);
    const totalDependencies = Object.values(dependencies).reduce(
      (sum, count) => sum + count,
      0,
    );

    // Determine blockers (critical dependencies that prevent deletion)
    const blockers: string[] = [];
    const warnings: string[] = [];

    // Critical blocker: Active reservations
    if (dependencies.reservations > 0) {
      const activeReservations = await this.prisma.assetReservation.count({
        where: {
          assetId: request.id,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      });
      if (activeReservations > 0) {
        blockers.push(
          `${activeReservations} active reservation(s). Cancel or complete them first.`,
        );
      } else {
        warnings.push(
          `${dependencies.reservations} historical reservation(s) will be preserved.`,
        );
      }
    }

    // Critical blocker: Active disposals
    if (dependencies.disposals > 0) {
      const activeDisposals = await this.prisma.assetDisposal.count({
        where: {
          assetId: request.id,
          status: {
            notIn: ["COMPLETED", "CANCELLED", "REJECTED"],
          },
        },
      });
      if (activeDisposals > 0) {
        blockers.push(
          `${activeDisposals} active disposal(s) in progress. Complete or cancel them first.`,
        );
      } else {
        warnings.push(
          `${dependencies.disposals} historical disposal(s) will be preserved.`,
        );
      }
    }

    // Critical blocker: Checked out in kits
    if (dependencies.kitCheckoutItems > 0) {
      const checkedOut = await this.prisma.assetKitCheckoutItem.count({
        where: {
          assetId: request.id,
          status: "CHECKED_OUT",
        },
      });
      if (checkedOut > 0) {
        blockers.push(
          `${checkedOut} active kit checkout(s). Return the asset first.`,
        );
      } else {
        warnings.push(
          `${dependencies.kitCheckoutItems} historical kit checkout(s) will be preserved.`,
        );
      }
    }

    // Critical blocker: Active assignments
    if (dependencies.assignments > 0) {
      const activeAssignments = await this.prisma.assetAssignment.count({
        where: {
          assetId: request.id,
          OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
        },
      });
      if (activeAssignments > 0) {
        blockers.push(
          `${activeAssignments} active assignment(s). Unassign the asset first.`,
        );
      } else {
        warnings.push(
          `${dependencies.assignments} historical assignment(s) will be preserved.`,
        );
      }
    }

    // Critical blocker: Linked Configuration Items
    if (dependencies.configurationItems > 0) {
      blockers.push(
        `${dependencies.configurationItems} linked Configuration Item(s). Unlink them first.`,
      );
    }

    // Warnings for historical data
    if (dependencies.warranties > 0) {
      warnings.push(
        `${dependencies.warranties} warranty record(s) will be preserved.`,
      );
    }

    if (dependencies.maintenanceSchedules > 0) {
      warnings.push(
        `${dependencies.maintenanceSchedules} maintenance schedule(s) will be preserved.`,
      );
    }

    if (dependencies.maintenanceRecords > 0) {
      warnings.push(
        `${dependencies.maintenanceRecords} maintenance record(s) will be preserved.`,
      );
    }

    if (dependencies.stockMovements > 0) {
      warnings.push(
        `${dependencies.stockMovements} stock movement(s) will be preserved for audit purposes.`,
      );
    }

    const canDelete = blockers.length === 0;

    const message = canDelete
      ? totalDependencies > 0
        ? `Asset can be soft-deleted. ${totalDependencies} related record(s) will be preserved for audit purposes.`
        : "Asset can be safely deleted with no dependencies."
      : `Cannot delete asset. ${blockers.length} blocker(s) must be resolved first.`;

    return {
      canDelete,
      assetTag: asset.assetTag,
      assetCategory: asset.assetCategoryId || "Unknown",
      dependencies,
      totalDependencies,
      blockers,
      warnings,
      message,
    };
  }

  /**
   * Check all asset dependencies using Prisma counts
   */
  private async checkDependencies(assetId: string): Promise<AssetDependencies> {
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
      this.prisma.configurationItem.count({
        where: { linkedAssetId: assetId },
      }),
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

  /**
   * Execute the soft delete after confirmation
   * Only call this after receiving user confirmation
   */
  async executeSoftDelete(id: string): Promise<void> {
    const asset = await this.assetRepository.findById(id);
    if (!asset) {
      throw new Error(`Asset with ID "${id}" not found`);
    }

    // Perform soft delete by setting deletedAt timestamp
    await this.prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
