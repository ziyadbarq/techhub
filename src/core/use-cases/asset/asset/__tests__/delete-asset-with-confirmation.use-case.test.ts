/**
 * DeleteAssetWithConfirmationUseCase - Unit Tests
 *
 * Tests the shared soft-delete gatekeeper used by both the single-asset
 * and bulk asset delete flows: dependency checks, blockers vs. warnings,
 * and the actual soft delete.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { DeleteAssetWithConfirmationUseCase } from "../delete-asset-with-confirmation.use-case";
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import type {
  AssetDependencies,
  IAssetDependencyRepository,
} from "@/core/repositories/asset-dependency.repository.interface";
import { Asset } from "@/core/domain/entities/asset.entity";

const emptyDependencies: AssetDependencies = {
  warranties: 0,
  maintenanceSchedules: 0,
  maintenanceRecords: 0,
  assignments: 0,
  stockMovements: 0,
  disposals: 0,
  reservations: 0,
  kitCheckoutItems: 0,
  configurationItems: 0,
};

function makeAsset(): Asset {
  return Asset.reconstitute({
    id: "asset-1",
    assetTag: "LAPTOP-001",
    assetCategoryId: "cat-1",
    assetModelId: null,
    vendorId: null,
    contractId: null,
    lifecycleStateId: null,
    serialNumber: null,
    purchaseDate: null,
    purchaseCost: null,
    purchaseCostSar: null,
    currency: null,
    depreciationModel: null,
    depreciationStart: null,
    depreciationEnd: null,
    condition: null,
    currentStockLocationId: null,
    owningOrgUnitId: null,
    attributes: null,
    note: null,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  });
}

class MockAssetRepository implements Partial<IAssetRepository> {
  asset: Asset | null = null;
  updateSoftDeleteCalls: string[] = [];

  async findById(id: string): Promise<Asset | null> {
    return this.asset && this.asset.id === id ? this.asset : null;
  }

  async updateSoftDelete(id: string): Promise<void> {
    this.updateSoftDeleteCalls.push(id);
  }
}

class MockAssetDependencyRepository implements IAssetDependencyRepository {
  dependencies: AssetDependencies = { ...emptyDependencies };
  activeReservations = 0;
  activeDisposals = 0;
  activeKitCheckouts = 0;
  activeAssignments = 0;

  async getDependencies(): Promise<AssetDependencies> {
    return this.dependencies;
  }
  async countActiveReservations(): Promise<number> {
    return this.activeReservations;
  }
  async countActiveDisposals(): Promise<number> {
    return this.activeDisposals;
  }
  async countActiveKitCheckouts(): Promise<number> {
    return this.activeKitCheckouts;
  }
  async countActiveAssignments(): Promise<number> {
    return this.activeAssignments;
  }
}

describe("DeleteAssetWithConfirmationUseCase", () => {
  let assetRepository: MockAssetRepository;
  let dependencyRepository: MockAssetDependencyRepository;
  let useCase: DeleteAssetWithConfirmationUseCase;

  beforeEach(() => {
    assetRepository = new MockAssetRepository();
    assetRepository.asset = makeAsset();
    dependencyRepository = new MockAssetDependencyRepository();
    useCase = new DeleteAssetWithConfirmationUseCase(
      assetRepository as unknown as IAssetRepository,
      dependencyRepository,
    );
  });

  describe("execute", () => {
    it("throws when the asset does not exist", async () => {
      assetRepository.asset = null;

      await expect(useCase.execute({ id: "missing" })).rejects.toThrow(
        'Asset with ID "missing" not found',
      );
    });

    it("allows deletion when there are no dependencies", async () => {
      const result = await useCase.execute({ id: "asset-1" });

      expect(result.canDelete).toBe(true);
      expect(result.blockers).toHaveLength(0);
      expect(result.message).toMatch(/no dependencies/);
    });

    it("blocks deletion when the asset has an active assignment", async () => {
      dependencyRepository.dependencies = {
        ...emptyDependencies,
        assignments: 1,
      };
      dependencyRepository.activeAssignments = 1;

      const result = await useCase.execute({ id: "asset-1" });

      expect(result.canDelete).toBe(false);
      expect(result.blockers.join(" ")).toMatch(/active assignment/);
    });

    it("allows deletion and warns when assignments are historical only", async () => {
      dependencyRepository.dependencies = {
        ...emptyDependencies,
        assignments: 2,
      };
      dependencyRepository.activeAssignments = 0;

      const result = await useCase.execute({ id: "asset-1" });

      expect(result.canDelete).toBe(true);
      expect(
        result.warnings.some((w) => w.includes("historical assignment")),
      ).toBe(true);
    });

    it("blocks deletion when the asset has an active reservation", async () => {
      dependencyRepository.dependencies = {
        ...emptyDependencies,
        reservations: 1,
      };
      dependencyRepository.activeReservations = 1;

      const result = await useCase.execute({ id: "asset-1" });

      expect(result.canDelete).toBe(false);
      expect(result.blockers.join(" ")).toMatch(/active reservation/);
    });

    it("blocks deletion when the asset has an active disposal", async () => {
      dependencyRepository.dependencies = {
        ...emptyDependencies,
        disposals: 1,
      };
      dependencyRepository.activeDisposals = 1;

      const result = await useCase.execute({ id: "asset-1" });

      expect(result.canDelete).toBe(false);
      expect(result.blockers.join(" ")).toMatch(/active disposal/);
    });

    it("blocks deletion when the asset is checked out in a kit", async () => {
      dependencyRepository.dependencies = {
        ...emptyDependencies,
        kitCheckoutItems: 1,
      };
      dependencyRepository.activeKitCheckouts = 1;

      const result = await useCase.execute({ id: "asset-1" });

      expect(result.canDelete).toBe(false);
      expect(result.blockers.join(" ")).toMatch(/kit checkout/);
    });

    it("blocks deletion when the asset has linked configuration items", async () => {
      dependencyRepository.dependencies = {
        ...emptyDependencies,
        configurationItems: 2,
      };

      const result = await useCase.execute({ id: "asset-1" });

      expect(result.canDelete).toBe(false);
      expect(result.blockers.join(" ")).toMatch(/Configuration Item/);
    });

    it("warns about preserved stock movement history without blocking", async () => {
      dependencyRepository.dependencies = {
        ...emptyDependencies,
        stockMovements: 5,
      };

      const result = await useCase.execute({ id: "asset-1" });

      expect(result.canDelete).toBe(true);
      expect(result.warnings.some((w) => w.includes("stock movement"))).toBe(
        true,
      );
    });
  });

  describe("executeSoftDelete", () => {
    it("throws when the asset does not exist", async () => {
      assetRepository.asset = null;

      await expect(useCase.executeSoftDelete("missing")).rejects.toThrow(
        'Asset with ID "missing" not found',
      );
    });

    it("soft deletes the asset", async () => {
      await useCase.executeSoftDelete("asset-1");

      expect(assetRepository.updateSoftDeleteCalls).toEqual(["asset-1"]);
    });
  });
});
