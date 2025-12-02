/**
 * Stock Movements Table Query - N+1 Watch Test
 *
 * Performance regression tests to ensure the query layer prevents N+1 queries.
 *
 * WHAT THIS TESTS:
 * - Verifies that fetching enriched stock movements doesn't cause N+1 queries
 * - Asserts maximum number of database queries stays under threshold
 * - Catches performance regressions when batching breaks
 *
 * WHY THIS MATTERS:
 * - N+1 queries can kill performance with large datasets
 * - Easy to accidentally break batching with refactoring
 * - CI will catch regressions before they reach production
 *
 * THRESHOLD LOGIC:
 * - Base queries: ListStockMovements (1), ListStockLocations (1), ListAssets (1), ListPeople (1)
 * - Assignment lookups: Individual findById calls (not ideal, but acceptable for now)
 * - Total: Should be ~10 queries for 100 movements (not 100+ queries)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { StockMovementsTableQuery } from "../stock-movements-table.query";
import type { ListStockMovementsUseCase } from "@/core/use-cases/inventory/stock-movement";
import type { ListStockLocationsUseCase } from "@/core/use-cases/inventory/stock-location";
import type { ListAssetsUseCase } from "@/core/use-cases/asset/asset";
import type { ListPeopleUseCase } from "@/core/use-cases/foundation/person";
import type { IAssetAssignmentRepository } from "@/core/repositories/asset-assignment.repository.interface";
import type { StockMovement } from "@/core/domain/entities/stock-movement.entity";
import type { StockLocation } from "@/core/domain/entities/stock-location.entity";
import type { Asset } from "@/core/domain/entities/asset.entity";
import type { Person } from "@/core/domain/entities/person.entity";
import type { AssetAssignment } from "@/core/domain/entities/asset-assignment.entity";

/**
 * Query counter tracker
 */
class QueryCounter {
  private counts = new Map<string, number>();

  increment(queryType: string): void {
    this.counts.set(queryType, (this.counts.get(queryType) || 0) + 1);
  }

  getCount(queryType: string): number {
    return this.counts.get(queryType) || 0;
  }

  getTotalCount(): number {
    return Array.from(this.counts.values()).reduce(
      (sum, count) => sum + count,
      0,
    );
  }

  reset(): void {
    this.counts.clear();
  }

  getSummary(): Record<string, number> {
    return Object.fromEntries(this.counts);
  }
}

/**
 * Mock Use Cases with query counting
 */
class MockListStockMovementsUseCase
  implements Partial<ListStockMovementsUseCase>
{
  constructor(
    private queryCounter: QueryCounter,
    private movements: StockMovement[],
  ) {}

  async execute(): Promise<StockMovement[]> {
    this.queryCounter.increment("ListStockMovements");
    return this.movements;
  }
}

class MockListStockLocationsUseCase
  implements Partial<ListStockLocationsUseCase>
{
  constructor(
    private queryCounter: QueryCounter,
    private locations: StockLocation[],
  ) {}

  async execute(): Promise<StockLocation[]> {
    this.queryCounter.increment("ListStockLocations");
    return this.locations;
  }
}

class MockListAssetsUseCase implements Partial<ListAssetsUseCase> {
  constructor(
    private queryCounter: QueryCounter,
    private assets: Asset[],
  ) {}

  async execute(): Promise<Asset[]> {
    this.queryCounter.increment("ListAssets");
    return this.assets;
  }
}

class MockListPeopleUseCase implements Partial<ListPeopleUseCase> {
  constructor(
    private queryCounter: QueryCounter,
    private people: Person[],
  ) {}

  async execute(): Promise<Person[]> {
    this.queryCounter.increment("ListPeople");
    return this.people;
  }
}

class MockAssetAssignmentRepository
  implements Partial<IAssetAssignmentRepository>
{
  constructor(
    private queryCounter: QueryCounter,
    private assignments: Map<string, AssetAssignment>,
  ) {}

  async findById(id: string): Promise<AssetAssignment | null> {
    this.queryCounter.increment("AssetAssignment.findById");
    return this.assignments.get(id) || null;
  }
}

