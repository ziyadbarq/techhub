/**
 * Asset Reservations Table Query - N+1 Watch Test
 *
 * Performance regression tests to ensure the query layer prevents N+1 queries.
 *
 * WHAT THIS TESTS:
 * - Verifies that fetching enriched asset reservations doesn't cause N+1 queries
 * - Asserts maximum number of database queries stays under threshold
 * - Catches performance regressions when batching breaks
 *
 * WHY THIS MATTERS:
 * - N+1 queries can kill performance with large datasets
 * - Easy to accidentally break batching with refactoring
 * - CI will catch regressions before they reach production
 *
 * THRESHOLD LOGIC:
 * - Base queries: ListReservations (1), ListAssets (1), ListPeople (1 when any person references exist)
 * - Total: Should stay between 2-3 queries for 100 reservations (not 100+ queries)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AssetReservationsTableQuery } from "../asset-reservations-table.query";
import type { ListReservationsUseCase } from "@/core/use-cases/reservations";
import type { ListAssetsUseCase } from "@/core/use-cases/asset/asset";
import type { ListPeopleUseCase } from "@/core/use-cases/foundation/person";
import type { AssetReservation } from "@/core/domain/entities/asset-reservation.entity";
import type { Asset } from "@/core/domain/entities/asset.entity";
import type { Person } from "@/core/domain/entities/person.entity";

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
class MockListReservationsUseCase implements Partial<ListReservationsUseCase> {
  constructor(
    private queryCounter: QueryCounter,
    private reservations: AssetReservation[],
  ) {}

  async execute(): Promise<{
    reservations: AssetReservation[];
    total: number;
  }> {
    this.queryCounter.increment("ListReservations");
    return {
      reservations: this.reservations,
      total: this.reservations.length,
    };
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

describe("AssetReservationsTableQuery - N+1 Watch", () => {
  let queryCounter: QueryCounter;
  let query: AssetReservationsTableQuery;

  // Test data
  const mockReservations: AssetReservation[] = [];
  const mockAssets: Asset[] = [];
  const mockPeople: Person[] = [];

  beforeEach(() => {
    queryCounter = new QueryCounter();

    // Create test data - 100 reservations with various entity references
    mockReservations.length = 0;
    mockAssets.length = 0;
    mockPeople.length = 0;

    // Create 20 assets
    for (let i = 1; i <= 20; i++) {
      mockAssets.push({
        id: `asset-${i}`,
        assetTag: `TAG-${i}`,
        assetModelId: `model-${i % 5}`,
      } as unknown as Asset);
    }

    // Create 10 people
    for (let i = 1; i <= 10; i++) {
      mockPeople.push({
        id: `person-${i}`,
        fullName: `Person ${i}`,
        email: `person${i}@example.com`,
      } as unknown as Person);
    }

    // Create 100 reservations (simulates a typical table view page)
    for (let i = 1; i <= 100; i++) {
      mockReservations.push({
        id: `reservation-${i}`,
        assetId: `asset-${(i % 20) + 1}`,
        reservedForPersonId: i % 2 === 0 ? `person-${(i % 10) + 1}` : null,
        reservedForOrgUnitId: i % 2 === 0 ? null : `orgunit-${i % 5}`,
        status: ["PENDING", "CONFIRMED", "ACTIVE"][i % 3] as
          | "PENDING"
          | "CONFIRMED"
          | "ACTIVE",
        startDate: new Date(Date.now() + i * 86400000),
        endDate: new Date(Date.now() + (i + 7) * 86400000),
        actualCheckoutDate: null,
        actualReturnDate: null,
        purpose: `Purpose ${i}`,
        note: null,
        confirmationDate: i % 3 === 1 ? new Date() : null,
        confirmedById: i % 3 === 1 ? `person-${(i % 10) + 1}` : null,
        cancellationDate: null,
        cancellationReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as AssetReservation);
    }

    // Initialize query with mocked dependencies
    const mockListReservationsUseCase = new MockListReservationsUseCase(
      queryCounter,
      mockReservations,
    );
    const mockListAssetsUseCase = new MockListAssetsUseCase(
      queryCounter,
      mockAssets,
    );
    const mockListPeopleUseCase = new MockListPeopleUseCase(
      queryCounter,
      mockPeople,
    );

    query = new AssetReservationsTableQuery(
      mockListReservationsUseCase as unknown as ListReservationsUseCase,
      mockListAssetsUseCase as unknown as ListAssetsUseCase,
      mockListPeopleUseCase as unknown as ListPeopleUseCase,
    );
  });

  describe("N+1 Prevention", () => {
    it("should NOT cause N+1 queries when fetching 100 reservations", async () => {
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

      // Assertions - should be constant regardless of number of reservations
      expect(queryCounter.getCount("ListReservations")).toBe(1); // Single query for all reservations
      expect(queryCounter.getCount("ListAssets")).toBe(1); // Single query for all assets
      expect(queryCounter.getCount("ListPeople")).toBe(1); // Single query for all people (reserved for + confirmed by)

      // Total queries should be exactly 3 (much better than 100+ with N+1)
      expect(totalQueries).toBe(3);
    });

    it("should scale linearly (not quadratically) with more reservations", async () => {
      // Act - Test with 10 reservations first
      const smallReservations = mockReservations.slice(0, 10);
      const mockSmallUseCase = new MockListReservationsUseCase(
        queryCounter,
        smallReservations,
      );

      const smallQuery = new AssetReservationsTableQuery(
        mockSmallUseCase as unknown as ListReservationsUseCase,
        new MockListAssetsUseCase(
          queryCounter,
          mockAssets,
        ) as unknown as ListAssetsUseCase,
        new MockListPeopleUseCase(
          queryCounter,
          mockPeople,
        ) as unknown as ListPeopleUseCase,
      );

      queryCounter.reset();
      await smallQuery.listTableView({});
      const smallQueryCount = queryCounter.getTotalCount();

      // Now test with 100 reservations
      queryCounter.reset();
      await query.listTableView({});
      const largeQueryCount = queryCounter.getTotalCount();

      // Assert - query count should stay constant (not scale with data size)
      console.log("10 reservations:", smallQueryCount, "queries");
      console.log("100 reservations:", largeQueryCount, "queries");

      // With proper batching, 10x more data requires same number of queries
      expect(largeQueryCount).toBe(smallQueryCount);
      expect(largeQueryCount).toBe(3);
    });

    it("should handle reservations with no person references gracefully", async () => {
      // Arrange - reservations with only org unit (no person)
      const orgOnlyReservations: AssetReservation[] = [
        {
          id: "reservation-1",
          assetId: "asset-1",
          reservedForPersonId: null,
          reservedForOrgUnitId: "orgunit-1",
          status: "PENDING",
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 86400000),
          actualCheckoutDate: null,
          actualReturnDate: null,
          purpose: "Test",
          note: null,
          confirmationDate: null,
          confirmedById: null,
          cancellationDate: null,
          cancellationReason: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as AssetReservation,
      ];

      const mockOrgOnlyUseCase = new MockListReservationsUseCase(
        queryCounter,
        orgOnlyReservations,
      );

      const orgOnlyQuery = new AssetReservationsTableQuery(
        mockOrgOnlyUseCase as unknown as ListReservationsUseCase,
        new MockListAssetsUseCase(
          queryCounter,
          mockAssets,
        ) as unknown as ListAssetsUseCase,
        new MockListPeopleUseCase(
          queryCounter,
          mockPeople,
        ) as unknown as ListPeopleUseCase,
      );

      // Act
      queryCounter.reset();
      const result = await orgOnlyQuery.listTableView({});

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].reservedForPersonName).toBeNull();

      const totalQueries = queryCounter.getTotalCount();

      // Should only make the reservations + assets queries (no person lookups needed)
      expect(totalQueries).toBe(2);
    });
  });

  describe("Batching Edge Cases", () => {
    it("should handle empty result set without unnecessary queries", async () => {
      // Arrange
      const mockEmptyUseCase = new MockListReservationsUseCase(
        queryCounter,
        [],
      );

      const emptyQuery = new AssetReservationsTableQuery(
        mockEmptyUseCase as unknown as ListReservationsUseCase,
        new MockListAssetsUseCase(
          queryCounter,
          mockAssets,
        ) as unknown as ListAssetsUseCase,
        new MockListPeopleUseCase(
          queryCounter,
          mockPeople,
        ) as unknown as ListPeopleUseCase,
      );

      // Act
      queryCounter.reset();
      const result = await emptyQuery.listTableView({});

      // Assert
      expect(result).toHaveLength(0);

      // Should only make 1 query (ListReservations), then short-circuit
      expect(queryCounter.getTotalCount()).toBe(1);
    });

    it("should batch duplicate entity references efficiently", async () => {
      // Arrange - all reservations reference same entities
      const duplicateReservations: AssetReservation[] = Array.from(
        { length: 50 },
        (_, i) =>
          ({
            id: `reservation-${i}`,
            assetId: "asset-1", // Same asset
            reservedForPersonId: "person-1", // Same person
            reservedForOrgUnitId: null,
            status: "PENDING",
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 86400000),
            actualCheckoutDate: null,
            actualReturnDate: null,
            purpose: "Test",
            note: null,
            confirmationDate: new Date(),
            confirmedById: "person-2", // Same confirmer
            cancellationDate: null,
            cancellationReason: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }) as unknown as AssetReservation,
      );

      const mockDuplicateUseCase = new MockListReservationsUseCase(
        queryCounter,
        duplicateReservations,
      );

      const duplicateQuery = new AssetReservationsTableQuery(
        mockDuplicateUseCase as unknown as ListReservationsUseCase,
        new MockListAssetsUseCase(
          queryCounter,
          mockAssets,
        ) as unknown as ListAssetsUseCase,
        new MockListPeopleUseCase(
          queryCounter,
          mockPeople,
        ) as unknown as ListPeopleUseCase,
      );

      // Act
      queryCounter.reset();
      const result = await duplicateQuery.listTableView({});

      // Assert
      expect(result).toHaveLength(50);

      // Should still only make 3 base queries (batching handles duplicates)
      const totalQueries = queryCounter.getTotalCount();
      expect(totalQueries).toBe(3);
    });

    it("should efficiently handle mixed person/orgunit reservations", async () => {
      // Arrange - mix of person and org unit reservations
      const mixedReservations: AssetReservation[] = [
        ...Array.from(
          { length: 25 },
          (_, i) =>
            ({
              id: `reservation-person-${i}`,
              assetId: `asset-${(i % 10) + 1}`,
              reservedForPersonId: `person-${(i % 10) + 1}`,
              reservedForOrgUnitId: null,
              status: "PENDING" as const,
              startDate: new Date(),
              endDate: new Date(Date.now() + 7 * 86400000),
              actualCheckoutDate: null,
              actualReturnDate: null,
              purpose: "Person reservation",
              note: null,
              confirmationDate: null,
              confirmedById: null,
              cancellationDate: null,
              cancellationReason: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            }) as unknown as AssetReservation,
        ),
        ...Array.from(
          { length: 25 },
          (_, i) =>
            ({
              id: `reservation-orgunit-${i}`,
              assetId: `asset-${(i % 10) + 1}`,
              reservedForPersonId: null,
              reservedForOrgUnitId: `orgunit-${i % 5}`,
              status: "PENDING" as const,
              startDate: new Date(),
              endDate: new Date(Date.now() + 7 * 86400000),
              actualCheckoutDate: null,
              actualReturnDate: null,
              purpose: "Org unit reservation",
              note: null,
              confirmationDate: null,
              confirmedById: null,
              cancellationDate: null,
              cancellationReason: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            }) as unknown as AssetReservation,
        ),
      ];

      const mockMixedUseCase = new MockListReservationsUseCase(
        queryCounter,
        mixedReservations,
      );

      const mixedQuery = new AssetReservationsTableQuery(
        mockMixedUseCase as unknown as ListReservationsUseCase,
        new MockListAssetsUseCase(
          queryCounter,
          mockAssets,
        ) as unknown as ListAssetsUseCase,
        new MockListPeopleUseCase(
          queryCounter,
          mockPeople,
        ) as unknown as ListPeopleUseCase,
      );

      // Act
      queryCounter.reset();
      const result = await mixedQuery.listTableView({});

      // Assert
      expect(result).toHaveLength(50);

      // Should still only make 3 base queries
      const totalQueries = queryCounter.getTotalCount();
      expect(totalQueries).toBe(3);

      // Verify person names are populated for person reservations only
      const personReservations = result.filter(
        (r) => r.reservedForPersonId !== null,
      );
      const orgReservations = result.filter(
        (r) => r.reservedForOrgUnitId !== null,
      );

      expect(personReservations.length).toBe(25);
      expect(orgReservations.length).toBe(25);

      // Person reservations should have person names
      personReservations.forEach((r) => {
        expect(r.reservedForPersonName).toBeTruthy();
      });

      // Org unit reservations should NOT have person names
      orgReservations.forEach((r) => {
        expect(r.reservedForPersonName).toBeNull();
      });
    });
  });
});
