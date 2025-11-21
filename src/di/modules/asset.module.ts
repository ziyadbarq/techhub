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

// Warranty Repository
import type { IWarrantyRepository } from "@/core/repositories/warranty.repository.interface";
import { PrismaWarrantyRepository } from "@/infrastructure/repositories/prisma-warranty.repository";

// Warranty Use Cases
import { CreateWarrantyUseCase } from "@/core/use-cases/asset/warranty/create-warranty.use-case";
import { GetWarrantyUseCase } from "@/core/use-cases/asset/warranty/get-warranty.use-case";
import { ListWarrantiesUseCase } from "@/core/use-cases/asset/warranty/list-warranties.use-case";
import { UpdateWarrantyUseCase } from "@/core/use-cases/asset/warranty/update-warranty.use-case";
import { DeleteWarrantyUseCase } from "@/core/use-cases/asset/warranty/delete-warranty.use-case";
import { ListWarrantiesByAssetUseCase } from "@/core/use-cases/asset/warranty/list-warranties-by-asset.use-case";
import { GetActiveWarrantyForAssetUseCase } from "@/core/use-cases/asset/warranty/get-active-warranty-for-asset.use-case";
import { ListExpiringWarrantiesUseCase } from "@/core/use-cases/asset/warranty/list-expiring-warranties.use-case";
import { CheckWarrantyExpirationUseCase } from "@/core/use-cases/asset/warranty/check-warranty-expiration.use-case";

// Maintenance Schedule Repository
import type { IMaintenanceScheduleRepository } from "@/core/repositories/maintenance-schedule.repository.interface";
import { PrismaMaintenanceScheduleRepository } from "@/infrastructure/repositories/prisma-maintenance-schedule.repository";

// Maintenance Schedule Use Cases
import {
  CreateMaintenanceScheduleUseCase,
  GetMaintenanceScheduleUseCase,
  ListMaintenanceSchedulesUseCase,
  UpdateMaintenanceScheduleUseCase,
  DeleteMaintenanceScheduleUseCase,
} from "@/core/use-cases/maintenance/schedule";

// Maintenance Record Repository
import type { IMaintenanceRecordRepository } from "@/core/repositories/maintenance-record.repository.interface";
import { PrismaMaintenanceRecordRepository } from "@/infrastructure/repositories/prisma-maintenance-record.repository";

// Maintenance Record Use Cases
import {
  CreateMaintenanceRecordUseCase,
  GetMaintenanceRecordUseCase,
  ListMaintenanceRecordsUseCase,
  UpdateMaintenanceRecordUseCase,
  DeleteMaintenanceRecordUseCase,
  StartMaintenanceUseCase,
  CompleteMaintenanceUseCase,
  CancelMaintenanceUseCase,
} from "@/core/use-cases/maintenance/record";

// Disposal Repository
import type { IAssetDisposalRepository } from "@/core/repositories/asset-disposal.repository.interface";
import { PrismaAssetDisposalRepository } from "@/infrastructure/repositories/prisma-asset-disposal.repository";

