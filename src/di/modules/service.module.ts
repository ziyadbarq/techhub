/**
 * Service Management Module - DI Bindings
 *
 * This module configures all Service Management dependencies:
 * - Repositories (services, business processes, service infrastructure)
 * - Use cases (service management, ownership, business processes, infrastructure, asset linking)
 *
 * Service Management module enables IT service catalog management with
 * ownership tracking, business alignment, infrastructure details, and asset relationships.
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { logger } from "@/lib/logger";

// Service Repository
import type { IServiceRepository } from "@/core/repositories/service.repository.interface";
import { PrismaServiceRepository } from "@/infrastructure/repositories/prisma-service.repository";

// Business Process Repository
import type { IBusinessProcessRepository } from "@/core/repositories/business-process.repository.interface";
import { PrismaBusinessProcessRepository } from "@/infrastructure/repositories/prisma-business-process.repository";

// Service Infrastructure Repository
import type { IServiceInfrastructureRepository } from "@/core/repositories/service-infrastructure.repository.interface";
import { PrismaServiceInfrastructureRepository } from "@/infrastructure/repositories/prisma-service-infrastructure.repository";

// Service Use Cases
import {
  CreateServiceUseCase,
  GetServiceUseCase,
  ListServicesUseCase,
  UpdateServiceUseCase,
  DeleteServiceUseCase,
  SearchServicesUseCase,
  GetEssentialServicesUseCase,
  GetRetiringServicesUseCase,
  RetireServiceUseCase,
} from "@/core/use-cases/service";

// Service Ownership Use Cases
import {
  AddServiceOwnerUseCase,
  RemoveServiceOwnerUseCase,
  SetPrimaryOwnerUseCase,
  GetServiceOwnersUseCase,
} from "@/core/use-cases/service-ownership";

// Business Process Use Cases
import {
  CreateBusinessProcessUseCase,
  GetBusinessProcessUseCase,
  ListBusinessProcessesUseCase,
  UpdateBusinessProcessUseCase,
  DeleteBusinessProcessUseCase,
} from "@/core/use-cases/business-process";

// Service Infrastructure Use Cases
import {
  CreateServiceInfrastructureUseCase,
  UpdateServiceInfrastructureUseCase,
  GetServiceInfrastructureUseCase,
} from "@/core/use-cases/service-infrastructure";

// Service Asset Use Cases
import {
  LinkServiceToAssetUseCase,
  UnlinkServiceFromAssetUseCase,
  GetServiceAssetsUseCase,
  GetAssetServicesUseCase,
} from "@/core/use-cases/service-asset";

const diLogger = logger.scope("DI");

/**
 * Load service management module into DI container
 */
