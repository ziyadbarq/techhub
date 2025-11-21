/**
 * Asset Kits Module - DI Bindings
 *
 * This module configures all Asset Kits dependencies:
 * - Repositories (kits, kit items, checkouts, checkout items)
 * - Use cases (kit management, checkout workflow, item tracking)
 *
 * Asset Kits module enables bundling assets into predefined kits
 * (e.g., "New Employee Kit" with laptop, mouse, keyboard) and
 * checking them out as a unit with individual item tracking.
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { logger } from "@/lib/logger";

// Asset Kit Repository
import type { IAssetKitRepository } from "@/core/repositories/asset-kit.repository.interface";
import { PrismaAssetKitRepository } from "@/infrastructure/repositories/prisma-asset-kit.repository";

// Asset Kit Item Repository
import type { IAssetKitItemRepository } from "@/core/repositories/asset-kit-item.repository.interface";
import { PrismaAssetKitItemRepository } from "@/infrastructure/repositories/prisma-asset-kit-item.repository";

// Asset Kit Checkout Repository
import type { IAssetKitCheckoutRepository } from "@/core/repositories/asset-kit-checkout.repository.interface";
import { PrismaAssetKitCheckoutRepository } from "@/infrastructure/repositories/prisma-asset-kit-checkout.repository";

// Asset Kit Checkout Item Repository
import type { IAssetKitCheckoutItemRepository } from "@/core/repositories/asset-kit-checkout-item.repository.interface";
import { PrismaAssetKitCheckoutItemRepository } from "@/infrastructure/repositories/prisma-asset-kit-checkout-item.repository";

// Asset Kit Use Cases
import {
  CreateAssetKitUseCase,
  GetAssetKitUseCase,
  ListAssetKitsUseCase,
  UpdateAssetKitUseCase,
  DeleteAssetKitUseCase,
  AddKitItemUseCase,
  RemoveKitItemUseCase,
  UpdateKitItemUseCase,
  CreateKitCheckoutUseCase,
  GetKitCheckoutUseCase,
  ListKitCheckoutsUseCase,
  ReturnKitCheckoutUseCase,
  ReturnKitItemUseCase,
  MarkItemDamagedUseCase,
  MarkItemLostUseCase,
  ExtendCheckoutUseCase,
  ListOverdueCheckoutsUseCase,
  CheckKitAvailabilityUseCase,
} from "@/core/use-cases/asset-kits";

const diLogger = logger.scope("DI");

/**
 * Load asset kits module into DI container
 */
export function loadAssetKitsModule(container: Container): void {
  diLogger.debug("loadAssetKitsModule", "Loading Asset Kits module...");

  // ==========================================
  // Repositories
  // ==========================================

  container
    .bind<IAssetKitRepository>(DI_TOKENS.IAssetKitRepository)
    .to(PrismaAssetKitRepository)
    .inSingletonScope();

  container
    .bind<IAssetKitItemRepository>(DI_TOKENS.IAssetKitItemRepository)
    .to(PrismaAssetKitItemRepository)
    .inSingletonScope();

  container
    .bind<IAssetKitCheckoutRepository>(DI_TOKENS.IAssetKitCheckoutRepository)
    .to(PrismaAssetKitCheckoutRepository)
    .inSingletonScope();

  container
    .bind<IAssetKitCheckoutItemRepository>(
      DI_TOKENS.IAssetKitCheckoutItemRepository,
    )
    .to(PrismaAssetKitCheckoutItemRepository)
    .inSingletonScope();

  // ==========================================
  // Use Cases - Kit Management
  // ==========================================

  container
    .bind<CreateAssetKitUseCase>(DI_TOKENS.CreateAssetKitUseCase)
    .to(CreateAssetKitUseCase)
    .inSingletonScope();

  container
    .bind<GetAssetKitUseCase>(DI_TOKENS.GetAssetKitUseCase)
    .to(GetAssetKitUseCase)
    .inSingletonScope();

  container
    .bind<ListAssetKitsUseCase>(DI_TOKENS.ListAssetKitsUseCase)
    .to(ListAssetKitsUseCase)
    .inSingletonScope();

  container
    .bind<UpdateAssetKitUseCase>(DI_TOKENS.UpdateAssetKitUseCase)
    .to(UpdateAssetKitUseCase)
    .inSingletonScope();

  container
    .bind<DeleteAssetKitUseCase>(DI_TOKENS.DeleteAssetKitUseCase)
    .to(DeleteAssetKitUseCase)
    .inSingletonScope();

  container
    .bind<AddKitItemUseCase>(DI_TOKENS.AddKitItemUseCase)
    .to(AddKitItemUseCase)
    .inSingletonScope();

  container
    .bind<RemoveKitItemUseCase>(DI_TOKENS.RemoveKitItemUseCase)
    .to(RemoveKitItemUseCase)
    .inSingletonScope();

  container
    .bind<UpdateKitItemUseCase>(DI_TOKENS.UpdateKitItemUseCase)
    .to(UpdateKitItemUseCase)
    .inSingletonScope();

  // ==========================================
  // Use Cases - Kit Checkout
  // ==========================================

  container
    .bind<CreateKitCheckoutUseCase>(DI_TOKENS.CreateKitCheckoutUseCase)
    .to(CreateKitCheckoutUseCase)
    .inSingletonScope();

  container
    .bind<GetKitCheckoutUseCase>(DI_TOKENS.GetKitCheckoutUseCase)
    .to(GetKitCheckoutUseCase)
    .inSingletonScope();

  container
    .bind<ListKitCheckoutsUseCase>(DI_TOKENS.ListKitCheckoutsUseCase)
    .to(ListKitCheckoutsUseCase)
    .inSingletonScope();

  container
    .bind<ReturnKitCheckoutUseCase>(DI_TOKENS.ReturnKitCheckoutUseCase)
    .to(ReturnKitCheckoutUseCase)
    .inSingletonScope();

  container
    .bind<ReturnKitItemUseCase>(DI_TOKENS.ReturnKitItemUseCase)
    .to(ReturnKitItemUseCase)
    .inSingletonScope();

  container
    .bind<MarkItemDamagedUseCase>(DI_TOKENS.MarkItemDamagedUseCase)
    .to(MarkItemDamagedUseCase)
    .inSingletonScope();

  container
    .bind<MarkItemLostUseCase>(DI_TOKENS.MarkItemLostUseCase)
    .to(MarkItemLostUseCase)
    .inSingletonScope();

  container
    .bind<ExtendCheckoutUseCase>(DI_TOKENS.ExtendCheckoutUseCase)
    .to(ExtendCheckoutUseCase)
    .inSingletonScope();

  container
    .bind<ListOverdueCheckoutsUseCase>(DI_TOKENS.ListOverdueCheckoutsUseCase)
    .to(ListOverdueCheckoutsUseCase)
    .inSingletonScope();

  container
    .bind<CheckKitAvailabilityUseCase>(DI_TOKENS.CheckKitAvailabilityUseCase)
    .to(CheckKitAvailabilityUseCase)
    .inSingletonScope();

  diLogger.debug(
    "loadAssetKitsModule",
    "Asset Kits module loaded successfully",
  );
}
