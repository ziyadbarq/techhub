/**
 * Service Interfaces Barrel Export
 *
 * This file exports all service interfaces from the core layer.
 * Services define contracts for infrastructure implementations.
 */

// AI Services
export type { IAIContentGeneratorService } from "./ai-content-generator.service.interface";
export type { IAIPromptManagerService } from "./ai-prompt-manager.service.interface";
export type { IAIDebugTraceService } from "./ai-debug-trace.service.interface";

// File Storage Service
export type { IFileStorageService } from "./file-storage.service.interface";

// Logger Service
export type {
  ILoggerService,
  LogLevel,
  PerformanceTimer,
  AuditLogEntry,
} from "./logger.service.interface";

// CSV Service
export type {
  ICSVService,
  CSVExportOptions,
  CSVImportOptions,
  CSVImportResult,
} from "./csv.service.interface";

// AI Content Generator Types
export type {
  AIGenerationResult,
  OutlineGenerationInput,
  PresentationOutline,
  SlideOutline,
  ClickAnimation,
  SlideContentGenerationInput,
  GeneratedSlide,
  CodeBlockMetadata,
  Diagram,
  SlideTransition,
  ElementAnimation,
  SlideRefinementInput,
  ThemeRecommendation,
  QualityReview,
} from "./ai-content-generator.service.interface";

// Real-time Services
export type {
  ISSEService,
  SSEEvent,
  SSEStreamOptions,
} from "./sse.service.interface";
export type {
  IRealtimeService,
  IRealtimePresenceService,
  RealtimeMessage,
  RoomParticipant,
  RoomInfo,
  PresenceInfo,
  ConnectionState,
} from "./realtime.service.interface";

// RBAC Policy & Permission Cache
export type {
  IRbacPolicyService,
  RoleConflict,
  PermissionDependencyValidation,
} from "./rbac-policy.service.interface";
export type {
  IPermissionCacheService,
  PermissionCacheScope,
} from "./permission-cache.service.interface";
export type {
  ISystemSeederService,
  ResetDatabaseOptions,
  ResetDatabaseResult,
  SeedMinimalDataResult,
} from "./system-seeder.service.interface";
export type {
  IGraphUserMapperService,
  GraphUser,
  TransformGraphUserOptions,
  SyncResult as GraphSyncResult,
} from "./graph-user-mapper.service.interface";
export type {
  IIntuneDeviceMapperService,
  GraphIntuneDevice,
  FetchDevicesOptions as IntuneFetchDevicesOptions,
} from "./intune-device-mapper.service.interface";

// Email Service
export type {
  IEmailService,
  EmailMessage,
  EmailAttachment,
  SendEmailResult,
} from "./email.service.interface";

// Code Generator Service
export type {
  ICodeGeneratorService,
  CodeGenerationOptions,
} from "./code-generator.service.interface";

// Database Backup Service
export type {
  IDatabaseBackupService,
  BackupProgressEvent,
  CreateBackupOptions,
  RestoreBackupOptions,
} from "./database-backup.service.interface";

// Microsoft Graph Service
export type { IMicrosoftGraphService } from "./microsoft-graph.service.interface";
export type {
  FetchUsersOptions,
  GraphManagerResponse,
} from "@/lib/schemas/graph-user.schema";

// Asset Movement Service
export type {
  IAssetMovementService,
  CreateMovementParams,
  SyncAssetLocationParams,
  SyncAssetLocationResult,
  TransactionClient,
} from "./asset-movement.service.interface";

// SAR Conversion Service
export type { ISarConversionService } from "./sar-conversion.service.interface";
