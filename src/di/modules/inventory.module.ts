/**
 * Inventory Module - DI Bindings
 *
 * This module configures all Inventory layer dependencies:
 * - Stock Locations (warehouse/storage locations)
 * - Stock Movements (inventory tracking, receive/issue/transfer/adjust)
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { logger } from "@/lib/logger";

// Stock Location Repository
import type { IStockLocationRepository } from "@/core/repositories/stock-location.repository.interface";
import { PrismaStockLocationRepository } from "@/infrastructure/repositories/prisma-stock-location.repository";

// Stock Location Use Cases
import { CreateStockLocationUseCase } from "@/core/use-cases/inventory/stock-location/create-stock-location.use-case";
import { GetStockLocationUseCase } from "@/core/use-cases/inventory/stock-location/get-stock-location.use-case";
import { ListStockLocationsUseCase } from "@/core/use-cases/inventory/stock-location/list-stock-locations.use-case";
import { UpdateStockLocationUseCase } from "@/core/use-cases/inventory/stock-location/update-stock-location.use-case";
import { DeleteStockLocationUseCase } from "@/core/use-cases/inventory/stock-location/delete-stock-location.use-case";

// Stock Movement Repository
import type { IStockMovementRepository } from "@/core/repositories/stock-movement.repository.interface";
import { PrismaStockMovementRepository } from "@/infrastructure/repositories/prisma-stock-movement.repository";

// Stock Movement Use Cases
import { CreateStockMovementUseCase } from "@/core/use-cases/inventory/stock-movement/create-stock-movement.use-case";
import { GetStockMovementUseCase } from "@/core/use-cases/inventory/stock-movement/get-stock-movement.use-case";
import { ListStockMovementsUseCase } from "@/core/use-cases/inventory/stock-movement/list-stock-movements.use-case";
import { DeleteStockMovementUseCase } from "@/core/use-cases/inventory/stock-movement/delete-stock-movement.use-case";
import { VoidStockMovementUseCase } from "@/core/use-cases/inventory/stock-movement/void-stock-movement.use-case";

// Asset Movement Service
import type { IAssetMovementService } from "@/core/services/asset-movement.service.interface";
import { AssetMovementService } from "@/infrastructure/services/asset-movement.service";

// Query Layer
import { StockMovementsTableQuery } from "@/interface-adapters/queries";

const diLogger = logger.scope("DI:InventoryModule");

/**
 * Bind all Inventory-related dependencies
 */
export function bindInventoryDependencies(container: Container): void {
  diLogger.debug(
    "bindInventoryDependencies",
    "Binding inventory dependencies...",
  );

  // ==========================================
  // Stock Location Repository
  // ==========================================

  container
    .bind<IStockLocationRepository>(DI_TOKENS.IStockLocationRepository)
    .to(PrismaStockLocationRepository)
    .inSingletonScope();

  // ==========================================
  // Stock Location Use Cases
  // ==========================================

  container
    .bind<CreateStockLocationUseCase>(DI_TOKENS.CreateStockLocationUseCase)
    .to(CreateStockLocationUseCase)
    .inTransientScope();

  container
    .bind<GetStockLocationUseCase>(DI_TOKENS.GetStockLocationUseCase)
    .to(GetStockLocationUseCase)
    .inTransientScope();

  container
    .bind<ListStockLocationsUseCase>(DI_TOKENS.ListStockLocationsUseCase)
    .to(ListStockLocationsUseCase)
    .inTransientScope();

  container
    .bind<UpdateStockLocationUseCase>(DI_TOKENS.UpdateStockLocationUseCase)
    .to(UpdateStockLocationUseCase)
    .inTransientScope();

  container
    .bind<DeleteStockLocationUseCase>(DI_TOKENS.DeleteStockLocationUseCase)
    .to(DeleteStockLocationUseCase)
    .inTransientScope();

  // ==========================================
  // Stock Movement Repository
  // ==========================================

  container
    .bind<IStockMovementRepository>(DI_TOKENS.IStockMovementRepository)
    .to(PrismaStockMovementRepository)
    .inSingletonScope();

  // ==========================================
  // Stock Movement Use Cases
  // ==========================================

  container
    .bind<CreateStockMovementUseCase>(DI_TOKENS.CreateStockMovementUseCase)
    .to(CreateStockMovementUseCase)
    .inTransientScope();

  container
    .bind<GetStockMovementUseCase>(DI_TOKENS.GetStockMovementUseCase)
    .to(GetStockMovementUseCase)
    .inTransientScope();

  container
    .bind<ListStockMovementsUseCase>(DI_TOKENS.ListStockMovementsUseCase)
    .to(ListStockMovementsUseCase)
    .inTransientScope();

  container
    .bind<DeleteStockMovementUseCase>(DI_TOKENS.DeleteStockMovementUseCase)
    .to(DeleteStockMovementUseCase)
    .inTransientScope();

  container
    .bind<VoidStockMovementUseCase>(DI_TOKENS.VoidStockMovementUseCase)
    .to(VoidStockMovementUseCase)
    .inTransientScope();

  // ==========================================
  // Asset Movement Service
  // ==========================================

  container
    .bind<IAssetMovementService>(DI_TOKENS.IAssetMovementService)
    .to(AssetMovementService)
    .inSingletonScope();

  // ==========================================
  // Query Layer - Stock Movements
  // ==========================================

  container
    .bind<StockMovementsTableQuery>(DI_TOKENS.StockMovementsTableQuery)
    .to(StockMovementsTableQuery)
    .inTransientScope();

  diLogger.debug(
    "bindInventoryDependencies",
    "Inventory dependencies bound successfully",
  );
}
