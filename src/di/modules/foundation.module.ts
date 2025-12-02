/**
 * Foundation Module - DI Bindings
 *
 * This module configures all Foundation layer dependencies:
 * - Repositories (lifecycle, vendor, organization, location, person, field definitions)
 * - Use cases (CRUD operations for all Foundation entities)
 *
 * Foundation provides the core organizational structure and taxonomies
 * for the CMDB/ITAM system.
 */

import type { Container } from "inversify";
import { DI_TOKENS } from "../types";
import { logger } from "@/lib/logger";

// Foundation Repositories
import type { ILifecycleModelRepository } from "@/core/repositories/lifecycle-model.repository.interface";
import type { ILifecycleStateRepository } from "@/core/repositories/lifecycle-state.repository.interface";
import type { ILifecycleTransitionRepository } from "@/core/repositories/lifecycle-transition.repository.interface";
import type { IVendorRepository } from "@/core/repositories/vendor.repository.interface";
import type { IVendorContactRepository } from "@/core/repositories/vendor-contact.repository.interface";
import type { IOrganizationUnitRepository } from "@/core/repositories/organization-unit.repository.interface";
import type { ILocationRepository } from "@/core/repositories/location.repository.interface";
import type { IPersonRepository } from "@/core/repositories/person.repository.interface";
import type { IPersonRoleAssignmentRepository } from "@/core/repositories/person-role-assignment.repository.interface";
import type { IFieldDefinitionRepository } from "@/core/repositories/field-definition.repository.interface";
import type { IFieldTemplateRepository } from "@/core/repositories/field-template.repository.interface";
import type { IExchangeRateRepository } from "@/core/repositories/exchange-rate.repository.interface";

import { PrismaLifecycleModelRepository } from "@/infrastructure/repositories/prisma-lifecycle-model.repository";
import { PrismaLifecycleStateRepository } from "@/infrastructure/repositories/prisma-lifecycle-state.repository";
import { PrismaLifecycleTransitionRepository } from "@/infrastructure/repositories/prisma-lifecycle-transition.repository";
import { PrismaVendorRepository } from "@/infrastructure/repositories/prisma-vendor.repository";
import { PrismaVendorContactRepository } from "@/infrastructure/repositories/prisma-vendor-contact.repository";
import { PrismaOrganizationUnitRepository } from "@/infrastructure/repositories/prisma-organization-unit.repository";
import { PrismaLocationRepository } from "@/infrastructure/repositories/prisma-location.repository";
import { PrismaPersonRepository } from "@/infrastructure/repositories/prisma-person.repository";
import { InMemoryPersonRoleAssignmentRepository } from "@/infrastructure/repositories/in-memory-person-role-assignment.repository";
import { PrismaFieldDefinitionRepository } from "@/infrastructure/repositories/prisma-field-definition.repository";
import { PrismaFieldTemplateRepository } from "@/infrastructure/repositories/prisma-field-template.repository";
import { PrismaExchangeRateRepository } from "@/infrastructure/repositories/prisma-exchange-rate.repository";

// SAR Conversion Service
import type { ISarConversionService } from "@/core/services/sar-conversion.service.interface";
import { SarConversionService } from "@/infrastructure/services/sar-conversion.service";

// Lifecycle Model Use Cases
import { CreateLifecycleModelUseCase } from "@/core/use-cases/foundation/lifecycle-model/create-lifecycle-model.use-case";
import { GetLifecycleModelUseCase } from "@/core/use-cases/foundation/lifecycle-model/get-lifecycle-model.use-case";
import { ListLifecycleModelsUseCase } from "@/core/use-cases/foundation/lifecycle-model/list-lifecycle-models.use-case";
import { UpdateLifecycleModelUseCase } from "@/core/use-cases/foundation/lifecycle-model/update-lifecycle-model.use-case";
import { DeleteLifecycleModelUseCase } from "@/core/use-cases/foundation/lifecycle-model/delete-lifecycle-model.use-case";

