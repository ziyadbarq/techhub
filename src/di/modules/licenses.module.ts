/**
 * Licenses Module - DI Bindings
 *
 * Binds repositories and use cases for license products, entitlements, and allocations.
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { logger } from "@/lib/logger";

// Repositories
import type { ILicenseProductRepository } from "@/core/repositories/license-product.repository.interface";
import type { ILicenseProductFieldRepository } from "@/core/repositories/license-product-field.repository.interface";
import type { ILicenseEntitlementRepository } from "@/core/repositories/license-entitlement.repository.interface";
import type { ILicenseAllocationRepository } from "@/core/repositories/license-allocation.repository.interface";
import type { ILicenseAddonRepository } from "@/core/repositories/license-addon.repository.interface";
import type { ILicenseEntitlementAddonRepository } from "@/core/repositories/license-entitlement-addon.repository.interface";
import { PrismaLicenseProductRepository } from "@/infrastructure/repositories/prisma-license-product.repository";
import { PrismaLicenseProductFieldRepository } from "@/infrastructure/repositories/prisma-license-product-field.repository";
import { PrismaLicenseEntitlementRepository } from "@/infrastructure/repositories/prisma-license-entitlement.repository";
import { PrismaLicenseAllocationRepository } from "@/infrastructure/repositories/prisma-license-allocation.repository";
import { PrismaLicenseAddonRepository } from "@/infrastructure/repositories/prisma-license-addon.repository";
import { PrismaLicenseEntitlementAddonRepository } from "@/infrastructure/repositories/prisma-license-entitlement-addon.repository";

// Use Cases - License Products
import { CreateLicenseProductUseCase } from "@/core/use-cases/license-product/create-license-product.use-case";
import { GetLicenseProductUseCase } from "@/core/use-cases/license-product/get-license-product.use-case";
import { ListLicenseProductsUseCase } from "@/core/use-cases/license-product/list-license-products.use-case";
import { UpdateLicenseProductUseCase } from "@/core/use-cases/license-product/update-license-product.use-case";
import { DeleteLicenseProductUseCase } from "@/core/use-cases/license-product/delete-license-product.use-case";

// Use Cases - License Product Fields
import { CreateLicenseProductFieldUseCase } from "@/core/use-cases/license-product-field/create-license-product-field.use-case";
import { GetLicenseProductFieldUseCase } from "@/core/use-cases/license-product-field/get-license-product-field.use-case";
import { ListLicenseProductFieldsUseCase } from "@/core/use-cases/license-product-field/list-license-product-fields.use-case";
import { UpdateLicenseProductFieldUseCase } from "@/core/use-cases/license-product-field/update-license-product-field.use-case";
import { DeleteLicenseProductFieldUseCase } from "@/core/use-cases/license-product-field/delete-license-product-field.use-case";

// Use Cases - License Entitlements
import { CreateLicenseEntitlementUseCase } from "@/core/use-cases/license-entitlement/create-license-entitlement.use-case";
import { GetLicenseEntitlementUseCase } from "@/core/use-cases/license-entitlement/get-license-entitlement.use-case";
import { ListLicenseEntitlementsUseCase } from "@/core/use-cases/license-entitlement/list-license-entitlements.use-case";
import { UpdateLicenseEntitlementUseCase } from "@/core/use-cases/license-entitlement/update-license-entitlement.use-case";
import { DeleteLicenseEntitlementUseCase } from "@/core/use-cases/license-entitlement/delete-license-entitlement.use-case";

// Use Cases - License Allocations
import { CreateLicenseAllocationUseCase } from "@/core/use-cases/license-allocation/create-license-allocation.use-case";
import { GetLicenseAllocationUseCase } from "@/core/use-cases/license-allocation/get-license-allocation.use-case";
import { ListLicenseAllocationsUseCase } from "@/core/use-cases/license-allocation/list-license-allocations.use-case";
import { UpdateLicenseAllocationUseCase } from "@/core/use-cases/license-allocation/update-license-allocation.use-case";
import { DeleteLicenseAllocationUseCase } from "@/core/use-cases/license-allocation/delete-license-allocation.use-case";
import { DeallocateLicenseAllocationUseCase } from "@/core/use-cases/license-allocation/deallocate-license-allocation.use-case";
import { ReactivateLicenseAllocationUseCase } from "@/core/use-cases/license-allocation/reactivate-license-allocation.use-case";

// Use Cases - License Addons
import { CreateLicenseAddonUseCase } from "@/core/use-cases/license-addon/create-license-addon.use-case";
import { GetLicenseAddonUseCase } from "@/core/use-cases/license-addon/get-license-addon.use-case";
import { ListLicenseAddonsUseCase } from "@/core/use-cases/license-addon/list-license-addons.use-case";
import { UpdateLicenseAddonUseCase } from "@/core/use-cases/license-addon/update-license-addon.use-case";
import { DeleteLicenseAddonUseCase } from "@/core/use-cases/license-addon/delete-license-addon.use-case";

// Use Cases - License Entitlement Addons
import { AttachAddonToEntitlementUseCase } from "@/core/use-cases/license-entitlement-addon/attach-addon-to-entitlement.use-case";
import { DetachAddonFromEntitlementUseCase } from "@/core/use-cases/license-entitlement-addon/detach-addon-from-entitlement.use-case";
import { UpdateEntitlementAddonUseCase } from "@/core/use-cases/license-entitlement-addon/update-entitlement-addon.use-case";
import { ListEntitlementAddonsUseCase } from "@/core/use-cases/license-entitlement-addon/list-entitlement-addons.use-case";
import { CalculateEntitlementTotalCostUseCase } from "@/core/use-cases/license-entitlement-addon/calculate-entitlement-total-cost.use-case";

// Report Use Cases
import { GetLicenseComplianceReportUseCase } from "@/core/use-cases/reports/get-license-compliance-report.use-case";

const diLogger = logger.scope("DI:LicensesModule");

export function bindLicensesDependencies(container: Container): void {
  diLogger.debug(
    "bindLicensesDependencies",
    "Binding Licenses dependencies...",
  );

  // Repositories
  container
    .bind<ILicenseProductRepository>(DI_TOKENS.ILicenseProductRepository)
    .to(PrismaLicenseProductRepository)
    .inSingletonScope();

  container
    .bind<ILicenseProductFieldRepository>(
      DI_TOKENS.ILicenseProductFieldRepository,
    )
    .to(PrismaLicenseProductFieldRepository)
    .inSingletonScope();

  container
    .bind<ILicenseEntitlementRepository>(
      DI_TOKENS.ILicenseEntitlementRepository,
    )
    .to(PrismaLicenseEntitlementRepository)
    .inSingletonScope();

  container
    .bind<ILicenseAllocationRepository>(DI_TOKENS.ILicenseAllocationRepository)
    .to(PrismaLicenseAllocationRepository)
    .inSingletonScope();

  // License Product Use Cases
  container
    .bind<CreateLicenseProductUseCase>(DI_TOKENS.CreateLicenseProductUseCase)
    .to(CreateLicenseProductUseCase)
    .inTransientScope();
  container
    .bind<GetLicenseProductUseCase>(DI_TOKENS.GetLicenseProductUseCase)
    .to(GetLicenseProductUseCase)
    .inTransientScope();
  container
    .bind<ListLicenseProductsUseCase>(DI_TOKENS.ListLicenseProductsUseCase)
    .to(ListLicenseProductsUseCase)
    .inTransientScope();
  container
    .bind<UpdateLicenseProductUseCase>(DI_TOKENS.UpdateLicenseProductUseCase)
    .to(UpdateLicenseProductUseCase)
    .inTransientScope();
  container
    .bind<DeleteLicenseProductUseCase>(DI_TOKENS.DeleteLicenseProductUseCase)
    .to(DeleteLicenseProductUseCase)
    .inTransientScope();

  // License Product Field Use Cases
  container
    .bind<CreateLicenseProductFieldUseCase>(
      DI_TOKENS.CreateLicenseProductFieldUseCase,
    )
    .to(CreateLicenseProductFieldUseCase)
    .inTransientScope();
  container
    .bind<GetLicenseProductFieldUseCase>(
      DI_TOKENS.GetLicenseProductFieldUseCase,
    )
    .to(GetLicenseProductFieldUseCase)
    .inTransientScope();
  container
    .bind<ListLicenseProductFieldsUseCase>(
      DI_TOKENS.ListLicenseProductFieldsUseCase,
    )
    .to(ListLicenseProductFieldsUseCase)
    .inTransientScope();
  container
    .bind<UpdateLicenseProductFieldUseCase>(
      DI_TOKENS.UpdateLicenseProductFieldUseCase,
    )
    .to(UpdateLicenseProductFieldUseCase)
    .inTransientScope();
  container
    .bind<DeleteLicenseProductFieldUseCase>(
      DI_TOKENS.DeleteLicenseProductFieldUseCase,
    )
    .to(DeleteLicenseProductFieldUseCase)
    .inTransientScope();

  // License Entitlement Use Cases
  container
    .bind<CreateLicenseEntitlementUseCase>(
      DI_TOKENS.CreateLicenseEntitlementUseCase,
    )
    .to(CreateLicenseEntitlementUseCase)
    .inTransientScope();
  container
    .bind<GetLicenseEntitlementUseCase>(DI_TOKENS.GetLicenseEntitlementUseCase)
    .to(GetLicenseEntitlementUseCase)
    .inTransientScope();
  container
    .bind<ListLicenseEntitlementsUseCase>(
      DI_TOKENS.ListLicenseEntitlementsUseCase,
    )
    .to(ListLicenseEntitlementsUseCase)
    .inTransientScope();
  container
    .bind<UpdateLicenseEntitlementUseCase>(
      DI_TOKENS.UpdateLicenseEntitlementUseCase,
    )
    .to(UpdateLicenseEntitlementUseCase)
    .inTransientScope();
  container
    .bind<DeleteLicenseEntitlementUseCase>(
      DI_TOKENS.DeleteLicenseEntitlementUseCase,
    )
    .to(DeleteLicenseEntitlementUseCase)
    .inTransientScope();

  // License Allocation Use Cases
  container
    .bind<CreateLicenseAllocationUseCase>(
      DI_TOKENS.CreateLicenseAllocationUseCase,
    )
    .to(CreateLicenseAllocationUseCase)
    .inTransientScope();
  container
    .bind<GetLicenseAllocationUseCase>(DI_TOKENS.GetLicenseAllocationUseCase)
    .to(GetLicenseAllocationUseCase)
    .inTransientScope();
  container
    .bind<ListLicenseAllocationsUseCase>(
      DI_TOKENS.ListLicenseAllocationsUseCase,
    )
    .to(ListLicenseAllocationsUseCase)
    .inTransientScope();
  container
    .bind<UpdateLicenseAllocationUseCase>(
      DI_TOKENS.UpdateLicenseAllocationUseCase,
    )
    .to(UpdateLicenseAllocationUseCase)
    .inTransientScope();
  container
    .bind<DeleteLicenseAllocationUseCase>(
      DI_TOKENS.DeleteLicenseAllocationUseCase,
    )
    .to(DeleteLicenseAllocationUseCase)
    .inTransientScope();
  container
    .bind<DeallocateLicenseAllocationUseCase>(
      DI_TOKENS.DeallocateLicenseAllocationUseCase,
    )
    .to(DeallocateLicenseAllocationUseCase)
    .inTransientScope();
  container
    .bind<ReactivateLicenseAllocationUseCase>(
      DI_TOKENS.ReactivateLicenseAllocationUseCase,
    )
    .to(ReactivateLicenseAllocationUseCase)
    .inTransientScope();

  // License Addon Repository
  container
    .bind<ILicenseAddonRepository>(DI_TOKENS.ILicenseAddonRepository)
    .to(PrismaLicenseAddonRepository)
    .inSingletonScope();

  // License Entitlement Addon Repository
  container
    .bind<ILicenseEntitlementAddonRepository>(
      DI_TOKENS.ILicenseEntitlementAddonRepository,
    )
    .to(PrismaLicenseEntitlementAddonRepository)
    .inSingletonScope();

  // License Addon Use Cases
  container
    .bind<CreateLicenseAddonUseCase>(DI_TOKENS.CreateLicenseAddonUseCase)
    .to(CreateLicenseAddonUseCase)
    .inTransientScope();
  container
    .bind<GetLicenseAddonUseCase>(DI_TOKENS.GetLicenseAddonUseCase)
    .to(GetLicenseAddonUseCase)
    .inTransientScope();
  container
    .bind<ListLicenseAddonsUseCase>(DI_TOKENS.ListLicenseAddonsUseCase)
    .to(ListLicenseAddonsUseCase)
    .inTransientScope();
  container
    .bind<UpdateLicenseAddonUseCase>(DI_TOKENS.UpdateLicenseAddonUseCase)
    .to(UpdateLicenseAddonUseCase)
    .inTransientScope();
  container
    .bind<DeleteLicenseAddonUseCase>(DI_TOKENS.DeleteLicenseAddonUseCase)
    .to(DeleteLicenseAddonUseCase)
    .inTransientScope();

  // License Entitlement Addon Use Cases
  container
    .bind<AttachAddonToEntitlementUseCase>(
      DI_TOKENS.AttachAddonToEntitlementUseCase,
    )
    .to(AttachAddonToEntitlementUseCase)
    .inTransientScope();
  container
    .bind<DetachAddonFromEntitlementUseCase>(
      DI_TOKENS.DetachAddonFromEntitlementUseCase,
    )
    .to(DetachAddonFromEntitlementUseCase)
    .inTransientScope();
  container
    .bind<UpdateEntitlementAddonUseCase>(
      DI_TOKENS.UpdateEntitlementAddonUseCase,
    )
    .to(UpdateEntitlementAddonUseCase)
    .inTransientScope();
  container
    .bind<ListEntitlementAddonsUseCase>(DI_TOKENS.ListEntitlementAddonsUseCase)
    .to(ListEntitlementAddonsUseCase)
    .inTransientScope();
  container
    .bind<CalculateEntitlementTotalCostUseCase>(
      DI_TOKENS.CalculateEntitlementTotalCostUseCase,
    )
    .to(CalculateEntitlementTotalCostUseCase)
    .inTransientScope();

  // Report Use Cases
  container
    .bind<GetLicenseComplianceReportUseCase>(
      DI_TOKENS.GetLicenseComplianceReportUseCase,
    )
    .to(GetLicenseComplianceReportUseCase)
    .inTransientScope();
}
