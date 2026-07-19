/**
 * CreateStockMovementUseCase - Unit Tests
 *
 * Tests for the CreateStockMovementUseCase including:
 * - Successful movement creation for all types (IN, OUT, TRANSFER, ADJUSTMENT)
 * - Movement type-specific business rules
 * - Validation errors (quantity, performer, invalid types)
 * - Edge cases (defaults, same location)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { CreateStockMovementUseCase } from "../create-stock-movement.use-case";
import type { IStockMovementRepository } from "@/core/repositories/stock-movement.repository.interface";
import type { IUnitOfWork } from "@/core/services/unit-of-work.service.interface";
import type {
  StockMovement,
  StockMovementType,
} from "@/core/domain/entities/stock-movement.entity";

/**
 * Mock StockMovement Repository
 */
class MockStockMovementRepository implements Partial<IStockMovementRepository> {
  private movements = new Map<string, StockMovement>();
  private idCounter = 1;

  /** Net quantity reported for any location (default: plenty) */
  netQuantity = 1000;

  async create(movement: StockMovement): Promise<StockMovement> {
    // Assign ID if not set (simulate repository behavior)
    if (!movement.id) {
      movement.setId(`movement-${this.idCounter++}`);
    }
    this.movements.set(movement.id, movement);
    return movement;
  }

  async getNetQuantityAtLocation(_stockLocationId: string): Promise<number> {
    return this.netQuantity;
  }

  clear(): void {
    this.movements.clear();
    this.idCounter = 1;
    this.netQuantity = 1000;
  }
}

/** Pass-through unit of work (no real transaction in unit tests) */
const mockUnitOfWork: IUnitOfWork = {
  execute: <T>(work: () => Promise<T>) => work(),
};

