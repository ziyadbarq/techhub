/**
 * Asset Module - DI Bindings
 *
 * This module configures all Asset layer dependencies:
 * - Repositories (asset categories, asset models, assets, assignments, inventory)
 * - Use cases (CRUD operations for all Asset entities)
 *
 * Asset module provides ITAM (IT Asset Management) and inventory features
 * built on top of the Foundation layer.
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { logger } from "@/lib/logger";

// Asset Category Repository
import type { IAssetCategoryRepository } from "@/core/repositories/asset-category.repository.interface";
import { PrismaAssetCategoryRepository } from "@/infrastructure/repositories/prisma-asset-category.repository";

// Asset Category Use Cases
import { CreateAssetCategoryUseCase } from "@/core/use-cases/asset/asset-category/create-asset-category.use-case";
import { GetAssetCategoryUseCase } from "@/core/use-cases/asset/asset-category/get-asset-category.use-case";
import { ListAssetCategoriesUseCase } from "@/core/use-cases/asset/asset-category/list-asset-categories.use-case";
import { UpdateAssetCategoryUseCase } from "@/core/use-cases/asset/asset-category/update-asset-category.use-case";
import { DeleteAssetCategoryUseCase } from "@/core/use-cases/asset/asset-category/delete-asset-category.use-case";

// Asset Model Repository
import type { IAssetModelRepository } from "@/core/repositories/asset-model.repository.interface";
import { PrismaAssetModelRepository } from "@/infrastructure/repositories/prisma-asset-model.repository";

// Asset Model Use Cases
import { CreateAssetModelUseCase } from "@/core/use-cases/asset/asset-model/create-asset-model.use-case";
import { GetAssetModelUseCase } from "@/core/use-cases/asset/asset-model/get-asset-model.use-case";
import { ListAssetModelsUseCase } from "@/core/use-cases/asset/asset-model/list-asset-models.use-case";
import { UpdateAssetModelUseCase } from "@/core/use-cases/asset/asset-model/update-asset-model.use-case";
import { DeleteAssetModelUseCase } from "@/core/use-cases/asset/asset-model/delete-asset-model.use-case";

// Asset Repository
import type { IAssetRepository } from "@/core/repositories/asset.repository.interface";
import { PrismaAssetRepository } from "@/infrastructure/repositories/prisma-asset.repository";

// Asset Use Cases
import { CreateAssetUseCase } from "@/core/use-cases/asset/asset/create-asset.use-case";
import { GetAssetUseCase } from "@/core/use-cases/asset/asset/get-asset.use-case";
import { ListAssetsUseCase } from "@/core/use-cases/asset/asset/list-assets.use-case";
import { UpdateAssetUseCase } from "@/core/use-cases/asset/asset/update-asset.use-case";
import { DeleteAssetUseCase } from "@/core/use-cases/asset/asset/delete-asset.use-case";

// Asset Assignment Repository
import type { IAssetAssignmentRepository } from "@/core/repositories/asset-assignment.repository.interface";
import { PrismaAssetAssignmentRepository } from "@/infrastructure/repositories/prisma-asset-assignment.repository";

// Asset Assignment Use Cases
import { CreateAssetAssignmentUseCase } from "@/core/use-cases/asset/asset-assignment/create-asset-assignment.use-case";
import { GetAssetAssignmentUseCase } from "@/core/use-cases/asset/asset-assignment/get-asset-assignment.use-case";
import { ListAssetAssignmentsUseCase } from "@/core/use-cases/asset/asset-assignment/list-asset-assignments.use-case";
import { UpdateAssetAssignmentUseCase } from "@/core/use-cases/asset/asset-assignment/update-asset-assignment.use-case";
import { DeleteAssetAssignmentUseCase } from "@/core/use-cases/asset/asset-assignment/delete-asset-assignment.use-case";

const diLogger = logger.scope("DI:AssetModule");

/**
 * Bind all Asset-related dependencies
 */
