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
