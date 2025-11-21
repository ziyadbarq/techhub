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
import type { ICIClassRepository } from "@/core/repositories/ci-class.repository.interface";
import type { ICIClassFieldRepository } from "@/core/repositories/ci-class-field.repository.interface";
import type { IConfigurationItemRepository } from "@/core/repositories/configuration-item.repository.interface";
import type { ICIRelationshipRepository } from "@/core/repositories/ci-relationship.repository.interface";
import type { IRelationshipTypeRepository } from "@/core/repositories/relationship-type.repository.interface";
import type { IRelationshipTypeScopeRepository } from "@/core/repositories/relationship-type-scope.repository.interface";
import { PrismaCIClassRepository } from "@/infrastructure/repositories/prisma-ci-class.repository";
import { PrismaCIClassFieldRepository } from "@/infrastructure/repositories/prisma-ci-class-field.repository";
import { PrismaConfigurationItemRepository } from "@/infrastructure/repositories/prisma-configuration-item.repository";
import { PrismaCIRelationshipRepository } from "@/infrastructure/repositories/prisma-ci-relationship.repository";
import { PrismaRelationshipTypeRepository } from "@/infrastructure/repositories/prisma-relationship-type.repository";
import { PrismaRelationshipTypeScopeRepository } from "@/infrastructure/repositories/prisma-relationship-type-scope.repository";

// Use Cases - CI Classes
import { CreateCIClassUseCase } from "@/core/use-cases/ci-class/create-ci-class.use-case";
import { GetCIClassUseCase } from "@/core/use-cases/ci-class/get-ci-class.use-case";
import { ListCIClassesUseCase } from "@/core/use-cases/ci-class/list-ci-classes.use-case";
import { UpdateCIClassUseCase } from "@/core/use-cases/ci-class/update-ci-class.use-case";
import { DeleteCIClassUseCase } from "@/core/use-cases/ci-class/delete-ci-class.use-case";

// Use Cases - CI Class Fields
import { CreateCIClassFieldUseCase } from "@/core/use-cases/ci-class-field/create-ci-class-field.use-case";
import { GetCIClassFieldUseCase } from "@/core/use-cases/ci-class-field/get-ci-class-field.use-case";
import { ListCIClassFieldsUseCase } from "@/core/use-cases/ci-class-field/list-ci-class-fields.use-case";
import { UpdateCIClassFieldUseCase } from "@/core/use-cases/ci-class-field/update-ci-class-field.use-case";
import { DeleteCIClassFieldUseCase } from "@/core/use-cases/ci-class-field/delete-ci-class-field.use-case";

// Use Cases - Configuration Items
import { CreateConfigurationItemUseCase } from "@/core/use-cases/cmdb/configuration-item/create-configuration-item.use-case";
import { GetConfigurationItemUseCase } from "@/core/use-cases/cmdb/configuration-item/get-configuration-item.use-case";
import { ListConfigurationItemsUseCase } from "@/core/use-cases/cmdb/configuration-item/list-configuration-items.use-case";
import { UpdateConfigurationItemUseCase } from "@/core/use-cases/cmdb/configuration-item/update-configuration-item.use-case";
import { DeleteConfigurationItemUseCase } from "@/core/use-cases/cmdb/configuration-item/delete-configuration-item.use-case";
import { DeleteCIWithConfirmationUseCase } from "@/core/use-cases/cmdb/configuration-item/delete-ci-with-confirmation.use-case";

// Use Cases - Relationship Types
import { CreateRelationshipTypeUseCase } from "@/core/use-cases/cmdb/relationship-type/create-relationship-type.use-case";
import { GetRelationshipTypeUseCase } from "@/core/use-cases/cmdb/relationship-type/get-relationship-type.use-case";
import { ListRelationshipTypesUseCase } from "@/core/use-cases/cmdb/relationship-type/list-relationship-types.use-case";
import { UpdateRelationshipTypeUseCase } from "@/core/use-cases/cmdb/relationship-type/update-relationship-type.use-case";
import { DeleteRelationshipTypeUseCase } from "@/core/use-cases/cmdb/relationship-type/delete-relationship-type.use-case";