// Lifecycle State Use Cases
import { CreateLifecycleStateUseCase } from "@/core/use-cases/foundation/lifecycle-state/create-lifecycle-state.use-case";
import { GetLifecycleStateUseCase } from "@/core/use-cases/foundation/lifecycle-state/get-lifecycle-state.use-case";
import { ListLifecycleStatesUseCase } from "@/core/use-cases/foundation/lifecycle-state/list-lifecycle-states.use-case";
import { UpdateLifecycleStateUseCase } from "@/core/use-cases/foundation/lifecycle-state/update-lifecycle-state.use-case";
import { DeleteLifecycleStateUseCase } from "@/core/use-cases/foundation/lifecycle-state/delete-lifecycle-state.use-case";

// Lifecycle Transition Use Cases
import { CreateLifecycleTransitionUseCase } from "@/core/use-cases/foundation/lifecycle-transition/create-lifecycle-transition.use-case";
import { GetLifecycleTransitionUseCase } from "@/core/use-cases/foundation/lifecycle-transition/get-lifecycle-transition.use-case";
import { ListLifecycleTransitionsUseCase } from "@/core/use-cases/foundation/lifecycle-transition/list-lifecycle-transitions.use-case";
import { UpdateLifecycleTransitionUseCase } from "@/core/use-cases/foundation/lifecycle-transition/update-lifecycle-transition.use-case";
import { DeleteLifecycleTransitionUseCase } from "@/core/use-cases/foundation/lifecycle-transition/delete-lifecycle-transition.use-case";

// Vendor Use Cases
import { CreateVendorUseCase } from "@/core/use-cases/foundation/vendor/create-vendor.use-case";
import { GetVendorUseCase } from "@/core/use-cases/foundation/vendor/get-vendor.use-case";
import { ListVendorsUseCase } from "@/core/use-cases/foundation/vendor/list-vendors.use-case";
import { UpdateVendorUseCase } from "@/core/use-cases/foundation/vendor/update-vendor.use-case";
import { DeleteVendorUseCase } from "@/core/use-cases/foundation/vendor/delete-vendor.use-case";

// Vendor Contact Use Cases
import { CreateVendorContactUseCase } from "@/core/use-cases/foundation/vendor-contact/create-vendor-contact.use-case";
import { GetVendorContactUseCase } from "@/core/use-cases/foundation/vendor-contact/get-vendor-contact.use-case";
import { ListVendorContactsUseCase } from "@/core/use-cases/foundation/vendor-contact/list-vendor-contacts.use-case";
import { UpdateVendorContactUseCase } from "@/core/use-cases/foundation/vendor-contact/update-vendor-contact.use-case";
import { DeleteVendorContactUseCase } from "@/core/use-cases/foundation/vendor-contact/delete-vendor-contact.use-case";

// Organization Unit Use Cases
import { CreateOrganizationUnitUseCase } from "@/core/use-cases/foundation/organization-unit/create-organization-unit.use-case";
import { GetOrganizationUnitUseCase } from "@/core/use-cases/foundation/organization-unit/get-organization-unit.use-case";
import { ListOrganizationUnitsUseCase } from "@/core/use-cases/foundation/organization-unit/list-organization-units.use-case";
import { UpdateOrganizationUnitUseCase } from "@/core/use-cases/foundation/organization-unit/update-organization-unit.use-case";
import { DeleteOrganizationUnitUseCase } from "@/core/use-cases/foundation/organization-unit/delete-organization-unit.use-case";

// Location Use Cases
import { CreateLocationUseCase } from "@/core/use-cases/foundation/location/create-location.use-case";
import { GetLocationUseCase } from "@/core/use-cases/foundation/location/get-location.use-case";
import { ListLocationsUseCase } from "@/core/use-cases/foundation/location/list-locations.use-case";
import { UpdateLocationUseCase } from "@/core/use-cases/foundation/location/update-location.use-case";
import { DeleteLocationUseCase } from "@/core/use-cases/foundation/location/delete-location.use-case";

// Person Use Cases
import { CreatePersonUseCase } from "@/core/use-cases/foundation/person/create-person.use-case";
import { GetPersonUseCase } from "@/core/use-cases/foundation/person/get-person.use-case";
import { ListPeopleUseCase } from "@/core/use-cases/foundation/person/list-people.use-case";
import { UpdatePersonUseCase } from "@/core/use-cases/foundation/person/update-person.use-case";
import { DeletePersonUseCase } from "@/core/use-cases/foundation/person/delete-person.use-case";
import { DeletePersonWithConfirmationUseCase } from "@/core/use-cases/foundation/person/delete-person-with-confirmation.use-case";
import { TogglePersonExclusionUseCase } from "@/core/use-cases/foundation/person/toggle-person-exclusion.use-case";
import { TogglePersonStatusUseCase } from "@/core/use-cases/foundation/person/toggle-person-status.use-case";
import type { IPersonDependencyRepository } from "@/core/repositories/person-dependency.repository.interface";
import { PrismaPersonDependencyRepository } from "@/infrastructure/repositories/prisma-person-dependency.repository";