export function bindAssetDependencies(container: Container): void {
  diLogger.debug("bindAssetDependencies", "Binding asset dependencies...");

  // ==========================================
  // Asset Category Repository
  // ==========================================

  container
    .bind<IAssetCategoryRepository>(DI_TOKENS.IAssetCategoryRepository)
    .to(PrismaAssetCategoryRepository)
    .inSingletonScope();

  // ==========================================
  // Asset Category Use Cases
  // ==========================================

  container
    .bind<CreateAssetCategoryUseCase>(DI_TOKENS.CreateAssetCategoryUseCase)
    .to(CreateAssetCategoryUseCase)
    .inTransientScope();

  container
    .bind<GetAssetCategoryUseCase>(DI_TOKENS.GetAssetCategoryUseCase)
    .to(GetAssetCategoryUseCase)
    .inTransientScope();

  container
    .bind<ListAssetCategoriesUseCase>(DI_TOKENS.ListAssetCategoriesUseCase)
    .to(ListAssetCategoriesUseCase)
    .inTransientScope();

  container
    .bind<UpdateAssetCategoryUseCase>(DI_TOKENS.UpdateAssetCategoryUseCase)
    .to(UpdateAssetCategoryUseCase)
    .inTransientScope();

  container
    .bind<DeleteAssetCategoryUseCase>(DI_TOKENS.DeleteAssetCategoryUseCase)
    .to(DeleteAssetCategoryUseCase)
    .inTransientScope();

  // ==========================================
  // Asset Model Repository
  // ==========================================

  container
    .bind<IAssetModelRepository>(DI_TOKENS.IAssetModelRepository)
    .to(PrismaAssetModelRepository)
    .inSingletonScope();

  // ==========================================
  // Asset Model Use Cases
  // ==========================================

  container
    .bind<CreateAssetModelUseCase>(DI_TOKENS.CreateAssetModelUseCase)
    .to(CreateAssetModelUseCase)
    .inTransientScope();

  container
    .bind<GetAssetModelUseCase>(DI_TOKENS.GetAssetModelUseCase)
    .to(GetAssetModelUseCase)
    .inTransientScope();

  container
    .bind<ListAssetModelsUseCase>(DI_TOKENS.ListAssetModelsUseCase)
    .to(ListAssetModelsUseCase)
    .inTransientScope();

  container
    .bind<UpdateAssetModelUseCase>(DI_TOKENS.UpdateAssetModelUseCase)
    .to(UpdateAssetModelUseCase)
    .inTransientScope();

  container
    .bind<DeleteAssetModelUseCase>(DI_TOKENS.DeleteAssetModelUseCase)
    .to(DeleteAssetModelUseCase)
    .inTransientScope();

  // ==========================================
  // Asset Repository
  // ==========================================

  container
    .bind<IAssetRepository>(DI_TOKENS.IAssetRepository)
    .to(PrismaAssetRepository)
    .inSingletonScope();

  // ==========================================
  // Asset Use Cases
  // ==========================================

  container
    .bind<CreateAssetUseCase>(DI_TOKENS.CreateAssetUseCase)
    .to(CreateAssetUseCase)
    .inTransientScope();

  container
    .bind<GetAssetUseCase>(DI_TOKENS.GetAssetUseCase)
    .to(GetAssetUseCase)
    .inTransientScope();

  container
    .bind<ListAssetsUseCase>(DI_TOKENS.ListAssetsUseCase)
    .to(ListAssetsUseCase)
    .inTransientScope();

  container
    .bind<UpdateAssetUseCase>(DI_TOKENS.UpdateAssetUseCase)
    .to(UpdateAssetUseCase)
    .inTransientScope();

  container
    .bind<DeleteAssetUseCase>(DI_TOKENS.DeleteAssetUseCase)
    .to(DeleteAssetUseCase)
    .inTransientScope();

  // ==========================================
  // Asset Assignment Repository
  // ==========================================

  container
    .bind<IAssetAssignmentRepository>(DI_TOKENS.IAssetAssignmentRepository)
    .to(PrismaAssetAssignmentRepository)
    .inSingletonScope();

  // ==========================================
  // Asset Assignment Use Cases
  // ==========================================

  container
    .bind<CreateAssetAssignmentUseCase>(DI_TOKENS.CreateAssetAssignmentUseCase)
    .to(CreateAssetAssignmentUseCase)
    .inTransientScope();

  container
    .bind<GetAssetAssignmentUseCase>(DI_TOKENS.GetAssetAssignmentUseCase)
    .to(GetAssetAssignmentUseCase)
    .inTransientScope();

  container
    .bind<ListAssetAssignmentsUseCase>(DI_TOKENS.ListAssetAssignmentsUseCase)
    .to(ListAssetAssignmentsUseCase)
    .inTransientScope();

  container
    .bind<UpdateAssetAssignmentUseCase>(DI_TOKENS.UpdateAssetAssignmentUseCase)
    .to(UpdateAssetAssignmentUseCase)
    .inTransientScope();

  container
    .bind<DeleteAssetAssignmentUseCase>(DI_TOKENS.DeleteAssetAssignmentUseCase)
    .to(DeleteAssetAssignmentUseCase)
    .inTransientScope();

  diLogger.debug(
    "bindAssetDependencies",
    "Asset dependencies bound successfully",
  );
}