// Disposal Use Cases
import { CreateAssetDisposalUseCase } from "@/core/use-cases/disposal/create-asset-disposal.use-case";
import { GetAssetDisposalUseCase } from "@/core/use-cases/disposal/get-asset-disposal.use-case";
import { ListAssetDisposalsUseCase } from "@/core/use-cases/disposal/list-asset-disposals.use-case";
import { ApproveDisposalUseCase } from "@/core/use-cases/disposal/approve-disposal.use-case";
import { RejectDisposalUseCase } from "@/core/use-cases/disposal/reject-disposal.use-case";
import { StartDisposalUseCase } from "@/core/use-cases/disposal/start-disposal.use-case";
import { CompleteDisposalUseCase } from "@/core/use-cases/disposal/complete-disposal.use-case";
import { CompleteSanitizationUseCase } from "@/core/use-cases/disposal/complete-sanitization.use-case";
import { GenerateCertificateUseCase } from "@/core/use-cases/disposal/generate-certificate.use-case";

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

  // ==========================================
  // Warranty Repository
  // ==========================================

  container
    .bind<IWarrantyRepository>(DI_TOKENS.IWarrantyRepository)
    .to(PrismaWarrantyRepository)
    .inSingletonScope();

  // ==========================================
  // Warranty Use Cases
  // ==========================================

  container
    .bind<CreateWarrantyUseCase>(DI_TOKENS.CreateWarrantyUseCase)
    .to(CreateWarrantyUseCase)
    .inTransientScope();

  container
    .bind<GetWarrantyUseCase>(DI_TOKENS.GetWarrantyUseCase)
    .to(GetWarrantyUseCase)
    .inTransientScope();

  container
    .bind<ListWarrantiesUseCase>(DI_TOKENS.ListWarrantiesUseCase)
    .to(ListWarrantiesUseCase)
    .inTransientScope();

  container
    .bind<UpdateWarrantyUseCase>(DI_TOKENS.UpdateWarrantyUseCase)
    .to(UpdateWarrantyUseCase)
    .inTransientScope();

  container
    .bind<DeleteWarrantyUseCase>(DI_TOKENS.DeleteWarrantyUseCase)
    .to(DeleteWarrantyUseCase)
    .inTransientScope();

  container
    .bind<ListWarrantiesByAssetUseCase>(DI_TOKENS.ListWarrantiesByAssetUseCase)
    .to(ListWarrantiesByAssetUseCase)
    .inTransientScope();

  container
    .bind<GetActiveWarrantyForAssetUseCase>(
      DI_TOKENS.GetActiveWarrantyForAssetUseCase,
    )
    .to(GetActiveWarrantyForAssetUseCase)
    .inTransientScope();

  container
    .bind<ListExpiringWarrantiesUseCase>(
      DI_TOKENS.ListExpiringWarrantiesUseCase,
    )
    .to(ListExpiringWarrantiesUseCase)
    .inTransientScope();

  container
    .bind<CheckWarrantyExpirationUseCase>(
      DI_TOKENS.CheckWarrantyExpirationUseCase,
    )
    .to(CheckWarrantyExpirationUseCase)
    .inTransientScope();

  // ==========================================
  // Maintenance Schedule Repository
  // ==========================================

  container
    .bind<IMaintenanceScheduleRepository>(
      DI_TOKENS.IMaintenanceScheduleRepository,
    )
    .to(PrismaMaintenanceScheduleRepository)
    .inSingletonScope();

  // ==========================================
  // Maintenance Schedule Use Cases
  // ==========================================

  container
    .bind<CreateMaintenanceScheduleUseCase>(
      DI_TOKENS.CreateMaintenanceScheduleUseCase,
    )
    .to(CreateMaintenanceScheduleUseCase)
    .inTransientScope();

  container
    .bind<GetMaintenanceScheduleUseCase>(
      DI_TOKENS.GetMaintenanceScheduleUseCase,
    )
    .to(GetMaintenanceScheduleUseCase)
    .inTransientScope();

  container
    .bind<ListMaintenanceSchedulesUseCase>(
      DI_TOKENS.ListMaintenanceSchedulesUseCase,
    )
    .to(ListMaintenanceSchedulesUseCase)
    .inTransientScope();

  container
    .bind<UpdateMaintenanceScheduleUseCase>(
      DI_TOKENS.UpdateMaintenanceScheduleUseCase,
    )
    .to(UpdateMaintenanceScheduleUseCase)
    .inTransientScope();

  container
    .bind<DeleteMaintenanceScheduleUseCase>(
      DI_TOKENS.DeleteMaintenanceScheduleUseCase,
    )
    .to(DeleteMaintenanceScheduleUseCase)
    .inTransientScope();

  // ==========================================
  // Maintenance Record Repository
  // ==========================================

  container
    .bind<IMaintenanceRecordRepository>(DI_TOKENS.IMaintenanceRecordRepository)
    .to(PrismaMaintenanceRecordRepository)
    .inSingletonScope();

  // Disposal Repository
  container
    .bind<IAssetDisposalRepository>(DI_TOKENS.IAssetDisposalRepository)
    .to(PrismaAssetDisposalRepository)
    .inSingletonScope();

  // ==========================================
  // Maintenance Record Use Cases
  // ==========================================

  container
    .bind<CreateMaintenanceRecordUseCase>(
      DI_TOKENS.CreateMaintenanceRecordUseCase,
    )
    .to(CreateMaintenanceRecordUseCase)
    .inTransientScope();

  container
    .bind<GetMaintenanceRecordUseCase>(DI_TOKENS.GetMaintenanceRecordUseCase)
    .to(GetMaintenanceRecordUseCase)
    .inTransientScope();

  container
    .bind<ListMaintenanceRecordsUseCase>(
      DI_TOKENS.ListMaintenanceRecordsUseCase,
    )
    .to(ListMaintenanceRecordsUseCase)
    .inTransientScope();

  container
    .bind<UpdateMaintenanceRecordUseCase>(
      DI_TOKENS.UpdateMaintenanceRecordUseCase,
    )
    .to(UpdateMaintenanceRecordUseCase)
    .inTransientScope();

  container
    .bind<DeleteMaintenanceRecordUseCase>(
      DI_TOKENS.DeleteMaintenanceRecordUseCase,
    )
    .to(DeleteMaintenanceRecordUseCase)
    .inTransientScope();

  container
    .bind<StartMaintenanceUseCase>(DI_TOKENS.StartMaintenanceUseCase)
    .to(StartMaintenanceUseCase)
    .inTransientScope();

  container
    .bind<CompleteMaintenanceUseCase>(DI_TOKENS.CompleteMaintenanceUseCase)
    .to(CompleteMaintenanceUseCase)
    .inTransientScope();

  container
    .bind<CancelMaintenanceUseCase>(DI_TOKENS.CancelMaintenanceUseCase)
    .to(CancelMaintenanceUseCase)
    .inTransientScope();

  // Disposal Use Cases
  container
    .bind<CreateAssetDisposalUseCase>(DI_TOKENS.CreateAssetDisposalUseCase)
    .to(CreateAssetDisposalUseCase)
    .inTransientScope();
  container
    .bind<GetAssetDisposalUseCase>(DI_TOKENS.GetAssetDisposalUseCase)
    .to(GetAssetDisposalUseCase)
    .inTransientScope();
  container
    .bind<ListAssetDisposalsUseCase>(DI_TOKENS.ListAssetDisposalsUseCase)
    .to(ListAssetDisposalsUseCase)
    .inTransientScope();
  container
    .bind<ApproveDisposalUseCase>(DI_TOKENS.ApproveDisposalUseCase)
    .to(ApproveDisposalUseCase)
    .inTransientScope();
  container
    .bind<RejectDisposalUseCase>(DI_TOKENS.RejectDisposalUseCase)
    .to(RejectDisposalUseCase)
    .inTransientScope();
  container
    .bind<StartDisposalUseCase>(DI_TOKENS.StartDisposalUseCase)
    .to(StartDisposalUseCase)
    .inTransientScope();
  container
    .bind<CompleteDisposalUseCase>(DI_TOKENS.CompleteDisposalUseCase)
    .to(CompleteDisposalUseCase)
    .inTransientScope();
  container
    .bind<CompleteSanitizationUseCase>(DI_TOKENS.CompleteSanitizationUseCase)
    .to(CompleteSanitizationUseCase)
    .inTransientScope();
  container
    .bind<GenerateCertificateUseCase>(DI_TOKENS.GenerateCertificateUseCase)
    .to(GenerateCertificateUseCase)
    .inTransientScope();

  diLogger.debug(
    "bindAssetDependencies",
    "Asset dependencies bound successfully (including warranties and maintenance)",
  );
}