// Employee Directory Use Cases
import {
  ListEmployeeDirectoryUseCase,
  GetReportingChainUseCase,
  GetDirectReportsUseCase,
  GetRootEmployeesUseCase,
} from "@/core/use-cases/foundation/employee-directory";

// Person Role Assignment Use Cases (feature stub)
import { CreatePersonRoleAssignmentUseCase } from "@/core/use-cases/foundation/person-role-assignment/create-person-role-assignment.use-case";
import { GetPersonRoleAssignmentUseCase } from "@/core/use-cases/foundation/person-role-assignment/get-person-role-assignment.use-case";
import { ListPersonRoleAssignmentsUseCase } from "@/core/use-cases/foundation/person-role-assignment/list-person-role-assignments.use-case";
import { UpdatePersonRoleAssignmentUseCase } from "@/core/use-cases/foundation/person-role-assignment/update-person-role-assignment.use-case";
import { DeletePersonRoleAssignmentUseCase } from "@/core/use-cases/foundation/person-role-assignment/delete-person-role-assignment.use-case";

// Field Definition Use Cases
import { CreateFieldDefinitionUseCase } from "@/core/use-cases/foundation/field-definition/create-field-definition.use-case";
import { GetFieldDefinitionUseCase } from "@/core/use-cases/foundation/field-definition/get-field-definition.use-case";
import { GetFieldUsageDashboardUseCase } from "@/core/use-cases/foundation/field-definition/get-field-usage-dashboard.use-case";
import { ListFieldDefinitionsUseCase } from "@/core/use-cases/foundation/field-definition/list-field-definitions.use-case";
import { UpdateFieldDefinitionUseCase } from "@/core/use-cases/foundation/field-definition/update-field-definition.use-case";
import { DeleteFieldDefinitionUseCase } from "@/core/use-cases/foundation/field-definition/delete-field-definition.use-case";

// Field Template Use Cases
import {
  CreateFieldTemplateUseCase,
  GetFieldTemplateUseCase,
  ListFieldTemplatesUseCase,
  UpdateFieldTemplateUseCase,
  DeleteFieldTemplateUseCase,
  CloneFieldTemplateUseCase,
  ApplyFieldTemplateUseCase,
} from "@/core/use-cases/foundation/field-template";

// Exchange Rate Use Cases
import { CreateExchangeRateUseCase } from "@/core/use-cases/foundation/exchange-rate/create-exchange-rate.use-case";
import { GetExchangeRateUseCase } from "@/core/use-cases/foundation/exchange-rate/get-exchange-rate.use-case";
import { ListExchangeRatesUseCase } from "@/core/use-cases/foundation/exchange-rate/list-exchange-rates.use-case";
import { UpdateExchangeRateUseCase } from "@/core/use-cases/foundation/exchange-rate/update-exchange-rate.use-case";
import { DeleteExchangeRateUseCase } from "@/core/use-cases/foundation/exchange-rate/delete-exchange-rate.use-case";
import { ConvertCurrencyUseCase } from "@/core/use-cases/foundation/exchange-rate/convert-currency.use-case";

const diLogger = logger.scope("DI");

/**
 * Binds all Foundation dependencies to the container
 */