describe("StockMovementsTableQuery - N+1 Watch", () => {
  let queryCounter: QueryCounter;
  let query: StockMovementsTableQuery;

  // Test data
  const mockMovements: StockMovement[] = [];
  const mockLocations: StockLocation[] = [];
  const mockAssets: Asset[] = [];
  const mockPeople: Person[] = [];
  const mockAssignments = new Map<string, AssetAssignment>();

  beforeEach(() => {
    queryCounter = new QueryCounter();

    // Create test data - 100 movements with various entity references
    mockMovements.length = 0;
    mockLocations.length = 0;
    mockAssets.length = 0;
    mockPeople.length = 0;
    mockAssignments.clear();

    // Create 10 locations
    for (let i = 1; i <= 10; i++) {
      mockLocations.push({
        id: `loc-${i}`,
        name: `Location ${i}`,
      } as StockLocation);
    }

    // Create 20 assets
    for (let i = 1; i <= 20; i++) {
      mockAssets.push({
        id: `asset-${i}`,
        assetTag: `TAG-${i}`,
      } as Asset);
    }

    // Create 5 people
    for (let i = 1; i <= 5; i++) {
      mockPeople.push({
        id: `person-${i}`,
        fullName: `Person ${i}`,
        email: `person${i}@example.com`,
      } as unknown as Person);
    }

    // Create 100 movements (simulates a typical table view page)
    for (let i = 1; i <= 100; i++) {
      mockMovements.push({
        id: `movement-${i}`,
        movementType: i % 4 === 0 ? "TRANSFER" : "IN",
        source: i % 10 === 0 ? "ASSIGNMENT" : null,
        sourceReferenceType: i % 10 === 0 ? "AssetAssignment" : null,
        sourceReferenceId: i % 10 === 0 ? `assignment-${i}` : null,
        stockLocationFromId: i % 4 === 0 ? `loc-${(i % 10) + 1}` : null,
        stockLocationToId: `loc-${(i % 10) + 1}`,
        assetId: `asset-${(i % 20) + 1}`,
        quantity: 1,
        reason: `Movement ${i}`,
        performedById: `person-${(i % 5) + 1}`,
        occurredAt: new Date(),
        isVoided: () => false,
        voidedAt: null,
        voidedById: null,
        voidReason: null,
        createdAt: new Date(),
      } as unknown as StockMovement);
    }

    // Create 10 assignments (for ASSIGNMENT movements)
    for (let i = 1; i <= 10; i++) {
      const assignmentId = `assignment-${i * 10}`;
      mockAssignments.set(assignmentId, {
        id: assignmentId,
        assigneeType: "PERSON",
        assigneeId: `person-${(i % 5) + 1}`,
      } as AssetAssignment);
    }

    // Initialize query with mocked dependencies
    const mockListStockMovementsUseCase = new MockListStockMovementsUseCase(
      queryCounter,
      mockMovements,
    );
    const mockListStockLocationsUseCase = new MockListStockLocationsUseCase(
      queryCounter,
      mockLocations,
    );
    const mockListAssetsUseCase = new MockListAssetsUseCase(
      queryCounter,
      mockAssets,
    );
    const mockListPeopleUseCase = new MockListPeopleUseCase(
      queryCounter,
      mockPeople,
    );
    const mockAssetAssignmentRepository = new MockAssetAssignmentRepository(
      queryCounter,
      mockAssignments,
    );

    query = new StockMovementsTableQuery(
      mockListStockMovementsUseCase as unknown as ListStockMovementsUseCase,
      mockListStockLocationsUseCase as unknown as ListStockLocationsUseCase,
      mockListAssetsUseCase as unknown as ListAssetsUseCase,
      mockListPeopleUseCase as unknown as ListPeopleUseCase,
      mockAssetAssignmentRepository as unknown as IAssetAssignmentRepository,
    );
  });

  describe("N+1 Prevention", () => {
    it("should NOT cause N+1 queries when fetching 100 movements", async () => {
      // Act
      queryCounter.reset();
      const result = await query.listTableView({});

      // Assert
      expect(result).toHaveLength(100);

      const summary = queryCounter.getSummary();
      const totalQueries = queryCounter.getTotalCount();

      // Debug output (helps when test fails)
      console.log("Query breakdown:", summary);
      console.log("Total queries:", totalQueries);

      // Assertions - should be constant regardless of number of movements
      expect(queryCounter.getCount("ListStockMovements")).toBe(1); // Single query for all movements
      expect(queryCounter.getCount("ListStockLocations")).toBe(1); // Single query for all locations
      expect(queryCounter.getCount("ListAssets")).toBe(1); // Single query for all assets
      expect(queryCounter.getCount("ListPeople")).toBe(1); // Single query for all people (performers + voiders)

      // Assignment queries - 10 movements with assignments = 10 individual queries
      // This is acceptable for now, but could be optimized with bulk loading
      expect(
        queryCounter.getCount("AssetAssignment.findById"),
      ).toBeLessThanOrEqual(10);

      // Total queries should be under 20 (much better than 100+ with N+1)
      expect(totalQueries).toBeLessThanOrEqual(20);
    });

    it("should scale linearly (not quadratically) with more movements", async () => {
      // Act - Test with 10 movements first
      const smallMovements = mockMovements.slice(0, 10);
      const mockSmallUseCase = new MockListStockMovementsUseCase(
        queryCounter,
        smallMovements,
      );

      const smallQuery = new StockMovementsTableQuery(
        mockSmallUseCase as unknown as ListStockMovementsUseCase,
        new MockListStockLocationsUseCase(
          queryCounter,
          mockLocations,
        ) as unknown as ListStockLocationsUseCase,
        new MockListAssetsUseCase(
          queryCounter,
          mockAssets,
        ) as unknown as ListAssetsUseCase,
        new MockListPeopleUseCase(
          queryCounter,
          mockPeople,
        ) as unknown as ListPeopleUseCase,
        new MockAssetAssignmentRepository(
          queryCounter,
          mockAssignments,
        ) as unknown as IAssetAssignmentRepository,
      );

      queryCounter.reset();
      await smallQuery.listTableView({});
      const smallQueryCount = queryCounter.getTotalCount();

      // Now test with 100 movements
      queryCounter.reset();
      await query.listTableView({});
      const largeQueryCount = queryCounter.getTotalCount();

      // Assert - query count should stay roughly constant (not scale with data size)
      // With proper batching, 10x more data should NOT require 10x more queries
      console.log("10 movements:", smallQueryCount, "queries");
      console.log("100 movements:", largeQueryCount, "queries");

      // Query count difference should be minimal (just assignment queries)
      expect(largeQueryCount - smallQueryCount).toBeLessThan(15);
    });

    it("should handle movements with no related entities gracefully", async () => {
      // Arrange - movements with minimal references
      const sparseMovements: StockMovement[] = [
        {
          id: "movement-1",
          movementType: "IN",
          source: null,
          sourceReferenceType: null,
          sourceReferenceId: null,
          stockLocationFromId: null,
          stockLocationToId: "loc-1",
          assetId: null,
          quantity: 1,
          reason: null,
          performedById: "person-1",
          occurredAt: new Date(),
          isVoided: () => false,
          voidedAt: null,
          voidedById: null,
          voidReason: null,
          createdAt: new Date(),
        } as unknown as StockMovement,
      ];

      const mockSparseUseCase = new MockListStockMovementsUseCase(
        queryCounter,
        sparseMovements,
      );

      const sparseQuery = new StockMovementsTableQuery(
        mockSparseUseCase as unknown as ListStockMovementsUseCase,
        new MockListStockLocationsUseCase(
          queryCounter,
          mockLocations,
        ) as unknown as ListStockLocationsUseCase,
        new MockListAssetsUseCase(
          queryCounter,
          mockAssets,
        ) as unknown as ListAssetsUseCase,
        new MockListPeopleUseCase(
          queryCounter,
          mockPeople,
        ) as unknown as ListPeopleUseCase,
        new MockAssetAssignmentRepository(
          queryCounter,
          mockAssignments,
        ) as unknown as IAssetAssignmentRepository,
      );

      // Act
      queryCounter.reset();
      const result = await sparseQuery.listTableView({});

      // Assert
      expect(result).toHaveLength(1);
      const totalQueries = queryCounter.getTotalCount();

      // Should still only make the base 4 queries (movements, locations, assets, people)
      expect(totalQueries).toBeLessThanOrEqual(4);
    });
  });

  describe("Batching Edge Cases", () => {
    it("should handle empty result set without unnecessary queries", async () => {
      // Arrange
      const mockEmptyUseCase = new MockListStockMovementsUseCase(
        queryCounter,
        [],
      );

      const emptyQuery = new StockMovementsTableQuery(
        mockEmptyUseCase as unknown as ListStockMovementsUseCase,
        new MockListStockLocationsUseCase(
          queryCounter,
          mockLocations,
        ) as unknown as ListStockLocationsUseCase,
        new MockListAssetsUseCase(
          queryCounter,
          mockAssets,
        ) as unknown as ListAssetsUseCase,
        new MockListPeopleUseCase(
          queryCounter,
          mockPeople,
        ) as unknown as ListPeopleUseCase,
        new MockAssetAssignmentRepository(
          queryCounter,
          mockAssignments,
        ) as unknown as IAssetAssignmentRepository,
      );

      // Act
      queryCounter.reset();
      const result = await emptyQuery.listTableView({});

      // Assert
      expect(result).toHaveLength(0);

      // Should only make 1 query (ListStockMovements), then short-circuit
      expect(queryCounter.getTotalCount()).toBe(1);
    });

    it("should batch duplicate entity references efficiently", async () => {
      // Arrange - all movements reference same entities
      const duplicateMovements: StockMovement[] = Array.from(
        { length: 50 },
        (_, i) =>
          ({
            id: `movement-${i}`,
            movementType: "IN",
            source: null,
            sourceReferenceType: null,
            sourceReferenceId: null,
            stockLocationFromId: null,
            stockLocationToId: "loc-1", // Same location
            assetId: "asset-1", // Same asset
            quantity: 1,
            reason: null,
            performedById: "person-1", // Same person
            occurredAt: new Date(),
            isVoided: () => false,
            voidedAt: null,
            voidedById: null,
            voidReason: null,
            createdAt: new Date(),
          }) as unknown as StockMovement,
      );

      const mockDuplicateUseCase = new MockListStockMovementsUseCase(
        queryCounter,
        duplicateMovements,
      );

      const duplicateQuery = new StockMovementsTableQuery(
        mockDuplicateUseCase as unknown as ListStockMovementsUseCase,
        new MockListStockLocationsUseCase(
          queryCounter,
          mockLocations,
        ) as unknown as ListStockLocationsUseCase,
        new MockListAssetsUseCase(
          queryCounter,
          mockAssets,
        ) as unknown as ListAssetsUseCase,
        new MockListPeopleUseCase(
          queryCounter,
          mockPeople,
        ) as unknown as ListPeopleUseCase,
        new MockAssetAssignmentRepository(
          queryCounter,
          mockAssignments,
        ) as unknown as IAssetAssignmentRepository,
      );

      // Act
      queryCounter.reset();
      const result = await duplicateQuery.listTableView({});

      // Assert
      expect(result).toHaveLength(50);

      // Should still only make 4 base queries (batching handles duplicates)
      const totalQueries = queryCounter.getTotalCount();
      expect(totalQueries).toBeLessThanOrEqual(4);
    });
  });
});
