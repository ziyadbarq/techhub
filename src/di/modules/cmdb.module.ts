/**
 * CMDB Module - DI Bindings
 *
 * Binds repositories and use cases for configuration items, relationship types,
 * and CI relationships.
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { logger } from "@/lib/logger";

// Repositories
import type { IConfigurationItemRepository } from "@/core/repositories/configuration-item.repository.interface";
import type { ICIRelationshipRepository } from "@/core/repositories/ci-relationship.repository.interface";
import type { IRelationshipTypeRepository } from "@/core/repositories/relationship-type.repository.interface";
import { PrismaConfigurationItemRepository } from "@/infrastructure/repositories/prisma-configuration-item.repository";
import { PrismaCIRelationshipRepository } from "@/infrastructure/repositories/prisma-ci-relationship.repository";
import { PrismaRelationshipTypeRepository } from "@/infrastructure/repositories/prisma-relationship-type.repository";

// Use Cases - Configuration Items
import { CreateConfigurationItemUseCase } from "@/core/use-cases/cmdb/configuration-item/create-configuration-item.use-case";
import { GetConfigurationItemUseCase } from "@/core/use-cases/cmdb/configuration-item/get-configuration-item.use-case";
import { ListConfigurationItemsUseCase } from "@/core/use-cases/cmdb/configuration-item/list-configuration-items.use-case";
import { UpdateConfigurationItemUseCase } from "@/core/use-cases/cmdb/configuration-item/update-configuration-item.use-case";
import { DeleteConfigurationItemUseCase } from "@/core/use-cases/cmdb/configuration-item/delete-configuration-item.use-case";

// Use Cases - Relationship Types
import { CreateRelationshipTypeUseCase } from "@/core/use-cases/cmdb/relationship-type/create-relationship-type.use-case";
import { GetRelationshipTypeUseCase } from "@/core/use-cases/cmdb/relationship-type/get-relationship-type.use-case";
import { ListRelationshipTypesUseCase } from "@/core/use-cases/cmdb/relationship-type/list-relationship-types.use-case";
import { UpdateRelationshipTypeUseCase } from "@/core/use-cases/cmdb/relationship-type/update-relationship-type.use-case";
import { DeleteRelationshipTypeUseCase } from "@/core/use-cases/cmdb/relationship-type/delete-relationship-type.use-case";

// Use Cases - CI Relationships
import { CreateCIRelationshipUseCase } from "@/core/use-cases/cmdb/ci-relationship/create-ci-relationship.use-case";
import { GetCIRelationshipUseCase } from "@/core/use-cases/cmdb/ci-relationship/get-ci-relationship.use-case";
import { ListCIRelationshipsUseCase } from "@/core/use-cases/cmdb/ci-relationship/list-ci-relationships.use-case";
import { UpdateCIRelationshipUseCase } from "@/core/use-cases/cmdb/ci-relationship/update-ci-relationship.use-case";
import { DeleteCIRelationshipUseCase } from "@/core/use-cases/cmdb/ci-relationship/delete-ci-relationship.use-case";

const diLogger = logger.scope("DI:CMDBModule");

export function bindCMDBDependencies(container: Container): void {
  diLogger.debug("bindCMDBDependencies", "Binding CMDB dependencies...");

  // Repositories
  container
    .bind<IConfigurationItemRepository>(DI_TOKENS.IConfigurationItemRepository)
    .to(PrismaConfigurationItemRepository)
    .inSingletonScope();

  container
    .bind<ICIRelationshipRepository>(DI_TOKENS.ICIRelationshipRepository)
    .to(PrismaCIRelationshipRepository)
    .inSingletonScope();

  container
    .bind<IRelationshipTypeRepository>(DI_TOKENS.IRelationshipTypeRepository)
    .to(PrismaRelationshipTypeRepository)
    .inSingletonScope();

  // Configuration Item Use Cases
  container
    .bind<CreateConfigurationItemUseCase>(
      DI_TOKENS.CreateConfigurationItemUseCase,
    )
    .to(CreateConfigurationItemUseCase)
    .inTransientScope();
  container
    .bind<GetConfigurationItemUseCase>(DI_TOKENS.GetConfigurationItemUseCase)
    .to(GetConfigurationItemUseCase)
    .inTransientScope();
  container
    .bind<ListConfigurationItemsUseCase>(
      DI_TOKENS.ListConfigurationItemsUseCase,
    )
    .to(ListConfigurationItemsUseCase)
    .inTransientScope();
  container
    .bind<UpdateConfigurationItemUseCase>(
      DI_TOKENS.UpdateConfigurationItemUseCase,
    )
    .to(UpdateConfigurationItemUseCase)
    .inTransientScope();
  container
    .bind<DeleteConfigurationItemUseCase>(
      DI_TOKENS.DeleteConfigurationItemUseCase,
    )
    .to(DeleteConfigurationItemUseCase)
    .inTransientScope();

  // Relationship Type Use Cases
  container
    .bind<CreateRelationshipTypeUseCase>(
      DI_TOKENS.CreateRelationshipTypeUseCase,
    )
    .to(CreateRelationshipTypeUseCase)
    .inTransientScope();
  container
    .bind<GetRelationshipTypeUseCase>(DI_TOKENS.GetRelationshipTypeUseCase)
    .to(GetRelationshipTypeUseCase)
    .inTransientScope();
  container
    .bind<ListRelationshipTypesUseCase>(DI_TOKENS.ListRelationshipTypesUseCase)
    .to(ListRelationshipTypesUseCase)
    .inTransientScope();
  container
    .bind<UpdateRelationshipTypeUseCase>(
      DI_TOKENS.UpdateRelationshipTypeUseCase,
    )
    .to(UpdateRelationshipTypeUseCase)
    .inTransientScope();
  container
    .bind<DeleteRelationshipTypeUseCase>(
      DI_TOKENS.DeleteRelationshipTypeUseCase,
    )
    .to(DeleteRelationshipTypeUseCase)
    .inTransientScope();

  // CI Relationship Use Cases
  container
    .bind<CreateCIRelationshipUseCase>(DI_TOKENS.CreateCIRelationshipUseCase)
    .to(CreateCIRelationshipUseCase)
    .inTransientScope();
  container
    .bind<GetCIRelationshipUseCase>(DI_TOKENS.GetCIRelationshipUseCase)
    .to(GetCIRelationshipUseCase)
    .inTransientScope();
  container
    .bind<ListCIRelationshipsUseCase>(DI_TOKENS.ListCIRelationshipsUseCase)
    .to(ListCIRelationshipsUseCase)
    .inTransientScope();
  container
    .bind<UpdateCIRelationshipUseCase>(DI_TOKENS.UpdateCIRelationshipUseCase)
    .to(UpdateCIRelationshipUseCase)
    .inTransientScope();
  container
    .bind<DeleteCIRelationshipUseCase>(DI_TOKENS.DeleteCIRelationshipUseCase)
    .to(DeleteCIRelationshipUseCase)
    .inTransientScope();
}
