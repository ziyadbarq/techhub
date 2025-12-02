/**
 * Stock Movements Table View Query
 *
 * Provides enriched stock movement data for table views with batched entity lookups.
 *
 * ARCHITECTURE:
 * - Query layer (interface-adapters) - UI aggregation and batching
 * - Delegates to use cases for business logic
 * - NEVER calls repositories directly (use cases only)
 *
 * BATCHING:
 * - Uses DataLoader pattern to batch entity lookups
 * - Prevents N+1 queries when loading related entities
 * - Single request scope cache (no cross-request caching)
 *
 * USAGE:
 * ```typescript
 * const query = resolve<StockMovementsTableQuery>(DI_TOKENS.StockMovementsTableQuery);
 * const enrichedMovements = await query.listTableView({ assetId: '...' });
 * ```
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IBaseQuery } from "./base-query.interface";
import type { BatchLoader } from "./batch-loader";
import { createBatchLoader } from "./batch-loader";
import type { ListStockMovementsUseCase } from "@/core/use-cases/inventory/stock-movement";
import type { ListStockLocationsUseCase } from "@/core/use-cases/inventory/stock-location";
import type { ListAssetsUseCase } from "@/core/use-cases/asset/asset";
import type { ListPeopleUseCase } from "@/core/use-cases/foundation/person";
import type { IAssetAssignmentRepository } from "@/core/repositories/asset-assignment.repository.interface";
import type {
  StockMovement,
  StockMovementType,
} from "@/core/domain/entities/stock-movement.entity";
import type { StockLocation } from "@/core/domain/entities/stock-location.entity";
import type { Asset } from "@/core/domain/entities/asset.entity";
import type { Person } from "@/core/domain/entities/person.entity";
import type { AssetAssignment } from "@/core/domain/entities/asset-assignment.entity";

/**
 * Enriched stock movement for table display
 */
export interface EnrichedStockMovement {
  id: string;
  movementType: string;
  source: string | null;
  sourceReferenceType: string | null;
  sourceReferenceId: string | null;
  stockLocationFromId: string | null;
  stockLocationToId: string | null;
  stockLocationFromName: string | null;
  stockLocationToName: string | null;
  assetId: string | null;
  assetTag: string | null;
  quantity: number;
  reason: string | null;
  performedById: string;
  performedByName: string;
  performedByEmail: string | null;
  occurredAt: Date;
  isVoided: boolean;
  voidedAt: Date | null;
  voidedById: string | null;
  voidedByName: string | null;
  voidReason: string | null;
  assignedToName: string | null; // For ASSIGNMENT/RETURN movements
  createdAt: Date;
}

/**
 * Filter options for stock movements table view
 * Extends the use case filter options
 */
export interface StockMovementsTableFilter {
  skip?: number;
  take?: number;
  orderBy?: "occurredAt" | "createdAt" | "movementType";
  order?: "asc" | "desc";
  assetId?: string;
  stockLocationId?: string;
  performedById?: string;
  movementType?: StockMovementType;
  startDate?: Date;
  endDate?: Date;
}

@injectable()
export class StockMovementsTableQuery implements IBaseQuery {
  private stockLocationLoader: BatchLoader<string, StockLocation> | null = null;
  private assetLoader: BatchLoader<string, Asset> | null = null;
  private personLoader: BatchLoader<string, Person> | null = null;
  private assignmentLoader: BatchLoader<string, AssetAssignment> | null = null;

  constructor(
    @inject(DI_TOKENS.ListStockMovementsUseCase)
    private readonly listStockMovementsUseCase: ListStockMovementsUseCase,
    @inject(DI_TOKENS.ListStockLocationsUseCase)
    private readonly listStockLocationsUseCase: ListStockLocationsUseCase,
    @inject(DI_TOKENS.ListAssetsUseCase)
    private readonly listAssetsUseCase: ListAssetsUseCase,
    @inject(DI_TOKENS.ListPersonsUseCase)
    private readonly listPeopleUseCase: ListPeopleUseCase,
    @inject(DI_TOKENS.IAssetAssignmentRepository)
    private readonly assetAssignmentRepository: IAssetAssignmentRepository,
  ) {}

  /**
   * List stock movements with enriched data for table view
   *
   * Batches all entity lookups to prevent N+1 queries.
   */
  async listTableView(
    filter?: StockMovementsTableFilter,
  ): Promise<EnrichedStockMovement[]> {
    // 1. Fetch base stock movements (single query via use case)
    const movements = await this.listStockMovementsUseCase.execute(filter);

    if (movements.length === 0) {
      return [];
    }

    // 2. Initialize batch loaders for this request
    this.initializeBatchLoaders();

    // 3. Enrich movements with batched lookups
    const enrichedMovements = await Promise.all(
      movements.map((movement) => this.enrichMovement(movement)),
    );

    // 4. Clean up loaders
    this.clearBatchLoaders();

    return enrichedMovements;
  }