describe("CreateStockMovementUseCase", () => {
  let useCase: CreateStockMovementUseCase;
  let mockRepository: MockStockMovementRepository;

  beforeEach(() => {
    mockRepository = new MockStockMovementRepository();
    useCase = new CreateStockMovementUseCase(
      mockRepository as unknown as IStockMovementRepository,
      mockUnitOfWork,
    );
  });

  describe("execute - successful creation", () => {
    it("should create IN movement with destination only", async () => {
      // Arrange
      const props = {
        movementType: "IN" as StockMovementType,
        stockLocationToId: "loc-1",
        assetId: "asset-1",
        quantity: 5,
        performedById: "user-1",
        reason: "Purchase received",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result).toBeDefined();
      expect(result.movementType).toBe("IN");
      expect(result.stockLocationToId).toBe("loc-1");
      expect(result.stockLocationFromId).toBeNull();
      expect(result.quantity).toBe(5);
      expect(result.performedById).toBe("user-1");
      expect(result.id).toBeDefined();
    });

    it("should create OUT movement with source only", async () => {
      // Arrange
      const props = {
        movementType: "OUT" as StockMovementType,
        stockLocationFromId: "loc-1",
        assetId: "asset-1",
        quantity: 3,
        performedById: "user-1",
        reason: "Issued to department",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.movementType).toBe("OUT");
      expect(result.stockLocationFromId).toBe("loc-1");
      expect(result.stockLocationToId).toBeNull();
      expect(result.quantity).toBe(3);
    });

    it("should create TRANSFER movement with both source and destination", async () => {
      // Arrange
      const props = {
        movementType: "TRANSFER" as StockMovementType,
        stockLocationFromId: "loc-1",
        stockLocationToId: "loc-2",
        assetId: "asset-1",
        quantity: 2,
        performedById: "user-1",
        reason: "Relocated to warehouse B",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.movementType).toBe("TRANSFER");
      expect(result.stockLocationFromId).toBe("loc-1");
      expect(result.stockLocationToId).toBe("loc-2");
      expect(result.quantity).toBe(2);
    });

    it("should create ADJUSTMENT movement (flexible locations)", async () => {
      // Arrange
      const props = {
        movementType: "ADJUSTMENT" as StockMovementType,
        stockLocationFromId: "loc-1",
        assetId: "asset-1",
        quantity: 1,
        performedById: "user-1",
        reason: "Inventory correction",
        source: "IMPORT" as const,
        sourceReferenceType: "ImportBatch",
        sourceReferenceId: "batch-1",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.movementType).toBe("ADJUSTMENT");
      expect(result.stockLocationFromId).toBe("loc-1");
      expect(result.stockLocationToId).toBeNull();
      expect(result.source).toBe("IMPORT");
      expect(result.sourceReferenceType).toBe("ImportBatch");
      expect(result.sourceReferenceId).toBe("batch-1");
    });
  });

  describe("execute - IN movement business rules", () => {
    it("should reject IN movement without destination", async () => {
      // Arrange
      const props = {
        movementType: "IN" as StockMovementType,
        performedById: "user-1",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /requires destination stock location/,
      );
    });

    it("should reject IN movement with source", async () => {
      // Arrange
      const props = {
        movementType: "IN" as StockMovementType,
        stockLocationFromId: "loc-1", // Should not have source
        stockLocationToId: "loc-2",
        performedById: "user-1",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /should not have source stock location/,
      );
    });
  });

  describe("execute - OUT movement business rules", () => {
    it("should reject OUT movement without source", async () => {
      // Arrange
      const props = {
        movementType: "OUT" as StockMovementType,
        performedById: "user-1",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /requires source stock location/,
      );
    });

    it("should reject OUT movement with destination", async () => {
      // Arrange
      const props = {
        movementType: "OUT" as StockMovementType,
        stockLocationFromId: "loc-1",
        stockLocationToId: "loc-2", // Should not have destination
        performedById: "user-1",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /should not have destination stock location/,
      );
    });
  });

  describe("execute - TRANSFER movement business rules", () => {
    it("should reject TRANSFER movement without source", async () => {
      // Arrange
      const props = {
        movementType: "TRANSFER" as StockMovementType,
        stockLocationToId: "loc-2",
        performedById: "user-1",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /requires both source and destination/,
      );
    });

    it("should reject TRANSFER movement without destination", async () => {
      // Arrange
      const props = {
        movementType: "TRANSFER" as StockMovementType,
        stockLocationFromId: "loc-1",
        performedById: "user-1",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /requires both source and destination/,
      );
    });

    it("should reject TRANSFER movement with same source and destination", async () => {
      // Arrange
      const props = {
        movementType: "TRANSFER" as StockMovementType,
        stockLocationFromId: "loc-1",
        stockLocationToId: "loc-1", // Same as source
        performedById: "user-1",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /cannot have same source and destination/,
      );
    });
  });

  describe("execute - validation", () => {
    it("should reject invalid movement type", async () => {
      // Arrange
      const props = {
        movementType: "INVALID" as StockMovementType,
        performedById: "user-1",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /Invalid movement type/,
      );
    });

    it("should reject quantity less than 1", async () => {
      // Arrange
      const props = {
        movementType: "IN" as StockMovementType,
        stockLocationToId: "loc-1",
        quantity: -1, // Negative quantity (0 gets defaulted to 1)
        performedById: "user-1",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /must be at least 1/,
      );
    });

    it("should reject non-integer quantity", async () => {
      // Arrange
      const props = {
        movementType: "IN" as StockMovementType,
        stockLocationToId: "loc-1",
        quantity: 2.5,
        performedById: "user-1",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /must be a whole number/,
      );
    });

    it("should reject empty performedById", async () => {
      // Arrange
      const props = {
        movementType: "IN" as StockMovementType,
        stockLocationToId: "loc-1",
        performedById: "",
      };

      // Act & Assert
      await expect(useCase.execute(props)).rejects.toThrow(
        /Performed by ID cannot be empty/,
      );
    });
  });

  describe("execute - stock availability", () => {
    it("should reject OUT movement exceeding available quantity", async () => {
      mockRepository.netQuantity = 2;

      await expect(
        useCase.execute({
          movementType: "OUT" as StockMovementType,
          stockLocationFromId: "loc-1",
          quantity: 3,
          performedById: "user-1",
        }),
      ).rejects.toThrow(/Insufficient stock/);
    });

    it("should reject TRANSFER movement exceeding available quantity", async () => {
      mockRepository.netQuantity = 0;

      await expect(
        useCase.execute({
          movementType: "TRANSFER" as StockMovementType,
          stockLocationFromId: "loc-1",
          stockLocationToId: "loc-2",
          quantity: 1,
          performedById: "user-1",
        }),
      ).rejects.toThrow(/Insufficient stock/);
    });

    it("should allow OUT movement equal to available quantity", async () => {
      mockRepository.netQuantity = 3;

      const result = await useCase.execute({
        movementType: "OUT" as StockMovementType,
        stockLocationFromId: "loc-1",
        quantity: 3,
        performedById: "user-1",
      });

      expect(result.quantity).toBe(3);
    });

    it("should not check availability for ADJUSTMENT movements", async () => {
      mockRepository.netQuantity = 0;

      const result = await useCase.execute({
        movementType: "ADJUSTMENT" as StockMovementType,
        stockLocationFromId: "loc-1",
        quantity: 5,
        performedById: "user-1",
      });

      expect(result.movementType).toBe("ADJUSTMENT");
    });

    it("should not check availability for IN movements", async () => {
      mockRepository.netQuantity = 0;

      const result = await useCase.execute({
        movementType: "IN" as StockMovementType,
        stockLocationToId: "loc-1",
        quantity: 5,
        performedById: "user-1",
      });

      expect(result.movementType).toBe("IN");
    });
  });

  describe("edge cases", () => {
    it("should default occurredAt to now if not provided", async () => {
      // Arrange
      const props = {
        movementType: "IN" as StockMovementType,
        stockLocationToId: "loc-1",
        performedById: "user-1",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.occurredAt).toBeInstanceOf(Date);
      // Should be close to now (within 1 second)
      const now = new Date();
      expect(
        Math.abs(result.occurredAt.getTime() - now.getTime()),
      ).toBeLessThan(1000);
    });

    it("should default quantity to 1 if not provided", async () => {
      // Arrange
      const props = {
        movementType: "IN" as StockMovementType,
        stockLocationToId: "loc-1",
        performedById: "user-1",
      };

      // Act
      const result = await useCase.execute(props);

      // Assert
      expect(result.quantity).toBe(1);
    });
  });
});
