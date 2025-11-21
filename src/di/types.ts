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
  IAuditLogRepository: Symbol.for("IAuditLogRepository"),

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

  // Assets: Asset Category Repository
  IAssetCategoryRepository: Symbol.for("IAssetCategoryRepository"),

  // Assets: Asset Category Use Cases
  CreateAssetCategoryUseCase: Symbol.for("CreateAssetCategoryUseCase"),
  GetAssetCategoryUseCase: Symbol.for("GetAssetCategoryUseCase"),
  ListAssetCategoriesUseCase: Symbol.for("ListAssetCategoriesUseCase"),
  UpdateAssetCategoryUseCase: Symbol.for("UpdateAssetCategoryUseCase"),
  DeleteAssetCategoryUseCase: Symbol.for("DeleteAssetCategoryUseCase"),

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