  /**
   * Initialize batch loaders for this request scope
   */
  private initializeBatchLoaders(): void {
    // Stock Location Loader
    this.stockLocationLoader = createBatchLoader<string, StockLocation>(
      async (ids) => {
        const locations = await this.listStockLocationsUseCase.execute();
        const locationsMap = new Map(locations.map((l) => [l.id, l]));
        return ids.map((id) => locationsMap.get(id) ?? null);
      },
    );

    // Asset Loader
    this.assetLoader = createBatchLoader<string, Asset>(async (ids) => {
      // Use case will handle efficient batch lookup
      const assets = await this.listAssetsUseCase.execute({});
      const assetsMap = new Map(assets.map((a) => [a.id, a]));
      return ids.map((id) => assetsMap.get(id) ?? null);
    });

    // Person Loader
    this.personLoader = createBatchLoader<string, Person>(async (ids) => {
      const persons = await this.listPeopleUseCase.execute();
      const personsMap = new Map(persons.map((p) => [p.id, p]));
      return ids.map((id) => personsMap.get(id) ?? null);
    });

    // Assignment Loader (for ASSIGNMENT/RETURN movements)
    this.assignmentLoader = createBatchLoader<string, AssetAssignment>(
      async (ids) => {
        const assignments = await Promise.all(
          ids.map((id) => this.assetAssignmentRepository.findById(id)),
        );
        return assignments.map((assignment) => assignment ?? null);
      },
    );
  }

  /**
   * Clear batch loaders after request completes
   */
  private clearBatchLoaders(): void {
    this.stockLocationLoader = null;
    this.assetLoader = null;
    this.personLoader = null;
    this.assignmentLoader = null;
  }

  /**
   * Enrich a single stock movement with related entity data
   */
  private async enrichMovement(
    movement: StockMovement,
  ): Promise<EnrichedStockMovement> {
    // Batch load all related entities
    const [
      stockLocationFrom,
      stockLocationTo,
      asset,
      performedBy,
      voidedBy,
      assignment,
    ] = await Promise.all([
      movement.stockLocationFromId
        ? this.stockLocationLoader!.load(movement.stockLocationFromId)
        : Promise.resolve(null),
      movement.stockLocationToId
        ? this.stockLocationLoader!.load(movement.stockLocationToId)
        : Promise.resolve(null),
      movement.assetId
        ? this.assetLoader!.load(movement.assetId)
        : Promise.resolve(null),
      this.personLoader!.load(movement.performedById),
      movement.voidedById
        ? this.personLoader!.load(movement.voidedById)
        : Promise.resolve(null),
      // Load assignment for ASSIGNMENT/RETURN movements
      movement.sourceReferenceType === "AssetAssignment" &&
      movement.sourceReferenceId &&
      (movement.source === "ASSIGNMENT" || movement.source === "RETURN")
        ? this.assignmentLoader!.load(movement.sourceReferenceId)
        : Promise.resolve(null),
    ]);

    // Load assigned person name if assignment exists
    let assignedToName: string | null = null;
    if (assignment && assignment.assigneeType === "PERSON") {
      const assignedPerson = await this.personLoader!.load(
        assignment.assigneeId,
      );
      assignedToName = assignedPerson?.fullName ?? null;
    }

    return {
      id: movement.id,
      movementType: movement.movementType,
      source: movement.source,
      sourceReferenceType: movement.sourceReferenceType,
      sourceReferenceId: movement.sourceReferenceId,
      stockLocationFromId: movement.stockLocationFromId,
      stockLocationToId: movement.stockLocationToId,
      stockLocationFromName: stockLocationFrom?.name ?? null,
      stockLocationToName: stockLocationTo?.name ?? null,
      assetId: movement.assetId,
      assetTag: asset?.assetTag ?? null,
      quantity: movement.quantity,
      reason: movement.reason,
      performedById: movement.performedById,
      performedByName: performedBy?.fullName ?? "Unknown",
      performedByEmail: performedBy?.email ?? null,
      occurredAt: movement.occurredAt,
      isVoided: movement.isVoided(),
      voidedAt: movement.voidedAt,
      voidedById: movement.voidedById,
      voidedByName: voidedBy?.fullName ?? null,
      voidReason: movement.voidReason,
      assignedToName,
      createdAt: movement.createdAt,
    };
  }
}
