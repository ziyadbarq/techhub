/**
 * Dependency Injection Types
 *
 * This file defines all DI tokens (symbols) used throughout the application.
 * Using symbols ensures type-safe dependency injection and prevents naming collisions.
 *
 * Usage:
 * - Import these tokens when binding implementations in container modules
 * - Use @inject(DI_TOKENS.SymbolName) decorator in classes to inject dependencies
 * - Reference these tokens when resolving dependencies from the container
 */

/**
 * DI_TOKENS object containing all dependency injection symbols
 *
 * Organized by domain:
 * - Repositories: Data access layer interfaces
 * - Services: Business logic and infrastructure services
 * - Use Cases: Application logic orchestration
 * - Infrastructure: External dependencies (database, etc.)
 */
export const DI_TOKENS = {
  // ==========================================
  // Repository Tokens
  // ==========================================

  /**
   * Token for IPromptBlockRepository
   * Manages CRUD operations for atomic prompt blocks
   */
  IPromptBlockRepository: Symbol.for("IPromptBlockRepository"),

  /**
   * Token for IPromptCompositionRepository
   * Manages CRUD operations for prompt compositions
   */
  IPromptCompositionRepository: Symbol.for("IPromptCompositionRepository"),

  /**
   * Token for ITaskRepository
   * Manages CRUD operations for task entities (example CRUD)
   */
  ITaskRepository: Symbol.for("ITaskRepository"),

  // RBAC Repositories
  IRoleRepository: Symbol.for("IRoleRepository"),
  IPermissionRepository: Symbol.for("IPermissionRepository"),
  IUserRoleRepository: Symbol.for("IUserRoleRepository"),
  IUserRepository: Symbol.for("IUserRepository"),
  IAuditLogRepository: Symbol.for("IAuditLogRepository"),

  // System Setup Repository
  ISystemSetupRepository: Symbol.for("ISystemSetupRepository"),

  // Feature Flags Repository
  IFeatureFlagRepository: Symbol.for("IFeatureFlagRepository"),

  // Foundation Repositories
  ILifecycleModelRepository: Symbol.for("ILifecycleModelRepository"),
  ILifecycleStateRepository: Symbol.for("ILifecycleStateRepository"),
  ILifecycleTransitionRepository: Symbol.for("ILifecycleTransitionRepository"),
  IVendorRepository: Symbol.for("IVendorRepository"),
  IVendorContactRepository: Symbol.for("IVendorContactRepository"),
  IOrganizationUnitRepository: Symbol.for("IOrganizationUnitRepository"),
  ILocationRepository: Symbol.for("ILocationRepository"),
  IPersonRepository: Symbol.for("IPersonRepository"),
  IPersonRoleAssignmentRepository: Symbol.for(
    "IPersonRoleAssignmentRepository",
  ),
  IFieldDefinitionRepository: Symbol.for("IFieldDefinitionRepository"),
  IExchangeRateRepository: Symbol.for("IExchangeRateRepository"),

  // Disposal Repositories
  IAssetDisposalRepository: Symbol.for("IAssetDisposalRepository"),
  IDisposalApprovalRepository: Symbol.for("IDisposalApprovalRepository"),
  IDisposalDocumentRepository: Symbol.for("IDisposalDocumentRepository"),

  // Asset Kits Repositories
  IAssetKitRepository: Symbol.for("IAssetKitRepository"),
  IAssetKitItemRepository: Symbol.for("IAssetKitItemRepository"),
  IAssetKitCheckoutRepository: Symbol.for("IAssetKitCheckoutRepository"),
  IAssetKitCheckoutItemRepository: Symbol.for(
    "IAssetKitCheckoutItemRepository",
  ),

  // Reservation Repositories
  IAssetReservationRepository: Symbol.for("IAssetReservationRepository"),
  IAssetReservationConflictRepository: Symbol.for(
    "IAssetReservationConflictRepository",
  ),

  // CMDB Repositories
  ICIClassRepository: Symbol.for("ICIClassRepository"),
  ICIClassFieldRepository: Symbol.for("ICIClassFieldRepository"),
  IConfigurationItemRepository: Symbol.for("IConfigurationItemRepository"),
  ICIRelationshipRepository: Symbol.for("ICIRelationshipRepository"),
  IRelationshipTypeRepository: Symbol.for("IRelationshipTypeRepository"),
  IRelationshipTypeScopeRepository: Symbol.for(
    "IRelationshipTypeScopeRepository",
  ),

  // Contracts Repositories
  IContractTypeRepository: Symbol.for("IContractTypeRepository"),
  IContractRepository: Symbol.for("IContractRepository"),
  IContractLinkedObjectRepository: Symbol.for(
    "IContractLinkedObjectRepository",
  ),

  // Licenses Repositories
  ILicenseProductRepository: Symbol.for("ILicenseProductRepository"),
  ILicenseProductFieldRepository: Symbol.for("ILicenseProductFieldRepository"),

  // Service Management Repositories
  IServiceRepository: Symbol.for("IServiceRepository"),
  IBusinessProcessRepository: Symbol.for("IBusinessProcessRepository"),
  IServiceInfrastructureRepository: Symbol.for(
    "IServiceInfrastructureRepository",
  ),
  ISearchRepository: Symbol.for("ISearchRepository"),

  // ==========================================
  // Service Tokens
  // ==========================================

  /**
   * Token for ILoggerService
   * Provides structured logging throughout the application
   */
  ILoggerService: Symbol.for("ILoggerService"),

  /**
   * Token for IAIContentGeneratorService
   * Handles AI-powered content generation using OpenAI models
   */
  IAIContentGeneratorService: Symbol.for("IAIContentGeneratorService"),

  /**
   * Token for IAIPromptManagerService
   * Manages AI prompt templates and extended caching (24-hour)
   */
  IAIPromptManagerService: Symbol.for("IAIPromptManagerService"),

  /**
   * Token for IAIDebugTraceService
   * Provides debug tracing for AI operations (when AI_DEBUG_MODE=true)
   */
  IAIDebugTraceService: Symbol.for("IAIDebugTraceService"),

  /**
   * Token for IFileStorageService
   * Provides file system operations for debug artifacts and other files
   */
  IFileStorageService: Symbol.for("IFileStorageService"),

  /**
   * Token for ICSVService
   * Handles CSV import/export with validation
   */
  ICSVService: Symbol.for("ICSVService"),

  /**
   * Token for ISSEService
   * Provides Server-Sent Events (SSE) streaming capabilities
   */
  ISSEService: Symbol.for("ISSEService"),

  /**
   * Token for IRealtimeService
   * Provides WebSocket-based real-time communication (Partykit)
   */
  IRealtimeService: Symbol.for("IRealtimeService"),

  /**
   * Token for IJobQueueService
   * Provides background job processing with BullMQ and Redis
   */
  IJobQueueService: Symbol.for("IJobQueueService"),

  /**
   * Token for IEmailService
   * Provides email sending capabilities
   */
  IEmailService: Symbol.for("IEmailService"),

  /**
   * Token for ICodeGeneratorService
   * Provides auto-generation of unique codes and tags for entities
   */
  ICodeGeneratorService: Symbol.for("ICodeGeneratorService"),

  // ==========================================
  // Use Case Tokens (Example)
  // ==========================================

  // Task Use Cases (Example CRUD)
  CreateTaskUseCase: Symbol.for("CreateTaskUseCase"),
  ListTasksUseCase: Symbol.for("ListTasksUseCase"),
  GetTaskUseCase: Symbol.for("GetTaskUseCase"),
  UpdateTaskUseCase: Symbol.for("UpdateTaskUseCase"),
  DeleteTaskUseCase: Symbol.for("DeleteTaskUseCase"),
  CompleteTaskUseCase: Symbol.for("CompleteTaskUseCase"),
  ScheduleTaskReminderUseCase: Symbol.for("ScheduleTaskReminderUseCase"),

  // Real-time Use Cases
  BroadcastTaskEventUseCase: Symbol.for("BroadcastTaskEventUseCase"),

  // Search Use Cases
  GlobalSearchUseCase: Symbol.for("GlobalSearchUseCase"),

  // RBAC Use Cases
  CheckPermissionUseCase: Symbol.for("CheckPermissionUseCase"),
  CreateRoleUseCase: Symbol.for("CreateRoleUseCase"),
  UpdateRoleUseCase: Symbol.for("UpdateRoleUseCase"),
  DeleteRoleUseCase: Symbol.for("DeleteRoleUseCase"),
  GetRoleUseCase: Symbol.for("GetRoleUseCase"),
  ListRolesUseCase: Symbol.for("ListRolesUseCase"),
  AssignPermissionsToRoleUseCase: Symbol.for("AssignPermissionsToRoleUseCase"),
  CreatePermissionUseCase: Symbol.for("CreatePermissionUseCase"),
  UpdatePermissionUseCase: Symbol.for("UpdatePermissionUseCase"),
  DeletePermissionUseCase: Symbol.for("DeletePermissionUseCase"),
  GetPermissionUseCase: Symbol.for("GetPermissionUseCase"),
  ListPermissionsUseCase: Symbol.for("ListPermissionsUseCase"),
  AssignRoleToUserUseCase: Symbol.for("AssignRoleToUserUseCase"),
  RevokeRoleFromUserUseCase: Symbol.for("RevokeRoleFromUserUseCase"),
  GetUserPermissionsUseCase: Symbol.for("GetUserPermissionsUseCase"),
  GetUserRolesUseCase: Symbol.for("GetUserRolesUseCase"),
  GetRoleUsersUseCase: Symbol.for("GetRoleUsersUseCase"),
  CheckFirstAdminUseCase: Symbol.for("CheckFirstAdminUseCase"),
  AssignFirstAdminUseCase: Symbol.for("AssignFirstAdminUseCase"),

  // User Provisioning Use Cases
  CreateUserForPersonUseCase: Symbol.for("CreateUserForPersonUseCase"),
  ResetUserPasswordUseCase: Symbol.for("ResetUserPasswordUseCase"),

  // System Setup Use Cases
  CheckSystemHealthUseCase: Symbol.for("CheckSystemHealthUseCase"),
  GetMigrationStatusUseCase: Symbol.for("GetMigrationStatusUseCase"),
  SeedMinimalDataUseCase: Symbol.for("SeedMinimalDataUseCase"),
  ResetDatabaseUseCase: Symbol.for("ResetDatabaseUseCase"),
  GetSystemInfoUseCase: Symbol.for("GetSystemInfoUseCase"),

  // Feature Flags Use Cases
  ListFeatureFlagsUseCase: Symbol.for("ListFeatureFlagsUseCase"),
  GetFeatureFlagUseCase: Symbol.for("GetFeatureFlagUseCase"),
  ToggleFeatureFlagUseCase: Symbol.for("ToggleFeatureFlagUseCase"),
  CheckFeatureEnabledUseCase: Symbol.for("CheckFeatureEnabledUseCase"),

  // RBAC Analytics Use Cases
  GetRoleUsageStatsUseCase: Symbol.for("GetRoleUsageStatsUseCase"),
  GetPermissionUsageStatsUseCase: Symbol.for("GetPermissionUsageStatsUseCase"),
  GetUserRoleStatsUseCase: Symbol.for("GetUserRoleStatsUseCase"),

  // Audit Log Use Cases
  ListAuditLogsUseCase: Symbol.for("ListAuditLogsUseCase"),
  CountAuditLogsUseCase: Symbol.for("CountAuditLogsUseCase"),

  // Foundation: Lifecycle Model Use Cases
  CreateLifecycleModelUseCase: Symbol.for("CreateLifecycleModelUseCase"),
  GetLifecycleModelUseCase: Symbol.for("GetLifecycleModelUseCase"),
  ListLifecycleModelsUseCase: Symbol.for("ListLifecycleModelsUseCase"),
  UpdateLifecycleModelUseCase: Symbol.for("UpdateLifecycleModelUseCase"),
  DeleteLifecycleModelUseCase: Symbol.for("DeleteLifecycleModelUseCase"),

  // Foundation: Lifecycle State Use Cases
  CreateLifecycleStateUseCase: Symbol.for("CreateLifecycleStateUseCase"),
  GetLifecycleStateUseCase: Symbol.for("GetLifecycleStateUseCase"),
  ListLifecycleStatesUseCase: Symbol.for("ListLifecycleStatesUseCase"),
  UpdateLifecycleStateUseCase: Symbol.for("UpdateLifecycleStateUseCase"),
  DeleteLifecycleStateUseCase: Symbol.for("DeleteLifecycleStateUseCase"),

  // Foundation: Lifecycle Transition Use Cases
  CreateLifecycleTransitionUseCase: Symbol.for(
    "CreateLifecycleTransitionUseCase",
  ),
  GetLifecycleTransitionUseCase: Symbol.for("GetLifecycleTransitionUseCase"),
  ListLifecycleTransitionsUseCase: Symbol.for(
    "ListLifecycleTransitionsUseCase",
  ),
  UpdateLifecycleTransitionUseCase: Symbol.for(
    "UpdateLifecycleTransitionUseCase",
  ),
  DeleteLifecycleTransitionUseCase: Symbol.for(
    "DeleteLifecycleTransitionUseCase",
  ),

  // Foundation: Vendor Use Cases
  CreateVendorUseCase: Symbol.for("CreateVendorUseCase"),
  GetVendorUseCase: Symbol.for("GetVendorUseCase"),
  ListVendorsUseCase: Symbol.for("ListVendorsUseCase"),
  UpdateVendorUseCase: Symbol.for("UpdateVendorUseCase"),
  DeleteVendorUseCase: Symbol.for("DeleteVendorUseCase"),

  // Foundation: Vendor Contact Use Cases
  CreateVendorContactUseCase: Symbol.for("CreateVendorContactUseCase"),
  GetVendorContactUseCase: Symbol.for("GetVendorContactUseCase"),
  ListVendorContactsUseCase: Symbol.for("ListVendorContactsUseCase"),
  UpdateVendorContactUseCase: Symbol.for("UpdateVendorContactUseCase"),
  DeleteVendorContactUseCase: Symbol.for("DeleteVendorContactUseCase"),

  // Foundation: Organization Unit Use Cases
  CreateOrganizationUnitUseCase: Symbol.for("CreateOrganizationUnitUseCase"),
  GetOrganizationUnitUseCase: Symbol.for("GetOrganizationUnitUseCase"),
  ListOrganizationUnitsUseCase: Symbol.for("ListOrganizationUnitsUseCase"),
  UpdateOrganizationUnitUseCase: Symbol.for("UpdateOrganizationUnitUseCase"),
  DeleteOrganizationUnitUseCase: Symbol.for("DeleteOrganizationUnitUseCase"),

  // Foundation: Location Use Cases
  CreateLocationUseCase: Symbol.for("CreateLocationUseCase"),
  GetLocationUseCase: Symbol.for("GetLocationUseCase"),
  ListLocationsUseCase: Symbol.for("ListLocationsUseCase"),
  UpdateLocationUseCase: Symbol.for("UpdateLocationUseCase"),
  DeleteLocationUseCase: Symbol.for("DeleteLocationUseCase"),

  // Foundation: Person Use Cases
  CreatePersonUseCase: Symbol.for("CreatePersonUseCase"),
  GetPersonUseCase: Symbol.for("GetPersonUseCase"),
  ListPersonsUseCase: Symbol.for("ListPersonsUseCase"),
  UpdatePersonUseCase: Symbol.for("UpdatePersonUseCase"),
  DeletePersonUseCase: Symbol.for("DeletePersonUseCase"),
  DeletePersonWithConfirmationUseCase: Symbol.for(
    "DeletePersonWithConfirmationUseCase",
  ),

  // Foundation: Person Role Assignment Use Cases
  CreatePersonRoleAssignmentUseCase: Symbol.for(
    "CreatePersonRoleAssignmentUseCase",
  ),
  GetPersonRoleAssignmentUseCase: Symbol.for("GetPersonRoleAssignmentUseCase"),
  ListPersonRoleAssignmentsUseCase: Symbol.for(
    "ListPersonRoleAssignmentsUseCase",
  ),
  UpdatePersonRoleAssignmentUseCase: Symbol.for(
    "UpdatePersonRoleAssignmentUseCase",
  ),
  DeletePersonRoleAssignmentUseCase: Symbol.for(
    "DeletePersonRoleAssignmentUseCase",
  ),

  // Foundation: Field Definition Use Cases
  CreateFieldDefinitionUseCase: Symbol.for("CreateFieldDefinitionUseCase"),
  GetFieldDefinitionUseCase: Symbol.for("GetFieldDefinitionUseCase"),
  ListFieldDefinitionsUseCase: Symbol.for("ListFieldDefinitionsUseCase"),
  UpdateFieldDefinitionUseCase: Symbol.for("UpdateFieldDefinitionUseCase"),
  DeleteFieldDefinitionUseCase: Symbol.for("DeleteFieldDefinitionUseCase"),

  // Foundation: Exchange Rate Use Cases
  CreateExchangeRateUseCase: Symbol.for("CreateExchangeRateUseCase"),
  GetExchangeRateUseCase: Symbol.for("GetExchangeRateUseCase"),
  ListExchangeRatesUseCase: Symbol.for("ListExchangeRatesUseCase"),
  UpdateExchangeRateUseCase: Symbol.for("UpdateExchangeRateUseCase"),
  DeleteExchangeRateUseCase: Symbol.for("DeleteExchangeRateUseCase"),
  ConvertCurrencyUseCase: Symbol.for("ConvertCurrencyUseCase"),

  // Disposal Workflow Use Cases
  CreateAssetDisposalUseCase: Symbol.for("CreateAssetDisposalUseCase"),
  GetAssetDisposalUseCase: Symbol.for("GetAssetDisposalUseCase"),
  ListAssetDisposalsUseCase: Symbol.for("ListAssetDisposalsUseCase"),
  ApproveDisposalUseCase: Symbol.for("ApproveDisposalUseCase"),
  RejectDisposalUseCase: Symbol.for("RejectDisposalUseCase"),
  StartDisposalUseCase: Symbol.for("StartDisposalUseCase"),
  CompleteSanitizationUseCase: Symbol.for("CompleteSanitizationUseCase"),
  CompleteDisposalUseCase: Symbol.for("CompleteDisposalUseCase"),
  GenerateCertificateUseCase: Symbol.for("GenerateCertificateUseCase"),
  GenerateDisposalCertificatePDFUseCase: Symbol.for(
    "GenerateDisposalCertificatePDFUseCase",
  ),
  CancelDisposalUseCase: Symbol.for("CancelDisposalUseCase"),
  DeleteAssetDisposalUseCase: Symbol.for("DeleteAssetDisposalUseCase"),

  // Asset Kits: Kit Management Use Cases
  CreateAssetKitUseCase: Symbol.for("CreateAssetKitUseCase"),
  GetAssetKitUseCase: Symbol.for("GetAssetKitUseCase"),
  ListAssetKitsUseCase: Symbol.for("ListAssetKitsUseCase"),
  UpdateAssetKitUseCase: Symbol.for("UpdateAssetKitUseCase"),
  DeleteAssetKitUseCase: Symbol.for("DeleteAssetKitUseCase"),
  AddKitItemUseCase: Symbol.for("AddKitItemUseCase"),
  RemoveKitItemUseCase: Symbol.for("RemoveKitItemUseCase"),
  UpdateKitItemUseCase: Symbol.for("UpdateKitItemUseCase"),

  // Asset Kits: Kit Checkout Use Cases
  CreateKitCheckoutUseCase: Symbol.for("CreateKitCheckoutUseCase"),
  GetKitCheckoutUseCase: Symbol.for("GetKitCheckoutUseCase"),
  ListKitCheckoutsUseCase: Symbol.for("ListKitCheckoutsUseCase"),
  ReturnKitCheckoutUseCase: Symbol.for("ReturnKitCheckoutUseCase"),
  ReturnKitItemUseCase: Symbol.for("ReturnKitItemUseCase"),
  MarkItemDamagedUseCase: Symbol.for("MarkItemDamagedUseCase"),
  MarkItemLostUseCase: Symbol.for("MarkItemLostUseCase"),
  ExtendCheckoutUseCase: Symbol.for("ExtendCheckoutUseCase"),
  ListOverdueCheckoutsUseCase: Symbol.for("ListOverdueCheckoutsUseCase"),
  CheckKitAvailabilityUseCase: Symbol.for("CheckKitAvailabilityUseCase"),

  // Asset Reservations: Reservation Management Use Cases
  CreateReservationUseCase: Symbol.for("CreateReservationUseCase"),
  GetReservationUseCase: Symbol.for("GetReservationUseCase"),
  ListReservationsUseCase: Symbol.for("ListReservationsUseCase"),
  UpdateReservationUseCase: Symbol.for("UpdateReservationUseCase"),
  CancelReservationUseCase: Symbol.for("CancelReservationUseCase"),
  ConfirmReservationUseCase: Symbol.for("ConfirmReservationUseCase"),
  StartReservationUseCase: Symbol.for("StartReservationUseCase"),
  CompleteReservationUseCase: Symbol.for("CompleteReservationUseCase"),

  // Asset Reservations: Conflict Management Use Cases
  DetectConflictsUseCase: Symbol.for("DetectConflictsUseCase"),
  ResolveConflictUseCase: Symbol.for("ResolveConflictUseCase"),
  ListConflictsUseCase: Symbol.for("ListConflictsUseCase"),

  // Asset Reservations: Availability Use Cases
  CheckAvailabilityUseCase: Symbol.for("CheckAvailabilityUseCase"),
  ListAvailableAssetsUseCase: Symbol.for("ListAvailableAssetsUseCase"),

  // Asset Reservations: Background Job Use Cases
  ActivateReadyReservationsUseCase: Symbol.for(
    "ActivateReadyReservationsUseCase",
  ),
  CompleteExpiredReservationsUseCase: Symbol.for(
    "CompleteExpiredReservationsUseCase",
  ),
  SendReminderNotificationsUseCase: Symbol.for(
    "SendReminderNotificationsUseCase",
  ),

  // CMDB: CI Class Use Cases
  CreateCIClassUseCase: Symbol.for("CreateCIClassUseCase"),
  GetCIClassUseCase: Symbol.for("GetCIClassUseCase"),
  ListCIClassesUseCase: Symbol.for("ListCIClassesUseCase"),
  UpdateCIClassUseCase: Symbol.for("UpdateCIClassUseCase"),
  DeleteCIClassUseCase: Symbol.for("DeleteCIClassUseCase"),

  // CMDB: CI Class Field Use Cases
  CreateCIClassFieldUseCase: Symbol.for("CreateCIClassFieldUseCase"),
  GetCIClassFieldUseCase: Symbol.for("GetCIClassFieldUseCase"),
  ListCIClassFieldsUseCase: Symbol.for("ListCIClassFieldsUseCase"),
  UpdateCIClassFieldUseCase: Symbol.for("UpdateCIClassFieldUseCase"),
  DeleteCIClassFieldUseCase: Symbol.for("DeleteCIClassFieldUseCase"),

  // CMDB: Configuration Item Use Cases
  CreateConfigurationItemUseCase: Symbol.for("CreateConfigurationItemUseCase"),
  GetConfigurationItemUseCase: Symbol.for("GetConfigurationItemUseCase"),
  ListConfigurationItemsUseCase: Symbol.for("ListConfigurationItemsUseCase"),
  UpdateConfigurationItemUseCase: Symbol.for("UpdateConfigurationItemUseCase"),
  DeleteConfigurationItemUseCase: Symbol.for("DeleteConfigurationItemUseCase"),
  DeleteCIWithConfirmationUseCase: Symbol.for(
    "DeleteCIWithConfirmationUseCase",
  ),

  // CMDB: CI Relationship Use Cases
  CreateCIRelationshipUseCase: Symbol.for("CreateCIRelationshipUseCase"),
  GetCIRelationshipUseCase: Symbol.for("GetCIRelationshipUseCase"),
  ListCIRelationshipsUseCase: Symbol.for("ListCIRelationshipsUseCase"),
  UpdateCIRelationshipUseCase: Symbol.for("UpdateCIRelationshipUseCase"),
  DeleteCIRelationshipUseCase: Symbol.for("DeleteCIRelationshipUseCase"),

  // CMDB: Relationship Type Use Cases
  CreateRelationshipTypeUseCase: Symbol.for("CreateRelationshipTypeUseCase"),
  GetRelationshipTypeUseCase: Symbol.for("GetRelationshipTypeUseCase"),
  ListRelationshipTypesUseCase: Symbol.for("ListRelationshipTypesUseCase"),
  UpdateRelationshipTypeUseCase: Symbol.for("UpdateRelationshipTypeUseCase"),
  DeleteRelationshipTypeUseCase: Symbol.for("DeleteRelationshipTypeUseCase"),

  // CMDB: Relationship Type Scope Use Cases
  CreateRelationshipTypeScopeUseCase: Symbol.for(
    "CreateRelationshipTypeScopeUseCase",
  ),
  GetRelationshipTypeScopeUseCase: Symbol.for(
    "GetRelationshipTypeScopeUseCase",
  ),
  ListRelationshipTypeScopesUseCase: Symbol.for(
    "ListRelationshipTypeScopesUseCase",
  ),
  UpdateRelationshipTypeScopeUseCase: Symbol.for(
    "UpdateRelationshipTypeScopeUseCase",
  ),
  DeleteRelationshipTypeScopeUseCase: Symbol.for(
    "DeleteRelationshipTypeScopeUseCase",
  ),

  // Contracts: Contract Type Use Cases
  CreateContractTypeUseCase: Symbol.for("CreateContractTypeUseCase"),
  GetContractTypeUseCase: Symbol.for("GetContractTypeUseCase"),
  ListContractTypesUseCase: Symbol.for("ListContractTypesUseCase"),
  UpdateContractTypeUseCase: Symbol.for("UpdateContractTypeUseCase"),
  DeleteContractTypeUseCase: Symbol.for("DeleteContractTypeUseCase"),

  // Contracts: Contract Use Cases
  CreateContractUseCase: Symbol.for("CreateContractUseCase"),
  GetContractUseCase: Symbol.for("GetContractUseCase"),
  ListContractsUseCase: Symbol.for("ListContractsUseCase"),
  UpdateContractUseCase: Symbol.for("UpdateContractUseCase"),
  DeleteContractUseCase: Symbol.for("DeleteContractUseCase"),

  // Contracts: Contract Linked Object Use Cases
  CreateContractLinkedObjectUseCase: Symbol.for(
    "CreateContractLinkedObjectUseCase",
  ),
  GetContractLinkedObjectUseCase: Symbol.for("GetContractLinkedObjectUseCase"),
  ListContractLinkedObjectsUseCase: Symbol.for(
    "ListContractLinkedObjectsUseCase",
  ),
  UpdateContractLinkedObjectUseCase: Symbol.for(
    "UpdateContractLinkedObjectUseCase",
  ),
  DeleteContractLinkedObjectUseCase: Symbol.for(
    "DeleteContractLinkedObjectUseCase",
  ),

  // Licenses: License Product Use Cases
  CreateLicenseProductUseCase: Symbol.for("CreateLicenseProductUseCase"),
  GetLicenseProductUseCase: Symbol.for("GetLicenseProductUseCase"),
  ListLicenseProductsUseCase: Symbol.for("ListLicenseProductsUseCase"),
  UpdateLicenseProductUseCase: Symbol.for("UpdateLicenseProductUseCase"),
  DeleteLicenseProductUseCase: Symbol.for("DeleteLicenseProductUseCase"),

  // Licenses: License Product Field Use Cases
  CreateLicenseProductFieldUseCase: Symbol.for(
    "CreateLicenseProductFieldUseCase",
  ),
  GetLicenseProductFieldUseCase: Symbol.for("GetLicenseProductFieldUseCase"),
  ListLicenseProductFieldsUseCase: Symbol.for(
    "ListLicenseProductFieldsUseCase",
  ),
  UpdateLicenseProductFieldUseCase: Symbol.for(
    "UpdateLicenseProductFieldUseCase",
  ),
  DeleteLicenseProductFieldUseCase: Symbol.for(
    "DeleteLicenseProductFieldUseCase",
  ),

  // Licenses: License Entitlement Repository
  ILicenseEntitlementRepository: Symbol.for("ILicenseEntitlementRepository"),

  // Licenses: License Entitlement Use Cases
  CreateLicenseEntitlementUseCase: Symbol.for(
    "CreateLicenseEntitlementUseCase",
  ),
  GetLicenseEntitlementUseCase: Symbol.for("GetLicenseEntitlementUseCase"),
  ListLicenseEntitlementsUseCase: Symbol.for("ListLicenseEntitlementsUseCase"),
  UpdateLicenseEntitlementUseCase: Symbol.for(
    "UpdateLicenseEntitlementUseCase",
  ),
  DeleteLicenseEntitlementUseCase: Symbol.for(
    "DeleteLicenseEntitlementUseCase",
  ),

  // Licenses: License Allocation Repository
  ILicenseAllocationRepository: Symbol.for("ILicenseAllocationRepository"),

  // Licenses: License Allocation Use Cases
  CreateLicenseAllocationUseCase: Symbol.for("CreateLicenseAllocationUseCase"),
  GetLicenseAllocationUseCase: Symbol.for("GetLicenseAllocationUseCase"),
  ListLicenseAllocationsUseCase: Symbol.for("ListLicenseAllocationsUseCase"),
  UpdateLicenseAllocationUseCase: Symbol.for("UpdateLicenseAllocationUseCase"),
  DeleteLicenseAllocationUseCase: Symbol.for("DeleteLicenseAllocationUseCase"),
  DeallocateLicenseAllocationUseCase: Symbol.for(
    "DeallocateLicenseAllocationUseCase",
  ),
  ReactivateLicenseAllocationUseCase: Symbol.for(
    "ReactivateLicenseAllocationUseCase",
  ),

  // ==========================================
  // Governance Module Tokens
  // ==========================================

  // Governance: Data Domain Repository
  IDataDomainRepository: Symbol.for("IDataDomainRepository"),

  // Governance: Data Domain Use Cases
  CreateDataDomainUseCase: Symbol.for("CreateDataDomainUseCase"),
  GetDataDomainUseCase: Symbol.for("GetDataDomainUseCase"),
  ListDataDomainsUseCase: Symbol.for("ListDataDomainsUseCase"),
  UpdateDataDomainUseCase: Symbol.for("UpdateDataDomainUseCase"),
  DeleteDataDomainUseCase: Symbol.for("DeleteDataDomainUseCase"),

  // Governance: Data Ownership Repository
  IDataOwnershipRepository: Symbol.for("IDataOwnershipRepository"),

  // Governance: Data Ownership Use Cases
  CreateDataOwnershipUseCase: Symbol.for("CreateDataOwnershipUseCase"),
  GetDataOwnershipUseCase: Symbol.for("GetDataOwnershipUseCase"),
  ListDataOwnershipsUseCase: Symbol.for("ListDataOwnershipsUseCase"),
  UpdateDataOwnershipUseCase: Symbol.for("UpdateDataOwnershipUseCase"),
  DeleteDataOwnershipUseCase: Symbol.for("DeleteDataOwnershipUseCase"),

  // Governance: Verification Campaign Repository
  IVerificationCampaignRepository: Symbol.for(
    "IVerificationCampaignRepository",
  ),

  // Governance: Verification Campaign Use Cases
  CreateVerificationCampaignUseCase: Symbol.for(
    "CreateVerificationCampaignUseCase",
  ),
  GetVerificationCampaignUseCase: Symbol.for("GetVerificationCampaignUseCase"),
  ListVerificationCampaignsUseCase: Symbol.for(
    "ListVerificationCampaignsUseCase",
  ),
  UpdateVerificationCampaignUseCase: Symbol.for(
    "UpdateVerificationCampaignUseCase",
  ),
  DeleteVerificationCampaignUseCase: Symbol.for(
    "DeleteVerificationCampaignUseCase",
  ),
  StartVerificationCampaignUseCase: Symbol.for(
    "StartVerificationCampaignUseCase",
  ),
  CompleteVerificationCampaignUseCase: Symbol.for(
    "CompleteVerificationCampaignUseCase",
  ),

  // Governance: Verification Item Repository
  IVerificationItemRepository: Symbol.for("IVerificationItemRepository"),

  // Governance: Verification Item Use Cases
  CreateVerificationItemUseCase: Symbol.for("CreateVerificationItemUseCase"),
  GetVerificationItemUseCase: Symbol.for("GetVerificationItemUseCase"),
  ListVerificationItemsUseCase: Symbol.for("ListVerificationItemsUseCase"),
  UpdateVerificationItemUseCase: Symbol.for("UpdateVerificationItemUseCase"),
  DeleteVerificationItemUseCase: Symbol.for("DeleteVerificationItemUseCase"),
  VerifyVerificationItemUseCase: Symbol.for("VerifyVerificationItemUseCase"),
  FlagExceptionVerificationItemUseCase: Symbol.for(
    "FlagExceptionVerificationItemUseCase",
  ),

  // ==========================================
  // Attachments Module Tokens
  // ==========================================

  // Attachments: AttachmentType Repository
  IAttachmentTypeRepository: Symbol.for("IAttachmentTypeRepository"),

  // Attachments: AttachmentType Use Cases
  CreateAttachmentTypeUseCase: Symbol.for("CreateAttachmentTypeUseCase"),
  GetAttachmentTypeUseCase: Symbol.for("GetAttachmentTypeUseCase"),
  ListAttachmentTypesUseCase: Symbol.for("ListAttachmentTypesUseCase"),
  UpdateAttachmentTypeUseCase: Symbol.for("UpdateAttachmentTypeUseCase"),
  DeleteAttachmentTypeUseCase: Symbol.for("DeleteAttachmentTypeUseCase"),

  // Assets: Asset Category Repository
  IAssetCategoryRepository: Symbol.for("IAssetCategoryRepository"),
  IAssetCategoryFieldRepository: Symbol.for("IAssetCategoryFieldRepository"),

  // Assets: Asset Category Use Cases
  CreateAssetCategoryUseCase: Symbol.for("CreateAssetCategoryUseCase"),
  GetAssetCategoryUseCase: Symbol.for("GetAssetCategoryUseCase"),
  ListAssetCategoriesUseCase: Symbol.for("ListAssetCategoriesUseCase"),
  UpdateAssetCategoryUseCase: Symbol.for("UpdateAssetCategoryUseCase"),
  DeleteAssetCategoryUseCase: Symbol.for("DeleteAssetCategoryUseCase"),

  // Assets: Asset Category Field Use Cases
  CreateAssetCategoryFieldUseCase: Symbol.for(
    "CreateAssetCategoryFieldUseCase",
  ),
  GetAssetCategoryFieldUseCase: Symbol.for("GetAssetCategoryFieldUseCase"),
  ListAssetCategoryFieldsUseCase: Symbol.for("ListAssetCategoryFieldsUseCase"),
  UpdateAssetCategoryFieldUseCase: Symbol.for(
    "UpdateAssetCategoryFieldUseCase",
  ),
  DeleteAssetCategoryFieldUseCase: Symbol.for(
    "DeleteAssetCategoryFieldUseCase",
  ),

  // Assets: Asset Model Repository
  IAssetModelRepository: Symbol.for("IAssetModelRepository"),

  // Assets: Asset Model Use Cases
  CreateAssetModelUseCase: Symbol.for("CreateAssetModelUseCase"),
  GetAssetModelUseCase: Symbol.for("GetAssetModelUseCase"),
  ListAssetModelsUseCase: Symbol.for("ListAssetModelsUseCase"),
  UpdateAssetModelUseCase: Symbol.for("UpdateAssetModelUseCase"),
  DeleteAssetModelUseCase: Symbol.for("DeleteAssetModelUseCase"),

  // Assets: Asset Repository
  IAssetRepository: Symbol.for("IAssetRepository"),

  // Assets: Asset Use Cases
  CreateAssetUseCase: Symbol.for("CreateAssetUseCase"),
  GetAssetUseCase: Symbol.for("GetAssetUseCase"),
  ListAssetsUseCase: Symbol.for("ListAssetsUseCase"),
  UpdateAssetUseCase: Symbol.for("UpdateAssetUseCase"),
  DeleteAssetUseCase: Symbol.for("DeleteAssetUseCase"),
  DeleteAssetWithConfirmationUseCase: Symbol.for(
    "DeleteAssetWithConfirmationUseCase",
  ),

  // Assets: Asset Assignment Repository
  IAssetAssignmentRepository: Symbol.for("IAssetAssignmentRepository"),

  // Assets: Asset Assignment Use Cases
  CreateAssetAssignmentUseCase: Symbol.for("CreateAssetAssignmentUseCase"),
  GetAssetAssignmentUseCase: Symbol.for("GetAssetAssignmentUseCase"),
  ListAssetAssignmentsUseCase: Symbol.for("ListAssetAssignmentsUseCase"),
  UpdateAssetAssignmentUseCase: Symbol.for("UpdateAssetAssignmentUseCase"),
  DeleteAssetAssignmentUseCase: Symbol.for("DeleteAssetAssignmentUseCase"),

  // Assets: Warranty Repository
  IWarrantyRepository: Symbol.for("IWarrantyRepository"),

  // Assets: Warranty Use Cases
  CreateWarrantyUseCase: Symbol.for("CreateWarrantyUseCase"),
  GetWarrantyUseCase: Symbol.for("GetWarrantyUseCase"),
  ListWarrantiesUseCase: Symbol.for("ListWarrantiesUseCase"),
  UpdateWarrantyUseCase: Symbol.for("UpdateWarrantyUseCase"),
  DeleteWarrantyUseCase: Symbol.for("DeleteWarrantyUseCase"),
  ListWarrantiesByAssetUseCase: Symbol.for("ListWarrantiesByAssetUseCase"),
  GetActiveWarrantyForAssetUseCase: Symbol.for(
    "GetActiveWarrantyForAssetUseCase",
  ),
  ListExpiringWarrantiesUseCase: Symbol.for("ListExpiringWarrantiesUseCase"),
  CheckWarrantyExpirationUseCase: Symbol.for("CheckWarrantyExpirationUseCase"),

  // Inventory: Stock Location Repository
  IStockLocationRepository: Symbol.for("IStockLocationRepository"),

  // Inventory: Stock Location Use Cases
  CreateStockLocationUseCase: Symbol.for("CreateStockLocationUseCase"),
  GetStockLocationUseCase: Symbol.for("GetStockLocationUseCase"),
  ListStockLocationsUseCase: Symbol.for("ListStockLocationsUseCase"),
  UpdateStockLocationUseCase: Symbol.for("UpdateStockLocationUseCase"),
  DeleteStockLocationUseCase: Symbol.for("DeleteStockLocationUseCase"),

  // Inventory: Stock Movement Repository
  IStockMovementRepository: Symbol.for("IStockMovementRepository"),

  // Inventory: Stock Movement Use Cases
  CreateStockMovementUseCase: Symbol.for("CreateStockMovementUseCase"),
  GetStockMovementUseCase: Symbol.for("GetStockMovementUseCase"),
  ListStockMovementsUseCase: Symbol.for("ListStockMovementsUseCase"),
  DeleteStockMovementUseCase: Symbol.for("DeleteStockMovementUseCase"),

  // Maintenance: Schedule Repository
  IMaintenanceScheduleRepository: Symbol.for("IMaintenanceScheduleRepository"),

  // Maintenance: Schedule Use Cases
  CreateMaintenanceScheduleUseCase: Symbol.for(
    "CreateMaintenanceScheduleUseCase",
  ),
  GetMaintenanceScheduleUseCase: Symbol.for("GetMaintenanceScheduleUseCase"),
  ListMaintenanceSchedulesUseCase: Symbol.for(
    "ListMaintenanceSchedulesUseCase",
  ),
  UpdateMaintenanceScheduleUseCase: Symbol.for(
    "UpdateMaintenanceScheduleUseCase",
  ),
  DeleteMaintenanceScheduleUseCase: Symbol.for(
    "DeleteMaintenanceScheduleUseCase",
  ),

  // Maintenance: Record Repository
  IMaintenanceRecordRepository: Symbol.for("IMaintenanceRecordRepository"),

  // Maintenance: Record Use Cases
  CreateMaintenanceRecordUseCase: Symbol.for("CreateMaintenanceRecordUseCase"),
  GetMaintenanceRecordUseCase: Symbol.for("GetMaintenanceRecordUseCase"),
  ListMaintenanceRecordsUseCase: Symbol.for("ListMaintenanceRecordsUseCase"),
  UpdateMaintenanceRecordUseCase: Symbol.for("UpdateMaintenanceRecordUseCase"),
  DeleteMaintenanceRecordUseCase: Symbol.for("DeleteMaintenanceRecordUseCase"),
  StartMaintenanceUseCase: Symbol.for("StartMaintenanceUseCase"),
  CompleteMaintenanceUseCase: Symbol.for("CompleteMaintenanceUseCase"),
  CancelMaintenanceUseCase: Symbol.for("CancelMaintenanceUseCase"),

  // Service Management: Service Use Cases
  CreateServiceUseCase: Symbol.for("CreateServiceUseCase"),
  GetServiceUseCase: Symbol.for("GetServiceUseCase"),
  ListServicesUseCase: Symbol.for("ListServicesUseCase"),
  UpdateServiceUseCase: Symbol.for("UpdateServiceUseCase"),
  DeleteServiceUseCase: Symbol.for("DeleteServiceUseCase"),
  SearchServicesUseCase: Symbol.for("SearchServicesUseCase"),
  GetEssentialServicesUseCase: Symbol.for("GetEssentialServicesUseCase"),
  GetRetiringServicesUseCase: Symbol.for("GetRetiringServicesUseCase"),
  RetireServiceUseCase: Symbol.for("RetireServiceUseCase"),

  // Service Management: Service Ownership Use Cases
  AddServiceOwnerUseCase: Symbol.for("AddServiceOwnerUseCase"),
  RemoveServiceOwnerUseCase: Symbol.for("RemoveServiceOwnerUseCase"),
  SetPrimaryOwnerUseCase: Symbol.for("SetPrimaryOwnerUseCase"),
  GetServiceOwnersUseCase: Symbol.for("GetServiceOwnersUseCase"),

  // Service Management: Business Process Use Cases
  CreateBusinessProcessUseCase: Symbol.for("CreateBusinessProcessUseCase"),
  GetBusinessProcessUseCase: Symbol.for("GetBusinessProcessUseCase"),
  ListBusinessProcessesUseCase: Symbol.for("ListBusinessProcessesUseCase"),
  UpdateBusinessProcessUseCase: Symbol.for("UpdateBusinessProcessUseCase"),
  DeleteBusinessProcessUseCase: Symbol.for("DeleteBusinessProcessUseCase"),

  // Service Management: Service Infrastructure Use Cases
  CreateServiceInfrastructureUseCase: Symbol.for(
    "CreateServiceInfrastructureUseCase",
  ),
  UpdateServiceInfrastructureUseCase: Symbol.for(
    "UpdateServiceInfrastructureUseCase",
  ),
  GetServiceInfrastructureUseCase: Symbol.for(
    "GetServiceInfrastructureUseCase",
  ),

  // Service Management: Service Asset Use Cases
  LinkServiceToAssetUseCase: Symbol.for("LinkServiceToAssetUseCase"),
  UnlinkServiceFromAssetUseCase: Symbol.for("UnlinkServiceFromAssetUseCase"),
  GetServiceAssetsUseCase: Symbol.for("GetServiceAssetsUseCase"),
  GetAssetServicesUseCase: Symbol.for("GetAssetServicesUseCase"),

  // ==========================================
  // Attachments Module Tokens
  // ==========================================

  // Attachments: Attachment Repository
  IAttachmentRepository: Symbol.for("IAttachmentRepository"),

  // Attachments: Attachment Use Cases
  CreateAttachmentUseCase: Symbol.for("CreateAttachmentUseCase"),
  GetAttachmentUseCase: Symbol.for("GetAttachmentUseCase"),
  ListAttachmentsUseCase: Symbol.for("ListAttachmentsUseCase"),
  GetAttachmentsByTargetUseCase: Symbol.for("GetAttachmentsByTargetUseCase"),
  UpdateAttachmentUseCase: Symbol.for("UpdateAttachmentUseCase"),
  DeleteAttachmentUseCase: Symbol.for("DeleteAttachmentUseCase"),

  // ==========================================
  // Infrastructure Tokens
  // ==========================================

  /**
   * Token for PrismaClient
   * Database client for PostgreSQL access
   */
  PrismaClient: Symbol.for("PrismaClient"),
} as const;

/**
 * Type-safe helper to extract token types
 * This ensures TypeScript autocomplete works when using DI_TOKENS
 */
export type DITokens = typeof DI_TOKENS;

/**
 * Type-safe helper to get the value type for a specific token
 * Example: TokenType<typeof DI_TOKENS.ITaskRepository>
 */
export type TokenType<T extends symbol> = T;