export function bindFoundationDependencies(container: Container): void {
  // ==========================================
  // Foundation Repositories
  // ==========================================

  container
    .bind<ILifecycleModelRepository>(DI_TOKENS.ILifecycleModelRepository)
    .to(PrismaLifecycleModelRepository)
    .inSingletonScope();

  container
    .bind<ILifecycleStateRepository>(DI_TOKENS.ILifecycleStateRepository)
    .to(PrismaLifecycleStateRepository)
    .inSingletonScope();

  container
    .bind<ILifecycleTransitionRepository>(
      DI_TOKENS.ILifecycleTransitionRepository,
    )
    .to(PrismaLifecycleTransitionRepository)
    .inSingletonScope();

  container
    .bind<IVendorRepository>(DI_TOKENS.IVendorRepository)
    .to(PrismaVendorRepository)
    .inSingletonScope();

  container
    .bind<IVendorContactRepository>(DI_TOKENS.IVendorContactRepository)
    .to(PrismaVendorContactRepository)
    .inSingletonScope();

  container
    .bind<IOrganizationUnitRepository>(DI_TOKENS.IOrganizationUnitRepository)
    .to(PrismaOrganizationUnitRepository)
    .inSingletonScope();

  container
    .bind<ILocationRepository>(DI_TOKENS.ILocationRepository)
    .to(PrismaLocationRepository)
    .inSingletonScope();

  container
    .bind<IPersonRepository>(DI_TOKENS.IPersonRepository)
    .to(PrismaPersonRepository)
    .inSingletonScope();

  container
    .bind<IPersonDependencyRepository>(DI_TOKENS.IPersonDependencyRepository)
    .to(PrismaPersonDependencyRepository)
    .inSingletonScope();

  container
    .bind<IPersonRoleAssignmentRepository>(
      DI_TOKENS.IPersonRoleAssignmentRepository,
    )
    .to(InMemoryPersonRoleAssignmentRepository)
    .inSingletonScope();

  container
    .bind<IFieldDefinitionRepository>(DI_TOKENS.IFieldDefinitionRepository)
    .to(PrismaFieldDefinitionRepository)
    .inSingletonScope();

  container
    .bind<IFieldTemplateRepository>(DI_TOKENS.IFieldTemplateRepository)
    .to(PrismaFieldTemplateRepository)
    .inSingletonScope();

  container
    .bind<IExchangeRateRepository>(DI_TOKENS.IExchangeRateRepository)
    .to(PrismaExchangeRateRepository)
    .inSingletonScope();

  // ==========================================
  // Foundation Services
  // ==========================================

  container
    .bind<ISarConversionService>(DI_TOKENS.ISarConversionService)
    .to(SarConversionService)
    .inSingletonScope();

  // ==========================================
  // Lifecycle Model Use Cases
  // ==========================================

  container
    .bind<CreateLifecycleModelUseCase>(DI_TOKENS.CreateLifecycleModelUseCase)
    .to(CreateLifecycleModelUseCase)
    .inTransientScope();

  container
    .bind<GetLifecycleModelUseCase>(DI_TOKENS.GetLifecycleModelUseCase)
    .to(GetLifecycleModelUseCase)
    .inTransientScope();

  container
    .bind<ListLifecycleModelsUseCase>(DI_TOKENS.ListLifecycleModelsUseCase)
    .to(ListLifecycleModelsUseCase)
    .inTransientScope();

  container
    .bind<UpdateLifecycleModelUseCase>(DI_TOKENS.UpdateLifecycleModelUseCase)
    .to(UpdateLifecycleModelUseCase)
    .inTransientScope();

  container
    .bind<DeleteLifecycleModelUseCase>(DI_TOKENS.DeleteLifecycleModelUseCase)
    .to(DeleteLifecycleModelUseCase)
    .inTransientScope();

  // ==========================================
  // Lifecycle State Use Cases
  // ==========================================

  container
    .bind<CreateLifecycleStateUseCase>(DI_TOKENS.CreateLifecycleStateUseCase)
    .to(CreateLifecycleStateUseCase)
    .inTransientScope();

  container
    .bind<GetLifecycleStateUseCase>(DI_TOKENS.GetLifecycleStateUseCase)
    .to(GetLifecycleStateUseCase)
    .inTransientScope();

  container
    .bind<ListLifecycleStatesUseCase>(DI_TOKENS.ListLifecycleStatesUseCase)
    .to(ListLifecycleStatesUseCase)
    .inTransientScope();

  container
    .bind<UpdateLifecycleStateUseCase>(DI_TOKENS.UpdateLifecycleStateUseCase)
    .to(UpdateLifecycleStateUseCase)
    .inTransientScope();

  container
    .bind<DeleteLifecycleStateUseCase>(DI_TOKENS.DeleteLifecycleStateUseCase)
    .to(DeleteLifecycleStateUseCase)
    .inTransientScope();

  // ==========================================
  // Lifecycle Transition Use Cases
  // ==========================================

  container
    .bind<CreateLifecycleTransitionUseCase>(
      DI_TOKENS.CreateLifecycleTransitionUseCase,
    )
    .to(CreateLifecycleTransitionUseCase)
    .inTransientScope();

  container
    .bind<GetLifecycleTransitionUseCase>(
      DI_TOKENS.GetLifecycleTransitionUseCase,
    )
    .to(GetLifecycleTransitionUseCase)
    .inTransientScope();

  container
    .bind<ListLifecycleTransitionsUseCase>(
      DI_TOKENS.ListLifecycleTransitionsUseCase,
    )
    .to(ListLifecycleTransitionsUseCase)
    .inTransientScope();

  container
    .bind<UpdateLifecycleTransitionUseCase>(
      DI_TOKENS.UpdateLifecycleTransitionUseCase,
    )
    .to(UpdateLifecycleTransitionUseCase)
    .inTransientScope();

  container
    .bind<DeleteLifecycleTransitionUseCase>(
      DI_TOKENS.DeleteLifecycleTransitionUseCase,
    )
    .to(DeleteLifecycleTransitionUseCase)
    .inTransientScope();

  // ==========================================
  // Vendor Use Cases
  // ==========================================

  container
    .bind<CreateVendorUseCase>(DI_TOKENS.CreateVendorUseCase)
    .to(CreateVendorUseCase)
    .inTransientScope();

  container
    .bind<GetVendorUseCase>(DI_TOKENS.GetVendorUseCase)
    .to(GetVendorUseCase)
    .inTransientScope();

  container
    .bind<ListVendorsUseCase>(DI_TOKENS.ListVendorsUseCase)
    .to(ListVendorsUseCase)
    .inTransientScope();

  container
    .bind<UpdateVendorUseCase>(DI_TOKENS.UpdateVendorUseCase)
    .to(UpdateVendorUseCase)
    .inTransientScope();

  container
    .bind<DeleteVendorUseCase>(DI_TOKENS.DeleteVendorUseCase)
    .to(DeleteVendorUseCase)
    .inTransientScope();

  // ==========================================
  // Vendor Contact Use Cases
  // ==========================================

  container
    .bind<CreateVendorContactUseCase>(DI_TOKENS.CreateVendorContactUseCase)
    .to(CreateVendorContactUseCase)
    .inTransientScope();

  container
    .bind<GetVendorContactUseCase>(DI_TOKENS.GetVendorContactUseCase)
    .to(GetVendorContactUseCase)
    .inTransientScope();

  container
    .bind<ListVendorContactsUseCase>(DI_TOKENS.ListVendorContactsUseCase)
    .to(ListVendorContactsUseCase)
    .inTransientScope();

  container
    .bind<UpdateVendorContactUseCase>(DI_TOKENS.UpdateVendorContactUseCase)
    .to(UpdateVendorContactUseCase)
    .inTransientScope();

  container
    .bind<DeleteVendorContactUseCase>(DI_TOKENS.DeleteVendorContactUseCase)
    .to(DeleteVendorContactUseCase)
    .inTransientScope();

  // ==========================================
  // Organization Unit Use Cases
  // ==========================================

  container
    .bind<CreateOrganizationUnitUseCase>(
      DI_TOKENS.CreateOrganizationUnitUseCase,
    )
    .to(CreateOrganizationUnitUseCase)
    .inTransientScope();

  container
    .bind<GetOrganizationUnitUseCase>(DI_TOKENS.GetOrganizationUnitUseCase)
    .to(GetOrganizationUnitUseCase)
    .inTransientScope();

  container
    .bind<ListOrganizationUnitsUseCase>(DI_TOKENS.ListOrganizationUnitsUseCase)
    .to(ListOrganizationUnitsUseCase)
    .inTransientScope();

  container
    .bind<UpdateOrganizationUnitUseCase>(
      DI_TOKENS.UpdateOrganizationUnitUseCase,
    )
    .to(UpdateOrganizationUnitUseCase)
    .inTransientScope();

  container
    .bind<DeleteOrganizationUnitUseCase>(
      DI_TOKENS.DeleteOrganizationUnitUseCase,
    )
    .to(DeleteOrganizationUnitUseCase)
    .inTransientScope();

  // ==========================================
  // Location Use Cases
  // ==========================================

  container
    .bind<CreateLocationUseCase>(DI_TOKENS.CreateLocationUseCase)
    .to(CreateLocationUseCase)
    .inTransientScope();

  container
    .bind<GetLocationUseCase>(DI_TOKENS.GetLocationUseCase)
    .to(GetLocationUseCase)
    .inTransientScope();

  container
    .bind<ListLocationsUseCase>(DI_TOKENS.ListLocationsUseCase)
    .to(ListLocationsUseCase)
    .inTransientScope();

  container
    .bind<UpdateLocationUseCase>(DI_TOKENS.UpdateLocationUseCase)
    .to(UpdateLocationUseCase)
    .inTransientScope();

  container
    .bind<DeleteLocationUseCase>(DI_TOKENS.DeleteLocationUseCase)
    .to(DeleteLocationUseCase)
    .inTransientScope();

  // ==========================================
  // Person Use Cases
  // ==========================================

  container
    .bind<CreatePersonUseCase>(DI_TOKENS.CreatePersonUseCase)
    .to(CreatePersonUseCase)
    .inTransientScope();

  container
    .bind<GetPersonUseCase>(DI_TOKENS.GetPersonUseCase)
    .to(GetPersonUseCase)
    .inTransientScope();

  container
    .bind<ListPeopleUseCase>(DI_TOKENS.ListPersonsUseCase)
    .to(ListPeopleUseCase)
    .inTransientScope();

  container
    .bind<UpdatePersonUseCase>(DI_TOKENS.UpdatePersonUseCase)
    .to(UpdatePersonUseCase)
    .inTransientScope();

  container
    .bind<DeletePersonUseCase>(DI_TOKENS.DeletePersonUseCase)
    .to(DeletePersonUseCase)
    .inTransientScope();

  container
    .bind<DeletePersonWithConfirmationUseCase>(
      DI_TOKENS.DeletePersonWithConfirmationUseCase,
    )
    .to(DeletePersonWithConfirmationUseCase)
    .inTransientScope();

  container
    .bind<TogglePersonExclusionUseCase>(DI_TOKENS.TogglePersonExclusionUseCase)
    .to(TogglePersonExclusionUseCase)
    .inTransientScope();

  container
    .bind<TogglePersonStatusUseCase>(DI_TOKENS.TogglePersonStatusUseCase)
    .to(TogglePersonStatusUseCase)
    .inTransientScope();

  // ==========================================
  // Employee Directory Use Cases
  // ==========================================

  container
    .bind<ListEmployeeDirectoryUseCase>(DI_TOKENS.ListEmployeeDirectoryUseCase)
    .to(ListEmployeeDirectoryUseCase)
    .inTransientScope();

  container
    .bind<GetReportingChainUseCase>(DI_TOKENS.GetReportingChainUseCase)
    .to(GetReportingChainUseCase)
    .inTransientScope();

  container
    .bind<GetDirectReportsUseCase>(DI_TOKENS.GetDirectReportsUseCase)
    .to(GetDirectReportsUseCase)
    .inTransientScope();

  container
    .bind<GetRootEmployeesUseCase>(DI_TOKENS.GetRootEmployeesUseCase)
    .to(GetRootEmployeesUseCase)
    .inTransientScope();

  // ==========================================
  // Person Role Assignment Use Cases (stubbed)
  // ==========================================

  container
    .bind<CreatePersonRoleAssignmentUseCase>(
      DI_TOKENS.CreatePersonRoleAssignmentUseCase,
    )
    .to(CreatePersonRoleAssignmentUseCase)
    .inTransientScope();

  container
    .bind<GetPersonRoleAssignmentUseCase>(
      DI_TOKENS.GetPersonRoleAssignmentUseCase,
    )
    .to(GetPersonRoleAssignmentUseCase)
    .inTransientScope();

  container
    .bind<ListPersonRoleAssignmentsUseCase>(
      DI_TOKENS.ListPersonRoleAssignmentsUseCase,
    )
    .to(ListPersonRoleAssignmentsUseCase)
    .inTransientScope();

  container
    .bind<UpdatePersonRoleAssignmentUseCase>(
      DI_TOKENS.UpdatePersonRoleAssignmentUseCase,
    )
    .to(UpdatePersonRoleAssignmentUseCase)
    .inTransientScope();

  container
    .bind<DeletePersonRoleAssignmentUseCase>(
      DI_TOKENS.DeletePersonRoleAssignmentUseCase,
    )
    .to(DeletePersonRoleAssignmentUseCase)
    .inTransientScope();

  // ==========================================
  // Field Definition Use Cases
  // ==========================================

  container
    .bind<CreateFieldDefinitionUseCase>(DI_TOKENS.CreateFieldDefinitionUseCase)
    .to(CreateFieldDefinitionUseCase)
    .inTransientScope();

  container
    .bind<GetFieldDefinitionUseCase>(DI_TOKENS.GetFieldDefinitionUseCase)
    .to(GetFieldDefinitionUseCase)
    .inTransientScope();

  container
    .bind<ListFieldDefinitionsUseCase>(DI_TOKENS.ListFieldDefinitionsUseCase)
    .to(ListFieldDefinitionsUseCase)
    .inTransientScope();

  container
    .bind<UpdateFieldDefinitionUseCase>(DI_TOKENS.UpdateFieldDefinitionUseCase)
    .to(UpdateFieldDefinitionUseCase)
    .inTransientScope();

  container
    .bind<DeleteFieldDefinitionUseCase>(DI_TOKENS.DeleteFieldDefinitionUseCase)
    .to(DeleteFieldDefinitionUseCase)
    .inTransientScope();

  container
    .bind<GetFieldUsageDashboardUseCase>(
      DI_TOKENS.GetFieldUsageDashboardUseCase,
    )
    .to(GetFieldUsageDashboardUseCase)
    .inTransientScope();

  // ==========================================
  // Field Template Use Cases
  // ==========================================

  container
    .bind<CreateFieldTemplateUseCase>(DI_TOKENS.CreateFieldTemplateUseCase)
    .to(CreateFieldTemplateUseCase)
    .inTransientScope();

  container
    .bind<GetFieldTemplateUseCase>(DI_TOKENS.GetFieldTemplateUseCase)
    .to(GetFieldTemplateUseCase)
    .inTransientScope();

  container
    .bind<ListFieldTemplatesUseCase>(DI_TOKENS.ListFieldTemplatesUseCase)
    .to(ListFieldTemplatesUseCase)
    .inTransientScope();

  container
    .bind<UpdateFieldTemplateUseCase>(DI_TOKENS.UpdateFieldTemplateUseCase)
    .to(UpdateFieldTemplateUseCase)
    .inTransientScope();

  container
    .bind<DeleteFieldTemplateUseCase>(DI_TOKENS.DeleteFieldTemplateUseCase)
    .to(DeleteFieldTemplateUseCase)
    .inTransientScope();

  container
    .bind<CloneFieldTemplateUseCase>(DI_TOKENS.CloneFieldTemplateUseCase)
    .to(CloneFieldTemplateUseCase)
    .inTransientScope();

  container
    .bind<ApplyFieldTemplateUseCase>(DI_TOKENS.ApplyFieldTemplateUseCase)
    .to(ApplyFieldTemplateUseCase)
    .inTransientScope();

  // ==========================================
  // Exchange Rate Use Cases
  // ==========================================

  container
    .bind<CreateExchangeRateUseCase>(DI_TOKENS.CreateExchangeRateUseCase)
    .to(CreateExchangeRateUseCase)
    .inTransientScope();

  container
    .bind<GetExchangeRateUseCase>(DI_TOKENS.GetExchangeRateUseCase)
    .to(GetExchangeRateUseCase)
    .inTransientScope();

  container
    .bind<ListExchangeRatesUseCase>(DI_TOKENS.ListExchangeRatesUseCase)
    .to(ListExchangeRatesUseCase)
    .inTransientScope();

  container
    .bind<UpdateExchangeRateUseCase>(DI_TOKENS.UpdateExchangeRateUseCase)
    .to(UpdateExchangeRateUseCase)
    .inTransientScope();

  container
    .bind<DeleteExchangeRateUseCase>(DI_TOKENS.DeleteExchangeRateUseCase)
    .to(DeleteExchangeRateUseCase)
    .inTransientScope();

  container
    .bind<ConvertCurrencyUseCase>(DI_TOKENS.ConvertCurrencyUseCase)
    .to(ConvertCurrencyUseCase)
    .inTransientScope();

  diLogger.debug(
    "bindFoundationDependencies",
    "Foundation dependencies bound successfully",
  );
}
