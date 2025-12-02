/**
 * Asset Reservations Table View Query
 *
 * Provides enriched asset reservation data for table views with batched entity lookups.
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
 * const query = resolve<AssetReservationsTableQuery>(DI_TOKENS.AssetReservationsTableQuery);
 * const enrichedReservations = await query.listTableView({ assetId: '...' });
 * ```
 */

import { injectable, inject } from "inversify";
import { DI_TOKENS } from "@/di/types";
import type { IBaseQuery } from "./base-query.interface";
import type { BatchLoader } from "./batch-loader";
import { createBatchLoader } from "./batch-loader";
import type { ListReservationsUseCase } from "@/core/use-cases/reservations";
import type { ListAssetsUseCase } from "@/core/use-cases/asset/asset";
import type { ListPeopleUseCase } from "@/core/use-cases/foundation/person";
import type { AssetReservation } from "@/core/domain/entities/asset-reservation.entity";
import type { Asset } from "@/core/domain/entities/asset.entity";
import type { Person } from "@/core/domain/entities/person.entity";

/**
 * Enriched asset reservation for table display
 */
export interface EnrichedAssetReservation {
  id: string;
  assetId: string;
  assetTag: string | null;
  assetModelId: string | null;
  reservedForPersonId: string | null;
  reservedForPersonName: string | null;
  reservedForPersonEmail: string | null;
  reservedForOrgUnitId: string | null;
  status: "PENDING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  startDate: Date;
  endDate: Date;
  purpose: string | null;
  note: string | null;
  confirmationDate: Date | null;
  confirmedById: string | null;
  confirmedByName: string | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Filter options for asset reservations table view
 */
export interface AssetReservationsTableFilter {
  assetId?: string;
  reservedByPersonId?: string;
  reservedByOrgUnitId?: string;
  status?: "PENDING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  startDate?: Date;
  endDate?: Date;
}

@injectable()
export class AssetReservationsTableQuery implements IBaseQuery {
  private assetLoader: BatchLoader<string, Asset> | null = null;
  private personLoader: BatchLoader<string, Person> | null = null;

  constructor(
    @inject(DI_TOKENS.ListReservationsUseCase)
    private readonly listReservationsUseCase: ListReservationsUseCase,
    @inject(DI_TOKENS.ListAssetsUseCase)
    private readonly listAssetsUseCase: ListAssetsUseCase,
    @inject(DI_TOKENS.ListPersonsUseCase)
    private readonly listPeopleUseCase: ListPeopleUseCase,
  ) {}

  /**
   * List asset reservations with enriched data for table view
   *
   * Batches all entity lookups to prevent N+1 queries.
   */
  async listTableView(
    filter?: AssetReservationsTableFilter,
  ): Promise<EnrichedAssetReservation[]> {
    // 1. Fetch base reservations (single query via use case)
    const result = await this.listReservationsUseCase.execute(filter || {});

    if (result.reservations.length === 0) {
      return [];
    }

    // 2. Initialize batch loaders for this request
    this.initializeBatchLoaders();

    // 3. Enrich reservations with batched lookups
    const enrichedReservations = await Promise.all(
      result.reservations.map((reservation) =>
        this.enrichReservation(reservation),
      ),
    );

    // 4. Clean up loaders
    this.clearBatchLoaders();

    return enrichedReservations;
  }

  /**
   * Initialize batch loaders for this request scope
   */
  private initializeBatchLoaders(): void {
    // Asset Loader
    this.assetLoader = createBatchLoader<string, Asset>(async (ids) => {
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
  }

  /**
   * Clear batch loaders after request completes
   */
  private clearBatchLoaders(): void {
    this.assetLoader = null;
    this.personLoader = null;
  }

  /**
   * Enrich a single asset reservation with related entity data
   */
  private async enrichReservation(
    reservation: AssetReservation,
  ): Promise<EnrichedAssetReservation> {
    // Batch load all related entities
    const [asset, reservedForPerson, confirmedBy] = await Promise.all([
      this.assetLoader!.load(reservation.assetId),
      reservation.reservedForPersonId
        ? this.personLoader!.load(reservation.reservedForPersonId)
        : Promise.resolve(null),
      reservation.confirmedById
        ? this.personLoader!.load(reservation.confirmedById)
        : Promise.resolve(null),
    ]);

    return {
      id: reservation.id,
      assetId: reservation.assetId,
      assetTag: asset?.assetTag ?? null,
      assetModelId: asset?.assetModelId ?? null,
      reservedForPersonId: reservation.reservedForPersonId,
      reservedForPersonName: reservedForPerson?.fullName ?? null,
      reservedForPersonEmail: reservedForPerson?.email ?? null,
      reservedForOrgUnitId: reservation.reservedForOrgUnitId,
      status: reservation.status,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      purpose: reservation.purpose,
      note: reservation.note,
      confirmationDate: reservation.confirmationDate,
      confirmedById: reservation.confirmedById,
      confirmedByName: confirmedBy?.fullName ?? null,
      cancelledAt: reservation.cancelledAt,
      cancellationReason: reservation.cancellationReason,
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt,
    };
  }
}