export function bindServiceDependencies(container: Container): void {
  diLogger.debug(
    "bindServiceDependencies",
    "Loading Service Management module...",
  );

  // ==========================================
  // Repositories
  // ==========================================

  container
    .bind<IServiceRepository>(DI_TOKENS.IServiceRepository)
    .to(PrismaServiceRepository)
    .inSingletonScope();

  container
    .bind<IBusinessProcessRepository>(DI_TOKENS.IBusinessProcessRepository)
    .to(PrismaBusinessProcessRepository)
    .inSingletonScope();

  container
    .bind<IServiceInfrastructureRepository>(
      DI_TOKENS.IServiceInfrastructureRepository,
    )
    .to(PrismaServiceInfrastructureRepository)
    .inSingletonScope();

  // ==========================================
  // Use Cases - Service Management
  // ==========================================

  container
    .bind<CreateServiceUseCase>(DI_TOKENS.CreateServiceUseCase)
    .to(CreateServiceUseCase)
    .inSingletonScope();

  container
    .bind<GetServiceUseCase>(DI_TOKENS.GetServiceUseCase)
    .to(GetServiceUseCase)
    .inSingletonScope();

  container
    .bind<ListServicesUseCase>(DI_TOKENS.ListServicesUseCase)
    .to(ListServicesUseCase)
    .inSingletonScope();

  container
    .bind<UpdateServiceUseCase>(DI_TOKENS.UpdateServiceUseCase)
    .to(UpdateServiceUseCase)
    .inSingletonScope();

  container
    .bind<DeleteServiceUseCase>(DI_TOKENS.DeleteServiceUseCase)
    .to(DeleteServiceUseCase)
    .inSingletonScope();

  container
    .bind<SearchServicesUseCase>(DI_TOKENS.SearchServicesUseCase)
    .to(SearchServicesUseCase)
    .inSingletonScope();

  container
    .bind<GetEssentialServicesUseCase>(DI_TOKENS.GetEssentialServicesUseCase)
    .to(GetEssentialServicesUseCase)
    .inSingletonScope();

  container
    .bind<GetRetiringServicesUseCase>(DI_TOKENS.GetRetiringServicesUseCase)
    .to(GetRetiringServicesUseCase)
    .inSingletonScope();

  container
    .bind<RetireServiceUseCase>(DI_TOKENS.RetireServiceUseCase)
    .to(RetireServiceUseCase)
    .inSingletonScope();

  // ==========================================
  // Use Cases - Service Ownership
  // ==========================================

  container
    .bind<AddServiceOwnerUseCase>(DI_TOKENS.AddServiceOwnerUseCase)
    .to(AddServiceOwnerUseCase)
    .inSingletonScope();

  container
    .bind<RemoveServiceOwnerUseCase>(DI_TOKENS.RemoveServiceOwnerUseCase)
    .to(RemoveServiceOwnerUseCase)
    .inSingletonScope();

  container
    .bind<SetPrimaryOwnerUseCase>(DI_TOKENS.SetPrimaryOwnerUseCase)
    .to(SetPrimaryOwnerUseCase)
    .inSingletonScope();

  container
    .bind<GetServiceOwnersUseCase>(DI_TOKENS.GetServiceOwnersUseCase)
    .to(GetServiceOwnersUseCase)
    .inSingletonScope();

  // ==========================================
  // Use Cases - Business Process Management
  // ==========================================

  container
    .bind<CreateBusinessProcessUseCase>(DI_TOKENS.CreateBusinessProcessUseCase)
    .to(CreateBusinessProcessUseCase)
    .inSingletonScope();

  container
    .bind<GetBusinessProcessUseCase>(DI_TOKENS.GetBusinessProcessUseCase)
    .to(GetBusinessProcessUseCase)
    .inSingletonScope();

  container
    .bind<ListBusinessProcessesUseCase>(DI_TOKENS.ListBusinessProcessesUseCase)
    .to(ListBusinessProcessesUseCase)
    .inSingletonScope();

  container
    .bind<UpdateBusinessProcessUseCase>(DI_TOKENS.UpdateBusinessProcessUseCase)
    .to(UpdateBusinessProcessUseCase)
    .inSingletonScope();

  container
    .bind<DeleteBusinessProcessUseCase>(DI_TOKENS.DeleteBusinessProcessUseCase)
    .to(DeleteBusinessProcessUseCase)
    .inSingletonScope();

  // ==========================================
  // Use Cases - Service Infrastructure
  // ==========================================

  container
    .bind<CreateServiceInfrastructureUseCase>(
      DI_TOKENS.CreateServiceInfrastructureUseCase,
    )
    .to(CreateServiceInfrastructureUseCase)
    .inSingletonScope();

  container
    .bind<UpdateServiceInfrastructureUseCase>(
      DI_TOKENS.UpdateServiceInfrastructureUseCase,
    )
    .to(UpdateServiceInfrastructureUseCase)
    .inSingletonScope();

  container
    .bind<GetServiceInfrastructureUseCase>(
      DI_TOKENS.GetServiceInfrastructureUseCase,
    )
    .to(GetServiceInfrastructureUseCase)
    .inSingletonScope();

  // ==========================================
  // Use Cases - Service Asset Linking
  // ==========================================

  container
    .bind<LinkServiceToAssetUseCase>(DI_TOKENS.LinkServiceToAssetUseCase)
    .to(LinkServiceToAssetUseCase)
    .inSingletonScope();

  container
    .bind<UnlinkServiceFromAssetUseCase>(
      DI_TOKENS.UnlinkServiceFromAssetUseCase,
    )
    .to(UnlinkServiceFromAssetUseCase)
    .inSingletonScope();

  container
    .bind<GetServiceAssetsUseCase>(DI_TOKENS.GetServiceAssetsUseCase)
    .to(GetServiceAssetsUseCase)
    .inSingletonScope();

  container
    .bind<GetAssetServicesUseCase>(DI_TOKENS.GetAssetServicesUseCase)
    .to(GetAssetServicesUseCase)
    .inSingletonScope();

  diLogger.debug(
    "bindServiceDependencies",
    "Service Management module loaded successfully",
  );
}