// Use Cases - Relationship Type Scopes
import { CreateRelationshipTypeScopeUseCase } from "@/core/use-cases/relationship-type-scope/create-relationship-type-scope.use-case";
import { GetRelationshipTypeScopeUseCase } from "@/core/use-cases/relationship-type-scope/get-relationship-type-scope.use-case";
import { ListRelationshipTypeScopesUseCase } from "@/core/use-cases/relationship-type-scope/list-relationship-type-scopes.use-case";
import { UpdateRelationshipTypeScopeUseCase } from "@/core/use-cases/relationship-type-scope/update-relationship-type-scope.use-case";
import { DeleteRelationshipTypeScopeUseCase } from "@/core/use-cases/relationship-type-scope/delete-relationship-type-scope.use-case";

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
    .bind<ICIClassRepository>(DI_TOKENS.ICIClassRepository)
    .to(PrismaCIClassRepository)
    .inSingletonScope();

  container
    .bind<ICIClassFieldRepository>(DI_TOKENS.ICIClassFieldRepository)
    .to(PrismaCIClassFieldRepository)
    .inSingletonScope();

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

  container
    .bind<IRelationshipTypeScopeRepository>(
      DI_TOKENS.IRelationshipTypeScopeRepository,
    )
    .to(PrismaRelationshipTypeScopeRepository)
    .inSingletonScope();

  // CI Class Use Cases
  container
    .bind<CreateCIClassUseCase>(DI_TOKENS.CreateCIClassUseCase)
    .to(CreateCIClassUseCase)
    .inTransientScope();
  container
    .bind<GetCIClassUseCase>(DI_TOKENS.GetCIClassUseCase)
    .to(GetCIClassUseCase)
    .inTransientScope();
  container
    .bind<ListCIClassesUseCase>(DI_TOKENS.ListCIClassesUseCase)
    .to(ListCIClassesUseCase)
    .inTransientScope();
  container
    .bind<UpdateCIClassUseCase>(DI_TOKENS.UpdateCIClassUseCase)
    .to(UpdateCIClassUseCase)
    .inTransientScope();
  container
    .bind<DeleteCIClassUseCase>(DI_TOKENS.DeleteCIClassUseCase)
    .to(DeleteCIClassUseCase)
    .inTransientScope();

  // CI Class Field Use Cases
  container
    .bind<CreateCIClassFieldUseCase>(DI_TOKENS.CreateCIClassFieldUseCase)
    .to(CreateCIClassFieldUseCase)
    .inTransientScope();
  container
    .bind<GetCIClassFieldUseCase>(DI_TOKENS.GetCIClassFieldUseCase)
    .to(GetCIClassFieldUseCase)
    .inTransientScope();
  container
    .bind<ListCIClassFieldsUseCase>(DI_TOKENS.ListCIClassFieldsUseCase)
    .to(ListCIClassFieldsUseCase)
    .inTransientScope();
  container
    .bind<UpdateCIClassFieldUseCase>(DI_TOKENS.UpdateCIClassFieldUseCase)
    .to(UpdateCIClassFieldUseCase)
    .inTransientScope();
  container
    .bind<DeleteCIClassFieldUseCase>(DI_TOKENS.DeleteCIClassFieldUseCase)
    .to(DeleteCIClassFieldUseCase)
    .inTransientScope();

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
  container
    .bind<DeleteCIWithConfirmationUseCase>(
      DI_TOKENS.DeleteCIWithConfirmationUseCase,
    )
    .to(DeleteCIWithConfirmationUseCase)
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

  // Relationship Type Scope Use Cases
  container
    .bind<CreateRelationshipTypeScopeUseCase>(
      DI_TOKENS.CreateRelationshipTypeScopeUseCase,
    )
    .to(CreateRelationshipTypeScopeUseCase)
    .inTransientScope();
  container
    .bind<GetRelationshipTypeScopeUseCase>(
      DI_TOKENS.GetRelationshipTypeScopeUseCase,
    )
    .to(GetRelationshipTypeScopeUseCase)
    .inTransientScope();
  container
    .bind<ListRelationshipTypeScopesUseCase>(
      DI_TOKENS.ListRelationshipTypeScopesUseCase,
    )
    .to(ListRelationshipTypeScopesUseCase)
    .inTransientScope();
  container
    .bind<UpdateRelationshipTypeScopeUseCase>(
      DI_TOKENS.UpdateRelationshipTypeScopeUseCase,
    )
    .to(UpdateRelationshipTypeScopeUseCase)
    .inTransientScope();
  container
    .bind<DeleteRelationshipTypeScopeUseCase>(
      DI_TOKENS.DeleteRelationshipTypeScopeUseCase,
    )
    .to(DeleteRelationshipTypeScopeUseCase)
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
